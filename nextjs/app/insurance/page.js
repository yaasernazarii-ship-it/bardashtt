import SimplePage from '@/components/SimplePage';
import { loadContent } from '@/lib/siteContent';

export const metadata = { title: 'بیمه هنرجویان', description: 'پوشش بیمه‌ای و ایمنی هنرجویان در دوره‌ها و اردوهای خانواده برداشت.' };

export const dynamic = 'force-dynamic';

const items = [
  ['کلاس‌ها', 'پوشش و ثبت اطلاعات هنرجویان برای حضور منظم در برنامه‌ها'],
  ['اردوها', 'توجه ویژه به ایمنی در برنامه‌های آموزشی کوتاه‌مدت و چندروزه'],
  ['پشتیبانی', 'اطلاع‌رسانی و همراهی تیم اجرایی در طول فعالیت‌های حضوری'],
];

export default async function InsurancePage() {
  const t = await loadContent();
  return (
    <SimplePage title={t('insurance.title')} subtitle={t('insurance.subtitle')} tag={t('insurance.tag')}>
      <div className="stack-card" style={{ marginBottom: 22 }}>
        <h2 className="subheading" style={{ marginBottom: 12 }}>{t('insurance.heading')}</h2>
        <p className="body-lg">{t('insurance.body')}</p>
      </div>
      <div className="responsive-grid-3">
        {items.map(([title, text], index) => (
          <div key={title} className="content-card">
            <div className="content-card__icon">{index + 1}</div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}
