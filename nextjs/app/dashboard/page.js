import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';

export const metadata = { title: 'داشبورد هنرجو' };

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  const name = user.displayName || 'هنرجوی گرامی';

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <aside className="sidebar">
        <div className="sidebar-logo"><Link href="/">خانواده <span>برداشت</span></Link></div>
        <ul className="sidebar-menu">
          <li><Link className="active" href="/dashboard">🏠 داشبورد</Link></li>
          <li><Link href="/dashboard/calendar">🗓 تقویم کلاس</Link></li>
          <li><Link href="/dashboard/assistant">🤖 دستیار کتاب</Link></li>
          <li><Link href="/dashboard/profile">👤 پروفایل</Link></li>
          <li><Link href="/courses">🎓 دوره‌ها</Link></li>
          <li className="sep">سایت</li>
          <li><Link href="/">بازگشت به سایت</Link></li>
        </ul>
      </aside>
      <main className="main-area">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          <div><h1 className="heading">داشبورد هنرجو</h1><p style={{ color: 'var(--muted)' }}>خوش آمدید {name}؛ وضعیت آموزشی شما اینجاست.</p></div>
          <LogoutButton />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
          <Link href="/dashboard/calendar" style={{ background: 'var(--dark)', borderRadius: 'var(--radius)', padding: 24, color: '#fff' }}><div style={{ color: 'rgba(255,255,255,.45)', fontSize: '.75rem', fontWeight: 700 }}>تقویم کلاس</div><h2 style={{ fontSize: '1.5rem', margin: '8px 0' }}>برنامه کلاس‌های شما</h2><p style={{ color: 'var(--gold-lt)' }}>مشاهده تقویم →</p></Link>
          <Link href="/dashboard/assistant" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}><h3 style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 12 }}>دستیار هوشمند</h3><strong style={{ fontSize: '1.2rem', color: 'var(--dark)' }}>پرسش از کتاب آقای نظری</strong><p style={{ color: 'var(--muted)', marginTop: 8 }}>به‌زودی فعال می‌شود.</p></Link>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}><h3 style={{ color: 'var(--dark)' }}>حساب کاربری</h3><p style={{ color: 'var(--muted)' }}>شماره موبایل: <span dir="ltr">{user.phone}</span></p><Link href="/dashboard/profile" style={{ color: 'var(--dark)', fontWeight: 700 }}>تکمیل پروفایل →</Link></div>
        </div>
      </main>
    </div>
  );
}
