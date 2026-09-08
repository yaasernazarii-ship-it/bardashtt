import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminUsers from '@/components/AdminUsers';

export const metadata = { title: 'رزومه هنرجویان' };

export default async function AdminResumesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/resumes');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="resumes" role={user.role} isAdmin={user.role === 'admin'} isManager />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">رزومه هنرجویان</h1>
          <p className="dash-head__sub">برای هر هنرجو رزومه بازیگری بسازید، اطلاعات و نمونه‌کارها را ویرایش کنید و وضعیت نمایش عمومی را تعیین کنید.</p>
        </div>
        <AdminUsers resumeOnly />
      </main>
    </div>
  );
}
