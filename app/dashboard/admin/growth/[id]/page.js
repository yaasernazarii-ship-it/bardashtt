import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminGrowthStudent from '@/components/AdminGrowthStudent';

export const metadata = { title: 'پروندهٔ مسیر رشد هنرجو' };

export default async function AdminGrowthStudentPage({ params }) {
  const user = await getSessionUser();
  if (!user) redirect('/auth');
  if (!isManager(user)) redirect('/dashboard');
  const { id } = await params;

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="growth-admin" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <AdminGrowthStudent studentId={id} />
      </main>
    </div>
  );
}
