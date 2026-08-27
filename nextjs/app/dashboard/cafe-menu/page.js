import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import MenuAdmin from '@/components/MenuAdmin';
import './menu-admin.css';

export const metadata = { title: 'مدیریت منوی کافه' };
export default async function CafeMenuAdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/cafe-menu');
  if (!isManager(user)) redirect('/dashboard');
  return <main dir="rtl"><MenuAdmin publicSlug={process.env.MENU_PUBLIC_SLUG || ''} /></main>;
}
