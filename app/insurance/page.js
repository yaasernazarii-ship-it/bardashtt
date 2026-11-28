import SimplePage from '@/components/SimplePage';
import { loadContent, splitLines } from '@/lib/siteContent';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('insurance');
}

export const dynamic = 'force-dynamic';

// هر مورد به شکل «عنوان | توضیح» ذخیره می‌شود؛ اگر جداکننده نبود، کل خط عنوان است.
function parsePairs(value) {
  return splitLines(value).map((line) => {
    const [title, ...rest] = line.split('|');
    return [title.trim(), rest.join('|').trim()];
  });
}

export default async function InsurancePage() {
  const t = await loadContent();
  const items = parsePairs(t('insurance.items'));
  return (
    <SimplePage title={t('insurance.title')} subtitle={t('insurance.subtitle')} tag={t('insurance.tag')} slides={splitLines(t('insurance.slides'))}>
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
