// اتصال به پنل پیامک SMS.IR (سرویس ارسال کد تأیید / Verify)
// کلید و شناسه قالب فقط از متغیرهای محیطی خوانده می‌شوند و در کد ذخیره نمی‌شوند.

const API_URL = 'https://api.sms.ir/v1/send/verify';

export function isSmsConfigured() {
  return !!(process.env.SMS_IR_API_KEY && process.env.SMS_IR_TEMPLATE_ID);
}

export async function sendOtpSms(mobile, code) {
  if (!isSmsConfigured()) return { delivered: false, reason: 'not_configured' };

  const paramName = process.env.SMS_IR_PARAM_NAME || 'CODE';
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        'x-api-key': process.env.SMS_IR_API_KEY,
      },
      body: JSON.stringify({
        mobile,
        templateId: Number(process.env.SMS_IR_TEMPLATE_ID),
        parameters: [{ name: paramName, value: String(code) }],
      }),
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
