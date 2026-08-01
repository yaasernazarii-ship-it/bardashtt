import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';
import BookList from '@/components/BookList';
import SRTabs from '@/components/SRTabs';

export const metadata = {
  title: 'مسئولیت اجتماعی',
  description: 'فعالیت‌های فرهنگی و اجتماعی خانواده برداشت: معرفی و خرید کتاب، پادکست، عکس، ویدئو و آگاهی‌سازی.',
  alternates: { canonical: 'https://www.bardashtt.com/social-responsibility' },
};

export const dynamic = 'force-dynamic';

const emptyMsg = (txt) => <p style={{ color: 'var(--muted)' }}>{txt}</p>;

export default function SocialResponsibilityPage() {
  const tabs = [
    {
      key: 'book',
      label: '📚 معرفی و خرید کتاب',
      content: <BookList />,
    },
    {
      key: 'podcast',
      label: '🎙️ پادکست',
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
      key: 'photo',
      label: '🖼️ عکس',
      content: (
        <SectionPosts
          section="sr-photo"
          variant="article"
          hrefBase="/social-responsibility"
          empty={emptyMsg('هنوز عکسی منتشر نشده است.')}
        />
      ),
    },
    {
      key: 'video',
      label: '🎬 ویدئو',
      content: (
        <SectionPosts
          section="sr-video"
          variant="article"
          hrefBase="/social-responsibility"
          empty={emptyMsg('هنوز ویدئویی منتشر نشده است.')}
        />
      ),
    },
    {
      key: 'awareness',
      label: '📝 آگاهی‌سازی',
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
      title="مسئولیت اجتماعی"
      subtitle="فعالیت‌های فرهنگی و اجتماعی خانواده برداشت"
      tag="خانواده برداشت"
    >
      <SRTabs tabs={tabs} />
    </SimplePage>
  );
}
