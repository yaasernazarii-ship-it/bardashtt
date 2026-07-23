import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import ProfileForm from '@/components/ProfileForm';
import DashboardSidebar from '@/components/DashboardSidebar';

export const metadata = { title: 'پروفایل هنرجو' };

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="profile" isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">پروفایل من</h1>
          <p style={{ color: 'var(--muted)' }}>اطلاعات حساب کاربری خود را تکمیل و ویرایش کنید.</p>
        </div>
        <ProfileForm initial={{ phone: user.phone, displayName: user.displayName, city: user.city, birthYear: user.birthYear }} />
      </main>
    </div>
  );
}
