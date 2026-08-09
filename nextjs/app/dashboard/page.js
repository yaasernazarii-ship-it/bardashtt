import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';
import DashboardSidebar from '@/components/DashboardSidebar';
import Icon from '@/components/Icon';

// پنل شخصیِ هنرجو — نه محتوای عمومی دارد و نه باید در نتایج جست‌وجو بیاید.
// canonical هم حذف شده چون قبلاً به‌اشتباه به صفحهٔ اصلی اشاره می‌کرد.
export const metadata = {
  title: 'داشبورد هنرجو',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.bardashtt.com/dashboard' },
};

// عکس ۳×۴ کاربر در سرصفحهٔ پنل؛ اگر عکسی ثبت نشده باشد دعوت به آپلود نمایش داده می‌شود.
function UserPhoto({ user }) {
  if (!user.photoUrl) {
    return (
      <Link href="/dashboard/profile" className="user-photo user-photo--empty-link" title="افزودن عکس ۳×۴">
        <span className="user-photo__empty">افزودن<br />عکس ۳×۴</span>
      </Link>
    );
  }
  return (
    <div className="user-photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={user.photoUrl} alt={user.displayName || 'عکس کاربر'} />
    </div>
  );
}

function FilmmakerDashboard({ user }) {
  const name = user.displayName || 'فیلمساز گرامی';
  return (
    <>
      <div className="dash-head">
        <div className="dash-head__id">
          <UserPhoto user={user} />
          <div>
            <h1 className="dash-head__title">داشبورد فیلمساز</h1>
            <p className="dash-head__sub">خوش آمدید {name}؛ از اینجا به بانک بازیگران خانواده برداشت دسترسی دارید.</p>
          </div>
        </div>
        <LogoutButton />
      </div>
      <Link href="/actors" className="dash-hero" style={{ marginBottom: 14 }}>
        <div className="dash-hero__label">ویژه‌ی فیلم‌سازان</div>
        <h2 className="dash-hero__title"><Icon name="masks" size={22} /> بانک بازیگران</h2>
        <p className="dash-hero__cta">مشاهده رزومه‌ها و ثبت درخواست ست تایم →</p>
      </Link>
      <div className="dash-cards">
        <div className="dash-card">
          <h3 className="dash-card__title">حساب کاربری</h3>
          <p className="dash-card__text">شماره موبایل: <span dir="ltr">{user.phone}</span></p>
          <Link href="/dashboard/profile" className="dash-card__link">تکمیل پروفایل →</Link>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">دوره‌های خانواده برداشت</h3>
          <p className="dash-card__text">معرفی دوره‌ها و کارگاه‌های آموزشی را ببینید.</p>
          <Link href="/courses" className="dash-card__link">مشاهده دوره‌ها →</Link>
        </div>
      </div>
    </>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  const name = user.displayName || 'هنرجوی گرامی';

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="dashboard" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        {user.role === 'filmmaker' ? (
          <FilmmakerDashboard user={user} />
        ) : (
          <>
            <div className="dash-head">
              <div className="dash-head__id">
                <UserPhoto user={user} />
                <div>
                  <h1 className="dash-head__title">داشبورد هنرجو</h1>
                  <p className="dash-head__sub">خوش آمدید {name}؛ وضعیت آموزشی شما اینجاست.</p>
                </div>
              </div>
              <LogoutButton />
            </div>
            <div className="dash-cards" style={{ gridTemplateColumns: user.graduated ? undefined : '2fr 1fr' }}>
              {!user.graduated && (
                <Link href="/dashboard/calendar" className="dash-hero">
                  <div className="dash-hero__label">تقویم کلاس</div>
                  <h2 className="dash-hero__title">برنامه کلاس‌های شما</h2>
                  <p className="dash-hero__cta">مشاهده تقویم →</p>
                </Link>
              )}
              <div className="dash-card">
                <h3 className="dash-card__title">حساب کاربری</h3>
                <p className="dash-card__text">شماره موبایل: <span dir="ltr">{user.phone}</span></p>
                <Link href="/dashboard/profile" className="dash-card__link">تکمیل پروفایل →</Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
