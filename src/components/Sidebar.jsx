// src/components/Sidebar.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// ── Navigation structure — grouped by user intent ────────────────────────
const buildNavSections = (user) => {
const base = [
  {
    title: 'Study',
    items: [
      { id: 'upload',     label: 'New Upload',     icon: 'upload' },
      { id: 'history',    label: 'My Reports',     icon: 'reports' },
      { id: 'past',       label: 'Past Papers',    icon: 'archive', badge: 'NEW' },
      { id: 'mockTest',   label: 'Mock Test',      icon: 'test',    badge: 'SOON' },
    ],
  },
  {
    title: 'Practice',
    items: [
      { id: 'quiz',       label: 'Quiz Mode',      icon: 'quiz',    badge: 'NEW' },
      { id: 'flashcards', label: 'Flashcards',     icon: 'cards',   badge: 'SOON' },
      { id: 'chat',       label: 'Doubt Chat',     icon: 'chat',    badge: 'AI' },
    ],
  },
  {
    title: 'Evaluate',
    items: [
      { id: 'grade',      label: 'Grade My Answer', icon: 'check',  badge: 'SOON' },
      { id: 'analytics',  label: 'Performance',     icon: 'chart',  badge: 'SOON' },
    ],
  },
  {
    title: 'Social',
    items: [
      { id: 'groups',     label: 'Study Groups',   icon: 'users',   badge: 'SOON' },
    ],
  },
];

if (user?.role === 'ADMIN') {
    base.push({
      title: 'Admin',
      items: [
        { id: 'adminPapers', label: 'Manage Papers', icon: 'archive', badge: 'NEW' },
      ],
    });
  }

  return base;
}
// ── SVG icons — single source of truth ───────────────────────────────────
const ICONS = {
  upload: (
    <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>
  ),
  reports: (
    <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/></>
  ),
  archive: (
    <><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/></>
  ),
  test: (
    <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>
  ),
  quiz: (
    <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/></>
  ),
  cards: (
    <><rect x="3" y="3" width="18" height="14" rx="2"/>
      <line x1="3" y1="21" x2="21" y2="21"/></>
  ),
  chat: (
    <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>
  ),
  check: (
    <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
  ),
  chart: (
    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/></>
  ),
  users: (
    <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>
  ),
  collapse: (
    <><polyline points="15 18 9 12 15 6"/></>
  ),
  expand: (
    <><polyline points="9 18 15 12 9 6"/></>
  ),
  logout: (
    <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>
  ),
};

const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name]}
  </svg>
);

