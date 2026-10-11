'use client';
import { useState, useEffect, useCallback } from 'react';

const slides = [
  { className: 'fs1', bg: 'linear-gradient(155deg,#1a0e05 0%,#2e1c09 40%,#0d0805 100%)' },
  { className: 'fs2', bg: 'linear-gradient(155deg,#050c18 0%,#0b1f38 50%,#060c17 100%)' },
  { className: 'fs3', bg: 'linear-gradient(155deg,#120900 0%,#261200 50%,#0e0900 100%)' },
  { className: 'fs4', bg: 'linear-gradient(155deg,#080808 0%,#141414 50%,#0a0a0a 100%)' },
];

export default function HomeSlider() {
  const [idx, setIdx] = useState(0);

  const go = useCallback((n) => {
    setIdx(((n % slides.length) + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const t = setInterval(() => go(idx + 1), 5000);
    return () => clearInterval(t);
  }, [idx, go]);

  return (
    <div className="fullslider">
      {slides.map((s, i) => (
        <div key={i} className={`fs ${s.className}${i === idx ? ' active' : ''}`} style={{ background: s.bg }} />
      ))}
      <div className="fs-brand">
        <span>خانواده <em>برداشت</em></span>
      </div>
      <button className="fs-prev" onClick={() => go(idx - 1)} aria-label="قبلی">&#8250;</button>
      <button className="fs-next" onClick={() => go(idx + 1)} aria-label="بعدی">&#8249;</button>
      <div className="fs-dots">
        {slides.map((_, i) => (
          <button key={i} className={`fs-dot${i === idx ? ' active' : ''}`} onClick={() => go(i)} aria-label={`اسلاید ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
