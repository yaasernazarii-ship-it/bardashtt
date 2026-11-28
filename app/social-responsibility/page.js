import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';
import BookList from '@/components/BookList';
import SRTabs from '@/components/SRTabs';
import { loadContent, splitLines } from '@/lib/siteContent';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('socialResponsibility');
}

export const dynamic = 'force-dynamic';

const emptyMsg = (txt) => <p style={{ color: 'var(--muted)' }}>{txt}</p>;

export default async function SocialResponsibilityPage() {
  const t = await loadContent();
  const tabs = [
    {
      key: 'book',
      icon: 'book', label: 'معرفی و خرید کتاب',
      content: <BookList />,
    },
    {
      key: 'podcast',
      icon: 'mic', label: 'پادکست',
      content: (
        <SectionPosts
          section="sr-podcast"
          variant="article"
          hrefBase="/social-responsibility"
          empty={emptyMsg('هنوز پادکستی منتشر نشده است.')}
        />
      ),
    },
    {
      key: 'awareness',
      icon: 'pencil', label: 'آگاهی‌سازی',
      content: (
        <SectionPosts
          section="social-responsibility"
          variant="article"
          hrefBase="/social-responsibility"
          empty={emptyMsg('هنوز مطلبی منتشر نشده است.')}
        />
      ),
    },
  ];

  return (
    <SimplePage
      title={t('sr.title')}
      subtitle={t('sr.subtitle')}
      tag={t('sr.tag')}
      slides={splitLines(t('sr.slides'))}
    >
      <SRTabs tabs={tabs} />
    </SimplePage>
  );
}
