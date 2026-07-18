import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminUsers from '@/components/AdminUsers';

export const metadata = { title: 'مدیریت کاربران' };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="admin" isAdmin />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">مدیریت کاربران</h1>
          <p style={{ color: 'var(--muted)' }}>نقش کاربران را تعیین کنید. ادمین دسترسی کامل و ادیتور دسترسی مدیریت محتوا و تقویم دارد.</p>
        </div>
        <AdminUsers />
      </main>
    </div>
  );
}
