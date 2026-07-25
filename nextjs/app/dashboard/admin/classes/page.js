import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminClasses from '@/components/AdminClasses';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'کلاس‌ها و تقویم' };

export default async function AdminClassesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/classes');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="classes" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">کلاس‌ها و تقویم هنرجویان</h1>
          <p style={{ color: 'var(--muted)' }}>
            کلاس‌های هر شعبه را بسازید، هنرجویان را به کلاس‌ها اختصاص دهید و برای هر جلسه تاریخ، چارت درسی، ابزار و تمرین تعیین کنید.
          </p>
        </div>
        <AdminClasses />
      </main>
    </div>
  );
}
