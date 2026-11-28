import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import SocialComposer from '@/components/SocialComposer';
import { getSocialIdentity } from '@/lib/socialAuth';

export const metadata = { title: 'برداشتگرام من' };

export default async function DashboardSocialPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/social');
  const socialIdentity = await getSocialIdentity();

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
        {socialIdentity.account ? <SocialComposer /> : (
          <p className="alert alert--error">حساب برداشتگرام شما در دسترس نیست؛ با پشتیبانی تماس بگیرید.</p>
        )}
      </main>
    </div>
  );
}
