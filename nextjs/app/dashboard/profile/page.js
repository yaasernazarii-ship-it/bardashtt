import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import ProfileForm from '@/components/ProfileForm';
import DashboardSidebar from '@/components/DashboardSidebar';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export const metadata = { title: 'پروفایل هنرجو' };

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="profile" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">پروفایل من</h1>
          <p className="dash-head__sub">اطلاعات حساب کاربری خود را تکمیل و ویرایش کنید.</p>
        </div>
        <ProfileForm role={user.role} initial={{ phone: user.phone, contactPhone: user.contactPhone, displayName: user.displayName, city: user.city, birthYear: user.birthYear, gender: user.gender, photoUrl: user.photoUrl }} />
        <ChangePasswordForm hasPassword={Boolean(user.passwordHash)} username={user.username || ''} />
      </main>
    </div>
  );
}
