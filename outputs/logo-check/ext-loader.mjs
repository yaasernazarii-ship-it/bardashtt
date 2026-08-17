// لودرِ کوچک: importهای بی‌پسوندِ Next را برای اجرای مستقیم با node به .js می‌رساند.
export async function resolve(spec, ctx, next) {
  try {
    return await next(spec, ctx);
  } catch (e) {
    if (spec.startsWith('.') && !spec.endsWith('.js')) return next(`${spec}.js`, ctx);
    throw e;
  }
}
