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

// ─── SEARCH: LOCAL (WITH LOCATION & SCHOOL FILTERS) ────────────────────────
app.get("/api/search/local", async (req, res) => {
  try {
    const { q, page = 1, limit = 10, region, city, school, yearFrom, yearTo } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ results: [], total: 0, query: q });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    console.log(`[SEARCH] Query: "${q}" | Region: ${region} | City: ${city} | School: ${school} | yearFrom: ${yearFrom} | yearTo: ${yearTo}`);
    
    const words = q.trim().split(/\s+/);
    const regexPatterns = words.map(word => new RegExp(word, "i"));
    
    const filter = {
      $or: [
        { title: { $in: regexPatterns } },
        { abstract: { $in: regexPatterns } },
        { authors: { $in: regexPatterns } },
        { keywords: { $in: regexPatterns } },
        { tags: { $in: regexPatterns } },
        { school: { $in: regexPatterns } },
        { category: { $in: regexPatterns } },
        { field: { $in: regexPatterns } },
        { department: { $in: regexPatterns } }
      ]
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
    // ✅ FIX Issue 3: apply year range filter if provided
    if (yearFrom || yearTo) {
      filter.year = {};
      if (yearFrom) filter.year.$gte = parseInt(yearFrom);
      if (yearTo) filter.year.$lte = parseInt(yearTo);
    }
    
    const results = await db.collection("researchpapers")
      .find(filter)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    const total = await db.collection("researchpapers").countDocuments(filter);
    
    console.log(`[SEARCH] Found ${results.length} results`);
    
    res.json({ results, total, query: q });

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

// ─── ADMIN: STATS ────────────────────────────────────────────────────────
app.get("/api/admin/stats", authenticateToken, requireRole(["admin", "owner"]), async (req, res) => {
  try {
    const stats = {
      totalPapers: await db.collection("researchpapers").countDocuments(),
      approvedPapers: await db.collection("researchpapers").countDocuments({ status: "approved" }),
      pendingPapers: await db.collection("researchpapers").countDocuments({ status: "pending" }),
      rejectedPapers: await db.collection("researchpapers").countDocuments({ status: "rejected" }),
      totalDownloads: await db.collection("downloads").countDocuments(),
      totalUsers: await db.collection("users").countDocuments(),
      totalUniversities: (await db.collection("researchpapers").distinct("school")).length,
      suspendedUsers: await db.collection("users").countDocuments({ suspended: true }),
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

// ─── ADMIN: GET USERS ──────────────────────────────────────────────────
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
    const logs = await db.collection("auditlogs")
      .find({})
      .sort({ timestamp: -1 })
      .limit(500)
      .toArray();
    
    res.json(logs);
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