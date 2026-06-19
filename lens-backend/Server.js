// ─── LENS BACKEND SERVER (COMPLETE WITH LOCATION & SCHOOL) ────────────────
// All features: Auth, Upload, Search, Admin, Schools, Filters

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── UPLOAD DIRECTORY ─────────────────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || "./uploads/pdfs";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`✓ Created upload directory: ${uploadDir}`);
}

app.use("/uploads", express.static("uploads"));

// ─── MULTER CONFIG ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `paper-${uniqueSuffix}.pdf`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf" || file.originalname.endsWith(".pdf")) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ─── DATABASE ─────────────────────────────────────────────────────────────
let db;
const client = new MongoClient(process.env.DATABASE_URL || "mongodb://localhost:27017");

async function connectDB() {
  try {
    await client.connect();
    db = client.db("lens");
    console.log("✓ Connected to MongoDB");

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (!collectionNames.includes("users")) {
      await db.createCollection("users");
    }
    if (!collectionNames.includes("researchpapers")) {
      await db.createCollection("researchpapers");
    }
    if (!collectionNames.includes("downloads")) {
      await db.createCollection("downloads");
    }
    if (!collectionNames.includes("auditlogs")) {
      await db.createCollection("auditlogs");
    }
    if (!collectionNames.includes("schools")) {
      await db.createCollection("schools");
    }
    if (!collectionNames.includes("searchlogs")) {
      await db.createCollection("searchlogs");
    }

    await createIndexes();
    console.log("✓ Database indexes created");
  } catch (e) {
    console.error("Database connection failed:", e);
    process.exit(1);
  }
}

