import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminSiteContent from '@/components/AdminSiteContent';

export const metadata = { title: 'ویرایش متن صفحات' };

export default async function AdminContentPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/content');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="content" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">ویرایش متن صفحات</h1>
          <p className="dash-head__sub">متن صفحهٔ اصلی، دربارهٔ ما، اطلاعات تماس، جزئیات و سرفصل‌های هر دوره، و همچنین عکس‌ها و اسلایدشوها را همین‌جا ویرایش کنید. پس از ذخیره، تغییرات بلافاصله روی سایت اعمال می‌شود.</p>
        </div>
        <AdminSiteContent />
      </main>
    </div>
  );
}
