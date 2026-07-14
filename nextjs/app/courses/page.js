import PageLayout from '@/components/PageLayout';
import CoursesExplorer from '@/components/CoursesExplorer';

export const metadata = {
  title: 'دوره‌های بازیگری',
  description: 'دوره‌های بازیگری مقدماتی، تکمیلی، اردو، پیشرفته و فیلمسازی در خانواده برداشت. ثبت‌نام کاملاً رایگان.',
  alternates: { canonical: 'https://www.bardashtt.com/courses' },
};

export default function CoursesPage() {
  return (
    <PageLayout>
      <CoursesExplorer />
    </PageLayout>
  );
}
