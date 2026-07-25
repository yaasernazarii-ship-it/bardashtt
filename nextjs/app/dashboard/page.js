import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';
import DashboardSidebar from '@/components/DashboardSidebar';

export const metadata = { title: 'داشبورد هنرجو' };

function FilmmakerDashboard({ user }) {
  const name = user.displayName || 'فیلمساز گرامی';
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        <div><h1 className="heading">داشبورد فیلمساز</h1><p style={{ color: 'var(--muted)' }}>خوش آمدید {name}؛ از اینجا به بانک بازیگران خانواده برداشت دسترسی دارید.</p></div>
        <LogoutButton />
      </div>
      <Link href="/actors" style={{ display: 'block', background: 'var(--dark)', borderRadius: 'var(--radius)', padding: 32, color: '#fff', marginBottom: 18 }}>
        <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '.75rem', fontWeight: 700 }}>ویژه‌ی فیلم‌سازان</div>
        <h2 style={{ fontSize: '1.6rem', margin: '10px 0' }}>🎭 بانک بازیگران</h2>
        <p style={{ color: 'var(--gold-lt)', margin: 0 }}>مشاهده رزومه‌ها و ثبت درخواست ست تایم →</p>
      </Link>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
          <h3 style={{ color: 'var(--dark)', marginBottom: 8 }}>حساب کاربری</h3>
          <p style={{ color: 'var(--muted)' }}>شماره موبایل: <span dir="ltr">{user.phone}</span></p>
          <Link href="/dashboard/profile" style={{ color: 'var(--dark)', fontWeight: 700 }}>تکمیل پروفایل →</Link>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
          <h3 style={{ color: 'var(--dark)', marginBottom: 8 }}>دوره‌های خانواده برداشت</h3>
          <p style={{ color: 'var(--muted)' }}>معرفی دوره‌ها و کارگاه‌های آموزشی را ببینید.</p>
          <Link href="/courses" style={{ color: 'var(--dark)', fontWeight: 700 }}>مشاهده دوره‌ها →</Link>
        </div>
      </div>
    </>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  const name = user.displayName || 'هنرجوی گرامی';

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="dashboard" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        {user.role === 'filmmaker' ? (
          <FilmmakerDashboard user={user} />
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
              <div><h1 className="heading">داشبورد هنرجو</h1><p style={{ color: 'var(--muted)' }}>خوش آمدید {name}؛ وضعیت آموزشی شما اینجاست.</p></div>
              <LogoutButton />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
              {!user.graduated && (
                <Link href="/dashboard/calendar" style={{ background: 'var(--dark)', borderRadius: 'var(--radius)', padding: 24, color: '#fff' }}><div style={{ color: 'rgba(255,255,255,.45)', fontSize: '.75rem', fontWeight: 700 }}>تقویم کلاس</div><h2 style={{ fontSize: '1.5rem', margin: '8px 0' }}>برنامه کلاس‌های شما</h2><p style={{ color: 'var(--gold-lt)' }}>مشاهده تقویم →</p></Link>
              )}
              <Link href="/dashboard/assistant" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}><h3 style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 12 }}>دستیار هوشمند</h3><strong style={{ fontSize: '1.2rem', color: 'var(--dark)' }}>پرسش از کتاب آقای نظری</strong><p style={{ color: 'var(--muted)', marginTop: 8 }}>به‌زودی فعال می‌شود.</p></Link>
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}><h3 style={{ color: 'var(--dark)' }}>حساب کاربری</h3><p style={{ color: 'var(--muted)' }}>شماره موبایل: <span dir="ltr">{user.phone}</span></p><Link href="/dashboard/profile" style={{ color: 'var(--dark)', fontWeight: 700 }}>تکمیل پروفایل →</Link></div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
