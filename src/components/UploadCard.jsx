// src/components/UploadCard.jsx
import { useState, useRef } from 'react';

// ── Subject presets — wider coverage with tuned system prompts ──────────
const SUBJECTS = {
  Mathematics: {
    icon: '∑',
    prompt: 'You are a Mathematics expert. Show step-by-step derivations and use proper LaTeX notation for equations.',
  },
  Physics: {
    icon: '⚛',
    prompt: 'You are a Physics expert. Include formulas, units, and explain underlying principles. Use LaTeX for equations.',
  },
  Chemistry: {
    icon: '⚗',
    prompt: 'You are a Chemistry expert. Include chemical equations, reaction mechanisms, and atomic/molecular details.',
  },
  Science: {
    icon: '🧬',
    prompt: 'You are a Science expert. Explain scientific processes, terminology, and include diagrams when relevant.',
  },
  Biology: {
    icon: '🧬',
    prompt: 'You are a Biology expert. Explain biological processes, terminology, and include diagrams when relevant.',
  },
  ComputerScience: {
    icon: '⌘',
    prompt: 'You are a Computer Science expert. Include code examples, time complexity, and algorithmic explanations.',
  },
  History: {
    icon: '📜',
    prompt: 'You are a History expert. Include dates, context, and significance of events.',
  },
  Geography: {
    icon: '🌍',
    prompt: 'You are a Geography expert. Include locations, geographical features, and spatial relationships.',
  },
  Economics: {
    icon: '📊',
    prompt: 'You are an Economics expert. Use graphs conceptually, mention theories, and explain market dynamics.',
  },
  English: {
    icon: '📖',
    prompt: 'You are an English Literature expert. Analyze themes, characters, and literary devices.',
  },
  GeneralKnowledge: {
    icon: '✦',
    prompt: 'You are a General Knowledge expert. Give accurate, well-sourced answers.',
  },
};

// ── Difficulty presets ─────────────────────────────────────────────────
const DIFFICULTY = {
  brief: {
    label: 'Brief',
    desc:  '1-2 line answers',
    suffix:'Give brief, one-or-two-line answers. No elaboration.',
  },
  detailed: {
    label: 'Detailed',
    desc:  'Explained answers',
    suffix:'Provide detailed answers with clear explanations and reasoning.',
  },
  examReady: {
    label: 'Exam-Ready',
    desc:  'Marks-style answers',
    suffix:'Provide exam-ready answers structured for full marks — include all steps, key terms, formulas, and complete justification as expected in an exam.',
  },
};

// ── Language presets ───────────────────────────────────────────────────
const LANGUAGES = {
  English:   { code: 'en', flag: '🇬🇧', suffix: 'Answer in English.' },
  Hindi:     { code: 'hi', flag: '🇮🇳', suffix: 'Answer in Hindi (हिंदी). Use Devanagari script.' },
  Hinglish:  { code: 'hi-en', flag: '🇮🇳', suffix: 'Answer in Hinglish — mix of Hindi and English written in Roman script.' },
  Spanish:   { code: 'es', flag: '🇪🇸', suffix: 'Answer in Spanish.' },
  French:    { code: 'fr', flag: '🇫🇷', suffix: 'Answer in French.' },
  Tamil:     { code: 'ta', flag: '🇮🇳', suffix: 'Answer in Tamil (தமிழ்).' },
  Telugu:    { code: 'te', flag: '🇮🇳', suffix: 'Answer in Telugu (తెలుగు).' },
  Bengali:   { code: 'bn', flag: '🇮🇳', suffix: 'Answer in Bengali (বাংলা).' },
};

