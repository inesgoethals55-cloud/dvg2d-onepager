/* ==========================================================
   Digitale Vormgeving — Startgids
   Laadt content.md, maakt van elk ## hoofdstuk een sectie
   en voegt de grafische laag + interactie toe.
   ========================================================== */

// 60-30-10: vooral inkt/papier, rood/wijn als tweede kleur, limoen (--pop) als accent
const THEMES = ['t-light', 't-dark', 't-red', 't-light', 't-dark', 't-wine'];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- markdown → structuur ---------- */

function parseMarkdown(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const doc = { title: '', intro: [], chapters: [] };
  let blocks = doc.intro;
  let para = null;
  let list = null;
  let card = null;

  const close = () => { para = null; list = null; card = null; };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) { close(); continue; }

    if (line.startsWith('# ')) {
      close();
      doc.title = line.slice(2).trim();
    } else if (line.startsWith('## ')) {
      close();
      const chapter = { title: line.slice(3).trim(), blocks: [] };
      doc.chapters.push(chapter);
      blocks = chapter.blocks;
    } else if (line.startsWith('### ')) {
      close();
      card = { type: 'card', title: line.slice(4).trim(), text: '' };
      blocks.push(card);
    } else if (line.startsWith('>')) {
      close();
      blocks.push({ type: 'quote', text: line.replace(/^>\s?/, '') });
    } else if (/^[-*]\s+/.test(line)) {
      para = null; card = null;
      if (!list) { list = { type: 'list', items: [] }; blocks.push(list); }
      list.items.push(line.replace(/^[-*]\s+/, ''));
    } else if (card) {
      card.text += (card.text ? ' ' : '') + line;
    } else {
      list = null;
      if (!para) { para = { type: 'p', text: '' }; blocks.push(para); }
      para.text += (para.text ? ' ' : '') + line;
    }
  }
  return doc;
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, label, href) => {
      const safe = /^(https?:|mailto:|#)/i.test(href) ? href : '#';
      return `<a href="${safe}">${label}</a>`;
    });
}

const slugify = (s) => s.toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const pad = (n) => String(n).padStart(2, '0');

/* ---------- abstracte vormen ---------- */

const POP = 'style="fill:var(--pop)"';
const fill = (v) => `style="fill:var(${v})"`;
const stroke = (v, w) => `style="fill:none;stroke:var(${v});stroke-width:${w}"`;

function heroArt() {
  const stripes = Array.from({ length: 9 }, (_, i) =>
    `<rect x="0" y="${250 + i * 16}" width="150" height="7" style="fill:var(--grey)"/>`).join('');
  return `
  <svg viewBox="0 0 400 400">
    <circle class="drift" cx="250" cy="150" r="130" style="fill:var(--red)"/>
    <path class="drift drift--slow" d="M60 400 A150 150 0 0 1 360 400 Z" style="fill:var(--wine)"/>
    ${stripes}
    <circle class="drift drift--slow" cx="120" cy="90" r="34" style="fill:none;stroke:var(--paper);stroke-width:3"/>
    <rect class="spin-slow" x="300" y="270" width="54" height="54" style="fill:var(--pop)"/>
  </svg>`;
}

const ART = [
  // cirkel, halve cirkel, strepen
  () => `
    <circle class="drift" cx="260" cy="140" r="120" ${fill('--s1')}/>
    <path d="M40 400 A150 150 0 0 1 340 400 Z" ${fill('--s2')}/>
    ${Array.from({ length: 7 }, (_, i) => `<rect x="10" y="${40 + i * 22}" width="150" height="10" ${fill('--s3')}/>`).join('')}
    <circle class="drift drift--slow" cx="360" cy="290" r="22" ${POP}/>`,
  // draaiend vierkant, puntenraster, kwartcirkel
  () => `
    <rect class="spin-slow" x="150" y="50" width="200" height="200" ${fill('--s1')}/>
    ${Array.from({ length: 49 }, (_, i) => `<circle cx="${30 + (i % 7) * 26}" cy="${210 + Math.floor(i / 7) * 26}" r="4" ${fill('--s3')}/>`).join('')}
    <path d="M400 400 L400 210 A190 190 0 0 0 210 400 Z" ${fill('--s2')}/>
    <circle cx="30" cy="210" r="9" ${POP}/>`,
  // concentrische bogen
  () => `
    ${[70, 120, 170, 220, 270].map((r) => `<path d="M${400 - r} 0 A${r} ${r} 0 0 0 400 ${r}" ${stroke('--s1', 20)}/>`).join('')}
    <circle class="drift" cx="110" cy="290" r="70" ${fill('--s2')}/>
    <circle cx="200" cy="360" r="16" ${POP}/>`,
  // diagonale balken in een cirkel
  (i) => `
    <clipPath id="clip-${i}"><circle cx="230" cy="170" r="150"/></clipPath>
    <g clip-path="url(#clip-${i})">
      ${Array.from({ length: 12 }, (_, k) => `<rect x="${-100 + k * 44}" y="-50" width="20" height="500" transform="rotate(35 230 170)" ${fill('--s1')}/>`).join('')}
    </g>
    <rect class="drift" x="30" y="260" width="120" height="120" ${fill('--s2')}/>
    <circle cx="230" cy="170" r="150" ${stroke('--s3', 2)}/>
    <rect x="110" y="240" width="40" height="40" ${POP}/>`,
  // bogen / poorten
  () => `
    <path d="M70 400 V220 A150 150 0 0 1 370 220 V400 Z" ${fill('--s1')}/>
    <path d="M120 400 V230 A100 100 0 0 1 320 230 V400 Z" ${fill('--s2')}/>
    <path d="M170 400 V240 A50 50 0 0 1 270 240 V400 Z" ${fill('--s3')}/>
    <circle class="drift" cx="80" cy="80" r="40" ${fill('--s1')}/>
    <rect x="205" y="330" width="30" height="70" ${POP}/>`,
  // plus en ring
  () => `
    <g class="spin-slow">
      <rect x="165" y="30" width="70" height="300" ${fill('--s1')}/>
      <rect x="50" y="145" width="300" height="70" ${fill('--s1')}/>
    </g>
    <circle class="drift" cx="310" cy="320" r="62" ${stroke('--s2', 26)}/>
    <circle cx="60" cy="350" r="12" ${fill('--s3')}/>
    <circle cx="95" cy="350" r="12" ${POP}/>`,
];

