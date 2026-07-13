'use client';
import { useMemo, useState } from 'react';
import PageLayout from '@/components/PageLayout';

const questions = [
  ['وقتی متن جدیدی می‌خوانید، بیشتر به چه چیزی توجه می‌کنید؟', ['احساس شخصیت', 'ریتم و بیان', 'تصویرسازی صحنه', 'کنش و حرکت']],
  ['در کار گروهی معمولاً چه نقشی دارید؟', ['هماهنگ‌کننده', 'ایده‌پرداز', 'اجراکننده', 'مشاهده‌گر دقیق']],
  ['بیشتر دوست دارید کدام نقش را بازی کنید؟', ['درام جدی', 'کمدی', 'اکشن/حرکتی', 'نقش‌های پیچیده']],
  ['نقطه قوت شما چیست؟', ['احساس', 'بیان', 'بدن', 'تمرکز']],
];

export default function AuditionPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState({});
  const completed = Object.keys(answers).length === questions.length;
  const result = useMemo(() => ['بازیگر احساسی', 'بازیگر بیانی', 'بازیگر فیزیکی', 'بازیگر تحلیلی'][Object.values(answers).reduce((a,b)=>a+b,0) % 4 || 0], [answers]);

  return (
    <PageLayout>
      <section style={{ background: 'var(--surface)', paddingTop: 40 }}>
        <div className="container--sm">
          <div style={{ textAlign: 'center', marginBottom: 32 }}><span className="tag tag--gold">تست آنلاین</span><h1 className="heading" style={{ marginTop: 12 }}>تست آنلاین بازیگری</h1><p style={{ color: 'var(--muted)' }}>چند سؤال کوتاه برای شناخت مسیر مناسب شما</p></div>
          {step === 0 && <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: 28 }}><div className="form-group"><label className="form-label">نام شما</label><input className="form-input" value={name} onChange={e=>setName(e.target.value)} /></div><button className="btn btn--dark btn--full" onClick={()=>name.trim() && setStep(1)}>شروع تست</button></div>}
          {step === 1 && <div>{questions.map((q, qi) => <div key={q[0]} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 22, marginBottom: 12 }}><div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '.8rem', marginBottom: 8 }}>سؤال {qi+1}</div><h3 style={{ fontSize: '1rem', marginBottom: 16 }}>{q[0]}</h3><div style={{ display: 'grid', gap: 8 }}>{q[1].map((o, oi)=><button key={o} type="button" onClick={()=>setAnswers({...answers,[qi]:oi})} style={{ fontFamily: 'inherit', textAlign: 'right', padding: '12px 14px', borderRadius: 10, border: answers[qi]===oi ? '1.5px solid var(--gold)' : '1.5px solid var(--border)', background: answers[qi]===oi ? '#FFFBF0' : '#fff', cursor: 'pointer' }}>{o}</button>)}</div></div>)}<button className="btn btn--dark btn--full" disabled={!completed} onClick={()=>setStep(2)}>مشاهده نتیجه</button></div>}
          {step === 2 && <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#2d2d2d)', borderRadius: 20, padding: 40, textAlign: 'center', color: '#fff' }}><div style={{ fontSize: '4rem' }}>🎬</div><div style={{ color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>تیپ بازیگری شما</div><h2 style={{ color: 'var(--gold)', fontSize: '2rem', margin: '10px 0' }}>{result}</h2><p style={{ color: 'rgba(255,255,255,.7)', lineHeight: 1.9, marginBottom: 24 }}>{name} عزیز، این نتیجه اولیه است و در کلاس‌ها مسیر دقیق‌تر شما مشخص می‌شود.</p><a className="btn btn--gold" href="tel:02191090934">تماس برای ادامه مسیر</a></div>}
        </div>
      </section>
    </PageLayout>
  );
}
