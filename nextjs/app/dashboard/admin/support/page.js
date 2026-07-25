import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminSupport from '@/components/AdminSupport';

export const metadata = { title: 'پشتیبانی آنلاین' };

export default async function AdminSupportPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/support');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="support" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">پشتیبانی آنلاین</h1>
          <p style={{ color: 'var(--muted)' }}>پیام‌های بازدیدکنندگان سایت را ببینید و به‌صورت زنده پاسخ دهید.</p>
        </div>
        <AdminSupport />
      </main>
    </div>
  );
}
