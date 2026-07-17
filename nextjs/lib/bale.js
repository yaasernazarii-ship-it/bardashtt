// ارسال پیام و فایل به پیام‌رسان «بله» از طریق Bot API (سازگار با ساختار تلگرام).
// توکن و شناسه‌ی چت از متغیرهای محیطی خوانده می‌شوند.
const API_BASE = 'https://tapi.bale.ai';

function config() {
  const token = process.env.BALE_BOT_TOKEN;
  const chatId = process.env.BALE_CHAT_ID;
  return { token, chatId, ok: Boolean(token && chatId) };
}

export function isBaleConfigured() {
  return config().ok;
}

// ارسال یک پیام متنی.
export async function sendMessage(text) {
  const { token, chatId, ok } = config();
  if (!ok) return { ok: false, error: 'BALE not configured' };
  const res = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  return res.json().catch(() => ({ ok: false }));
}

// ارسال یک سند (PDF) به همراه کپشن.
export async function sendDocument(buffer, filename, caption) {
  const { token, chatId, ok } = config();
  if (!ok) return { ok: false, error: 'BALE not configured' };
  const form = new FormData();
  form.append('chat_id', String(chatId));
  if (caption) form.append('caption', caption);
  form.append('document', new Blob([buffer], { type: 'application/pdf' }), filename);
  const res = await fetch(`${API_BASE}/bot${token}/sendDocument`, { method: 'POST', body: form });
  return res.json().catch(() => ({ ok: false }));
}
