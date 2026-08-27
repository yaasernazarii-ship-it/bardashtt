import { getSessionUser, isManager } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request, { params }) {
  const user = await getSessionUser(); if (!isManager(user)) return Response.json({ error: 'دسترسی ندارید.' }, { status: 403 });
  const body = await request.json(); const id = (await params).id;
  try {
    if (body.type === 'category') return Response.json({ category: await prisma.menuCategory.update({ where: { id }, data: { ...(body.name !== undefined && { name: String(body.name).trim() }), ...(body.kind !== undefined && { kind: body.kind }), ...(body.description !== undefined && { description: body.description || null }), ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }), ...(body.active !== undefined && { active: !!body.active }), ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }) } }) });
    if (body.type === 'item') return Response.json({ item: await prisma.menuItem.update({ where: { id }, data: { ...(body.name !== undefined && { name: String(body.name).trim() }), ...(body.description !== undefined && { description: body.description || null }), ...(body.price !== undefined && { price: Number(body.price) }), ...(body.available !== undefined && { available: !!body.available }), ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }), ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }) } }) });
    return Response.json({ error: 'نوع داده نامعتبر است.' }, { status: 400 });
  } catch { return Response.json({ error: 'رکورد پیدا نشد.' }, { status: 404 }); }
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser(); if (!isManager(user)) return Response.json({ error: 'دسترسی ندارید.' }, { status: 403 });
  const body = await request.json(); const id = (await params).id;
  if (body.type === 'category') await prisma.menuCategory.delete({ where: { id } });
  else if (body.type === 'item') await prisma.menuItem.delete({ where: { id } });
  else if (body.type === 'expense') await prisma.menuExpense.delete({ where: { id } });
  else if (body.type === 'sale') await prisma.menuSale.delete({ where: { id } });
  else return Response.json({ error: 'نوع داده نامعتبر است.' }, { status: 400 });
  return Response.json({ ok: true });
}
