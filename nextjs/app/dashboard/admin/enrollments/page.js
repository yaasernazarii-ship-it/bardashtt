import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminEnrollments from '@/components/AdminEnrollments';

export const metadata = { title: 'ثبت‌نام دوره و تست بازیگری' };

export default async function AdminEnrollmentsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="enrollments" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">ثبت‌نام دوره و تست بازیگری</h1>
          <p className="dash-head__sub">دورهٔ انتخابی، پاسخ تست، تحلیل بازیگری و ویدیوی معرفی متقاضیان را بررسی و تصمیم نهایی را ثبت کنید.</p>
        </div>
        <AdminEnrollments />
      </main>
    </div>
  );
}
