import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import StudentSchedule from '@/components/StudentSchedule';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'برنامه و تقویم من' };

export default async function SchedulePage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/schedule');
  // هنرجوی فارغ‌التحصیل به تقویم کلاس دسترسی ندارد.
  if (user.graduated && !isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="schedule" isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">برنامه و تقویم من</h1>
          <p style={{ color: 'var(--muted)' }}>دوره، تقویم جلسات، چارت درسی، ابزار لازم و تمرین‌های شما در این بخش نمایش داده می‌شود.</p>
        </div>
        <StudentSchedule />
      </main>
    </div>
  );
}
