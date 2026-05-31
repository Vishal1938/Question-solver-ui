// src/components/HistoryCard.jsx
import { useState } from 'react';
import { downloadResult } from '../api/solverapi';

const STATUS_CONFIG = {
  DONE:       { label: 'Completed',  dot: '#22c55e', bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  FAILED:     { label: 'Failed',     dot: '#ef4444', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  PROCESSING: { label: 'Processing', dot: '#f59e0b', bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  PENDING:    { label: 'Pending',    dot: '#6366f1', bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
};

function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function elapsed(ms) {
  if (!ms) return null;
  if (ms < 1000)  return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export default function HistoryCard({ item, index }) {
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError]         = useState('');
  const [expanded, setExpanded]       = useState(false);

  const cfg      = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
  const created  = fmt(item.createdAt);
  const completed = item.completedAt ? fmt(item.completedAt) : null;

  const handleDownload = async () => {
    setDlError('');
    setDownloading(true);
    try {
      await downloadResult(item.jobId, `QA_Report_${item.jobId}.pdf`);
    } catch {
      setDlError('Download failed. Please retry.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{
        ...s.card,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* ── Top row ──────────────────────────────────────────── */}
      <div style={s.topRow}>

        {/* File icon */}
        <div style={s.fileIcon}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>

        {/* File name + date */}
        <div style={s.fileInfo}>
          <span style={s.fileName} title={item.fileName}>
            {item.fileName || 'Untitled document'}
          </span>
          <span style={s.dateRow}>
            <span style={s.dateText}>{created.date}</span>
            <span style={s.dateDot}>·</span>
            <span style={s.dateText}>{created.time}</span>
          </span>
        </div>

        {/* Status chip */}
        <div style={{
          ...s.statusChip,
          background: cfg.bg,
          color: cfg.text,
          border: `1px solid ${cfg.border}`,
        }}>
          <span style={{ ...s.statusDot, background: cfg.dot }} />
          {cfg.label}
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      {item.status === 'DONE' && (
        <div style={s.statsRow}>
          {item.totalQuestions > 0 && (
            <div style={s.stat}>
              <span style={s.statIcon}>❓</span>
              <span style={s.statVal}>{item.totalQuestions}</span>
              <span style={s.statLabel}>questions</span>
            </div>
          )}
          {item.processingTimeMs > 0 && (
            <div style={s.stat}>
              <span style={s.statIcon}>⚡</span>
              <span style={s.statVal}>{elapsed(item.processingTimeMs)}</span>
              <span style={s.statLabel}>processed in</span>
            </div>
          )}
          {completed && (
            <div style={s.stat}>
              <span style={s.statIcon}>✓</span>
              <span style={s.statVal}>{completed.time}</span>
              <span style={s.statLabel}>completed at</span>
            </div>
          )}
        </div>
      )}

      {/* ── Error message (expandable) ────────────────────────── */}
      {item.status === 'FAILED' && item.errorMessage && (
        <div style={s.errorBlock}>
          <button style={s.errorToggle} onClick={() => setExpanded(e => !e)}>
            <span>⚠ Error details</span>
            <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
          </button>
          {expanded && (
            <pre style={s.errorPre}>{item.errorMessage}</pre>
          )}
        </div>
      )}

      {/* ── Download error ────────────────────────────────────── */}
      {dlError && <div style={s.dlError}>{dlError}</div>}

      {/* ── Actions ───────────────────────────────────────────── */}
      {item.status === 'DONE' && (
        <div style={s.actions}>
          <button
            style={{
              ...s.dlBtn,
              opacity: downloading ? 0.65 : 1,
              cursor: downloading ? 'not-allowed' : 'pointer',
            }}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <span style={s.spinner} /> Downloading…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF
              </>
            )}
          </button>

          <div style={s.jobIdTag} title={item.jobId}>
            ID: {item.jobId.slice(0, 8)}…
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const s = {
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
    transition: 'box-shadow 0.2s, border-color 0.2s',
  },

  // Top row
  topRow: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  fileIcon: {
    width: 38, height: 38, borderRadius: 9,
    background: '#f9fafb', border: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  fileInfo: {
    flex: 1, minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: 3,
  },
  fileName: {
    fontSize: 14, fontWeight: 600, color: '#111',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  dateRow: { display: 'flex', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: '#9ca3af' },
  dateDot:  { fontSize: 11, color: '#d1d5db' },

  // Status
  statusChip: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontWeight: 600,
    padding: '4px 10px', borderRadius: 20,
    flexShrink: 0, whiteSpace: 'nowrap',
  },
  statusDot: {
    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
  },

  // Stats
  statsRow: {
    display: 'flex', gap: 20,
    paddingTop: 4,
    borderTop: '1px dashed #f3f4f6',
  },
  stat: {
    display: 'flex', alignItems: 'center', gap: 4,
  },
  statIcon:  { fontSize: 11 },
  statVal:   { fontSize: 13, fontWeight: 700, color: '#111' },
  statLabel: { fontSize: 11, color: '#9ca3af' },

  // Error
  errorBlock: {
    background: '#fef2f2', borderRadius: 8,
    border: '1px solid #fecaca', overflow: 'hidden',
  },
  errorToggle: {
    width: '100%', padding: '8px 12px',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12, color: '#b91c1c', fontWeight: 500,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  errorPre: {
    margin: 0, padding: '8px 12px 12px',
    fontSize: 11, color: '#7f1d1d',
    fontFamily: 'monospace', whiteSpace: 'pre-wrap',
    wordBreak: 'break-word', lineHeight: 1.5,
    borderTop: '1px solid #fecaca',
  },
  dlError: {
    fontSize: 12, color: '#b91c1c',
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 6, padding: '6px 10px',
  },

  // Actions
  actions: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
    paddingTop: 4,
    borderTop: '1px dashed #f3f4f6',
  },
  dlBtn: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '8px 16px', fontSize: 13, fontWeight: 600,
    background: '#111', color: '#fff',
    border: 'none', borderRadius: 8,
    transition: 'opacity 0.15s',
  },
  spinner: {
    width: 12, height: 12,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  jobIdTag: {
    fontSize: 10, color: '#9ca3af',
    fontFamily: 'monospace', letterSpacing: 0.3,
    cursor: 'help',
  },
};