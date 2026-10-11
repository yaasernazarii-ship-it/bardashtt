import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminAiKnowledge from '@/components/AdminAiKnowledge';

export const metadata = { title: 'منابع هوش مصنوعی' };

export default async function AdminAiKnowledgePage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/ai-knowledge');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="ai-knowledge" role={user.role} isAdmin isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">منابع هوش مصنوعی</h1>
          <p className="dash-head__sub">جزوه‌ها و مطالب تکمیلی دستیار را ثبت و مدیریت کنید.</p>
        </div>
        <AdminAiKnowledge />
      </main>
    </div>
  );
}