async function createIndexes() {
  try {
    await db.collection("users").createIndex({ email: 1 }, { unique: true }).catch(() => {});
    await db.collection("researchpapers").createIndex(
      { title: "text", abstract: "text", keywords: "text", tags: "text" }
    ).catch(() => {});
    await db.collection("researchpapers").createIndex({ university: 1 }).catch(() => {});
    await db.collection("researchpapers").createIndex({ school: 1 }).catch(() => {});
    await db.collection("researchpapers").createIndex({ region: 1 }).catch(() => {});
    await db.collection("researchpapers").createIndex({ city: 1 }).catch(() => {});
    await db.collection("researchpapers").createIndex({ category: 1 }).catch(() => {});
    await db.collection("researchpapers").createIndex({ field: 1 }).catch(() => {});
    await db.collection("researchpapers").createIndex({ year: 1 }).catch(() => {});
    await db.collection("researchpapers").createIndex({ status: 1 }).catch(() => {});
    await db.collection("researchpapers").createIndex({ createdAt: -1 }).catch(() => {});
    await db.collection("researchpapers").createIndex({ uploadedBy: 1 }).catch(() => {});
    await db.collection("downloads").createIndex({ paperId: 1 }).catch(() => {});
    await db.collection("downloads").createIndex({ downloadedAt: -1 }).catch(() => {});
    await db.collection("auditlogs").createIndex({ action: 1 }).catch(() => {});
    await db.collection("auditlogs").createIndex({ timestamp: -1 }).catch(() => {});
    await db.collection("schools").createIndex({ name: 1 }, { unique: true }).catch(() => {});
    await db.collection("searchlogs").createIndex({ timestamp: -1 }).catch(() => {});
    await db.collection("searchlogs").createIndex({ term: 1 }).catch(() => {});
  } catch (e) {
    console.error("Error creating indexes:", e.message);
  }
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET || "dev-secret-key", (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// ─── AUTH: REGISTER ───────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, role = "researcher" } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      name,
      role: ["researcher", "student", "university_rep"].includes(role) ? role : "researcher",
      university: req.body.university || null,
      createdAt: new Date(),
      verified: false,
      suspended: false,
      loginAttempts: 0,
      lastLogin: null,
    });

    const token = jwt.sign(
      { userId: result.insertedId.toString(), email, name, role },
      process.env.JWT_SECRET || "dev-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: result.insertedId, email, name, role }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ─── AUTH: LOGIN ──────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.suspended) {
      return res.status(403).json({ error: "Account suspended" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      await db.collection("users").updateOne(
        { _id: user._id },
        { $inc: { loginAttempts: 1 } }
      );
      if (user.loginAttempts >= 5) {
        await db.collection("users").updateOne(
          { _id: user._id },
          { $set: { suspended: true } }
        );
        return res.status(403).json({ error: "Account locked" });
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { loginAttempts: 0, lastLogin: new Date() } }
    );

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || "dev-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

// ─── PAPERS: UPLOAD ───────────────────────────────────────────────────────
app.post("/api/papers", authenticateToken, upload.single("pdf"), async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("User:", req.user);
    console.log("File:", req.file ? req.file.filename : "NO FILE");

    const { title, abstract, authors, school, region, city, category, year } = req.body;

    if (!title || !abstract || !authors || !school || !region || !city || !category) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    const authorsArray = Array.isArray(authors)
      ? authors
      : String(authors).split(",").map(a => a.trim()).filter(a => a);

    let tagsArray = [];
    if (req.body.tags) {
      tagsArray = typeof req.body.tags === "string"
        ? req.body.tags.split(",").map(t => t.trim()).filter(t => t)
        : Array.isArray(req.body.tags) ? req.body.tags : [];
    }

    const metadata = {
      title: String(title).trim(),
      abstract: String(abstract).trim(),
      authors: authorsArray,
      keywords: tagsArray,
      tags: tagsArray,
      school: String(school).trim(),
      region: String(region).trim(),
      city: String(city).trim(),
      university: String(school).trim(),
      category: String(category).trim(),
      field: req.body.field ? String(req.body.field).trim() : String(category).trim(),
      subfield: req.body.subfield ? String(req.body.subfield).trim() : null,
      researchType: req.body.researchType ? String(req.body.researchType).trim() : "Research Paper",
      department: req.body.department ? String(req.body.department).trim() : null,
      college: req.body.college ? String(req.body.college).trim() : null,
      year: parseInt(year) || new Date().getFullYear(),
      publishedDate: new Date(),
      pdfFile: req.file.filename,
      pdfOriginalName: req.file.originalname,
      pdfSize: req.file.size,
      pdfUrl: `/uploads/pdfs/${req.file.filename}`,
      pdfMimeType: req.file.mimetype,
      status: "pending",
      rejectionReason: null,
      views: 0,
      downloads: 0,
      citations: 0,
      bookmarks: 0,
      uploadedBy: String(req.user.userId),
      uploaderName: String(req.user.name),
      uploaderEmail: String(req.user.email),
      createdAt: new Date(),
      updatedAt: new Date(),
      uploadedAt: new Date()
    };

    console.log("Metadata created successfully");

    const result = await db.collection("researchpapers").insertOne(metadata);

    console.log(`✓ Paper inserted with ID: ${result.insertedId}`);

    await db.collection("auditlogs").insertOne({
      action: "paper_uploaded",
      userId: String(req.user.userId),
      userName: req.user.name,
      paperId: String(result.insertedId),
      details: { title, school, region, city, category },
      timestamp: new Date(),
      ipAddress: req.ip,
    });

    res.status(201).json({
      id: result.insertedId,
      message: "Paper uploaded successfully and is pending review",
      metadata: metadata
    });

  } catch (e) {
    console.error("Upload error:", e);

    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }

    res.status(500).json({ error: "Upload failed: " + e.message });
  }
});

// ─── PAPERS: GET ALL ──────────────────────────────────────────────────────
app.get("/api/papers", async (req, res) => {
  try {
    const { page = 1, limit = 20, category, year, university, field, search } = req.query;

    let filter = { status: "approved" };

    if (category) filter.category = category;
    if (year) filter.year = parseInt(year);
    if (university) filter.university = university;
    if (field) filter.field = field;

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const papers = await db.collection("researchpapers")
      .find(filter)
      .sort(search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection("researchpapers").countDocuments(filter);

    res.json({
      papers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch papers" });
  }
});

// ─── PAPERS: GET BY ID ────────────────────────────────────────────────────
app.get("/api/papers/:id", async (req, res) => {
  try {
    const paper = await db.collection("researchpapers").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!paper) return res.status(404).json({ error: "Paper not found" });

    await db.collection("researchpapers").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $inc: { views: 1 } }
    );

    res.json(paper);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch paper" });
  }
});