export default function UploadCard({ onSubmit, loading }) {
  const [file, setFile]             = useState(null);
  const [email, setEmail]           = useState('');
  const [subject, setSubject]       = useState('');
  const [difficulty, setDifficulty] = useState('detailed');
  const [language, setLanguage]     = useState('English');
  const [dragging, setDragging]     = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = () => {
    if (!file || !subject || !difficulty || !language) return;
    // Combine subject + difficulty + language into one system prompt
    const systemPrompt = [
      SUBJECTS[subject].prompt,
      DIFFICULTY[difficulty].suffix,
      LANGUAGES[language].suffix,
    ].join(' ');
    onSubmit(file, systemPrompt, email);
  };

  const isDisabled = !file || !subject || !difficulty || !language || loading;

  return (
    <div style={s.card}>

      {/* ── File upload zone ─────────────────────────────────── */}
      <div style={s.field}>
        <label style={s.label}>Upload document</label>
        <div
          style={{
            ...s.dropzone,
            ...(dragging ? s.dropzoneActive : {}),
            ...(file ? s.dropzoneFilled : {}),
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files[0])}
          />
          <div style={s.uploadIconWrap}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          {file ? (
            <>
              <div style={s.fileName}>{file.name}</div>
              <div style={s.fileSize}>{(file.size / 1024).toFixed(1)} KB · click to change</div>
            </>
          ) : (
            <>
              <div style={s.dropText}>Drag &amp; drop or click to browse</div>
              <div style={s.dropSub}>PDF · DOCX · TXT — up to 10MB</div>
            </>
          )}
        </div>
      </div>

      {/* ── Subject selector — grid of chips ─────────────────── */}
      <div style={s.field}>
        <label style={s.label}>Subject</label>
        <div style={s.chipGrid}>
          {Object.entries(SUBJECTS).map(([key, val]) => (
            <button
              key={key}
              type="button"
              style={{
                ...s.chip,
                ...(subject === key ? s.chipActive : {}),
              }}
              onClick={() => setSubject(key)}
            >
              <span style={s.chipIcon}>{val.icon}</span>
              <span style={s.chipLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Difficulty + Language — side by side ─────────────── */}
      <div style={s.fieldRow}>

        {/* Difficulty */}
        <div style={{ flex: 1 }}>
          <label style={s.label}>Answer style</label>
          <div style={s.segmentGroup}>
            {Object.entries(DIFFICULTY).map(([key, val]) => (
              <button
                key={key}
                type="button"
                style={{
                  ...s.segment,
                  ...(difficulty === key ? s.segmentActive : {}),
                }}
                onClick={() => setDifficulty(key)}
              >
                <span style={s.segLabel}>{val.label}</span>
                <span style={s.segDesc}>{val.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div style={{ flex: 1 }}>
          <label style={s.label}>Answer language</label>
          <select
            style={s.select}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {Object.entries(LANGUAGES).map(([name, val]) => (
              <option key={name} value={name}>
                {val.flag}  {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Email (optional) ─────────────────────────────────── */}
      <div style={s.field}>
        <label style={s.label}>Email (optional — receive PDF in inbox)</label>
        <input
          style={s.select}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* ── Submit ───────────────────────────────────────────── */}
      <button
        style={{
          ...s.submitBtn,
          ...(isDisabled ? s.submitBtnDisabled : {}),
        }}
        onClick={handleSubmit}
        disabled={isDisabled}
      >
        {loading ? (
          <>
            <span style={s.spinner} /> Processing…
          </>
        ) : (
          <>
            Solve Questions
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </>
        )}
      </button>

      {/* Local keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Styles — dark theme to match App.js ─────────────────────────────────
const s = {
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: 24,
    marginBottom: 18,
    backdropFilter: 'blur(18px)',
  },

  field:    { marginBottom: 22 },
  fieldRow: { display: 'flex', gap: 16, marginBottom: 22, flexWrap: 'wrap' },

  label: {
    display: 'block', fontSize: 11, fontWeight: 600,
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: '#6b6b80', marginBottom: 10,
    fontFamily: 'monospace',
  },

  // Dropzone
  dropzone: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '36px 20px',
    border: '1.5px dashed rgba(255,255,255,0.15)',
    borderRadius: 14, cursor: 'pointer',
    background: 'rgba(255,255,255,0.02)',
    transition: 'all 0.2s',
  },
  dropzoneActive: {
    borderColor: '#e8ff47',
    background: 'rgba(232,255,71,0.05)',
  },
  dropzoneFilled: {
    borderStyle: 'solid',
    borderColor: 'rgba(232,255,71,0.4)',
    background: 'rgba(232,255,71,0.04)',
  },
  uploadIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    background: 'rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, color: '#e8ff47',
  },
  fileName: { fontSize: 14, fontWeight: 600, color: '#f0f0f8', marginBottom: 4 },
  fileSize: { fontSize: 11, color: '#6b6b80', fontFamily: 'monospace' },
  dropText: { fontSize: 14, color: '#d1d5db', marginBottom: 4 },
  dropSub:  { fontSize: 11, color: '#6b6b80', fontFamily: 'monospace' },

  // Subject chips
  chipGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 8,
  },
  chip: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, cursor: 'pointer',
    color: '#d1d5db', fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  chipActive: {
    background: '#e8ff47', color: '#0a0a0f',
    borderColor: '#e8ff47',
  },
  chipIcon:  { fontSize: 16, lineHeight: 1 },
  chipLabel: { fontSize: 12, fontWeight: 600 },

  // Difficulty segments
  segmentGroup: {
    display: 'flex', gap: 4,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, padding: 4,
  },
  segment: {
    flex: 1, padding: '10px 8px',
    background: 'transparent', border: 'none',
    borderRadius: 8, cursor: 'pointer',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 2,
    color: '#d1d5db', fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  segmentActive: {
    background: '#e8ff47', color: '#0a0a0f',
  },
  segLabel: { fontSize: 12, fontWeight: 700 },
  segDesc:  { fontSize: 9, fontFamily: 'monospace', opacity: 0.85 },

  // Select
  select: {
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, color: '#f0f0f8',
    fontSize: 13, fontFamily: 'monospace',
    outline: 'none', boxSizing: 'border-box',
    cursor: 'pointer',
  },

  // Submit button
  submitBtn: {
    width: '100%', padding: '14px',
    background: '#e8ff47', color: '#0a0a0f',
    border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    transition: 'transform 0.15s, opacity 0.15s',
  },
  submitBtnDisabled: {
    opacity: 0.5, cursor: 'not-allowed',
  },
  spinner: {
    width: 14, height: 14,
    border: '2px solid rgba(0,0,0,0.2)',
    borderTopColor: '#0a0a0f',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
};