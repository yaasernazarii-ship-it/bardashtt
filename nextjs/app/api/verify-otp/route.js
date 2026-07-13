export async function POST(request) {
  try {
    const { code } = await request.json();
    return Response.json({ ok: code === '1234' });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
