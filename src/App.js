// src/App.js
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import UploadCard from './components/UploadCard';
import StatusBar from './components/StatusBar';
import ResultsCard from './components/ResultsCard';
import { solveAsync, getStatus, downloadResult  } from './api/solverapi';
import { authHeaders } from './api/authapi';
import './App.css';

const BASE = process.env.REACT_APP_API_BASE_URL ;


export default function App() {
  const { user, logout } = useAuth();

  const [loading, setLoading]   = useState(false);
  const [job, setJob]           = useState(null);
  const [results, setResults]   = useState(null);
  const [error, setError]       = useState(null);
  const pollRef                 = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  // ── If not logged in, show auth page ─────────────────────────
  if (!user) return <AuthPage />;

  // ── Authenticated flow below ──────────────────────────────────

  const handleSubmit = async (file, systemPrompt, email) => {
    setLoading(true);
    setJob(null);
    setResults(null);
    setError(null);

    try {
      // Pass authHeaders so every API call includes the JWT
      const { data } = await solveAsync(file, systemPrompt, email, authHeaders());
      setJob(data);
      startPolling(data.jobId);
    } catch (e) {
      setError(e.message || 'Failed to submit. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (jobId) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await getStatus(jobId, authHeaders());
        setJob(data);

        if (data.status === 'DONE') {
          clearInterval(pollRef.current);
          try {
            const res = await fetch(
              `${BASE}/api/solver/result/${jobId}/json`,
              authHeaders()
            );
            if (res.ok) setResults(await res.json());
          } catch {
            // JSON endpoint not available — download still works
          }
        }

        if (data.status === 'FAILED') {
          clearInterval(pollRef.current);
          setError(data.error || 'Processing failed');
        }
      } catch {
        clearInterval(pollRef.current);
      }
    }, 3000);
  };

  const handleDownload = async () => {
  try {
    await downloadResult(job.jobId, `QA_Report_${job.jobId}.pdf`);
  } catch (e) {
    setError('Download failed. Please try again.');
  }
};

  
  return (
    <div style={styles.app}>

      {/* ── Header with user info + logout ─────────────────── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Question Solver</h1>
          <p style={styles.subtitle}>Upload a document — get answers instantly</p>
        </div>
        <div style={styles.userBar}>
          <span style={styles.userEmail}>{user.email}</span>
          <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </div>

      <UploadCard onSubmit={handleSubmit} loading={loading} />

      {error && <div style={styles.error}>{error}</div>}

      {job && <StatusBar status={job.status} fileName={job.fileName} />}

      {job?.status === 'DONE' && (
        <div style={styles.downloadBox}>
          <div style={styles.downloadLeft}>
            <span style={styles.downloadIcon}>✓</span>
            <div>
              <p style={styles.downloadTitle}>Your PDF report is ready</p>
              <p style={styles.downloadSub}>{job.fileName} — processed successfully</p>
            </div>
          </div>
          <button style={styles.downloadBtn} onClick={handleDownload}>
            Download PDF
          </button>
        </div>
      )}

      {results && <ResultsCard job={job} results={results} />}
    </div>
  );
}

const styles = {
  app: {
    maxWidth: 700, margin: '0 auto',
    padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif',
  },
  header: {
    marginBottom: '1.5rem',
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
  },
  title:    { fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: '#111' },
  subtitle: { fontSize: 14, color: '#888', margin: 0 },

  // User bar
  userBar: { display: 'flex', alignItems: 'center', gap: 10 },
  userEmail: {
    fontSize: 13, color: '#555',
    background: '#f3f4f6', padding: '5px 10px',
    borderRadius: 6, fontFamily: 'monospace',
  },
  logoutBtn: {
    padding: '6px 14px', fontSize: 13, fontWeight: 500,
    background: 'none', border: '1px solid #d1d5db',
    borderRadius: 6, cursor: 'pointer', color: '#374151',
    transition: 'background 0.15s',
  },

  error: {
    padding: '10px 14px', background: '#FCEBEB',
    color: '#791F1F', borderRadius: 8, fontSize: 13, marginBottom: '1rem',
  },

  downloadBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px', background: '#EAF3DE',
    border: '0.5px solid #C0DD97', borderRadius: 10, marginBottom: '1rem',
  },
  downloadLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  downloadIcon: {
    width: 32, height: 32, background: '#639922', color: '#fff',
    borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0,
  },
  downloadTitle: { fontSize: 14, fontWeight: 600, color: '#27500A', margin: '0 0 2px' },
  downloadSub:   { fontSize: 12, color: '#3B6D11', margin: 0 },
  downloadBtn: {
    padding: '8px 20px', fontSize: 13, fontWeight: 600,
    background: '#639922', color: '#fff', border: 'none',
    borderRadius: 8, cursor: 'pointer', flexShrink: 0,
  },
};