import { timingSafeEqual } from 'node:crypto';
import { processSmsQueue } from '@/lib/smsQueue';

function authorized(request) {
  const secret = process.env.SMS_QUEUE_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!secret || !supplied) return false;
  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function POST(request) {
  if (!authorized(request)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const result = await processSmsQueue();
  return Response.json({ ok: true, ...result });
}
