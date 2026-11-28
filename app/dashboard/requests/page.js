import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import MyBookings from '@/components/MyBookings';

export const metadata = { title: 'درخواست‌های ست تایم', robots: { index: false, follow: false } };

export default async function MyRequestsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/requests');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="requests" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">درخواست‌های ست تایم</h1>
          <p className="dash-head__sub">درخواست‌هایی که برای دیدار با بازیگران ثبت کرده‌اید، وضعیت پیگیری و پاسخ پشتیبانی اینجاست.</p>
        </div>
        <MyBookings />
      </main>
    </div>
  );
}
