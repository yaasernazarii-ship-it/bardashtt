import PageLayout from '@/components/PageLayout';
import AuditionForm from '@/components/AuditionForm';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('audition');
}

// این صفحه یک Server Component است تا PageLayout (که async است و محتوای سایت را از دیتابیس
// می‌خواند) روی سرور اجرا شود. فرمِ تعاملی در AuditionForm با 'use client' جدا شده است.
export default function AuditionPage() {
  return (
    <PageLayout>
      <AuditionForm />
    </PageLayout>
  );
}
