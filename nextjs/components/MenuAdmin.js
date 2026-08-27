'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

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

export default function MenuAdmin({ publicSlug }) {
  const [data, setData] = useState({ categories: [], expenses: [], sales: [] });
  const [activeTab, setActiveTab] = useState('menu');
  const [message, setMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [dragging, setDragging] = useState(null);
  const dragRef = useRef(null);
  const load = () => api('/api/admin/menu').then(setData).catch((error) => setMessage(error.message));
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
  const add = async (body) => {
    try { await api('/api/admin/menu', { method: 'POST', body: JSON.stringify(body) }); setMessage('تغییرات با موفقیت ذخیره شد.'); load(); }
    catch (error) { setMessage(error.message); }
  };
  const update = async (id, type, body) => { try { await api(`/api/admin/menu/${id}`, { method: 'PATCH', body: JSON.stringify({ type, ...body }) }); load(); } catch (error) { setMessage(error.message); } };
  const askConfirmation = (title, description, action) => setConfirmDialog({ title, description, action });
  const remove = (id, type, label = 'این مورد') => askConfirmation(`حذف ${label}`, 'این عملیات قابل بازگشت نیست و اطلاعات مرتبط برای همیشه حذف می‌شود.', async () => { await api(`/api/admin/menu/${id}`, { method: 'DELETE', body: JSON.stringify({ type }) }); setMessage(`${label} حذف شد.`); load(); });
  const removeImage = (id, type, label) => askConfirmation(`حذف تصویر ${label}`, 'تصویر از منو برداشته شود؟ خود فایل ممکن است برای سوابق روی سرور باقی بماند.', async () => { await api(`/api/admin/menu/${id}`, { method: 'PATCH', body: JSON.stringify({ type, imageUrl: null }) }); setMessage('تصویر از منو حذف شد.'); load(); });
  const upload = async (file, id, type) => { try { const form = new FormData(); form.append('file', file); const result = await api('/api/upload', { method: 'POST', headers: {}, body: form }); await api(`/api/admin/menu/${id}`, { method: 'PATCH', body: JSON.stringify({ type, imageUrl: result.url }) }); setMessage('تصویر ذخیره شد.'); load(); } catch (error) { setMessage(error.message); } };
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
      <a className="menu-admin__brand" href="/dashboard"><span className="menu-admin__brand-mark">ب</span><span><b>خانواده برداشت</b><small>مدیریت کافه کتاب</small></span></a>
      <nav aria-label="دسترسی‌های مدیریت"><a href="/dashboard">داشبورد</a><a href="/dashboard/admin">کاربران</a><a className="menu-admin__preview" href={`/menu/${publicSlug}`} target="_blank" rel="noreferrer">مشاهده منو</a></nav>
    </header>

    <section className="menu-admin__intro"><div><span className="menu-admin__eyebrow">پنل مدیریت</span><h1>منوی کافه کتاب</h1><p>دسته‌ها، آیتم‌ها و گزارش مالی کافه را از یک فضای منظم مدیریت کنید.</p></div><div className="menu-admin__status"><span /> منوی عمومی فعال است</div></section>

    <div className="menu-admin__tabs" role="tablist" aria-label="بخش‌های مدیریت منو">
      {[['menu', 'دسته‌بندی و آیتم‌ها', icons.menu], ['accounting', 'حسابداری', icons.wallet], ['settings', 'تنظیمات کلی منو', icons.settings]].map(([id, label, icon]) => <button key={id} role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'is-active' : ''} onClick={() => setActiveTab(id)}>{icon}<span>{label}</span></button>)}
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
          <label className="menu-switch"><input type="checkbox" checked={category.active} onChange={(event) => update(category.id, 'category', { active: event.target.checked })} /><span /> نمایش در منو</label>
        </div>
        {category.kind === 'image' ? <div className="menu-category__feature"><label><span>توضیح کوتاه</span><input value={category.description || ''} onChange={(event) => update(category.id, 'category', { description: event.target.value })} placeholder="متن زیر تصویر" /></label><ImageUpload imageUrl={category.imageUrl} label={category.name} onSelect={(file) => upload(file, category.id, 'category')} onRemove={() => removeImage(category.id, 'category', category.name)} /></div> : <div className="menu-category__items">
          {category.items.length === 0 && <div className="menu-empty">هنوز آیتمی در این دسته ثبت نشده است.</div>}
          {category.items.map((item) => <div className={`menu-item-edit ${dragging?.type === 'item' && dragging.id === item.id ? 'is-dragging' : ''}`} key={item.id} data-drag-type="item" data-drag-id={item.id} data-category-id={category.id}><button className="drag-handle" aria-label={`جابه‌جایی آیتم ${item.name}`} title="برای جابه‌جایی بکشید" onPointerDown={(event) => startDrag('item', item.id, category.id, event)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>{icons.grip}</button><ImageUpload compact imageUrl={item.imageUrl} label={item.name} onSelect={(file) => upload(file, item.id, 'item')} onRemove={() => removeImage(item.id, 'item', item.name)} /><label className="menu-item-edit__name"><span>نام آیتم</span><input value={item.name} onChange={(event) => update(item.id, 'item', { name: event.target.value })} /></label><label><span>قیمت (تومان)</span><input type="number" inputMode="numeric" min="0" value={item.price} onChange={(event) => update(item.id, 'item', { price: event.target.value })} /></label><label className="menu-switch"><input type="checkbox" checked={item.available} onChange={(event) => update(item.id, 'item', { available: event.target.checked })} /><span /> موجود</label><div className="order-buttons"><button aria-label="انتقال به بالا" onClick={() => moveByButton('item', item.id, category.id, -1)}>↑</button><button aria-label="انتقال به پایین" onClick={() => moveByButton('item', item.id, category.id, 1)}>↓</button></div><button className="button button--danger button--icon" aria-label={`حذف ${item.name}`} onClick={() => remove(item.id, 'item', `آیتم «${item.name}»`)}>×</button></div>)}
          <form className="menu-category__add-item" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); add({ type: 'item', categoryId: category.id, name: form.get('name'), price: form.get('price') }); event.currentTarget.reset(); }}><label><span>نام آیتم</span><input name="name" required /></label><label><span>قیمت (تومان)</span><input name="price" type="number" inputMode="numeric" min="0" required /></label><button className="button button--secondary">افزودن آیتم</button></form>
        </div>}
        <footer className="menu-category__footer"><div className="order-buttons"><button aria-label="انتقال دسته به بالا" onClick={() => moveByButton('category', category.id, null, -1)}>↑</button><button aria-label="انتقال دسته به پایین" onClick={() => moveByButton('category', category.id, null, 1)}>↓</button></div><button className="button button--danger" onClick={() => remove(category.id, 'category', `دسته «${category.name}»`)}>حذف دسته</button></footer>
      </article>)}</div>
    </section>}

    {activeTab === 'accounting' && <section className="menu-admin__panel" role="tabpanel"><div className="menu-admin__section-head"><div><h2>حسابداری کافه</h2><p>خلاصهٔ فروش، هزینه و سود تقریبی ثبت‌شده</p></div></div><div className="menu-admin__stats"><div><span>مجموع فروش</span><b>{totals.sales.toLocaleString('fa-IR')}</b><small>تومان</small></div><div><span>مجموع هزینه</span><b>{totals.expenses.toLocaleString('fa-IR')}</b><small>تومان</small></div><div className={totals.sales - totals.expenses < 0 ? 'is-negative' : 'is-positive'}><span>سود تقریبی</span><b>{(totals.sales - totals.expenses).toLocaleString('fa-IR')}</b><small>تومان</small></div></div><div className="menu-admin__forms"><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); add({ type: 'sale', amount: form.get('amount'), date: form.get('date'), note: form.get('note') }); event.currentTarget.reset(); }}><h3>ثبت فروش روزانه</h3><label><span>مبلغ فروش</span><input name="amount" type="number" inputMode="numeric" min="1" required /></label><label><span>تاریخ</span><input name="date" type="date" defaultValue={today()} required /></label><label><span>توضیح اختیاری</span><input name="note" /></label><button className="button button--primary">ثبت فروش</button></form><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); add({ type: 'expense', title: form.get('title'), amount: form.get('amount'), date: form.get('date') }); event.currentTarget.reset(); }}><h3>ثبت هزینه</h3><label><span>عنوان هزینه</span><input name="title" required /></label><label><span>مبلغ هزینه</span><input name="amount" type="number" inputMode="numeric" min="1" required /></label><label><span>تاریخ</span><input name="date" type="date" defaultValue={today()} required /></label><button className="button button--primary">ثبت هزینه</button></form></div></section>}

    {activeTab === 'settings' && <section className="menu-admin__panel" role="tabpanel"><div className="menu-admin__section-head"><div><h2>تنظیمات کلی منو</h2><p>اطلاعات دسترسی و وضعیت انتشار منوی QR</p></div></div><div className="menu-settings"><div><span>عنوان منو</span><b>کافه کتاب برداشت</b></div><div><span>وضعیت انتشار</span><b className="menu-settings__online">فعال و قابل مشاهده</b></div><div><span>نشانی منوی QR</span><code>/menu/{publicSlug}</code></div><p>این نشانی در منو، هدر، فوتر یا نقشهٔ سایت آموزشی نمایش داده نمی‌شود و برای موتورهای جست‌وجو noindex است.</p></div></section>}

    {confirmDialog && <div className="menu-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setConfirmDialog(null)}><div className="menu-modal__dialog" role="alertdialog" aria-modal="true" aria-labelledby="menu-confirm-title" aria-describedby="menu-confirm-description"><div className="menu-modal__icon">!</div><h2 id="menu-confirm-title">{confirmDialog.title}</h2><p id="menu-confirm-description">{confirmDialog.description}</p><div className="menu-modal__actions"><button className="button button--secondary" autoFocus onClick={() => setConfirmDialog(null)}>انصراف</button><button className="button button--danger" onClick={async () => { const action = confirmDialog.action; setConfirmDialog(null); try { await action(); } catch (error) { setMessage(error.message); } }}>تأیید حذف</button></div></div></div>}
  </div>;
}
