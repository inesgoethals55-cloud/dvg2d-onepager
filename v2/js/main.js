/* ==========================================================
   Digitale Vormgeving — Startgids · v2
   Laadt content.md, maakt van elk ## hoofdstuk een sectie.
   De hero is een live typedemo: sleep het handvat en de
   breedte-as (wdth 62–125) van Archivo verandert mee.
   ========================================================== */

// Achtergrond per sectie, in volgorde. Namen verwijzen naar de --brand-* kleuren in css/style.css.
const SECTION_BACKGROUNDS = ['light', 'dark', 'primary', 'light', 'secondary', 'dark'];
const WDTH_MIN = 62;
// op smalle schermen gaat de breedte minder ver open, zodat de letters groot blijven
const wdthMax = () => (innerWidth < 640 ? 100 : 125);
const WDTH_START = 88;
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

/* ---------- vormen met ankerpunten ---------- */

// De vormen zelf staan in js/shapes.js (gedeeld met de 3D-modellen).
const { lens: LENS, blob: BLOB, arch: ARCH } = window.SHAPE_NODES;

/**
 * Tekent een bézier-vorm, eventueel "geselecteerd" zoals in een ontwerpprogramma.
 * t = { x, y, s } schaalt en verschuift de vorm.
 */
function vector(nodes, fill, t = { x: 0, y: 0, s: 1 }, select = null) {
  const tf = ([x, y]) => [+(t.x + x * t.s).toFixed(1), +(t.y + y * t.s).toFixed(1)];
  const n = nodes.map((nd) => ({ p: tf(nd.p), i: tf(nd.i), o: tf(nd.o) }));

  let d = `M${n[0].p}`;
  n.forEach((a, k) => {
    const b = n[(k + 1) % n.length];
    d += ` C${a.o} ${b.i} ${b.p}`;
  });
  d += ' Z';

  let svg = `<path d="${d}" style="fill:var(${fill})"/>`;
  if (!select) return svg;

  svg += `<path class="sel-under" d="${d}"/><path class="path-outline" d="${d}"/>`;
  if (select.handles !== undefined) {
    const s = n[select.handles];
    svg += `<path class="sel-under" d="M${s.i} L${s.p} L${s.o}"/><path class="handle-line" d="M${s.i} L${s.p} L${s.o}"/>`
      + `<circle class="handle-end" cx="${s.i[0]}" cy="${s.i[1]}" r="3.5"/>`
      + `<circle class="handle-end" cx="${s.o[0]}" cy="${s.o[1]}" r="3.5"/>`;
  }
  svg += n.map((nd, k) =>
    `<rect class="anchor${k === select.handles ? ' anchor--on' : ''}" x="${nd.p[0] - 4.5}" y="${nd.p[1] - 4.5}" width="9" height="9"/>`).join('');
  return svg;
}

const circle = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:var(${fill})"/>`;
const square = (x, y, size, fill, rot = 0) =>
  `<rect x="${x}" y="${y}" width="${size}" height="${size}" transform="rotate(${rot} ${x + size / 2} ${y + size / 2})" style="fill:var(${fill})"/>`;

const svgWrap = (inner) => `<svg class="shape-art" viewBox="0 0 400 400" aria-hidden="true">${inner}</svg>`;


const SECTION_ART = [
  () => vector(LENS, '--s1', { x: 0, y: 0, s: 1 }, { handles: 0 }) + circle(320, 320, 62, '--s2'),
  () => vector(BLOB, '--s1', { x: 30, y: 30, s: .85 }, { handles: 1 }) + square(20, 300, 64, '--s3') + circle(350, 60, 26, '--s2'),
  () => vector(ARCH, '--s1', { x: 0, y: 0, s: 1 }, { handles: 2 }) + circle(200, 210, 52, '--s3'),
  () => square(150, 40, 200, '--s3', 14) + vector(BLOB, '--s1', { x: 20, y: 170, s: .55 }, { handles: 0 }),
  () => circle(220, 190, 160, '--s1') + vector(LENS, '--s2', { x: 120, y: 110, s: .7 }, { handles: 1 }),
  () => vector(ARCH, '--s1', { x: 40, y: 40, s: .9 }, { handles: 1 }) + vector(BLOB, '--s2', { x: 230, y: 250, s: .38 }),
];

