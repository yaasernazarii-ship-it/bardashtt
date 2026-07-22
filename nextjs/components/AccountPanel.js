'use client';

import { useState } from 'react';
import AuthForm from '@/components/AuthForm';
import SignupWizard from '@/components/SignupWizard';

export default function AccountPanel({ initialView = 'login' }) {
  const [view, setView] = useState(initialView); // login | signup

  const tabStyle = (active) => ({
    flex: 1,
    padding: '12px 8px',
    cursor: 'pointer',
    border: '1px solid var(--border)',
    borderRadius: 12,
    background: active ? 'var(--dark)' : 'transparent',
    color: active ? '#fff' : 'var(--muted)',
    fontWeight: active ? 800 : 600,
    fontSize: '.95rem',
    transition: 'all .15s',
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button type="button" style={tabStyle(view === 'login')} onClick={() => setView('login')}>
          ورود به حساب
        </button>
        <button type="button" style={tabStyle(view === 'signup')} onClick={() => setView('signup')}>
          ساخت حساب کاربری
        </button>
      </div>

      {view === 'login' ? <AuthForm /> : <SignupWizard />}

      <p className="form-hint" style={{ textAlign: 'center', marginTop: 14 }}>
        {view === 'login' ? (
          <>حساب ندارید؟{' '}
            <button type="button" onClick={() => setView('signup')}
              style={{ background: 'none', border: 'none', color: 'var(--dark)', fontWeight: 800, cursor: 'pointer', font: 'inherit' }}>
              ساخت حساب کاربری
            </button>
          </>
        ) : (
          <>قبلاً ثبت‌نام کرده‌اید؟{' '}
            <button type="button" onClick={() => setView('login')}
              style={{ background: 'none', border: 'none', color: 'var(--dark)', fontWeight: 800, cursor: 'pointer', font: 'inherit' }}>
              ورود به حساب
            </button>
          </>
        )}
      </p>
    </div>
  );
}
