import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import CalendarBoard from '@/components/CalendarBoard';
import DashboardSidebar from '@/components/DashboardSidebar';

export const metadata = { title: 'تقویم کلاس' };

export default async function CalendarPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="calendar" isAdmin={isManager(user)} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">تقویم کلاس</h1>
          <p style={{ color: 'var(--muted)' }}>
            {isManager(user)
              ? 'برنامه کلاس‌ها را مدیریت کنید؛ هنرجویان همین فهرست را می‌بینند.'
              : 'برنامه کلاس‌های شما به‌صورت تقویمی اینجا نمایش داده می‌شود.'}
          </p>
        </div>
        <CalendarBoard />
      </main>
    </div>
  );
}