const GLYPHS = [
  '<circle cx="20" cy="20" r="20"/>',
  '<path d="M0 40 A20 20 0 0 1 40 40 Z M0 18 A20 20 0 0 1 40 18 Z"/>',
  '<rect x="6" y="6" width="28" height="28" transform="rotate(45 20 20)"/>',
  '<path d="M20 0 L40 40 H0 Z"/>',
  '<path d="M0 0 H40 V40 A40 40 0 0 1 0 0 Z"/>',
  '<path d="M20 2 A18 18 0 1 0 20.01 2 Z M20 12 A8 8 0 1 1 19.99 12 Z" fill-rule="evenodd"/>',
];

/* ---------- renderen ---------- */

function renderHero(doc) {
  const words = doc.title.split(/\s+/);
  const big = words.splice(-2);
  document.querySelector('.hero__title').innerHTML =
    (words.length ? `<span class="hero__pre">${escapeHtml(words.join(' '))}</span>` : '')
    + big.map((w) => `<span class="hero__word">${escapeHtml(w)}</span>`).join('');

  const quote = doc.intro.find((b) => b.type === 'quote');
  const lead = doc.intro.find((b) => b.type === 'p');
  document.querySelector('.hero__lead').innerHTML =
    (quote ? `<strong>${inline(quote.text)}.</strong> ` : '') + (lead ? inline(lead.text) : '');
  renderHeroMedia();
}

// Stilstaand hero-beeld (media/hero-still.png, gemaakt uit media/hero-still.svg).
function renderHeroMedia() {
  document.querySelector('.hero__art').innerHTML = '<img class="hero__still" src="media/hero-still.png" alt="">';
}

function renderCards(cards) {
  // zes onderwerpen → raster met vormpjes; een kortere reeks → tips met een lijn
  if (cards.length % 3 === 0) {
    return `<div class="disciplines">${cards.map((c, k) => `
      <article class="discipline">
        <svg viewBox="0 0 40 40" aria-hidden="true">${GLYPHS[k % GLYPHS.length]}</svg>
        <h3>${inline(c.title)}</h3>
        <p>${inline(c.text)}</p>
      </article>`).join('')}</div>`;
  }
  return `<div class="tips">${cards.map((c) => `
    <article class="tip"><h3>${inline(c.title)}</h3><p>${inline(c.text)}</p></article>`).join('')}</div>`;
}

