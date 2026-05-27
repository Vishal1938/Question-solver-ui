// src/pages/AuthPage.js
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab]           = useState('login');   // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // ── Password strength ────────────────────────────────────────
  const strength = (() => {
    let s = 0;
    if (password.length >= 8)           s++;
    if (/[A-Z]/.test(password))         s++;
    if (/[0-9]/.test(password))         s++;
    if (/[^A-Za-z0-9]/.test(password))  s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'][strength];

  // ── Tab switch ───────────────────────────────────────────────
  const switchTab = (t) => {
    setTab(t); setError(''); setSuccess('');
    setEmail(''); setPassword(''); setConfirm('');
  };

  // ── Validation ───────────────────────────────────────────────
  const validate = () => {
    if (!email.includes('@')) return 'Enter a valid email address';
    if (password.length < 8)  return 'Password must be at least 8 characters';
    if (tab === 'register' && password !== confirm) return 'Passwords do not match';
    return null;
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
        // AuthContext sets user → App.js renders the main app automatically
      } else {
        await register(email, password);
        setSuccess('Account created! Signing you in…');
        // AuthContext sets user → redirect happens automatically
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* ── Background grid ─────────────────────────────────── */}
      <div style={s.grid} />

      {/* ── Glow orbs ───────────────────────────────────────── */}
      <div style={{ ...s.orb, ...s.orb1 }} />
      <div style={{ ...s.orb, ...s.orb2 }} />

      <div style={s.layout}>
        {/* ── LEFT: Brand ─────────────────────────────────────── */}
        <div style={s.brand}>
          <div style={s.logo}>
            <div style={s.logoMark}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="#0a0a0f" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <span style={s.logoText}>CodingAgent</span>
          </div>

          <div style={s.brandBody}>
            <div style={s.brandTag}>AI-Powered Platform</div>
            <h1 style={s.brandHeadline}>
              Extract answers<br/>from <em style={{ color: '#e8ff47', fontStyle: 'normal' }}>any</em><br/>document
            </h1>
            <p style={s.brandDesc}>
              Upload PDFs or text files. Our AI reads every page, extracts all questions,
              and generates precise answers — delivered to your inbox.
            </p>
            <div style={s.features}>
              {[
                'Page-by-page question extraction',
                'LLM-powered answer generation',
                'PDF report delivered to email',
                'Async processing — no waiting',
              ].map(f => (
                <div key={f} style={s.featureRow}>
                  <div style={s.dot} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={s.brandFooter}>© 2026 CodingAgent</div>
        </div>

        {/* ── RIGHT: Auth form ─────────────────────────────────── */}
        <div style={s.formPanel}>
          <div style={s.box}>

            {/* Tab switcher */}
            <div style={s.tabs}>
              {['login', 'register'].map(t => (
                <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
                        onClick={() => switchTab(t)}>
                  {t === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* Heading */}
            <div style={s.formTitle}>
              {tab === 'login' ? 'Welcome back' : 'Create account'}
            </div>
            <div style={s.formSub}>
              {tab === 'login'
                ? '// enter your credentials to continue'
                : '// start extracting answers in seconds'}
            </div>

            {/* Alerts */}
            {error   && <div style={{ ...s.alert, ...s.alertError }}>⚠ {error}</div>}
            {success && <div style={{ ...s.alert, ...s.alertSuccess }}>✓ {success}</div>}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div style={s.field}>
                <label style={s.label}>Email address</label>
                <input
                  style={s.input}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div style={s.field}>
                <label style={s.label}>Password</label>
                <div style={s.inputWrap}>
                  <input
                    style={{ ...s.input, paddingRight: 44 }}
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={tab === 'register' ? 'Min. 8 characters' : '••••••••'}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    required
                  />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowPw(p => !p)}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>

                {/* Strength bar — only on register */}
                {tab === 'register' && password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={s.strengthTrack}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          ...s.strengthBar,
                          background: i <= strength ? strengthColor : 'rgba(255,255,255,0.07)',
                        }}/>
                      ))}
                    </div>
                    <span style={{ ...s.strengthLabel, color: strengthColor }}>
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password — register only */}
              {tab === 'register' && (
                <div style={s.field}>
                  <label style={s.label}>Confirm password</label>
                  <input
                    style={{
                      ...s.input,
                      borderColor: confirm && confirm !== password
                        ? '#ef4444' : 'rgba(255,255,255,0.07)',
                    }}
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  {confirm && confirm !== password && (
                    <div style={s.fieldErr}>Passwords do not match</div>
                  )}
                </div>
              )}

              {/* Submit */}
              <button type="submit" style={s.submitBtn} disabled={loading}>
                {loading
                  ? <span style={s.spinner} />
                  : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Switch hint */}
            <div style={s.switchHint}>
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button style={s.switchLink}
                      onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}>
                {tab === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh', background: '#0a0a0f',
    color: '#f0f0f8', fontFamily: "'Syne', sans-serif",
    position: 'relative', overflow: 'hidden',
  },
  grid: {
    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
    backgroundSize: '48px 48px',
    WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)',
    maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)',
  },
  orb: {
    position: 'fixed', borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
  },
  orb1: {
    width: 420, height: 420,
    background: 'radial-gradient(circle, rgba(232,255,71,0.16) 0%, transparent 70%)',
    top: -80, right: -60,
  },
  orb2: {
    width: 300, height: 300,
    background: 'radial-gradient(circle, rgba(71,130,255,0.13) 0%, transparent 70%)',
    bottom: -60, left: -40,
  },
  layout: {
    position: 'relative', zIndex: 1,
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    minHeight: '100vh',
  },

  // Brand panel
  brand: {
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '48px 56px',
    borderRight: '1px solid rgba(255,255,255,0.07)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 12 },
  logoMark: {
    width: 36, height: 36, borderRadius: 10, background: '#e8ff47',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' },
  brandBody: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  brandTag: {
    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
    color: '#e8ff47', marginBottom: 24,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  brandHeadline: {
    fontSize: 'clamp(32px, 3.5vw, 48px)', fontWeight: 800,
    lineHeight: 1.05, letterSpacing: -2, marginBottom: 20, margin: '0 0 20px',
  },
  brandDesc: {
    fontSize: 15, lineHeight: 1.7, color: '#6b6b80',
    maxWidth: 360, fontWeight: 400, margin: '0 0 32px',
  },
  features: { display: 'flex', flexDirection: 'column', gap: 12 },
  featureRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    fontSize: 13, color: '#6b6b80', fontFamily: 'monospace',
  },
  dot: { width: 6, height: 6, borderRadius: '50%', background: '#e8ff47', flexShrink: 0 },
  brandFooter: { fontSize: 11, color: '#6b6b80', fontFamily: 'monospace' },

  // Form panel
  formPanel: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 56px',
  },
  box: { width: '100%', maxWidth: 400 },

  // Tabs
  tabs: {
    display: 'flex', gap: 0,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: 4, marginBottom: 32,
  },
  tab: {
    flex: 1, padding: '10px 0',
    background: 'none', border: 'none',
    color: '#6b6b80', fontFamily: 'inherit',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    borderRadius: 7, transition: 'all 0.2s',
  },
  tabActive: { background: '#e8ff47', color: '#0a0a0f' },

  formTitle: { fontSize: 26, fontWeight: 800, letterSpacing: -0.8, marginBottom: 6 },
  formSub: {
    fontSize: 12, color: '#6b6b80', marginBottom: 28,
    fontFamily: 'monospace', letterSpacing: 0.3,
  },

  // Alerts
  alert: {
    padding: '11px 14px', borderRadius: 10,
    fontSize: 13, fontFamily: 'monospace',
    marginBottom: 18, lineHeight: 1.5,
  },
  alertError: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#f87171',
  },
  alertSuccess: {
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.25)',
    color: '#4ade80',
  },

  // Fields
  field: { marginBottom: 18 },
  label: {
    display: 'block', fontSize: 11, fontWeight: 600,
    letterSpacing: 1.5, textTransform: 'uppercase',
    color: '#6b6b80', marginBottom: 8, fontFamily: 'monospace',
  },
  input: {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, color: '#f0f0f8',
    fontSize: 14, fontFamily: 'monospace',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: 14, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 14, padding: 0,
    color: '#6b6b80',
  },

  // Strength
  strengthTrack: { display: 'flex', gap: 4 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2, transition: 'background 0.3s' },
  strengthLabel: { fontSize: 10, fontFamily: 'monospace', marginTop: 4, display: 'block' },
  fieldErr: { fontSize: 11, color: '#f87171', fontFamily: 'monospace', marginTop: 5 },

  // Submit button
  submitBtn: {
    width: '100%', padding: '13px 0',
    background: '#e8ff47', color: '#0a0a0f',
    border: 'none', borderRadius: 12,
    fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', marginTop: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.2s, transform 0.15s',
  },
  spinner: {
    width: 18, height: 18,
    border: '2px solid rgba(0,0,0,0.2)',
    borderTopColor: '#0a0a0f',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },

  // Switch hint
  switchHint: {
    textAlign: 'center', marginTop: 24,
    fontSize: 13, color: '#6b6b80',
    fontFamily: 'monospace',
  },
  switchLink: {
    background: 'none', border: 'none',
    color: '#e8ff47', fontFamily: 'monospace',
    fontSize: 13, cursor: 'pointer', fontWeight: 600,
    textDecoration: 'underline', padding: 0,
  },
};