// src/api/papersApi.js
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8060';

function authHeaders() {
  const token = sessionStorage.getItem('jwt_token');
  return { Authorization: `Bearer ${token}` };
}

// ── Admin: upload a new paper (PR-1) ───────────────────────────
export async function adminUploadPaper(file, meta) {
  const form = new FormData();
  form.append('file', file);
  form.append('title',      meta.title);
  form.append('board',      meta.board);
  form.append('classLevel', meta.classLevel);
  form.append('subject',    meta.subject);
  form.append('year',       meta.year);
  if (meta.totalMarks)      form.append('totalMarks', meta.totalMarks);
  if (meta.durationMinutes) form.append('durationMinutes', meta.durationMinutes);

  const res = await fetch(`${BASE_URL}/api/admin/papers`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${res.status} — ${err}`);
  }
  return res.json();
}

// ── Browse: search papers with filters (PR-2) ──────────────────
export async function searchPapers({ board, classLevel, subject, year, q, page = 0, size = 24 } = {}) {
  const params = new URLSearchParams();
  if (board)      params.set('board', board);
  if (classLevel) params.set('classLevel', classLevel);
  if (subject)    params.set('subject', subject);
  if (year)       params.set('year', year);
  if (q)          params.set('q', q);
  params.set('page', page);
  params.set('size', size);

  const res = await fetch(`${BASE_URL}/api/papers/search?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();   // PaperSearchResponse
}

// ── Browse: get filter dropdown options (PR-2) ─────────────────
export async function getFilterOptions() {
  const res = await fetch(`${BASE_URL}/api/papers/filters`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Filter options failed: ${res.status}`);
  return res.json();   // FilterOptionsDto
}

// ── Browse: get single paper with questions (PR-2) ─────────────
export async function getPaper(paperId) {
  const res = await fetch(`${BASE_URL}/api/papers/${paperId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Get paper failed: ${res.status}`);
  return res.json();   // PaperDetailDto
}

// ── Browse: download paper answer PDF (PR-2) ───────────────────
export async function downloadPaper(paperId, title) {
  const res = await fetch(`${BASE_URL}/api/papers/${paperId}/download`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const blob = await res.blob();
  const url  = window.URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = (title || paperId).replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ── Stub for PR-3 ──────────────────────────────────────────────
export async function shareJobAsCommunityPaper(jobId) {
  throw new Error('shareJobAsCommunityPaper — not yet implemented (PR-3)');
}