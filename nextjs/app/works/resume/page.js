import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';
import { loadContent } from '@/lib/siteContent';

export const metadata = {
  title: 'پشتوانه علمی و هنری',
  description: 'رزومه، افتخارات و پشتوانه علمی و هنری تیم آموزشی خانواده برداشت.',
  alternates: { canonical: 'https://www.bardashtt.com/works/resume' },
};

export const dynamic = 'force-dynamic';

export default async function WorksResumePage() {
  const t = await loadContent();
  return (
    <SimplePage title={t('works.resume.title')} subtitle={t('works.resume.subtitle')} tag={t('works.resume.tag')}>
      <p className="body-lg">{t('works.resume.intro')}</p>
      <SectionPosts section="works-resume" variant="media" />
    </SimplePage>
  );
}
