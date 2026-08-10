import { prisma } from './prisma';

// ثبت یک رویداد در گزارش تغییرات.
// عمداً هیچ‌وقت throw نمی‌کند: اگر ثبت لاگ شکست بخورد نباید عملیات اصلی مدیر خراب شود.
export async function logAction(actor, { action, targetType, targetId, summary } = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorName: actor?.displayName || actor?.username || actor?.phone || null,
        actorRole: actor?.role ?? null,
        action: String(action || '').slice(0, 80),
        targetType: targetType ? String(targetType).slice(0, 40) : null,
        targetId: targetId ? String(targetId).slice(0, 200) : null,
        summary: summary ? String(summary).slice(0, 500) : null,
      },
    });
  } catch { /* ثبت گزارش حیاتی نیست */ }
}
