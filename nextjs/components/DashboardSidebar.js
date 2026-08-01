'use client';

import Link from 'next/link';
import { useState } from 'react';

const STUDENT_ITEMS = [
  { key: 'dashboard', href: '/dashboard', label: '🏠 داشبورد' },
  { key: 'schedule', href: '/dashboard/schedule', label: '📅 برنامه و تقویم من' },
  { key: 'enrollment', href: '/dashboard/enrollment', label: '🎓 ثبت‌نام من' },
  { key: 'resume', href: '/dashboard/resume', label: '🎭 رزومه بازیگری' },
  { key: 'profile', href: '/dashboard/profile', label: '👤 پروفایل' },
  { key: 'courses', href: '/courses', label: '🎬 دوره‌ها' },
];

// منوی اختصاصیِ فیلمساز: به‌جای برنامه/ثبت‌نام/دستیار/رزومهٔ هنرجویی، فقط دسترسی‌های مربوط به خودش را می‌بیند.
const FILMMAKER_ITEMS = [
  { key: 'dashboard', href: '/dashboard', label: '🏠 داشبورد' },
  { key: 'actors', href: '/actors', label: '🎭 بانک بازیگران' },
  { key: 'profile', href: '/dashboard/profile', label: '👤 پروفایل' },
  { key: 'courses', href: '/courses', label: '🎬 دوره‌ها' },
];

function itemsForRole(role, graduated) {
  if (role === 'filmmaker') return FILMMAKER_ITEMS;
  // هنرجوی فارغ‌التحصیل تقویم کلاس را در منو نمی‌بیند.
  return graduated ? STUDENT_ITEMS.filter((it) => it.key !== 'schedule') : STUDENT_ITEMS;
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
          <span className="sidebar-toggle__ico">{open ? '✕' : '☰'}</span>
          <span>منو</span>
        </button>
      </div>

      <div className="sidebar-logo"><Link href="/">خانواده <span>برداشت</span></Link></div>

      <ul id="dash-menu" className={`sidebar-menu${open ? ' sidebar-menu--open' : ''}`}>
        {visibleItems.map((it) => (
          <li key={it.key}>
            <Link className={active === it.key ? 'active' : undefined} href={it.href} onClick={close}>{it.label}</Link>
          </li>
        ))}
        {showManager && (
          <>
            <li className="sep">مدیریت</li>
            <li><Link className={active === 'enrollments' ? 'active' : undefined} href="/dashboard/admin/enrollments" onClick={close}>📋 بررسی ثبت‌نام‌ها</Link></li>
            <li><Link className={active === 'signups' ? 'active' : undefined} href="/dashboard/admin/signups" onClick={close}>✅ تأیید حساب‌ها</Link></li>
            <li><Link className={active === 'classes' ? 'active' : undefined} href="/dashboard/admin/classes" onClick={close}>📅 کلاس‌ها و تقویم</Link></li>
            <li><Link className={active === 'payments' ? 'active' : undefined} href="/dashboard/admin/payments" onClick={close}>💳 پرداخت‌ها و شهریه</Link></li>
            <li><Link className={active === 'bookings' ? 'active' : undefined} href="/dashboard/admin/bookings" onClick={close}>🎬 درخواست‌های ست تایم</Link></li>
            <li><Link className={active === 'support' ? 'active' : undefined} href="/dashboard/admin/support" onClick={close}>💬 پشتیبانی آنلاین</Link></li>
            <li><Link className={active === 'posts' ? 'active' : undefined} href="/dashboard/admin/posts" onClick={close}>📝 محتوا و انتشار</Link></li>
            <li><Link className={active === 'courses-admin' ? 'active' : undefined} href="/dashboard/admin/courses" onClick={close}>🎓 فروش دوره</Link></li>
            <li><Link className={active === 'books-admin' ? 'active' : undefined} href="/dashboard/admin/books" onClick={close}>📚 فروش کتاب</Link></li>
            <li><Link className={active === 'content' ? 'active' : undefined} href="/dashboard/admin/content" onClick={close}>📄 متن صفحات</Link></li>
            <li><Link className={active === 'admin' ? 'active' : undefined} href="/dashboard/admin" onClick={close}>⚙️ کاربران</Link></li>
          </>
        )}
        <li className="sep">سایت</li>
        <li><Link href="/" onClick={close}>بازگشت به سایت</Link></li>
      </ul>
    </aside>
  );
}
