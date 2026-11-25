// اتصال به سرویس هوش مصنوعی سازگار با OpenAI (گپ‌جی‌پی‌تی)
// کلید و آدرس فقط از متغیرهای محیطی خوانده می‌شوند.

const BASE_URL = (process.env.AI_BASE_URL || 'https://api.gapgpt.app/v1').replace(/\/$/, '');
const CHAT_MODEL = process.env.AI_CHAT_MODEL || 'gpt-4o-mini';
const EMBED_MODEL = process.env.AI_EMBED_MODEL || 'text-embedding-3-small';

export function isAiConfigured() {
  return !!process.env.AI_API_KEY;
}

export class AiServiceError extends Error {
  constructor(operation, status, detail = '') {
    super(`${operation}_failed ${status} ${detail.slice(0, 200)}`);
    this.name = 'AiServiceError';
    this.operation = operation;
    this.status = status;
    this.detail = detail.slice(0, 500);
  }
}

export function aiErrorMessage(error) {
  if (error instanceof AiServiceError) {
    if (error.status === 401 || error.status === 403) return 'کلید اتصال گپ‌جی‌پی‌تی معتبر نیست.';
    if (error.status === 402 || error.status === 429 || /insufficient|quota|credit|balance|اعتبار/i.test(error.detail)) {
      return 'اعتبار گپ‌جی‌پی‌تی کافی نیست. پس از شارژ، بدون تغییر تنظیمات دوباره امتحان کنید.';
    }
    if (error.status >= 500) return 'سرویس گپ‌جی‌پی‌تی موقتاً در دسترس نیست. کمی بعد دوباره امتحان کنید.';
  }
  return 'ارتباط با سرویس هوش مصنوعی انجام نشد.';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.AI_API_KEY}`,
  };
}

export async function embed(input) {
  const res = await fetch(`${BASE_URL}/embeddings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ model: EMBED_MODEL, input }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new AiServiceError('embed', res.status, detail);
  }
  const data = await res.json();
  return data.data.map((d) => d.embedding);
}

export async function embedOne(text) {
  const [v] = await embed([text]);
  return v;
}

export async function chat(messages, { temperature = 0.2, maxTokens = 700 } = {}) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ model: CHAT_MODEL, messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new AiServiceError('chat', res.status, detail);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export function cosineSim(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
