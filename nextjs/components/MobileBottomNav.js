'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';

const items = [
  { ico: 'home', label: 'خانه', href: '/' },
  { ico: 'graduationCap', label: 'دوره‌ها', href: '/courses', accent: true },
  { ico: 'phone', label: 'تماس', href: 'tel:02191090934' },
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
          <span className="mbn-ico"><Icon name={item.ico} size={22} /></span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
