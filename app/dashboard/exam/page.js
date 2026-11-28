import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import ExamRunner from '@/components/ExamRunner';

export const metadata = { title: 'آزمون فارغ‌التحصیلی' };

export default async function ExamPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/exam');
  if (user.role !== 'student' && !isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="exam" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">آزمون و گواهی‌نامه</h1>
          <p className="dash-head__sub">آزمون پایان دوره را اینجا می‌دهید و پس از قبولی، گواهی‌نامهٔ آموزشگاه سینمایی تک برداشت صادر می‌شود.</p>
        </div>
        <ExamRunner />
      </main>
    </div>
  );
}
