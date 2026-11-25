import Link from 'next/link';
import { liveCourses } from '@/lib/onlineCourses';
import Icon from './Icon';

// فهرستِ دوره‌های آنلاینِ فروشی. هر کارت به صفحهٔ دوره لینک می‌شود
// (جایی که تیزر برای همه و ویدیوها فقط برای خریدار نمایش داده می‌شود).
export default async function CourseList() {
  const courses = await liveCourses();
  if (courses.length === 0) {
    return <p style={{ color: 'var(--muted)' }}>دوره‌ای برای فروش ثبت نشده است. به‌زودی…</p>;
  }

  return (
    <div className="post-list">
      {courses.map((c) => {
        const priceLabel = c.price > 0 ? `${c.price.toLocaleString('fa-IR')} تومان` : 'رایگان';
        return (
          <Link key={c.id} href={`/online-learning/${c.slug}`} className="post-card">
            {c.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="post-card__cover" src={c.coverImage} alt={c.title} loading="lazy" />
            )}
            <div className="post-card__body">
              <h3 className="post-card__title">{c.title}</h3>
              {c.description && (
                <p className="post-card__excerpt">{String(c.description).slice(0, 120)}</p>
              )}
              <div className="post-card__meta">
                <span className="meta-ico"><Icon name="clapperboard" size={14} /> {c._count.lessons.toLocaleString('fa-IR')} ویدیو</span>
                <span style={{ color: 'var(--dark)', fontWeight: 700 }}>{priceLabel}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
