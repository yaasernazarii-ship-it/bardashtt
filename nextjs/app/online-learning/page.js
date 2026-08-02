import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';
import CourseList from '@/components/CourseList';
import { loadContent, splitLines } from '@/lib/siteContent';

export const metadata = {
  title: 'یادگیری آنلاین',
  description: 'منابع آنلاین آموزشی خانواده برداشت برای تمرین بازیگری در خانه.',
  alternates: { canonical: 'https://www.bardashtt.com/online-learning' },
};

export const dynamic = 'force-dynamic';

// هر مورد به شکل «عنوان | توضیح» ذخیره می‌شود؛ اگر جداکننده نبود، کل خط عنوان است.
function parsePairs(value) {
  return splitLines(value).map((line) => {
    const [title, ...rest] = line.split('|');
    return [title.trim(), rest.join('|').trim()];
  });
}

export default async function OnlineLearningPage() {
  const t = await loadContent();
  const lessons = parsePairs(t('online.lessons'));
  return (
    <SimplePage title={t('online.title')} subtitle={t('online.subtitle')} tag={t('online.tag')} slides={splitLines(t('online.slides'))}>
      <div className="stack-card" style={{ marginBottom: 22 }}>
        <h2 className="subheading" style={{ marginBottom: 12 }}>{t('online.heading')}</h2>
        <p className="body-lg">{t('online.body')}</p>
      </div>
      <div className="responsive-grid-4">
        {lessons.map(([title, text], index) => (
          <div key={title} className="content-card">
            <div className="content-card__icon">{index + 1}</div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>

      <h2 className="subheading" style={{ margin: '32px 0 16px' }}>{t('online.courses.heading')}</h2>
      <CourseList />

      <SectionPosts section="course-video" variant="media" heading={t('online.videos.heading')} />
    </SimplePage>
  );
}
