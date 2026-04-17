export default function StatusBar({ status, fileName }) {
  const colors = {
    PENDING:    { bg: '#fafafa', text: '#888',    badge: '#f5f5f5',  badgeText: '#555'    },
    PROCESSING: { bg: '#FAEEDA', text: '#633806', badge: '#FAEEDA',  badgeText: '#633806' },
    DONE:       { bg: '#EAF3DE', text: '#27500A', badge: '#EAF3DE',  badgeText: '#27500A' },
    FAILED:     { bg: '#FCEBEB', text: '#791F1F', badge: '#FCEBEB',  badgeText: '#791F1F' },
  };
  const c = colors[status] || colors.PENDING;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: c.bg, borderRadius: 8, marginBottom: '1rem' }}>
      {status === 'PROCESSING' || status === 'PENDING'
        ? <span style={styles.spinner} />
        : <span style={{ fontSize: 16 }}>{status === 'DONE' ? '✓' : '✗'}</span>
      }
      <span style={{ fontSize: 13, color: c.text }}>
        {status === 'PENDING' && `Queued — waiting to process ${fileName}`}
        {status === 'PROCESSING' && `Processing ${fileName}...`}
        {status === 'DONE' && `Done — ${fileName} solved successfully`}
        {status === 'FAILED' && `Failed to process ${fileName}`}
      </span>
      <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: c.badge, color: c.badgeText }}>
        {status}
      </span>
    </div>
  );
}

const styles = {
  spinner: {
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid #ddd', borderTopColor: '#555',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  }
};