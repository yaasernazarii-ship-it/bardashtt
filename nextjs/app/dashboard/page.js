import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';
import DashboardSidebar from '@/components/DashboardSidebar';
import Icon from '@/components/Icon';

// پنل شخصی — نه محتوای عمومی دارد و نه باید در نتایج جست‌وجو بیاید.
// canonical هم حذف شده چون قبلاً به‌اشتباه به صفحهٔ اصلی اشاره می‌کرد.
export const metadata = {
  title: 'داشبورد',
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

// خانهٔ مدیریت: ادمین و ادیتور بعد از ورود مستقیم همین صفحه را می‌بینند،
// نه داشبورد هنرجو. هر بخش پنل یک کارت با توضیح کوتاه دارد.
const MANAGER_GROUPS = [
  {
    title: 'هنرجویان و کلاس‌ها',
    cards: [
      { href: '/dashboard/admin/signups', title: 'تأیید حساب‌ها', text: 'درخواست‌های عضویت جدید را بررسی و تأیید کنید.' },
      { href: '/dashboard/admin/enrollments', title: 'بررسی ثبت‌نام‌ها', text: 'فرم‌های ثبت‌نام دوره و ویدیوهای ارسالی.' },
      { href: '/dashboard/admin/classes', title: 'کلاس‌ها و تقویم', text: 'جلسه‌ها، حضور و غیاب و تقویم آموزشی.' },
      { href: '/dashboard/admin/exam', title: 'آزمون و بانک سوال', text: 'سؤال‌های آزمون پایان دوره را مدیریت کنید.' },
      { href: '/dashboard/admin/certificates', title: 'گواهی‌نامه‌ها', text: 'صدور و پیگیری گواهی پایان دوره.' },
      { href: '/dashboard/admin/support', title: 'پشتیبانی آنلاین', text: 'پاسخ به گفتگوهای زندهٔ کاربران سایت.' },
    ],
  },
  {
    title: 'محتوای سایت',
    cards: [
      { href: '/dashboard/admin/posts', title: 'محتوا و انتشار', text: 'مطالب بلاگ، اخبار و گالری تصاویر.' },
      { href: '/dashboard/admin/content', title: 'متن صفحات', text: 'ویرایش متن‌های سایت، منو، فوتر و تنظیمات گوگل.' },
      { href: '/dashboard/admin/links', title: 'لینک صفحات', text: 'نشانی‌ها و لینک‌های داخلی سایت.' },
    ],
  },
  {
    title: 'فروش و مالی',
    cards: [
      { href: '/dashboard/admin/payments', title: 'پرداخت‌ها و شهریه', text: 'وضعیت پرداخت‌ها و اقساط شهریه.' },
      { href: '/dashboard/admin/courses', title: 'فروش دوره', text: 'دوره‌های آنلاین و دسترسی خریداران.' },
      { href: '/dashboard/admin/books', title: 'فروش کتاب', text: 'کتاب‌ها و سفارش‌های ثبت‌شده.' },
      { href: '/dashboard/admin/bookings', title: 'درخواست‌های ست تایم', text: 'درخواست فیلم‌سازان از بانک بازیگران.' },
    ],
  },
  {
    title: 'مدیریت سیستم',
    cards: [
      { href: '/dashboard/admin', title: 'کاربران', text: 'نقش، نام کاربری و رمز عبور کاربران را تعیین کنید.' },
      { href: '/dashboard/admin/audit', title: 'گزارش تغییرات', text: 'چه کسی، چه زمانی و چه چیزی را تغییر داده است.' },
    ],
  },
];

function ManagerDashboard({ user }) {
  const name = user.displayName || 'همکار گرامی';
  const roleLabel = user.role === 'admin' ? 'مدیر' : 'ادیتور';
  return (
    <>
      <div className="dash-head">
        <div className="dash-head__id">
          {user.photoUrl && <UserPhoto user={user} />}
          <div>
            <h1 className="dash-head__title">خانهٔ مدیریت</h1>
            <p className="dash-head__sub">خوش آمدید {name} — شما با نقش «{roleLabel}» وارد شده‌اید. از کارت‌های زیر یا منوی کنار صفحه به بخش‌های پنل بروید.</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      {MANAGER_GROUPS.map((group) => (
        <section key={group.title} style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark)', margin: '0 0 12px' }}>{group.title}</h2>
          <div className="dash-cards">
            {group.cards.map((card) => (
              <Link key={card.href} href={card.href} className="dash-card" style={{ display: 'block' }}>
                <h3 className="dash-card__title">{card.title}</h3>
                <p className="dash-card__text">{card.text}</p>
                <span className="dash-card__link">ورود به بخش →</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
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
        {isManager(user) ? (
          <ManagerDashboard user={user} />
        ) : user.role === 'filmmaker' ? (
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
