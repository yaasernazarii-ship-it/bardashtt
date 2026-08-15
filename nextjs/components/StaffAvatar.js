// حرف اول نام همکار با رنگِ نقش — در تابلوی گزارش کار و گفت‌وگوی تیمی مشترک است.
const ROLE_LABEL = { admin: 'مدیر', editor: 'ادیتور' };

export default function StaffAvatar({ name, role, size = 34 }) {
  return (
    <span
      title={ROLE_LABEL[role] || role || ''}
      style={{
        width: size, height: size, borderRadius: '50%', flex: `0 0 ${size}px`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: role === 'admin' ? 'var(--dark)' : 'var(--gold)',
        color: role === 'admin' ? '#fff' : 'var(--dark)',
        fontWeight: 800, fontSize: `${Math.max(0.7, size / 40)}rem`,
      }}
    >
      {(name || '؟').trim().charAt(0)}
    </span>
  );
}

export { ROLE_LABEL };
