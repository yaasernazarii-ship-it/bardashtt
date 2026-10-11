'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton({ className = 'btn btn--outline', children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <button type="button" className={className} onClick={logout} disabled={loading}>
      {loading ? '…' : (children || 'خروج')}
    </button>
  );
}
