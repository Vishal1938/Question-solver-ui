// src/components/StatsTile.jsx
// Dashboard stats tile — shown above the upload card

export default function StatsTile({ history }) {

  // ── Compute stats from history ──────────────────────────────
  const completed = history.filter(h => h.status === 'DONE');
  const totalReports   = completed.length;
  const totalQuestions = completed.reduce((sum, h) => sum + (h.totalQuestions || 0), 0);

  // Rough time-saved estimate: assume ~2 minutes per question if solved manually
  const minutesSaved = totalQuestions * 2;
  const hoursSaved   = (minutesSaved / 60).toFixed(1);

  // Don't show the tile if user has no history yet
  if (totalReports === 0) return null;

  const stats = [
    { label: 'Reports', value: totalReports, suffix: '', icon: '📄' },
    { label: 'Questions answered', value: totalQuestions, suffix: '', icon: '✓' },
    { label: 'Time saved', value: hoursSaved, suffix: 'hrs', icon: '⚡' },
  ];

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.headerLabel}>// Your Stats</span>
      </div>

      <div style={s.grid}>
        {stats.map((stat, i) => (
          <div key={stat.label} style={{
            ...s.statCard,
            ...(i === 1 ? s.statCardHighlight : {}),
          }}>
            <div style={s.statIcon}>{stat.icon}</div>
            <div style={s.statValue}>
              {stat.value}
              {stat.suffix && <span style={s.statSuffix}> {stat.suffix}</span>}
            </div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrap: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    backdropFilter: 'blur(18px)',
    animation: 'fadeUp 0.4s ease',
  },
  header: {
    marginBottom: 14,
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontSize: 11, fontWeight: 600,
    letterSpacing: 1.2, color: '#6b6b80',
    fontFamily: 'monospace', textTransform: 'uppercase',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
  },
  statCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    display: 'flex', flexDirection: 'column', gap: 4,
    position: 'relative',
    transition: 'transform 0.15s',
  },
  statCardHighlight: {
    background: 'rgba(232,255,71,0.08)',
    border: '1px solid rgba(232,255,71,0.2)',
  },
  statIcon: {
    fontSize: 18, marginBottom: 4,
  },
  statValue: {
    fontSize: 26, fontWeight: 800,
    color: '#f0f0f8', lineHeight: 1.1,
    letterSpacing: -0.5,
  },
  statSuffix: {
    fontSize: 13, fontWeight: 500,
    color: '#6b6b80',
  },
  statLabel: {
    fontSize: 11, color: '#6b6b80',
    fontFamily: 'monospace', marginTop: 4,
  },
};