'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { ico: '🏠', label: 'خانه', href: '/' },
  { ico: '🎓', label: 'دوره‌ها', href: '/courses' },
  { ico: '✍️', label: 'ثبت‌نام', href: '/register', accent: true },
  { ico: '📞', label: 'تماس', href: 'tel:02191090934' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label="ناوبری موبایل">
      {items.map((item, i) => (
        <Link
          key={i}
          href={item.href}
          className={`mbn-item${item.accent ? ' mbn-item--accent' : ''}${pathname === item.href ? ' active' : ''}`}
        >
          <span className="mbn-ico">{item.ico}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
