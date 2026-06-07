// src/components/ResultsView.jsx
import { useState, useEffect } from 'react';
import MathText from './MathText';

const BASE = process.env.REACT_APP_API_BASE_URL;

const TYPE_COLORS = {
  MCQ:          { bg: 'rgba(99,102,241,0.15)',  text: '#a5b4fc' },
  short_answer: { bg: 'rgba(34,197,94,0.15)',   text: '#86efac' },
  descriptive:  { bg: 'rgba(249,115,22,0.15)',  text: '#fdba74' },
  numerical:    { bg: 'rgba(168,85,247,0.15)',  text: '#d8b4fe' },
  true_false:   { bg: 'rgba(244,63,94,0.15)',   text: '#fda4af' },
  fill_blank:   { bg: 'rgba(14,165,233,0.15)',  text: '#7dd3fc' },
};

const DIFFICULTY_COLORS = {
  easy:   { text: '#86efac' },
  medium: { text: '#fdba74' },
  hard:   { text: '#fda4af' },
};

/**
 * Renders the structured Q&A for a completed solve job, inline, with math
 * rendered via KaTeX (MathText). Fetches from /api/solver/result/{jobId}/questions.
 */
export default function ResultsView({ jobId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [expanded, setExpanded]   = useState(new Set());

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    const token = sessionStorage.getItem('jwt_token');
    fetch(`${BASE}/api/solver/result/${jobId}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load questions');
        return res.json();
      })
      .then(data => {
        setQuestions(data);
        // Expand all answers by default — this is the user's own result
        setExpanded(new Set(data.map(q => q.questionId)));
      })
      .catch(() => setError('Could not load the inline view.'))
      .finally(() => setLoading(false));
  }, [jobId]);

  const toggle = (qId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  };

  const toggleAll = () => {
    if (expanded.size === questions.length) setExpanded(new Set());
    else setExpanded(new Set(questions.map(q => q.questionId)));
  };

  if (loading) {
    return (
      <div style={s.loading}>
        <span style={s.spinner} /> Loading your answers…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) return <div style={s.error}>⚠ {error}</div>;
  if (questions.length === 0) return null;   // nothing to show (e.g. legacy job)

  const allExpanded = expanded.size === questions.length;

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.headerTitle}>
          {questions.length} question{questions.length > 1 ? 's' : ''} answered
        </div>
        <button style={s.toggleAll} onClick={toggleAll}>
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div style={s.list}>
        {questions.map((q, idx) => {
          const typeColor = TYPE_COLORS[q.type] || TYPE_COLORS.short_answer;
          const diffColor = DIFFICULTY_COLORS[q.difficulty] || {};
          const show = expanded.has(q.questionId);

          return (
            <div key={q.questionId} style={s.card}>
              <div style={s.qHead}>
                <span style={s.qNum}>Q{idx + 1}</span>
                <div style={s.badges}>
                  {q.type && (
                    <span style={{ ...s.badge, background: typeColor.bg, color: typeColor.text }}>
                      {q.type}
                    </span>
                  )}
                  {q.topic && <span style={s.topicBadge}>{q.topic}</span>}
                  {q.difficulty && (
                    <span style={{ ...s.diffBadge, color: diffColor.text }}>{q.difficulty}</span>
                  )}
                </div>
              </div>

              <MathText style={s.qText}>{q.text}</MathText>

              {q.options && q.options.length > 0 && (
                <div style={s.options}>
                  {q.options.map((opt, i) => (
                    <div key={i} style={{
                      ...s.option,
                      ...(show && i === q.correctOption ? s.optionCorrect : {}),
                    }}>
                      <span style={s.optLetter}>{String.fromCharCode(65 + i)}</span>
                      <MathText>{opt}</MathText>
                      {show && i === q.correctOption && <span style={s.correctMark}>✓</span>}
                    </div>
                  ))}
                </div>
              )}

              <button style={s.answerToggle} onClick={() => toggle(q.questionId)}>
                {show ? '▲ Hide answer' : '▼ Show answer'}
              </button>

              {show && q.expectedAnswer && (
                <MathText style={s.answer}>{q.expectedAnswer}</MathText>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  wrap: { marginTop: 18 },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: { fontSize: 14, fontWeight: 700, color: '#f0f0f8' },
  toggleAll: {
    padding: '7px 14px', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    color: '#f0f0f8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit',
  },

  loading: { padding: '30px', textAlign: 'center', color: '#6b6b80',
             fontFamily: 'monospace', fontSize: 13 },
  spinner: {
    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)',
    borderTopColor: '#e8ff47', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', display: 'inline-block',
    marginRight: 8, verticalAlign: 'middle',
  },
  error: {
    padding: '12px 16px', background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)', color: '#f87171',
    borderRadius: 10, fontSize: 13,
  },

  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 18,
  },
  qHead: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  qNum: { fontSize: 13, fontWeight: 800, color: '#e8ff47', fontFamily: 'monospace' },
  badges: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  badge: {
    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  topicBadge: {
    fontSize: 10, fontWeight: 500, padding: '3px 8px',
    background: 'rgba(255,255,255,0.06)', color: '#9ca3af', borderRadius: 5,
  },
  diffBadge: {
    fontSize: 10, fontWeight: 600, padding: '3px 8px',
    background: 'rgba(255,255,255,0.04)', borderRadius: 5, textTransform: 'capitalize',
  },
  qText: { fontSize: 14, color: '#f0f0f8', lineHeight: 1.6, marginBottom: 12 },

  options: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
  option: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
    borderRadius: 8, background: 'rgba(255,255,255,0.03)',
    fontSize: 13, color: '#d1d5db',
  },
  optionCorrect: {
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.3)', color: '#86efac',
  },
  optLetter: {
    width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  correctMark: { marginLeft: 'auto', color: '#22c55e', fontWeight: 700 },

  answerToggle: {
    background: 'none', border: 'none', color: '#e8ff47',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
  },
  answer: {
    marginTop: 12, padding: '14px 16px',
    background: 'rgba(232,255,71,0.04)',
    border: '1px solid rgba(232,255,71,0.12)',
    borderRadius: 10, fontSize: 13, color: '#d1d5db', lineHeight: 1.7,
  },
};