'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// دکمهٔ خریدِ دوره. اگر کاربر واردنشده باشد به صفحهٔ ورود می‌رود؛
// در غیر این صورت درخواستِ خرید را ثبت و پیامِ وضعیت را نشان می‌دهد.
export default function BuyCourseButton({ slug, price, loggedIn, nextPath }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  const priceLabel = price > 0 ? `${price.toLocaleString('fa-IR')} تومان` : 'رایگان';

  async function buy() {
    if (!loggedIn) {
      router.push(`/auth?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    setLoading(true); setMsg('');
    try {
      const res = await fetch(`/api/courses/${slug}/buy`, { method: 'POST' });
      const data = await res.json();
      if (!data.ok) { setMsg(data.error || 'خطا در ثبت درخواست.'); setLoading(false); return; }
      if (data.alreadyOwned) { router.refresh(); return; }

      // فاکتور ساخته شد؛ بلافاصله پرداخت آنلاین را شروع می‌کنیم و به درگاه می‌رویم.
      if (data.paymentId) {
        const payRes = await fetch(`/api/my/payments/${data.paymentId}/pay`, { method: 'POST' });
        const payData = await payRes.json();
        if (payData.ok && payData.redirectUrl) { window.location.href = payData.redirectUrl; return; }
        // درگاه هنوز فعال نیست یا خطا داد؛ فاکتور در «پرداخت‌های من» باقی می‌ماند.
        setDone(true);
        setMsg(payData.error || data.message || 'درخواست خرید ثبت شد.');
        setLoading(false);
        return;
      }

      setDone(true);
      setMsg(data.message || 'درخواست خرید ثبت شد.');
    } catch {
      setMsg('خطا در ارتباط با سرور.');
    }
    setLoading(false);
  }

  return (
    <div>
      <button className="btn btn--gold" onClick={buy} disabled={loading || done} style={{ width: '100%' }}>
        {loading ? 'در حال ثبت…' : done ? 'درخواست ثبت شد' : `خرید دوره — ${priceLabel}`}
      </button>
      {msg && (
        <div className={`alert ${done ? 'alert--success' : 'alert--error'}`} style={{ marginTop: 12 }}>
          {msg}
        </div>
      )}
    </div>
  );
}
