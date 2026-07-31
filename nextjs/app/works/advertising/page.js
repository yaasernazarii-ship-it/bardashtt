import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';

export const metadata = {
  title: 'تولیدات تبلیغاتی',
  description: 'معرفی پروژه‌های تبلیغاتی و ویدیویی تولیدشده توسط هنرجویان و تیم خانواده برداشت.',
  alternates: { canonical: 'https://www.bardashtt.com/works/advertising' },
};

export const dynamic = 'force-dynamic';

export default function WorksAdvertisingPage() {
  return (
    <SimplePage title="تولیدات تبلیغاتی" subtitle="پروژه‌های تبلیغاتی و ویدیویی" tag="تبلیغات">
      <p className="body-lg">در این بخش تولیدات تبلیغاتی و پروژه‌های ویدیویی خانواده برداشت معرفی می‌شود.</p>
      <SectionPosts section="works-advertising" variant="media" />
    </SimplePage>
  );
}
