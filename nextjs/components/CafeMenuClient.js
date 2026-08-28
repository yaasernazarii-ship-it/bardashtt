'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import MenuIcon, { iconKeyOf } from './menuIcons';

const CART_KEY = 'bardasht-cafe-cart-v1';
const fa = (value) => Number(value || 0).toLocaleString('fa-IR');
const toLatin = (value) => String(value || '').replace(/[۰-۹٠-٩]/g, (ch) => {
  const code = ch.charCodeAt(0);
  return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
});

const icons = {
  search: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  leaf: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20c0-8 5-13 16-14 0 11-5 15-11 15-2.5 0-5-.4-5-1zM9 15c1.5-3 4-5 7-6.5" /></svg>,
  lock: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>,
  home: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /></svg>,
  list: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
  bag: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" /></svg>,
  info: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></svg>,
  close: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>,
  check: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" /></svg>,
};

function Stepper({ quantity, onAdd, onRemove, name }) {
  return <div className="dish__stepper">
    <button type="button" aria-label={`افزودن یکی به ${name}`} onClick={onAdd}>+</button>
    <b>{fa(quantity)}</b>
    <button type="button" aria-label={`کم کردن یکی از ${name}`} onClick={onRemove}>−</button>
  </div>;
}

export default function CafeMenuClient({ categories, settings, serviceFee, slug }) {
  const [cart, setCart] = useState({});
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sheet, setSheet] = useState(null); // cart | info | done
  const [step, setStep] = useState('list'); // list | form
  const [form, setForm] = useState({ customer: '', place: '', phone: '', note: '' });
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const listRef = useRef(null);

  const itemsById = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => category.items.forEach((item) => map.set(item.id, item)));
    return map;
  }, [categories]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(CART_KEY) || '{}');
      const clean = {};
      Object.entries(saved).forEach(([id, quantity]) => {
        const item = itemsById.get(id);
        if (item && item.available && Number.isInteger(quantity) && quantity > 0) clean[id] = Math.min(quantity, 20);
      });
      setCart(clean);
    } catch { /* سبد خراب نادیده گرفته می‌شود */ }
    setReady(true);
  }, [itemsById]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, ready]);

  useEffect(() => {
    document.body.style.overflow = sheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheet]);

  useEffect(() => {
    if (!sheet) return undefined;
    const close = (event) => event.key === 'Escape' && setSheet(null);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [sheet]);

  const addToCart = (id) => setCart((current) => ({ ...current, [id]: Math.min((current[id] || 0) + 1, 20) }));
  const removeFromCart = (id) => setCart((current) => {
    const next = { ...current };
    if ((next[id] || 0) <= 1) delete next[id]; else next[id] -= 1;
    return next;
  });
  const dropFromCart = (id) => setCart((current) => { const next = { ...current }; delete next[id]; return next; });

  const lines = useMemo(() => Object.entries(cart)
    .map(([id, quantity]) => ({ item: itemsById.get(id), quantity }))
    .filter((line) => line.item), [cart, itemsById]);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const total = subtotal + (subtotal > 0 ? serviceFee : 0);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return categories
      .filter((category) => activeCategory === 'all' || category.id === activeCategory)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => !needle || item.name.toLowerCase().includes(needle) || (item.description || '').toLowerCase().includes(needle)),
      }))
      .filter((category) => category.kind === 'image' ? !needle : category.items.length > 0);
  }, [categories, activeCategory, query]);

  const goToList = () => { setActiveCategory('all'); listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const openCart = () => { setStep('list'); setFormError(''); setSheet('cart'); };

  const submitOrder = async (event) => {
    event.preventDefault();
    const customer = form.customer.trim();
    const place = form.place.trim();
    const phone = toLatin(form.phone).replace(/\D/g, '');
    if (customer.length < 2) { setFormError('نام خود را وارد کنید.'); return; }
    if (!place) { setFormError('شماره میز یا محل تحویل را وارد کنید.'); return; }
    if (phone && !/^09\d{9}$/.test(phone)) { setFormError('شماره تماس باید ۱۱ رقم و با ۰۹ شروع شود.'); return; }
    if (!lines.length) { setFormError('سبد خرید خالی است.'); return; }

    setSending(true); setFormError('');
    try {
      const response = await fetch('/api/menu/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, customer, place, phone, note: form.note.trim(), items: lines.map((line) => ({ id: line.item.id, quantity: line.quantity })) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setFormError(data.error || 'ثبت سفارش انجام نشد.'); return; }
      setReceipt({ code: data.code, total: data.total, place });
      setCart({});
      setForm({ customer: '', place: '', phone: '', note: '' });
      setStep('list');
      setSheet('done');
    } catch { setFormError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.'); }
    finally { setSending(false); }
  };

  return <div className="cafe">
    <header className="cafe__top">
      <div className="cafe__brand"><b>برداشت</b><small>کافه کتاب</small></div>
      <a className="cafe__private" href="/cafe-admin">{icons.lock}<span>مدیریت</span></a>
    </header>

    <section className="cafe__hero">
      {settings.heroImage && <img className="cafe__hero-photo" src={settings.heroImage} alt="" />}
      <div className="cafe__hero-body">
        <h1>{settings.heroTitle}</h1>
        <p>{settings.heroTagline}</p>
        <span className="cafe__ornament" aria-hidden="true">◦ ◈ ◦</span>
      </div>
    </section>

    <nav className="cafe__chips" aria-label="دسته‌بندی منو">
      <button type="button" className={activeCategory === 'all' ? 'is-active' : ''} onClick={() => setActiveCategory('all')}>
        <span className="cafe__chip-mark"><MenuIcon name="grid" /></span>همه
      </button>
      {categories.map((category) => <button key={category.id} type="button" className={activeCategory === category.id ? 'is-active' : ''} onClick={() => setActiveCategory(category.id)}>
        <span className="cafe__chip-mark"><MenuIcon name={iconKeyOf(category)} /></span>{category.name}
      </button>)}
    </nav>

    <div className="cafe__search">
      {icons.search}
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جست‌وجو در منو…" aria-label="جست‌وجو در منو" />
      {query && <button type="button" aria-label="پاک کردن جست‌وجو" onClick={() => setQuery('')}>{icons.close}</button>}
    </div>

    {settings.note && <p className="cafe__note">{icons.leaf}<span>{settings.note}</span></p>}

    <div className="cafe__list" ref={listRef}>
      {visible.length === 0 && <p className="cafe__empty">موردی با این جست‌وجو پیدا نشد.</p>}
      {visible.map((category) => <section className="cafe__section" key={category.id}>
        <div className="cafe__section-head">
          <h2>{category.name}</h2>
          {activeCategory === 'all' && category.kind !== 'image' && <button type="button" onClick={() => setActiveCategory(category.id)}>مشاهده همه</button>}
        </div>
        {category.kind === 'image' ? <div className="cafe__feature">
          {category.imageUrl && <img src={category.imageUrl} alt={category.name} loading="lazy" />}
          {category.description && <p>{category.description}</p>}
        </div> : <div className="cafe__dishes">{category.items.map((item) => <article className={`dish ${item.available ? '' : 'is-out'}`} key={item.id}>
          <div className="dish__photo">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" /> : <MenuIcon name={iconKeyOf(category)} />}</div>
          <div className="dish__body">
            <h3>{item.name}</h3>
            {item.description && <p>{item.description}</p>}
            <span className="dish__price">{fa(item.price)} <small>تومان</small></span>
          </div>
          {!item.available ? <span className="dish__out">ناموجود</span>
            : cart[item.id] ? <Stepper quantity={cart[item.id]} name={item.name} onAdd={() => addToCart(item.id)} onRemove={() => removeFromCart(item.id)} />
              : <button type="button" className="dish__add" aria-label={`افزودن ${item.name} به سبد خرید`} onClick={() => addToCart(item.id)}>+</button>}
        </article>)}</div>}
      </section>)}
    </div>

    <footer className="cafe__footer">{settings.footer.split('\n').map((line, index) => <span key={index}>{line}</span>)}</footer>

    {count > 0 && <button type="button" className="cafe__cartbar" onClick={openCart}>
      <span className="cafe__cartbar-count">{fa(count)}</span>
      <span>مشاهده سبد خرید</span>
      <b>{fa(total)} تومان</b>
    </button>}

    <nav className="cafe__tabs" aria-label="ناوبری منو">
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{icons.home}<span>خانه</span></button>
      <button type="button" onClick={goToList}>{icons.list}<span>منو</span></button>
      <button type="button" className={count ? 'has-badge' : ''} onClick={openCart}>{icons.bag}<span>سبد خرید</span>{count > 0 && <i>{fa(count)}</i>}</button>
      <button type="button" onClick={() => setSheet('info')}>{icons.info}<span>اطلاعات</span></button>
    </nav>

    {sheet && <div className="cafe__sheet" role="dialog" aria-modal="true" aria-label={sheet === 'cart' ? 'سبد خرید' : sheet === 'info' ? 'اطلاعات کافه' : 'سفارش ثبت شد'} onMouseDown={(event) => event.target === event.currentTarget && setSheet(null)}>
      <div className="cafe__sheet-body">
        <div className="cafe__sheet-head">
          <h2>{sheet === 'cart' ? (step === 'form' ? 'ثبت سفارش' : 'سبد خرید') : sheet === 'info' ? 'اطلاعات کافه' : 'سفارش شما ثبت شد'}</h2>
          <button type="button" aria-label="بستن" onClick={() => setSheet(null)}>{icons.close}</button>
        </div>

        {sheet === 'info' && <div className="cafe__info">
          <p>{settings.info}</p>
          <p className="cafe__info-sign">{settings.footer.split('\n')[0]}</p>
        </div>}

        {sheet === 'done' && <div className="cafe__done">
          <span className="cafe__done-mark">{icons.check}</span>
          <p>سفارش شما با موفقیت ثبت شد و برای کافه ارسال شد.</p>
          <div className="cafe__done-code"><span>کد پیگیری</span><b>{receipt?.code}</b></div>
          <div className="cafe__done-code"><span>مبلغ نهایی</span><b>{fa(receipt?.total)} تومان</b></div>
          <button type="button" className="cafe__submit" onClick={() => setSheet(null)}>بازگشت به منو</button>
        </div>}

        {sheet === 'cart' && step === 'list' && <>
          {lines.length === 0 ? <p className="cafe__empty">سبد خرید شما خالی است.</p> : <>
            <div className="cafe__cart-lines">{lines.map(({ item, quantity }) => <div className="cart-line" key={item.id}>
              <div className="cart-line__photo">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" /> : <MenuIcon name="special" />}</div>
              <div className="cart-line__body">
                <h3>{item.name}</h3>
                <span>{fa(item.price)} تومان</span>
              </div>
              <Stepper quantity={quantity} name={item.name} onAdd={() => addToCart(item.id)} onRemove={() => removeFromCart(item.id)} />
              <button type="button" className="cart-line__drop" aria-label={`حذف ${item.name} از سبد`} onClick={() => dropFromCart(item.id)}>{icons.close}</button>
            </div>)}</div>
            <div className="cafe__summary">
              <div><span>جمع کل</span><b>{fa(subtotal)} تومان</b></div>
              <div><span>هزینهٔ سرویس</span><b>{serviceFee > 0 ? `${fa(serviceFee)} تومان` : 'رایگان'}</b></div>
              <div className="is-total"><span>مبلغ نهایی</span><b>{fa(total)} تومان</b></div>
            </div>
            <button type="button" className="cafe__submit" onClick={() => { setFormError(''); setStep('form'); }}>ثبت سفارش</button>
          </>}
        </>}

        {sheet === 'cart' && step === 'form' && <form className="cafe__form" onSubmit={submitOrder}>
          <label>نام شما<input value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} autoComplete="name" required /></label>
          <label>شماره میز یا محل تحویل<input value={form.place} onChange={(event) => setForm({ ...form, place: event.target.value })} placeholder="مثلاً میز ۵" required /></label>
          <label>شماره تماس (اختیاری)<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} inputMode="numeric" autoComplete="tel" placeholder="۰۹…" /></label>
          <label>یادداشت سفارش<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="مثلاً بدون شکر" /></label>
          <div className="cafe__summary"><div className="is-total"><span>مبلغ نهایی</span><b>{fa(total)} تومان</b></div></div>
          {formError && <p className="cafe__error" role="alert">{formError}</p>}
          <div className="cafe__form-actions">
            <button type="button" className="cafe__back" onClick={() => setStep('list')} disabled={sending}>بازگشت</button>
            <button type="submit" className="cafe__submit" disabled={sending}>{sending ? 'در حال ثبت…' : 'تأیید سفارش'}</button>
          </div>
        </form>}
      </div>
    </div>}
  </div>;
}
