import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';

export const metadata = {
  title: 'خروجی خانواده برداشت',
  description: 'نمایش خروجی‌های آموزشی، تمرین‌ها و آثار هنرجویان خانواده برداشت.',
  alternates: { canonical: 'https://www.bardashtt.com/works/output' },
};

export const dynamic = 'force-dynamic';

export default function WorksOutputPage() {
  return (
    <SimplePage title="خروجی خانواده برداشت" subtitle="نتایج آموزشی و هنری هنرجویان" tag="آثار">
      <p className="body-lg">در این بخش خروجی‌های آموزشی، تمرین‌ها و آثار هنرجویان خانواده برداشت معرفی می‌شود.</p>
      <SectionPosts section="works-output" variant="media" />
    </SimplePage>
  );
}
