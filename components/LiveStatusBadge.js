const CONFIG = {
  scheduled: { label: 'هنوز شروع نشده', bg: '#EFF6FF', fg: '#1D4ED8' },
  live: { label: 'LIVE', bg: '#FEF2F2', fg: '#DC2626', dot: true },
  finished: { label: 'پایان یافته', bg: '#F3F4F6', fg: '#4B5563' },
};

export default function LiveStatusBadge({ status, size = 'md' }) {
  const c = CONFIG[status] || CONFIG.scheduled;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: c.bg, color: c.fg, borderRadius: 999,
        padding: size === 'sm' ? '3px 10px' : '5px 14px',
        fontSize: size === 'sm' ? '.72rem' : '.82rem', fontWeight: 800, whiteSpace: 'nowrap',
      }}
    >
      {c.dot && <span className="live-dot" />}
      {c.label}
    </span>
  );
}
