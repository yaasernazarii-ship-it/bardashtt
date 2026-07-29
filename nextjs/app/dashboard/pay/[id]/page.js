import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import MyPayments from '@/components/MyPayments';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'پرداخت' };

export default async function PayInvoicePage({ params }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/auth?next=/dashboard/pay/${id}`);

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="enrollment" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">پرداخت شهریه</h1>
          <p style={{ color: 'var(--muted)' }}>جزئیات پرداخت را ببینید و مبلغ را به‌صورت آنلاین بپردازید.</p>
        </div>
        <div style={{ maxWidth: 560 }}>
          <MyPayments onlyId={id} />
        </div>
      </main>
    </div>
  );
}
