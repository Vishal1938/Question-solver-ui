// src/api/quizapi.js
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8060';

function authHeaders() {
  const token = sessionStorage.getItem('jwt_token');
  return { Authorization: `Bearer ${token}` };
}

// ── Generate a quiz from an uploaded MCQ paper (async) ─────────
export async function generateQuiz(file, title) {
  const form = new FormData();
  form.append('file', file);
  if (title) form.append('title', title);

  const res = await fetch(`${BASE_URL}/api/quizzes/generate`, {
    method: 'POST',
    headers: authHeaders(),   // no Content-Type — browser sets multipart boundary
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Generate failed: ${res.status} — ${err}`);
  }
  return res.json();   // { jobId, status }
}

// ── Poll extraction status ─────────────────────────────────────
export async function getQuizStatus(jobId) {
  const res = await fetch(`${BASE_URL}/api/quizzes/status/${jobId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Status failed: ${res.status}`);
  return res.json();   // { status, quizId, questionCount, error }
}

// ── User's quiz archive ────────────────────────────────────────
export async function getMyQuizzes() {
  const res = await fetch(`${BASE_URL}/api/quizzes/my`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Archive failed: ${res.status}`);
  return res.json();   // QuizSummaryDto[]
}

// ── Delete a quiz ──────────────────────────────────────────────
export async function deleteQuiz(quizId) {
  const res = await fetch(`${BASE_URL}/api/quizzes/${quizId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
}

// ── Fetch a quiz for attempting (no correct answers) ───────────
export async function getQuizForAttempt(quizId) {
  const res = await fetch(`${BASE_URL}/api/quizzes/${quizId}/attempt`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to load quiz: ${res.status}`);
  }
  return res.json();   // QuizAttemptDto
}

// ── Submit answers → grade → full result ───────────────────────
export async function submitQuiz(quizId, answers, timeTakenSec) {
  const res = await fetch(`${BASE_URL}/api/quizzes/${quizId}/submit`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, timeTakenSec }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Submit failed: ${res.status}`);
  }
  return res.json();   // QuizResultDto
}

// ── Fetch result of a completed quiz (review) ──────────────────
export async function getQuizResult(quizId) {
  const res = await fetch(`${BASE_URL}/api/quizzes/${quizId}/result`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to load result: ${res.status}`);
  }
  return res.json();   // QuizResultDto
}