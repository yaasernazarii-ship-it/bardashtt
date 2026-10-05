import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import StudentLiveClasses from '@/components/StudentLiveClasses';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'کلاس‌های آنلاین من' };

export default async function LiveClassesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/live-classes');
  // هنرجوی فارغ‌التحصیل به کلاس آنلاین دسترسی ندارد.
  if (user.graduated && !isManager(user)) redirect('/dashboard');
  // این بخش مخصوص هنرجوست؛ فیلمساز کلاس آنلاین ندارد.
  if (user.role === 'filmmaker') redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="live-classes" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">کلاس‌های آنلاین من</h1>
          <p className="dash-head__sub">هنگام پخش زنده، دکمهٔ «ورود به کلاس» فعال می‌شود.</p>
        </div>
        <StudentLiveClasses />
      </main>
    </div>
  );
}
