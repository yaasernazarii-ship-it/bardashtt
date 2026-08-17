'use client';

import Link from 'next/link';
import { useState } from 'react';
import Icon from './Icon';
import LogoutButton from './LogoutButton';

const STUDENT_ITEMS = [
  { key: 'dashboard', href: '/dashboard', icon: 'home', label: 'داشبورد' },
  { key: 'schedule', href: '/dashboard/schedule', icon: 'calendar', label: 'برنامه و تقویم من' },
  { key: 'live-classes', href: '/dashboard/live-classes', icon: 'video', label: 'کلاس‌های آنلاین من' },
  { key: 'enrollment', href: '/dashboard/enrollment', icon: 'graduationCap', label: 'ثبت‌نام من' },
  { key: 'exam', href: '/dashboard/exam', icon: 'check', label: 'آزمون و گواهی‌نامه' },
  { key: 'insurance', href: '/dashboard/insurance', icon: 'shield', label: 'بیمهٔ من' },
  { key: 'social', href: '/dashboard/social', icon: 'users', label: 'شبکهٔ اجتماعی' },
  { key: 'orders', href: '/dashboard/orders', icon: 'book', label: 'سفارش‌های من' },
  { key: 'resume', href: '/dashboard/resume', icon: 'fileText', label: 'رزومه بازیگری' },
  { key: 'profile', href: '/dashboard/profile', icon: 'user', label: 'پروفایل' },
  { key: 'courses', href: '/courses', icon: 'clapperboard', label: 'دوره‌ها' },
];

// منوی اختصاصیِ فیلمساز. این پنل عمداً هیچ آیتم آموزشی (دوره، ثبت‌نام، تقویم، آزمون، رزومهٔ هنرجویی)
// ندارد؛ فیلمساز مخاطبِ آموزش نیست و داشبوردش فقط حول کارِ خودش می‌چرخد: بانک بازیگران و پیگیری ست تایم.
const FILMMAKER_ITEMS = [
  { key: 'dashboard', href: '/dashboard', icon: 'home', label: 'داشبورد' },
  { key: 'actors', href: '/actors', icon: 'masks', label: 'بانک بازیگران' },
  { key: 'shortlist', href: '/dashboard/shortlist', icon: 'trophy', label: 'لیست کوتاه من' },
  { key: 'social', href: '/dashboard/social', icon: 'users', label: 'شبکهٔ اجتماعی' },
  { key: 'requests', href: '/dashboard/requests', icon: 'clipboard', label: 'درخواست‌های ست تایم' },
  { key: 'orders', href: '/dashboard/orders', icon: 'book', label: 'سفارش‌های من' },
  { key: 'profile', href: '/dashboard/profile', icon: 'user', label: 'پروفایل' },
];

// ادمین/ادیتور منوی هنرجویی (تقویم، ثبت‌نام من، آزمون، رزومه) را نمی‌بینند؛
// فقط خانهٔ مدیریت و پروفایل خودشان، تا مسیر ورود به پنل گم نشود.
const MANAGER_PERSONAL_ITEMS = [
  { key: 'dashboard', href: '/dashboard', icon: 'home', label: 'خانهٔ مدیریت' },
  { key: 'profile', href: '/dashboard/profile', icon: 'user', label: 'پروفایل من' },
];

const MANAGER_ITEMS = [
  { key: 'reports', href: '/dashboard/admin/reports', icon: 'users', label: 'گزارش و گفت‌وگوی تیم' },
  { key: 'enrollments', href: '/dashboard/admin/enrollments', icon: 'clipboard', label: 'بررسی ثبت‌نام‌ها' },
  { key: 'signups', href: '/dashboard/admin/signups', icon: 'check', label: 'تأیید حساب‌ها' },
  { key: 'classes', href: '/dashboard/admin/classes', icon: 'calendar', label: 'کلاس‌ها و تقویم' },
  { key: 'live-classes', href: '/dashboard/admin/live-classes', icon: 'video', label: 'کلاس‌های آنلاین' },
  { key: 'exam-admin', href: '/dashboard/admin/exam', icon: 'check', label: 'آزمون و بانک سوال' },
  { key: 'certificates', href: '/dashboard/admin/certificates', icon: 'fileText', label: 'گواهی‌نامه‌ها' },
  { key: 'payments', href: '/dashboard/admin/payments', icon: 'creditCard', label: 'پرداخت‌ها و شهریه' },
  { key: 'bookings', href: '/dashboard/admin/bookings', icon: 'clapperboard', label: 'درخواست‌های ست تایم' },
  { key: 'support', href: '/dashboard/admin/support', icon: 'chat', label: 'پشتیبانی آنلاین' },
  { key: 'posts', href: '/dashboard/admin/posts', icon: 'edit', label: 'محتوا و انتشار' },
  { key: 'social-admin', href: '/dashboard/admin/social', icon: 'users', label: 'شبکهٔ اجتماعی' },
  { key: 'courses-admin', href: '/dashboard/admin/courses', icon: 'graduationCap', label: 'فروش دوره' },
  { key: 'books-admin', href: '/dashboard/admin/books', icon: 'book', label: 'فروش کتاب' },
  { key: 'content', href: '/dashboard/admin/content', icon: 'fileText', label: 'متن صفحات' },
  { key: 'links', href: '/dashboard/admin/links', icon: 'link', label: 'لینک صفحات' },
  { key: 'admin', href: '/dashboard/admin', icon: 'settings', label: 'کاربران' },
  { key: 'audit', href: '/dashboard/admin/audit', icon: 'clipboard', label: 'گزارش تغییرات' },
];

