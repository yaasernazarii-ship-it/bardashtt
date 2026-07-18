import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

const ROLES = ['member', 'editor', 'admin'];

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  if (id === user.id) {
    return Response.json({ ok: false, error: 'نقش حساب خودتان را نمی‌توانید تغییر دهید.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const role = String(body.role || '');
    if (!ROLES.includes(role)) {
      return Response.json({ ok: false, error: 'نقش نامعتبر است.' }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, phone: true, displayName: true, city: true, role: true },
    });
    return Response.json({ ok: true, user: updated });
  } catch {
    return Response.json({ ok: false, error: 'کاربر یافت نشد یا درخواست نامعتبر است.' }, { status: 400 });
  }
}
