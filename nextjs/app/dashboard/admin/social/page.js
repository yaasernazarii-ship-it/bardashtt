import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminSocial from '@/components/AdminSocial';

export const metadata = { title: 'مدیریت شبکهٔ اجتماعی' };

export default async function AdminSocialPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/social');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="social-admin" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">مدیریت شبکهٔ اجتماعی</h1>
          <p className="dash-head__sub">
            هیچ پست یا استوری‌ای بدون تأیید شما روی سایت نمی‌رود. اینجا صف بررسی، گزارش‌های تخلف،
            و همهٔ محتوای منتشرشده را می‌بینید و هر لحظه می‌توانید هر مطلبی را حذف کنید.
          </p>
        </div>
        <AdminSocial />
      </main>
    </div>
  );
}
