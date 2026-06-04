// src/pages/PaperDetailPage.jsx
import { useState, useEffect } from 'react';
import { getPaper, downloadPaper } from '../api/papersapi';

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

export default function PaperDetailPage({ paperId, onBack }) {
  const [paper, setPaper]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [downloading, setDownloading] = useState(false);
  const [expandedQ, setExpandedQ] = useState(new Set());  // which answers are shown

  useEffect(() => {
    setLoading(true);
    getPaper(paperId)
      .then(setPaper)
      .catch(() => setError('Failed to load paper.'))
      .finally(() => setLoading(false));
  }, [paperId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPaper(paperId, paper?.title);
    } catch {
      setError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const toggleAnswer = (qId) => {
    setExpandedQ(prev => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  };

  const toggleAll = () => {
    if (!paper) return;
    if (expandedQ.size === paper.questions.length) {
      setExpandedQ(new Set());
    } else {
      setExpandedQ(new Set(paper.questions.map(q => q.questionId)));
    }
  };

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.centered}>
        <span style={s.bigSpinner} />
        <div style={s.loadingText}>Loading paper…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div style={s.centered}>
        <div style={s.errorBanner}>⚠ {error || 'Paper not found'}</div>
        <button style={s.backBtn} onClick={onBack}>← Back to archive</button>
      </div>
    );
  }

  const allExpanded = expandedQ.size === paper.questions.length;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div>
      {/* Back */}
      <button style={s.backBtn} onClick={onBack}>← Back to archive</button>

      {/* Header card */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <span style={s.boardBadge}>{paper.board}</span>
          <span style={s.yearBadge}>{paper.year}</span>
        </div>
        <h1 style={s.title}>{paper.title}</h1>
        <div style={s.metaRow}>
          <span>Class {paper.classLevel}</span>
          <span style={s.metaDot}>·</span>
          <span>{paper.subject}</span>
          <span style={s.metaDot}>·</span>
          <span>{paper.questionCount} questions</span>
          {paper.totalMarks && (<><span style={s.metaDot}>·</span><span>{paper.totalMarks} marks</span></>)}
          {paper.durationMinutes && (<><span style={s.metaDot}>·</span><span>{paper.durationMinutes} min</span></>)}
        </div>

        <div style={s.headerActions}>
          <button
            style={{ ...s.downloadBtn, opacity: downloading ? 0.6 : 1 }}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Downloading…' : '↓ Download Answer PDF'}
          </button>
          <button style={s.toggleAllBtn} onClick={toggleAll}>
            {allExpanded ? 'Hide all answers' : 'Show all answers'}
          </button>
        </div>
      </div>

      {/* Questions list */}
      <div style={s.questionList}>
        {paper.questions.map((q, idx) => {
          const typeColor = TYPE_COLORS[q.type] || TYPE_COLORS.short_answer;
          const diffColor = DIFFICULTY_COLORS[q.difficulty] || {};
          const showAnswer = expandedQ.has(q.questionId);

          return (
            <div key={q.questionId} style={s.qCard}>
              {/* Question header */}
              <div style={s.qHeader}>
                <span style={s.qNum}>Q{idx + 1}</span>
                <div style={s.qBadges}>
                  <span style={{ ...s.typeBadge, background: typeColor.bg, color: typeColor.text }}>
                    {q.type}
                  </span>
                  {q.topic && <span style={s.topicBadge}>{q.topic}</span>}
                  {q.difficulty && (
                    <span style={{ ...s.diffBadge, color: diffColor.text }}>
                      {q.difficulty}
                    </span>
                  )}
                  {q.marks && <span style={s.marksBadge}>{q.marks}m</span>}
                </div>
              </div>

              {/* Question text */}
              <div style={s.qText}>{q.text}</div>

              {/* MCQ options */}
              {q.options && q.options.length > 0 && (
                <div style={s.options}>
                  {q.options.map((opt, i) => (
                    <div key={i} style={{
                      ...s.option,
                      ...(showAnswer && i === q.correctOption ? s.optionCorrect : {}),
                    }}>
                      <span style={s.optionLetter}>{String.fromCharCode(65 + i)}</span>
                      {opt}
                      {showAnswer && i === q.correctOption && <span style={s.correctMark}>✓</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Answer toggle */}
              <button style={s.answerToggle} onClick={() => toggleAnswer(q.questionId)}>
                {showAnswer ? '▲ Hide answer' : '▼ Show answer'}
              </button>

              {/* Answer */}
              {showAnswer && q.expectedAnswer && (
                <div style={s.answer}>{q.expectedAnswer}</div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const s = {
  centered: { textAlign: 'center', padding: '80px 24px' },
  bigSpinner: {
    width: 32, height: 32,
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#e8ff47', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  loadingText: { marginTop: 14, color: '#6b6b80', fontFamily: 'monospace', fontSize: 13 },

  backBtn: {
    background: 'none', border: 'none', color: '#9ca3af',
    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
    marginBottom: 16, padding: 0,
  },

  header: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18, padding: 24, marginBottom: 20,
  },
  headerTop: { display: 'flex', gap: 8, marginBottom: 12 },
  boardBadge: {
    fontSize: 11, fontWeight: 700, padding: '4px 10px',
    background: 'rgba(232,255,71,0.12)', color: '#e8ff47',
    borderRadius: 6, fontFamily: 'monospace',
  },
  yearBadge: {
    fontSize: 11, fontWeight: 600, padding: '4px 10px',
    background: 'rgba(255,255,255,0.06)', color: '#9ca3af',
    borderRadius: 6, fontFamily: 'monospace',
  },
  title: { fontSize: 24, fontWeight: 800, color: '#f0f0f8', margin: '0 0 12px' },
  metaRow: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    fontSize: 13, color: '#9ca3af', marginBottom: 20,
  },
  metaDot: { color: '#4b5563' },
  headerActions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  downloadBtn: {
    padding: '11px 20px', background: '#e8ff47', color: '#0a0a0f',
    border: 'none', borderRadius: 12, fontWeight: 700,
    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  },
  toggleAllBtn: {
    padding: '11px 20px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#f0f0f8',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit',
  },

  questionList: { display: 'flex', flexDirection: 'column', gap: 12 },
  qCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 18,
  },
  qHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  qNum: {
    fontSize: 13, fontWeight: 800, color: '#e8ff47',
    fontFamily: 'monospace',
  },
  qBadges: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  typeBadge: {
    fontSize: 10, fontWeight: 600, padding: '3px 8px',
    borderRadius: 5, textTransform: 'uppercase', letterSpacing: 0.3,
  },
  topicBadge: {
    fontSize: 10, fontWeight: 500, padding: '3px 8px',
    background: 'rgba(255,255,255,0.06)', color: '#9ca3af',
    borderRadius: 5,
  },
  diffBadge: {
    fontSize: 10, fontWeight: 600, padding: '3px 8px',
    background: 'rgba(255,255,255,0.04)', borderRadius: 5,
    textTransform: 'capitalize',
  },
  marksBadge: {
    fontSize: 10, fontWeight: 600, padding: '3px 8px',
    background: 'rgba(255,255,255,0.06)', color: '#6b6b80',
    borderRadius: 5, fontFamily: 'monospace',
  },
  qText: { fontSize: 14, color: '#f0f0f8', lineHeight: 1.6, marginBottom: 12 },

  options: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
  option: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    fontSize: 13, color: '#d1d5db',
  },
  optionCorrect: {
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.3)',
    color: '#86efac',
  },
  optionLetter: {
    width: 20, height: 20, borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  correctMark: { marginLeft: 'auto', color: '#22c55e', fontWeight: 700 },

  answerToggle: {
    background: 'none', border: 'none', color: '#e8ff47',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', padding: 0,
  },
  answer: {
    marginTop: 12, padding: '14px 16px',
    background: 'rgba(232,255,71,0.04)',
    border: '1px solid rgba(232,255,71,0.12)',
    borderRadius: 10, fontSize: 13,
    color: '#d1d5db', lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
  },

  errorBanner: {
    padding: '12px 16px', marginBottom: 16,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#f87171', borderRadius: 10, fontSize: 13,
  },
};