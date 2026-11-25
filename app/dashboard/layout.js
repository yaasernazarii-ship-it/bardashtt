import BardashtAI from '@/components/BardashtAI';
import { getSessionUser } from '@/lib/auth';

export default async function DashboardLayout({ children }) {
  const user = await getSessionUser();
  // فیلمساز دستیار هوشمند را نمی‌بیند.
  const showAssistant = user && user.role !== 'filmmaker';
  return (
    <>
      {children}
      {showAssistant && <BardashtAI />}
    </>
  );
}
