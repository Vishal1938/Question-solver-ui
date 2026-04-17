import axios from 'axios';

const BASE_URL = 'http://localhost:8090/api/solver';

export const solveAsync = (file, systemPrompt, email) => {
  const form = new FormData();
  form.append('file', file);
  if (systemPrompt) form.append('systemPrompt', systemPrompt);
  if (email) form.append('email', email);
  return axios.post(`${BASE_URL}/solve-async`, form);
};

export const getStatus = (jobId) =>
  axios.get(`${BASE_URL}/status/${jobId}`);

// ✅ This is what App.jsx uses to build the download URL
export const getDownloadUrl = (jobId) =>
  `${BASE_URL}/result/${jobId}/download`;