function renderList(items) {
  const pairs = items.map((item) => item.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/));

  if (pairs.every(Boolean) && pairs.every((m) => /^dag\s*\d+$/i.test(m[1]))) {
    return `<ol class="timeline">${pairs.map((m) =>
      `<li><span class="timeline__day">${inline(m[1])}</span><p>${inline(m[2])}</p></li>`).join('')}</ol>`;
  }
  if (pairs.every(Boolean)) {
    return `<dl class="tools">${pairs.map((m) =>
      `<dt>${inline(m[1])}</dt><dd>${inline(m[2])}</dd>`).join('')}</dl>`;
  }
  return `<ul>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
}

function renderBlocks(blocks) {
  let html = '';
  let cards = [];
  const flush = () => { if (cards.length) { html += renderCards(cards); cards = []; } };

  for (const b of blocks) {
    if (b.type === 'card') { cards.push(b); continue; }
    flush();
    if (b.type === 'p') {
      const punch = /^\*\*[^*]+\*\*$/.test(b.text);
      html += punch
        ? `<p class="punch">${inline(b.text.slice(2, -2))}</p>`
        : `<p>${inline(b.text)}</p>`;
    } else if (b.type === 'quote') {
      html += `<blockquote class="quote"><p>${inline(b.text)}</p></blockquote>`;
    } else if (b.type === 'list') {
      html += renderList(b.items);
    }
  }
  flush();
  return html;
}

function renderChapters(doc) {
  document.getElementById('content').innerHTML = doc.chapters.map((c, i) => `
    <section class="section" data-bg="${SECTION_BACKGROUNDS[i % SECTION_BACKGROUNDS.length]}" id="${slugify(c.title)}">
      <div class="section__inner">
        <h2 class="section__title">${inline(c.title)}</h2>
        <div class="section__art">${svgWrap(SECTION_ART[i % SECTION_ART.length]())}</div>
        <div class="section__body">${renderBlocks(c.blocks)}</div>
      </div>
    </section>`).join('');

  document.querySelector('.menu__list').innerHTML = doc.chapters.map((c) =>
    `<li><a href="#${slugify(c.title)}">${escapeHtml(c.title)}</a></li>`).join('');
}

/* ---------- hero: selectiekader + breedte-as ---------- */

function setupHero() {
  const inner = document.querySelector('.hero__inner');
  const words = [...document.querySelectorAll('.hero__word')];
  const handle = document.querySelector('.bbox__handle');
  const dim = document.querySelector('.bbox__dim');
  const cursor = document.querySelector('.cursor');
  let wdth = WDTH_START;
  let pxPerUnit = 1;

  const setStretch = (v) => words.forEach((w) => { w.style.fontStretch = `${v}%`; });

  const apply = (v) => {
    wdth = Math.round(Math.min(wdthMax(), Math.max(WDTH_MIN, v)));
    setStretch(wdth);
    handle.setAttribute('aria-valuenow', wdth);
    handle.setAttribute('aria-valuetext', `${wdth} procent breed`);
    dim.textContent = `Breedte ${wdth}%`;
  };

  // lettergrootte zo kiezen dat het breedste woord op wdth 125 net past
  const size = () => {
    const available = inner.clientWidth - 28;
    handle.setAttribute('aria-valuemax', wdthMax());
    setStretch(wdthMax());
    words.forEach((w) => { w.style.fontSize = '100px'; });
    const widest = Math.max(...words.map((w) => w.getBoundingClientRect().width));
    const fs = Math.min((available / widest) * 100, 300);
    words.forEach((w) => { w.style.fontSize = `${fs}px`; });

    const wMax = Math.max(...words.map((w) => w.getBoundingClientRect().width));
    setStretch(WDTH_MIN);
    const wMin = Math.max(...words.map((w) => w.getBoundingClientRect().width));
    pxPerUnit = (wMax - wMin) / (wdthMax() - WDTH_MIN);
    apply(wdth);
  };

  let startX = 0;
  let startW = 0;
  handle.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startW = wdth;
    handle.setPointerCapture(e.pointerId);
    handle.classList.add('is-dragging');
    cursor.style.opacity = '0';
  });
  handle.addEventListener('pointermove', (e) => {
    if (!handle.hasPointerCapture(e.pointerId)) return;
    apply(startW + (e.clientX - startX) / pxPerUnit);
  });
  const stop = (e) => {
    if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    handle.classList.remove('is-dragging');
  };
  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);

  handle.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 3;
    const keys = {
      ArrowRight: wdth + step, ArrowUp: wdth + step,
      ArrowLeft: wdth - step, ArrowDown: wdth - step,
      Home: WDTH_MIN, End: wdthMax(),
    };
    if (e.key in keys) { e.preventDefault(); apply(keys[e.key]); }
  });

  // één moment bij het laden: de cursor "jij" knijpt de titel van breed naar smal
  const intro = () => {
    if (reducedMotion) return;
    const from = wdthMax();
    const to = WDTH_START;
    const duration = 1600;
    let t0 = null;
    apply(from);
    cursor.style.transition = 'opacity .3s';
    cursor.style.opacity = '1';
    const tick = (now) => {
      if (t0 === null) t0 = now + 400;
      const p = Math.min(1, Math.max(0, (now - t0) / duration));
      const eased = 1 - Math.pow(1 - p, 3);
      apply(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(() => { cursor.style.opacity = '0'; }, 900);
    };
    requestAnimationFrame(tick);
  };

  size();
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(size, 120);
  });
  return { size, intro };
}

/* ---------- slimme kleurkeuze ----------
   Per zone (data-bg) kiezen we de kleuren op basis van contrast (WCAG):
   - tekst: licht of donker, wat het meest contrasteert met de achtergrond
   - zachte tekst: zo dicht mogelijk bij de achtergrond, maar minstens 5.5:1
   - vormen: palet in vaste volgorde, zonder kleuren die wegvallen (< 1.5:1)
   - citaat: hoofdkleur als die groot leesbaar is (>= 3:1), anders tekstkleur
   - accent: krijgt een rand als het zelf te weinig contrasteert (< 3:1) */

const BRAND = ['light', 'dark', 'primary', 'secondary', 'neutral', 'accent'];
const SHAPE_ORDER = ['primary', 'secondary', 'neutral', 'dark', 'light'];

function toRgb(value) {
  const probe = document.createElement('i');
  probe.style.color = value;
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color.match(/[\d.]+/g).slice(0, 3).map(Number);
  probe.remove();
  return rgb;
}

const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const mix = (a, b, t) => a.map((v, k) => Math.round(v * (1 - t) + b[k] * t));
const css = (rgb) => `rgb(${rgb.join(' ')})`;

function smartColors(root = document) {
  const styles = getComputedStyle(document.documentElement);
  const palette = Object.fromEntries(BRAND.map((n) => [n, toRgb(styles.getPropertyValue(`--brand-${n}`).trim())]));
  const best = (bg) => (contrast(palette.dark, bg) >= contrast(palette.light, bg) ? palette.dark : palette.light);

  root.querySelectorAll('[data-bg]').forEach((el) => {
    const name = el.dataset.bg;
    const bg = palette[name];
    if (!bg) return;
    const fg = best(bg);

    let soft = fg;
    for (let t = 0.6; t > 0; t -= 0.05) {
      const candidate = mix(fg, bg, t);
      if (contrast(candidate, bg) >= 5.5) { soft = candidate; break; }
    }

    const shapes = SHAPE_ORDER
      .filter((n) => n !== name && contrast(palette[n], bg) >= 1.5)
      .map((n) => palette[n]);
    while (shapes.length < 3) shapes.push(fg);

    const accentOk = contrast(palette.accent, bg) >= 3;
    const set = (prop, val) => el.style.setProperty(prop, css(val));
    set('--bg', bg);
    set('--fg', fg);
    set('--soft', soft);
    shapes.slice(0, 3).forEach((c, k) => set(`--s${k + 1}`, c));
    set('--quote', contrast(shapes[0], bg) >= 3 ? shapes[0] : fg);
    set('--on-accent', best(palette.accent));
    el.style.setProperty('--accent-edge', accentOk ? 'transparent' : css(fg));
  });
}

/* ---------- menu + voortgang ---------- */

function setupMenu() {
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('menu');
  let timer;

  const setOpen = (open) => {
    clearTimeout(timer);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Sluiten' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      timer = setTimeout(() => { menu.hidden = true; }, 500);
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

function setupProgress() {
  const bar = document.querySelector('.progress__bar');
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
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
  smartColors();
  try {
    const doc = parseMarkdown(await loadMarkdown());
    renderHero(doc);
    renderChapters(doc);
    smartColors();
  } catch (err) {
    document.querySelector('.hero__title').textContent = 'content.md kon niet geladen worden';
    document.querySelector('.hero__lead').innerHTML =
      'Voer <code>node build.js</code> uit in de map v2 om js/content.js aan te maken, of open de pagina via een lokale server.';
    console.error(err);
    return;
  }

  const hero = setupHero();
  setupProgress();
  // three-scene.js zet de vormen hierna om naar 3D (de SVG blijft als terugval)
  document.dispatchEvent(new CustomEvent('dvg:rendered'));
  if (document.fonts) {
    document.fonts.ready.then(() => { hero.size(); hero.intro(); });
  } else {
    hero.intro();
  }
}

init();