// ─── PAPERS: DOWNLOAD ────────────────────────────────────────────────────
app.post("/api/papers/:id/download", async (req, res) => {
  try {
    const paper = await db.collection("researchpapers").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!paper) {
      return res.status(404).json({ error: "Paper not found" });
    }

    const pdfPath = path.join(uploadDir, paper.pdfFile);

    if (!fs.existsSync(pdfPath)) {
      console.error(`File not found: ${pdfPath}`);
      return res.status(404).json({ error: "PDF file not found on server" });
    }

    await db.collection("downloads").insertOne({
      paperId: new ObjectId(req.params.id),
      paperTitle: paper.title,
      downloadedBy: req.user?.userId || "anonymous",
      downloadedAt: new Date(),
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    });

    await db.collection("researchpapers").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $inc: { downloads: 1 } }
    );

    res.download(pdfPath, paper.pdfOriginalName, (err) => {
      if (err) {
        console.error("Download error:", err);
      } else {
        console.log(`✓ Downloaded: ${paper.title}`);
      }
    });

  } catch (e) {
    console.error("Download error:", e);
    res.status(500).json({ error: "Download failed" });
  }
});

// ─── SEARCH: STOP WORDS (Issue #4) ─────────────────────────────────────────
// Common filler words that should not dominate search relevance.
// If a query contains ONLY stop words, we fall back to using them as-is
// so the search does not silently return zero results.
const STOP_WORDS = new Set([
  "a", "an", "the", "of", "in", "on", "at", "to", "for", "and", "or",
  "is", "are", "was", "were", "be", "been", "being", "with", "by",
  "from", "as", "that", "this", "it", "its", "into", "about", "than",
  "then", "so", "if", "but", "not", "no", "do", "does", "did", "has",
  "have", "had", "will", "would", "can", "could", "should", "may",
  "might", "must", "i", "you", "he", "she", "we", "they"
]);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── SEARCH: LOCAL (WITH LOCATION, SCHOOL, YEAR & CATEGORY FILTERS) ────────
app.get("/api/search/local", async (req, res) => {
  const { q, page = 1, limit = 10, region, city, school, yearFrom, yearTo, category } = req.query;

  try {
    if (!q || q.length < 2) {
      return res.json({ results: [], total: 0, query: q });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    console.log(`[SEARCH] Query: "${q}" | Region: ${region} | City: ${city} | School: ${school} | Year: ${yearFrom}-${yearTo} | Category: ${category}`);

    // Issue #7: lightweight search term logging — term + timestamp only, no user/IP data.
    // Fire-and-forget so a logging failure never affects the search response.
    db.collection("searchlogs").insertOne({ term: q.trim(), timestamp: new Date() }).catch(() => {});

    // Issue #4 fix: split into words, separate meaningful words from stop words.
    // Meaningful words are required to match (AND). Stop words are ignored unless
    // the entire query is made of stop words, in which case we fall back to them
    // so the search still returns something rather than nothing.
    const allWords = q.trim().split(/\s+/).filter(Boolean);
    const meaningfulWords = allWords.filter(w => !STOP_WORDS.has(w.toLowerCase()) && w.length > 1);
    const searchWords = meaningfulWords.length > 0 ? meaningfulWords : allWords;

    // Issue #4 fix: word-boundary regex instead of bare substring regex.
    // This prevents "in" from matching inside "engineering" / "education" / etc.
    const wordRegexes = searchWords.map(word => new RegExp(`\\b${escapeRegex(word)}`, "i"));

    const searchableFields = ["title", "abstract", "authors", "keywords", "tags", "school", "category", "field", "department"];

    // Issue #4 fix: every meaningful word must match in at least one field (AND across words).
    // This is what makes "corner engineering" rank papers with BOTH terms instead of
    // returning anything that has either term.
    const wordConditions = wordRegexes.map(regex => ({
      $or: searchableFields.map(field => ({ [field]: regex }))
    }));

    const filter = {
      status: "approved",
      $and: wordConditions
    };

    if (region && region !== "all") {
      filter.region = region;
    }
    if (city && city !== "all") {
      filter.city = new RegExp(city, "i");
    }
    if (school && school !== "all") {
      filter.school = new RegExp(school, "i");
    }
    // Issue #5: category/field filter, additive, uses existing stored field
    if (category && category !== "all") {
      filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
    }
    // Publication year range filter
    if (yearFrom || yearTo) {
      filter.year = {};
      if (yearFrom) filter.year.$gte = parseInt(yearFrom);
      if (yearTo) filter.year.$lte = parseInt(yearTo);
    }

    let results = await db.collection("researchpapers")
      .find(filter)
      .sort({ uploadedAt: -1 })
      .limit(500)
      .toArray();

    // Issue #4 fix: relevance ranking. Count how many distinct meaningful
    // words match the TITLE specifically (highest weight), then how many
    // searchable fields overall contain a match. Papers matching more
    // search terms, especially in the title, rank highest.
    const scored = results.map(paper => {
      let score = 0;
      for (const regex of wordRegexes) {
        if (regex.test(paper.title || "")) score += 3;
        if (regex.test(paper.abstract || "")) score += 1;
        if ((paper.keywords || []).some(k => regex.test(k))) score += 2;
        if ((paper.tags || []).some(t => regex.test(t))) score += 2;
        if (regex.test(paper.category || "")) score += 1;
        if (regex.test(paper.field || "")) score += 1;
      }
      return { paper, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const total = scored.length;
    const paginated = scored.slice(skip, skip + parseInt(limit)).map(s => s.paper);

    console.log(`[SEARCH] Found ${total} results`);

    res.json({ results: paginated, total, query: q });

  } catch (e) {
    console.error("Search error:", e);
    res.status(500).json({ error: "Search failed", query: q });
  }
});

// ─── SCHOOLS: GET ALL ─────────────────────────────────────────────────────
app.get("/api/schools", async (req, res) => {
  try {
    const schools = await db.collection("schools")
      .find({})
      .sort({ name: 1 })
      .toArray();

    res.json(schools.map(s => s.name));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch schools" });
  }
});

// ─── SCHOOLS: CREATE NEW ──────────────────────────────────────────────────
app.post("/api/schools", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.length < 2) {
      return res.status(400).json({ error: "Invalid school name" });
    }

    const existing = await db.collection("schools").findOne({ name: name.trim() });
    if (existing) {
      return res.json({ name: existing.name, message: "School already exists" });
    }

    const result = await db.collection("schools").insertOne({
      name: name.trim(),
      createdAt: new Date()
    });

    console.log(`✓ New school added: ${name}`);

    res.status(201).json({
      id: result.insertedId,
      name: name.trim()
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create school" });
  }
});

// ─── CATEGORIES: GET ALL (Issue #5) ────────────────────────────────────────
// Returns the distinct set of categories already stored on papers, so the
// frontend filter dropdown always matches real data — no separate category
// management system, no duplicated source of truth.
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await db.collection("researchpapers")
      .distinct("category", { status: "approved" });

    res.json(categories.filter(Boolean).sort());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ─── ADMIN: STATS ────────────────────────────────────────────────────────
app.get("/api/admin/stats", authenticateToken, requireRole(["admin", "owner"]), async (req, res) => {
  try {
    // Enhanced Overview: month boundary for "this month" counters
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      totalPapers: await db.collection("researchpapers").countDocuments(),
      approvedPapers: await db.collection("researchpapers").countDocuments({ status: "approved" }),
      pendingPapers: await db.collection("researchpapers").countDocuments({ status: "pending" }),
      rejectedPapers: await db.collection("researchpapers").countDocuments({ status: "rejected" }),
      totalDownloads: await db.collection("downloads").countDocuments(),
      totalUsers: await db.collection("users").countDocuments(),
      totalUniversities: (await db.collection("researchpapers").distinct("school")).length,
      suspendedUsers: await db.collection("users").countDocuments({ suspended: true }),
      papersThisMonth: await db.collection("researchpapers").countDocuments({ createdAt: { $gte: startOfMonth } }),
      downloadsThisMonth: await db.collection("downloads").countDocuments({ downloadedAt: { $gte: startOfMonth } }),
    };

    res.json(stats);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ─── ADMIN: PENDING PAPERS ──────────────────────────────────────────────
app.get("/api/admin/pending-papers", authenticateToken, requireRole(["admin", "owner"]), async (req, res) => {
  try {
    const papers = await db.collection("researchpapers")
      .find({ status: "pending" })
      .sort({ createdAt: 1 })
      .toArray();

    res.json(papers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch pending papers" });
  }
});

// ─── ADMIN: UPDATE PAPER STATUS ────────────────────────────────────────
app.put("/api/admin/papers/:id/status", authenticateToken, requireRole(["admin", "owner"]), async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const paper = await db.collection("researchpapers").findOne({
      _id: new ObjectId(req.params.id)
    });
    if (!paper) return res.status(404).json({ error: "Paper not found" });

    await db.collection("researchpapers").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date(), rejectionReason: reason || null } }
    );

    await db.collection("auditlogs").insertOne({
      action: `paper_${status}`,
      userId: String(req.user.userId),
      userName: req.user.name,
      paperId: String(req.params.id),
      details: { title: paper.title, reason },
      timestamp: new Date(),
      ipAddress: req.ip,
    });

    res.json({ message: `Paper ${status} successfully` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Update failed" });
  }
});

// ─── ADMIN: ANALYTICS (Issues #4, #5, #6 on dashboard plan) ──────────────
// Upload trend, download trend, user growth (last 6 months), category
// breakdown, and top uploading institutions. Uses only existing fields
// (createdAt, downloadedAt, category, school) — no schema changes.
app.get("/api/admin/analytics", authenticateToken, requireRole(["admin", "owner"]), async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    // Build the list of the last 6 month buckets so charts always show 6
    // points even for months with zero activity.
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: monthKey(d), label: d.toLocaleString("default", { month: "short" }) });
    }

    const uploads = await db.collection("researchpapers")
      .find({ createdAt: { $gte: sixMonthsAgo } }, { projection: { createdAt: 1 } })
      .toArray();
    const uploadCounts = {};
    uploads.forEach(p => {
      const k = monthKey(new Date(p.createdAt));
      uploadCounts[k] = (uploadCounts[k] || 0) + 1;
    });

    const downloadDocs = await db.collection("downloads")
      .find({ downloadedAt: { $gte: sixMonthsAgo } }, { projection: { downloadedAt: 1 } })
      .toArray();
    const downloadCounts = {};
    downloadDocs.forEach(d => {
      const k = monthKey(new Date(d.downloadedAt));
      downloadCounts[k] = (downloadCounts[k] || 0) + 1;
    });

    const userDocs = await db.collection("users")
      .find({ createdAt: { $gte: sixMonthsAgo } }, { projection: { createdAt: 1 } })
      .toArray();
    const userCounts = {};
    userDocs.forEach(u => {
      const k = monthKey(new Date(u.createdAt));
      userCounts[k] = (userCounts[k] || 0) + 1;
    });

    const uploadTrend = months.map(m => ({ month: m.label, count: uploadCounts[m.key] || 0 }));
    const downloadTrend = months.map(m => ({ month: m.label, count: downloadCounts[m.key] || 0 }));
    const userGrowth = months.map(m => ({ month: m.label, count: userCounts[m.key] || 0 }));

    // Category breakdown (approved papers only, mirrors public-facing data)
    const categoryAgg = await db.collection("researchpapers").aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    const categoryStats = categoryAgg.map(c => ({ category: c._id || "Uncategorized", count: c.count }));

    // Top uploading institutions
    const schoolAgg = await db.collection("researchpapers").aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$school", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    const institutionStats = schoolAgg.map(s => ({ school: s._id || "Unknown", count: s.count }));

    res.json({ uploadTrend, downloadTrend, userGrowth, categoryStats, institutionStats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ─── ADMIN: SEARCH ANALYTICS (Issue #7) ───────────────────────────────────
// Most searched terms, aggregated from the lightweight searchlogs collection.
app.get("/api/admin/search-analytics", authenticateToken, requireRole(["admin", "owner"]), async (req, res) => {
  try {
    const topTerms = await db.collection("searchlogs").aggregate([
      { $group: { _id: { $toLower: "$term" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    res.json({ topTerms: topTerms.map(t => ({ term: t._id, count: t.count })) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch search analytics" });
  }
});


app.get("/api/admin/users", authenticateToken, requireRole(["admin", "owner"]), async (req, res) => {
  try {
    const users = await db.collection("users")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ─── ADMIN: AUDIT LOGS ────────────────────────────────────────────────
app.get("/api/admin/audit-logs", authenticateToken, requireRole(["admin", "owner"]), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", action } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};
    if (action) filter.action = action;
    if (search) {
      filter["details.title"] = new RegExp(search.trim(), "i");
    }

    const logs = await db.collection("auditlogs")
      .find(filter, { projection: { userId: 0, paperId: 0, ipAddress: 0 } })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Security: never expose Mongo IDs or IPs. Older logs predating the
    // userName field fall back to "unknown" rather than leaking the ID.
    const safeLogs = logs.map(log => ({
      ...log,
      userName: log.userName || "unknown"
    }));

    const total = await db.collection("auditlogs").countDocuments(filter);

    res.json({
      logs: safeLogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// ─── ERROR HANDLING ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ─── START SERVER ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n✓ LENS Backend running on http://localhost:${PORT}`);
    console.log(`📡 API Base: http://localhost:${PORT}/api`);
    console.log(`📁 Uploads: ${uploadDir}`);
    console.log(`\nDemo: owner@lens.edu.ph / OwnerPassword123!\n`);
  });
}

start().catch(e => {
  console.error("Failed to start:", e);
  process.exit(1);
});

module.exports = app;