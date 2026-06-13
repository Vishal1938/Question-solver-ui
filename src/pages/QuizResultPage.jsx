// src/pages/QuizResultPage.jsx
import { useState, useEffect } from 'react';
import MathText from '../components/MathText';
import { getQuizResult } from '../api/quizapi';

/**
 * Shows a quiz result. Accepts either a `result` object passed directly
 * (right after submit) or fetches by quizId (when reviewing later).
 */
export default function QuizResultPage({ quizId, result: passedResult, onBack }) {
  const [result, setResult] = useState(passedResult || null);
  const [loading, setLoading] = useState(!passedResult);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (passedResult) return;   // already have it from submit
    setLoading(true);
    getQuizResult(quizId)
      .then(setResult)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [quizId, passedResult]);

  if (loading) {
    return <div style={s.centered}><span style={s.spinner} /> Loading result…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>;
  }
  if (error || !result) {
    return (
      <div style={s.centered}>
        <div style={s.errorBanner}>⚠ {error || 'Result not found'}</div>
        <button style={s.backBtn} onClick={onBack}>← Back to quizzes</button>
      </div>
    );
  }

  const pct = Math.round(result.score);
  const scoreColor = pct >= 70 ? '#4ade80' : pct >= 40 ? '#fdba74' : '#f87171';
  const fmtTime = (s) => {
    if (!s) return null;
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <button style={s.backLink} onClick={onBack}>← Back to quizzes</button>

      {/* Score header */}
      <div style={s.scoreCard}>
        <div style={{ ...s.scoreBig, color: scoreColor }}>{pct}%</div>
        <div style={s.scoreDetail}>
          {result.correctCount}/{result.totalQuestions} correct
          {result.timeTakenSec ? ` · ${fmtTime(result.timeTakenSec)}` : ''}
        </div>
        <div style={s.scoreTitle}>{result.title}</div>
      </div>

      {/* Topic breakdown */}
      {result.topicBreakdown && result.topicBreakdown.length > 0 && (
        <div style={s.topicCard}>
          <div style={s.topicHeader}>Topic Breakdown</div>
          {result.topicBreakdown.map(t => {
            const tpct = t.total > 0 ? Math.round((100 * t.correct) / t.total) : 0;
            const barColor = tpct >= 70 ? '#4ade80' : tpct >= 40 ? '#fdba74' : '#f87171';
            return (
              <div key={t.topic} style={s.topicRow}>
                <div style={s.topicName}>{t.topic}</div>
                <div style={s.topicBarTrack}>
                  <div style={{ ...s.topicBarFill, width: `${tpct}%`, background: barColor }} />
                </div>
                <div style={s.topicScore}>{t.correct}/{t.total}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-question review */}
      <div style={s.reviewHeader}>Review</div>
      <div style={s.reviewList}>
        {result.questions.map((q) => {
          const userSkipped = q.selectedOption === null || q.selectedOption === undefined;
          return (
            <div key={q.quizQuestionId} style={s.reviewCard}>
              <div style={s.reviewTop}>
                <span style={s.reviewNum}>Q{q.questionNumber}</span>
                <span style={{
                  ...s.resultBadge,
                  ...(q.isCorrect ? s.badgeCorrect
                       : userSkipped ? s.badgeSkipped : s.badgeWrong),
                }}>
                  {q.isCorrect ? '✓ Correct' : userSkipped ? 'Skipped' : '✕ Wrong'}
                </span>
                {q.topic && <span style={s.topicTag}>{q.topic}</span>}
                {q.answerConfident === false && (
                  <span style={s.uncertainTag} title="AI-determined answer — verify if unsure">
                    AI-determined
                  </span>
                )}
              </div>

              <MathText style={s.reviewQText}>{q.text}</MathText>

              <div style={s.reviewOptions}>
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correctOption;
                  const isUserPick = i === q.selectedOption;
                  return (
                    <div key={i} style={{
                      ...s.reviewOption,
                      ...(isCorrect ? s.optCorrect : {}),
                      ...(isUserPick && !isCorrect ? s.optWrong : {}),
                    }}>
                      <span style={s.reviewOptLetter}>{String.fromCharCode(65 + i)}</span>
                      <MathText>{opt}</MathText>
                      {isCorrect && <span style={s.optMark}>✓ correct</span>}
                      {isUserPick && !isCorrect && <span style={s.optMarkWrong}>your answer</span>}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div style={s.explanation}>
                  <span style={s.explLabel}>Why:</span>{' '}
                  <MathText style={{ display: 'inline' }}>{q.explanation}</MathText>
                </div>
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
  centered: { textAlign: 'center', padding: '80px 24px', color: '#6b6b80',
              fontFamily: 'monospace', fontSize: 13 },
  spinner: { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)',
             borderTopColor: '#e8ff47', borderRadius: '50%',
             animation: 'spin 0.7s linear infinite', display: 'inline-block', marginRight: 8 },
  errorBanner: { padding: '12px 16px', marginBottom: 16, background: 'rgba(239,68,68,0.1)',
                 border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 10, fontSize: 13 },
  backBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f8',
             padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' },
  backLink: { background: 'none', border: 'none', color: '#9ca3af', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16, padding: 0 },

  scoreCard: { textAlign: 'center', padding: '32px 24px', marginBottom: 18,
               background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
               borderRadius: 18 },
  scoreBig: { fontSize: 56, fontWeight: 800, lineHeight: 1 },
  scoreDetail: { fontSize: 14, color: '#9ca3af', marginTop: 8, fontFamily: 'monospace' },
  scoreTitle: { fontSize: 14, color: '#f0f0f8', fontWeight: 600, marginTop: 12 },

  topicCard: { padding: 20, marginBottom: 24, background: 'rgba(255,255,255,0.04)',
               border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 },
  topicHeader: { fontSize: 13, fontWeight: 700, color: '#f0f0f8', marginBottom: 16 },
  topicRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  topicName: { fontSize: 12, color: '#d1d5db', width: 140, flexShrink: 0,
               whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  topicBarTrack: { flex: 1, height: 8, background: 'rgba(255,255,255,0.06)',
                   borderRadius: 4, overflow: 'hidden' },
  topicBarFill: { height: '100%', borderRadius: 4, transition: 'width 0.5s' },
  topicScore: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', width: 40,
                textAlign: 'right', flexShrink: 0 },

  reviewHeader: { fontSize: 16, fontWeight: 700, color: '#f0f0f8', marginBottom: 14 },
  reviewList: { display: 'flex', flexDirection: 'column', gap: 12 },
  reviewCard: { padding: 18, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 },
  reviewTop: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
  reviewNum: { fontSize: 13, fontWeight: 800, color: '#9ca3af', fontFamily: 'monospace' },
  resultBadge: { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                 fontFamily: 'monospace' },
  badgeCorrect: { background: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  badgeWrong: { background: 'rgba(239,68,68,0.15)', color: '#f87171' },
  badgeSkipped: { background: 'rgba(255,255,255,0.06)', color: '#9ca3af' },
  topicTag: { fontSize: 10, padding: '3px 8px', background: 'rgba(255,255,255,0.06)',
              color: '#9ca3af', borderRadius: 5 },
  uncertainTag: { fontSize: 10, padding: '3px 8px', background: 'rgba(249,115,22,0.12)',
                  color: '#fdba74', borderRadius: 5, fontFamily: 'monospace' },
  reviewQText: { fontSize: 14, color: '#f0f0f8', lineHeight: 1.6, marginBottom: 12 },
  reviewOptions: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
  reviewOption: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                  fontSize: 13, color: '#d1d5db' },
  optCorrect: { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' },
  optWrong: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' },
  reviewOptLetter: { width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                     fontSize: 11, fontWeight: 700, flexShrink: 0 },
  optMark: { marginLeft: 'auto', fontSize: 10, color: '#22c55e', fontWeight: 700, fontFamily: 'monospace' },
  optMarkWrong: { marginLeft: 'auto', fontSize: 10, color: '#f87171', fontWeight: 700, fontFamily: 'monospace' },
  explanation: { padding: '12px 14px', background: 'rgba(232,255,71,0.04)',
                 border: '1px solid rgba(232,255,71,0.12)', borderRadius: 10,
                 fontSize: 13, color: '#d1d5db', lineHeight: 1.6 },
  explLabel: { color: '#e8ff47', fontWeight: 700 },
};