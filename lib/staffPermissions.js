export const STAFF_PERMISSION_GROUPS = [
  {
    key: 'education',
    label: 'هنرجویان و آموزش',
    permissions: [
      { key: 'users', label: 'کاربران', description: 'مشاهده و مدیریت حساب‌های عادی' },
      { key: 'signups', label: 'درخواست عضویت', description: 'بررسی درخواست‌ها و ساخت حساب' },
      { key: 'enrollments', label: 'ثبت‌نام دوره', description: 'بررسی ثبت‌نام و تست بازیگری' },
      { key: 'classes', label: 'کلاس‌ها و تقویم', description: 'کلاس، جلسه و حضور و غیاب' },
      { key: 'live-classes', label: 'کلاس‌های آنلاین', description: 'برنامه‌ریزی و مدیریت پخش' },
      { key: 'exam', label: 'آزمون و بانک سؤال', description: 'سؤال‌ها، مجوزها و نتایج' },
      { key: 'certificates', label: 'گواهی‌نامه‌ها', description: 'صدور و مدیریت گواهی‌نامه' },
      { key: 'resumes', label: 'رزومه‌ها', description: 'ساخت، ویرایش و انتشار رزومه' },
      { key: 'growth', label: 'مسیر رشد', description: 'هدف‌ها، تمرین‌ها و ارزیابی هنرجو' },
    ],
  },
  {
    key: 'commerce',
    label: 'مالی و فروش',
    permissions: [
      { key: 'payments', label: 'پرداخت‌ها و شهریه', description: 'مشاهده و تعیین وضعیت پرداخت' },
      { key: 'courses', label: 'دوره‌های غیرحضوری', description: 'دوره‌ها، درس‌ها و دسترسی خریدار' },
      { key: 'books', label: 'فروش کتاب', description: 'کتاب‌ها، سفارش‌ها و ارسال' },
      { key: 'bookings', label: 'درخواست‌های ست‌تایم', description: 'بررسی و پیگیری درخواست‌ها' },
    ],
  },
  {
    key: 'communications',
    label: 'ارتباطات',
    permissions: [
      { key: 'support', label: 'پشتیبانی آنلاین', description: 'مشاهده و پاسخ به پیام‌ها' },
      { key: 'chat-groups', label: 'گفت‌وگوی هنرجویان', description: 'مدیریت گروه‌ها و پیام‌ها' },
      { key: 'reports', label: 'گزارش و گفت‌وگوی تیم', description: 'گزارش‌های کاری و گفت‌وگوی داخلی' },
      { key: 'social', label: 'برداشتگرام', description: 'انتشار رسمی و نظارت بر محتوا' },
    ],
  },
  {
    key: 'content',
    label: 'محتوا و سایت',
    permissions: [
      { key: 'ai-knowledge', label: 'منابع هوش مصنوعی', description: 'مدیریت اسناد و منابع دستیار' },
      { key: 'posts', label: 'محتوا و انتشار', description: 'وبلاگ، اخبار و گالری' },
      { key: 'content', label: 'متن صفحات', description: 'ویرایش محتوای ثابت سایت' },
      { key: 'links', label: 'لینک صفحات', description: 'مشاهده و مدیریت لینک‌ها' },
    ],
  },
];

export const STAFF_PERMISSION_KEYS = STAFF_PERMISSION_GROUPS.flatMap((group) => group.permissions.map((item) => item.key));
const PERMISSION_SET = new Set(STAFF_PERMISSION_KEYS);

export function sanitizeStaffPermissions(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(String).filter((value) => PERMISSION_SET.has(value)))];
}

export function isFullManager(user) {
  return !!user && (user.role === 'admin' || user.role === 'editor');
}

export function isScopedStaff(user) {
  return !!user && user.role === 'staff';
}

export function canUsePermission(user, permission) {
  if (isFullManager(user)) return true;
  return isScopedStaff(user)
    && user.active !== false
    && user.staffAccessEnabled === true
    && Array.isArray(user.staffPermissions)
    && user.staffPermissions.includes(permission);
}

const ADMIN_SEGMENTS = {
  '': 'users',
  users: 'users',
  signups: 'signups',
  enrollments: 'enrollments',
  attendance: 'classes',
  classes: 'classes',
  sessions: 'classes',
  'live-classes': 'live-classes',
  exam: 'exam',
  certificates: 'certificates',
  resumes: 'resumes',
  'resume-fields': 'resumes',
  growth: 'growth',
  payments: 'payments',
  courses: 'courses',
  books: 'books',
  'book-orders': 'books',
  bookings: 'bookings',
  support: 'support',
  chat: 'chat-groups',
  'chat-groups': 'chat-groups',
  'direct-chats': 'chat-groups',
  reports: 'reports',
  social: 'social',
  'ai-knowledge': 'ai-knowledge',
  posts: 'posts',
  content: 'content',
  links: 'links',
};

export function permissionForPath(pathname) {
  const path = String(pathname || '').split('?')[0];
  if (path === '/dashboard' || path === '/dashboard/profile') return null;
  if (path.startsWith('/dashboard/admin/')) {
    const segment = path.slice('/dashboard/admin/'.length).split('/')[0];
    return ADMIN_SEGMENTS[segment] || false;
  }
  if (path === '/dashboard/admin') return 'users';
  if (path.startsWith('/api/admin/')) {
    const segment = path.slice('/api/admin/'.length).split('/')[0];
    return ADMIN_SEGMENTS[segment] || false;
  }
  if (path === '/api/upload') return 'upload';
  if (path.startsWith('/api/gallery')) return 'posts';
  if (path.startsWith('/api/calendar')) return 'classes';
  if (path.startsWith('/api/social/')) return 'social';
  if (path === '/actors' || path.startsWith('/actors/')) return null;
  if (path.startsWith('/dashboard/') && path !== '/dashboard/profile') return false;
  return null;
}

const UPLOAD_PERMISSIONS = new Set(['resumes', 'posts', 'content', 'books', 'courses', 'certificates', 'ai-knowledge', 'social', 'enrollments']);

export function canAccessPath(user, pathname) {
  if (isFullManager(user)) return true;
  if (!isScopedStaff(user) || user.active === false || user.staffAccessEnabled !== true) return false;
  const permission = permissionForPath(pathname);
  if (permission === null) return true;
  if (permission === false) return false;
  if (permission === 'upload') return user.staffPermissions.some((item) => UPLOAD_PERMISSIONS.has(item));
  return canUsePermission(user, permission);
}
