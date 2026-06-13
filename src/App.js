// src/App.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import UploadCard from './components/UploadCard';
import StatusBar from './components/StatusBar';
import HistoryCard from './components/HistoryCard';
import StatsTile from './components/Statstile';
import ComingSoonPage from './pages/ComingSoonPage';
import AdminPapersPage from './pages/AdminPapersPage';
import PastPapersPage from './pages/PastPapersPage';
import PaperDetailPage from './pages/PaperDetailPage';
import ResultsView from './components/ResultsView';
import QuizzesPage from './pages/QuizzesPage';
import QuizRunnerPage from './pages/QuizRunnerPage';
import QuizResultPage from './pages/QuizResultPage';

import {
  solveAsync,
  getStatus,
  downloadResult,
  getHistory,
} from './api/solverapi';
import './App.css';

const BASE = process.env.REACT_APP_API_BASE_URL;

// ── Page metadata for the top utility bar ──────────────────────────────
const PAGE_META = {
  upload:     { title: 'New Upload',     subtitle: '// upload a document — get instant AI answers',
                breadcrumb: 'Study › New Upload' },
  history:    { title: 'My Reports',     subtitle: '// your generated reports',
                breadcrumb: 'Study › My Reports' },
  past:       { title: 'Past Papers',    subtitle: '// browse past papers by board, subject, year',
                breadcrumb: 'Study › Past Papers' },
  mockTest:   { title: 'Mock Test',      subtitle: '// AI-generated practice tests',
                breadcrumb: 'Study › Mock Test' },
  quiz:       { title:    'Quiz Mode', subtitle: '// upload an MCQ paper, get an interactive quiz',
               breadcrumb: 'Practice › Quiz Mode'},
  flashcards: { title: 'Flashcards',     subtitle: '// spaced repetition for exam prep',
                breadcrumb: 'Practice › Flashcards' },
  chat:       { title: 'Doubt Chat',     subtitle: '// chat with your notes — ask anything',
                breadcrumb: 'Practice › Doubt Chat' },
  grade:      { title: 'Grade My Answer',subtitle: '// upload your handwritten answer, get AI feedback',
                breadcrumb: 'Evaluate › Grade My Answer' },
  analytics:  { title: 'Performance',    subtitle: '// your weak areas, scores, trends',
                breadcrumb: 'Evaluate › Performance' },
  groups:     { title: 'Study Groups',   subtitle: '// share notes and papers with peers',
                breadcrumb: 'Social › Study Groups' },
 adminPapers: {
    title:    'Manage Papers',
    subtitle: '// upload official papers to the public archive',
    breadcrumb: 'Admin › Manage Papers'
  },
};

