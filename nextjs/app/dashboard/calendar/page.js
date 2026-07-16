import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export const metadata = { title: 'تقویم کلاس' };

export default async function CalendarPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <aside className="sidebar">
        <div className="sidebar-logo"><Link href="/">خانواده <span>برداشت</span></Link></div>
        <ul className="sidebar-menu">
          <li><Link href="/dashboard">🏠 داشبورد</Link></li>
          <li><Link className="active" href="/dashboard/calendar">🗓 تقویم کلاس</Link></li>
          <li><Link href="/dashboard/assistant">🤖 دستیار کتاب</Link></li>
          <li><Link href="/dashboard/profile">👤 پروفایل</Link></li>
          <li><Link href="/courses">🎓 دوره‌ها</Link></li>
          <li className="sep">سایت</li>
          <li><Link href="/">بازگشت به سایت</Link></li>
        </ul>
      </aside>
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">تقویم کلاس</h1>
          <p style={{ color: 'var(--muted)' }}>برنامه کلاس‌های شما به‌صورت تقویمی اینجا نمایش داده می‌شود.</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>این بخش در مرحله بعد فعال می‌شود.</p>
        </div>
      </main>
    </div>
  );
}
