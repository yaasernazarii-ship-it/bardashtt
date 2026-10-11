import SimplePage from '@/components/SimplePage';
import { siteUrl } from '@/lib/siteUrl';

// صفحهٔ حساب کاربری — خصوصی است و نباید ایندکس شود.
export async function generateMetadata() {
  return {
    title: 'پروفایل هنرجو',
    robots: { index: false, follow: false },
    alternates: { canonical: `${await siteUrl()}/profile` },
  };
}

export default function ProfilePage() {
  return <SimplePage title="پروفایل هنرجو" subtitle="اطلاعات حساب و وضعیت آموزشی" tag="حساب کاربری"><div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}><p className="body-lg">برای نمایش پروفایل کامل، ورود هنرجو و اتصال به پنل لازم است.</p></div></SimplePage>;
}
