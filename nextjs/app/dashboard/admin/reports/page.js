import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminStaffHub from '@/components/AdminStaffHub';
import { countChatUnread } from '@/lib/staffChat';

// صفحهٔ داخلیِ تیم مدیریت؛ نه در گوگل می‌آید و نه برای نقش‌های دیگر باز می‌شود.
export const metadata = { title: 'گزارش کار تیمی', robots: { index: false, follow: false } };

export default async function StaffReportsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/reports');
  if (!isManager(user)) redirect('/dashboard');

  const chatUnread = await countChatUnread(user);

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="reports" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">گزارش کار تیمی</h1>
          <p className="dash-head__sub">
            دفترِ کار مشترک مدیر و ادیتور. در تب «تیکت و گزارش کار» کارها را ثبت و پیگیری کنید و مشخص کنید
            گزارش برای کدام همکار است یا برای همهٔ تیم؛ در تب «گفت‌وگوی تیمی» هم می‌توانید زنده با هم حرف بزنید.
          </p>
        </div>
        <AdminStaffHub initialChatUnread={chatUnread} />
      </main>
    </div>
  );
}
