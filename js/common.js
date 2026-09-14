/* Общий модуль: навбар, зерно, появления, канвас-«станок».
   Работает и на index.html (корень), и на страницах в pages/. */

const IN_PAGES = location.pathname.includes('/pages/');
const BASE = IN_PAGES ? '..' : '.';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- безопасность ----
   Названия работ, папок и поля в data/*.json попадают в разметку. Чтобы
   случайный или подставленный текст (кавычка, <script>, ссылка javascript:)
   не превратился в код, всё подставляемое пропускаем через эти две функции. */
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}
/** Разрешаем только безопасные схемы и относительные пути. Иначе — пусто. */
function safeUrl(value) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;          // обычные ссылки
  if (/^[^a-z]/i.test(s) || !/^[a-z][a-z0-9+.-]*:/i.test(s)) return s; // относительный путь
  return '';                                                  // javascript:, data: и прочее
}

/* ---- зерно ---- */
(function grain() {
  const g = document.createElement('div');
  g.className = 'grain';
  g.setAttribute('aria-hidden', 'true');
  document.body.appendChild(g);
})();

/* ---- навбар ---- */
function initNavbar(navHtmlPath) {
  const holder = document.getElementById('navbar-placeholder');
  if (!holder) return Promise.resolve();
  return fetch(navHtmlPath)
    .then((r) => r.text())
    .then((html) => {
      holder.innerHTML = html;
      const nav = holder.querySelector('.navbar');
      const links = holder.querySelectorAll('.nav-links a');
      const home = holder.querySelector('[data-home]');

      // Пути: из корня добавляем префикс pages/
      if (!IN_PAGES) {
        links.forEach((a) => (a.href = 'pages/' + a.getAttribute('href')));
      }
      // Логотип ведёт на главную и запускает интро-анимацию
      if (home) {
        home.setAttribute('href', IN_PAGES ? '../index.html' : 'index.html');
        home.addEventListener('click', () => {});
        const mark = home.querySelector('.logo-mark');
        if (mark && mark.tagName === 'IMG') mark.src = `${BASE}/assets/logo-72.webp`;
      }

      // Активная ссылка
      const current = location.pathname.split('/').pop() || 'index.html';
      links.forEach((a) => {
        if (a.getAttribute('href').endsWith(current) && current !== 'index.html') {
          a.classList.add('active');
        }
      });

      // Бургер-меню
      const toggle = holder.querySelector('.nav-toggle');
      toggle?.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      links.forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));

      // Скрытие при скролле вниз
      let last = 0;
      addEventListener('scroll', () => {
        const y = scrollY;
        if (y > last && y > 200) nav.classList.add('nav-hidden');
        else nav.classList.remove('nav-hidden');
        last = y;
      }, { passive: true });
    })
    .catch(() => {});
}

/* ---- появления при скролле ---- */
function initReveals() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (REDUCED) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => io.observe(e));
}

/* ---- канвас-«мастерская эмали» ----
   медная основа и искры стеклянной пудры перед обжигом. */
