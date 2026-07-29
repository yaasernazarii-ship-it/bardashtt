import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import MyEnrollments from '@/components/MyEnrollments';
import MyPayments from '@/components/MyPayments';

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

        <div style={{ marginTop: 36 }}>
          <h2 className="heading" style={{ fontSize: '1.25rem', marginBottom: 6 }}>شهریه و پرداخت‌ها</h2>
          <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: 16 }}>
            شهریهٔ دوره و هزینه‌های مربوط (بیمه و پلاتو، لوکیشن و تغذیهٔ اردو) اینجا نمایش داده می‌شود.
          </p>
          <MyPayments />
        </div>
      </main>
    </div>
  );
}
