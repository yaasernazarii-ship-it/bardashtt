import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminCertificates from '@/components/AdminCertificates';

export const metadata = { title: 'گواهی‌نامه‌ها' };

export default async function AdminCertificatesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/certificates');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="certificates" role={user.role} isAdmin={user.role === 'admin'} isManager />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">گواهی‌نامه‌ها</h1>
          <p className="dash-head__sub">گواهی‌های صادرشدهٔ آموزشگاه سینمایی تک برداشت؛ صدور دستی، مشاهدهٔ فایل و ابطال.</p>
        </div>
        <AdminCertificates />
      </main>
    </div>
  );
}
