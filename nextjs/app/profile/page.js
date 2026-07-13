import SimplePage from '@/components/SimplePage';

export const metadata = { title: 'پروفایل هنرجو' };

export default function ProfilePage() {
  return <SimplePage title="پروفایل هنرجو" subtitle="اطلاعات حساب و وضعیت آموزشی" tag="حساب کاربری"><div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}><p className="body-lg">برای نمایش پروفایل کامل، ورود هنرجو و اتصال به پنل لازم است.</p></div></SimplePage>;
}
