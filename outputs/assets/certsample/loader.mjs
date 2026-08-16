// ماژول‌های پروژه با مسیر بدون پسوند import می‌شوند (رفتار bundler نکست)، ولی Node
// خودش پسوند اضافه نمی‌کند. این hook فقط برای اجرای مستقیمِ lib بیرون از نکست است.
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && !/\.[cm]?js$/.test(specifier)) {
      return next(`${specifier}.js`, context);
    }
    throw err;
  }
}
