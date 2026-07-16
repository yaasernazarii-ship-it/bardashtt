import Link from 'next/link';

const items = [
  { key: 'dashboard', href: '/dashboard', label: '🏠 داشبورد' },
  { key: 'calendar', href: '/dashboard/calendar', label: '🗓 تقویم کلاس' },
  { key: 'assistant', href: '/dashboard/assistant', label: '🤖 دستیار کتاب' },
  { key: 'profile', href: '/dashboard/profile', label: '👤 پروفایل' },
  { key: 'courses', href: '/courses', label: '🎓 دوره‌ها' },
];

export default function DashboardSidebar({ active, isAdmin = false }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo"><Link href="/">خانواده <span>برداشت</span></Link></div>
      <ul className="sidebar-menu">
        {items.map((it) => (
          <li key={it.key}>
            <Link className={active === it.key ? 'active' : undefined} href={it.href}>{it.label}</Link>
          </li>
        ))}
        {isAdmin && (
          <>
            <li className="sep">مدیریت</li>
            <li><Link className={active === 'admin' ? 'active' : undefined} href="/dashboard/admin">⚙️ کاربران</Link></li>
          </>
        )}
        <li className="sep">سایت</li>
        <li><Link href="/">بازگشت به سایت</Link></li>
      </ul>
    </aside>
  );
}
