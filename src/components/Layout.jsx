// src/components/Layout.jsx
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

/**
 * Layout — global app shell.
 *
 * Wraps the sidebar + main content area + top utility bar (search, notifications).
 * Main content area is page-aware via the `activeView` prop.
 */
export default function Layout({
  activeView,
  onNavigate,
  pageTitle,
  pageSubtitle,
  breadcrumb,
  children,
}) {
  // Sidebar collapse state persisted in localStorage
  const [collapsed, setCollapsed] = useState(() => {
    return sessionStorage.getItem('sidebar_collapsed') === 'true';
  });

  // Auto-collapse on narrow screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100 && !collapsed) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    sessionStorage.setItem('sidebar_collapsed', next);
  };

  return (
    <div style={s.shell}>

      {/* ── Background grid + orbs ───────────────────────────── */}
      <div style={s.grid} />
      <div style={{ ...s.orb, ...s.orb1 }} />
      <div style={{ ...s.orb, ...s.orb2 }} />

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <Sidebar
        activeView={activeView}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* ── Main area ───────────────────────────────────────── */}
      <main style={{
        ...s.main,
        marginLeft: collapsed ? 72 : 260,
      }}>

        {/* Top utility bar */}
        <div style={s.topBar}>
          <div style={s.topLeft}>
            {breadcrumb && (
              <div style={s.breadcrumb}>{breadcrumb}</div>
            )}
            {pageTitle && (
              <h1 style={s.pageTitle}>{pageTitle}</h1>
            )}
            {pageSubtitle && (
              <div style={s.pageSubtitle}>{pageSubtitle}</div>
            )}
          </div>

          <div style={s.topRight}>
            {/* Search — wired to ⌘K command palette later */}
            <button style={s.searchBtn} title="Search (Cmd+K)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={s.searchPlaceholder}>Search…</span>
              <kbd style={s.kbd}>⌘K</kbd>
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={s.content}>{children}</div>
      </main>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          aside { transform: translateX(-100%); }
          main  { margin-left: 0 !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

const s = {
  shell: {
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#f0f0f8',
    fontFamily: "'Syne', sans-serif",
    position: 'relative',
  },

  // Background
  grid: {
    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
  },
  orb: {
    position: 'fixed', borderRadius: '50%',
    pointerEvents: 'none', zIndex: 0,
  },
  orb1: {
    width: 420, height: 420, top: -100, right: -80,
    background: 'radial-gradient(circle, rgba(232,255,71,0.12) 0%, transparent 70%)',
  },
  orb2: {
    width: 320, height: 320, bottom: -80, left: 200,
    background: 'radial-gradient(circle, rgba(71,130,255,0.1) 0%, transparent 70%)',
  },

  // Main
  main: {
    position: 'relative', zIndex: 1,
    minHeight: '100vh',
    transition: 'margin-left 0.25s cubic-bezier(0.16,1,0.3,1)',
  },

  // Top bar
  topBar: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
    padding: '24px 32px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  topLeft: { flex: 1, minWidth: 0 },
  breadcrumb: {
    fontSize: 11, color: '#6b6b80',
    fontFamily: 'monospace', letterSpacing: 0.5,
    marginBottom: 6,
  },
  pageTitle: {
    margin: 0, fontSize: 22, fontWeight: 700,
    color: '#f0f0f8', letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 12, color: '#6b6b80',
    fontFamily: 'monospace', marginTop: 4,
  },
  topRight: {
    display: 'flex', alignItems: 'center', gap: 10,
    flexShrink: 0,
  },
  searchBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 14px', minWidth: 220,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, cursor: 'pointer',
    color: '#6b6b80', fontFamily: 'inherit',
    fontSize: 12, transition: 'all 0.15s',
  },
  searchPlaceholder: { flex: 1, textAlign: 'left' },
  kbd: {
    fontSize: 10, fontFamily: 'monospace',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '2px 6px', borderRadius: 4,
    color: '#9ca3af',
  },

  // Content
  content: {
    padding: '24px 32px 48px',
    maxWidth: 1100, margin: '0 auto',
  },
};