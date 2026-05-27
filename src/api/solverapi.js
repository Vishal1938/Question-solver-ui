
const BASE_URL = process.env.REACT_APP_API_BASE_URL ;

export async function solveAsync(file, systemPrompt, email) {
  const token = sessionStorage.getItem('jwt_token');
  const formData = new FormData();
  formData.append('file', file);
  if (systemPrompt) formData.append('systemPrompt', systemPrompt);
  if (email)        formData.append('email', email);

  const res = await fetch(`${BASE_URL}/api/solver/solve-async`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,   // ← attach JWT
      // DO NOT set Content-Type — browser sets it automatically for FormData
    },
    body: formData,
  });

  if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
  return { data: await res.json() };
}

export async function getStatus(jobId) {
  const token = sessionStorage.getItem('jwt_token');
  const res = await fetch(`${BASE_URL}/api/solver/status/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return { data: await res.json() };
}

export async function downloadResult(jobId, fileName) {
  const token = sessionStorage.getItem('jwt_token');

  const res = await fetch(`${BASE_URL}/api/solver/result/${jobId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  // Convert response to a blob and trigger browser download
  const blob = await res.blob();
  const url  = window.URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = fileName || `QA_Report_${jobId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);   // free memory
}