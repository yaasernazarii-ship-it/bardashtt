'use client';

import Link from 'next/link';
import { useState } from 'react';
import Icon from './Icon';

const STUDENT_ITEMS = [
  { key: 'dashboard', href: '/dashboard', icon: 'home', label: 'داشبورد' },
  { key: 'schedule', href: '/dashboard/schedule', icon: 'calendar', label: 'برنامه و تقویم من' },
  { key: 'enrollment', href: '/dashboard/enrollment', icon: 'graduationCap', label: 'ثبت‌نام من' },
  { key: 'exam', href: '/dashboard/exam', icon: 'check', label: 'آزمون و گواهی‌نامه' },
  { key: 'orders', href: '/dashboard/orders', icon: 'book', label: 'سفارش‌های من' },
  { key: 'resume', href: '/dashboard/resume', icon: 'fileText', label: 'رزومه بازیگری' },
  { key: 'profile', href: '/dashboard/profile', icon: 'user', label: 'پروفایل' },
  { key: 'courses', href: '/courses', icon: 'clapperboard', label: 'دوره‌ها' },
];

// منوی اختصاصیِ فیلمساز: به‌جای برنامه/ثبت‌نام/دستیار/رزومهٔ هنرجویی، فقط دسترسی‌های مربوط به خودش را می‌بیند.
const FILMMAKER_ITEMS = [
  { key: 'dashboard', href: '/dashboard', icon: 'home', label: 'داشبورد' },
  { key: 'actors', href: '/actors', icon: 'user', label: 'بانک بازیگران' },
  { key: 'orders', href: '/dashboard/orders', icon: 'book', label: 'سفارش‌های من' },
  { key: 'profile', href: '/dashboard/profile', icon: 'user', label: 'پروفایل' },
  { key: 'courses', href: '/courses', icon: 'clapperboard', label: 'دوره‌ها' },
];

const MANAGER_ITEMS = [
  { key: 'enrollments', href: '/dashboard/admin/enrollments', icon: 'clipboard', label: 'بررسی ثبت‌نام‌ها' },
  { key: 'signups', href: '/dashboard/admin/signups', icon: 'check', label: 'تأیید حساب‌ها' },
  { key: 'classes', href: '/dashboard/admin/classes', icon: 'calendar', label: 'کلاس‌ها و تقویم' },
  { key: 'exam-admin', href: '/dashboard/admin/exam', icon: 'check', label: 'آزمون و بانک سوال' },
  { key: 'certificates', href: '/dashboard/admin/certificates', icon: 'fileText', label: 'گواهی‌نامه‌ها' },
  { key: 'payments', href: '/dashboard/admin/payments', icon: 'creditCard', label: 'پرداخت‌ها و شهریه' },
  { key: 'bookings', href: '/dashboard/admin/bookings', icon: 'clapperboard', label: 'درخواست‌های ست تایم' },
  { key: 'support', href: '/dashboard/admin/support', icon: 'chat', label: 'پشتیبانی آنلاین' },
  { key: 'posts', href: '/dashboard/admin/posts', icon: 'edit', label: 'محتوا و انتشار' },
  { key: 'courses-admin', href: '/dashboard/admin/courses', icon: 'graduationCap', label: 'فروش دوره' },
  { key: 'books-admin', href: '/dashboard/admin/books', icon: 'book', label: 'فروش کتاب' },
  { key: 'content', href: '/dashboard/admin/content', icon: 'fileText', label: 'متن صفحات' },
  { key: 'links', href: '/dashboard/admin/links', icon: 'link', label: 'لینک صفحات' },
  { key: 'admin', href: '/dashboard/admin', icon: 'settings', label: 'کاربران' },
  { key: 'audit', href: '/dashboard/admin/audit', icon: 'clipboard', label: 'گزارش تغییرات' },
];

function itemsForRole(role, graduated) {
  if (role === 'filmmaker') return FILMMAKER_ITEMS;
  return STUDENT_ITEMS.filter((it) => {
    // هنرجوی فارغ‌التحصیل تقویم کلاس را در منو نمی‌بیند.
    if (it.key === 'schedule' && graduated) return false;
    // آزمون فارغ‌التحصیلی فقط برای هنرجوست، نه عضو عادی.
    if (it.key === 'exam' && role !== 'student') return false;
    return true;
  });
}

export default function DashboardSidebar({ active, role, isAdmin = false, isManager = false, graduated = false }) {
  const showManager = isAdmin || isManager;
  const visibleItems = itemsForRole(role, graduated);
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

      <ul id="dash-menu" className={`sidebar-menu${open ? ' sidebar-menu--open' : ''}`}>
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
        <li><Link href="/" onClick={close}>بازگشت به سایت</Link></li>
      </ul>
    </aside>
  );
}
