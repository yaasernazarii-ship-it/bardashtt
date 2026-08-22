import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminSignups from '@/components/AdminSignups';

export const metadata = { title: 'درخواست عضویت و ساخت حساب' };

export default async function AdminSignupsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/signups');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="signups" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">درخواست عضویت و ساخت حساب</h1>
          <p className="dash-head__sub">مشخصات و مدارک درخواست‌های عضویت را بررسی کنید و پس از تأیید، نام کاربری و رمز ورود بسازید.</p>
        </div>
        <AdminSignups />
      </main>
    </div>
  );
}
