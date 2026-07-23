import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AssistantChat from '@/components/AssistantChat';

export const metadata = { title: 'دستیار کتاب' };

export default async function AssistantPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="assistant" isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div style={{ marginBottom: 24 }}>
          <h1 className="heading">دستیار هوشمند کتاب</h1>
          <p style={{ color: 'var(--muted)' }}>پرسش‌های خود را بر اساس کتاب «متد پنج سوال طلایی» اثر یاسر نظری بپرسید.</p>
        </div>
        <AssistantChat />
      </main>
    </div>
  );
}
