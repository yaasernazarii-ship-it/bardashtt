import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminSiteLinks from '@/components/AdminSiteLinks';

export const metadata = { title: 'لینک‌های صفحات' };

export default async function AdminLinksPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/links');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="links" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">لینک‌های صفحات</h1>
          <p className="dash-head__sub">لینک هر صفحه و هر بخش سایت اینجا آماده است. با دکمهٔ «کپی» نشانی کامل را بردار و هرجا خواستی (پیام، اینستاگرام، دکمه‌ها) استفاده کن. «باز کردن» همان صفحه/بخش را در تب جدید نشان می‌دهد.</p>
        </div>
        <AdminSiteLinks />
      </main>
    </div>
  );
}
