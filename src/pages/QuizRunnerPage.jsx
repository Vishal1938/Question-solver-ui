// src/pages/QuizRunnerPage.jsx
import { useState, useEffect, useRef } from 'react';
import MathText from '../components/MathText';
import { getQuizForAttempt, submitQuiz } from '../api/quizapi';

export default function QuizRunnerPage({ quizId, onComplete, onBack }) {
  const [quiz, setQuiz]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [answers, setAnswers]   = useState({});      // quizQuestionId → selectedOption
  const [current, setCurrent]   = useState(0);       // current question index
  const [submitting, setSubmitting] = useState(false);

  // Timer
  const [timed, setTimed]       = useState(false);
  const [started, setStarted]   = useState(false);
  const [elapsed, setElapsed]   = useState(0);        // seconds
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // ── Load quiz ────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    getQuizForAttempt(quizId)
      .then(setQuiz)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [quizId]);

  // ── Timer tick ───────────────────────────────────────────────
  useEffect(() => {
    if (started) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [started]);

  const selectOption = (qId, optIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const answerArray = quiz.questions.map(q => ({
        quizQuestionId: q.quizQuestionId,
        selectedOption: answers[q.quizQuestionId] ?? null,
      }));
      const result = await submitQuiz(quizId, answerArray, elapsed);
      onComplete(result);   // parent shows the result page
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div style={s.centered}><span style={s.spinner} /> Loading quiz…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>;
  }
  if (error) {
    return (
      <div style={s.centered}>
        <div style={s.errorBanner}>⚠ {error}</div>
        <button style={s.backBtn} onClick={onBack}>← Back to quizzes</button>
      </div>
    );
  }

  // ── Pre-start screen — choose timed / untimed ────────────────
  if (!started) {
    return (
      <div style={s.startScreen}>
        <div style={s.startIcon}>🧩</div>
        <h2 style={s.startTitle}>{quiz.title}</h2>
        <div style={s.startMeta}>{quiz.questionCount} questions
          {quiz.subject ? ` · ${quiz.subject}` : ''}</div>

        <div style={s.modeRow}>
          <button
            style={{ ...s.modeBtn, ...(!timed ? s.modeBtnActive : {}) }}
            onClick={() => setTimed(false)}
          >
            <div style={s.modeLabel}>Untimed</div>
            <div style={s.modeDesc}>Take your time</div>
          </button>
          <button
            style={{ ...s.modeBtn, ...(timed ? s.modeBtnActive : {}) }}
            onClick={() => setTimed(true)}
          >
            <div style={s.modeLabel}>Timed</div>
            <div style={s.modeDesc}>Track your speed</div>
          </button>
        </div>

        <button style={s.startBtn} onClick={() => setStarted(true)}>
          Start Quiz →
        </button>
        <button style={s.backBtnPlain} onClick={onBack}>Cancel</button>
      </div>
    );
  }

  // ── Active quiz ──────────────────────────────────────────────
  const q = quiz.questions[current];
  const answeredCount = Object.keys(answers).length;
  const isLast = current === quiz.questions.length - 1;

  return (
    <div>
      {/* Top bar — progress + timer */}
      <div style={s.topBar}>
        <div style={s.progress}>
          Question {current + 1} of {quiz.questions.length}
          <span style={s.answeredNote}>· {answeredCount} answered</span>
        </div>
        {timed && <div style={s.timer}>⏱ {fmtTime(elapsed)}</div>}
      </div>

      {/* Progress bar */}
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill,
                      width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div style={s.qCard}>
        <div style={s.qNum}>Q{q.questionNumber}</div>
        <MathText style={s.qText}>{q.text}</MathText>

        <div style={s.options}>
          {q.options.map((opt, i) => {
            const selected = answers[q.quizQuestionId] === i;
            return (
              <button
                key={i}
                style={{ ...s.option, ...(selected ? s.optionSelected : {}) }}
                onClick={() => selectOption(q.quizQuestionId, i)}
              >
                <span style={{ ...s.optLetter, ...(selected ? s.optLetterSelected : {}) }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <MathText>{opt}</MathText>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={s.navRow}>
        <button
          style={{ ...s.navBtn, opacity: current === 0 ? 0.4 : 1 }}
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          ← Previous
        </button>

        {isLast ? (
          <button
            style={{ ...s.submitBtn, opacity: submitting ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit Quiz'}
          </button>
        ) : (
          <button style={s.navBtnPrimary} onClick={() => setCurrent(c => c + 1)}>
            Next →
          </button>
        )}
      </div>

      {/* Question jump grid */}
      <div style={s.jumpGrid}>
        {quiz.questions.map((qq, i) => {
          const answered = answers[qq.quizQuestionId] !== undefined;
          return (
            <button
              key={qq.quizQuestionId}
              style={{
                ...s.jumpBtn,
                ...(i === current ? s.jumpCurrent : {}),
                ...(answered ? s.jumpAnswered : {}),
              }}
              onClick={() => setCurrent(i)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Submit shortcut always available */}
      {!isLast && (
        <div style={s.submitShortcut}>
          <button
            style={{ ...s.submitBtn, opacity: submitting ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : `Submit Quiz (${answeredCount}/${quiz.questions.length} answered)`}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const s = {
  centered: { textAlign: 'center', padding: '80px 24px', color: '#6b6b80',
              fontFamily: 'monospace', fontSize: 13 },
  spinner: { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)',
             borderTopColor: '#e8ff47', borderRadius: '50%',
             animation: 'spin 0.7s linear infinite', display: 'inline-block', marginRight: 8 },
  errorBanner: { padding: '12px 16px', marginBottom: 16, background: 'rgba(239,68,68,0.1)',
                 border: '1px solid rgba(239,68,68,0.25)', color: '#f87171',
                 borderRadius: 10, fontSize: 13 },
  backBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f8',
             padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' },

  // Start screen
  startScreen: { textAlign: 'center', padding: '50px 24px', maxWidth: 480, margin: '0 auto' },
  startIcon: { fontSize: 40, marginBottom: 16 },
  startTitle: { fontSize: 22, fontWeight: 800, color: '#f0f0f8', margin: '0 0 8px' },
  startMeta: { fontSize: 13, color: '#9ca3af', marginBottom: 28 },
  modeRow: { display: 'flex', gap: 10, marginBottom: 24 },
  modeBtn: { flex: 1, padding: '16px', background: 'rgba(255,255,255,0.04)',
             border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
             cursor: 'pointer', fontFamily: 'inherit', color: '#f0f0f8' },
  modeBtnActive: { background: 'rgba(232,255,71,0.1)', border: '1px solid rgba(232,255,71,0.4)' },
  modeLabel: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  modeDesc: { fontSize: 11, color: '#6b6b80', fontFamily: 'monospace' },
  startBtn: { width: '100%', padding: '14px', background: '#e8ff47', color: '#0a0a0f',
              border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15,
              cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 },
  backBtnPlain: { background: 'none', border: 'none', color: '#6b6b80',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },

  // Active quiz
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progress: { fontSize: 13, color: '#9ca3af', fontWeight: 600 },
  answeredNote: { color: '#6b6b80', fontWeight: 400, marginLeft: 4 },
  timer: { fontSize: 14, fontWeight: 700, color: '#e8ff47', fontFamily: 'monospace' },
  progressTrack: { height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2,
                   marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#e8ff47', transition: 'width 0.3s' },

  qCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
           borderRadius: 16, padding: 24, marginBottom: 18 },
  qNum: { fontSize: 13, fontWeight: 800, color: '#e8ff47', fontFamily: 'monospace', marginBottom: 12 },
  qText: { fontSize: 16, color: '#f0f0f8', lineHeight: 1.6, marginBottom: 20 },
  options: { display: 'flex', flexDirection: 'column', gap: 10 },
  option: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, cursor: 'pointer', textAlign: 'left',
            color: '#d1d5db', fontFamily: 'inherit', fontSize: 14, transition: 'all 0.15s' },
  optionSelected: { background: 'rgba(232,255,71,0.1)', border: '1px solid rgba(232,255,71,0.5)',
                    color: '#f0f0f8' },
  optLetter: { width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               fontSize: 13, fontWeight: 700, flexShrink: 0 },
  optLetterSelected: { background: '#e8ff47', color: '#0a0a0f' },

  navRow: { display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  navBtn: { padding: '11px 20px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f0f0f8',
            fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  navBtnPrimary: { padding: '11px 24px', background: '#e8ff47', color: '#0a0a0f',
                   border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13,
                   cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn: { padding: '11px 24px', background: '#22c55e', color: '#fff',
               border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13,
               cursor: 'pointer', fontFamily: 'inherit' },

  jumpGrid: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  jumpBtn: { width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.04)',
             border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af',
             fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace' },
  jumpCurrent: { border: '1px solid #e8ff47', color: '#e8ff47' },
  jumpAnswered: { background: 'rgba(232,255,71,0.12)', color: '#e8ff47' },

  submitShortcut: { textAlign: 'center', paddingTop: 8,
                    borderTop: '1px solid rgba(255,255,255,0.05)' },
};