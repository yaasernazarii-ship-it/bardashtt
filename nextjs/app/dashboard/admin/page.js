import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminUsers from '@/components/AdminUsers';

export const metadata = { title: 'کاربران' };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="admin" role={user.role} isAdmin isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">کاربران</h1>
          <p className="dash-head__sub">پرونده، نقش و دسترسی حساب‌های کاربری را مدیریت کنید.</p>
        </div>
        <AdminUsers />
      </main>
    </div>
  );
}
