
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
    redirect: 'manual',   // ← don't auto-follow redirects — handle manually
  });

  // 302 redirect → server is pointing us to Cloudinary public URL
  if (res.type === 'opaqueredirect' || res.status === 302) {
    // Get the Cloudinary URL from our backend first, then open directly
    const infoRes = await fetch(`${BASE_URL}/api/solver/download-url/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (infoRes.ok) {
      const { url } = await infoRes.json();
      window.open(url, '_blank');
      return;
    }
  }

  // 200 → file served directly from disk as blob
  if (res.ok) {
    const blob = await res.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return;
  }

  throw new Error(`Download failed: ${res.status}`);
}

export async function getHistory() {
  const token = sessionStorage.getItem('jwt_token');
  const res = await fetch(`${BASE_URL}/api/solver/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();  // returns JobResultDto[]
}