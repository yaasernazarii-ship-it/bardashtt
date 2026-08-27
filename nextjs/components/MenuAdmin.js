'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import MenuIcon, { MENU_ICONS, MENU_ICON_KEYS, iconKeyOf } from './menuIcons';

const ORDER_STATUS = { new: 'جدید', preparing: 'در حال آماده‌سازی', done: 'تحویل شد', cancelled: 'لغو شد' };

const today = () => new Date().toISOString().slice(0, 10);
async function api(url, options) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'خطایی رخ داد.');
  return data;
}

const icons = {
  menu: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>,
  wallet: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13v2M16 12h5" /></svg>,
  bag: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" /></svg>,
  settings: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></svg>,
  grip: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="6" r="1" /><circle cx="16" cy="6" r="1" /><circle cx="8" cy="12" r="1" /><circle cx="16" cy="12" r="1" /><circle cx="8" cy="18" r="1" /><circle cx="16" cy="18" r="1" /></svg>,
};

function ImageUpload({ imageUrl, label, onSelect, onRemove, compact = false }) {
  const [preview, setPreview] = useState(imageUrl || '');
  const [busy, setBusy] = useState(false);
  useEffect(() => setPreview(imageUrl || ''), [imageUrl]);
  const choose = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl); setBusy(true);
    try { await onSelect(file); } finally { setBusy(false); URL.revokeObjectURL(localUrl); }
  };
  return <div className={`image-upload ${compact ? 'image-upload--compact' : ''}`}>
    <div className="image-upload__preview">{preview ? <img src={preview} alt={`پیش‌نمایش ${label}`} /> : <span>بدون تصویر</span>}</div>
    <div className="image-upload__actions"><label className="button button--secondary"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={choose} disabled={busy} /><span>{busy ? 'در حال آپلود…' : preview ? 'تعویض تصویر' : 'انتخاب تصویر'}</span></label>{preview && <button type="button" className="image-upload__remove" onClick={onRemove}>حذف تصویر</button>}</div>
  </div>;
}

