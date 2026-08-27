import MenuAdmin from '@/components/MenuAdmin';
import CafeLogin from '@/components/CafeLogin';
import { cafeAuthConfigured, hasCafeAccess, hasCafeCookie } from '@/lib/cafeAuth';
import './menu-admin.css';

export const metadata = { title: 'پنل مدیریت کافه کتاب', robots: { index: false, follow: false } };

export default async function CafeAdminPage() {
  const [allowed, viaPassword] = await Promise.all([hasCafeAccess(), hasCafeCookie()]);
  if (!allowed) return <main dir="rtl"><CafeLogin configured={cafeAuthConfigured()} /></main>;
  return <main dir="rtl"><MenuAdmin publicSlug={process.env.MENU_PUBLIC_SLUG || ''} canSignOut={viaPassword} /></main>;
}
