import { redirect } from 'next/navigation';
import SimplePage from '@/components/SimplePage';
import SocialComposer from '@/components/SocialComposer';
import { getSocialIdentity } from '@/lib/socialAuth';

export const metadata = { title: 'انتشار در برداشتگرام' };
export const dynamic = 'force-dynamic';

export default async function SocialCreatePage() {
  const identity = await getSocialIdentity();
  if (!identity.account) redirect('/community');
  return <SimplePage title="انتشار در برداشتگرام" subtitle="پست یا استوری تازه بسازید" narrow><SocialComposer /></SimplePage>;
}
