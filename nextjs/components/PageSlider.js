'use client';
import { useState, useEffect, useCallback } from 'react';

const gradients = [
  'linear-gradient(155deg,#1a0e05 0%,#2e1c09 40%,#0d0805 100%)',
  'linear-gradient(155deg,#050c18 0%,#0b1f38 50%,#060c17 100%)',
  'linear-gradient(155deg,#120900 0%,#261200 50%,#0e0900 100%)',
];

export default function PageSlider({ title, count = 3, images = [] }) {
  const [idx, setIdx] = useState(0);
  // فقط عکس‌های واقعی را نگه می‌داریم؛ اگر عکسی ثبت نشده باشد به گرادیانِ پیش‌فرض برمی‌گردیم.
  const pics = (images || []).filter(Boolean);
  const slides = pics.length ? pics : gradients.slice(0, count);
  const usingImages = pics.length > 0;

  const go = useCallback((n) => {
    setIdx(((n % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const t = setInterval(() => go(idx + 1), 5000);
    return () => clearInterval(t);
  }, [idx, go]);

  return (
    <div className="pslider">
      {slides.map((s, i) => (
        <div key={i} className={`pslider__slide${i === idx ? ' is-active' : ''}`}>
          {usingImages ? (
            <>
              {/* پرکنندهٔ محو برای وقتی نسبتِ عکس با قاب یکی نیست */}
              <div className="pslider__fill" style={{ backgroundImage: `url(${s})` }} />
              {/* خودِ عکس: همیشه کامل، بدون بریدگی و بدون کشیدگی */}
              <div className="pslider__img" style={{ backgroundImage: `url(${s})` }} />
            </>
          ) : (
            <div className="pslider__fill pslider__fill--flat" style={{ background: s }} />
          )}
        </div>
      ))}
      {title && (
        <div className="pslider__title">
          <span>{title}</span>
        </div>
      )}
      <button className="pslider__nav pslider__nav--prev" onClick={() => go(idx - 1)} aria-label="قبلی">&#8250;</button>
      <button className="pslider__nav pslider__nav--next" onClick={() => go(idx + 1)} aria-label="بعدی">&#8249;</button>
      <div className="pslider__dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`pslider__dot${i === idx ? ' is-active' : ''}`}
            onClick={() => go(i)}
            aria-label={`اسلاید ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
