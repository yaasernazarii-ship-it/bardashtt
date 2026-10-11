import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';
import { loadContent, splitLines } from '@/lib/siteContent';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('worksAdvertising');
}

export const dynamic = 'force-dynamic';

export default async function WorksAdvertisingPage() {
  const t = await loadContent();
  return (
    <SimplePage title={t('works.adv.title')} subtitle={t('works.adv.subtitle')} tag={t('works.adv.tag')} slides={splitLines(t('works.adv.slides'))}>
      <p className="body-lg">{t('works.adv.intro')}</p>
      <SectionPosts section="works-advertising" variant="media" />
    </SimplePage>
  );
}
