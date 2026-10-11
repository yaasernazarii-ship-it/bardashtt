// اتصال به پنل پیامک SMS.IR
//  - ارسال کد تأیید (verify) با قالب مصوب
//  - ارسال پیامک متنی (bulk) با خط اختصاصی، برای اطلاع‌رسانی‌هایی مثل تأیید خرید
// کلید و شناسه‌ها فقط از متغیرهای محیطی خوانده می‌شوند و در کد ذخیره نمی‌شوند.

const VERIFY_URL = 'https://api.sms.ir/v1/send/verify';
const BULK_URL = 'https://api.sms.ir/v1/send/bulk';

export function isSmsConfigured() {
  return !!(process.env.SMS_IR_API_KEY && process.env.SMS_IR_TEMPLATE_ID);
}

// ارسال متنِ آزاد نیازمند خط اختصاصی است (SMS_IR_LINE_NUMBER).
export function isTextSmsConfigured() {
  return !!(process.env.SMS_IR_API_KEY && process.env.SMS_IR_LINE_NUMBER);
}

async function sendTemplateSms(mobile, templateId, parameters) {
  if (!process.env.SMS_IR_API_KEY || !templateId) return { delivered: false, reason: 'not_configured' };

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        'x-api-key': process.env.SMS_IR_API_KEY,
      },
      body: JSON.stringify({ mobile, templateId: Number(templateId), parameters }),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data && data.status === 1) {
      return { delivered: true, messageId: data.data?.messageId };
    }
    return { delivered: false, reason: 'provider_error', detail: data?.message || res.status };
  } catch (err) {
    return { delivered: false, reason: 'network_error', detail: String(err?.message || err) };
  }
}

export async function sendOtpSms(mobile, code) {
  if (!isSmsConfigured()) return { delivered: false, reason: 'not_configured' };
  const paramName = process.env.SMS_IR_PARAM_NAME || 'CODE';
  return sendTemplateSms(mobile, process.env.SMS_IR_TEMPLATE_ID, [{ name: paramName, value: String(code) }]);
}

export async function sendGroupNotificationSms(mobile, link) {
  const templateId = process.env.SMS_IR_GROUP_TEMPLATE_ID || '162830';
  const paramName = process.env.SMS_IR_GROUP_PARAM_NAME || 'CODE';
  return sendTemplateSms(mobile, templateId, [{ name: paramName, value: String(link) }]);
}

// ارسال یک پیامک متنی به یک شماره. هرگز throw نمی‌کند؛ نتیجه را برمی‌گرداند.
export async function sendTextSms(mobile, text) {
  if (!isTextSmsConfigured()) return { delivered: false, reason: 'not_configured' };
  const body = String(text || '').trim();
  if (!mobile || !body) return { delivered: false, reason: 'empty' };

  try {
    const res = await fetch(BULK_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-api-key': process.env.SMS_IR_API_KEY,
      },
      body: JSON.stringify({
        lineNumber: Number(process.env.SMS_IR_LINE_NUMBER),
        messageText: body,
        mobiles: [String(mobile)],
      }),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data && data.status === 1) {
      return { delivered: true, packId: data.data?.packId };
    }
    return { delivered: false, reason: 'provider_error', detail: data?.message || res.status };
  } catch (err) {
    return { delivered: false, reason: 'network_error', detail: String(err?.message || err) };
  }
}
