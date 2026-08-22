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
  { key: 'groups', href: '/dashboard/groups', icon: 'chat', label: 'گروه‌های گفت‌وگو' },
  { key: 'social', href: '/dashboard/social', icon: 'users', label: 'برداشتگرام' },
  { key: 'orders', href: '/dashboard/orders', icon: 'book', label: 'سفارش‌های من' },
  { key: 'resume', href: '/dashboard/resume', icon: 'fileText', label: 'رزومه بازیگری' },
  { key: 'profile', href: '/dashboard/profile', icon: 'user', label: 'پروفایل' },
  { key: 'growth', href: '/dashboard/growth', icon: 'flag', label: 'مسیر رشد' },
  { key: 'courses', href: '/courses', icon: 'clapperboard', label: 'دوره جامع حضوری' },
];

// منوی اختصاصیِ فیلمساز. این پنل عمداً هیچ آیتم آموزشی (دوره، ثبت‌نام، تقویم، آزمون، رزومهٔ هنرجویی)
// ندارد؛ فیلمساز مخاطبِ آموزش نیست و داشبوردش فقط حول کارِ خودش می‌چرخد: بانک بازیگران و پیگیری ست تایم.
const FILMMAKER_ITEMS = [
  { key: 'dashboard', href: '/dashboard', icon: 'home', label: 'داشبورد' },
  { key: 'actors', href: '/actors', icon: 'masks', label: 'بانک بازیگران' },
  { key: 'shortlist', href: '/dashboard/shortlist', icon: 'trophy', label: 'لیست کوتاه من' },
  { key: 'social', href: '/dashboard/social', icon: 'users', label: 'برداشتگرام' },
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

const MANAGER_GROUPS = [
  {
    key: 'students', label: 'هنرجویان و آموزش', icon: 'graduationCap',
    items: [
      { key: 'admin', href: '/dashboard/admin', icon: 'users', label: 'کاربران' },
      { key: 'signups', href: '/dashboard/admin/signups', icon: 'check', label: 'درخواست عضویت و ساخت حساب' },
      { key: 'enrollments', href: '/dashboard/admin/enrollments', icon: 'clipboard', label: 'ثبت‌نام دوره و تست بازیگری' },
      { key: 'classes', href: '/dashboard/admin/classes', icon: 'calendar', label: 'کلاس‌ها و تقویم' },
      { key: 'live-classes', href: '/dashboard/admin/live-classes', icon: 'video', label: 'کلاس‌های آنلاین' },
      { key: 'exam-admin', href: '/dashboard/admin/exam', icon: 'check', label: 'آزمون و بانک سؤال' },
      { key: 'certificates', href: '/dashboard/admin/certificates', icon: 'fileText', label: 'گواهی‌نامه‌ها' },
      { key: 'growth-admin', href: '/dashboard/admin/growth', icon: 'flag', label: 'مسیر رشد هنرجویان' },
    ],
  },
  {
    key: 'finance', label: 'مالی و فروش', icon: 'creditCard',
    items: [
      { key: 'payments', href: '/dashboard/admin/payments', icon: 'creditCard', label: 'پرداخت‌ها و شهریه' },
      { key: 'courses-admin', href: '/dashboard/admin/courses', icon: 'graduationCap', label: 'فروش دوره‌های غیرحضوری' },
      { key: 'books-admin', href: '/dashboard/admin/books', icon: 'book', label: 'فروش کتاب' },
      { key: 'bookings', href: '/dashboard/admin/bookings', icon: 'clapperboard', label: 'درخواست‌های ست‌تایم' },
    ],
  },
  {
    key: 'communications', label: 'ارتباطات', icon: 'chat',
    items: [
      { key: 'support', href: '/dashboard/admin/support', icon: 'chat', label: 'پشتیبانی آنلاین' },
      { key: 'chat-groups', href: '/dashboard/admin/chat-groups', icon: 'users', label: 'گفت‌وگوی هنرجویان' },
      { key: 'reports', href: '/dashboard/admin/reports', icon: 'clipboard', label: 'گزارش و گفت‌وگوی تیم' },
      { key: 'social-admin', href: '/dashboard/admin/social', icon: 'users', label: 'برداشتگرام' },
    ],
  },
  {
    key: 'content', label: 'محتوا و سایت', icon: 'edit',
    items: [
      { key: 'posts', href: '/dashboard/admin/posts', icon: 'edit', label: 'محتوا و انتشار' },
      { key: 'content', href: '/dashboard/admin/content', icon: 'fileText', label: 'متن صفحات' },
      { key: 'links', href: '/dashboard/admin/links', icon: 'link', label: 'لینک صفحات' },
    ],
  },
  {
    key: 'monitoring', label: 'نظارت و تنظیمات', icon: 'settings',
    items: [
      { key: 'audit', href: '/dashboard/admin/audit', icon: 'clipboard', label: 'گزارش تغییرات' },
    ],
  },
];

function itemsForRole(role, graduated, manager) {
  if (manager) return MANAGER_PERSONAL_ITEMS;
  if (role === 'filmmaker') return FILMMAKER_ITEMS;
  return STUDENT_ITEMS.filter((it) => {
    // بخش‌های وابسته به حضور فعال در دوره برای فارغ‌التحصیل کاربردی ندارند.
    if (graduated && ['schedule', 'live-classes', 'insurance', 'courses'].includes(it.key)) return false;
    // آزمون فارغ‌التحصیلی فقط برای هنرجوست، نه عضو عادی.
    if (it.key === 'exam' && role !== 'student') return false;
    // بیمهٔ هنرجویی هم فقط برای هنرجوست؛ عضو عادی هنوز پوششی ندارد.
    if (it.key === 'insurance' && role !== 'student') return false;
    // انتشار در برداشتگرام مخصوص هنرجو و فیلم‌ساز است؛ عضو عادی فقط تماشاگر است.
    if (it.key === 'social' && role !== 'student') return false;
    // گروه‌های گفت‌وگو فقط برای هنرجوست؛ عضو عادی اصلاً به این فضا راه ندارد.
    if (it.key === 'groups' && role !== 'student') return false;
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
  const activeManagerGroup = MANAGER_GROUPS.find((group) => group.items.some((item) => item.key === active))?.key;
  const [open, setOpen] = useState(false);
  const [openManagerGroups, setOpenManagerGroups] = useState(() => new Set([activeManagerGroup || 'students']));
  const close = () => setOpen(false);
  const toggleManagerGroup = (key) => {
    setOpenManagerGroups((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
              {MANAGER_GROUPS.map((group) => {
                const expanded = openManagerGroups.has(group.key);
                const groupActive = group.key === activeManagerGroup;
                return (
                  <li key={group.key} className={`sidebar-group${groupActive ? ' is-active' : ''}`}>
                    <button type="button" className="sidebar-group__toggle" aria-expanded={expanded}
                      onClick={() => toggleManagerGroup(group.key)}>
                      <Icon name={group.icon} size={18} className="sidebar-menu__ico" />
                      <span>{group.label}</span>
                      <svg className={`sidebar-group__chev${expanded ? ' is-open' : ''}`} width="15" height="15" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expanded && (
                      <ul className="sidebar-group__items">
                        {group.items.map((item) => (
                          <li key={item.key}>
                            <Link className={active === item.key ? 'active' : undefined} href={item.href} onClick={close}>
                              <Icon name={item.icon} size={16} className="sidebar-menu__ico" />{item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
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
