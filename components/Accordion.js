'use client';
import { useState } from 'react';

export default function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div>
      {items.map((item, i) => (
        <div className="accordion-item" key={item.q}>
          <button className={`accordion-btn${open === i ? ' open' : ''}`} onClick={() => setOpen(open === i ? -1 : i)}>
            {item.q} <span className="ico">＋</span>
          </button>
          <div className={`accordion-body${open === i ? ' open' : ''}`}>
            <p>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
