import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminExam from '@/components/AdminExam';
import { EXAM_PASS_PERCENT, EXAM_QUESTION_COUNT } from '@/lib/exam';

export const metadata = { title: 'بانک سوال و آزمون' };

export default async function AdminExamPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth?next=/dashboard/admin/exam');
  if (!isManager(user)) redirect('/dashboard');

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="exam-admin" role={user.role} isAdmin={user.role === 'admin'} isManager />
      <main className="main-area">
        <div className="dash-head" style={{ display: 'block', marginBottom: 22 }}>
          <h1 className="dash-head__title">آزمون فارغ‌التحصیلی</h1>
          <p className="dash-head__sub">بانک سوالات را مدیریت کنید و کارنامهٔ هنرجویان را ببینید.</p>
        </div>
        <AdminExam questionCount={EXAM_QUESTION_COUNT} passPercent={EXAM_PASS_PERCENT} />
      </main>
    </div>
  );
}
