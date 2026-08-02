import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminCourses from '@/components/AdminCourses';

export const metadata = { title: 'فروش دورهٔ آنلاین' };

export default async function AdminCoursesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/courses');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="courses-admin" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">فروش دورهٔ آنلاین</h1>
          <p className="dash-head__sub">
            دوره بسازید، تیزرِ رایگان و ویدیوهای دوره را (لینک آپارات یا کد امبدِ سرویسِ محدودسازیِ دامنه مثل ویدپروتکت/نگاوید) وارد کنید و قیمت را تعیین کنید.
            تیزر برای همه نمایش داده می‌شود و ویدیوها فقط برای کسانی که دسترسی دارند باز می‌شود. با «مدیریت دسترسی» می‌توانید به خریداران دستی دسترسی بدهید؛ همچنین با پرداختِ paidشدهٔ دوره، دسترسی خودکار داده می‌شود.
          </p>
        </div>
        <AdminCourses />
      </main>
    </div>
  );
}
