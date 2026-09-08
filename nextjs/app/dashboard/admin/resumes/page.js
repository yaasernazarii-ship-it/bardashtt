import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminResumes from '@/components/AdminResumes';

export const metadata = { title: 'بانک رزومه' };

export default async function AdminResumesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/resumes');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="resumes" role={user.role} isAdmin={user.role === 'admin'} isManager />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">بانک رزومه</h1>
          <p className="dash-head__sub">
            هر رزومه یک پروندهٔ مستقل است و به هیچ حساب کاربری وصل نمی‌شود؛ ساخت، ویرایش و حذف آن فقط در اختیار مدیر و ادیتور است.
          </p>
        </div>
        <AdminResumes />
      </main>
    </div>
  );
}
