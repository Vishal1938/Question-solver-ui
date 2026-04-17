import { useState, useRef } from 'react';

const SUBJECT_PROMPTS = {
  Mathematics: "You are a Mathematics expert.",
  GeneralKnowledge: "You are a General Knowledge expert.",
  Science: "You are a Science expert.",
  History: "You are a History expert.",
};

const ANSWER_TYPE_SUFFIX = {
  short: "Provide short, concise answers.",
  medium: "Provide medium‑length answers with some explanation.",
  long: "Provide long, detailed answers with thorough explanation.",
};

export default function UploadCard({ onSubmit, loading }) {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [answerType, setAnswerType] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = () => {
    if (!file || !subject || !answerType) return;
    const systemPrompt = `${SUBJECT_PROMPTS[subject]} ${ANSWER_TYPE_SUFFIX[answerType]}`;
    onSubmit(file, systemPrompt, email);
  };

  return (
    <div style={styles.card}>
      <p style={styles.label}>Upload document</p>

      <div
        style={{ ...styles.dropzone, borderColor: dragging ? '#378ADD' : '#ccc' }}
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
        <div style={styles.uploadIcon}>↑</div>
        {file
          ? <p style={styles.fileName}>{file.name}</p>
          : <>
              <p style={styles.dropText}>Drag &amp; drop or click to browse</p>
              <p style={styles.dropSub}>PDF, DOCX, TXT — up to 10MB</p>
            </>
        }
      </div>

      <div style={styles.row}>
        <div style={{ flex: 1 }}>
          <p style={styles.label}>Email (optional)</p>
          <input
            style={styles.input}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <p style={styles.label}>Subject</p>
          <select
            style={styles.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">Select subject...</option>
            {Object.keys(SUBJECT_PROMPTS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.row}>
        <div style={{ flex: 1 }}>
          <p style={styles.label}>Answer Type</p>
          <select
            style={styles.input}
            value={answerType}
            onChange={(e) => setAnswerType(e.target.value)}
          >
            <option value="">Select answer type...</option>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>
      </div>

      <button
        style={{ ...styles.btnPrimary, opacity: (!file || !subject || !answerType || loading) ? 0.5 : 1 }}
        onClick={handleSubmit}
        disabled={!file || !subject || !answerType || loading}
      >
        {loading ? 'Submitting...' : 'Solve questions'}
      </button>
    </div>
  );
}

const styles = {
  card: { background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' },
  label: { fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' },
  dropzone: { border: '1.5px dashed', borderRadius: 8, padding: '2rem 1rem', textAlign: 'center', background: '#fafafa', cursor: 'pointer', marginBottom: '1rem' },
  uploadIcon: { fontSize: 24, marginBottom: 8, color: '#aaa' },
  fileName: { fontSize: 14, fontWeight: 500, color: '#333', margin: 0 },
  dropText: { fontSize: 14, color: '#666', margin: '0 0 4px' },
  dropSub: { fontSize: 12, color: '#aaa', margin: 0 },
  row: { display: 'flex', gap: 12, marginBottom: '1rem' },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontSize: 13, border: '0.5px solid #ddd', borderRadius: 8, outline: 'none' },
  btnPrimary: { width: '100%', padding: 10, fontSize: 14, fontWeight: 500, background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
};