function itemsForRole(role, graduated, manager) {
  if (manager) return MANAGER_PERSONAL_ITEMS;
  if (role === 'filmmaker') return FILMMAKER_ITEMS;
  return STUDENT_ITEMS.filter((it) => {
    // هنرجوی فارغ‌التحصیل تقویم کلاس و کلاس آنلاین را در منو نمی‌بیند.
    if ((it.key === 'schedule' || it.key === 'live-classes') && graduated) return false;
    // آزمون فارغ‌التحصیلی فقط برای هنرجوست، نه عضو عادی.
    if (it.key === 'exam' && role !== 'student') return false;
    // بیمهٔ هنرجویی هم فقط برای هنرجوست؛ عضو عادی هنوز پوششی ندارد.
    if (it.key === 'insurance' && role !== 'student') return false;
    // انتشار در شبکهٔ اجتماعی مخصوص هنرجو و فیلم‌ساز است؛ عضو عادی فقط تماشاگر است.
    if (it.key === 'social' && role !== 'student') return false;
    return true;
  });
}

export default function DashboardNav({
  active,
  role,
  isAdmin = false,
  isManager = false,
  graduated = false,
  profile = null,
  supportPhone = '',
  supportPhoneText = '',
}) {
  const showManager = isAdmin || isManager;
  const visibleItems = itemsForRole(role, graduated, showManager);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <aside className="sidebar">
      {/* نوار موبایل: لوگو + دکمهٔ منو (فقط در گوشی دیده می‌شود) */}
      <div className="sidebar-mobilebar">
        <Link href="/" className="sidebar-mobilebar__logo" onClick={close}>خانواده <span>برداشت</span></Link>
        <button
          type="button"
          className="sidebar-toggle"
          aria-expanded={open}
          aria-controls="dash-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sidebar-toggle__ico"><Icon name={open ? 'close' : 'menu'} size={20} /></span>
          <span>منو</span>
        </button>
      </div>

      <div className="sidebar-logo"><Link href="/">خانواده <span>برداشت</span></Link></div>

      {/* در موبایل، کل این بخش با دکمهٔ «منو» باز و بسته می‌شود؛ در دسکتاپ همیشه باز است. */}
      <div id="dash-menu" className={`sidebar-panel${open ? ' sidebar-panel--open' : ''}`}>
        {profile && (
          <div className="sidebar-profile">
            <Link href="/dashboard/profile" className="sidebar-profile__avatar" onClick={close} title="پروفایل من">
              {profile.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photoUrl} alt={profile.name || 'عکس کاربر'} />
              ) : (
                <Icon name="user" size={30} />
              )}
            </Link>
            <p className="sidebar-profile__name">{profile.name}</p>
            {profile.subtitle && <p className="sidebar-profile__role">{profile.subtitle}</p>}
          </div>
        )}

        <ul className="sidebar-menu">
          {visibleItems.map((it) => (
            <li key={it.key}>
              <Link className={active === it.key ? 'active' : undefined} href={it.href} onClick={close}>
                <Icon name={it.icon} size={18} className="sidebar-menu__ico" />{it.label}
              </Link>
            </li>
          ))}
          {showManager && (
            <>
              <li className="sep">مدیریت</li>
              {MANAGER_ITEMS.map((it) => (
                <li key={it.key}>
                  <Link className={active === it.key ? 'active' : undefined} href={it.href} onClick={close}>
                    <Icon name={it.icon} size={18} className="sidebar-menu__ico" />{it.label}
                  </Link>
                </li>
              ))}
            </>
          )}
          <li className="sep">سایت</li>
          <li>
            <Link href="/" onClick={close}>
              <Icon name="arrowLeft" size={18} className="sidebar-menu__ico" />بازگشت به سایت
            </Link>
          </li>
        </ul>

        <div className="sidebar-foot">
          {supportPhone && (
            <div className="sidebar-support">
              <span className="sidebar-support__label">پشتیبانی هنرجویان</span>
              <a href={`tel:${supportPhone}`} className="sidebar-support__phone" dir="ltr">
                {supportPhoneText || supportPhone}
              </a>
              <Link href="/contact" className="sidebar-support__chat" onClick={close}>
                <Icon name="chat" size={15} /> پشتیبانی آنلاین
              </Link>
            </div>
          )}
          <LogoutButton className="sidebar-logout">
            <Icon name="arrowLeft" size={16} /> خروج
          </LogoutButton>
        </div>
      </div>
    </aside>
  );
}
