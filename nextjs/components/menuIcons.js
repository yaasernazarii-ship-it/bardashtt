// آیکن‌های دایره‌ای دسته‌ها؛ هم در منوی عمومی و هم در پنل کافه استفاده می‌شوند.
export const MENU_ICONS = {
  grid: { label: 'همه', path: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
  food: { label: 'غذا', path: 'M7 3v7M10 3v7M8.5 10v11M17 21V3c2 1.2 2.6 5 0 6.5' },
  hot: { label: 'نوشیدنی گرم', path: 'M4 9h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM16 11h2a2 2 0 0 1 0 4h-2M8 2c-.8 1.2.8 2.3 0 3.5M12 2c-.8 1.2.8 2.3 0 3.5' },
  cold: { label: 'نوشیدنی سرد', path: 'M6 7h12l-1.4 12.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8zM14.5 3 12 7' },
  dessert: { label: 'دسر', path: 'M4 21h16v-6H4zM4 15c0-2.2 2.4-3.2 8-3.2s8 1 8 3.2M12 4v4' },
  bakery: { label: 'نان و کیک', path: 'M3 15c0-4 4-8 9-8s9 4 9 8v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8 9v8M12 8v9M16 9v8' },
  book: { label: 'کتاب', path: 'M4 4h9a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4v13' },
  special: { label: 'ویژه', path: 'm12 3 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8L6.8 19.3l1-5.9L3.5 9.2l5.9-.8z' },
};

export const MENU_ICON_KEYS = Object.keys(MENU_ICONS);

export function iconKeyOf(category) {
  return MENU_ICONS[category?.icon] ? category.icon : 'special';
}

export default function MenuIcon({ name, className = '' }) {
  const icon = MENU_ICONS[name] || MENU_ICONS.special;
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={icon.path} /></svg>;
}
