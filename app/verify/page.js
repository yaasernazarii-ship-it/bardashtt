import PageLayout from '@/components/PageLayout';
import VerifyForm from '@/components/VerifyForm';
import { pageMetadata } from '@/lib/pageMeta';
import { loadContent } from '@/lib/siteContent';
import { verifyContent } from '@/lib/formContent';

export async function generateMetadata() {
  return pageMetadata('verify');
}

export const dynamic = 'force-dynamic';

// Server Component؛ فرمِ تعاملی در VerifyForm با 'use client' جدا شده است.
export default async function VerifyPage() {
  const t = await loadContent();
  return (
    <PageLayout>
      <VerifyForm content={verifyContent(t)} />
    </PageLayout>
  );
}
