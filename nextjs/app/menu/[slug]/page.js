import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import './menu.css';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'منوی کافه کتاب برداشت',
  robots: { index: false, follow: false, noarchive: true },
};

export default async function DigitalMenu({ params }) {
  const { slug } = await params;
  if (!process.env.MENU_PUBLIC_SLUG || slug !== process.env.MENU_PUBLIC_SLUG) notFound();
  const categories = await prisma.menuCategory.findMany({
    where: { active: true }, orderBy: { sortOrder: 'asc' },
    include: { items: { where: { available: true }, orderBy: { sortOrder: 'asc' } } },
  });
  return <main className="cafe-menu" dir="rtl">
    <header className="cafe-menu__hero"><span className="cafe-menu__mark">برداشت</span><h1>کافه کتاب برداشت</h1><p>منوی کافه</p></header>
    <nav className="cafe-menu__nav">{categories.map((category) => <a key={category.id} href={`#${category.id}`}>{category.name}</a>)}</nav>
    <div className="cafe-menu__content">{categories.map((category) => <section className="menu-section" id={category.id} key={category.id}>
      <h2>{category.name}</h2>
      {category.kind === 'image' ? <>{category.imageUrl && <img className="menu-feature" src={category.imageUrl} alt={category.name} />}{category.description && <p className="menu-description">{category.description}</p>}</> : <div className="menu-items">{category.items.map((item) => <article className="menu-item" key={item.id}>
        {item.imageUrl && <img src={item.imageUrl} alt="" />}
        <div><h3>{item.name}</h3>{item.description && <p>{item.description}</p>}</div><strong>{item.price.toLocaleString('fa-IR')} تومان</strong>
      </article>)}</div>}
    </section>)}</div>
    <footer className="cafe-menu__footer">با مهر، کافه کتاب برداشت</footer>
  </main>;
}
