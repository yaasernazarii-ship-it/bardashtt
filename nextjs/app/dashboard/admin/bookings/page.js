import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminBookings from '@/components/AdminBookings';

export const metadata = { title: 'درخواست‌های ست تایم' };

export default async function AdminBookingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/bookings');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="bookings" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">درخواست‌های ست تایم بازیگران</h1>
          <p className="dash-head__sub">فیلم‌سازانی که از رزومهٔ بازیگران درخواست همکاری داده‌اند اینجا نمایش داده می‌شوند. می‌توانید تماس بگیرید و وضعیت هر درخواست را مدیریت کنید.</p>
        </div>
        <AdminBookings />
      </main>
    </div>
  );
}
