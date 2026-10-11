import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import GrowthClient from '@/components/GrowthClient';

export const dynamic = 'force-dynamic';
export default async function GrowthHabitsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/growth/habits');
  if (user.role !== 'student' || isManager(user)) redirect('/dashboard');
  return <div className="dash-layout" style={{ background: 'var(--surface)' }}><DashboardSidebar active="growth" role={user.role} graduated={user.graduated} /><main className="main-area"><GrowthClient mode="habits" /></main></div>;
}