const CARD_SHAPES = [
  '<circle cx="23" cy="23" r="23"/>',
  '<path d="M0 46 A23 23 0 0 1 46 46 Z M0 20 A23 23 0 0 1 46 20 Z"/>',
  '<rect x="7" y="7" width="32" height="32" transform="rotate(45 23 23)"/>',
  '<path d="M23 0 L46 46 H0 Z"/>',
  '<path d="M0 0 H46 V46 A46 46 0 0 1 0 0 Z"/>',
  '<circle cx="23" cy="23" r="17" style="fill:none;stroke:currentColor;stroke-width:9"/>',
];

/* ---------- renderen ---------- */

function renderHero(doc) {
  const words = doc.title.split(/\s+/);
  const big = words.splice(-2);
  const title = document.querySelector('.hero__title');
  title.innerHTML = [
    words.length ? `<span class="line line--small">${escapeHtml(words.join(' '))}</span>` : '',
    `<span class="line line--fill"><span class="fit">${escapeHtml(big[0] || '')}</span></span>`,
    big[1] ? `<span class="line line--outline"><span class="fit">${escapeHtml(big[1])}</span></span>` : '',
  ].join('');

  const quote = doc.intro.find((b) => b.type === 'quote');
  const lead = doc.intro.find((b) => b.type === 'p');
  document.querySelector('.hero__kicker').innerHTML = quote ? inline(quote.text) : '';
  document.querySelector('.hero__lead').innerHTML = lead ? inline(lead.text) : '';
  document.querySelector('.hero__art').innerHTML = heroArt();
}

function renderTitle(text) {
  const words = text.split(/\s+/);
  if (words.length < 2) return inline(text);
  const last = words.pop();
  return `${inline(words.join(' '))} <em>${escapeHtml(last)}</em>`;
}

function renderBlocks(blocks) {
  let html = '';
  let cards = [];

  const flushCards = () => {
    if (!cards.length) return;
    html += `<div class="cards reveal">${cards.map((c, k) => `
      <article class="card">
        <span class="card__num">${pad(k + 1)}</span>
        <svg class="card__shape" viewBox="0 0 46 46" fill="currentColor" aria-hidden="true">${CARD_SHAPES[k % CARD_SHAPES.length]}</svg>
        <h3 class="card__title">${inline(c.title)}</h3>
        <p>${inline(c.text)}</p>
      </article>`).join('')}</div>`;
    cards = [];
  };

  for (const b of blocks) {
    if (b.type === 'card') { cards.push(b); continue; }
    flushCards();

    if (b.type === 'p') {
      const punch = /^\*\*[^*]+\*\*$/.test(b.text);
      html += `<p class="reveal${punch ? ' punch' : ''}">${inline(punch ? b.text.slice(2, -2) : b.text)}</p>`;
    } else if (b.type === 'quote') {
      html += `<blockquote class="quote reveal"><p>${inline(b.text)}</p></blockquote>`;
    } else if (b.type === 'list') {
      html += `<ul class="rows reveal">${b.items.map((item) => {
        const m = item.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
        return m
          ? `<li><span class="rows__key">${inline(m[1])}</span><span class="rows__val">${inline(m[2])}</span></li>`
          : `<li class="plain"><span class="rows__val">${inline(item)}</span></li>`;
      }).join('')}</ul>`;
    }
  }
  flushCards();
  return html;
}

