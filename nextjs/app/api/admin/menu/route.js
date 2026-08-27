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