export default function Sidebar({ activeView, onNavigate, collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_SECTIONS = buildNavSections(user);

  const isActive = (id) => activeView === id;

  return (
    <>
      {/* ── Mobile hamburger — visible only on small screens ─────────── */}
      <button
        style={s.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* ── Mobile overlay ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div style={s.mobileOverlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        ...s.sidebar,
        ...(collapsed ? s.sidebarCollapsed : {}),
        ...(mobileOpen ? s.sidebarMobileOpen : {}),
      }}>

        {/* Brand + collapse toggle */}
        <div style={s.brand}>
          <div style={s.brandLeft}>
            <div style={s.brandMark}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="#0a0a0f" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            {!collapsed && (
              <div style={s.brandText}>
                <div style={s.brandName}>CodingAgent</div>
                <div style={s.brandSub}>study smarter</div>
              </div>
            )}
          </div>
          <button
            style={s.collapseBtn}
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <Icon name={collapsed ? 'expand' : 'collapse'} size={14} />
          </button>
        </div>

        {/* Nav sections */}
        <nav style={s.nav}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} style={s.section}>
              {!collapsed && (
                <div style={s.sectionTitle}>{section.title}</div>
              )}
              {section.items.map((item) => {
                const active = isActive(item.id);
                return (
                  <button
                    key={item.id}
                    style={{
                      ...s.navItem,
                      ...(active ? s.navItemActive : {}),
                      ...(collapsed ? s.navItemCollapsed : {}),
                    }}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileOpen(false);
                    }}
                    title={collapsed ? item.label : ''}
                  >
                    <span style={s.navIcon}>
                      <Icon name={item.icon} size={16} />
                    </span>
                    {!collapsed && (
                      <>
                        <span style={s.navLabel}>{item.label}</span>
                        {item.badge && (
                          <span style={{
                            ...s.badge,
                            ...(item.badge === 'AI' ? s.badgeAI : {}),
                            ...(item.badge === 'NEW' ? s.badgeNew : {}),
                            ...(item.badge === 'SOON' ? s.badgeSoon : {}),
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User card at bottom */}
        <div style={s.userBlock}>
          <div style={s.userCard}>
            <div style={s.avatar}>{user.email[0].toUpperCase()}</div>
            {!collapsed && (
              <div style={s.userInfo}>
                <div style={s.userEmail}>{user.email}</div>
                <div style={s.userRole}>{user.role || 'USER'}</div>
              </div>
            )}
          </div>
          <button
            style={{ ...s.logoutBtn, ...(collapsed ? s.logoutBtnCollapsed : {}) }}
            onClick={logout}
            title="Sign out"
          >
            <Icon name="logout" size={14} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const s = {
  // Mobile hamburger
  mobileToggle: {
    position: 'fixed', top: 16, left: 16, zIndex: 60,
    width: 40, height: 40, borderRadius: 10,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f0f0f8', cursor: 'pointer',
    display: 'none',  // overridden via @media below
    alignItems: 'center', justifyContent: 'center',
  },
  mobileOverlay: {
    position: 'fixed', inset: 0, zIndex: 40,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'none',  // overridden via @media below
  },

  // Sidebar
  sidebar: {
    position: 'fixed', top: 0, left: 0, bottom: 0,
    width: 260, zIndex: 50,
    background: 'rgba(15,15,22,0.95)',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(20px)',
    display: 'flex', flexDirection: 'column',
    transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.25s',
    fontFamily: "'Syne', sans-serif",
    color: '#f0f0f8',
  },
  sidebarCollapsed: { width: 72 },
  sidebarMobileOpen: { transform: 'translateX(0)' },

  // Brand
  brand: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 8,
    padding: '20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  brandLeft: {
    display: 'flex', alignItems: 'center', gap: 10, minWidth: 0,
  },
  brandMark: {
    width: 32, height: 32, borderRadius: 9,
    background: '#e8ff47', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  brandText: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  brandName: { fontSize: 15, fontWeight: 800, color: '#f0f0f8', lineHeight: 1.1 },
  brandSub: {
    fontSize: 10, color: '#6b6b80',
    fontFamily: 'monospace', letterSpacing: 0.5, marginTop: 2,
  },
  collapseBtn: {
    width: 26, height: 26, borderRadius: 7,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#9ca3af', cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  // Nav
  nav: {
    flex: 1, overflowY: 'auto',
    padding: '14px 10px',
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 10, fontWeight: 700,
    letterSpacing: 1.5, textTransform: 'uppercase',
    color: '#6b6b80', fontFamily: 'monospace',
    padding: '4px 10px 6px',
  },
  navItem: {
    width: '100%', display: 'flex', alignItems: 'center',
    gap: 11, padding: '9px 10px', marginBottom: 2,
    background: 'transparent', border: 'none',
    borderRadius: 9, cursor: 'pointer',
    color: '#9ca3af', fontFamily: 'inherit',
    fontSize: 13, fontWeight: 500,
    transition: 'all 0.15s',
    textAlign: 'left',
  },
  navItemActive: {
    background: 'rgba(232,255,71,0.1)',
    color: '#e8ff47', fontWeight: 600,
  },
  navItemCollapsed: {
    justifyContent: 'center', padding: '11px 0',
  },
  navIcon: {
    width: 18, height: 18, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  navLabel: { flex: 1, whiteSpace: 'nowrap' },
  badge: {
    fontSize: 9, fontWeight: 700,
    padding: '2px 6px', borderRadius: 4,
    fontFamily: 'monospace', letterSpacing: 0.3,
  },
  badgeAI: { background: 'rgba(232,255,71,0.15)', color: '#e8ff47' },
  badgeSoon: {
    background: 'rgba(255,255,255,0.06)',
    color: '#6b6b80',
  },

  // User block
  userBlock: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: 12,
  },
  userCard: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 9,
    background: 'rgba(255,255,255,0.03)',
    marginBottom: 6,
  },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: '#e8ff47', color: '#0a0a0f',
    fontSize: 12, fontWeight: 800, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  userInfo: { flex: 1, minWidth: 0 },
  userEmail: {
    fontSize: 11, color: '#f0f0f8',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: 9, color: '#6b6b80',
    fontFamily: 'monospace', letterSpacing: 0.5,
    marginTop: 1,
  },
  logoutBtn: {
    width: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 7,
    padding: '8px', borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#9ca3af', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
    transition: 'all 0.15s',
  },
  logoutBtnCollapsed: { padding: '8px 0' },
  badgeNew: {
  background: 'rgba(34,197,94,0.15)',
  color: '#22c55e',
},
};