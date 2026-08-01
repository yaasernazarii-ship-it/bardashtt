import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminBooks from '@/components/AdminBooks';

export const metadata = { title: 'فروش کتاب' };

export default async function AdminBooksPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/books');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="books-admin" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">فروش کتاب</h1>
          <p style={{ color: 'var(--muted)' }}>
            کتاب اضافه کنید، مبلغ فروش را خودتان تعیین کنید و عکس جلد و معرفی را وارد کنید. کتاب‌ها در صفحهٔ «مسئولیت اجتماعی» نمایش داده می‌شوند و بازدیدکنندگان می‌توانند سفارش ثبت کنند. سفارش‌های هر کتاب را از همین‌جا ببینید و وضعیت‌شان را مدیریت کنید.
          </p>
        </div>
        <AdminBooks />
      </main>
    </div>
  );
}
