import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

function serialize(e) {
  return {
    id: e.id,
    title: e.title,
    teacher: e.teacher,
    description: e.description,
    location: e.location,
    startsAt: e.startsAt.toISOString(),
    durationMin: e.durationMin,
  };
}

async function requireManager() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

export async function PATCH(request, { params }) {
  const { error } = await requireManager();
  if (error) return error;
  const { id } = await params;

  try {
    const body = await request.json();
    const data = {};
    if (typeof body.title === 'string') {
      const t = body.title.trim().slice(0, 120);
      if (!t) return Response.json({ ok: false, error: 'عنوان کلاس الزامی است.' }, { status: 400 });
      data.title = t;
    }
    if (body.startsAt !== undefined) {
      const d = new Date(body.startsAt);
      if (Number.isNaN(d.getTime())) return Response.json({ ok: false, error: 'تاریخ نامعتبر است.' }, { status: 400 });
      data.startsAt = d;
    }
    if (body.teacher !== undefined) data.teacher = body.teacher ? String(body.teacher).trim().slice(0, 80) : null;
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim().slice(0, 500) : null;
    if (body.location !== undefined) data.location = body.location ? String(body.location).trim().slice(0, 120) : null;
    if (body.durationMin !== undefined) {
      if (body.durationMin === null || body.durationMin === '') data.durationMin = null;
      else {
        const n = parseInt(body.durationMin, 10);
        data.durationMin = !Number.isNaN(n) && n > 0 && n < 1440 ? n : null;
      }
    }

    const event = await prisma.classEvent.update({ where: { id }, data });
    return Response.json({ ok: true, event: serialize(event) });
  } catch {
    return Response.json({ ok: false, error: 'کلاس یافت نشد یا درخواست نامعتبر است.' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireManager();
  if (error) return error;
  const { id } = await params;

  try {
    await prisma.classEvent.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'کلاس یافت نشد.' }, { status: 404 });
  }
}
