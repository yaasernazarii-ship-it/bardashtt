import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';
import { loadContent, splitLines } from '@/lib/siteContent';

export const metadata = {
  title: 'خروجی خانواده برداشت',
  description: 'نمایش خروجی‌های آموزشی، تمرین‌ها و آثار هنرجویان خانواده برداشت.',
  alternates: { canonical: 'https://www.bardashtt.com/works/output' },
};

export const dynamic = 'force-dynamic';

export default async function WorksOutputPage() {
  const t = await loadContent();
  return (
    <SimplePage title={t('works.output.title')} subtitle={t('works.output.subtitle')} tag={t('works.output.tag')} slides={splitLines(t('works.output.slides'))}>
      <p className="body-lg">{t('works.output.intro')}</p>
      <SectionPosts section="works-output" variant="media" />
    </SimplePage>
  );
}
