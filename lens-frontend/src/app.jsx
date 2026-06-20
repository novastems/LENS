import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://lens-v1kf.onrender.com/api";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #0a1628; --navy-mid: #12224a; --navy-light: #1e3a6e;
    --gold: #c9a84c; --gold-light: #e8c97a;
    --cream: #f7f4ef; --cream-mid: #ede8df; --sand: #d4c9b0;
    --slate: #4a5568; --slate-light: #718096;
    --white: #ffffff; --red-soft: #c0392b; --green-soft: #27ae60;
    --border: rgba(10,22,40,0.12); --border-gold: rgba(201,168,76,0.3);
    --shadow-sm: 0 1px 3px rgba(10,22,40,0.08);
    --shadow-md: 0 4px 12px rgba(10,22,40,0.1);
    --shadow-lg: 0 12px 32px rgba(10,22,40,0.14);
    --radius: 8px; --radius-lg: 14px; --transition: 0.18s ease;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  body { background: var(--cream); color: var(--navy); min-height: 100vh; }
  h1, h2, h3, h4 { font-family: 'Playfair Display', Georgia, serif; }

  .nav { background: var(--navy); border-bottom: 1px solid rgba(201,168,76,0.2); position: sticky; top: 0; z-index: 100; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 60px; }
  .nav-logo { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 600; color: var(--white); cursor: pointer; letter-spacing: 0; display: flex; align-items: center; gap: 0.6rem; transition: var(--transition); }
  .nav-logo svg { width: 32px; height: 32px; color: var(--gold); transition: var(--transition); }
  .nav-logo:hover { opacity: 0.9; }
  .nav-logo:hover svg { transform: scale(1.08); }
  .nav-links { display: flex; align-items: center; gap: 0.5rem; }
  .nav-link { color: rgba(255,255,255,0.7); font-size: 0.875rem; padding: 0.4rem 0.75rem; border-radius: var(--radius); cursor: pointer; transition: var(--transition); border: none; background: none; font-family: 'DM Sans', sans-serif; }
  .nav-link:hover { color: var(--white); background: rgba(255,255,255,0.08); }
  .nav-link.active { color: var(--gold); }
  .nav-actions { display: flex; align-items: center; gap: 0.75rem; }
  .nav-user-name { color: rgba(255,255,255,0.7); font-size: 0.8rem; padding: 0 0.5rem; }
  .btn-nav { padding: 0.4rem 0.9rem; border-radius: var(--radius); font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: var(--transition); font-family: 'DM Sans', sans-serif; border: 1px solid transparent; white-space: nowrap; }
  .btn-nav-outline { border-color: rgba(201,168,76,0.4); color: var(--gold-light); background: transparent; }
  .btn-nav-outline:hover { border-color: var(--gold); background: rgba(201,168,76,0.1); }
  .btn-nav-solid { background: var(--gold); color: var(--navy); border-color: var(--gold); font-weight: 600; }
  .btn-nav-solid:hover { background: var(--gold-light); }

  .hero { background: var(--navy); background-image: radial-gradient(ellipse at 20% 50%, rgba(30,58,110,0.8) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(201,168,76,0.08) 0%, transparent 50%); padding: 5rem 2rem 4rem; text-align: center; }
  .hero-eyebrow { display: inline-block; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); border: 1px solid var(--border-gold); padding: 0.3rem 1rem; border-radius: 100px; margin-bottom: 1.5rem; background: rgba(201,168,76,0.08); }
  .hero h1 { font-size: clamp(2.2rem, 5vw, 3.5rem); font-weight: 600; color: var(--white); line-height: 1.15; margin-bottom: 1rem; }
  .hero-sub { font-size: 1.05rem; color: rgba(255,255,255,0.65); max-width: 560px; margin: 0 auto 2.5rem; line-height: 1.65; }

  .search-bar-wrap { max-width: 680px; margin: 0 auto; background: rgba(255,255,255,0.06); border: 1px solid rgba(201,168,76,0.2); border-radius: 12px; padding: 0.5rem; display: flex; gap: 0.5rem; backdrop-filter: blur(4px); }
  .search-bar-wrap input { flex: 1; background: transparent; border: none; outline: none; color: var(--white); font-size: 1rem; font-family: 'DM Sans', sans-serif; padding: 0.5rem 0.75rem; }
  .search-bar-wrap input::placeholder { color: rgba(255,255,255,0.35); }
  .btn-search { background: var(--gold); color: var(--navy); border: none; padding: 0.6rem 1.5rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: var(--transition); font-family: 'DM Sans', sans-serif; }
  .btn-search:hover { background: var(--gold-light); }

  .main { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }

  .paper-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1rem; cursor: pointer; transition: box-shadow var(--transition), transform var(--transition); }
  .paper-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); border-color: rgba(10,22,40,0.2); }
  .paper-source-badge { display: inline-flex; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; padding: 0.2rem 0.55rem; border-radius: 100px; margin-bottom: 0.75rem; }
  .badge-local { background: rgba(10,22,40,0.08); color: var(--navy); }
  .paper-card h3 { font-size: 1.05rem; font-weight: 600; color: var(--navy); line-height: 1.35; margin-bottom: 0.5rem; }
  .paper-meta { font-size: 0.8rem; color: var(--slate-light); margin-bottom: 0.65rem; display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .paper-abstract { font-size: 0.875rem; color: var(--slate); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0.85rem; }
  .paper-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .tag-pill { font-size: 0.72rem; padding: 0.2rem 0.55rem; background: var(--cream); border: 1px solid var(--cream-mid); border-radius: 100px; color: var(--slate); }

  .detail-wrap { max-width: 900px; margin: 0 auto; padding: 2rem; }
  .detail-back { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: var(--slate-light); cursor: pointer; margin-bottom: 1.5rem; border: none; background: none; font-family: 'DM Sans', sans-serif; transition: var(--transition); }
  .detail-back:hover { color: var(--navy); }
  .detail-header { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 2rem; margin-bottom: 1.5rem; }
  .detail-header h1 { font-size: 1.6rem; font-weight: 600; color: var(--navy); line-height: 1.3; margin-bottom: 1rem; }
  .detail-meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
  .detail-meta-item label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--slate-light); display: block; margin-bottom: 0.25rem; }
  .detail-meta-item span { font-size: 0.9rem; color: var(--navy); font-weight: 500; }
  .detail-abstract { background: var(--cream); border-radius: var(--radius); padding: 1.25rem; font-size: 0.9rem; line-height: 1.7; color: var(--slate); }
  .detail-section { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1rem; }
  .detail-section h2 { font-size: 1rem; font-weight: 600; color: var(--navy); margin-bottom: 0.75rem; font-family: 'DM Sans', sans-serif; }
  .pdf-download-btn { display: flex; align-items: center; gap: 0.75rem; background: var(--navy); color: var(--white); border: none; border-radius: var(--radius); padding: 0.9rem 1.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: var(--transition); width: 100%; justify-content: center; text-decoration: none; }
  .pdf-download-btn:hover { background: var(--navy-light); }
  .btn-action { display: flex; align-items: center; gap: 0.75rem; background: transparent; color: var(--navy); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.9rem 1.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: var(--transition); }
  .btn-action:hover { background: var(--cream); border-color: var(--navy); }

  .form-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 2rem; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .form-group { margin-bottom: 1rem; }
  .form-group label { font-size: 0.8rem; font-weight: 500; color: var(--slate); display: block; margin-bottom: 0.35rem; }
  .form-group label span { color: var(--red-soft); }
  .form-input { width: 100%; padding: 0.55rem 0.85rem; border-radius: var(--radius); border: 1px solid var(--border); background: var(--cream); font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: var(--navy); transition: var(--transition); }
  .form-input:focus { outline: none; border-color: var(--navy); background: var(--white); box-shadow: 0 0 0 2px rgba(10,22,40,0.06); }
  .form-input::placeholder { color: var(--slate-light); }
  .form-textarea { min-height: 100px; resize: vertical; }
  .form-select { appearance: auto; cursor: pointer; }

  .upload-zone { border: 2px dashed var(--border); border-radius: var(--radius-lg); padding: 2rem; text-align: center; cursor: pointer; transition: var(--transition); background: var(--cream); }
  .upload-zone:hover { border-color: var(--navy); background: var(--cream-mid); }
  .upload-zone p { font-size: 0.85rem; color: var(--slate-light); }

  .admin-layout { display: grid; grid-template-columns: 220px 1fr; gap: 0; min-height: calc(100vh - 60px); }
  .admin-sidebar { background: var(--navy); padding: 1.5rem 1rem; border-right: 1px solid rgba(201,168,76,0.15); }
  .admin-sidebar-title { font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(201,168,76,0.6); margin-bottom: 0.75rem; padding: 0 0.5rem; }
  .admin-nav-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0.75rem; border-radius: var(--radius); cursor: pointer; color: rgba(255,255,255,0.65); font-size: 0.85rem; transition: var(--transition); margin-bottom: 0.15rem; border: none; background: none; font-family: 'DM Sans', sans-serif; width: 100%; text-align: left; }
  .admin-nav-item:hover { background: rgba(255,255,255,0.07); color: var(--white); }
  .admin-nav-item.active { background: rgba(201,168,76,0.15); color: var(--gold-light); }
  .admin-content { background: var(--cream); padding: 2rem; overflow-y: auto; }
  .admin-header { margin-bottom: 1.75rem; }
  .admin-header h1 { font-size: 1.4rem; color: var(--navy); }
  .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
  .metric-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; border-left: 3px solid var(--gold); }
  .metric-card .label { font-size: 0.75rem; color: var(--slate-light); text-transform: uppercase; margin-bottom: 0.35rem; }
  .metric-card .value { font-family: 'Playfair Display', serif; font-size: 1.9rem; color: var(--navy); font-weight: 600; }

  /* Admin dashboard enhancement additions — reuse existing tokens, no redesign */
  .metric-card.metric-card-secondary { border-left-color: var(--slate-light); }
  .chart-panel { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1.5rem; }
  .chart-panel h3 { font-size: 0.95rem; font-weight: 600; color: var(--navy); margin-bottom: 1rem; font-family: 'DM Sans', sans-serif; }
  .chart-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .bar-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.6rem; }
  .bar-row .bar-label { font-size: 0.8rem; color: var(--slate); width: 130px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar-row .bar-track { flex: 1; background: var(--cream-mid); border-radius: 100px; height: 10px; overflow: hidden; }
  .bar-row .bar-fill { background: var(--gold); height: 100%; border-radius: 100px; transition: width 0.6s ease; }
  .bar-row .bar-value { font-size: 0.78rem; color: var(--navy); font-weight: 600; width: 36px; text-align: right; flex-shrink: 0; }
  .history-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
  .reject-reason-select { width: 100%; padding: 0.5rem 0.7rem; border-radius: var(--radius); border: 1px solid var(--border); background: var(--cream); font-family: 'DM Sans', sans-serif; font-size: 0.82rem; color: var(--navy); margin-top: 0.5rem; }
  .pagination-row { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1.25rem; }
  .pagination-row span { font-size: 0.82rem; color: var(--slate-light); }
  .data-table { width: 100%; border-collapse: collapse; background: var(--white); border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border); }
  .data-table th { background: var(--cream); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--slate-light); padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); }
  .data-table td { padding: 0.85rem 1rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); color: var(--navy); }

  .modal-overlay { position: fixed; inset: 0; background: rgba(10,22,40,0.55); backdrop-filter: blur(2px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
  .modal { background: var(--white); border-radius: var(--radius-lg); padding: 2rem; max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
  .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
  .modal-close { background: none; border: none; cursor: pointer; font-size: 1.3rem; color: var(--slate-light); padding: 0.2rem; }

  .checkbox-group { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 1rem; }
  .checkbox-group input[type="checkbox"] { margin-top: 0.3rem; cursor: pointer; }
  .checkbox-group label { font-size: 0.8rem; color: var(--slate); cursor: pointer; line-height: 1.4; }

  .loading-wrap { padding: 4rem; text-align: center; color: var(--slate-light); }
  .spinner { width: 36px; height: 36px; border: 2px solid var(--cream-mid); border-top-color: var(--navy); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 1rem; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .toast { position: fixed; bottom: 2rem; right: 2rem; z-index: 999; background: var(--navy); color: var(--white); padding: 0.85rem 1.25rem; border-radius: var(--radius-lg); font-size: 0.875rem; box-shadow: var(--shadow-lg); animation: slideUp 0.25s ease; border-left: 3px solid var(--gold); max-width: 320px; }
  @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } }

  .empty-state { padding: 4rem 2rem; text-align: center; }
  .empty-state h3 { font-size: 1.1rem; color: var(--navy); margin-bottom: 0.5rem; }
  .empty-state p { font-size: 0.875rem; color: var(--slate-light); }

  .section-head { margin-bottom: 1.5rem; }
  .section-head h2 { font-size: 1.4rem; color: var(--navy); }
  .section-head p { font-size: 0.85rem; color: var(--slate-light); margin-top: 0.2rem; }

  .content-block { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 2rem; margin-bottom: 1.5rem; line-height: 1.7; }
  .content-block h2 { font-size: 1.2rem; color: var(--navy); margin-bottom: 1rem; }
  .content-block p { font-size: 0.95rem; color: var(--slate); margin-bottom: 1rem; }
  .content-block p:last-child { margin-bottom: 0; }

  .footer { background: var(--navy-mid); color: rgba(255,255,255,0.45); padding: 2rem; text-align: center; font-size: 0.8rem; border-top: 1px solid rgba(201,168,76,0.1); }
  .footer strong { color: var(--gold); }
  .footer-copyright { margin-top: 0.75rem; font-size: 0.75rem; }

  .btn-sm { font-size: 0.78rem; padding: 0.3rem 0.75rem; border-radius: var(--radius); cursor: pointer; transition: var(--transition); font-family: 'DM Sans', sans-serif; font-weight: 500; border: 1px solid transparent; }
  .btn-primary { background: var(--navy); color: var(--white); }
  .btn-primary:hover { background: var(--navy-light); }
  .btn-outline { background: transparent; border-color: var(--border); color: var(--slate); }
  .btn-outline:hover { border-color: var(--navy); color: var(--navy); }

  @media (max-width: 768px) {
    .metric-grid { grid-template-columns: repeat(2, 1fr); }
    .form-grid { grid-template-columns: 1fr; }
    .admin-layout { grid-template-columns: 1fr; }
    .admin-sidebar { display: none; }
    .hero h1 { font-size: 1.8rem; }
    .nav-links { display: none; }
    .nav-user-name { display: none; }
    .nav-logo { font-size: 1.2rem; }
    .nav-logo svg { width: 24px; height: 24px; }
  }
`;

const api = {
  register: (email, password, name, role) =>
    fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role })
    }).then(r => r.json()),

  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),

  getPapers: (page = 1, filters = {}) => {
    const params = new URLSearchParams({ page, limit: 20, ...filters });
    return fetch(`${API_BASE}/papers?${params}`).then(r => r.json());
  },

  getPaper: (id) =>
    fetch(`${API_BASE}/papers/${id}`).then(r => r.json()),

  uploadPaper: (formData, token) =>
    fetch(`${API_BASE}/papers`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    }).then(r => r.json()),

  downloadPaper: (id, token) =>
    fetch(`${API_BASE}/papers/${id}/download`, {
      method: "POST",
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    }).then(r => r.json()),

  searchLocal: (q, page = 1, region = "", city = "", school = "") =>
    fetch(`${API_BASE}/search/local?q=${encodeURIComponent(q)}&page=${page}&region=${encodeURIComponent(region)}&city=${encodeURIComponent(city)}&school=${encodeURIComponent(school)}`).then(r => r.json()),

  getAdminStats: (token) =>
    fetch(`${API_BASE}/admin/stats`, { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),

  getPendingPapers: (token) =>
    fetch(`${API_BASE}/admin/pending-papers`, { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),

  updatePaperStatus: (id, status, reason, token) =>
    fetch(`${API_BASE}/admin/papers/${id}/status`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason })
    }).then(r => r.json()),

  getUsers: (token) =>
    fetch(`${API_BASE}/admin/users`, { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),

  getAuditLogs: (token, page = 1, search = "", action = "") =>
    fetch(`${API_BASE}/admin/audit-logs?page=${page}&limit=20&search=${encodeURIComponent(search)}&action=${encodeURIComponent(action)}`, { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),

  getAnalytics: (token) =>
    fetch(`${API_BASE}/admin/analytics`, { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),

  getSearchAnalytics: (token) =>
    fetch(`${API_BASE}/admin/search-analytics`, { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),

  forgotPassword: (email) =>
    fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    }).then(r => r.json()),

  resetPassword: (id, token, newPassword) =>
    fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, token, newPassword })
    }).then(r => r.json()),
};

function LensLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ color: "var(--gold)" }}>
      <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="8"/>
      <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.6"/>
      <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.4"/>
      <circle cx="100" cy="100" r="35" fill="currentColor" opacity="0.8"/>
      <circle cx="90" cy="85" r="12" fill="currentColor" opacity="0.3"/>
    </svg>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="toast">{message}</div>;
}

function PaperCard({ paper, onClick }) {
  return (
    <div className="paper-card" onClick={() => onClick(paper)}>
      <span className="paper-source-badge badge-local">LENS Repository</span>
      <h3>{paper.title}</h3>
      <div className="paper-meta">
        <span>{(paper.authors || []).slice(0, 2).join(", ")}</span>
        {paper.school && <><span>·</span><span>{paper.school}</span></>}
        {paper.city && <><span>·</span><span>{paper.city}</span></>}
        {paper.region && <><span>·</span><span>{paper.region}</span></>}
        {paper.year && <><span>·</span><span>{paper.year}</span></>}
      </div>
      <p className="paper-abstract">{paper.abstract}</p>
      <div className="paper-tags">
        {(paper.tags || []).slice(0, 3).map(t => (
          <span key={t} className="tag-pill">{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Issue #5: categories list (matches upload form exactly) ──────────────
const categories = [
  "all",
  "Medicine",
  "Engineering",
  "Computer Science",
  "Education",
  "Business",
  "Psychology",
];
// ─────────────────────────────────────────────────────────────────────────

function SearchPage({ onViewPaper, onSearchStateChange, initialQuery = "" }) {
  const [inputVal, setInputVal] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [region, setRegion] = useState("all");
  const [city, setCity] = useState("");
  const [school, setSchool] = useState("all");
  const [schools, setSchools] = useState([]);
  // Issue #3: year range state
  const [yearRange, setYearRange] = useState("all");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  // Issue #5: category filter state
  const [category, setCategory] = useState("all");
  const debounceTimer = useRef(null);
  const hasExecutedInitialSearch = useRef(false);

  const regions = [
    "all",
    "NCR",
    "Region I – Ilocos Region",
    "Region II – Cagayan Valley",
    "Region III – Central Luzon",
    "Region IV-A – CALABARZON",
    "Region IV-B – MIMAROPA",
    "Region V – Bicol Region",
    "Region VI – Western Visayas",
    "Region VII – Central Visayas",
    "Region VIII – Eastern Visayas",
    "Region IX – Zamboanga Peninsula",
    "Region X – Northern Mindanao",
    "Region XI – Davao Region",
    "Region XII – SOCCSKSARGEN",
    "Region XIII – Caraga",
    "BARMM"
  ];

  useEffect(() => {
    fetch(`${API_BASE}/schools`)
      .then(r => r.json())
      .then(data => setSchools(["all", ...data]))
      .catch(e => console.error("Failed to load schools:", e));
  }, []);

  // ✅ Execute initial search if query is passed from homepage
  useEffect(() => {
    if (initialQuery && !hasExecutedInitialSearch.current) {
      hasExecutedInitialSearch.current = true;
      doSearch(initialQuery, "all", "", "all", "all", "", "", "all");
    }
  }, [initialQuery]);

  // Issue #3: compute yearFrom/yearTo from preset range
  const resolveYearParams = (range, customFrom, customTo) => {
    const currentYear = new Date().getFullYear();
    if (range === "5") return { from: currentYear - 5, to: currentYear };
    if (range === "10") return { from: currentYear - 10, to: currentYear };
    if (range === "15") return { from: currentYear - 15, to: currentYear };
    if (range === "20") return { from: currentYear - 20, to: currentYear };
    if (range === "custom") return { from: customFrom || "", to: customTo || "" };
    return { from: "", to: "" };
  };

  const doSearch = useCallback(async (q, selectedRegion, selectedCity, selectedSchool, selectedYearRange, selectedYearFrom, selectedYearTo, selectedCategory) => {
    if (!q || q.length < 2) {
      setResults([]);
      setSearched(false);
      onSearchStateChange({
        inputVal: q,
        results: [],
        region: selectedRegion,
        city: selectedCity,
        school: selectedSchool,
        searched: false
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const regionParam = selectedRegion === "all" ? "" : selectedRegion;
      const schoolParam = selectedSchool === "all" ? "" : selectedSchool;
      const categoryParam = selectedCategory === "all" ? "" : selectedCategory;

      // Issue #3: build year params
      const { from, to } = resolveYearParams(selectedYearRange, selectedYearFrom, selectedYearTo);
      const yearFromParam = from ? `&yearFrom=${from}` : "";
      const yearToParam = to ? `&yearTo=${to}` : "";

      // Issue #5: build category param
      const categoryQuery = categoryParam ? `&category=${encodeURIComponent(categoryParam)}` : "";

      const response = await fetch(
        `${API_BASE}/search/local?q=${encodeURIComponent(q)}&region=${encodeURIComponent(regionParam)}&city=${encodeURIComponent(selectedCity)}&school=${encodeURIComponent(schoolParam)}${yearFromParam}${yearToParam}${categoryQuery}`
      );
      const data = await response.json();
      setResults(data.results || []);

      onSearchStateChange({
        inputVal: q,
        results: data.results || [],
        region: selectedRegion,
        city: selectedCity,
        school: selectedSchool,
        searched: true
      });
    } catch (e) {
      console.error("Search error:", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [onSearchStateChange]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputVal(value);

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      doSearch(value, region, city, school, yearRange, yearFrom, yearTo, category);
    }, 300);
  };

  const handleFilterChange = (newRegion, newCity, newSchool) => {
    setRegion(newRegion);
    setCity(newCity);
    setSchool(newSchool);
    doSearch(inputVal, newRegion, newCity, newSchool, yearRange, yearFrom, yearTo, category);
  };

  // Issue #3: year range filter handler
  const handleYearRangeChange = (newRange) => {
    setYearRange(newRange);
    if (newRange !== "custom") {
      setYearFrom("");
      setYearTo("");
    }
    doSearch(inputVal, region, city, school, newRange, "", "", category);
  };

  const handleCustomYearSearch = () => {
    doSearch(inputVal, region, city, school, "custom", yearFrom, yearTo, category);
  };

  // Issue #5: category filter handler
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    doSearch(inputVal, region, city, school, yearRange, yearFrom, yearTo, newCategory);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      doSearch(inputVal, region, city, school, yearRange, yearFrom, yearTo, category);
    }
  };

  const hasActiveFilters = region !== "all" || city || school !== "all" || yearRange !== "all" || category !== "all";

  return (
    <div className="main">
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="search-bar-wrap" style={{ background: "var(--white)", border: "1px solid var(--border)", marginBottom: "1rem" }}>
          <input
            value={inputVal}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Search LENS Repository papers..."
            style={{ color: "var(--navy)", background: "transparent" }}
          />
          <button className="btn-search" onClick={() => doSearch(inputVal, region, city, school, yearRange, yearFrom, yearTo, category)}>Search</button>
        </div>

        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.75rem", color: "var(--navy)" }}>Filters</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.35rem", color: "var(--slate)" }}>Region</label>
              <select className="form-input form-select" value={region} onChange={e => handleFilterChange(e.target.value, city, school)}>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.35rem", color: "var(--slate)" }}>City</label>
              <input className="form-input" placeholder="Enter city name" value={city} onChange={e => handleFilterChange(region, e.target.value, school)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.35rem", color: "var(--slate)" }}>School</label>
              <select className="form-input form-select" value={school} onChange={e => handleFilterChange(region, city, e.target.value)}>
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* Issue #3: Publication Year filter */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.35rem", color: "var(--slate)" }}>Publication Year</label>
              <select className="form-input form-select" value={yearRange} onChange={e => handleYearRangeChange(e.target.value)}>
                <option value="all">All years</option>
                <option value="5">Last 5 years</option>
                <option value="10">Last 10 years</option>
                <option value="15">Last 15 years</option>
                <option value="20">Last 20 years</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            {/* Issue #5: Category / Course filter */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.35rem", color: "var(--slate)" }}>Course / Field</label>
              <select className="form-input form-select" value={category} onChange={e => handleCategoryChange(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c === "all" ? "All fields" : c}</option>)}
              </select>
            </div>
          </div>

          {/* Issue #3: Custom year range inputs */}
          {yearRange === "custom" && (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", marginTop: "0.75rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.35rem", color: "var(--slate)" }}>From year</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="e.g. 2010"
                  min="1990"
                  max={new Date().getFullYear()}
                  value={yearFrom}
                  onChange={e => setYearFrom(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.35rem", color: "var(--slate)" }}>To year</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="e.g. 2024"
                  min="1990"
                  max={new Date().getFullYear()}
                  value={yearTo}
                  onChange={e => setYearTo(e.target.value)}
                />
              </div>
              <button className="btn-sm btn-primary" style={{ marginBottom: "0.05rem" }} onClick={handleCustomYearSearch}>
                Apply
              </button>
            </div>
          )}

          {hasActiveFilters && (
            <button className="btn-sm btn-outline" style={{ marginTop: "0.75rem" }} onClick={() => {
              setRegion("all");
              setCity("");
              setSchool("all");
              setYearRange("all");
              setYearFrom("");
              setYearTo("");
              setCategory("all");
              doSearch(inputVal, "all", "", "all", "all", "", "", "all");
            }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {!searched && !loading && (
        <div className="empty-state">
          <h3>Search Research Papers</h3>
          <p>Search the LENS Repository for papers from partner institutions.</p>
        </div>
      )}

      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <p>Searching LENS Repository...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <h3>No papers found</h3>
          <p>Try different keywords or adjust filters.</p>
        </div>
      )}

      {!loading && searched && results.length > 0 && (
        <>
          <div style={{ marginBottom: "1.5rem" }}>
            <strong>Found {results.length} paper{results.length !== 1 ? "s" : ""}</strong>
          </div>
          {results.map((p, i) => (
            <PaperCard key={i} paper={p} onClick={onViewPaper} />
          ))}
        </>
      )}
    </div>
  );
}

function PaperDetail({ paper, onBack, showToast }) {
  const handleDownload = async () => {
    try {
      const token = localStorage.getItem("auth_token");

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${API_BASE}/papers/${paper._id}/download`;

      if (token) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', form.action, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.responseType = 'blob';

        xhr.onload = function() {
          if (xhr.status === 200) {
            const url = window.URL.createObjectURL(xhr.response);
            const a = document.createElement('a');
            a.href = url;
            a.download = paper.pdfOriginalName || 'paper.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast("Download complete");
          } else {
            showToast("Download failed");
          }
        };

        xhr.onerror = function() {
          showToast("Download failed");
        };

        xhr.send();
      } else {
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        showToast("Download started");
      }
    } catch (e) {
      console.error("Download error:", e);
      showToast("Download failed");
    }
  };

  // ✅ Issue #1 fix: copy the hash-based paper URL so it opens directly
  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#/paper/${paper._id}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast("Link copied successfully");
    }).catch(e => {
      console.error("Copy failed:", e);
      showToast("Failed to copy link");
    });
  };

  return (
    <div className="detail-wrap">
      <button className="detail-back" onClick={onBack}>Back to results</button>

      <div className="detail-header">
        <span className="paper-source-badge badge-local">LENS Repository</span>
        <h1>{paper.title}</h1>

        <div className="detail-meta-grid">
          <div className="detail-meta-item">
            <label>Authors</label>
            <span>{(paper.authors || []).join(", ") || "Unknown"}</span>
          </div>
          {paper.school && (
            <div className="detail-meta-item">
              <label>School</label>
              <span>{paper.school}</span>
            </div>
          )}
          {paper.city && (
            <div className="detail-meta-item">
              <label>City</label>
              <span>{paper.city}</span>
            </div>
          )}
          {paper.region && (
            <div className="detail-meta-item">
              <label>Region</label>
              <span>{paper.region}</span>
            </div>
          )}
          <div className="detail-meta-item">
            <label>Year</label>
            <span>{paper.year}</span>
          </div>
          <div className="detail-meta-item">
            <label>Downloads</label>
            <span>{paper.downloads || 0}</span>
          </div>
        </div>

        {paper.tags?.length > 0 && (
          <div className="paper-tags" style={{ marginBottom: "1.25rem" }}>
            {paper.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
          </div>
        )}

        <div className="detail-abstract">
          <strong style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", textTransform: "uppercase", color: "var(--slate-light)" }}>Abstract</strong>
          {paper.abstract}
        </div>
      </div>

      <div className="detail-section">
        <h2>Access Paper</h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button className="pdf-download-btn" onClick={handleDownload} style={{ flex: 1 }}>
            Download PDF
          </button>
          <button className="btn-action" onClick={handleShare} style={{ flex: 1 }}>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadPage({ user, showToast, onNavigate }) {
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    authors: "",
    school: "",
    newSchool: "",
    region: "",
    city: "",
    category: "",
    year: new Date().getFullYear()
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [schools, setSchools] = useState([]);
  const [showNewSchool, setShowNewSchool] = useState(false);

  const regions = [
    "NCR",
    "Region I – Ilocos Region",
    "Region II – Cagayan Valley",
    "Region III – Central Luzon",
    "Region IV-A – CALABARZON",
    "Region IV-B – MIMAROPA",
    "Region V – Bicol Region",
    "Region VI – Western Visayas",
    "Region VII – Central Visayas",
    "Region VIII – Eastern Visayas",
    "Region IX – Zamboanga Peninsula",
    "Region X – Northern Mindanao",
    "Region XI – Davao Region",
    "Region XII – SOCCSKSARGEN",
    "Region XIII – Caraga",
    "BARMM"
  ];

  useEffect(() => {
    fetch(`${API_BASE}/schools`)
      .then(r => r.json())
      .then(data => setSchools(data))
      .catch(e => console.error("Failed to load schools:", e));
  }, []);

  const handleAddNewSchool = async () => {
    if (!form.newSchool.trim()) {
      showToast("Enter school name");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/schools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.newSchool.trim() })
      });

      const result = await response.json();
      if (response.ok) {
        setSchools([...schools, result.name]);
        setForm({ ...form, school: result.name, newSchool: "" });
        setShowNewSchool(false);
        showToast("School added");
      } else {
        showToast("Error: " + result.error);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to add school");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedSchool = showNewSchool ? form.newSchool : form.school;

    if (!form.title || !form.abstract || !form.category || !selectedSchool || !form.region || !form.city || !file) {
      showToast("Please fill all fields");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("abstract", form.abstract);
      formData.append("authors", form.authors);
      formData.append("school", selectedSchool);
      formData.append("university", selectedSchool);
      formData.append("region", form.region);
      formData.append("city", form.city);
      formData.append("category", form.category);
      formData.append("year", form.year);
      formData.append("pdf", file);

      const result = await api.uploadPaper(formData, user.token);
      if (result.id) {
        showToast("Paper uploaded successfully");
        setTimeout(() => onNavigate("home"), 2000);
      } else {
        showToast("Upload failed");
      }
    } catch (e) {
      console.error(e);
      showToast("Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="main" style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center" }}>
        <h2>Sign in to upload</h2>
      </div>
    );
  }

  return (
    <div className="main" style={{ maxWidth: 760 }}>
      <div className="section-head">
        <h2>Submit Research Paper</h2>
      </div>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title <span>*</span></label>
          <input className="form-input" placeholder="Research title" required
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Authors <span>*</span></label>
            <input className="form-input" placeholder="Comma-separated" required
              value={form.authors} onChange={e => setForm({ ...form, authors: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Region <span>*</span></label>
            <select className="form-input form-select" required value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}>
              <option value="">Select region</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>City / Municipality <span>*</span></label>
            <input className="form-input" placeholder="e.g. Davao City" required
              value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="form-group">
            <label>School <span>*</span></label>
            {!showNewSchool ? (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select className="form-input form-select" style={{ flex: 1 }} value={form.school} onChange={e => setForm({ ...form, school: e.target.value })}>
                  <option value="">Select school</option>
                  {schools.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button type="button" className="btn-sm btn-outline" style={{ padding: "0.4rem 0.8rem", whiteSpace: "nowrap" }} onClick={() => setShowNewSchool(true)}>
                  Add New
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input className="form-input" placeholder="Enter school name" style={{ flex: 1 }}
                  value={form.newSchool} onChange={e => setForm({ ...form, newSchool: e.target.value })} />
                <button type="button" className="btn-sm btn-primary" style={{ padding: "0.4rem 0.8rem", whiteSpace: "nowrap" }} onClick={handleAddNewSchool}>
                  Save
                </button>
                <button type="button" className="btn-sm btn-outline" style={{ padding: "0.4rem 0.8rem", whiteSpace: "nowrap" }} onClick={() => {
                  setShowNewSchool(false);
                  setForm({ ...form, newSchool: "" });
                }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Abstract <span>*</span></label>
          <textarea className="form-input form-textarea" placeholder="Research summary" required
            value={form.abstract} onChange={e => setForm({ ...form, abstract: e.target.value })} />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Category <span>*</span></label>
            <select className="form-input form-select" required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              <option>Medicine</option>
              <option>Engineering</option>
              <option>Computer Science</option>
              <option>Education</option>
              <option>Business</option>
              <option>Psychology</option>
            </select>
          </div>
          <div className="form-group">
            <label>Year <span>*</span></label>
            <input className="form-input" type="number" min="1990" max="2025" required
              value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
          </div>
        </div>

        <div className="form-group">
          <label>PDF File <span>*</span></label>
          <div className="upload-zone" onClick={() => document.getElementById("file-input").click()}>
            <p>{file ? file.name : "Click to upload PDF"}</p>
          </div>
          <input id="file-input" type="file" accept=".pdf" style={{ display: "none" }}
            onChange={e => setFile(e.target.files?.[0])} />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button type="button" className="btn-sm btn-outline" onClick={() => onNavigate("home")}>Cancel</button>
          <button type="submit" className="btn-sm btn-primary" disabled={submitting}>
            {submitting ? "Uploading..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CountUp({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value || 0;
    if (end === 0) { setDisplay(0); return; }
    const duration = 600;
    const stepTime = 16;
    const steps = Math.ceil(duration / stepTime);
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

function AdminDashboard({ user, showToast }) {
  const [page, setPage] = useState("overview");
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  // History page state — additive
  const [historyTab, setHistoryTab] = useState("approved");
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historySearch, setHistorySearch] = useState("");
  // Analytics page state — additive
  const [analytics, setAnalytics] = useState(null);
  const [searchAnalytics, setSearchAnalytics] = useState(null);
  // Audit Logs page state — additive
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  // Reject flow state — additive
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("Duplicate paper");

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [s, p] = await Promise.all([
        api.getAdminStats(user.token),
        api.getPendingPapers(user.token)
      ]);
      setStats(s);
      setPending(p || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.updatePaperStatus(id, "approved", "", user.token);
      showToast("Paper approved");
      loadData();
    } catch (e) {
      showToast("Error");
    }
  };

  // New: reject flow, mirrors handleApprove, does not modify it
  const handleReject = async (id) => {
    try {
      await api.updatePaperStatus(id, "rejected", rejectReason, user.token);
      showToast("Paper rejected");
      setRejectingId(null);
      loadData();
    } catch (e) {
      showToast("Error");
    }
  };

  // New: load History page data when that tab/page/search changes
  useEffect(() => {
    if (page !== "history") return;
    const action = historyTab === "approved" ? "paper_approved" : "paper_rejected";
    api.getAuditLogs(user.token, historyPage, historySearch, action)
      .then(result => {
        setHistoryLogs(result.logs || []);
        setHistoryTotalPages(result.pagination?.pages || 1);
      })
      .catch(e => console.error("Failed to load history:", e));
  }, [page, historyTab, historyPage, historySearch, user]);

  // New: load Analytics page data once when that tab is opened
  useEffect(() => {
    if (page !== "analytics") return;
    api.getAnalytics(user.token).then(setAnalytics).catch(e => console.error("Failed to load analytics:", e));
    api.getSearchAnalytics(user.token).then(setSearchAnalytics).catch(e => console.error("Failed to load search analytics:", e));
  }, [page, user]);

  // New: load Audit Logs page data when that page changes
  useEffect(() => {
    if (page !== "auditlogs") return;
    api.getAuditLogs(user.token, auditPage)
      .then(result => {
        setAuditLogs(result.logs || []);
        setAuditTotalPages(result.pagination?.pages || 1);
      })
      .catch(e => console.error("Failed to load audit logs:", e));
  }, [page, auditPage, user]);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  const sidebarItems = [
    { key: "overview", label: "Overview" },
    { key: "submissions", label: "Submissions" },
    { key: "history", label: "History" },
    { key: "analytics", label: "Analytics" },
    { key: "auditlogs", label: "Audit Logs" },
  ];

  const maxOf = (arr) => Math.max(...arr.map(x => x.count), 1);

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-sidebar-title">Admin</div>
        {sidebarItems.map(item => (
          <button key={item.key} className={`admin-nav-item ${page === item.key ? "active" : ""}`}
            onClick={() => setPage(item.key)}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {page === "overview" && stats && (
          <>
            <div className="admin-header"><h1>Overview</h1></div>
            <div className="metric-grid">
              <div className="metric-card"><div className="label">Papers</div><div className="value"><CountUp value={stats.totalPapers || 0} /></div></div>
              <div className="metric-card"><div className="label">Downloads</div><div className="value"><CountUp value={stats.totalDownloads || 0} /></div></div>
              <div className="metric-card"><div className="label">Users</div><div className="value"><CountUp value={stats.totalUsers || 0} /></div></div>
              <div className="metric-card"><div className="label">Pending</div><div className="value"><CountUp value={stats.pendingPapers || 0} /></div></div>
              <div className="metric-card metric-card-secondary"><div className="label">Approved</div><div className="value"><CountUp value={stats.approvedPapers || 0} /></div></div>
              <div className="metric-card metric-card-secondary"><div className="label">Rejected</div><div className="value"><CountUp value={stats.rejectedPapers || 0} /></div></div>
              <div className="metric-card metric-card-secondary"><div className="label">Papers This Month</div><div className="value"><CountUp value={stats.papersThisMonth || 0} /></div></div>
              <div className="metric-card metric-card-secondary"><div className="label">Downloads This Month</div><div className="value"><CountUp value={stats.downloadsThisMonth || 0} /></div></div>
            </div>
          </>
        )}

        {page === "submissions" && (
          <>
            <div className="admin-header"><h1>Pending Papers</h1></div>
            {pending.length === 0 ? (
              <div className="empty-state"><p>No pending papers</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Title</th><th>School</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {pending.map(p => (
                    <tr key={p._id}>
                      <td>{p.title}</td>
                      <td>{p.school}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <button className="btn-sm btn-primary" onClick={() => handleApprove(p._id)}>Approve</button>
                          <button className="btn-sm btn-outline" onClick={() => setRejectingId(rejectingId === p._id ? null : p._id)}>Reject</button>
                        </div>
                        {rejectingId === p._id && (
                          <div style={{ marginTop: "0.5rem", minWidth: "220px" }}>
                            <select className="reject-reason-select" value={rejectReason} onChange={e => setRejectReason(e.target.value)}>
                              <option>Duplicate paper</option>
                              <option>Corrupted PDF</option>
                              <option>Wrong category</option>
                              <option>Incomplete document</option>
                              <option>Other</option>
                            </select>
                            <button className="btn-sm btn-primary" style={{ marginTop: "0.5rem" }} onClick={() => handleReject(p._id)}>
                              Confirm Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {page === "history" && (
          <>
            <div className="admin-header"><h1>Approval History</h1></div>

            <div className="history-tabs">
              <button className={`btn-sm ${historyTab === "approved" ? "btn-primary" : "btn-outline"}`}
                onClick={() => { setHistoryTab("approved"); setHistoryPage(1); }}>
                Approved
              </button>
              <button className={`btn-sm ${historyTab === "rejected" ? "btn-primary" : "btn-outline"}`}
                onClick={() => { setHistoryTab("rejected"); setHistoryPage(1); }}>
                Rejected
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <input
                className="form-input"
                style={{ maxWidth: 320 }}
                placeholder="Search by paper title..."
                value={historySearch}
                onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
              />
            </div>

            {historyLogs.length === 0 ? (
              <div className="empty-state"><p>No {historyTab} papers yet</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Paper</th>
                    {historyTab === "rejected" && <th>Reason</th>}
                    <th>Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLogs.map((log, i) => (
                    <tr key={i}>
                      <td>{new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td>{log.details?.title || "—"}</td>
                      {historyTab === "rejected" && <td>{log.details?.reason || "—"}</td>}
                      <td>{log.userName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="pagination-row">
              <button className="btn-sm btn-outline" disabled={historyPage <= 1}
                onClick={() => setHistoryPage(p => p - 1)}>Previous</button>
              <span>Page {historyPage} of {historyTotalPages}</span>
              <button className="btn-sm btn-outline" disabled={historyPage >= historyTotalPages}
                onClick={() => setHistoryPage(p => p + 1)}>Next</button>
            </div>
          </>
        )}

        {page === "analytics" && analytics && (
          <>
            <div className="admin-header"><h1>Analytics</h1></div>

            <div className="chart-grid-2">
              <div className="chart-panel">
                <h3>Upload Trend (last 6 months)</h3>
                {analytics.uploadTrend.map((m, i) => (
                  <div className="bar-row" key={i}>
                    <span className="bar-label">{m.month}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.min(100, (m.count / maxOf(analytics.uploadTrend)) * 100)}%` }} />
                    </div>
                    <span className="bar-value">{m.count}</span>
                  </div>
                ))}
              </div>

              <div className="chart-panel">
                <h3>Download Trend (last 6 months)</h3>
                {analytics.downloadTrend.map((m, i) => (
                  <div className="bar-row" key={i}>
                    <span className="bar-label">{m.month}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.min(100, (m.count / maxOf(analytics.downloadTrend)) * 100)}%` }} />
                    </div>
                    <span className="bar-value">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-panel">
              <h3>User Growth (last 6 months)</h3>
              {analytics.userGrowth.map((m, i) => (
                <div className="bar-row" key={i}>
                  <span className="bar-label">{m.month}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.min(100, (m.count / maxOf(analytics.userGrowth)) * 100)}%` }} />
                  </div>
                  <span className="bar-value">{m.count}</span>
                </div>
              ))}
            </div>

            <div className="chart-grid-2">
              <div className="chart-panel">
                <h3>Papers by Course / Field</h3>
                <table className="data-table">
                  <thead><tr><th>Category</th><th>Papers</th></tr></thead>
                  <tbody>
                    {analytics.categoryStats.map((c, i) => (
                      <tr key={i}><td>{c.category}</td><td>{c.count}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="chart-panel">
                <h3>Top Uploading Schools</h3>
                {analytics.institutionStats.map((s, i) => (
                  <div className="bar-row" key={i}>
                    <span className="bar-label">{s.school}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.min(100, (s.count / maxOf(analytics.institutionStats)) * 100)}%` }} />
                    </div>
                    <span className="bar-value">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {searchAnalytics && (
              <div className="chart-panel">
                <h3>Most Searched Terms</h3>
                {searchAnalytics.topTerms.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--slate-light)" }}>No search activity yet</p>
                ) : (
                  searchAnalytics.topTerms.map((t, i) => (
                    <div className="bar-row" key={i}>
                      <span className="bar-label">{t.term}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${Math.min(100, (t.count / maxOf(searchAnalytics.topTerms)) * 100)}%` }} />
                      </div>
                      <span className="bar-value">{t.count}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {page === "auditlogs" && (
          <>
            <div className="admin-header"><h1>Audit Logs</h1></div>

            {auditLogs.length === 0 ? (
              <div className="empty-state"><p>No audit log entries</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Time</th><th>Action</th><th>User</th></tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, i) => (
                    <tr key={i}>
                      <td>{new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                      <td>{log.action}</td>
                      <td>{log.userName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="pagination-row">
              <button className="btn-sm btn-outline" disabled={auditPage <= 1}
                onClick={() => setAuditPage(p => p - 1)}>Previous</button>
              <span>Page {auditPage} of {auditTotalPages}</span>
              <button className="btn-sm btn-outline" disabled={auditPage >= auditTotalPages}
                onClick={() => setAuditPage(p => p + 1)}>Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HomePage({ onNavigate, onViewPaper }) {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    api.getPapers(1, {}).then(data => {
      setFeatured(data.papers?.slice(0, 4) || []);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      onNavigate("search", searchInput);
    }
  };

  return (
    <div>
      <div className="hero">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <LensLogo size={48} />
        </div>
        <div className="hero-eyebrow">Think fast, Search faster.</div>
        <h1>Discover Student Research</h1>
        <p className="hero-sub">Centralized academic repository for student and faculty research.</p>

        <div className="search-bar-wrap" style={{ marginTop: "2rem" }}>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            placeholder="Search papers..."
            style={{ color: "var(--white)", background: "transparent" }}
          />
          <button className="btn-search" onClick={handleSearch}>Search</button>
        </div>
      </div>

      <div className="main">
        <div className="section-head">
          <h2>Featured Papers</h2>
        </div>
        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
          </div>
        ) : featured.length > 0 ? (
          featured.map(p => <PaperCard key={p._id} paper={p} onClick={onViewPaper} />)
        ) : (
          <div className="empty-state"><p>Implementing this Soon!</p></div>
        )}
      </div>

      <div className="footer">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <LensLogo size={16} />
          <strong>LENS</strong>
        </div>
        <div>LENS · Version 1.0</div>
        <div className="footer-copyright">Nova-Forge Systems © 2023</div>
      </div>
    </div>
  );
}

// ✅ NEW: About LENS page
function AboutPage() {
  return (
    <div>
      <div className="hero" style={{ paddingBottom: "3rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <LensLogo size={48} />
        </div>
        <h1>About LENS</h1>
      </div>

      <div className="main">
        <div className="content-block">
          <h2>Our Mission</h2>
          <p>We understand how difficult and time-consuming it can be to find local research papers, theses, capstone projects, and academic studies. Many students spend hours or even days searching through different sources just to find relevant local research.</p>
          <p>LENS was created to reduce that difficulty and make academic research more accessible. Our goal is to help students, researchers, and educators discover relevant research more efficiently.</p>
          <p>We hope to make local knowledge easier to find, preserve, and share.</p>
        </div>

        <div className="content-block">
          <h2>What is LENS?</h2>
          <p>LENS is a centralized academic repository designed to bring together research from educational institutions across the Philippines. Instead of searching multiple sources and databases, students and researchers can now find local academic work in one unified platform.</p>
          <p>Whether you're looking for groundbreaking research, student capstone projects, theses, or scholarly articles, LENS makes it easy to discover the work you need.</p>
        </div>

        <div className="content-block">
          <h2>Our Values</h2>
          <p><strong>Accessibility:</strong> Academic research should be easy to find and open to everyone who seeks knowledge.</p>
          <p><strong>Preservation:</strong> Local research deserves to be preserved and recognized for its value to the academic community.</p>
          <p><strong>Collaboration:</strong> We believe in making knowledge shareable and collaborative, fostering connections between researchers, students, and educators.</p>
          <p><strong>Efficiency:</strong> We save researchers and students valuable time by centralizing local academic resources in one place.</p>
        </div>

        <div className="content-block" style={{ textAlign: "center", fontStyle: "italic", color: "var(--slate-light)" }}>
          <p>Built to make research easier to discover, share, and learn from.</p>
        </div>
      </div>

      <div className="footer">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <LensLogo size={16} />
          <strong>LENS</strong>
        </div>
        <div>Local Educational Network Search · Version 1.0</div>
        <div className="footer-copyright">Forge Systems © 2023</div>
      </div>
    </div>
  );
}

function TermsPage() {
  return (
    <div>
      <div className="hero" style={{ paddingBottom: "3rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <LensLogo size={48} />
        </div>
        <h1>Terms and Conditions</h1>
      </div>

      <div className="main" style={{ maxWidth: "900px" }}>
        <div style={{ marginBottom: "2rem", fontSize: "0.85rem", color: "var(--slate-light)" }}>
          <p>Version 1.0 | Last Updated: January 2025</p>
        </div>

        <div className="content-block">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using LENS, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use this platform.</p>
        </div>

        <div className="content-block">
          <h2>2. Platform Purpose</h2>
          <p>LENS is an academic repository and research discovery platform designed to serve as a citation and indexing platform for research intelligence. The platform facilitates the discovery, sharing, and organization of academic research from educational institutions.</p>
        </div>

        <div className="content-block">
          <h2>3. User Responsibilities</h2>
          <p>Users agree to use LENS only for lawful purposes. You are responsible for maintaining the confidentiality of your account information and for all activity that occurs under your account. You agree not to upload, distribute, or otherwise make available content that is illegal, harmful, defamatory, or violates intellectual property rights.</p>
        </div>

        <div className="content-block">
          <h2>4. Intellectual Property</h2>
          <p>Users retain ownership of research papers and content they upload. By uploading content, users grant LENS a non-exclusive license to host, store, index, display, process, and enable discovery of the content.</p>
        </div>

        <div className="content-block">
          <h2>5. Platform Rights</h2>
          <p>LENS reserves the right to remove content that violates these terms or applicable laws. LENS may modify, suspend, or discontinue the platform at any time.</p>
        </div>

        <div className="content-block">
          <h2>6. Metadata and Platform Intelligence</h2>
          <p>LENS may process, analyze, and use aggregated metadata and non-personal information about research content for platform improvements, analytics, and research intelligence purposes.</p>
        </div>

        <div className="content-block">
          <h2>7. Commercial Use of Non-Personal Information</h2>
          <p>LENS may use aggregated, non-personal data about research trends, citation patterns, and academic topics for internal analytics and platform development. This does not include personal information as defined in our Privacy Policy.</p>
        </div>

        <div className="content-block">
          <h2>8. Personal Information Commitment</h2>
          <p><strong>NovaForge Systems does not sell personal information.</strong> Personal data collected from users is used only for account management, platform functionality, and compliance purposes as detailed in our Privacy Policy.</p>
        </div>

        <div className="content-block">
          <h2>9. Limitation of Liability</h2>
          <p>LENS is provided "as is" without warranties of any kind. LENS is not liable for any damages, losses, or claims arising from your use of the platform, including but not limited to loss of data, service interruption, or unauthorized access to your account.</p>
        </div>

        <div className="content-block">
          <h2>10. Governing Law</h2>
          <p>These Terms and Conditions are governed by the laws of the Republic of the Philippines.</p>
        </div>

        <div className="content-block">
          <h2>11. Changes to Terms</h2>
          <p>LENS reserves the right to modify these terms at any time. Continued use of the platform constitutes acceptance of updated terms. Users will be notified of significant changes.</p>
        </div>

        <div className="content-block">
          <h2>12. Contact Information</h2>
          <p>For questions regarding these Terms and Conditions, please contact NovaForge Systems through systemsnovaforge@gmail.com.</p>
        </div>
      </div>

      <div className="footer">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <LensLogo size={16} />
          <strong>LENS</strong>
        </div>
        <div>Local Educational Network Search · Version 1.0</div>
        <div className="footer-copyright">Forge Systems © 2023</div>
      </div>
    </div>
  );
}

// Feature: Forgot Password — reset password page, reached via the emailed link
function ResetPasswordPage({ resetParams, onNavigate, showToast }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      showToast("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.resetPassword(resetParams.id, resetParams.token, newPassword);
      if (result.message) {
        setDone(true);
        showToast(result.message);
      } else {
        showToast(result.error || "Failed to reset password");
      }
    } catch (e) {
      showToast("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="hero" style={{ paddingBottom: "3rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <LensLogo size={48} />
        </div>
        <h1>Reset Password</h1>
      </div>

      <div className="main" style={{ maxWidth: 480 }}>
        <div className="form-card">
          {done ? (
            <>
              <p style={{ fontSize: "0.9rem", color: "var(--slate)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <button className="btn-sm btn-primary" style={{ width: "100%", padding: "0.7rem" }}
                onClick={() => { window.location.hash = ""; onNavigate("home"); }}>
                Go to LENS
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: "0.85rem", color: "var(--slate)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                Enter a new password for your account. This reset link expires 1 hour after it was requested.
              </p>
              <div className="form-group">
                <label>New Password <span>*</span></label>
                <input className="form-input" type="password" placeholder="8+ characters" required
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Confirm Password <span>*</span></label>
                <input className="form-input" type="password" placeholder="Re-enter password" required
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn-sm btn-primary" style={{ width: "100%", padding: "0.7rem" }} disabled={submitting}>
                {submitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="footer">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <LensLogo size={16} />
          <strong>LENS</strong>
        </div>
        <div>Local Educational Network Search · Version 1.0</div>
        <div className="footer-copyright">Forge Systems © 2023</div>
      </div>
    </div>
  );
}

function PrivacyPage() {
  return (
    <div>
      <div className="hero" style={{ paddingBottom: "3rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <LensLogo size={48} />
        </div>
        <h1>Privacy Policy</h1>
      </div>

      <div className="main" style={{ maxWidth: "900px" }}>
        <div style={{ marginBottom: "2rem", fontSize: "0.85rem", color: "var(--slate-light)" }}>
          <p>Version 1.0 | Last Updated: January 2025</p>
          <p>This Privacy Policy complies with Republic Act No. 10173 (Data Privacy Act of 2012) and National Privacy Commission regulations.</p>
        </div>

        <div className="content-block">
          <h2>1. Information Collected</h2>

          <h3 style={{ fontSize: "0.95rem", marginTop: "1rem", marginBottom: "0.5rem" }}>Account Information</h3>
          <p>When you register, we collect your name, email address, and password.</p>

          <h3 style={{ fontSize: "0.95rem", marginTop: "1rem", marginBottom: "0.5rem" }}>Research Information</h3>
          <p>When you upload research papers, we collect metadata including title, authors, abstract, keywords, institution, and publication year.</p>

          <h3 style={{ fontSize: "0.95rem", marginTop: "1rem", marginBottom: "0.5rem" }}>Technical Information</h3>
          <p>We automatically collect information about your device, browser, IP address, and how you interact with the platform.</p>

          <h3 style={{ fontSize: "0.95rem", marginTop: "1rem", marginBottom: "0.5rem" }}>Usage Information</h3>
          <p>We track searches, downloads, views, and other interactions with research papers.</p>
        </div>

        <div className="content-block">
          <h2>2. How Information Is Used</h2>
          <p>Your information is used to provide platform functionality, authenticate accounts, enable research discovery, and improve the LENS experience.</p>
        </div>

        <div className="content-block">
          <h2>3. Metadata and Analytics</h2>
          <p>We use aggregated, non-personal metadata for platform analytics, research trend identification, and academic intelligence.</p>
        </div>

        <div className="content-block">
          <h2>4. Commercial Use of Aggregated Information</h2>
          <p>Non-personal, aggregated data about research trends and usage patterns may be analyzed internally for platform improvement. This information is never sold or shared with third parties.</p>
        </div>

        <div className="content-block">
          <h2>5. Personal Information Commitment</h2>
          <p><strong>NovaForge Systems does not sell personal information.</strong> Your account details, email address, and personal data are never sold, rented, or shared with commercial entities.</p>
        </div>

        <div className="content-block">
          <h2>6. User Rights</h2>
          <p>Under Philippine data protection laws, you have the right to:</p>
          <div style={{ marginLeft: "1.5rem", marginTop: "0.75rem" }}>
            <p><strong>Access:</strong> Request access to personal information we hold about you</p>
            <p><strong>Correction:</strong> Request correction of inaccurate or outdated information</p>
            <p><strong>Deletion:</strong> Request deletion of personal information where applicable</p>
            <p><strong>Objection:</strong> Object to processing of your personal information</p>
            <p><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing at any time</p>
          </div>
        </div>

        <div className="content-block">
          <h2>7. Data Security</h2>
          <p>We implement security measures to protect your personal information. However, no method of transmission over the internet is completely secure.</p>
        </div>

        <div className="content-block">
          <h2>8. Data Retention</h2>
          <p>Personal account information is retained as long as your account is active. You may request deletion of your account and associated personal data at any time.</p>
        </div>

        <div className="content-block">
          <h2>9. Contact Information</h2>
          <p>For privacy-related questions or to exercise your data rights, please contact NovaForge Systems through the LENS platform.</p>
        </div>
      </div>

      <div className="footer">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <LensLogo size={16} />
          <strong>LENS</strong>
        </div>
        <div>Local Educational Network Search · Version 1.0</div>
        <div className="footer-copyright">Forge Systems © 2023</div>
      </div>
    </div>
  );
}

function CopyrightPage() {
  return (
    <div>
      <div className="hero" style={{ paddingBottom: "3rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <LensLogo size={48} />
        </div>
        <h1>Copyright & Content License</h1>
      </div>

      <div className="main" style={{ maxWidth: "900px" }}>
        <div style={{ marginBottom: "2rem", fontSize: "0.85rem", color: "var(--slate-light)" }}>
          <p>Version 1.0 | Last Updated: January 2025</p>
        </div>

        <div className="content-block">
          <h2>1. Ownership</h2>
          <p>You retain full ownership of all research papers and content you upload to LENS. No ownership rights are transferred to LENS or NovaForge Systems.</p>
        </div>

        <div className="content-block">
          <h2>2. Authority to Upload</h2>
          <p>By uploading content, you confirm that you own the material or have obtained legal authority from the copyright holder to upload and distribute it. You are solely responsible for ensuring you have all necessary rights and permissions.</p>
        </div>

        <div className="content-block">
          <h2>3. License Granted to LENS</h2>
          <p>By uploading content to LENS, you grant LENS a non-exclusive, worldwide, royalty-free license to:</p>
          <div style={{ marginLeft: "1.5rem", marginTop: "0.75rem" }}>
            <p>• Host and store your research papers</p>
            <p>• Index and catalog the content</p>
            <p>• Display content to users</p>
            <p>• Process and analyze metadata</p>
            <p>• Enable discovery through search and filtering</p>
            <p>• Create backups for preservation</p>
          </div>
        </div>

        <div className="content-block">
          <h2>4. Metadata and Derivative Information</h2>
          <p>LENS may extract, analyze, and use metadata (titles, authors, keywords, abstracts) for indexing, research intelligence, and platform analytics purposes.</p>
        </div>

        <div className="content-block">
          <h2>5. Commercial Use of Non-Personal Information</h2>
          <p>LENS may use aggregated research metadata and non-personal information for internal analytics and platform development. No personal information about users is included in any commercial analysis.</p>
        </div>

        <div className="content-block">
          <h2>6. Privacy Protection</h2>
          <p>LENS treats your uploaded research as confidential academic content. Your personal information is protected according to our Privacy Policy. <strong>NovaForge Systems does not sell personal information.</strong></p>
        </div>

        <div className="content-block">
          <h2>7. Copyright Complaints</h2>
          <p>If you believe content uploaded to LENS infringes your copyright, please contact us immediately. Include specific details about the infringement and proof of your copyright.</p>
        </div>

        <div className="content-block">
          <h2>8. Content Removal Requests</h2>
          <p>LENS will promptly remove content upon receipt of a valid copyright complaint or takedown notice. Users who repeatedly upload infringing content may have their accounts suspended.</p>
        </div>

        <div className="content-block">
          <p style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border)", fontSize: "0.9rem", fontStyle: "italic" }}>By uploading content to LENS, you acknowledge that you have read and agree to this Copyright & Content License Agreement.</p>
        </div>
      </div>

      <div className="footer">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <LensLogo size={16} />
          <strong>LENS</strong>
        </div>
        <div>Local Educational Network Search · Version 1.0</div>
        <div className="footer-copyright">Forge Systems © 2023</div>
      </div>
    </div>
  );
}

function AuthModal({ mode, onClose, onSuccess, showToast, onNavigate }) {
  const [tab, setTab] = useState(mode);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  // Feature: Forgot Password — separate lightweight state, reuses this modal
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgotSubmit = async () => {
    if (!forgotEmail) {
      showToast("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const result = await api.forgotPassword(forgotEmail);
      // Backend always returns the same generic message by design —
      // this never reveals whether the email exists.
      setForgotSent(true);
      showToast(result.message || "If an account exists, a reset link has been sent");
    } catch (e) {
      showToast("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      showToast("Please fill all fields");
      return;
    }

    if (tab === "register" && !agreedToTerms) {
      showToast("Please agree to terms");
      return;
    }

    setLoading(true);
    try {
      let result;
      if (tab === "login") {
        result = await api.login(form.email, form.password);
      } else {
        result = await api.register(form.email, form.password, form.name, "researcher");
      }

      if (result.token) {
        localStorage.setItem("auth_token", result.token);
        localStorage.setItem("auth_user", JSON.stringify(result.user));
        onSuccess({ ...result.user, token: result.token });
        showToast("Welcome to LENS");
      } else {
        showToast(result.error || "Failed");
      }
    } catch (e) {
      showToast("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <LensLogo size={24} />
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", margin: 0 }}>
              {tab === "login" ? "Sign In" : tab === "forgot" ? "Reset Password" : "Create Account"}
            </h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {tab !== "forgot" && (
          <div style={{ display: "flex", gap: "0", marginBottom: "1.25rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            {["login", "register"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "0.55rem", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                background: tab === t ? "var(--navy)" : "transparent",
                color: tab === t ? "var(--white)" : "var(--slate)",
              }}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
        )}

        {tab === "forgot" && (
          <>
            <p style={{ fontSize: "0.85rem", color: "var(--slate)", marginBottom: "1rem", lineHeight: 1.5 }}>
              Enter your account email and we'll send you a link to reset your password.
            </p>
            {forgotSent ? (
              <div style={{ background: "var(--cream)", borderRadius: "var(--radius)", padding: "1rem", fontSize: "0.85rem", color: "var(--slate)", marginBottom: "1rem" }}>
                If an account with that email exists, a password reset link has been sent. Please check your inbox.
              </div>
            ) : (
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" placeholder="your.email@university.edu.ph"
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
              </div>
            )}
            {!forgotSent && (
              <button className="btn-sm btn-primary" style={{ width: "100%", padding: "0.7rem" }} onClick={handleForgotSubmit} disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            )}
            <button
              type="button"
              style={{ background: "none", border: "none", color: "var(--slate-light)", cursor: "pointer", fontSize: "0.8rem", marginTop: "1rem", textDecoration: "underline", display: "block", width: "100%", textAlign: "center" }}
              onClick={() => { setTab("login"); setForgotSent(false); setForgotEmail(""); }}
            >
              Back to Sign In
            </button>
          </>
        )}

        {tab !== "forgot" && (
        <>
        {tab === "register" && (
          <div className="form-group">
            <label>Name</label>
            <input className="form-input" placeholder="Your name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input className="form-input" type="email" placeholder="your.email@university.edu.ph"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input className="form-input" type="password" placeholder="8+ characters"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          {tab === "login" && (
            <button
              type="button"
              style={{ background: "none", border: "none", color: "var(--slate-light)", cursor: "pointer", fontSize: "0.78rem", marginTop: "0.4rem", textDecoration: "underline", padding: 0 }}
              onClick={() => setTab("forgot")}
            >
              Forgot Password?
            </button>
          )}
        </div>

        {tab === "register" && (
          <>
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
              />
              <label htmlFor="terms">
                {/* ✅ Issue #2 fix: use onNavigate instead of window.open with broken hash URLs */}
                I have read and agree to the{" "}
                <button style={{ background: "none", border: "none", color: "var(--navy)", cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => { onClose(); onNavigate("terms"); }}>
                  Terms and Conditions
                </button>
                {" "}and{" "}
                <button style={{ background: "none", border: "none", color: "var(--navy)", cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => { onClose(); onNavigate("privacy"); }}>
                  Privacy Policy
                </button>
              </label>
            </div>
          </>
        )}

        <button className="btn-sm btn-primary" style={{ width: "100%", padding: "0.7rem" }} onClick={handleSubmit} disabled={loading}>
          {loading ? "Loading..." : (tab === "login" ? "Sign In" : "Register")}
        </button>

        {tab === "login" && (
          <p style={{ fontSize: "0.75rem", color: "var(--slate-light)", textAlign: "center", marginTop: "1rem" }}>
            Demo: owner@lens.edu.ph / OwnerPassword123!
          </p>
        )}
        </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [authModal, setAuthModal] = useState(null);
  const [viewingPaper, setViewingPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // Feature: Forgot Password — holds token/id parsed from the reset link
  const [resetPasswordParams, setResetPasswordParams] = useState(null);
  const [searchState, setSearchState] = useState({
    inputVal: "",
    results: [],
    region: "all",
    city: "",
    school: "all",
    searched: false
  });

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");

    if (savedToken && savedUser) {
      try {
        setUser({ ...JSON.parse(savedUser), token: savedToken });
      } catch (e) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }

    // ✅ Issue #1 fix: read hash on first load to support direct paper links
    const hash = window.location.hash;
    if (hash && hash.startsWith("#/paper/")) {
      const paperId = hash.replace("#/paper/", "").trim();
      if (paperId) {
        fetch(`${API_BASE}/papers/${paperId}`)
          .then(r => r.json())
          .then(paper => {
            if (paper && paper._id) {
              setViewingPaper(paper);
              setPage("paper");
            }
          })
          .catch(e => console.error("Failed to load paper from link:", e))
          .finally(() => setLoading(false));
        return;
      }
    }

    // ✅ Issue #2 fix: read hash on first load to support direct terms/privacy links
    if (hash === "#/terms") { setPage("terms"); }
    else if (hash === "#/privacy") { setPage("privacy"); }
    else if (hash === "#/about") { setPage("about"); }
    // Feature: Forgot Password — detect reset-password link from email
    else if (hash.startsWith("#/reset-password")) {
      const queryStart = hash.indexOf("?");
      if (queryStart !== -1) {
        const params = new URLSearchParams(hash.slice(queryStart + 1));
        const resetToken = params.get("token");
        const resetId = params.get("id");
        if (resetToken && resetId) {
          setResetPasswordParams({ token: resetToken, id: resetId });
          setPage("reset-password");
        }
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state) {
        setPage(e.state.page);
        setViewingPaper(e.state.paper || null);
        if (e.state.searchState) {
          setSearchState(e.state.searchState);
        }
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Loading...</div>;

  const navigate = (p, searchQuery = null, paperData = null, currentSearchState = null) => {
    if (p === "paper" && paperData) {
      // ✅ Issue #1 fix: push hash URL with paper ID so shared links work
      const newHash = `#/paper/${paperData._id}`;
      window.history.pushState({ page: p, paper: paperData, searchState: currentSearchState || searchState }, "", newHash);
      setViewingPaper(paperData);
      setPage(p);
    } else if (p === "search" && searchQuery) {
      window.history.replaceState({ page: p, paper: null, searchState: null }, "", window.location.pathname);
      setPage(p);
      setViewingPaper(null);
      setSearchQuery(searchQuery);
      setSearchState({
        inputVal: searchQuery,
        results: [],
        region: "all",
        city: "",
        school: "all",
        searched: false
      });
    } else {
      // ✅ Issue #2 fix: update hash for terms/privacy/about so refresh works
      const hashMap = { terms: "#/terms", privacy: "#/privacy", about: "#/about" };
      const newHash = hashMap[p] || "";
      window.history.replaceState({ page: p, paper: null, searchState: null }, "", window.location.pathname + newHash);
      setPage(p);
      setViewingPaper(null);
    }

    window.scrollTo(0, 0);
  };

  const handleViewPaper = (paper) => {
    navigate("paper", null, paper, searchState);
  };

  const handleBackFromPaper = () => {
    if (searchState.searched) {
      setPage("search");
      window.history.back();
    } else {
      navigate("home");
    }
  };

  const updateSearchState = (newSearchState) => {
    setSearchState(newSearchState);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    navigate("home");
    showToast("Signed out");
  };

  return (
    <>
      <style>{CSS}</style>

      <nav className="nav">
        <div className="nav-logo" onClick={() => navigate("home")}>
          <LensLogo size={32} />
          LENS
        </div>
        <div className="nav-links">
          <button className={`nav-link ${page === "home" ? "active" : ""}`} onClick={() => navigate("home")}>Home</button>
          <button className={`nav-link ${page === "search" ? "active" : ""}`} onClick={() => navigate("search")}>Search</button>
          <button className={`nav-link ${page === "about" ? "active" : ""}`} onClick={() => navigate("about")}>About</button>
          <button className={`nav-link ${page === "terms" ? "active" : ""}`} onClick={() => navigate("terms")}>Terms</button>
          <button className={`nav-link ${page === "privacy" ? "active" : ""}`} onClick={() => navigate("privacy")}>Privacy</button>
        </div>
        <div className="nav-actions">
          {user ? (
            <>
              {(user.role === "researcher" || user.role === "student") && (
                <button className="btn-nav btn-nav-outline" onClick={() => navigate("upload")}>Upload</button>
              )}
              {user.role === "owner" && (
                <button className="btn-nav btn-nav-outline" onClick={() => navigate("admin")}>Admin</button>
              )}
              <span className="nav-user-name">{user.name}</span>
              <button className="btn-nav btn-nav-outline" onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <button className="btn-nav btn-nav-outline" onClick={() => setAuthModal("login")}>Sign In</button>
              <button className="btn-nav btn-nav-solid" onClick={() => setAuthModal("register")}>Register</button>
            </>
          )}
        </div>
      </nav>

      {page === "home" && <HomePage onNavigate={navigate} onViewPaper={handleViewPaper} />}
      {page === "search" && <SearchPage onViewPaper={handleViewPaper} onSearchStateChange={updateSearchState} initialQuery={searchQuery} />}
      {page === "about" && <AboutPage />}
      {page === "terms" && <TermsPage />}
      {page === "privacy" && <PrivacyPage />}
      {page === "reset-password" && resetPasswordParams && <ResetPasswordPage resetParams={resetPasswordParams} onNavigate={navigate} showToast={showToast} />}
      {page === "copyright" && <CopyrightPage />}
      {page === "paper" && viewingPaper && <PaperDetail paper={viewingPaper} onBack={handleBackFromPaper} showToast={showToast} />}
      {page === "upload" && user && <UploadPage user={user} showToast={showToast} onNavigate={navigate} />}
      {page === "admin" && user?.role === "owner" && <AdminDashboard user={user} showToast={showToast} />}

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSuccess={(userData) => setUser(userData)}
          showToast={showToast}
          onNavigate={navigate}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}