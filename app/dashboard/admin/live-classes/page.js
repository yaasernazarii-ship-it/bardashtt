import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminLiveClasses from '@/components/AdminLiveClasses';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'کلاس‌های آنلاین' };

export default async function AdminLiveClassesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/live-classes');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="live-classes" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">کلاس‌های آنلاین</h1>
          <p className="dash-head__sub">
            پخش زندهٔ هر جلسه را از همین‌جا شروع یا پایان دهید. فقط هنرجویانِ همان کلاس، و فقط هنگام پخش زنده، اجازهٔ ورود دارند.
          </p>
        </div>
        <AdminLiveClasses isAdmin={user.role === 'admin'} />
      </main>
    </div>
  );
}
