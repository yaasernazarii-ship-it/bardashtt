// خانواده برداشت — Main JS

// ── Accordion ────────────────────────────
document.querySelectorAll('.accordion-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const body = btn.nextElementSibling;
    const isOpen = btn.classList.contains('open');
    document.querySelectorAll('.accordion-btn').forEach(b => {
      b.classList.remove('open');
      b.nextElementSibling.classList.remove('open');
    });
    if (!isOpen) { btn.classList.add('open'); body.classList.add('open'); }
  });
});

// ── Tabs ─────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.closest('[data-tabs]');
    const target = btn.dataset.tab;
    group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    group.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    group.querySelector(`[data-panel="${target}"]`).classList.add('active');
  });
});

// ── OTP Input ────────────────────────────
document.querySelectorAll('.otp-input').forEach((input, i, all) => {
  input.addEventListener('input', () => {
    if (input.value.length === 1 && all[i + 1]) all[i + 1].focus();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !input.value && all[i - 1]) all[i - 1].focus();
  });
});

// ── Mobile Nav ───────────────────────────
const menuBtn  = document.querySelector('.nav__menu-btn');
const navLinks = document.querySelector('.nav__links');

if (menuBtn && navLinks) {
  // پس‌زمینه تاریک هنگام باز بودن منو
  const backdrop = document.createElement('div');
  backdrop.className = 'nav__backdrop';
  document.body.appendChild(backdrop);

  function openNav() {
    navLinks.classList.add('nav__links--open');
    backdrop.classList.add('active');
    menuBtn.textContent = '✕';
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    navLinks.classList.remove('nav__links--open');
    backdrop.classList.remove('active');
    menuBtn.textContent = '☰';
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', () =>
    navLinks.classList.contains('nav__links--open') ? closeNav() : openNav()
  );
  backdrop.addEventListener('click', closeNav);

  // بستن با ESC
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
}

// ── Smooth scroll for anchor links ───────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const el = document.querySelector(a.getAttribute('href'));
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
