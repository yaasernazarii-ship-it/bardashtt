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

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  const events = await prisma.classEvent.findMany({ orderBy: { startsAt: 'asc' } });
  return Response.json({ ok: true, events: events.map(serialize), canManage: isManager(user) });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  try {
    const body = await request.json();
    const title = String(body.title || '').trim().slice(0, 120);
    const startsAt = new Date(body.startsAt);
    if (!title) return Response.json({ ok: false, error: 'عنوان کلاس الزامی است.' }, { status: 400 });
    if (Number.isNaN(startsAt.getTime())) return Response.json({ ok: false, error: 'تاریخ نامعتبر است.' }, { status: 400 });

    const data = {
      title,
      startsAt,
      teacher: body.teacher ? String(body.teacher).trim().slice(0, 80) : null,
      description: body.description ? String(body.description).trim().slice(0, 500) : null,
      location: body.location ? String(body.location).trim().slice(0, 120) : null,
      durationMin: null,
      createdById: user.id,
    };
    if (body.durationMin !== undefined && body.durationMin !== null && body.durationMin !== '') {
      const d = parseInt(body.durationMin, 10);
      if (!Number.isNaN(d) && d > 0 && d < 1440) data.durationMin = d;
    }

    const event = await prisma.classEvent.create({ data });
    return Response.json({ ok: true, event: serialize(event) });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
