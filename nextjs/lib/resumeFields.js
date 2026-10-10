// فیلدهای دلخواهِ رزومه: مدیر از پنل هر تعداد فیلد می‌سازد و مقدارشان در
// ActorResume.customValues ذخیره می‌شود. این فایل قواعد مشترکِ سرور و کلاینت است.

export const FIELD_TYPES = [
  { value: 'text', label: 'متن کوتاه' },
  { value: 'textarea', label: 'متن بلند' },
  { value: 'number', label: 'عدد' },
  { value: 'select', label: 'انتخاب از فهرست' },
  { value: 'boolean', label: 'بله / خیر' },
];

export const FIELD_TYPE_VALUES = FIELD_TYPES.map((t) => t.value);

// کلید فنیِ فیلد از روی عنوانِ فارسی ساخته می‌شود. حروف فارسی در کلید مجاز است
// چون کلید فقط نامِ خانهٔ JSON است و هرگز در URL یا SQL بی‌واسطه نمی‌نشیند.
export function fieldKeyFromLabel(label) {
  const base = String(label || '')
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return base || `field_${Date.now().toString(36)}`;
}

export function parseFieldOptions(options) {
  return String(options || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
}

// مقدارِ یک فیلد را بر اساس نوعش پاک‌سازی می‌کند؛ خروجی null یعنی «بدون مقدار».
export function normalizeFieldValue(def, raw) {
  if (def.type === 'boolean') return raw === true || raw === 'true' ? true : null;

  if (def.type === 'number') {
    if (raw === undefined || raw === null || raw === '') return null;
    const n = Number(String(raw).replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 0x06f0)));
    return Number.isFinite(n) ? n : null;
  }

  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) return null;

  if (def.type === 'select') {
    const allowed = parseFieldOptions(def.options);
    return allowed.includes(text) ? text : null;
  }

  return text.slice(0, def.type === 'textarea' ? 2000 : 300);
}

// مقادیر ارسالی را فقط برای فیلدهای تعریف‌شده نگه می‌دارد؛ کلیدهای ناشناس دور ریخته می‌شوند
// تا کاربرِ پنل نتواند دادهٔ دلخواه و بی‌ساختار در ستون JSON بنشاند.
export function normalizeCustomValues(defs, raw) {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = {};
  const missing = [];

  for (const def of defs) {
    const value = normalizeFieldValue(def, input[def.key]);
    if (value === null) {
      if (def.required && def.active) missing.push(def.label);
      continue;
    }
    out[def.key] = value;
  }

  return { values: out, missing };
}
