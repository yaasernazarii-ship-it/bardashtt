import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

const STATUSES = ['new', 'contacted', 'paid', 'shipped', 'canceled'];

function serialize(o) {
  return {
    id: o.id, bookId: o.bookId, name: o.name, phone: o.phone, address: o.address,
    quantity: o.quantity, note: o.note, status: o.status, adminNote: o.adminNote,
    createdAt: o.createdAt.toISOString(),
  };
}

async function guard() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

// تغییر وضعیت سفارش یا ثبت یادداشت ادمین.
export async function PATCH(request, { params }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await params;

  try {
    const b = await request.json();
    const data = {};
    if ('status' in b) {
      if (!STATUSES.includes(b.status)) return Response.json({ ok: false, error: 'وضعیت نامعتبر است.' }, { status: 400 });
      data.status = b.status;
    }
    if ('adminNote' in b) data.adminNote = b.adminNote ? String(b.adminNote).trim().slice(0, 1000) : null;

    const order = await prisma.bookOrder.update({ where: { id }, data });
    return Response.json({ ok: true, order: serialize(order) });
  } catch {
    return Response.json({ ok: false, error: 'سفارش یافت نشد یا درخواست نامعتبر است.' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await params;
  try {
    await prisma.bookOrder.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'سفارش یافت نشد.' }, { status: 400 });
  }
}
