import { getDownloadUrl } from '../api/solverapi';
import { useState } from 'react';

const TYPE_COLORS = {
  MCQ:          { bg: '#E6F1FB', text: '#0C447C' },
  short_answer: { bg: '#EAF3DE', text: '#27500A' },
  descriptive:  { bg: '#EEEDFE', text: '#3C3489' },
  numerical:    { bg: '#FAEEDA', text: '#633806' },
};

export default function ResultsCard({ job, results }) {
  const [view, setView] = useState('results');

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    alert('JSON copied!');
  };

  if (!results) return null;

  return (
    <div style={styles.card}>
      <div style={styles.meta}>
        <span>File: {results.fileName}</span>
        <span>Questions: {results.totalQuestions}</span>
        <span>Time: {(results.processingTimeMs / 1000).toFixed(1)}s</span>
      </div>

      <div style={styles.tabs}>
        {['results', 'json'].map(t => (
          <button key={t} style={{ ...styles.tab, ...(view === t ? styles.tabActive : {}) }} onClick={() => setView(t)}>
            {t === 'results' ? `Results (${results.totalQuestions})` : 'JSON'}
          </button>
        ))}
      </div>

      {view === 'results' && (
        <div>
          {results.questions.map((qa) => {
            const c = TYPE_COLORS[qa.type] || TYPE_COLORS.short_answer;
            return (
              <div key={qa.id} style={styles.qaItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={styles.qNum}>Q{qa.id}</span>
                  <span style={{ ...styles.badge, background: c.bg, color: c.text }}>{qa.type}</span>
                </div>
                <p style={styles.question}>{qa.question}</p>
                <p style={styles.answer}>{qa.answer}</p>
              </div>
            );
          })}
        </div>
      )}

      {view === 'json' && (
        <pre style={styles.json}>
          {JSON.stringify(results, null, 2)}
        </pre>
      )}

      <div style={styles.actions}>
        <a href={getDownloadUrl(job.jobId)} target="_blank" rel="noreferrer" style={styles.btnSecondary}>
          Download PDF
        </a>
        <button style={styles.btnSecondary} onClick={copyJson}>
          Copy JSON
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' },
  meta: { display: 'flex', gap: 16, fontSize: 12, color: '#aaa', marginBottom: '1rem' },
  tabs: { display: 'flex', gap: 4, marginBottom: '1rem' },
  tab: { padding: '6px 14px', fontSize: 13, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#888' },
  tabActive: { background: '#f5f5f5', fontWeight: 600, color: '#111' },
  qaItem: { padding: '1rem 0', borderBottom: '0.5px solid #f0f0f0' },
  qNum: { fontSize: 12, fontWeight: 600, color: '#aaa' },
  badge: { fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20 },
  question: { fontSize: 14, fontWeight: 500, color: '#111', margin: '0 0 6px' },
  answer: { fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0 },
  json: { background: '#fafafa', borderRadius: 8, padding: '1rem', fontSize: 12, overflow: 'auto', maxHeight: 400 },
  actions: { display: 'flex', gap: 8, marginTop: '1rem', paddingTop: '1rem', borderTop: '0.5px solid #f0f0f0' },
  btnSecondary: { padding: '7px 16px', fontSize: 13, background: 'transparent', border: '0.5px solid #ddd', borderRadius: 8, color: '#555', cursor: 'pointer', textDecoration: 'none' },
};