function renderMarquee(doc, theme) {
  const items = doc.chapters.map((c) => `<span>${escapeHtml(c.title)}</span><em>✶</em>`).join('');
  return `<div class="marquee ${theme}" aria-hidden="true"><div class="marquee__track">${items}${items}</div></div>`;
}

function renderChapters(doc) {
  const total = pad(doc.chapters.length);
  const html = doc.chapters.map((c, i) => {
    const n = pad(i + 1);
    const section = `
    <section class="chapter ${THEMES[i % THEMES.length]}" id="${slugify(c.title)}" data-num="${n}" data-title="${escapeHtml(c.title)}">
      <div class="chapter__art" aria-hidden="true"><svg viewBox="0 0 400 400">${ART[i % ART.length](i)}</svg></div>
      <span class="chapter__bignum" aria-hidden="true">${n}</span>
      <div class="chapter__inner">
        <header class="chapter__head reveal">
          <p class="chapter__meta"><b>${n}</b><span>Hoofdstuk ${n} / ${total}</span></p>
          <h2 class="chapter__title">${renderTitle(c.title)}</h2>
        </header>
        <div class="chapter__body">${renderBlocks(c.blocks)}</div>
      </div>
    </section>`;
    // een bewegende band vlak voor het laatste hoofdstuk
    const isLast = i === doc.chapters.length - 1 && i > 0;
    return (isLast ? renderMarquee(doc, 't-pop') : '') + section;
  }).join('');

  document.getElementById('content').innerHTML = renderMarquee(doc, 't-red') + html;

  document.querySelector('.menu__list').innerHTML = doc.chapters.map((c, i) =>
    `<li><a href="#${slugify(c.title)}"><span>${pad(i + 1)}</span>${escapeHtml(c.title)}</a></li>`).join('');
}

/* ---------- interactie ---------- */

function fitHeroLines() {
  const container = document.querySelector('.hero__inner');
  const width = container.clientWidth;
  document.querySelectorAll('.hero__title .fit').forEach((el) => {
    el.style.fontSize = '100px';
    const w = el.getBoundingClientRect().width;
    el.style.fontSize = `${Math.min((width / w) * 100 * 0.99, 420)}px`;
  });
}

function setupMenu() {
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('menu');
  let timer;

  const setOpen = (open) => {
    clearTimeout(timer);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.nav__toggle-label').textContent = open ? 'Sluit' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      timer = setTimeout(() => { menu.hidden = true; }, 600);
    }
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
}

function setupObservers() {
  const reveals = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  // huidig hoofdstuk tonen in de navigatie
  const num = document.querySelector('.nav__num');
  const title = document.querySelector('.nav__title');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      num.textContent = e.target.dataset.num || '00';
      title.textContent = e.target.dataset.title || 'Intro';
    });
  }, { rootMargin: '-45% 0px -55% 0px' });
  document.querySelectorAll('.hero, .chapter').forEach((s) => spy.observe(s));
}

function setupScroll() {
  const bar = document.querySelector('.progress__bar');
  const arts = [...document.querySelectorAll('.chapter__art')];
  const heroArtEl = document.querySelector('.hero__art svg');
  let ticking = false;

  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;

    if (!reducedMotion) {
      const vh = innerHeight;
      arts.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const offset = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = `translate3d(0, ${offset * -120}px, 0) rotate(${offset * -12}deg)`;
      });
      if (heroArtEl && scrollY < vh) {
        heroArtEl.style.transform = `translate3d(0, ${scrollY * 0.25}px, 0) rotate(${scrollY * 0.03}deg)`;
      }
    }
    ticking = false;
  };

  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

/* ---------- start ---------- */

// Via een server lezen we content.md rechtstreeks (altijd de nieuwste versie).
// Als bestand geopend (file://) blokkeert de browser fetch(); dan gebruiken we
// js/content.js, dat build.js uit content.md maakt.
async function loadMarkdown() {
  if (location.protocol !== 'file:') {
    try {
      const res = await fetch('content.md', { cache: 'no-cache' });
      if (res.ok) return await res.text();
    } catch (err) { /* val terug op content.js */ }
  }
  if (typeof window.CONTENT_MD === 'string') return window.CONTENT_MD;
  throw new Error('content.md niet gevonden');
}

async function init() {
  setupMenu();
  try {
    const doc = parseMarkdown(await loadMarkdown());
    renderHero(doc);
    renderChapters(doc);
    document.documentElement.classList.add('js-loaded');
  } catch (err) {
    document.querySelector('.hero__title').innerHTML =
      '<span class="line line--small">content.md kon niet geladen worden</span>';
    document.querySelector('.hero__lead').innerHTML =
      'Voer <code>node build.js</code> uit in de map v1 om js/content.js aan te maken, of open de pagina via een lokale server (bv. Live Server).';
    console.error(err);
    return;
  }

  fitHeroLines();
  if (document.fonts) document.fonts.ready.then(fitHeroLines);
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitHeroLines, 100);
  });

  setupObservers();
  setupScroll();
}

init();
