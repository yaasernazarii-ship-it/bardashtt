// بندانگشتیِ عکس ۳×۴ کاربر برای فهرست‌های پنل مدیریت.
// اگر کاربر عکسی ثبت نکرده باشد، جای خالی با آیکون کاربر نشان داده می‌شود.

import Icon from './Icon';

export default function UserPhotoThumb({ src, name, size = 30 }) {
  return (
    <span className="user-photo user-photo--xs" style={{ width: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ? `عکس ${name}` : 'عکس کاربر'} />
      ) : (
        <Icon name="user" size={Math.round(size * 0.5)} className="user-photo__ph" />
      )}
    </span>
  );
}
