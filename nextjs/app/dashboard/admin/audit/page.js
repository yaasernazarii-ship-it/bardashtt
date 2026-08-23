import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminAuditLog from '@/components/AdminAuditLog';

export const metadata = { title: 'گزارش تغییرات' };

export default async function AdminAuditPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/audit');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="audit" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">گزارش تغییرات</h1>
          <p className="dash-head__sub">این صفحه فقط برای اعضای مدیریت قابل مشاهده است و تغییرات مدیریتی را همراه با نام انجام‌دهنده و زمان دقیق نمایش می‌دهد.</p>
        </div>
        <AdminAuditLog />
      </main>
    </div>
  );
}
