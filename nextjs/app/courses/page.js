import PageLayout from '@/components/PageLayout';
import CoursesExplorer from '@/components/CoursesExplorer';
import { loadContent } from '@/lib/siteContent';

export const metadata = {
  title: 'دوره‌های بازیگری',
  description: 'دوره‌های بازیگری مقدماتی، تکمیلی، اردو، پیشرفته و فیلمسازی در خانواده برداشت. ثبت‌نام کاملاً رایگان.',
  alternates: { canonical: 'https://www.bardashtt.com/courses' },
};

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const t = await loadContent();
  return (
    <PageLayout>
      <CoursesExplorer heading={t('courses.title')} subheading={t('courses.subtitle')} />
    </PageLayout>
  );
}
