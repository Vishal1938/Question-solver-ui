// src/pages/QuizzesPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { generateQuiz, getQuizStatus, getMyQuizzes, deleteQuiz } from '../api/quizapi';

export default function QuizzesPage({ onAttemptQuiz, onReviewQuiz }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Upload state
  const [file, setFile]           = useState(null);
  const [title, setTitle]         = useState('');
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus]   = useState('');   // status text during generation
  const [genError, setGenError]     = useState('');
  const [dragging, setDragging]     = useState(false);
  const inputRef = useRef();
  const pollRef  = useRef(null);

  // ── Load archive ─────────────────────────────────────────────
  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      setQuizzes(await getMyQuizzes());
      setError('');
    } catch {
      setError('Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuizzes();
    return () => clearInterval(pollRef.current);
  }, [loadQuizzes]);

  // ── Upload + generate ────────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleGenerate = async () => {
    if (!file) return;
    setGenerating(true);
    setGenError('');
    setGenStatus('Uploading…');
    try {
      const { jobId } = await generateQuiz(file, title);
      setGenStatus('Extracting MCQs…');
      pollRef.current = setInterval(async () => {
        try {
          const st = await getQuizStatus(jobId);
          if (st.status === 'DONE') {
            clearInterval(pollRef.current);
            setGenerating(false);
            setGenStatus('');
            setFile(null);
            setTitle('');
            loadQuizzes();
          } else if (st.status === 'FAILED') {
            clearInterval(pollRef.current);
            setGenerating(false);
            setGenStatus('');
            setGenError(st.error || 'Extraction failed.');
          } else {
            setGenStatus('Extracting MCQs…');
          }
        } catch {
          clearInterval(pollRef.current);
          setGenerating(false);
          setGenError('Lost connection while extracting.');
        }
      }, 3000);
    } catch (e) {
      setGenerating(false);
      setGenStatus('');
      setGenError(e.message);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Delete this quiz?')) return;
    try {
      await deleteQuiz(quizId);
      setQuizzes(prev => prev.filter(q => q.quizId !== quizId));
    } catch {
      setError('Delete failed.');
    }
  };

  return (
    <div>
      {/* Upload card */}
      <div style={s.uploadCard}>
        <div style={s.uploadTitle}>Create a quiz from an MCQ paper</div>
        <div style={s.uploadSub}>
          Upload a multiple-choice question paper. We'll extract the questions,
          options, and answers into an interactive quiz.
        </div>

        <div
          style={{ ...s.dropzone, ...(dragging ? s.dropzoneActive : {}), ...(file ? s.dropzoneFilled : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !generating && inputRef.current.click()}
        >
          <input ref={inputRef} type="file" accept=".pdf,.docx,.txt"
                 style={{ display: 'none' }}
                 onChange={(e) => setFile(e.target.files[0])} />
          <div style={s.dropIcon}>🧩</div>
          {file ? (
            <div style={s.fileName}>{file.name}</div>
          ) : (
            <>
              <div style={s.dropText}>Drag MCQ paper or click to browse</div>
              <div style={s.dropSub}>PDF · DOCX · TXT</div>
            </>
          )}
        </div>

        {file && !generating && (
          <input style={s.titleInput} placeholder="Quiz title (optional)"
                 value={title} onChange={(e) => setTitle(e.target.value)} />
        )}

        {genError && <div style={s.genError}>⚠ {genError}</div>}

        <button
          style={{ ...s.generateBtn, opacity: (!file || generating) ? 0.5 : 1,
                   cursor: (!file || generating) ? 'not-allowed' : 'pointer' }}
          onClick={handleGenerate}
          disabled={!file || generating}
        >
          {generating
            ? <><span style={s.spinner} /> {genStatus}</>
            : 'Create Quiz'}
        </button>
      </div>

      {/* Archive */}
      <div style={s.archiveHeader}>
        <div style={s.archiveTitle}>Your Quizzes</div>
        <button style={s.refreshBtn} onClick={loadQuizzes}>↻ Refresh</button>
      </div>

      {error && <div style={s.error}>⚠ {error}</div>}

      {loading ? (
        <div style={s.loading}><span style={s.spinner} /> Loading…</div>
      ) : quizzes.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🧩</div>
          <div style={s.emptyTitle}>No quizzes yet</div>
          <div style={s.emptySub}>Upload an MCQ paper above to create your first quiz.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {quizzes.map(q => (
            <QuizCard key={q.quizId} quiz={q}
                      onAttempt={() => onAttemptQuiz(q.quizId)}
                      onReview={() => onReviewQuiz(q.quizId)}
                      onDelete={() => handleDelete(q.quizId)} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function QuizCard({ quiz, onAttempt, onReview, onDelete }) {
  const done = quiz.status === 'COMPLETED';
  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div style={s.cardTitle}>{quiz.title}</div>
        <button style={s.deleteBtn} onClick={onDelete} title="Delete">✕</button>
      </div>
      <div style={s.cardMeta}>
        <span>{quiz.questionCount} questions</span>
        {quiz.subject && <><span style={s.dot}>·</span><span>{quiz.subject}</span></>}
      </div>

      {done ? (
        <>
          <div style={s.scoreRow}>
            <span style={s.scoreBig}>{Math.round(quiz.score)}%</span>
            <span style={s.scoreSub}>{quiz.correctCount}/{quiz.questionCount} correct</span>
          </div>
          <button style={s.reviewBtn} onClick={onReview}>Review answers →</button>
        </>
      ) : (
        <button style={s.attemptBtn} onClick={onAttempt}>Attempt quiz →</button>
      )}
    </div>
  );
}

const s = {
  uploadCard: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18, padding: 24, marginBottom: 28,
  },
  uploadTitle: { fontSize: 18, fontWeight: 800, color: '#f0f0f8', marginBottom: 6 },
  uploadSub: { fontSize: 12, color: '#6b6b80', fontFamily: 'monospace', lineHeight: 1.6, marginBottom: 18 },
  dropzone: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '32px 20px', border: '1.5px dashed rgba(255,255,255,0.15)',
    borderRadius: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s',
  },
  dropzoneActive: { borderColor: '#e8ff47', background: 'rgba(232,255,71,0.05)' },
  dropzoneFilled: { borderStyle: 'solid', borderColor: 'rgba(232,255,71,0.4)', background: 'rgba(232,255,71,0.04)' },
  dropIcon: { fontSize: 28, marginBottom: 10 },
  fileName: { fontSize: 14, fontWeight: 600, color: '#f0f0f8' },
  dropText: { fontSize: 14, color: '#d1d5db', marginBottom: 4 },
  dropSub: { fontSize: 11, color: '#6b6b80', fontFamily: 'monospace' },
  titleInput: {
    width: '100%', boxSizing: 'border-box', marginTop: 12, padding: '11px 14px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, color: '#f0f0f8', fontSize: 13, fontFamily: 'monospace', outline: 'none',
  },
  genError: {
    marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)', color: '#f87171',
    borderRadius: 10, fontSize: 12, fontFamily: 'monospace',
  },
  generateBtn: {
    width: '100%', marginTop: 16, padding: '14px',
    background: '#e8ff47', color: '#0a0a0f', border: 'none', borderRadius: 12,
    fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  spinner: {
    width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0a0a0f',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },

  archiveHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  archiveTitle: { fontSize: 16, fontWeight: 700, color: '#f0f0f8' },
  refreshBtn: {
    padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.04)', color: '#f0f0f8', fontWeight: 600,
    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },
  error: {
    padding: '10px 14px', marginBottom: 16, background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 10, fontSize: 13,
  },
  loading: { padding: '30px', textAlign: 'center', color: '#6b6b80', fontFamily: 'monospace', fontSize: 13 },

  empty: {
    textAlign: 'center', padding: '50px 24px', background: 'rgba(255,255,255,0.03)',
    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 18,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: '#f0f0f8', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#6b6b80' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 },
  card: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#f0f0f8', lineHeight: 1.4 },
  deleteBtn: {
    background: 'none', border: 'none', color: '#6b6b80', cursor: 'pointer',
    fontSize: 13, flexShrink: 0, padding: 0,
  },
  cardMeta: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9ca3af' },
  dot: { color: '#4b5563' },
  scoreRow: { display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 },
  scoreBig: { fontSize: 24, fontWeight: 800, color: '#e8ff47' },
  scoreSub: { fontSize: 11, color: '#6b6b80', fontFamily: 'monospace' },
  attemptBtn: {
    marginTop: 4, padding: '10px', background: '#e8ff47', color: '#0a0a0f',
    border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  reviewBtn: {
    marginTop: 4, padding: '10px', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f8',
    borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  },
};