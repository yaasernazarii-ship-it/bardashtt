import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import MyBookOrders from '@/components/MyBookOrders';

export const metadata = { title: 'سفارش‌های من' };

export default async function MyOrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/orders');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="orders" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">سفارش‌های من</h1>
          <p className="dash-head__sub">سفارش‌های کتاب و وضعیت پرداخت آن‌ها با کد پیگیری اینجا ثبت می‌شود.</p>
        </div>
        <MyBookOrders />
      </main>
    </div>
  );
}
