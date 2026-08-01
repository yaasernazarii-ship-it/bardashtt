import SimplePage from '@/components/SimplePage';
import SectionPosts from '@/components/SectionPosts';
import BookList from '@/components/BookList';

export const metadata = {
  title: 'مسئولیت اجتماعی',
  description: 'فعالیت‌های فرهنگی و اجتماعی خانواده برداشت، فروش کتاب و مطالب مرتبط.',
  alternates: { canonical: 'https://www.bardashtt.com/social-responsibility' },
};

export const dynamic = 'force-dynamic';

export default function SocialResponsibilityPage() {
  return (
    <SimplePage
      title="مسئولیت اجتماعی"
      subtitle="فعالیت‌های فرهنگی و اجتماعی خانواده برداشت"
      tag="خانواده برداشت"
    >
      <section style={{ marginBottom: 36 }}>
        <h2 className="subheading" style={{ margin: '4px 0 16px' }}>📚 کتاب‌ها</h2>
        <BookList />
      </section>

      <section>
        <h2 className="subheading" style={{ margin: '4px 0 16px' }}>مطالب</h2>
        <SectionPosts
          section="social-responsibility"
          variant="article"
          hrefBase="/social-responsibility"
          empty={<p style={{ color: 'var(--muted)' }}>هنوز مطلبی منتشر نشده است.</p>}
        />
      </section>
    </SimplePage>
  );
}
