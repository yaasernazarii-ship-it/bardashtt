import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import StudentChatHub from '@/components/StudentChatHub';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'گروه‌های گفت‌وگو' };

export default async function StudentGroupsPage({ searchParams }) {
  const sp = await searchParams;
  const initialGroupId = typeof sp?.g === 'string' ? sp.g : '';
  const initialChatId = typeof sp?.d === 'string' ? sp.d : '';
  const user = await getSessionUser();
  if (!user) {
    const target = initialGroupId ? `/dashboard/groups?g=${encodeURIComponent(initialGroupId)}` : '/dashboard/groups';
    redirect(`/auth?next=${encodeURIComponent(target)}`);
  }
  // فضای گروهی فقط برای هنرجوست؛ عضو عادی، فیلم‌ساز و مدیر از این صفحه بیرون می‌روند.
  if (user.role !== 'student' || isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="groups" role={user.role} graduated={user.graduated} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">گروه‌های گفت‌وگو</h1>
          <p className="dash-head__sub">
            گفت‌وگوی گروهی و خصوصی با هنرجویانی که مدیر در گروه‌های مشترک قرار داده است.
          </p>
        </div>
        <StudentChatHub initialGroupId={initialGroupId} initialChatId={initialChatId} />
      </main>
    </div>
  );
}
