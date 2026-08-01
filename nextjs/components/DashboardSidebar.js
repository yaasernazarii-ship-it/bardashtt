import Link from 'next/link';

const STUDENT_ITEMS = [
  { key: 'dashboard', href: '/dashboard', label: '🏠 داشبورد' },
  { key: 'schedule', href: '/dashboard/schedule', label: '📅 برنامه و تقویم من' },
  { key: 'enrollment', href: '/dashboard/enrollment', label: '🎓 ثبت‌نام من' },
  { key: 'resume', href: '/dashboard/resume', label: '🎭 رزومه بازیگری' },
  { key: 'profile', href: '/dashboard/profile', label: '👤 پروفایل' },
  { key: 'courses', href: '/courses', label: '🎬 دوره‌ها' },
];

// منوی اختصاصیِ فیلمساز: به‌جای برنامه/ثبت‌نام/دستیار/رزومهٔ هنرجویی، فقط دسترسی‌های مربوط به خودش را می‌بیند.
const FILMMAKER_ITEMS = [
  { key: 'dashboard', href: '/dashboard', label: '🏠 داشبورد' },
  { key: 'actors', href: '/actors', label: '🎭 بانک بازیگران' },
  { key: 'profile', href: '/dashboard/profile', label: '👤 پروفایل' },
  { key: 'courses', href: '/courses', label: '🎬 دوره‌ها' },
];

function itemsForRole(role, graduated) {
  if (role === 'filmmaker') return FILMMAKER_ITEMS;
  // هنرجوی فارغ‌التحصیل تقویم کلاس را در منو نمی‌بیند.
  return graduated ? STUDENT_ITEMS.filter((it) => it.key !== 'schedule') : STUDENT_ITEMS;
}

export default function DashboardSidebar({ active, role, isAdmin = false, isManager = false, graduated = false }) {
  const showManager = isAdmin || isManager;
  const visibleItems = itemsForRole(role, graduated);
  return (
    <aside className="sidebar">
      <div className="sidebar-logo"><Link href="/">خانواده <span>برداشت</span></Link></div>
      <ul className="sidebar-menu">
        {visibleItems.map((it) => (
          <li key={it.key}>
            <Link className={active === it.key ? 'active' : undefined} href={it.href}>{it.label}</Link>
          </li>
        ))}
        {showManager && (
          <>
            <li className="sep">مدیریت</li>
            <li><Link className={active === 'enrollments' ? 'active' : undefined} href="/dashboard/admin/enrollments">📋 بررسی ثبت‌نام‌ها</Link></li>
            <li><Link className={active === 'signups' ? 'active' : undefined} href="/dashboard/admin/signups">✅ تأیید حساب‌ها</Link></li>
            <li><Link className={active === 'classes' ? 'active' : undefined} href="/dashboard/admin/classes">📅 کلاس‌ها و تقویم</Link></li>
            <li><Link className={active === 'payments' ? 'active' : undefined} href="/dashboard/admin/payments">💳 پرداخت‌ها و شهریه</Link></li>
            <li><Link className={active === 'bookings' ? 'active' : undefined} href="/dashboard/admin/bookings">🎬 درخواست‌های ست تایم</Link></li>
            <li><Link className={active === 'support' ? 'active' : undefined} href="/dashboard/admin/support">💬 پشتیبانی آنلاین</Link></li>
            <li><Link className={active === 'posts' ? 'active' : undefined} href="/dashboard/admin/posts">📝 محتوا و انتشار</Link></li>
            <li><Link className={active === 'courses-admin' ? 'active' : undefined} href="/dashboard/admin/courses">🎓 فروش دوره</Link></li>
            <li><Link className={active === 'content' ? 'active' : undefined} href="/dashboard/admin/content">📄 متن صفحات</Link></li>
            <li><Link className={active === 'admin' ? 'active' : undefined} href="/dashboard/admin">⚙️ کاربران</Link></li>
          </>
        )}
        <li className="sep">سایت</li>
        <li><Link href="/">بازگشت به سایت</Link></li>
      </ul>
    </aside>
  );
}
