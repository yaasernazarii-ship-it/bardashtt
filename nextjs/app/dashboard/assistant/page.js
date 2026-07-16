import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';

export const metadata = { title: 'دستیار کتاب' };

export default async function AssistantPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="assistant" isAdmin={isManager(user)} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">دستیار هوشمند کتاب</h1>
          <p style={{ color: 'var(--muted)' }}>پرسش‌های خود را بر اساس کتاب و جزوه‌های آقای نظری بپرسید.</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>این بخش پس از بارگذاری کتاب و جزوه‌ها فعال می‌شود.</p>
        </div>
      </main>
    </div>
  );
}
