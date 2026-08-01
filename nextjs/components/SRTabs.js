'use client';

import { useState } from 'react';

// تب‌بندیِ بخش‌های صفحهٔ «مسئولیت اجتماعی».
// محتوای هر تب روی سرور رندر می‌شود و به‌صورت prop به این کامپوننت داده می‌شود؛
// همهٔ پنل‌ها در DOM می‌مانند (برای سئو) و فقط پنلِ فعال نمایش داده می‌شود.
export default function SRTabs({ tabs }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="sr-tabs" role="tablist" aria-label="بخش‌های مسئولیت اجتماعی">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === i}
            className={`sr-tab${active === i ? ' sr-tab--active' : ''}`}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="sr-tab-panels">
        {tabs.map((t, i) => (
          <div key={t.key} role="tabpanel" hidden={active !== i} className="sr-tab-panel">
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
