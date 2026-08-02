import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';
import { loadContent } from '@/lib/siteContent';

export const metadata = {
  title: 'تولیدات تبلیغاتی',
  description: 'معرفی پروژه‌های تبلیغاتی و ویدیویی تولیدشده توسط هنرجویان و تیم خانواده برداشت.',
  alternates: { canonical: 'https://www.bardashtt.com/works/advertising' },
};

export const dynamic = 'force-dynamic';

export default async function WorksAdvertisingPage() {
  const t = await loadContent();
  return (
    <SimplePage title={t('works.adv.title')} subtitle={t('works.adv.subtitle')} tag={t('works.adv.tag')}>
      <p className="body-lg">{t('works.adv.intro')}</p>
      <SectionPosts section="works-advertising" variant="media" />
    </SimplePage>
  );
}
