import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminPosts from '@/components/AdminPosts';

export const metadata = { title: 'مدیریت و انتشار محتوا' };

export default async function AdminPostsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/posts');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="posts" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">مدیریت و انتشار محتوا</h1>
          <p style={{ color: 'var(--muted)' }}>محتوا (متن، عکس یا ویدیوی آپارات) بسازید، بخش مقصد آن را انتخاب کنید و در صورت نیاز تاریخ و ساعت انتشار تعیین کنید تا دقیقاً همان لحظه خودکار روی سایت منتشر شود. بخش‌ها: اخبار، وبلاگ، آثار (و زیرمجموعه‌ها)، گالری و ویدیوهای فروش دورهٔ آنلاین.</p>
        </div>
        <AdminPosts />
      </main>
    </div>
  );
}
