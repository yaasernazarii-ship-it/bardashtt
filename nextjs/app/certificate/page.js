import SimplePage from '@/components/SimplePage';
import { loadContent } from '@/lib/siteContent';

export const metadata = { title: 'آزمون فارغ‌التحصیلی', description: 'آزمون و مسیر دریافت گواهینامه خانواده برداشت.' };

export const dynamic = 'force-dynamic';

const steps = [
  ['ارزیابی حضور و تمرین', 'بررسی استمرار، مشارکت و اجرای تمرین‌های دوره'],
  ['آزمون عملی', 'اجرای صحنه، بیان، بدن و تحلیل نقش مقابل تیم آموزشی'],
  ['جمع‌بندی نهایی', 'ثبت نتیجه، دریافت بازخورد و صدور گواهینامه برای افراد پذیرفته‌شده'],
];

export default async function CertificatePage() {
  const t = await loadContent();
  return (
    <SimplePage title={t('certificate.title')} subtitle={t('certificate.subtitle')} tag={t('certificate.tag')}>
      <div className="split-layout">
        <div className="stack-card">
          <h2 className="subheading" style={{ marginBottom: 12 }}>{t('certificate.heading')}</h2>
          <p className="body-lg">{t('certificate.body')}</p>
        </div>
        <div className="stack-card stack-card--dark">
          <span className="tag tag--gold">نتیجه نهایی</span>
          <p style={{ marginTop: 14, lineHeight: 1.9 }}>{t('certificate.result')}</p>
        </div>
      </div>
      <div className="responsive-grid-3" style={{ marginTop: 22 }}>
        {steps.map(([title, text], index) => (
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
