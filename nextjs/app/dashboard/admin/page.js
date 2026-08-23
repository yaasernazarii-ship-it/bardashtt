import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminAiKnowledge from '@/components/AdminAiKnowledge';
import AdminUsers from '@/components/AdminUsers';

export const metadata = { title: 'خانه مدیریت' };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="admin" role={user.role} isAdmin isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">خانه مدیریت</h1>
          <p className="dash-head__sub">منابع هوش مصنوعی و حساب‌های کاربری را از این بخش مدیریت کنید.</p>
        </div>
        <AdminAiKnowledge />
        <AdminUsers />
      </main>
    </div>
  );
}
