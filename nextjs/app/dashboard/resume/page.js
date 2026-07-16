import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import ResumeForm from '@/components/ResumeForm';

export const metadata = { title: 'رزومه بازیگری' };

export default async function ResumePage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="resume" isAdmin={isManager(user)} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">رزومه بازیگری</h1>
          <p style={{ color: 'var(--muted)' }}>رزومه خود را کامل کنید. با فعال‌کردن نمایش عمومی، فیلم‌سازان می‌توانند آن را در فهرست بازیگران ببینند.</p>
        </div>
        <ResumeForm />
      </main>
    </div>
  );
}
