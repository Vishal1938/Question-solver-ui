// src/pages/AdminPapersPage.jsx
// PR-3: adds a "Pending Review" tab alongside the upload form
import { useState, useEffect, useRef } from 'react';
import {
  adminUploadPaper, getPendingPapers, approvePaper, rejectPaper,
} from '../api/papersapi';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'ComputerScience',
  'English', 'History', 'Geography', 'Economics', 'GeneralKnowledge',
];
const BOARDS  = ['CBSE', 'ICSE', 'State-UP', 'State-MH', 'State-TN', 'Other'];
const CLASSES = ['8', '9', '10', '11', '12'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2009 }, (_, i) => CURRENT_YEAR - i);

export default function AdminPapersPage() {
  const [tab, setTab] = useState('upload');   // 'upload' | 'pending'

  return (
    <div style={s.wrap}>
      <div style={s.adminBadge}>
        <span style={s.adminDot} /> ADMIN AREA
      </div>

      {/* Tabs */}
      <div style={s.tabBar}>
        <button
          style={{ ...s.tab, ...(tab === 'upload' ? s.tabActive : {}) }}
          onClick={() => setTab('upload')}
        >
          Upload Paper
        </button>
        <button
          style={{ ...s.tab, ...(tab === 'pending' ? s.tabActive : {}) }}
          onClick={() => setTab('pending')}
        >
          Pending Review
        </button>
      </div>

      {tab === 'upload' ? <UploadTab /> : <PendingTab />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// UPLOAD TAB
// ════════════════════════════════════════════════════════════════
function UploadTab() {
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({
    title: '', board: '', classLevel: '', subject: '', year: '',
    totalMarks: '', durationMinutes: '',
  });
  const [titleEdited, setTitleEdited] = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [status, setStatus]           = useState(null);
  const [resultPaper, setResultPaper] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragging, setDragging]       = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    if (titleEdited) return;
    if (meta.board && meta.classLevel && meta.subject && meta.year) {
      const autoTitle = `${meta.board} Class ${meta.classLevel} ${meta.subject} ${meta.year}`;
      setMeta((m) => ({ ...m, title: autoTitle }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.board, meta.classLevel, meta.subject, meta.year, titleEdited]);

  const handleTitleChange = (e) => {
    setMeta({ ...meta, title: e.target.value });
    setTitleEdited(true);
  };

  const isValid = file && meta.title?.trim() && meta.board
    && meta.classLevel && meta.subject && meta.year;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setUploading(true);
    setStatus('uploading');
    setErrorMessage('');
    try {
      const finalMeta = {
        ...meta,
        year: Number(meta.year),
        totalMarks: meta.totalMarks ? Number(meta.totalMarks) : undefined,
        durationMinutes: meta.durationMinutes ? Number(meta.durationMinutes) : undefined,
      };
      const saved = await adminUploadPaper(file, finalMeta);
      setResultPaper(saved);
      setStatus('success');
    } catch (e) {
      setErrorMessage(e.message);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setMeta({ title: '', board: '', classLevel: '', subject: '', year: '',
              totalMarks: '', durationMinutes: '' });
    setTitleEdited(false);
    setStatus(null);
    setResultPaper(null);
    setErrorMessage('');
  };

  if (status === 'success' && resultPaper) {
    return (
      <div style={s.successCard}>
        <div style={s.successCheck}>✓</div>
        <h2 style={s.successTitle}>Paper uploaded successfully</h2>
        <div style={s.successMeta}>
          <div>{resultPaper.title}</div>
          <div style={s.successSub}>{resultPaper.questionCount} questions extracted and tagged</div>
        </div>
        <button style={s.primaryBtn} onClick={reset}>Upload another</button>
      </div>
    );
  }

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <h2 style={s.cardTitle}>Upload Paper to Archive</h2>
        <div style={s.cardSub}>Extracted, tagged, and published immediately as an official source.</div>
      </div>

      {/* Dropzone */}
      <div style={s.field}>
        <label style={s.label}>Paper PDF</label>
        <div
          style={{ ...s.dropzone, ...(dragging ? s.dropzoneActive : {}), ...(file ? s.dropzoneFilled : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
                 onChange={(e) => setFile(e.target.files[0])} />
          <div style={s.uploadIcon}>📄</div>
          {file ? (
            <>
              <div style={s.fileName}>{file.name}</div>
              <div style={s.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB · click to change</div>
            </>
          ) : (
            <>
              <div style={s.dropText}>Drag PDF or click to browse</div>
              <div style={s.dropSub}>PDF only · up to 10MB</div>
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div style={s.grid}>
        <div style={s.field}>
          <label style={s.label}>Board</label>
          <select style={s.input} value={meta.board}
                  onChange={(e) => setMeta({ ...meta, board: e.target.value })}>
            <option value="">Select board…</option>
            {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Class</label>
          <select style={s.input} value={meta.classLevel}
                  onChange={(e) => setMeta({ ...meta, classLevel: e.target.value })}>
            <option value="">Select class…</option>
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Subject</label>
          <select style={s.input} value={meta.subject}
                  onChange={(e) => setMeta({ ...meta, subject: e.target.value })}>
            <option value="">Select subject…</option>
            {SUBJECTS.map(s2 => <option key={s2} value={s2}>{s2}</option>)}
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Year</label>
          <select style={s.input} value={meta.year}
                  onChange={(e) => setMeta({ ...meta, year: e.target.value })}>
            <option value="">Select year…</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Total Marks (optional)</label>
          <input type="number" style={s.input} placeholder="80" value={meta.totalMarks}
                 onChange={(e) => setMeta({ ...meta, totalMarks: e.target.value })} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Duration min (optional)</label>
          <input type="number" style={s.input} placeholder="180" value={meta.durationMinutes}
                 onChange={(e) => setMeta({ ...meta, durationMinutes: e.target.value })} />
        </div>
      </div>

      <div style={s.field}>
        <label style={s.label}>
          Title {!titleEdited && meta.title && <span style={s.autoTag}>auto-suggested · click to edit</span>}
        </label>
        <input type="text" style={s.input} placeholder="CBSE Class 10 Mathematics 2024"
               value={meta.title} onChange={handleTitleChange} />
      </div>

      {status === 'error' && <div style={s.errorBanner}>⚠ {errorMessage}</div>}

      <button
        style={{ ...s.primaryBtn, opacity: (!isValid || uploading) ? 0.5 : 1,
                 cursor: (!isValid || uploading) ? 'not-allowed' : 'pointer',
                 width: '100%', padding: '14px', fontSize: 15 }}
        disabled={!isValid || uploading} onClick={handleSubmit}
      >
        {uploading ? (<><span style={s.spinner} />Processing… (1-2 min)</>) : 'Upload & Process Paper'}
      </button>

      {uploading && (
        <div style={s.uploadingNote}>
          Extracting → Tagging → Generating answers → Uploading. Don't close this tab.
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PENDING REVIEW TAB
// ════════════════════════════════════════════════════════════════
function PendingTab() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [actioning, setActioning] = useState(null);   // paperId being approved/rejected

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPendingPapers();
      setPending(data);
    } catch (e) {
      setError('Failed to load pending papers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (paperId) => {
    setActioning(paperId);
    try {
      await approvePaper(paperId);
      setPending(prev => prev.filter(p => p.paperId !== paperId));
    } catch {
      setError('Approve failed.');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (paperId) => {
    setActioning(paperId);
    try {
      await rejectPaper(paperId);
      setPending(prev => prev.filter(p => p.paperId !== paperId));
    } catch {
      setError('Reject failed.');
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return <div style={s.centered}><span style={s.spinner} /> Loading pending papers…</div>;
  }

  return (
    <div>
      <div style={s.pendingHeader}>
        <div style={s.pendingCount}>
          {pending.length} paper{pending.length !== 1 ? 's' : ''} awaiting review
        </div>
        <button style={s.refreshBtn} onClick={load}>↻ Refresh</button>
      </div>

      {error && <div style={s.errorBanner}>⚠ {error}</div>}

      {pending.length === 0 ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>✓</div>
          <div style={s.emptyTitle}>All caught up</div>
          <div style={s.emptySub}>No community submissions waiting for review.</div>
        </div>
      ) : (
        <div style={s.pendingList}>
          {pending.map(p => (
            <div key={p.paperId} style={s.pendingCard}>
              <div style={s.pendingInfo}>
                <div style={s.pendingTitle}>{p.title}</div>
                <div style={s.pendingMeta}>
                  <span style={s.boardBadge}>{p.board}</span>
                  <span>Class {p.classLevel}</span>
                  <span style={s.dot}>·</span>
                  <span>{p.subject}</span>
                  <span style={s.dot}>·</span>
                  <span>{p.year}</span>
                  <span style={s.dot}>·</span>
                  <span>{p.questionCount} Q</span>
                </div>
                <div style={s.pendingSubmitter}>
                  Submitted by {p.uploadedBy}
                </div>
              </div>
              <div style={s.pendingActions}>
                <button
                  style={{ ...s.approveBtn, opacity: actioning === p.paperId ? 0.5 : 1 }}
                  onClick={() => handleApprove(p.paperId)}
                  disabled={actioning === p.paperId}
                >
                  ✓ Approve
                </button>
                <button
                  style={{ ...s.rejectBtn, opacity: actioning === p.paperId ? 0.5 : 1 }}
                  onClick={() => handleReject(p.paperId)}
                  disabled={actioning === p.paperId}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const s = {
  wrap: { maxWidth: 760, margin: '0 auto' },
  adminBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 20, marginBottom: 16,
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
    color: '#f87171', fontSize: 10, fontWeight: 700,
    fontFamily: 'monospace', letterSpacing: 1,
  },
  adminDot: { width: 5, height: 5, borderRadius: '50%', background: '#ef4444' },

  tabBar: {
    display: 'flex', gap: 4, marginBottom: 20,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, padding: 4,
  },
  tab: {
    flex: 1, padding: '10px 16px', border: 'none', borderRadius: 9,
    background: 'transparent', color: '#6b6b80',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  tabActive: { background: '#e8ff47', color: '#0a0a0f', fontWeight: 700 },

  card: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18, padding: 24, backdropFilter: 'blur(18px)',
  },
  cardHeader: { marginBottom: 22 },
  cardTitle: { fontSize: 20, fontWeight: 800, color: '#f0f0f8', margin: '0 0 6px' },
  cardSub: { fontSize: 12, color: '#6b6b80', fontFamily: 'monospace', lineHeight: 1.6 },

  field: { marginBottom: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 4 },
  label: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600,
    letterSpacing: 1.2, textTransform: 'uppercase', color: '#6b6b80',
    marginBottom: 8, fontFamily: 'monospace',
  },
  autoTag: {
    fontSize: 9, padding: '2px 6px', borderRadius: 4,
    background: 'rgba(232,255,71,0.1)', color: '#e8ff47',
    letterSpacing: 0.5, textTransform: 'none',
  },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '11px 14px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, color: '#f0f0f8', fontSize: 13, fontFamily: 'monospace', outline: 'none',
  },
  dropzone: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '32px 20px', border: '1.5px dashed rgba(255,255,255,0.15)',
    borderRadius: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s',
  },
  dropzoneActive: { borderColor: '#e8ff47', background: 'rgba(232,255,71,0.05)' },
  dropzoneFilled: { borderStyle: 'solid', borderColor: 'rgba(232,255,71,0.4)', background: 'rgba(232,255,71,0.04)' },
  uploadIcon: { fontSize: 24, marginBottom: 8 },
  fileName: { fontSize: 14, fontWeight: 600, color: '#f0f0f8', marginBottom: 4 },
  fileSize: { fontSize: 11, color: '#6b6b80', fontFamily: 'monospace' },
  dropText: { fontSize: 14, color: '#d1d5db', marginBottom: 4 },
  dropSub: { fontSize: 11, color: '#6b6b80', fontFamily: 'monospace' },

  primaryBtn: {
    background: '#e8ff47', color: '#0a0a0f', border: 'none', borderRadius: 12,
    fontWeight: 700, fontFamily: 'inherit', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  spinner: {
    width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0a0a0f',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },
  uploadingNote: {
    marginTop: 12, padding: '10px 14px', background: 'rgba(232,255,71,0.05)',
    border: '1px solid rgba(232,255,71,0.15)', borderRadius: 10,
    fontSize: 11, color: '#e8ff47', fontFamily: 'monospace', lineHeight: 1.6,
  },
  errorBanner: {
    marginBottom: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)', color: '#f87171',
    borderRadius: 10, fontSize: 12, fontFamily: 'monospace',
  },

  successCard: {
    textAlign: 'center', padding: '60px 24px', background: 'rgba(34,197,94,0.05)',
    border: '1px solid rgba(34,197,94,0.2)', borderRadius: 18,
  },
  successCheck: {
    width: 56, height: 56, borderRadius: '50%', background: '#22c55e', color: '#fff',
    fontSize: 28, fontWeight: 700, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  successTitle: { fontSize: 20, fontWeight: 800, color: '#4ade80', margin: '0 0 12px' },
  successMeta: { color: '#86efac', fontSize: 13, marginBottom: 24 },
  successSub: { fontSize: 11, color: '#22c55e', fontFamily: 'monospace', marginTop: 6 },

  // Pending tab
  centered: { textAlign: 'center', padding: '60px 24px', color: '#6b6b80', fontFamily: 'monospace', fontSize: 13 },
  pendingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pendingCount: { fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' },
  refreshBtn: {
    padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.04)', color: '#f0f0f8',
    fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },
  pendingList: { display: 'flex', flexDirection: 'column', gap: 12 },
  pendingCard: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: 16, padding: 16, flexWrap: 'wrap',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
  },
  pendingInfo: { flex: 1, minWidth: 200 },
  pendingTitle: { fontSize: 14, fontWeight: 700, color: '#f0f0f8', marginBottom: 8 },
  pendingMeta: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    fontSize: 12, color: '#9ca3af', marginBottom: 6,
  },
  boardBadge: {
    fontSize: 10, fontWeight: 700, padding: '2px 8px',
    background: 'rgba(232,255,71,0.12)', color: '#e8ff47',
    borderRadius: 5, fontFamily: 'monospace',
  },
  dot: { color: '#4b5563' },
  pendingSubmitter: { fontSize: 11, color: '#6b6b80', fontFamily: 'monospace' },
  pendingActions: { display: 'flex', gap: 8 },
  approveBtn: {
    padding: '9px 16px', background: 'rgba(34,197,94,0.15)',
    border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10,
    color: '#4ade80', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  rejectBtn: {
    padding: '9px 16px', background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10,
    color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  emptyState: {
    textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.03)',
    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 18,
  },
  emptyIcon: {
    width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,197,94,0.15)',
    color: '#4ade80', fontSize: 22, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#f0f0f8', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#6b6b80' },
};