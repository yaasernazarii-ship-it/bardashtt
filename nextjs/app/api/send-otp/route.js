export async function POST(request) {
  try {
    const { phone } = await request.json();
    if (!phone) return Response.json({ ok: false, error: 'شماره موبایل الزامی است.' }, { status: 400 });
    return Response.json({ ok: true, devOtp: '1234' });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
