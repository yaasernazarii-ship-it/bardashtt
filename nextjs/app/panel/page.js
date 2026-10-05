import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import PanelLogin from '@/components/PanelLogin';

// صفحهٔ ورود اختصاصیِ پنل مدیریت — جدا از صفحهٔ ورود هنرجویان (/auth).
// نه در منوی سایت لینک دارد و نه در نتایج جست‌وجو می‌آید.
export const metadata = {
  title: 'ورود به پنل مدیریت',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PanelLoginPage() {
  const user = await getSessionUser();
  // مدیرِ واردشده مستقیم به خانهٔ مدیریت می‌رود تا دوباره رمز نزند.
  if (user && isManager(user)) redirect('/dashboard');

  return (
    <div className="panel-gate">
      <div className="panel-gate__box">
        <div className="panel-gate__brand">
          <span className="panel-gate__badge">پنل مدیریت</span>
          <h1>خانواده برداشت</h1>
          <p>ورود ویژهٔ مدیر و ادیتور سایت</p>
        </div>

        {user && !isManager(user) && (
          <div className="alert alert--warning">
            شما با حساب شخصی خود («{user.displayName || user.phone}») وارد شده‌اید که دسترسی مدیریت ندارد.
            برای ورود به پنل، با نام کاربری مدیریتی وارد شوید.
          </div>
        )}

        <PanelLogin />

        <div className="panel-gate__foot">
          <Link href="/auth">ورود هنرجویان از این‌جا</Link>
          <Link href="/">بازگشت به سایت</Link>
        </div>
      </div>
    </div>
  );
}
