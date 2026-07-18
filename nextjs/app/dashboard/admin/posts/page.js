import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminPosts from '@/components/AdminPosts';

export const metadata = { title: 'مدیریت مطالب' };

export default async function AdminPostsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/posts');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="posts" isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">مدیریت مطالب</h1>
          <p style={{ color: 'var(--muted)' }}>مطلب، خبر یا مقاله بسازید؛ عکس آپلود کنید و لینک ویدیوی آپارات بگذارید. مطالب منتشرشده در صفحهٔ «اخبار و مطالب» سایت دیده می‌شوند.</p>
        </div>
        <AdminPosts />
      </main>
    </div>
  );
}
