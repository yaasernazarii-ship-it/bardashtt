'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const fa = (n) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(n ?? 0);

// متن‌ها از پنل («متن صفحات» ← «استعلام گواهی‌نامه») می‌آیند و به‌صورت prop می‌رسند.
const FALLBACK = {
  title: 'استعلام گواهی‌نامه',
  subtitle: 'اصالت گواهی‌نامهٔ پایان دورهٔ آموزشگاه سینمایی تک برداشت را با کد درج‌شده روی گواهی بررسی کنید.',
  formTitle: 'کد گواهی‌نامه را وارد کنید',
  placeholder: 'مثلاً ۱۳۹۷-۰۰۲۱۲۳۴۵۶۷',
  submit: 'استعلام',
  checking: 'در حال بررسی…',
  valid: 'این گواهی‌نامه معتبر است.',
  revoked: 'این گواهی‌نامه توسط آموزشگاه باطل شده و معتبر نیست.',
};

export default function VerifyForm({ content }) {
  const c = { ...FALLBACK, ...(content || {}) };
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cert, setCert] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const run = useCallback(async (serial) => {
    const value = String(serial || '').trim();
    const certificateCode = (() => {
      try { return new URL(value).searchParams.get('code') || value; } catch { return value; }
    })();
    setLoading(true); setError(''); setCert(null);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial: certificateCode }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'استعلام ناموفق بود.'); return; }
      setCert(data.certificate);
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  }, []);

  // QR روی گواهی به همین صفحه با ?code=… می‌رسد؛ کد پر و استعلام خودکار انجام می‌شود.
  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get('code');
    if (!fromLink) return;
    setCode(fromLink);
    run(fromLink);
  }, [run]);

  function check(e) {
    e.preventDefault();
    run(code);
  }

  function closeScanner() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScannerOpen(false);
  }

  async function openScanner() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerError('دسترسی به دوربین در مرورگر شما پشتیبانی نمی‌شود. کد گواهی را وارد کنید.');
      return;
    }

    setScannerError('');
    setScannerOpen(true);
  }

  useEffect(() => {
    if (!scannerOpen) return undefined;

    let stopped = false;
    let timer = null;
    let detector = null;
    let decode = null;

    async function start() {
      try {
        if ('BarcodeDetector' in window) detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        else decode = (await import('jsqr')).default;
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        timer = setInterval(async () => {
          if (stopped || videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
          try {
            const nativeMatch = detector ? (await detector.detect(videoRef.current))[0] : null;
            const canvas = canvasRef.current;
            const context = canvas?.getContext('2d', { willReadFrequently: true });
            if (!nativeMatch && (!canvas || !context)) return;
            let raw = nativeMatch?.rawValue;
            if (!raw) {
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              raw = decode(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' })?.data;
            }
            if (!raw) return;
            const scanned = (() => {
              try { return new URL(raw.trim()).searchParams.get('code') || raw.trim(); } catch { return raw.trim(); }
            })();
            setCode(scanned);
            closeScanner();
            run(scanned);
          } catch {
            setScannerError('خواندن QR ممکن نشد. کد گواهی را وارد کنید.');
            closeScanner();
          }
        }, 350);
      } catch {
        setScannerError('دسترسی به دوربین ممکن نشد. مجوز دوربین را بررسی کنید یا کد گواهی را وارد کنید.');
        closeScanner();
      }
    }

    start();
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [scannerOpen, run]);

  return (
    <>
      <div className="page-header">
        <div className="page-header__inner">
          <h1>{c.title}</h1>
          <p>{c.subtitle}</p>
        </div>
      </div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container--sm">
          <form onSubmit={check} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 32, boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ marginBottom: 16 }}>{c.formTitle}</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                className="form-input"
                style={{ flex: '1 1 220px' }}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={c.placeholder}
                dir="ltr"
                required
              />
              <button className="btn btn--dark" disabled={loading}>{loading ? c.checking : c.submit}</button>
              <button type="button" className="btn btn--outline" onClick={openScanner}>اسکن QR</button>
            </div>
            {scannerOpen && (
              <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
                <video ref={videoRef} muted playsInline style={{ width: '100%', borderRadius: 12, background: '#111', maxHeight: 360 }} />
                <canvas ref={canvasRef} hidden />
                <button type="button" className="btn btn--outline" onClick={closeScanner}>بستن دوربین</button>
              </div>
            )}
            {scannerError && <div className="alert alert--error" style={{ marginTop: 16 }}>{scannerError}</div>}
          </form>

          {error && <div className="alert alert--error" style={{ marginTop: 20 }}>{error}</div>}

          {cert && (
            <div
              className="stack-card"
              style={{ marginTop: 20, borderTop: `4px solid ${cert.revoked ? '#dc2626' : '#16a34a'}` }}
            >
              {cert.revoked ? (
                <div className="alert alert--error">{c.revoked}</div>
              ) : (
                <div className="alert alert--success">{c.valid}</div>
              )}
              <div style={{ display: 'grid', gap: 8, marginTop: 14, lineHeight: 2 }}>
                <div>دارندهٔ گواهی: <strong>{cert.holder}</strong></div>
                {cert.courseTitle && <div>دوره: <strong>{cert.courseTitle}</strong></div>}
                {cert.branch && <div>شعبه: <strong>{cert.branch}</strong></div>}
                {Number.isFinite(cert.percent) && (
                  <div>نمرهٔ نهایی دوره: <strong>{fa(cert.percent)} از ۱۰۰</strong></div>
                )}
                <div>تاریخ صدور: <strong>{dateFmt.format(new Date(cert.issuedAt))}</strong></div>
                <div>کد گواهی: <strong dir="ltr">{cert.serial}</strong></div>
                <div style={{ color: 'var(--muted)' }}>صادرکننده: {cert.school}</div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
