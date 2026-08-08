import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { isValidGender } from '@/lib/exam';

export async function PATCH(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  try {
    const body = await request.json();
    const data = {};

    if (typeof body.displayName === 'string') data.displayName = body.displayName.trim().slice(0, 80) || null;
    if (typeof body.contactPhone === 'string') data.contactPhone = body.contactPhone.trim().slice(0, 20) || null;
    if (typeof body.city === 'string') data.city = body.city.trim().slice(0, 60) || null;
    // جنسیت مبنای درج «آقای/خانم» روی گواهی‌نامه است.
    if (body.gender !== undefined) data.gender = isValidGender(body.gender) ? body.gender : null;
    if (body.birthYear !== undefined && body.birthYear !== null && body.birthYear !== '') {
      const y = parseInt(body.birthYear, 10);
      if (!Number.isNaN(y) && y > 1300 && y < 1420) data.birthYear = y;
    }

    const updated = await prisma.user.update({ where: { id: user.id }, data });
    return Response.json({
      ok: true,
      user: { id: updated.id, phone: updated.phone, contactPhone: updated.contactPhone, displayName: updated.displayName, city: updated.city, birthYear: updated.birthYear, gender: updated.gender, role: updated.role },
    });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