export default function App() {
  const { user } = useAuth();

  // ── State for the upload+solve flow ──────────────────────────
  const [loading, setLoading] = useState(false);
  const [job, setJob]         = useState(null);
  const [error, setError]     = useState(null);
  const pollRef               = useRef(null);

  // ── Navigation state ─────────────────────────────────────────
  const [activeView, setActiveView] = useState('upload');

  // ── History state ────────────────────────────────────────────
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]     = useState('');
  const [downloading, setDownloading]       = useState(null);
  const [quizView, setQuizView] = useState({ mode: 'list', quizId: null });// mode: 'list' | 'attempt' | 'review'
  const [openPaperId, setOpenPaperId] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  

  // ── Load history (used by stats + history page) ──────────────
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

  // Auto-load history once on mount so stats tile has data
  useEffect(() => {
    if (user) loadHistory();
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload history when navigating to history page
  const navigate = (view) => {
    setActiveView(view);
    if (view !== 'quiz') setQuizView({ mode: 'list', quizId: null });
    if (view !== 'past') setOpenPaperId(null);
    if (view === 'history') loadHistory();
  };

  if (!user) return <AuthPage />;

  // ── Handlers (unchanged) ─────────────────────────────────────
  const handleSubmit = async (file, systemPrompt, email) => {
    setLoading(true);
    setJob(null);
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
             await fetch(`${BASE}/api/solver/result/${jobId}/json`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            
          } catch {}
          // Refresh history so the new job appears immediately
          loadHistory();
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

  // ── Page renderer ────────────────────────────────────────────
  const renderPage = () => {
    switch (activeView) {

      case 'upload':
        return (
          <>
            <StatsTile history={history} />
            <UploadCard onSubmit={handleSubmit} loading={loading} />

            {error && <div style={s.errorBanner}>⚠ {error}</div>}
            {job && <StatusBar status={job.status} fileName={job.fileName} />}

            {job?.status === 'DONE' && (
              <div style={s.successBanner}>
                <div style={s.successLeft}>
                  <div style={s.successCheck}>✓</div>
                  <div>
                    <p style={s.successTitle}>PDF report is ready</p>
                    <p style={s.successSub}>{job.fileName}</p>
                  </div>
                </div>
                <button
                  style={{
                    ...s.primaryBtn,
                    opacity: downloading === job.jobId ? 0.7 : 1,
                  }}
                  disabled={downloading === job.jobId}
                  onClick={() => handleDownload(job.jobId)}
                >
                  {downloading === job.jobId ? 'Downloading...' : 'Download PDF'}
                </button>
              </div>
            )}

            {job?.status === 'DONE' && <ResultsView jobId={job.jobId} />}
          </>
        );

      case 'history':
        return (
          <>
            <div style={s.historyTopBar}>
              <div style={s.historyMeta}>
                {history.length > 0
                  ? `${history.length} report${history.length > 1 ? 's' : ''} generated`
                  : 'No reports yet'}
              </div>
              <button
                style={s.refreshBtn}
                onClick={loadHistory}
                disabled={historyLoading}
              >
                ↻ Refresh
              </button>
            </div>

            {historyError && <div style={s.errorBanner}>⚠ {historyError}</div>}

            {!historyLoading && history.length === 0 && !historyError && (
              <div style={s.emptyState}>
                <div style={s.emptyTitle}>No reports yet</div>
                <div style={s.emptySub}>
                  Upload a document to generate your first AI-powered report.
                </div>
                <button style={s.primaryBtn} onClick={() => navigate('upload')}>
                  Upload Document
                </button>
              </div>
            )}

            {!historyLoading && history.length > 0 && (
              <div style={s.cardList}>
                {history.map((item, idx) => (
                  <HistoryCard key={item.jobId} item={item} index={idx} />
                ))}
              </div>
            )}
          </>
        );

      case 'adminPapers':
      return <AdminPapersPage />;

      case 'past':
  return openPaperId ? (
    <PaperDetailPage
      paperId={openPaperId}
      onBack={() => setOpenPaperId(null)}
    />
  ) : (
    <PastPapersPage
      onOpenPaper={(id) => setOpenPaperId(id)}
    />
  );

      case 'mockTest':
        return <ComingSoonPage
          title="Mock Test Generator"
          description="Generate timed practice tests modeled after your previous papers. Get results emailed after submission."
          eta="Coming Soon"
        />;

      case 'quiz':
  if (quizView.mode === 'attempt') {
    return (
      <QuizRunnerPage
        quizId={quizView.quizId}
        onComplete={(result) => {
          setQuizResult(result);
          setQuizView({ mode: 'result', quizId: quizView.quizId });
        }}
        onBack={() => setQuizView({ mode: 'list', quizId: null })}
      />
    );
  }
  if (quizView.mode === 'result') {
    return (
      <QuizResultPage
        quizId={quizView.quizId}
        result={quizResult}                 // fresh result from submit
        onBack={() => {
          setQuizResult(null);
          setQuizView({ mode: 'list', quizId: null });
        }}
      />
    );
  }
  if (quizView.mode === 'review') {
    return (
      <QuizResultPage
        quizId={quizView.quizId}
        result={null}                        // null → fetches via getQuizResult
        onBack={() => setQuizView({ mode: 'list', quizId: null })}
      />
    );
  }
  // default: list
  return (
    <QuizzesPage
      onAttemptQuiz={(quizId) => setQuizView({ mode: 'attempt', quizId })}
      onReviewQuiz={(quizId) => setQuizView({ mode: 'review', quizId })}
    />
  );
      case 'flashcards':
        return <ComingSoonPage
          title="Flashcards"
          description="Spaced-repetition flashcards generated from your uploads. Master concepts faster."
          eta="Coming Soon"
        />;

      case 'chat':
        return <ComingSoonPage
          title="Doubt Chat"
          description="Chat with your notes and textbooks. Upload a PDF, ask anything — get AI-powered answers grounded in your material."
          eta="Building Now"
        />;

      case 'grade':
        return <ComingSoonPage
          title="Grade My Answer"
          description="Upload a photo of your handwritten answer. AI compares it against the correct solution and grades it with detailed feedback."
          eta="Coming Soon"
        />;

      case 'analytics':
        return <ComingSoonPage
          title="Performance Analytics"
          description="See your weakest topics, track progress over time, and get a personalized list of questions to practice."
          eta="Coming Soon"
        />;

      case 'groups':
        return <ComingSoonPage
          title="Study Groups"
          description="Form study groups with classmates. Share papers, notes, and annotations. Learn together."
          eta="Future"
        />;

      default:
        return <ComingSoonPage title="Not found" description="This page doesn't exist." />;
    }
  };

  const meta = PAGE_META[activeView] || {};

  return (
    <Layout
      activeView={activeView}
      onNavigate={navigate}
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
      breadcrumb={meta.breadcrumb}
    >
      {renderPage()}
    </Layout>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const s = {
  errorBanner: {
    padding: '12px 16px', borderRadius: 14,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#f87171', fontSize: 13,
    fontFamily: 'monospace', marginBottom: 16,
  },
  successBanner: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
    padding: 18,
    background: 'rgba(34,197,94,0.08)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 18, marginBottom: 18,
  },
  successLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  successCheck: {
    width: 38, height: 38, borderRadius: '50%',
    background: '#22c55e', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700,
  },
  successTitle: { margin: 0, color: '#4ade80', fontWeight: 700, fontSize: 15 },
  successSub:   { margin: '4px 0 0', color: '#86efac', fontSize: 12, fontFamily: 'monospace' },

  primaryBtn: {
    padding: '11px 18px', background: '#e8ff47',
    color: '#0a0a0f', border: 'none', borderRadius: 12,
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
    fontFamily: 'inherit',
  },

  historyTopBar: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 18,
  },
  historyMeta: { fontSize: 12, color: '#6b6b80', fontFamily: 'monospace' },
  refreshBtn: {
    padding: '8px 14px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.04)',
    color: '#f0f0f8', fontWeight: 600, fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  cardList: { display: 'flex', flexDirection: 'column', gap: 14 },

  emptyState: {
    textAlign: 'center', padding: '70px 24px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px dashed rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: 700, marginBottom: 10, color: '#f0f0f8' },
  emptySub: {
    color: '#6b6b80', fontSize: 14, lineHeight: 1.7,
    maxWidth: 340, margin: '0 auto 28px',
  },
};