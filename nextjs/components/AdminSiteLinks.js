'use client';

import { useEffect, useState } from 'react';
import { SITE_LINKS } from '@/lib/siteLinks';

export default function AdminSiteLinks() {
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    // در تولید www.bardashtt.com و در محیط محلی همان origin مرورگر.
    setOrigin(window.location.origin);
  }, []);

  async function copy(url) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied((c) => (c === url ? '' : c)), 1500);
    } catch {
      setCopied('');
    }
  }

  function Row({ label, path }) {
    const full = origin ? origin + path : path;
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', background: 'var(--white)' }}>
        <span style={{ minWidth: 150, fontSize: '.85rem', fontWeight: 700, color: 'var(--dark)' }}>{label}</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: '.78rem', direction: 'ltr', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{full}</span>
        <a href={path} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--outline" style={{ flexShrink: 0 }}>باز کردن</a>
        <button type="button" className="btn btn--sm btn--dark" style={{ flexShrink: 0 }} onClick={() => copy(full)}>
          {copied === full ? '✓ کپی شد' : 'کپی'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {SITE_LINKS.map((page) => (
        <div key={page.path} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 16, background: 'var(--surface)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark)', marginBottom: 12 }}>{page.title}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Row label="لینک صفحه" path={page.path} />
            {(page.sections || []).map((s) => (
              <Row key={s.id} label={`بخش: ${s.label}`} path={`${page.path}#${s.id}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
