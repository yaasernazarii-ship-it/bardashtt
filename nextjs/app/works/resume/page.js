import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';
import { loadContent, splitLines } from '@/lib/siteContent';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('worksResume');
}

export const dynamic = 'force-dynamic';

export default async function WorksResumePage() {
  const t = await loadContent();
  return (
    <SimplePage title={t('works.resume.title')} subtitle={t('works.resume.subtitle')} tag={t('works.resume.tag')} slides={splitLines(t('works.resume.slides'))}>
      <p className="body-lg">{t('works.resume.intro')}</p>
      <SectionPosts section="works-resume" variant="media" />
    </SimplePage>
  );
}
