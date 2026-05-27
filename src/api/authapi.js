// src/api/authapi.js
// Mirrors the pattern of your existing solverapi.js

const BASE = process.env.REACT_APP_API_BASE_URL ;

/**
 * POST /api/auth/register
 * body: { email, password }
 */
export async function register(email, password) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed');
  return data;   // { token, email, role, expiresInMs }
}

/**
 * POST /api/auth/login
 * body: { email, password }
 */
export async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Invalid email or password');
  return data;   // { token, email, role, expiresInMs }
}

/**
 * Returns fetch options with the JWT Authorization header injected.
 * Use this for every protected API call, e.g.:
 *
 *   const res = await fetch(url, authHeaders({ method: 'POST', body: formData }));
 */
export function authHeaders(options = {}) {
  const token = sessionStorage.getItem('jwt_token');
  return {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}