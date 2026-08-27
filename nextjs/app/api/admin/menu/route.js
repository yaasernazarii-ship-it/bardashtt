import { getSessionUser, isManager } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function manager() { const user = await getSessionUser(); return isManager(user) ? user : null; }
function bad(message, status = 400) { return Response.json({ ok: false, error: message }, { status }); }

export async function GET() {
  if (!await manager()) return bad('دسترسی ندارید.', 403);
  const [categories, expenses, sales] = await Promise.all([
    prisma.menuCategory.findMany({ orderBy: { sortOrder: 'asc' }, include: { items: { orderBy: { sortOrder: 'asc' } } } }),
    prisma.menuExpense.findMany({ orderBy: { expenseDate: 'desc' }, take: 100 }),
    prisma.menuSale.findMany({ orderBy: { saleDate: 'desc' }, take: 100 }),
  ]);
  return Response.json({ categories, expenses, sales });
}

export async function PATCH(request) {
  const user = await manager();
  if (!user) return bad('دسترسی ندارید.', 403);
  const body = await request.json();
  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === 'string') : [];
  if (!ids.length || ids.length > 200 || new Set(ids).size !== ids.length) return bad('ترتیب ارسال‌شده معتبر نیست.');

  try {
    if (body.type === 'categories') {
      const count = await prisma.menuCategory.count({ where: { id: { in: ids } } });
      if (count !== ids.length) return bad('یکی از دسته‌ها پیدا نشد.', 404);
      await prisma.$transaction(ids.map((id, sortOrder) => prisma.menuCategory.update({ where: { id }, data: { sortOrder } })));
      return Response.json({ ok: true });
    }
    if (body.type === 'items' && typeof body.categoryId === 'string') {
      const count = await prisma.menuItem.count({ where: { id: { in: ids }, categoryId: body.categoryId } });
      if (count !== ids.length) return bad('یکی از آیتم‌ها پیدا نشد.', 404);
      await prisma.$transaction(ids.map((id, sortOrder) => prisma.menuItem.update({ where: { id }, data: { sortOrder } })));
      return Response.json({ ok: true });
    }
    return bad('نوع مرتب‌سازی نامعتبر است.');
  } catch { return bad('ذخیره ترتیب انجام نشد.', 500); }
}

export async function POST(request) {
  const user = await manager(); if (!user) return bad('دسترسی ندارید.', 403);
  const body = await request.json();
  try {
    if (body.type === 'category') return Response.json({ category: await prisma.menuCategory.create({ data: { name: String(body.name).trim(), kind: body.kind === 'image' ? 'image' : 'items', sortOrder: Number(body.sortOrder) || 0 } }) });
    if (body.type === 'item') return Response.json({ item: await prisma.menuItem.create({ data: { categoryId: body.categoryId, name: String(body.name).trim(), description: body.description || null, price: Number(body.price), imageUrl: body.imageUrl || null, sortOrder: Number(body.sortOrder) || 0 } }) });
    if (body.type === 'expense') return Response.json({ expense: await prisma.menuExpense.create({ data: { title: String(body.title).trim(), amount: Number(body.amount), expenseDate: new Date(body.date) } }) });
    if (body.type === 'sale') return Response.json({ sale: await prisma.menuSale.create({ data: { amount: Number(body.amount), note: body.note || null, saleDate: new Date(body.date) } }) });
    return bad('نوع داده نامعتبر است.');
  } catch { return bad('اطلاعات واردشده معتبر نیست.'); }
}
