import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminGrowthDashboard from '@/components/AdminGrowthDashboard';

export const metadata = { title: 'مسیر رشد هنرجویان' };

export default async function AdminGrowthPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="growth-admin" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">مسیر رشد هنرجویان</h1>
          <p className="dash-head__sub">روند فعالیت و پایبندی هنرجویان به برنامهٔ شخصی‌شان را دنبال کنید و تمرین، ارزیابی و یادداشت ثبت کنید.</p>
        </div>
        <AdminGrowthDashboard />
      </main>
    </div>
  );
}
