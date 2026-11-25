'use client';

import { useEffect, useState } from 'react';
import Icon from './Icon';
import ShamsiDateTimeField from './ShamsiDateTimeField';

const dateFmt = new Intl.DateTimeFormat('fa-IR', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });

const emptyForm = { title: '', teacher: '', location: '', startsAt: '', durationMin: '', description: '' };

export default function CalendarBoard() {
  const [events, setEvents] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/calendar');
    const data = await res.json();
    if (data.ok) {
      setEvents(data.events);
      setCanManage(data.canManage);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.startsAt) {
      setError('عنوان کلاس و تاریخ الزامی است.');
      return;
    }
    setBusy(true);
    const payload = {
      title: form.title,
      teacher: form.teacher,
      location: form.location,
      description: form.description,
      durationMin: form.durationMin,
      startsAt: new Date(form.startsAt).toISOString(),
    };
    const url = editingId ? `/api/calendar/${editingId}` : '/api/calendar';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) { setError(data.error || 'خطا در ذخیره.'); return; }
    resetForm();
    load();
  }

  function startEdit(ev) {
    const d = new Date(ev.startsAt);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm({
      title: ev.title || '',
      teacher: ev.teacher || '',
      location: ev.location || '',
      startsAt: local,
      durationMin: ev.durationMin || '',
      description: ev.description || '',
    });
    setEditingId(ev.id);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(id) {
    if (!window.confirm('این کلاس حذف شود؟')) return;
    const res = await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) load();
  }

  return (
    <div>
      {canManage && (
        <form onSubmit={submit} className="form-shell" style={{ marginBottom: 28 }}>
          <h2 className="heading" style={{ fontSize: '1.15rem', marginBottom: 16 }}>
            {editingId ? 'ویرایش کلاس' : 'افزودن کلاس جدید'}
          </h2>
          {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
          <div className="cal-form-grid">
            <div className="form-group">
              <label className="form-label">عنوان کلاس *</label>
              <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلاً بازیگری مقدماتی" />
            </div>
            <div className="form-group">
              <label className="form-label">مدرس</label>
              <input className="form-input" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} placeholder="نام مدرس" />
            </div>
            <div className="form-group">
              <label className="form-label">تاریخ و ساعت *</label>
              <ShamsiDateTimeField value={form.startsAt} onChange={(v) => setForm({ ...form, startsAt: v })} />
            </div>
            <div className="form-group">
              <label className="form-label">مدت (دقیقه)</label>
              <input className="form-input" type="number" min="1" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} placeholder="۹۰" />
            </div>
            <div className="form-group">
              <label className="form-label">محل برگزاری</label>
              <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="پلاتو / آنلاین" />
            </div>
            <div className="form-group cal-form-full">
              <label className="form-label">توضیحات</label>
              <textarea className="form-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button className="btn btn--dark" type="submit" disabled={busy}>
              {busy ? 'در حال ذخیره…' : editingId ? 'ذخیره تغییرات' : 'افزودن کلاس'}
            </button>
            {editingId && <button className="btn btn--outline" type="button" onClick={resetForm}>انصراف</button>}
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>
      ) : events.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>هنوز کلاسی در تقویم ثبت نشده است.</p>
        </div>
      ) : (
        <ul className="cal-list">
          {events.map((ev) => {
            const d = new Date(ev.startsAt);
            const past = d.getTime() < Date.now();
            return (
              <li key={ev.id} className={`cal-item${past ? ' cal-item--past' : ''}`}>
                <div className="cal-date">
                  <span className="cal-day">{dateFmt.format(d)}</span>
                  <span className="cal-time">{timeFmt.format(d)}</span>
                </div>
                <div className="cal-body">
                  <h3>{ev.title}</h3>
                  <div className="cal-meta">
                    {ev.teacher && <span className="meta-ico"><Icon name="user" size={13} /> {ev.teacher}</span>}
                    {ev.location && <span className="meta-ico"><Icon name="mapPin" size={13} /> {ev.location}</span>}
                    {ev.durationMin && <span>⏱ {ev.durationMin} دقیقه</span>}
                  </div>
                  {ev.description && <p className="cal-desc">{ev.description}</p>}
                  {canManage && (
                    <div className="cal-actions">
                      <button className="btn btn--sm btn--outline" type="button" onClick={() => startEdit(ev)}>ویرایش</button>
                      <button className="btn btn--sm btn--danger" type="button" onClick={() => remove(ev.id)}>حذف</button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
