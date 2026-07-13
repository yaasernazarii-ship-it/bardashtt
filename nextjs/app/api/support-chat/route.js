export async function POST(request) {
  try {
    const data = await request.json();
    const name = String(data.name || '').trim();
    const phone = String(data.phone || '').trim();
    const message = String(data.message || '').trim();

    if (!name || !message) {
      return Response.json({ ok: false, error: 'نام و پیام الزامی است.' }, { status: 400 });
    }

    // اینجا می‌توان اتصال به سرویس پیامک/ایمیل/CRM را اضافه کرد.
    console.log('support-chat', { name, phone, message, at: new Date().toISOString() });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
