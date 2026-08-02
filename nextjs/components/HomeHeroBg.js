'use client';
import { useState, useEffect, useCallback } from 'react';

// پس‌زمینهٔ هدر صفحهٔ اصلی: اگر چند عکس باشد با محو نرم می‌چرخد، اگر یکی باشد ثابت می‌ماند.
// روی همهٔ عکس‌ها یک لایهٔ تیرهٔ ثابت (scrim) قرار می‌گیرد تا متن روی هدر خوانا بماند.
export default function HomeHeroBg({ images = [] }) {
  const pics = (images || []).filter(Boolean);
  const slides = pics.length ? pics : ['/hero-cinema-bg.png'];
  const [idx, setIdx] = useState(0);
  const multi = slides.length > 1;

  const go = useCallback((n) => {
    setIdx(((n % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!multi) return;
    const id = setInterval(() => go(idx + 1), 5000);
    return () => clearInterval(id);
  }, [idx, go, multi]);

  return (
    <div className="home-hero__bg">
      {slides.map((src, i) => (
        <div
          key={i}
          className={`home-hero__slide${i === idx ? ' active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className="home-hero__scrim" />
    </div>
  );
}
