import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import ProfileForm from '@/components/ProfileForm';
import DashboardSidebar from '@/components/DashboardSidebar';

export const metadata = { title: 'پروفایل هنرجو' };

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="profile" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">پروفایل من</h1>
          <p className="dash-head__sub">اطلاعات حساب کاربری خود را تکمیل و ویرایش کنید.</p>
        </div>
        <ProfileForm role={user.role} initial={{ phone: user.phone, contactPhone: user.contactPhone, displayName: user.displayName, city: user.city, birthYear: user.birthYear, gender: user.gender, photoUrl: user.photoUrl }} />
        {/* رمز عبور را فقط مدیریت (ادمین/ادیتور) صادر و تغییر می‌دهد؛ کاربر خودش دسترسی تغییر ندارد. */}
        <div className="form-shell" style={{ maxWidth: 520, marginTop: 24 }}>
          <div className="form-shell__head">
            <h2>اطلاعات ورود</h2>
            <p>
              {user.username
                ? `نام کاربری شما «${user.username}» است.`
                : 'برای حساب شما هنوز نام کاربری صادر نشده است.'}
            </p>
          </div>
          <p style={{ color: 'var(--muted)', lineHeight: 2, margin: 0 }}>
            نام کاربری و رمز عبور را مدیریت آموزشگاه صادر می‌کند. برای دریافت یا تغییر رمز عبور
            با پشتیبانی تماس بگیرید. اگر رمزتان را فراموش کرده‌اید، می‌توانید از صفحهٔ ورود با
            «ورود با شماره موبایل و کد پیامکی» وارد شوید.
          </p>
        </div>
      </main>
    </div>
  );
}
