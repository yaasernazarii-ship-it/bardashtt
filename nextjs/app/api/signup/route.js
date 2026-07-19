import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/auth';

const BRANCHES = ['تهران', 'مازندران'];
const ROLES = ['student', 'filmmaker'];

export async function POST(request) {
  try {
    const b = await request.json();
    const role = ROLES.includes(b.role) ? b.role : null;
    const firstName = String(b.firstName || '').trim().slice(0, 60);
    const lastName = String(b.lastName || '').trim().slice(0, 60);
    const phone = normalizePhone(b.phone);
    const nationalId = String(b.nationalId || '').replace(/[^\d]/g, '').slice(0, 10);
    const branch = BRANCHES.includes(b.branch) ? b.branch : null;

    if (!role) return Response.json({ ok: false, error: 'نقش را انتخاب کنید.' }, { status: 400 });
    if (!firstName) return Response.json({ ok: false, error: 'نام الزامی است.' }, { status: 400 });
    if (!lastName) return Response.json({ ok: false, error: 'نام خانوادگی الزامی است.' }, { status: 400 });
    if (!phone) return Response.json({ ok: false, error: 'شماره تماس معتبر نیست.' }, { status: 400 });

    if (role === 'student') {
      if (nationalId.length !== 10) return Response.json({ ok: false, error: 'کد ملی باید ۱۰ رقم باشد.' }, { status: 400 });
      if (!branch) return Response.json({ ok: false, error: 'شعبه را انتخاب کنید.' }, { status: 400 });
    }

    // جلوگیری از درخواست تکراریِ در انتظار با همان شماره و نقش
    const dup = await prisma.signupRequest.findFirst({
      where: { phone, role, status: 'pending' },
    });
    if (dup) {
      return Response.json({ ok: true, duplicate: true });
    }

    await prisma.signupRequest.create({
      data: {
        role,
        firstName,
        lastName,
        phone,
        nationalId: role === 'student' ? nationalId : null,
        branch: role === 'student' ? branch : null,
      },
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
