import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import MyEnrollments from '@/components/MyEnrollments';

export const metadata = { title: 'ثبت‌نام من' };

export default async function MyEnrollmentPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');
  // این بخش مخصوص هنرجوست؛ فیلمساز روند ثبت‌نام آموزشی ندارد.
  if (user.role === 'filmmaker') redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="enrollment" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">ثبت‌نام و روند آموزش من</h1>
          <p style={{ color: 'var(--muted)' }}>وضعیت درخواست ثبت‌نام و مراحل پیش رو را اینجا دنبال کنید.</p>
        </div>
        <MyEnrollments />
      </main>
    </div>
  );
}
