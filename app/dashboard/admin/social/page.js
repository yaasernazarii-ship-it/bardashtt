import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminSocial from '@/components/AdminSocial';
import SocialComposer from '@/components/SocialComposer';

export const metadata = { title: 'مدیریت برداشتگرام' };

export default async function AdminSocialPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/social');
  if (user.role !== 'admin' && user.role !== 'editor') redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="social-admin" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">مدیریت برداشتگرام</h1>
          <p className="dash-head__sub">
            کاربران بدون نیاز به تأیید شما پست و استوری منتشر می‌کنند. اینجا همهٔ حساب‌ها، گزارش‌های تخلف
            و محتوای منتشرشده را می‌بینید؛ هر لحظه می‌توانید هر مطلبی را حذف یا هر حسابی را مسدود/تعلیق کنید.
          </p>
        </div>
        <section className="stack-card" style={{ marginBottom: 28 }}>
          <h2 className="dash-card__title" style={{ marginBottom: 6 }}>انتشار با صفحهٔ رسمی برداشت</h2>
          <p className="dash-card__text" style={{ marginBottom: 18 }}>
            پست و استوری این بخش با نام «خانواده برداشت» و شناسهٔ رسمی @bardasht منتشر می‌شود، نه با نام شخصی مدیر.
          </p>
          <SocialComposer />
        </section>
        <h2 style={{ fontSize: '1.05rem', margin: '0 0 14px' }}>مدیریت حساب‌ها و محتوا</h2>
        <AdminSocial />
      </main>
    </div>
  );
}
