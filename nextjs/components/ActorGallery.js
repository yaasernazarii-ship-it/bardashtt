'use client';

import { useState } from 'react';
import Icon from './Icon';

// گالریِ عکس‌های رزومه: عکس بزرگ + نوارِ بندانگشتی برای جابه‌جایی بینشان.
export default function ActorGallery({ photos, alt }) {
  const [index, setIndex] = useState(0);
  const active = photos[index] || photos[0] || null;

  if (!active) {
    return (
      <div className="actor-detail__photo">
        <Icon name="masks" size={56} strokeWidth={1.3} />
      </div>
    );
  }

  return (
    <div className="actor-gallery">
      <div className="actor-detail__photo" style={{ backgroundImage: `url(${active.url})` }} role="img" aria-label={active.caption || alt} />
      {active.caption && <p className="actor-gallery__caption">{active.caption}</p>}
      {photos.length > 1 && (
        <div className="actor-gallery__thumbs">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`actor-gallery__thumb ${i === index ? 'is-active' : ''}`}
              style={{ backgroundImage: `url(${p.url})` }}
              onClick={() => setIndex(i)}
              aria-label={`عکس ${(i + 1).toLocaleString('fa-IR')} از ${alt}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
