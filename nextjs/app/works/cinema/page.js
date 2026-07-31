import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';

export const metadata = {
  title: 'تولیدات سینمایی',
  description: 'معرفی تولیدات سینمایی و پروژه‌های فیلم‌سازی هنرجویان و تیم خانواده برداشت.',
  alternates: { canonical: 'https://www.bardashtt.com/works/cinema' },
};

export const dynamic = 'force-dynamic';

export default function WorksCinemaPage() {
  return (
    <SimplePage title="تولیدات سینمایی" subtitle="پروژه‌ها و تولیدات سینمایی خانواده برداشت" tag="سینما">
      <p className="body-lg">معرفی تولیدات سینمایی و پروژه‌های مرتبط با خانواده برداشت در این بخش قرار می‌گیرد.</p>
      <SectionPosts section="works-cinema" variant="media" />
    </SimplePage>
  );
}
