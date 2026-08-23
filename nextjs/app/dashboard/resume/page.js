import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import ResumeForm from '@/components/ResumeForm';

export const metadata = { title: 'رزومه بازیگری' };

export default async function ResumePage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');
  if (user.role === 'student') redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="resume" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">رزومه بازیگری</h1>
          <p className="dash-head__sub">رزومه را کامل کنید و در صورت نیاز نمایش عمومی آن را فعال کنید.</p>
        </div>
        <ResumeForm />
      </main>
    </div>
  );
}
