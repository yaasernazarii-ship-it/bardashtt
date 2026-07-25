import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminEnrollments from '@/components/AdminEnrollments';

export const metadata = { title: 'بررسی ثبت‌نام‌ها' };

export default async function AdminEnrollmentsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="enrollments" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">بررسی درخواست‌های ثبت‌نام</h1>
          <p style={{ color: 'var(--muted)' }}>ویدیوی هنرجویان را ببینید و در صورت تأیید، حساب کاربری آن‌ها به‌صورت خودکار ساخته می‌شود.</p>
        </div>
        <AdminEnrollments />
      </main>
    </div>
  );
}
