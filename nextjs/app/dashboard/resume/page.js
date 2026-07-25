import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';
import ResumeForm from '@/components/ResumeForm';
import StudentResumeView from '@/components/StudentResumeView';

export const metadata = { title: 'رزومه بازیگری' };

export default async function ResumePage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  // هنرجو رزومه‌اش را ویرایش نمی‌کند؛ فقط آن را می‌بیند و ویدیوی معرفی‌اش را بارگذاری می‌کند.
  const isStudent = user.role === 'student';

  return (
    <div className="dash-layout" style={{ background: 'var(--surface)' }}>
      <DashboardSidebar active="resume" role={user.role} isAdmin={user.role === 'admin'} isManager={isManager(user)} graduated={user.graduated} />
      <main className="main-area">
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading">رزومه بازیگری</h1>
          <p style={{ color: 'var(--muted)' }}>
            {isStudent
              ? 'رزومه‌ی شما توسط خانواده برداشت تنظیم می‌شود. شما می‌توانید آن را ببینید و ویدیوی معرفی خودتان را بارگذاری کنید.'
              : 'رزومه خود را کامل کنید. با فعال‌کردن نمایش عمومی، فیلم‌سازان می‌توانند آن را در فهرست بازیگران ببینند.'}
          </p>
        </div>
        {isStudent ? <StudentResumeView /> : <ResumeForm />}
      </main>
    </div>
  );
}
