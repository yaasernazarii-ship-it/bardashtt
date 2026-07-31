import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';

export const metadata = {
  title: 'پشتوانه علمی و هنری',
  description: 'رزومه، افتخارات و پشتوانه علمی و هنری تیم آموزشی خانواده برداشت.',
  alternates: { canonical: 'https://www.bardashtt.com/works/resume' },
};

export const dynamic = 'force-dynamic';

export default function WorksResumePage() {
  return (
    <SimplePage title="پشتوانه علمی و هنری" subtitle="رزومه، افتخارات و تجربه‌های آموزشی" tag="رزومه">
      <p className="body-lg">پشتوانه علمی، آموزشی و هنری خانواده برداشت و تیم آموزشی در این بخش ارائه می‌شود.</p>
      <SectionPosts section="works-resume" variant="media" />
    </SimplePage>
  );
}
