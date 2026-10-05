import { redirect } from 'next/navigation';
import { getSessionUser, isPrimaryAdmin } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminAccountSessions from '@/components/AdminAccountSessions';

export const metadata = { title: 'نشست‌های فعال' };

export default async function AccountSessionsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/account-sessions');
  if (!isPrimaryAdmin(user)) redirect('/dashboard/admin');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="account-sessions" role={user.role} isAdmin isManager />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">نشست‌های فعال</h1>
          <p className="dash-head__sub">مشاهده و ابطال دستی ورودهای فعال؛ این بخش فقط برای مدیر اصلی است.</p>
        </div>
        <AdminAccountSessions />
      </main>
    </div>
  );
}
