// src/App.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import UploadCard from './components/UploadCard';
import StatusBar from './components/StatusBar';
import ResultsCard from './components/ResultsCard';
import HistoryCard from './components/HistoryCard';
import {
  solveAsync,
  getStatus,
  downloadResult,
  getHistory,
} from './api/solverapi';

import './App.css';

const BASE = process.env.REACT_APP_API_BASE_URL;

export default function App() {
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const [view, setView] = useState('upload');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');

    try {
      const data = await getHistory();
      setHistory(data);
    } catch {
      setHistoryError('Failed to load history. Please try again.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const switchView = (v) => {
    setView(v);
    if (v === 'history') loadHistory();
  };

  if (!user) return <AuthPage />;

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
      setError(e.message || 'Failed to submit.');
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

          try {
            const token = sessionStorage.getItem('jwt_token');

            const res = await fetch(
              `${BASE}/api/solver/result/${jobId}/json`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (res.ok) {
              setResults(await res.json());
            }
          } catch {}
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

  const handleDownload = async (jobId) => {
    setDownloading(jobId);

    try {
      await downloadResult(jobId, `QA_Report_${jobId}.pdf`);
    } catch {
      setError('Download failed.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div style={s.page}>

      {/* Background */}
      <div style={s.grid} />
      <div style={{ ...s.orb, ...s.orb1 }} />
      <div style={{ ...s.orb, ...s.orb2 }} />

      <div style={s.container}>

        {/* Header */}
        <header style={s.header}>
          <div style={s.brand}>
            <div style={s.brandMark}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0a0a0f"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>

            <div>
              <div style={s.brandName}>CodingAgent</div>
              <div style={s.brandSub}>
                AI-powered document analysis
              </div>
            </div>
          </div>

          <div style={s.userZone}>
            <div style={s.userPill}>
              <div style={s.avatar}>
                {user.email[0].toUpperCase()}
              </div>

              <span style={s.userEmailText}>
                {user.email}
              </span>
            </div>

            <button style={s.logoutBtn} onClick={logout}>
              Sign out
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div style={s.tabBar}>
          <button
            style={{
              ...s.tabBtn,
              ...(view === 'upload' ? s.tabBtnActive : {}),
            }}
            onClick={() => switchView('upload')}
          >
            New Upload
          </button>

          <button
            style={{
              ...s.tabBtn,
              ...(view === 'history' ? s.tabBtnActive : {}),
            }}
            onClick={() => switchView('history')}
          >
            My Reports

            {history.length > 0 && (
              <span style={s.countBadge}>
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* Upload */}
        {view === 'upload' && (
          <div style={s.section}>

            <UploadCard
              onSubmit={handleSubmit}
              loading={loading}
            />

            {error && (
              <div style={s.errorBanner}>
                ⚠ {error}
              </div>
            )}

            {job && (
              <StatusBar
                status={job.status}
                fileName={job.fileName}
              />
            )}

            {job?.status === 'DONE' && (
              <div style={s.successBanner}>

                <div style={s.successLeft}>
                  <div style={s.successCheck}>✓</div>

                  <div>
                    <p style={s.successTitle}>
                      PDF report is ready
                    </p>

                    <p style={s.successSub}>
                      {job.fileName}
                    </p>
                  </div>
                </div>

                <button
                  style={{
                    ...s.primaryBtn,
                    opacity:
                      downloading === job.jobId ? 0.7 : 1,
                  }}
                  disabled={downloading === job.jobId}
                  onClick={() => handleDownload(job.jobId)}
                >
                  {downloading === job.jobId
                    ? 'Downloading...'
                    : 'Download PDF'}
                </button>
              </div>
            )}

            {results && (
              <ResultsCard job={job} results={results} />
            )}

          </div>
        )}

        {/* History */}
        {view === 'history' && (
          <div style={s.section}>

            <div style={s.historyTopBar}>
              <div>
                <div style={s.sectionTitle}>
                  Your Reports
                </div>

                <div style={s.sectionSub}>
                  {history.length > 0
                    ? `${history.length} report${
                        history.length > 1 ? 's' : ''
                      } generated`
                    : 'No reports yet'}
                </div>
              </div>

              <button
                style={s.refreshBtn}
                onClick={loadHistory}
                disabled={historyLoading}
              >
                Refresh
              </button>
            </div>

            {historyError && (
              <div style={s.errorBanner}>
                ⚠ {historyError}
              </div>
            )}

            {!historyLoading &&
              history.length === 0 &&
              !historyError && (
                <div style={s.emptyState}>
                  <div style={s.emptyTitle}>
                    No reports yet
                  </div>

                  <div style={s.emptySub}>
                    Upload a document to generate your
                    first AI-powered report.
                  </div>

                  <button
                    style={s.primaryBtn}
                    onClick={() => switchView('upload')}
                  >
                    Upload Document
                  </button>
                </div>
              )}

            {!historyLoading && history.length > 0 && (
              <div style={s.cardList}>
                {history.map((item, idx) => (
                  <HistoryCard
                    key={item.jobId}
                    item={item}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const s = {

  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#f0f0f8',
    fontFamily: "'Syne', sans-serif",
    position: 'relative',
    overflowX: 'hidden',
    padding: '0 1rem 4rem',
  },

  container: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 980,
    margin: '0 auto',
  },

  grid: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
  },

  orb: {
    position: 'fixed',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 0,
  },

  orb1: {
    width: 420,
    height: 420,
    background:
      'radial-gradient(circle, rgba(232,255,71,0.15) 0%, transparent 70%)',
    top: -120,
    right: -80,
  },

  orb2: {
    width: 320,
    height: 320,
    background:
      'radial-gradient(circle, rgba(71,130,255,0.14) 0%, transparent 70%)',
    bottom: -80,
    left: -40,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,

    padding: '18px 24px',
    marginTop: 24,
    marginBottom: 28,

    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
    backdropFilter: 'blur(18px)',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: '#e8ff47',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f0f0f8',
  },

  brandSub: {
    fontSize: 12,
    color: '#6b6b80',
    marginTop: 2,
    fontFamily: 'monospace',
  },

  userZone: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,

    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 999,
    padding: '6px 14px 6px 6px',
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#e8ff47',
    color: '#0a0a0f',
    fontSize: 12,
    fontWeight: 800,

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  userEmailText: {
    fontSize: 12,
    color: '#d1d5db',
    fontFamily: 'monospace',
  },

  logoutBtn: {
    padding: '9px 16px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',

    background: 'rgba(255,255,255,0.04)',
    color: '#f0f0f8',

    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },

  tabBar: {
    display: 'flex',
    gap: 4,

    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 4,

    marginBottom: 28,
    backdropFilter: 'blur(18px)',
  },

  tabBtn: {
    flex: 1,

    padding: '12px 18px',

    border: 'none',
    borderRadius: 10,

    background: 'transparent',
    color: '#6b6b80',

    fontSize: 14,
    fontWeight: 600,

    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  tabBtnActive: {
    background: '#e8ff47',
    color: '#0a0a0f',
    fontWeight: 700,
  },

  countBadge: {
    marginLeft: 8,
    background: '#0a0a0f',
    color: '#e8ff47',
    padding: '2px 7px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
  },

  section: {
    animation: 'fadeUp 0.35s ease',
  },

  errorBanner: {
    padding: '12px 16px',
    borderRadius: 14,

    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',

    color: '#f87171',

    fontSize: 13,
    fontFamily: 'monospace',

    marginBottom: 16,
  },

  successBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,

    padding: '18px',

    background: 'rgba(34,197,94,0.08)',
    border: '1px solid rgba(34,197,94,0.2)',

    borderRadius: 18,
    marginBottom: 18,
  },

  successLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },

  successCheck: {
    width: 38,
    height: 38,
    borderRadius: '50%',

    background: '#22c55e',
    color: '#fff',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    fontWeight: 700,
  },

  successTitle: {
    margin: 0,
    color: '#4ade80',
    fontWeight: 700,
    fontSize: 15,
  },

  successSub: {
    margin: '4px 0 0',
    color: '#86efac',
    fontSize: 12,
    fontFamily: 'monospace',
  },

  primaryBtn: {
    padding: '11px 18px',

    background: '#e8ff47',
    color: '#0a0a0f',

    border: 'none',
    borderRadius: 12,

    fontWeight: 700,
    fontSize: 14,

    cursor: 'pointer',
  },

  historyTopBar: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f0f0f8',
  },

  sectionSub: {
    fontSize: 12,
    color: '#6b6b80',
    fontFamily: 'monospace',
    marginTop: 4,
  },

  refreshBtn: {
    padding: '10px 14px',

    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.07)',

    background: 'rgba(255,255,255,0.04)',
    color: '#f0f0f8',

    fontWeight: 600,
    cursor: 'pointer',
  },

  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },

  emptyState: {
    textAlign: 'center',
    padding: '70px 24px',

    background: 'rgba(255,255,255,0.03)',
    border: '1px dashed rgba(255,255,255,0.1)',

    borderRadius: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 10,
  },

  emptySub: {
    color: '#6b6b80',
    fontSize: 14,
    lineHeight: 1.7,

    maxWidth: 340,
    margin: '0 auto 28px',
  },
};