import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminChatHub from '@/components/AdminChatHub';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'گروه‌های گفت‌وگوی هنرجویان' };

export default async function AdminChatGroupsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="chat-groups" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">گروه‌های گفت‌وگوی هنرجویان</h1>
          <p className="dash-head__sub">
            گروه‌ها و اعضا را مدیریت کنید و همهٔ پیام‌های خصوصی میان هنرجویان را زیر نظر داشته باشید.
          </p>
        </div>
        <AdminChatHub />
      </main>
    </div>
  );
}
