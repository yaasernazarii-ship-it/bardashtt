import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const categories = await prisma.menuCategory.findMany({
    where: { active: true }, orderBy: { sortOrder: 'asc' },
    include: { items: { where: { available: true }, orderBy: { sortOrder: 'asc' } } },
  });
  return Response.json({ categories });
}
