import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import LiveClassRoom from '@/components/LiveClassRoom';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'کلاس آنلاین' };

export default async function LiveClassRoomPage({ params }) {
  const user = await getSessionUser();
  const { id } = await params;
  if (!user) redirect(`/auth?next=/dashboard/live-classes/${id}`);
  if (user.graduated && !isManager(user)) redirect('/dashboard');
  if (user.role === 'filmmaker') redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="live-classes" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <LiveClassRoom sessionId={id} />
      </main>
    </div>
  );
}
