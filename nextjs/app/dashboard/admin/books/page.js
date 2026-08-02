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
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">فروش کتاب</h1>
          <p className="dash-head__sub">
            کتاب اضافه کنید، مبلغ فروش را خودتان تعیین کنید و عکس جلد و معرفی را وارد کنید. کتاب‌ها در صفحهٔ «مسئولیت اجتماعی» نمایش داده می‌شوند و بازدیدکنندگان می‌توانند سفارش ثبت کنند. سفارش‌های هر کتاب را از همین‌جا ببینید و وضعیت‌شان را مدیریت کنید.
          </p>
        </div>
        <AdminBooks />
      </main>
    </div>
  );
}
