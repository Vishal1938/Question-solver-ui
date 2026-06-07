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
// ── ADD THESE to src/api/papersApi.js ──────────────────────────
// (replaces the PR-3 stub `shareJobAsCommunityPaper`)

// ── Community: share a report to the archive (PR-3) ────────────
export async function shareJobAsCommunityPaper(jobId, meta) {
  const res = await fetch(`${BASE_URL}/api/papers/share/${jobId}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(meta),   // { board, classLevel, subject, year }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Share failed: ${res.status}`);
  }
  return res.json();
}

// ── Community: withdraw a pending submission (PR-3) ────────────
export async function unshareJob(jobId) {
  const res = await fetch(`${BASE_URL}/api/papers/share/${jobId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Unshare failed: ${res.status}`);
  }
  return res.json();
}

// ── Admin: pending review queue (PR-3) ─────────────────────────
export async function getPendingPapers() {
  const res = await fetch(`${BASE_URL}/api/admin/papers/pending`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Pending fetch failed: ${res.status}`);
  return res.json();
}

// ── Admin: approve a pending paper (PR-3) ──────────────────────
export async function approvePaper(paperId) {
  const res = await fetch(`${BASE_URL}/api/admin/papers/${paperId}/approve`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
  return res.json();
}

// ── Admin: reject a pending paper (PR-3) ───────────────────────
export async function rejectPaper(paperId) {
  const res = await fetch(`${BASE_URL}/api/admin/papers/${paperId}/reject`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
  return res.json();
}