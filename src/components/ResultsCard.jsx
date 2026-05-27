// src/components/ResultsCard.js
import { useState } from 'react';
import { downloadResult } from '../api/solverapi';

const TYPE_COLORS = {
  MCQ:          { bg: '#EEF2FF', text: '#3730A3' },
  short_answer: { bg: '#F0FDF4', text: '#166534' },
  descriptive:  { bg: '#FFF7ED', text: '#9A3412' },
  numerical:    { bg: '#FDF4FF', text: '#6B21A8' },
  true_false:   { bg: '#FFF1F2', text: '#9F1239' },
  fill_blank:   { bg: '#F0F9FF', text: '#075985' },
};

export default function ResultsCard({ job, results }) {
  const [view, setView]           = useState('results');
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError]     = useState('');

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    alert('JSON copied!');
  };

  // Authenticated download — fetches PDF with JWT then triggers browser save
  const handleDownload = async () => {
    setDlError('');
    setDownloading(true);
    try {
      await downloadResult(job.jobId, `QA_Report_${job.jobId}.pdf`);
    } catch (e) {
      setDlError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
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
          <button
            key={t}
            style={{ ...styles.tab, ...(view === t ? styles.tabActive : {}) }}
            onClick={() => setView(t)}
          >
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
                  <span style={{ ...styles.badge, background: c.bg, color: c.text }}>
                    {qa.type}
                  </span>
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

      {dlError && <div style={styles.dlError}>{dlError}</div>}

      <div style={styles.actions}>
        {/* Authenticated download button — no plain <a href> */}
        <button
          style={{ ...styles.btnSecondary, opacity: downloading ? 0.6 : 1 }}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? 'Downloading…' : 'Download PDF'}
        </button>
        <button style={styles.btnSecondary} onClick={copyJson}>
          Copy JSON
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff', border: '0.5px solid #e5e7eb',
    borderRadius: 10, padding: '16px 18px', marginBottom: '1rem',
  },
  meta: {
    display: 'flex', gap: 16, fontSize: 12,
    color: '#888', marginBottom: 12, flexWrap: 'wrap',
  },
  tabs: { display: 'flex', gap: 6, marginBottom: 14 },
  tab: {
    padding: '5px 12px', fontSize: 12, fontWeight: 500,
    background: '#f3f4f6', border: 'none',
    borderRadius: 6, cursor: 'pointer', color: '#555',
  },
  tabActive: { background: '#111', color: '#fff' },
  qaItem: {
    padding: '12px 0',
    borderBottom: '0.5px solid #f3f4f6',
  },
  qNum: {
    fontSize: 11, fontWeight: 700, color: '#888',
    background: '#f3f4f6', borderRadius: 4,
    padding: '2px 6px',
  },
  badge: {
    fontSize: 10, fontWeight: 600, borderRadius: 4,
    padding: '2px 7px', textTransform: 'uppercase', letterSpacing: 0.4,
  },
  question: { fontSize: 13, color: '#111', margin: '0 0 6px', lineHeight: 1.5 },
  answer:   { fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 },
  json: {
    background: '#f8fafc', border: '0.5px solid #e5e7eb',
    borderRadius: 8, padding: 14, fontSize: 11,
    overflow: 'auto', maxHeight: 400, color: '#374151',
  },
  actions: { display: 'flex', gap: 8, marginTop: 14 },
  btnSecondary: {
    padding: '7px 16px', fontSize: 12, fontWeight: 500,
    background: '#fff', border: '1px solid #d1d5db',
    borderRadius: 7, cursor: 'pointer', color: '#374151',
    transition: 'background 0.15s',
  },
  dlError: {
    fontSize: 12, color: '#991b1b',
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 6, padding: '6px 10px', marginTop: 8,
  },
};