export default function MenuAdmin({ publicSlug, canSignOut = false }) {
  const [data, setData] = useState({ categories: [], expenses: [], sales: [], orders: [], settings: {} });
  const [settingsForm, setSettingsForm] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [message, setMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [dragging, setDragging] = useState(null);
  const dragRef = useRef(null);
  const load = () => api('/api/admin/menu').then((result) => {
    setData(result);
    setSettingsForm((current) => current || result.settings);
  }).catch((error) => setMessage(error.message));
  useEffect(load, []);
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    if (!confirmDialog) return undefined;
    const close = (event) => event.key === 'Escape' && setConfirmDialog(null);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [confirmDialog]);
  const totals = useMemo(() => ({
    sales: data.sales.reduce((sum, row) => sum + row.amount, 0),
    expenses: data.expenses.reduce((sum, row) => sum + row.amount, 0),
  }), [data]);
  const newOrders = data.orders.filter((order) => order.status === 'new').length;
  const add = async (body) => {
    try { await api('/api/admin/menu', { method: 'POST', body: JSON.stringify(body) }); setMessage('تغییرات با موفقیت ذخیره شد.'); load(); }
    catch (error) { setMessage(error.message); }
  };
  const update = async (id, type, body) => { try { await api(`/api/admin/menu/${id}`, { method: 'PATCH', body: JSON.stringify({ type, ...body }) }); load(); } catch (error) { setMessage(error.message); } };
  const signOut = async () => { await fetch('/api/cafe-admin/session', { method: 'DELETE' }); window.location.reload(); };
  const askConfirmation = (title, description, action) => setConfirmDialog({ title, description, action });
  const remove = (id, type, label = 'این مورد') => askConfirmation(`حذف ${label}`, 'این عملیات قابل بازگشت نیست و اطلاعات مرتبط برای همیشه حذف می‌شود.', async () => { await api(`/api/admin/menu/${id}`, { method: 'DELETE', body: JSON.stringify({ type }) }); setMessage(`${label} حذف شد.`); load(); });
  const removeImage = (id, type, label) => askConfirmation(`حذف تصویر ${label}`, 'تصویر از منو برداشته شود؟ خود فایل ممکن است برای سوابق روی سرور باقی بماند.', async () => { await api(`/api/admin/menu/${id}`, { method: 'PATCH', body: JSON.stringify({ type, imageUrl: null }) }); setMessage('تصویر از منو حذف شد.'); load(); });
  const uploadFile = async (file) => { const form = new FormData(); form.append('file', file); const result = await api('/api/upload', { method: 'POST', headers: {}, body: form }); return result.url; };
  const upload = async (file, id, type) => { try { const imageUrl = await uploadFile(file); await api(`/api/admin/menu/${id}`, { method: 'PATCH', body: JSON.stringify({ type, imageUrl }) }); setMessage('تصویر ذخیره شد.'); load(); } catch (error) { setMessage(error.message); } };
  const saveSettings = async (patch) => { try { await api('/api/admin/menu', { method: 'PUT', body: JSON.stringify(patch) }); setSettingsForm((current) => ({ ...current, ...patch })); setMessage('تنظیمات منو ذخیره شد.'); load(); } catch (error) { setMessage(error.message); } };
  const uploadHero = async (file) => { try { await saveSettings({ heroImage: await uploadFile(file) }); } catch (error) { setMessage(error.message); } };
  const updateOrder = async (id, status) => { try { await api(`/api/admin/menu/${id}`, { method: 'PATCH', body: JSON.stringify({ type: 'order', status }) }); setMessage('وضعیت سفارش به‌روز شد.'); load(); } catch (error) { setMessage(error.message); } };
  const persistOrder = async (type, ids, categoryId) => {
    try { await api('/api/admin/menu', { method: 'PATCH', body: JSON.stringify({ type, ids, categoryId }) }); setMessage('ترتیب جدید ذخیره شد.'); }
    catch (error) { setMessage(error.message); load(); }
  };
  const moveInList = (list, fromId, toId) => {
    const from = list.findIndex((row) => row.id === fromId);
    const to = list.findIndex((row) => row.id === toId);
    if (from < 0 || to < 0 || from === to) return list;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next.map((row, sortOrder) => ({ ...row, sortOrder }));
  };
  const startDrag = (type, id, categoryId, event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { type, id, categoryId, changed: false, ids: [] };
    setDragging({ type, id });
  };
  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(`[data-drag-type="${drag.type}"]`);
    const targetId = target?.dataset.dragId;
    if (!targetId || targetId === drag.id || (drag.type === 'item' && target.dataset.categoryId !== drag.categoryId)) return;
    setData((current) => {
      if (drag.type === 'category') {
        const categories = moveInList(current.categories, drag.id, targetId);
        drag.ids = categories.map((row) => row.id);
        drag.changed = true;
        return { ...current, categories };
      }
      const categories = current.categories.map((category) => category.id === drag.categoryId ? { ...category, items: moveInList(category.items, drag.id, targetId) } : category);
      drag.ids = categories.find((category) => category.id === drag.categoryId).items.map((row) => row.id);
      drag.changed = true;
      return { ...current, categories };
    });
  };
  const endDrag = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragging(null);
    if (drag?.changed) persistOrder(drag.type === 'category' ? 'categories' : 'items', drag.ids, drag.categoryId);
  };
  const moveByButton = (type, id, categoryId, direction) => {
    const source = type === 'category' ? data.categories : data.categories.find((category) => category.id === categoryId)?.items || [];
    const index = source.findIndex((row) => row.id === id);
    const target = source[index + direction];
    if (!target) return;
    const ordered = moveInList(source, id, target.id);
    if (type === 'category') setData((current) => ({ ...current, categories: ordered }));
    else setData((current) => ({ ...current, categories: current.categories.map((category) => category.id === categoryId ? { ...category, items: ordered } : category) }));
    persistOrder(type === 'category' ? 'categories' : 'items', ordered.map((row) => row.id), categoryId);
  };

  return <div className="menu-admin">
    <header className="menu-admin__header">
      <div className="menu-admin__brand"><span className="menu-admin__brand-mark">ک</span><span><b>کافه کتاب</b><small>پنل مدیریت منو</small></span></div>
      <nav aria-label="دسترسی‌های منو"><a className="menu-admin__preview" href={`/menu/${publicSlug}`} target="_blank" rel="noreferrer">مشاهده منو</a>{canSignOut && <button type="button" className="menu-admin__signout" onClick={signOut}>خروج</button>}</nav>
    </header>

    <section className="menu-admin__intro"><div><span className="menu-admin__eyebrow">پنل مدیریت</span><h1>منوی کافه کتاب</h1><p>دسته‌ها، آیتم‌ها و گزارش مالی کافه را از یک فضای منظم مدیریت کنید.</p></div><div className="menu-admin__status"><span /> منوی عمومی فعال است</div></section>

    <div className="menu-admin__tabs" role="tablist" aria-label="بخش‌های مدیریت منو">
      {[['menu', 'دسته‌بندی و آیتم‌ها', icons.menu], ['orders', 'سفارش‌ها', icons.bag], ['accounting', 'حسابداری', icons.wallet], ['settings', 'تنظیمات کلی منو', icons.settings]].map(([id, label, icon]) => <button key={id} role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'is-active' : ''} onClick={() => setActiveTab(id)}>{icon}<span>{label}</span>{id === 'orders' && newOrders > 0 && <i className="menu-admin__badge">{newOrders.toLocaleString('fa-IR')}</i>}</button>)}
    </div>

    {message && <div className="menu-toast" role="status" aria-live="polite"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg></span>{message}<button aria-label="بستن پیام" onClick={() => setMessage('')}>×</button></div>}

    {activeTab === 'menu' && <section className="menu-admin__panel" role="tabpanel">
      <div className="menu-admin__section-head"><div><h2>دسته‌بندی‌ها و آیتم‌ها</h2><p>{data.categories.length.toLocaleString('fa-IR')} دسته در منوی کافه</p></div></div>
      <form className="menu-admin__create" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); add({ type: 'category', name: form.get('name'), kind: form.get('kind') }); event.currentTarget.reset(); }}>
        <label><span>نام دسته جدید</span><input name="name" placeholder="مثلاً نوشیدنی‌های ویژه" required /></label>
        <label><span>نوع نمایش</span><select name="kind"><option value="items">لیست آیتم‌ها</option><option value="image">تصویر تبلیغاتی</option></select></label>
        <button className="button button--primary">افزودن دسته</button>
      </form>
      <div className="menu-admin__category-grid">{data.categories.map((category) => <article className={`menu-category ${dragging?.type === 'category' && dragging.id === category.id ? 'is-dragging' : ''}`} key={category.id} data-drag-type="category" data-drag-id={category.id}>
        <div className="menu-category__head"><div className="menu-category__identity"><button className="drag-handle" aria-label={`جابه‌جایی دسته ${category.name}`} title="برای جابه‌جایی بکشید" onPointerDown={(event) => startDrag('category', category.id, null, event)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>{icons.grip}</button><span className="menu-category__number">{(category.sortOrder + 1).toLocaleString('fa-IR')}</span><div><h3>{category.name}</h3><small>{category.kind === 'image' ? 'بخش تصویری' : `${category.items.length.toLocaleString('fa-IR')} آیتم`}</small></div></div><span className={`menu-category__state ${category.active ? 'is-active' : ''}`}>{category.active ? 'فعال' : 'غیرفعال'}</span></div>
        <div className="menu-category__controls">
          <label><span>نام دسته</span><input value={category.name} onChange={(event) => update(category.id, 'category', { name: event.target.value })} /></label>
          <label><span>نوع</span><select value={category.kind} onChange={(event) => update(category.id, 'category', { kind: event.target.value })}><option value="items">لیست آیتم‌ها</option><option value="image">تصویر تبلیغاتی</option></select></label>
          <label className="menu-category__icon"><span>آیکن دسته</span><i><MenuIcon name={iconKeyOf(category)} /></i><select value={iconKeyOf(category)} onChange={(event) => update(category.id, 'category', { icon: event.target.value })}>{MENU_ICON_KEYS.map((key) => <option key={key} value={key}>{MENU_ICONS[key].label}</option>)}</select></label>
          <label className="menu-switch"><input type="checkbox" checked={category.active} onChange={(event) => update(category.id, 'category', { active: event.target.checked })} /><span /> نمایش در منو</label>
        </div>
        {category.kind === 'image' ? <div className="menu-category__feature"><label><span>توضیح کوتاه</span><input value={category.description || ''} onChange={(event) => update(category.id, 'category', { description: event.target.value })} placeholder="متن زیر تصویر" /></label><ImageUpload imageUrl={category.imageUrl} label={category.name} onSelect={(file) => upload(file, category.id, 'category')} onRemove={() => removeImage(category.id, 'category', category.name)} /></div> : <div className="menu-category__items">
          {category.items.length === 0 && <div className="menu-empty">هنوز آیتمی در این دسته ثبت نشده است.</div>}
          {category.items.map((item) => <div className={`menu-item-edit ${dragging?.type === 'item' && dragging.id === item.id ? 'is-dragging' : ''}`} key={item.id} data-drag-type="item" data-drag-id={item.id} data-category-id={category.id}><button className="drag-handle" aria-label={`جابه‌جایی آیتم ${item.name}`} title="برای جابه‌جایی بکشید" onPointerDown={(event) => startDrag('item', item.id, category.id, event)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>{icons.grip}</button><ImageUpload compact imageUrl={item.imageUrl} label={item.name} onSelect={(file) => upload(file, item.id, 'item')} onRemove={() => removeImage(item.id, 'item', item.name)} /><label className="menu-item-edit__name"><span>نام آیتم</span><input value={item.name} onChange={(event) => update(item.id, 'item', { name: event.target.value })} /></label><label className="menu-item-edit__desc"><span>توضیح کوتاه</span><input value={item.description || ''} placeholder="مثلاً اسپرسو، شیر گرم" onChange={(event) => update(item.id, 'item', { description: event.target.value })} /></label><label><span>قیمت (تومان)</span><input type="number" inputMode="numeric" min="0" value={item.price} onChange={(event) => update(item.id, 'item', { price: event.target.value })} /></label><label className="menu-switch"><input type="checkbox" checked={item.available} onChange={(event) => update(item.id, 'item', { available: event.target.checked })} /><span /> موجود</label><div className="order-buttons"><button aria-label="انتقال به بالا" onClick={() => moveByButton('item', item.id, category.id, -1)}>↑</button><button aria-label="انتقال به پایین" onClick={() => moveByButton('item', item.id, category.id, 1)}>↓</button></div><button className="button button--danger button--icon" aria-label={`حذف ${item.name}`} onClick={() => remove(item.id, 'item', `آیتم «${item.name}»`)}>×</button></div>)}
          <form className="menu-category__add-item" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); add({ type: 'item', categoryId: category.id, name: form.get('name'), price: form.get('price') }); event.currentTarget.reset(); }}><label><span>نام آیتم</span><input name="name" required /></label><label><span>قیمت (تومان)</span><input name="price" type="number" inputMode="numeric" min="0" required /></label><button className="button button--secondary">افزودن آیتم</button></form>
        </div>}
        <footer className="menu-category__footer"><div className="order-buttons"><button aria-label="انتقال دسته به بالا" onClick={() => moveByButton('category', category.id, null, -1)}>↑</button><button aria-label="انتقال دسته به پایین" onClick={() => moveByButton('category', category.id, null, 1)}>↓</button></div><button className="button button--danger" onClick={() => remove(category.id, 'category', `دسته «${category.name}»`)}>حذف دسته</button></footer>
      </article>)}</div>
    </section>}

    {activeTab === 'orders' && <section className="menu-admin__panel" role="tabpanel">
      <div className="menu-admin__section-head"><div><h2>سفارش‌های مشتری</h2><p>{data.orders.length ? `${data.orders.length.toLocaleString('fa-IR')} سفارش اخیر، ${newOrders.toLocaleString('fa-IR')} سفارش جدید` : 'هنوز سفارشی از منوی دیجیتال ثبت نشده است'}</p></div><button className="button button--secondary" onClick={load}>به‌روزرسانی</button></div>
      {data.orders.length === 0 ? <div className="menu-empty">سفارش‌های ثبت‌شده از منوی عمومی اینجا نمایش داده می‌شوند.</div> : <div className="menu-orders">{data.orders.map((order) => <article className={`menu-order is-${order.status}`} key={order.id}>
        <header>
          <div><b>کد {order.code}</b><small>{new Date(order.createdAt).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}</small></div>
          <span className="menu-order__state">{ORDER_STATUS[order.status] || order.status}</span>
        </header>
        <div className="menu-order__who"><span>{order.customer}</span><span>{order.place}</span>{order.phone && <a href={`tel:${order.phone}`}>{order.phone}</a>}</div>
        <ul className="menu-order__lines">{order.lines.map((line) => <li key={line.id}><span>{line.name}</span><b>{line.quantity.toLocaleString('fa-IR')} ×</b><small>{(line.price * line.quantity).toLocaleString('fa-IR')} تومان</small></li>)}</ul>
        {order.note && <p className="menu-order__note">یادداشت: {order.note}</p>}
        <footer>
          <b>{order.total.toLocaleString('fa-IR')} تومان</b>
          <div className="menu-order__actions">
            {order.status === 'new' && <button className="button button--secondary" onClick={() => updateOrder(order.id, 'preparing')}>در حال آماده‌سازی</button>}
            {order.status !== 'done' && <button className="button button--primary" onClick={() => updateOrder(order.id, 'done')}>تحویل شد</button>}
            {order.status !== 'cancelled' && order.status !== 'done' && <button className="button button--danger" onClick={() => updateOrder(order.id, 'cancelled')}>لغو</button>}
            <button className="button button--danger button--icon" aria-label={`حذف سفارش ${order.code}`} onClick={() => remove(order.id, 'order', `سفارش ${order.code}`)}>×</button>
          </div>
        </footer>
      </article>)}</div>}
    </section>}

    {activeTab === 'accounting' && <section className="menu-admin__panel" role="tabpanel"><div className="menu-admin__section-head"><div><h2>حسابداری کافه</h2><p>خلاصهٔ فروش، هزینه و سود تقریبی ثبت‌شده</p></div></div><div className="menu-admin__stats"><div><span>مجموع فروش</span><b>{totals.sales.toLocaleString('fa-IR')}</b><small>تومان</small></div><div><span>مجموع هزینه</span><b>{totals.expenses.toLocaleString('fa-IR')}</b><small>تومان</small></div><div className={totals.sales - totals.expenses < 0 ? 'is-negative' : 'is-positive'}><span>سود تقریبی</span><b>{(totals.sales - totals.expenses).toLocaleString('fa-IR')}</b><small>تومان</small></div></div><div className="menu-admin__forms"><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); add({ type: 'sale', amount: form.get('amount'), date: form.get('date'), note: form.get('note') }); event.currentTarget.reset(); }}><h3>ثبت فروش روزانه</h3><label><span>مبلغ فروش</span><input name="amount" type="number" inputMode="numeric" min="1" required /></label><label><span>تاریخ</span><input name="date" type="date" defaultValue={today()} required /></label><label><span>توضیح اختیاری</span><input name="note" /></label><button className="button button--primary">ثبت فروش</button></form><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); add({ type: 'expense', title: form.get('title'), amount: form.get('amount'), date: form.get('date') }); event.currentTarget.reset(); }}><h3>ثبت هزینه</h3><label><span>عنوان هزینه</span><input name="title" required /></label><label><span>مبلغ هزینه</span><input name="amount" type="number" inputMode="numeric" min="1" required /></label><label><span>تاریخ</span><input name="date" type="date" defaultValue={today()} required /></label><button className="button button--primary">ثبت هزینه</button></form></div></section>}

    {activeTab === 'settings' && <section className="menu-admin__panel" role="tabpanel">
      <div className="menu-admin__section-head"><div><h2>تنظیمات کلی منو</h2><p>متن‌ها، تصویر بالای منو و نشانی انتشار</p></div></div>
      {settingsForm && <form className="menu-admin__settings-form" onSubmit={(event) => { event.preventDefault(); saveSettings(settingsForm); }}>
        <div className="menu-admin__settings-grid">
          <label><span>عنوان بالای منو</span><input value={settingsForm.heroTitle} onChange={(event) => setSettingsForm({ ...settingsForm, heroTitle: event.target.value })} /></label>
          <label><span>شعار زیر عنوان</span><input value={settingsForm.heroTagline} onChange={(event) => setSettingsForm({ ...settingsForm, heroTagline: event.target.value })} /></label>
          <label><span>جملهٔ نوار سبز بالای منو</span><input value={settingsForm.note} onChange={(event) => setSettingsForm({ ...settingsForm, note: event.target.value })} /></label>
          <label><span>هزینهٔ سرویس هر سفارش (تومان)</span><input type="number" inputMode="numeric" min="0" value={settingsForm.serviceFee} onChange={(event) => setSettingsForm({ ...settingsForm, serviceFee: event.target.value })} /></label>
          <label><span>متن بخش اطلاعات</span><textarea rows="3" value={settingsForm.info} onChange={(event) => setSettingsForm({ ...settingsForm, info: event.target.value })} /></label>
          <label><span>متن پاورقی (هر خط جدا)</span><textarea rows="3" value={settingsForm.footer} onChange={(event) => setSettingsForm({ ...settingsForm, footer: event.target.value })} /></label>
        </div>
        <div className="menu-admin__hero-image">
          <span>تصویر بالای منو</span>
          <ImageUpload imageUrl={settingsForm.heroImage} label="بالای منو" onSelect={uploadHero} onRemove={() => saveSettings({ heroImage: '' })} />
        </div>
        <button className="button button--primary">ذخیره تنظیمات</button>
      </form>}
      <div className="menu-settings">
        <div><span>وضعیت انتشار</span><b className="menu-settings__online">فعال و قابل مشاهده</b></div>
        <div><span>نشانی منوی QR</span><code>/menu/{publicSlug}</code></div>
        <p>این نشانی در هدر، فوتر یا نقشهٔ سایت نمایش داده نمی‌شود و برای موتورهای جست‌وجو noindex است.</p>
      </div>
    </section>}

    {confirmDialog && <div className="menu-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setConfirmDialog(null)}><div className="menu-modal__dialog" role="alertdialog" aria-modal="true" aria-labelledby="menu-confirm-title" aria-describedby="menu-confirm-description"><div className="menu-modal__icon">!</div><h2 id="menu-confirm-title">{confirmDialog.title}</h2><p id="menu-confirm-description">{confirmDialog.description}</p><div className="menu-modal__actions"><button className="button button--secondary" autoFocus onClick={() => setConfirmDialog(null)}>انصراف</button><button className="button button--danger" onClick={async () => { const action = confirmDialog.action; setConfirmDialog(null); try { await action(); } catch (error) { setMessage(error.message); } }}>تأیید حذف</button></div></div></div>}
  </div>;
}
