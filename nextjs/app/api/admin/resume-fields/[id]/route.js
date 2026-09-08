import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { FIELD_TYPE_VALUES } from '@/lib/resumeFields';

async function requireManager() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

export async function PATCH(request, { params }) {
  const { user, error } = await requireManager();
  if (error) return error;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const current = await prisma.resumeFieldDef.findUnique({ where: { id } });
  if (!current) return Response.json({ ok: false, error: 'فیلد یافت نشد.' }, { status: 404 });

  const data = {};

  if (body.label !== undefined) {
    const label = String(body.label).trim().slice(0, 80);
    if (!label) return Response.json({ ok: false, error: 'عنوان فیلد الزامی است.' }, { status: 400 });
    data.label = label;
  }

  if (body.type !== undefined) {
    if (!FIELD_TYPE_VALUES.includes(body.type)) {
      return Response.json({ ok: false, error: 'نوع فیلد نامعتبر است.' }, { status: 400 });
    }
    data.type = body.type;
  }

  if (body.options !== undefined) {
    data.options = String(body.options).trim().slice(0, 1000) || null;
  }

  const finalType = data.type ?? current.type;
  const finalOptions = data.options !== undefined ? data.options : current.options;
  if (finalType === 'select' && !finalOptions) {
    return Response.json({ ok: false, error: 'برای فیلد انتخابی، دست‌کم یک گزینه بنویسید.' }, { status: 400 });
  }
  if (finalType !== 'select') data.options = null;

  if (body.hint !== undefined) data.hint = String(body.hint).trim().slice(0, 200) || null;
  if (body.required !== undefined) data.required = !!body.required;
  if (body.active !== undefined) data.active = !!body.active;
  if (body.sortOrder !== undefined) {
    const n = parseInt(body.sortOrder, 10);
    if (!Number.isNaN(n) && n >= 0 && n <= 999) data.sortOrder = n;
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ ok: false, error: 'تغییری ارسال نشده است.' }, { status: 400 });
  }

  const field = await prisma.resumeFieldDef.update({ where: { id }, data });

  await logAction(user, {
    action: 'resumeField.update',
    targetType: 'resumeField',
    targetId: id,
    summary: `فیلد رزومه «${field.label}» ویرایش شد.`,
  });

  return Response.json({ ok: true, field });
}

export async function DELETE(request, { params }) {
  const { user, error } = await requireManager();
  if (error) return error;

  const { id } = await params;
  const current = await prisma.resumeFieldDef.findUnique({ where: { id } });
  if (!current) return Response.json({ ok: false, error: 'فیلد یافت نشد.' }, { status: 404 });

  await prisma.resumeFieldDef.delete({ where: { id } });

  await logAction(user, {
    action: 'resumeField.delete',
    targetType: 'resumeField',
    targetId: id,
    summary: `فیلد رزومه «${current.label}» حذف شد؛ مقدارهای ثبت‌شدهٔ آن دیگر نمایش داده نمی‌شود.`,
  });

  return Response.json({ ok: true });
}
