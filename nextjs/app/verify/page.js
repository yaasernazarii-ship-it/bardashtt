import PageLayout from '@/components/PageLayout';
import VerifyForm from '@/components/VerifyForm';

// Server Component؛ فرمِ تعاملی در VerifyForm با 'use client' جدا شده است.
export default function VerifyPage() {
  return (
    <PageLayout>
      <VerifyForm />
    </PageLayout>
  );
}
