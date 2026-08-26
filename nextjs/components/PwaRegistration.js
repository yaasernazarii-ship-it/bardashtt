'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'pwa-controller-reloaded';

export default function PwaRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    let registration;
    let reloading = false;

    const reloadForUpdate = () => {
      if (reloading || sessionStorage.getItem(RELOAD_KEY) === '1') return;
      reloading = true;
      sessionStorage.setItem(RELOAD_KEY, '1');
      window.location.reload();
    };

    const update = () => registration?.update().catch(() => {});
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') update();
    };
    const onMessage = (event) => {
      if (event.data?.type === 'PWA_REFRESH') reloadForUpdate();
    };

    navigator.serviceWorker.addEventListener('controllerchange', reloadForUpdate);
    navigator.serviceWorker.addEventListener('message', onMessage);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', update);

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((value) => {
        registration = value;
        sessionStorage.removeItem(RELOAD_KEY);
        return registration.update();
      })
      .catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', reloadForUpdate);
      navigator.serviceWorker.removeEventListener('message', onMessage);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', update);
    };
  }, []);

  return null;
}
