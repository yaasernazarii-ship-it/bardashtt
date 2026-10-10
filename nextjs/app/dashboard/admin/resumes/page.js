import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminResumes from '@/components/AdminResumes';

export const metadata = { title: 'بانک رزومه' };

export default async function AdminResumesPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/resumes');
  if (!isManager(user)) redirect('/dashboard');
  const query = await searchParams;
  const startNew = query?.new === '1';

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="resumes" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">بانک رزومه</h1>
          <p className="dash-head__sub">
            پرونده‌های مستقل و معرفی هنرجویان را مدیریت کنید؛ بررسی عکس‌های معرفی فقط در اختیار مدیر و ادیتور است.
          </p>
        </div>
        <AdminResumes startNew={startNew} canReview={['admin', 'editor'].includes(user.role)} />
      </main>
    </div>
  );
}
