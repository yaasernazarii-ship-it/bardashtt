import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import ActorIntroductionForm from '@/components/ActorIntroductionForm';
import ActorPortfolioForm from '@/components/ActorPortfolioForm';

export const metadata = { title: 'معرفی بازیگر' };

export default async function StudentIntroductionPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');
  if (user.role !== 'student') redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="resume" role={user.role} graduated={user.graduated} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">معرفی بازیگر</h1>
          <p className="dash-head__sub">مشخصات و عکس‌های معرفی شما برای مشاهده در بانک بازیگران.</p>
        </div>
        <ActorIntroductionForm />
        <ActorPortfolioForm />
      </main>
    </div>
  );
}
