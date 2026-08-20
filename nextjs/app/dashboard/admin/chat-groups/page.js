import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminChatGroups from '@/components/AdminChatGroups';

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
            برای هر دوره یک گروه بسازید، نام و عکس گروه را تعیین کنید و خودتان انتخاب کنید چه هنرجویانی عضو آن باشند.
          </p>
        </div>
        {/* حذف کامل گروه فقط از عهدهٔ ادمین برمی‌آید؛ ادیتور می‌تواند گروه را ببندد. */}
        <AdminChatGroups canDelete={user.role === 'admin'} />
      </main>
    </div>
  );
}
