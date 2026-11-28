import { redirect } from 'next/navigation';
import { getSessionUser, isManager } from '@/lib/auth';

// این صفحه‌ی قدیمی به تقویم شمسیِ یکپارچه منتقل شده است.
export default async function CalendarPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth');
  redirect(isManager(user) ? '/dashboard/admin/classes' : '/dashboard/schedule');
}
