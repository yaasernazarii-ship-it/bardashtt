// عکس پروفایل گروه؛ اگر مدیر عکسی نگذاشته باشد، حرف اول نام گروه نشان داده می‌شود.
export default function GroupAvatar({ name, photoUrl, size = 38 }) {
  const style = {
    width: size, height: size, borderRadius: '50%', flex: `0 0 ${size}px`,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', background: 'var(--dark)', color: '#fff',
    fontWeight: 800, fontSize: `${Math.max(0.7, size / 40)}rem`,
  };

  if (photoUrl) {
    return (
      <span style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt={name || 'گروه'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </span>
    );
  }

  return <span style={style}>{(name || 'گ').trim().charAt(0)}</span>;
}
