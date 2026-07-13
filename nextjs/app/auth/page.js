'use client';
import { useState } from 'react';
import PageLayout from '@/components/PageLayout';

export default function AuthPage() {
  const [otpSent, setOtpSent] = useState(false);
  return (
    <PageLayout>
      <div className="auth-wrap">
        <div className="auth-visual"><div style={{ color: '#fff', textAlign: 'center', position: 'relative' }}><h1 className="heading" style={{ color: '#fff' }}>خانواده برداشت</h1><p style={{ color: 'rgba(255,255,255,.55)' }}>ورود هنرجویان</p></div></div>
        <div className="auth-form-wrap">
          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setOtpSent(true); }}>
            <span className="tag tag--gold">ورود</span>
            <h1 className="heading" style={{ margin: '16px 0 10px' }}>ورود به حساب</h1>
            <p style={{ color: 'var(--muted)', marginBottom: 28 }}>شماره موبایل خود را وارد کنید.</p>
            {otpSent && <div className="alert alert--info">کد تأیید آزمایشی: 1234</div>}
            <div className="form-group"><label className="form-label">شماره موبایل</label><input className="form-input" dir="ltr" type="tel" required /></div>
            {otpSent && <div className="otp-wrap">{[0,1,2,3].map(i => <input key={i} className="otp-input" maxLength="1" />)}</div>}
            <button className="btn btn--dark btn--full">{otpSent ? 'ورود' : 'دریافت کد'}</button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
