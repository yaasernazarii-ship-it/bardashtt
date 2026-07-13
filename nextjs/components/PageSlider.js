'use client';
import { useState, useEffect, useCallback } from 'react';

const gradients = [
  'linear-gradient(155deg,#1a0e05 0%,#2e1c09 40%,#0d0805 100%)',
  'linear-gradient(155deg,#050c18 0%,#0b1f38 50%,#060c17 100%)',
  'linear-gradient(155deg,#120900 0%,#261200 50%,#0e0900 100%)',
];

export default function PageSlider({ title, count = 3 }) {
  const [idx, setIdx] = useState(0);
  const slides = gradients.slice(0, count);

  const go = useCallback((n) => {
    setIdx(((n % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const t = setInterval(() => go(idx + 1), 5000);
    return () => clearInterval(t);
  }, [idx, go]);

  return (
    <div style={{ position: 'relative', height: 'clamp(240px,55vh,720px)', overflow: 'hidden', background: '#0a0a0a' }}>
      {slides.map((g, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          background: g,
          opacity: i === idx ? 1 : 0,
          transition: 'opacity 1.4s ease',
        }} />
      ))}
      {title && (
        <div style={{ position: 'absolute', bottom: 52, right: 0, left: 0, textAlign: 'center', zIndex: 9, pointerEvents: 'none' }}>
          <span style={{ display: 'inline-block', fontSize: 'clamp(1rem,2.2vw,1.4rem)', fontWeight: 900, color: '#fff', letterSpacing: '.04em', textShadow: '0 2px 16px rgba(0,0,0,.7)' }}>
            {title}
          </span>
        </div>
      )}
      <button onClick={() => go(idx - 1)} aria-label="قبلی" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: 20, zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: '1.5px solid rgba(255,255,255,.25)', color: '#fff', fontSize: '1.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>›</button>
      <button onClick={() => go(idx + 1)} aria-label="بعدی" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 20, zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: '1.5px solid rgba(255,255,255,.25)', color: '#fff', fontSize: '1.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>‹</button>
      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => go(i)} aria-label={`اسلاید ${i + 1}`} style={{ width: i === idx ? 26 : 8, height: 8, borderRadius: i === idx ? 4 : '50%', background: i === idx ? 'var(--gold)' : 'rgba(255,255,255,.35)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all .3s' }} />
        ))}
      </div>
    </div>
  );
}
