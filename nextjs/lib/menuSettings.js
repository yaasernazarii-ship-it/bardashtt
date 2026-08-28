import { prisma } from './prisma';

// متن‌ها و تصویر بالای منوی عمومی از پنل کافه قابل تغییرند؛ مقدار پیش‌فرض هویت برداشت است.
export const MENU_SETTING_DEFAULTS = {
  heroTitle: 'کافه کتاب برداشت',
  heroTagline: 'جایی برای خواندن، دیدن، شنیدن و فکر کردن',
  heroImage: '',
  note: 'تمامی محصولات با مواد اولیه تازه و باکیفیت تهیه می‌شوند.',
  footer: 'کافه کتاب برداشت\nجایی برای خواندن، دیدن، شنیدن و فکر کردن.',
  info: 'برای سفارش، شماره میز خود را هنگام ثبت سفارش وارد کنید.',
  serviceFee: '0',
};

export const MENU_SETTING_KEYS = Object.keys(MENU_SETTING_DEFAULTS);

export async function readMenuSettings() {
  const rows = await prisma.menuSetting.findMany({ where: { key: { in: MENU_SETTING_KEYS } } });
  const saved = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return { ...MENU_SETTING_DEFAULTS, ...saved };
}

export function serviceFeeOf(settings) {
  const fee = Number(settings.serviceFee);
  return Number.isSafeInteger(fee) && fee > 0 ? fee : 0;
}
