import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';

export async function DELETE(_request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  const { id } = await params;
  const item = await prisma.aiKnowledgeDocument.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!item) return Response.json({ ok: false, error: 'منبع یافت نشد.' }, { status: 404 });

  await prisma.aiKnowledgeDocument.delete({ where: { id } });
  await logAction(user, {
    action: 'ai-knowledge.delete',
    targetType: 'ai-knowledge',
    targetId: id,
    summary: `منبع هوش مصنوعی «${item.title}» حذف شد.`,
  });
  return Response.json({ ok: true });
}
