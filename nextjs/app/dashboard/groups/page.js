import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import StudentChatGroups from '@/components/StudentChatGroups';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'گروه‌های گفت‌وگو' };

export default async function StudentGroupsPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/groups');
  // فضای گروهی فقط برای هنرجوست؛ عضو عادی، فیلم‌ساز و مدیر از این صفحه بیرون می‌روند.
  if (user.role !== 'student' || isManager(user)) redirect('/dashboard');

  const sp = await searchParams;
  const initialGroupId = typeof sp?.g === 'string' ? sp.g : '';

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="groups" role={user.role} graduated={user.graduated} />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">گروه‌های گفت‌وگو</h1>
          <p className="dash-head__sub">
            گفت‌وگوی هنرجویان هر دوره در گروه خودشان. عضویت گروه‌ها را مدیر آموزشگاه تعیین می‌کند.
          </p>
        </div>
        <StudentChatGroups initialGroupId={initialGroupId} />
      </main>
    </div>
  );
}
