import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/auth';

const BRANCHES = ['تهران', 'ساری'];
const ROLES = ['student', 'filmmaker'];

export async function POST(request) {
  try {
    const b = await request.json();
    const role = ROLES.includes(b.role) ? b.role : null;
    const firstName = String(b.firstName || '').trim().slice(0, 60);
    const lastName = String(b.lastName || '').trim().slice(0, 60);

    if (!role) return Response.json({ ok: false, error: 'نقش را انتخاب کنید.' }, { status: 400 });
    if (!firstName) return Response.json({ ok: false, error: 'نام الزامی است.' }, { status: 400 });
    if (!lastName) return Response.json({ ok: false, error: 'نام خانوادگی الزامی است.' }, { status: 400 });

    let phone = null;
    let nationalId = null;
    let branch = null;
    let birthDate = null;
    let idCardImage = null;
    let goal = null;

    if (role === 'student') {
      phone = normalizePhone(b.phone);
      branch = BRANCHES.includes(b.branch) ? b.branch : null;
      birthDate = String(b.birthDate || '').trim().slice(0, 20);
      idCardImage = String(b.idCardImage || '').trim().slice(0, 300);

      if (!phone) return Response.json({ ok: false, error: 'شماره تماس معتبر نیست.' }, { status: 400 });
      if (!branch) return Response.json({ ok: false, error: 'شعبه را انتخاب کنید (تهران یا ساری).' }, { status: 400 });
      if (!birthDate) return Response.json({ ok: false, error: 'تاریخ تولد را وارد کنید.' }, { status: 400 });
      if (!/^\/media\/[A-Za-z0-9._-]+$/.test(idCardImage)) {
        return Response.json({ ok: false, error: 'عکس شناسنامه یا کارت ملی را بارگذاری کنید.' }, { status: 400 });
      }
    } else {
      // فیلمساز: نام، نام خانوادگی، کد ملی و هدف
      nationalId = String(b.nationalId || '').replace(/[^\d]/g, '').slice(0, 10);
      goal = String(b.goal || '').trim().slice(0, 1000);
      if (nationalId.length !== 10) {
        return Response.json({ ok: false, error: 'کد ملی باید ۱۰ رقم باشد.' }, { status: 400 });
      }
      if (!goal) {
        return Response.json({ ok: false, error: 'هدف خود از انتخاب خانواده برداشت را بنویسید.' }, { status: 400 });
      }
    }

    // جلوگیری از درخواست تکراریِ در انتظار
    const dupWhere = role === 'student'
      ? { phone, role, status: 'pending' }
      : { nationalId, role, status: 'pending' };
    const dup = await prisma.signupRequest.findFirst({ where: dupWhere });
    if (dup) {
      return Response.json({ ok: true, duplicate: true });
    }

    await prisma.signupRequest.create({
      data: {
        role,
        firstName,
        lastName,
        phone: phone || '',
        nationalId,
        branch,
        birthDate,
        idCardImage,
        goal,
      },
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
