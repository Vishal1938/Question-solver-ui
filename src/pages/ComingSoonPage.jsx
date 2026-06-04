// src/pages/ComingSoonPage.jsx
// Placeholder page for features not yet built — friendly empty state

export default function ComingSoonPage({ title, description, eta }) {
  return (
    <div style={s.wrap}>
      <div style={s.iconWrap}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
             stroke="#e8ff47" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>

      <div style={s.badge}>COMING SOON</div>
      <h2 style={s.title}>{title}</h2>
      <p style={s.desc}>{description}</p>

      {eta && (
        <div style={s.eta}>
          <span style={s.etaLabel}>Estimated:</span>
          <span style={s.etaValue}>{eta}</span>
        </div>
      )}

      <div style={s.notify}>
        <span style={s.notifyDot} />
        We'll notify you when it's ready
      </div>
    </div>
  );
}

const s = {
  wrap: {
    textAlign: 'center', padding: '80px 24px',
    maxWidth: 480, margin: '40px auto',
    background: 'rgba(255,255,255,0.03)',
    border: '1px dashed rgba(255,255,255,0.1)',
    borderRadius: 20,
    animation: 'fadeUp 0.35s ease',
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 16,
    background: 'rgba(232,255,71,0.08)',
    border: '1px solid rgba(232,255,71,0.2)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  badge: {
    display: 'inline-block', padding: '4px 10px',
    background: 'rgba(232,255,71,0.1)',
    border: '1px solid rgba(232,255,71,0.25)',
    color: '#e8ff47', borderRadius: 20,
    fontSize: 10, fontWeight: 700,
    fontFamily: 'monospace', letterSpacing: 1,
    marginBottom: 14,
  },
  title: {
    fontSize: 24, fontWeight: 800,
    color: '#f0f0f8', margin: '0 0 10px',
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 14, color: '#9ca3af',
    lineHeight: 1.7, margin: '0 auto 24px',
    maxWidth: 380,
  },
  eta: {
    display: 'inline-flex', gap: 8, alignItems: 'center',
    padding: '8px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    marginBottom: 16,
  },
  etaLabel: { fontSize: 11, color: '#6b6b80', fontFamily: 'monospace' },
  etaValue: { fontSize: 12, color: '#f0f0f8', fontWeight: 600 },
  notify: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    fontSize: 11, color: '#6b6b80',
    fontFamily: 'monospace',
  },
  notifyDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
  },
};