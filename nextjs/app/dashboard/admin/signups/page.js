import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminSignups from '@/components/AdminSignups';

export const metadata = { title: 'تأیید حساب‌ها' };

export default async function AdminSignupsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/signups');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="signups" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">تأیید حساب‌های کاربری</h1>
          <p style={{ color: 'var(--muted)' }}>درخواست‌های عضویت هنرجویان را ببینید و در صورت تأیید، برای هر نفر نام کاربری و رمز عبور بسازید تا با آن وارد شوند.</p>
        </div>
        <AdminSignups />
      </main>
    </div>
  );
}
