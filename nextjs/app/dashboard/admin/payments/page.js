import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminPayments from '@/components/AdminPayments';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'پرداخت‌ها و شهریه' };

export default async function AdminPaymentsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/payments');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="payments" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">پرداخت‌ها و شهریه</h1>
          <p style={{ color: 'var(--muted)' }}>
            شهریهٔ دوره‌ها یا هزینه‌های جدا (بیمه و پلاتو، لوکیشن و تغذیهٔ اردو، افیش) را برای هنرجو ثبت کنید،
            لینک پرداخت را برایش بفرستید و وضعیت پرداخت‌ها را مدیریت کنید.
          </p>
        </div>
        <AdminPayments />
      </main>
    </div>
  );
}
