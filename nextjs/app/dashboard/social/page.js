import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import SocialComposer from '@/components/SocialComposer';
import { canUseSocial } from '@/lib/social';

export const metadata = { title: 'برداشتگرام من' };

export default async function DashboardSocialPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/social');
  // عضو عادیِ ثبت‌نام‌نشده اجازهٔ انتشار ندارد و به خانهٔ پنل برمی‌گردد.
  if (!canUseSocial(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar
        active="social"
        role={user.role}
        isAdmin={user.role === 'admin'}
        isManager={user.role === 'admin' || user.role === 'editor'}
        graduated={user.graduated}
      />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">برداشتگرام</h1>
          <p className="dash-head__sub">
            کارت را اینجا منتشر کن: عکسِ تمرین، پشت‌صحنه، معرفی نقش یا لینک ویدیوی آپارات.
            «پست» ماندگار است و «استوری» ۲۴ ساعت بعد از انتشار خودکار پاک می‌شود.
          </p>
        </div>
        <SocialComposer />
      </main>
    </div>
  );
}
