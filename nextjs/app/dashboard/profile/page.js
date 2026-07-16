import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import ProfileForm from '@/components/ProfileForm';

export const metadata = { title: 'پروفایل هنرجو' };

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <aside className="sidebar">
        <div className="sidebar-logo"><Link href="/">خانواده <span>برداشت</span></Link></div>
        <ul className="sidebar-menu">
          <li><Link href="/dashboard">🏠 داشبورد</Link></li>
          <li><Link href="/dashboard/calendar">🗓 تقویم کلاس</Link></li>
          <li><Link href="/dashboard/assistant">🤖 دستیار کتاب</Link></li>
          <li><Link className="active" href="/dashboard/profile">👤 پروفایل</Link></li>
          <li><Link href="/courses">🎓 دوره‌ها</Link></li>
          <li className="sep">سایت</li>
          <li><Link href="/">بازگشت به سایت</Link></li>
        </ul>
      </aside>
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">پروفایل من</h1>
          <p style={{ color: 'var(--muted)' }}>اطلاعات حساب کاربری خود را تکمیل و ویرایش کنید.</p>
        </div>
        <ProfileForm initial={{ phone: user.phone, displayName: user.displayName, city: user.city, birthYear: user.birthYear }} />
      </main>
    </div>
  );
}
