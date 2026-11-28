import SimplePage from '@/components/SimplePage';
import { loadContent, splitLines } from '@/lib/siteContent';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('certificate');
}

export const dynamic = 'force-dynamic';

// هر مورد به شکل «عنوان | توضیح» ذخیره می‌شود؛ اگر جداکننده نبود، کل خط عنوان است.
function parsePairs(value) {
  return splitLines(value).map((line) => {
    const [title, ...rest] = line.split('|');
    return [title.trim(), rest.join('|').trim()];
  });
}

export default async function CertificatePage() {
  const t = await loadContent();
  const steps = parsePairs(t('certificate.steps'));
  return (
    <SimplePage title={t('certificate.title')} subtitle={t('certificate.subtitle')} tag={t('certificate.tag')} slides={splitLines(t('certificate.slides'))} cta={false}>
      <div className="split-layout">
        <div className="stack-card">
          <h2 className="subheading" style={{ marginBottom: 12 }}>{t('certificate.heading')}</h2>
          <p className="body-lg">{t('certificate.body')}</p>
        </div>
        <div className="stack-card stack-card--dark">
          <span className="tag tag--gold">{t('certificate.resultTag')}</span>
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
