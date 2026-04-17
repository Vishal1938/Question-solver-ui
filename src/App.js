import { useState, useEffect, useRef } from 'react';
import UploadCard from './components/UploadCard';
import StatusBar from './components/StatusBar';
import ResultsCard from './components/ResultsCard';
import { solveAsync, getStatus, getDownloadUrl } from './api/solverapi';
import './App.css';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const handleSubmit = async (file, systemPrompt, email) => {
    setLoading(true);
    setJob(null);
    setResults(null);
    setError(null);

    try {
      const { data } = await solveAsync(file, systemPrompt, email);
      setJob(data);
      startPolling(data.jobId);
    } catch (e) {
      setError('Failed to submit. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (jobId) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await getStatus(jobId);
        setJob(data);

        if (data.status === 'DONE') {
          clearInterval(pollRef.current);
          // ✅ Try fetching JSON results — but download works regardless
          try {
            const res = await fetch(`http://localhost:8090/api/solver/result/${jobId}/json`);
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

  // ✅ Trigger browser download
  const handleDownload = () => {
    const url = getDownloadUrl(job.jobId);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QA_Report_${job.jobId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.title}>Question solver</h1>
        <p style={styles.subtitle}>Upload a document — get answers instantly</p>
      </div>

      <UploadCard onSubmit={handleSubmit} loading={loading} />

      {error && (
        <div style={styles.error}>{error}</div>
      )}

      {job && (
        <StatusBar status={job.status} fileName={job.fileName} />
      )}

      {/* ✅ Show download button as soon as job is DONE */}
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

      {results && (
        <ResultsCard job={job} results={results} />
      )}
    </div>
  );
}

const styles = {
  app: { maxWidth: 700, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: '#111' },
  subtitle: { fontSize: 14, color: '#888', margin: 0 },
  error: { padding: '10px 14px', background: '#FCEBEB', color: '#791F1F', borderRadius: 8, fontSize: 13, marginBottom: '1rem' },

  // ✅ Download box styles
  downloadBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px', background: '#EAF3DE',
    border: '0.5px solid #C0DD97', borderRadius: 10, marginBottom: '1rem',
  },
  downloadLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  downloadIcon: {
    width: 32, height: 32, background: '#639922', color: '#fff',
    borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 16, fontWeight: 700,
    flexShrink: 0,
  },
  downloadTitle: { fontSize: 14, fontWeight: 600, color: '#27500A', margin: '0 0 2px' },
  downloadSub: { fontSize: 12, color: '#3B6D11', margin: 0 },
  downloadBtn: {
    padding: '8px 20px', fontSize: 13, fontWeight: 600,
    background: '#639922', color: '#fff', border: 'none',
    borderRadius: 8, cursor: 'pointer', flexShrink: 0,
  },
};