import { redirect } from 'next/navigation';
import { getSessionUser, isManager, isFilmmakerOrManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import MyShortlist from '@/components/MyShortlist';

export const metadata = { title: 'لیست کوتاه من', robots: { index: false, follow: false } };

export default async function ShortlistPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/shortlist');
  // مثل بانک بازیگران، این بخش فقط برای فیلمساز و ادمین/ادیتور معنا دارد.
  if (!isFilmmakerOrManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="shortlist" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">لیست کوتاه من</h1>
          <p className="dash-head__sub">بازیگرانی که برای بررسی بعدی نشان کرده‌اید. هر وقت خواستید از همین‌جا درخواست ست تایم بدهید.</p>
        </div>
        <MyShortlist />
      </main>
    </div>
  );
}
