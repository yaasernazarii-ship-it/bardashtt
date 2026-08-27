import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { readMenuSettings, serviceFeeOf } from '@/lib/menuSettings';
import CafeMenuClient from '@/components/CafeMenuClient';
import './menu.css';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'منوی کافه کتاب برداشت',
  robots: { index: false, follow: false, noarchive: true },
};

export default async function DigitalMenu({ params }) {
  const { slug } = await params;
  if (!process.env.MENU_PUBLIC_SLUG || slug !== process.env.MENU_PUBLIC_SLUG) notFound();
  const [categories, settings] = await Promise.all([
    prisma.menuCategory.findMany({
      where: { active: true }, orderBy: { sortOrder: 'asc' },
      // آیتم ناموجود هم نمایش داده می‌شود، فقط دکمهٔ افزودن ندارد.
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    }),
    readMenuSettings(),
  ]);
  return <main dir="rtl">
    <CafeMenuClient slug={slug} categories={categories} settings={settings} serviceFee={serviceFeeOf(settings)} />
  </main>;
}
