'use client';

import { useState } from 'react';
import Icon from './Icon';

// دکمهٔ «لیست کوتاه» — وضعیت اولیه از سرور می‌آید تا بدون فلیکر رندر شود.
export default function ShortlistButton({ actorId, initial = false, size = 'sm', onChange }) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !saved;
    try {
      const res = next
        ? await fetch('/api/shortlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actorId }),
          })
        : await fetch(`/api/shortlist?actorId=${encodeURIComponent(actorId)}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.ok) {
        setSaved(next);
        onChange?.(actorId, next);
      }
    } catch { /* شبکه قطع بود؛ وضعیت دکمه دست‌نخورده می‌ماند */ }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      className={`btn btn--${size} ${saved ? 'btn--gold' : 'btn--outline'}`}
      title={saved ? 'حذف از لیست کوتاه' : 'افزودن به لیست کوتاه'}
    >
      <Icon name={saved ? 'check' : 'plus'} size={15} />
      {saved ? ' در لیست کوتاه' : ' لیست کوتاه'}
    </button>
  );
}
