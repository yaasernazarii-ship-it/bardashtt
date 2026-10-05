import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { FIELD_TYPE_VALUES, fieldKeyFromLabel } from '@/lib/resumeFields';

async function requireManager() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const { error } = await requireManager();
  if (error) return error;

  const fields = await prisma.resumeFieldDef.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  return Response.json({ ok: true, fields });
}

export async function POST(request) {
  const { user, error } = await requireManager();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const label = String(body.label || '').trim().slice(0, 80);
  if (!label) return Response.json({ ok: false, error: 'عنوان فیلد الزامی است.' }, { status: 400 });

  const type = FIELD_TYPE_VALUES.includes(body.type) ? body.type : 'text';
  const options = type === 'select' ? String(body.options || '').trim().slice(0, 1000) : null;
  if (type === 'select' && !options) {
    return Response.json({ ok: false, error: 'برای فیلد انتخابی، دست‌کم یک گزینه بنویسید.' }, { status: 400 });
  }

  // کلید فقط یک‌بار هنگام ساخت تعیین می‌شود؛ بعد از آن ثابت می‌ماند تا مقدارهای
  // ذخیره‌شده در رزومه‌های موجود با تغییر عنوان از دست نروند.
  let key = fieldKeyFromLabel(label);
  const clash = await prisma.resumeFieldDef.findUnique({ where: { key }, select: { id: true } });
  if (clash) key = `${key}_${Date.now().toString(36)}`;

  const last = await prisma.resumeFieldDef.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });

  const field = await prisma.resumeFieldDef.create({
    data: {
      key,
      label,
      type,
      options,
      hint: String(body.hint || '').trim().slice(0, 200) || null,
      required: !!body.required,
      active: body.active === undefined ? true : !!body.active,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  await logAction(user, {
    action: 'resumeField.create',
    targetType: 'resumeField',
    targetId: field.id,
    summary: `فیلد رزومه «${label}» ساخته شد.`,
  });

  return Response.json({ ok: true, field });
}
