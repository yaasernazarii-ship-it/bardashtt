'use client';

import { useState } from 'react';
import Icon from './Icon';

const LOOK = { beard: 'با ریش', cleanShaven: 'بی‌ریش', makeup: 'با میکاپ', noMakeup: 'بدون میکاپ' };
const POSE = { front: 'تمام‌رخ', profile: 'نیم‌رخ', threeQuarter: 'سه‌رخ' };

export default function ActorGallery({ photos, alt, gender }) {
  const [index, setIndex] = useState(0);
  const active = photos[index] || photos[0] || null;
  const label = (photo) => [LOOK[photo.look], POSE[photo.pose]].filter(Boolean).join(' — ') || photo.caption || 'عکس اصلی';

  if (!active) {
    return (
      <div className="actor-detail__photo">
        <Icon name="masks" size={56} strokeWidth={1.3} />
      </div>
    );
  }

  return (
    <div className="actor-gallery">
      {gender && <h2 style={{ fontSize: '1rem' }}>عکس اصلی و آرشیو معرفی</h2>}
      <div className="actor-detail__photo" style={{ backgroundImage: `url(${active.url})` }} role="img" aria-label={`${label(active)} ${alt}`} />
      <p className="actor-gallery__caption">{gender ? label(active) : active.caption}</p>
      {photos.length > 1 && (
        <div className="actor-gallery__thumbs">
          {photos.map((p, i) => (
            <div key={p.id} className="actor-gallery__item">
              <button
                type="button"
                className={`actor-gallery__thumb ${i === index ? 'is-active' : ''}`}
                style={{ backgroundImage: `url(${p.url})` }}
                onClick={() => setIndex(i)}
                aria-label={`${label(p)} ${alt}`}
              />
              {gender && <span>{label(p)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
