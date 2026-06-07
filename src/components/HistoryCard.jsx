// src/components/HistoryCard.jsx
import { useState } from 'react';
import { shareJobAsCommunityPaper, unshareJob } from '../api/papersapi';

const BASE = process.env.REACT_APP_API_BASE_URL;

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'ComputerScience',
  'English', 'History', 'Geography', 'Economics', 'GeneralKnowledge',
];
const BOARDS  = ['CBSE', 'ICSE', 'State-UP', 'State-MH', 'State-TN', 'Other'];
const CLASSES = ['8', '9', '10', '11', '12'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2009 }, (_, i) => CURRENT_YEAR - i);

export default function HistoryCard({ item, index }) {
  const [downloading, setDownloading] = useState(false);
  const [shareOpen, setShareOpen]     = useState(false);
  const [shared, setShared]           = useState(item.sharedToCommunity || false);
  const [sharing, setSharing]         = useState(false);
  const [shareMsg, setShareMsg]       = useState('');
  const [shareErr, setShareErr]       = useState('');

  const [meta, setMeta] = useState({ board: '', classLevel: '', subject: '', year: '' });

  const isDone = item.status === 'DONE';

  // ── Download ──────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = sessionStorage.getItem('jwt_token');
      const res = await fetch(`${BASE}/api/solver/result/${item.jobId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `QA_Report_${item.jobId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      /* swallow — could surface a toast */
    } finally {
      setDownloading(false);
    }
  };

  // ── Share ─────────────────────────────────────────────────────
  const canSubmitShare = meta.board && meta.classLevel && meta.subject && meta.year;

  const handleShare = async () => {
    if (!canSubmitShare) return;
    setSharing(true);
    setShareErr('');
    setShareMsg('');
    try {
      await shareJobAsCommunityPaper(item.jobId, { ...meta, year: Number(meta.year) });
      setShared(true);
      setShareOpen(false);
      setShareMsg('Submitted for review ✓');
    } catch (e) {
      setShareErr(e.message);
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async () => {
    setSharing(true);
    setShareErr('');
    try {
      await unshareJob(item.jobId);
      setShared(false);
      setShareMsg('');
    } catch (e) {
      setShareErr(e.message);
    } finally {
      setSharing(false);
    }
  };

  // ── Status pill ───────────────────────────────────────────────
  const statusStyle = {
    DONE:       { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80' },
    PROCESSING: { bg: 'rgba(232,255,71,0.12)', color: '#e8ff47' },
    FAILED:     { bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
  }[item.status] || { bg: 'rgba(255,255,255,0.06)', color: '#9ca3af' };

  return (
    <div style={s.card}>
      {/* Top row */}
      <div style={s.top}>
        <div style={s.left}>
          <div style={s.fileIcon}>📄</div>
          <div style={s.info}>
            <div style={s.fileName}>{item.fileName}</div>
            <div style={s.metaLine}>
              {item.totalQuestions > 0 && <span>{item.totalQuestions} questions</span>}
              {item.processingTimeMs > 0 && (
                <>
                  <span style={s.dot}>·</span>
                  <span>{(item.processingTimeMs / 1000).toFixed(1)}s</span>
                </>
              )}
            </div>
          </div>
        </div>
        <span style={{ ...s.statusPill, background: statusStyle.bg, color: statusStyle.color }}>
          {item.status}
        </span>
      </div>

      {/* Actions */}
      {isDone && (
        <div style={s.actions}>
          <button
            style={{ ...s.downloadBtn, opacity: downloading ? 0.6 : 1 }}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Downloading…' : '↓ Download'}
          </button>

          {/* Share state */}
          {shared ? (
            <div style={s.sharedRow}>
              <span style={s.sharedBadge}>✓ Shared to community</span>
              <button style={s.withdrawBtn} onClick={handleUnshare} disabled={sharing}>
                {sharing ? '…' : 'Withdraw'}
              </button>
            </div>
          ) : (
            <button style={s.shareBtn} onClick={() => setShareOpen(!shareOpen)}>
              {shareOpen ? 'Cancel' : '↗ Share with community'}
            </button>
          )}
        </div>
      )}

      {/* Share form */}
      {shareOpen && !shared && (
        <div style={s.shareForm}>
          <div style={s.shareFormTitle}>
            Add details so others can find your paper
          </div>
          <div style={s.shareGrid}>
            <select style={s.select} value={meta.board}
                    onChange={(e) => setMeta({ ...meta, board: e.target.value })}>
              <option value="">Board…</option>
              {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select style={s.select} value={meta.classLevel}
                    onChange={(e) => setMeta({ ...meta, classLevel: e.target.value })}>
              <option value="">Class…</option>
              {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <select style={s.select} value={meta.subject}
                    onChange={(e) => setMeta({ ...meta, subject: e.target.value })}>
              <option value="">Subject…</option>
              {SUBJECTS.map(s2 => <option key={s2} value={s2}>{s2}</option>)}
            </select>
            <select style={s.select} value={meta.year}
                    onChange={(e) => setMeta({ ...meta, year: e.target.value })}>
              <option value="">Year…</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {shareErr && <div style={s.shareErr}>⚠ {shareErr}</div>}
          <button
            style={{ ...s.shareSubmit, opacity: (!canSubmitShare || sharing) ? 0.5 : 1 }}
            onClick={handleShare}
            disabled={!canSubmitShare || sharing}
          >
            {sharing ? 'Submitting…' : 'Submit for review'}
          </button>
          <div style={s.shareNote}>
            Submissions are reviewed by an admin before appearing publicly.
          </div>
        </div>
      )}

      {shareMsg && <div style={s.shareSuccess}>{shareMsg}</div>}
    </div>
  );
}

const s = {
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 16,
  },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  left: { display: 'flex', gap: 12, minWidth: 0 },
  fileIcon: { fontSize: 20, flexShrink: 0 },
  info: { minWidth: 0 },
  fileName: {
    fontSize: 14, fontWeight: 600, color: '#f0f0f8',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    maxWidth: 280,
  },
  metaLine: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, color: '#6b6b80', fontFamily: 'monospace', marginTop: 4,
  },
  dot: { color: '#4b5563' },
  statusPill: {
    fontSize: 10, fontWeight: 700, padding: '4px 10px',
    borderRadius: 6, fontFamily: 'monospace', flexShrink: 0,
  },

  actions: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginTop: 14, flexWrap: 'wrap',
  },
  downloadBtn: {
    padding: '8px 16px', background: '#e8ff47', color: '#0a0a0f',
    border: 'none', borderRadius: 10, fontWeight: 700,
    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },
  shareBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#f0f0f8',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  sharedRow: { display: 'flex', alignItems: 'center', gap: 10 },
  sharedBadge: {
    fontSize: 11, fontWeight: 600, color: '#4ade80',
    fontFamily: 'monospace',
  },
  withdrawBtn: {
    padding: '6px 12px', background: 'none',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8, color: '#f87171',
    fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
  },

  shareForm: {
    marginTop: 14, padding: 14,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  shareFormTitle: {
    fontSize: 12, color: '#9ca3af', marginBottom: 12,
    fontFamily: 'monospace',
  },
  shareGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 8, marginBottom: 12,
  },
  select: {
    padding: '8px 10px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8, color: '#f0f0f8',
    fontSize: 12, fontFamily: 'monospace',
    cursor: 'pointer', outline: 'none',
  },
  shareErr: {
    fontSize: 11, color: '#f87171', fontFamily: 'monospace',
    marginBottom: 10,
  },
  shareSubmit: {
    width: '100%', padding: '10px',
    background: '#e8ff47', color: '#0a0a0f',
    border: 'none', borderRadius: 10,
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  shareNote: {
    fontSize: 10, color: '#6b6b80', fontFamily: 'monospace',
    marginTop: 8, textAlign: 'center',
  },
  shareSuccess: {
    marginTop: 12, padding: '8px 12px',
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 8, fontSize: 12, color: '#4ade80',
    fontFamily: 'monospace', textAlign: 'center',
  },
};