import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminStaffReports from '@/components/AdminStaffReports';

// صفحهٔ داخلیِ تیم مدیریت؛ نه در گوگل می‌آید و نه برای نقش‌های دیگر باز می‌شود.
export const metadata = { title: 'گزارش کار تیمی', robots: { index: false, follow: false } };

export default async function StaffReportsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/reports');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="reports" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">گزارش کار تیمی</h1>
          <p className="dash-head__sub">
            دفترِ کار مشترک مدیر و ادیتور: کاری که انجام داده‌اید را اینجا بنویسید، به گزارش همکار پاسخ بدهید و
            کارهای تمام‌شده را ببندید. با هر گزارش تازه، همکاران اعلان می‌گیرند.
          </p>
        </div>
        <AdminStaffReports />
      </main>
    </div>
  );
}