function initLoom(canvas) {
  if (!canvas || REDUCED) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr, sparks = [], t = 0;
  const palette = ['#070707', '#1b1b1b', '#c04425', '#c9984f', '#483c39'];

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sparks = Array.from({ length: Math.max(28, Math.floor(w / 32)) }, (_, i) => ({
      x: Math.random(), y: Math.random(),
      speed: 0.2 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      color: palette[i % palette.length],
      size: 1 + Math.random() * 3,
    }));
  }

  function frame() {
    t += 0.008;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5, cy = h * 0.52;
    const plateW = Math.min(w * 0.72, 1500), plateH = Math.min(h * 0.56, 520);
    ctx.fillStyle = 'rgba(86,37,29,0.16)';
    ctx.fillRect(cx - plateW / 2, cy - plateH / 2, plateW, plateH);
    ctx.strokeStyle = 'rgba(201,152,79,0.3)'; ctx.lineWidth = 3;
    ctx.strokeRect(cx - plateW / 2, cy - plateH / 2, plateW, plateH);
    sparks.forEach((spark) => {
      const x = spark.x * w + Math.sin(t * spark.speed + spark.phase) * 16;
      const y = spark.y * h - ((t * 16 * spark.speed) % (h + 40));
      ctx.globalAlpha = 0.12 + 0.16 * Math.sin(t * 2 + spark.phase);
      ctx.fillStyle = spark.color;
      ctx.beginPath(); ctx.arc(x, (y + h + 40) % (h + 40) - 20, spark.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  resize();
  addEventListener('resize', resize);
  frame();
}

/* ---- интро-анимация производства горячей эмали ---- */
function playLoomIntro() {
  if (REDUCED || document.querySelector('.loom-intro')) return;
  const ov = document.createElement('div');
  ov.className = 'loom-intro';
  const cv = document.createElement('canvas');
  const brand = document.createElement('div');
  brand.className = 'brand';
  brand.textContent = 'Медь. Стекло. Огонь. Искусство горячей эмали.';
  ov.append(cv, brand);
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';

  const ctx = cv.getContext('2d');
  let W, H, dpr;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  addEventListener('resize', size);

  const DUR = 3200, start = performance.now();
  const metal = [
    { x: 0.17, y: -0.34, w: 0.28, h: 0.34, r: -0.14, delay: 0.02 },
    { x: 0.48, y: -0.48, w: 0.34, h: 0.28, r: 0.08, delay: 0.18 },
    { x: 0.78, y: -0.28, w: 0.24, h: 0.42, r: 0.18, delay: 0.34 },
  ];
  const nails = Array.from({ length: 24 }, (_, i) => ({
    chunk: i % 3, x: 0.18 + Math.random() * 0.64, delay: 0.26 + Math.random() * 0.45,
  }));
  const sparks = Array.from({ length: 80 }, (_, i) => ({
    x: Math.random(), y: Math.random(), r: 1 + Math.random() * 3,
    color: ['#c04425', '#c9984f', '#efe8dc'][i % 3], delay: Math.random() * 0.72,
  }));
  function frame(now) {
    const p = Math.min((now - start) / DUR, 1);
    ctx.clearRect(0, 0, W, H);
    const glow = Math.sin(p * Math.PI) * 0.35;
    const grad = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H) * 0.7);
    grad.addColorStop(0, `rgba(192,68,37,${0.24 + glow})`);
    grad.addColorStop(0.45, 'rgba(17,19,22,0.88)');
    grad.addColorStop(1, '#111316');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Большая муфельная печь внизу кадра.
    const ovenW = Math.min(W * 0.66, 940), ovenH = Math.min(H * 0.26, 230);
    const ox = (W - ovenW) / 2, oy = H * 0.67;
    ctx.fillStyle = '#272a2e'; ctx.fillRect(ox, oy, ovenW, ovenH);
    ctx.strokeStyle = `rgba(201,152,79,${0.5 + glow})`; ctx.lineWidth = 5; ctx.strokeRect(ox, oy, ovenW, ovenH);
    const mouthX = ox + ovenW * 0.19, mouthY = oy + ovenH * 0.16, mouthW = ovenW * 0.62, mouthH = ovenH * 0.66;
    const fire = ctx.createRadialGradient(mouthX + mouthW / 2, mouthY + mouthH, 5, mouthX + mouthW / 2, mouthY + mouthH / 2, mouthW * 0.7);
    fire.addColorStop(0, `rgba(255,220,125,${0.95 + glow * 0.2})`); fire.addColorStop(0.35, 'rgba(192,68,37,0.9)'); fire.addColorStop(1, '#17181a');
    ctx.fillStyle = fire; ctx.fillRect(mouthX, mouthY, mouthW, mouthH);
    ctx.strokeStyle = '#0c0d0e'; ctx.lineWidth = 12; ctx.strokeRect(mouthX, mouthY, mouthW, mouthH);

    // Тяжёлые куски металла опускаются в печь.
    metal.forEach((m) => {
      const q = Math.max(0, Math.min((p - m.delay) / 0.62, 1));
      const x = W * m.x, y = H * (m.y + q * 0.88), w = W * m.w, h = H * m.h;
      ctx.save(); ctx.translate(x, y); ctx.rotate(m.r + q * 0.08);
      ctx.fillStyle = '#4c535a'; ctx.strokeStyle = '#aab0b4'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h * 0.39); ctx.lineTo(w * 0.35, h / 2); ctx.lineTo(-w / 2, h * 0.36); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(192,68,37,0.8)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-w * 0.32, -h * 0.25); ctx.lineTo(w * 0.25, h * 0.22); ctx.stroke();
      ctx.restore();
    });

    // Удары молотка и крупные гвозди.
    nails.forEach((n) => {
      const q = Math.max(0, Math.min((p - n.delay) / 0.28, 1));
      const x = W * n.x, y = H * (0.12 + q * 0.42);
      ctx.strokeStyle = `rgba(239,232,220,${q * 0.9})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y + 34); ctx.stroke();
      ctx.fillStyle = `rgba(201,152,79,${q})`; ctx.beginPath(); ctx.arc(x - 12, y + 35, 5, 0, Math.PI * 2); ctx.fill();
    });
    sparks.forEach((s) => {
      const q = Math.max(0, Math.min((p - s.delay) / 0.2, 1));
      const x = ox + s.x * ovenW, y = oy + s.y * ovenH - q * 90;
      ctx.globalAlpha = q * 0.9; ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (p < 1) requestAnimationFrame(frame);
    else setTimeout(() => {
      ov.classList.add('done');
      document.body.style.overflow = '';
      removeEventListener('resize', size);
      setTimeout(() => ov.remove(), 750);
    }, 450);
  }
  requestAnimationFrame(frame);
}

/* ---- переиспользуемый лайтбокс для фотографий ---- */
function makePhotoLightbox() {
  const lb = document.createElement('div');
  lb.className = 'photobox';
  lb.innerHTML = `
    <button class="pb-x" aria-label="Закрыть">✕</button>
    <button class="pb-prev" aria-label="Предыдущая">←</button>
    <button class="pb-next" aria-label="Следующая">→</button>
    <img alt="">
    <p class="pb-cap"></p>`;
  document.body.appendChild(lb);
  const imgEl = lb.querySelector('img');
  const cap = lb.querySelector('.pb-cap');
  let imgs = [], idx = 0, title = '';
  const fill = () => { imgEl.src = imgs[idx]; cap.textContent = imgs.length > 1 ? `${title} · ${idx + 1}/${imgs.length}` : title; };
  const step = (d) => { if (imgs.length < 2) return; idx = (idx + d + imgs.length) % imgs.length; fill(); };
  const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; setTimeout(() => lb.classList.remove('show'), 320); };
  lb.querySelector('.pb-x').addEventListener('click', close);
  lb.querySelector('.pb-prev').addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  lb.querySelector('.pb-next').addEventListener('click', (e) => { e.stopPropagation(); step(1); });
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target === imgEl) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
  return (images, start, t) => {
    imgs = images; idx = start || 0; title = t || '';
    lb.classList.toggle('single', imgs.length < 2);
    fill();
    lb.classList.add('show');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => lb.classList.add('open'));
  };
}
let _openPhotos;
function openPhotos(images, index, title) {
  if (!_openPhotos) _openPhotos = makePhotoLightbox();
  _openPhotos(images, index, title);
}

/* ---- иконки соцсетей ---- */
const SOCIAL_ICONS = {
  vk: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.2 17c-5.3 0-8.7-3.7-8.9-9.8h2.7c.1 4.5 2.1 6.3 3.6 6.7V7.2h2.5v3.8c1.5-.2 3-1.8 3.6-3.8h2.5c-.4 2.4-2 4-3.2 4.7 1.1.6 3 2 3.7 4.4h-2.8c-.6-1.7-2-3-3.8-3.2V17z"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 5.2 18.8 19c-.2 1-.9 1.2-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8 8.7-7.9c.4-.3-.1-.5-.6-.2L6.7 12.9l-4.6-1.5c-1-.3-1-1 .2-1.5l17.9-6.9c.8-.3 1.5.2 1.2 1.2z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 8.2c-.2-1-.8-1.7-1.8-2C18.4 5.8 12 5.8 12 5.8s-6.4 0-8.2.4c-1 .3-1.6 1-1.8 2C1.6 10 1.6 12 1.6 12s0 2 .4 3.8c.2 1 .8 1.7 1.8 2 1.8.4 8.2.4 8.2.4s6.4 0 8.2-.4c1-.3 1.6-1 1.8-2 .4-1.8.4-3.8.4-3.8s0-2-.4-3.8zM10 15.3V8.7l5.3 3.3z"/></svg>',
};
/* Список намеренно короткий: поддерживаются только сервисы, разрешённые
   в РФ. Прежде чем добавлять сюда новый значок, проверьте статус сервиса. */
function socialKey(label) {
  const l = (label || '').toLowerCase();
  if (/вк|vk|вконтакт/.test(l)) return 'vk';
  if (/telegram|телеграм|тг/.test(l)) return 'telegram';
  if (/youtube|ютуб/.test(l)) return 'youtube';
  return null;
}
function socialButton(s) {
  const k = socialKey(s.label);
  const icon = k ? SOCIAL_ICONS[k] : '';
  const url = safeUrl(s.url);
  if (!url) return '';
  const label = esc(s.label);
  return `<a class="social-btn${icon ? '' : ' is-text'}" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}">${icon || label}</a>`;
}

/* ---- конфиг сайта (контакты, соцсети) из data/site.json ---- */
function loadSiteConfig() {
  return fetch(`${BASE}/data/site.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((site) => {
      if (!site) return;
      window.SITE = site;
      const socials = (site.socials || []).filter((s) => s.url);
      document.querySelectorAll('.site-footer').forEach((footer) => {
        if (footer.querySelector('.footer-socials') || footer.querySelector('.social-buttons')) return;
        const anchor = footer.querySelector('.footer-links') || footer.querySelector('.footer-name');
        // контакты (текст)
        const contact = [];
        if (site.email) contact.push(`<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>`);
        if (site.phone) contact.push(`<a href="tel:${esc(site.phone.replace(/[^+\d]/g, ''))}">${esc(site.phone)}</a>`);
        if (contact.length && anchor) {
          const block = document.createElement('div');
          block.className = 'footer-socials';
          block.innerHTML = contact.join('');
          anchor.insertAdjacentElement('afterend', block);
        }
        // соцсети (кнопки-иконки)
        if (socials.length && anchor) {
          const row = document.createElement('div');
          row.className = 'social-buttons';
          row.innerHTML = socials.map(socialButton).join('');
          (footer.querySelector('.footer-socials') || anchor).insertAdjacentElement('afterend', row);
        }
      });

      // Фото художника на странице «Художник» — путь из настроек сайта.
      const photoEl = document.querySelector('[data-artist-photo]');
      if (photoEl && site.photo) photoEl.src = `${BASE}/${String(site.photo).replace(/^\/+/, '')}`;

      // Контакты на странице «Художник»
      const setContact = (sel, cond, fill) => {
        const el = document.querySelector(sel);
        if (el && cond) { fill(el); el.hidden = false; }
      };
      setContact('[data-contact-email]', site.email, (el) => {
        const a = el.querySelector('a'); a.href = `mailto:${site.email}`; a.textContent = site.email;
      });
      setContact('[data-contact-phone]', site.phone, (el) => {
        const a = el.querySelector('a'); a.href = `tel:${site.phone.replace(/[^+\d]/g, '')}`; a.textContent = site.phone;
      });
      setContact('[data-contact-location]', site.location, (el) => {
        el.querySelector('span').textContent = site.location;
      });
      const socBox = document.querySelector('[data-contact-socials]');
      if (socBox && socials.length) {
        socBox.className = 'social-buttons';
        socBox.innerHTML = socials.map(socialButton).join('');
      }
      document.dispatchEvent(new CustomEvent('siteconfig', { detail: site }));
    })
    .catch(() => {});
}

/* авто-старт общих вещей */
document.addEventListener('DOMContentLoaded', () => {
  const navPath = IN_PAGES ? 'navbar.html' : 'pages/navbar.html';
  initNavbar(navPath);
  initReveals();
  loadSiteConfig();
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
