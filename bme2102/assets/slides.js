/* BME 2102 interactive notes: slide view. Turns the page into slides, one idea per slide.
   The page's own elements are moved (not copied), so every figure, control and example keeps working.
   Add ?view=page to the address to read it as one scrolling page instead. */
/* typeset the formulas in the text (page and slide view) */
if (window.mathify) mathify(document, 'main .sec p, main .sec li:not(.toc li), main .eq .w, main td, main .note');
(() => {
'use strict';
if (new URLSearchParams(location.search).get('view') === 'page'){
  const a = document.createElement('a'); a.href = location.pathname + location.hash.replace(/^#slide-\d+/, ''); a.textContent = 'Show as slides'; a.className = 'toslides';
  const bar = document.querySelector('.sitebar'); if (bar) bar.appendChild(a); return; }
document.documentElement.classList.add('slidemode');
const main = document.querySelector('main'), header = document.querySelector('header.top'), chapter = header.querySelector('h1').textContent, eyebrow = header.querySelector('.eyebrow').textContent;
const slides = [];   // { sec, title, el, secId }
const SECOF = {}; let CURSEC = null;
const deck = document.createElement('div'); deck.className = 'deck'; deck.setAttribute('aria-live', 'polite');
function newSlide(secTitle, num, sub, kind){ const s = document.createElement('section'); s.className = 'slide' + (kind ? ' ' + kind : ''); s.setAttribute('aria-roledescription', 'slide');
  const h = document.createElement('div'); h.className = 'slidehead'; h.innerHTML = `<span class="sn">${num}</span><h2>${secTitle}</h2>${sub ? `<span class="ss">${sub}</span>` : ''}`; s.appendChild(h);
  const body = document.createElement('div'); body.className = 'slidebody'; s.appendChild(body); deck.appendChild(s); slides.push({ sec:num, title:secTitle, sub, el:s, body, secId:CURSEC }); return body; }
// title slide
{ const s = document.createElement('section'); s.className = 'slide title'; s.innerHTML = `<div class="tbox"><div class="eyebrow">${eyebrow}</div><h1>${chapter}</h1></div>`;
  s.querySelector('.tbox').appendChild(header.querySelector('p')); const ol = document.createElement('ol'); ol.className = 'tlist';
  main.querySelectorAll('section.sec').forEach(sec => { const h2 = sec.querySelector('h2'); if (!h2 || sec.id === 'refs') return; const li = document.createElement('li'); li.innerHTML = `<span>${h2.querySelector('.n').textContent}</span>${h2.childNodes[1] ? h2.childNodes[1].textContent : h2.textContent}`; li.dataset.sec = sec.id; ol.appendChild(li); });
  s.querySelector('.tbox').appendChild(ol); const hint = document.createElement('p'); hint.className = 'hint'; hint.innerHTML = 'Click or press Space or the right arrow key for the next slide, and the left arrow key to go back. You can also <a href="?view=page">read it as one page</a>.'; s.querySelector('.tbox').appendChild(hint);
  deck.appendChild(s); slides.push({ sec:'', title:chapter, el:s, body:s }); }
// content slides
const BIG = el => el.matches('.panel, details.ex, .quiz, .tablewrap, table');
const textLen = el => (el.textContent || '').length;
main.querySelectorAll('section.sec').forEach(sec => {
  CURSEC = sec.id; SECOF[sec.id] = true;
  const h2 = sec.querySelector('h2'), num = h2.querySelector('.n').textContent, title = h2.childNodes[1] ? h2.childNodes[1].textContent : h2.textContent;
  const kids = [...sec.children].filter(c => c !== h2);
  if (sec.id === 'quiz'){ const qz = sec.querySelector('.quiz'); const qs = [...qz.querySelectorAll('.q')], score = qz.querySelector('.score');
    qs.forEach((q, i) => { const b = newSlide(title, num, `question ${i + 1} of ${qs.length}`, 'qslide'); const wrap = document.createElement('div'); wrap.className = 'quiz'; wrap.appendChild(q); b.appendChild(wrap); if (i === qs.length - 1 && score) b.appendChild(score); });
    return; }
  if (sec.id === 'refs'){ const b = newSlide(title, num, '', 'refs'); kids.forEach(k => b.appendChild(k)); return; }
  let body = null, len = 0, sub = '', n = 0;
  const flush = () => { body = null; len = 0; };
  for (const k of kids){
    if (k.tagName === 'H3'){ flush(); sub = k.textContent; body = newSlide(title, num, sub); n++; continue; }
    if (BIG(k)){ // a figure or worked example gets its own slide, with any short lead-in text kept above it
      const lead = body && len < 260 && body.children.length && !body.querySelector('.panel, details') ? body : null;
      let b; if (lead){ b = lead; b.parentElement.classList.add('withfig'); } else { b = newSlide(title, num, k.matches('details.ex') ? '' : sub); n++; }
      if (k.matches('details.ex')){ k.open = true; b.parentElement.classList.add('exslide'); const sm = k.querySelector('summary'); sm.addEventListener('click', e => e.preventDefault()); }
      b.appendChild(k); flush(); continue; }
    const L = textLen(k);
    if (!body || len + L > 1250 || body.querySelector('.panel, details')){ body = newSlide(title, num, sub); n++; len = 0; }
    body.appendChild(k); len += L; }
});
// put the deck in place of the page layout
const wrap = document.querySelector('.wrap'); wrap.innerHTML = ''; wrap.appendChild(deck);
document.querySelector('.sitebar').remove();
// controls
const ui = document.createElement('div'); ui.className = 'deckbar';
const pages = document.querySelectorAll('link[rel=next], link[rel=prev]');
ui.innerHTML = `<a class="home" href="./" title="All chapters">BME 2102</a><span class="where"><b class="ch">${chapter}</b><span class="st"></span></span>
  <select class="jump" aria-label="Go to slide"></select>
  <span class="count" aria-live="polite"></span>
  <button type="button" class="prev" aria-label="Previous slide">Back</button><button type="button" class="next primary" aria-label="Next slide">Next</button>
  <button type="button" class="fs" title="Full screen (F)" aria-label="Full screen">Full screen</button>
  <button type="button" class="pdf" title="Opens the print dialog: choose Save as PDF">Export PDF</button>
  <a class="pagev" href="?view=page" title="Read as one scrolling page">Page view</a><div class="prog"><i></i></div>`;
document.body.appendChild(ui);
const sel = ui.querySelector('.jump'); sel.innerHTML = slides.map((s, i) => `<option value="${i}">${i + 1}. ${s.sec ? s.sec + ' ' : ''}${s.title}${s.sub ? ' – ' + s.sub : ''}</option>`).join('');
let cur = -1;
function go(i, focus){ i = Math.max(0, Math.min(slides.length - 1, i)); if (i === cur) return; const prev = slides[cur];
  if (prev) prev.el.classList.remove('on'); cur = i; const s = slides[i]; s.el.classList.add('on'); s.el.scrollTop = 0;
  ui.querySelector('.st').textContent = s.sec ? `${s.sec} ${s.title}` : ''; ui.querySelector('.count').textContent = `${i + 1} / ${slides.length}`;
  ui.querySelector('.prog i').style.width = `${100*(i + 1)/slides.length}%`; sel.value = i; ui.querySelector('.prev').disabled = i === 0;
  const nx = ui.querySelector('.next'); nx.textContent = i === slides.length - 1 ? (NEXTCH ? 'Next chapter' : 'End') : 'Next';
  history.replaceState(null, '', `#slide-${i + 1}`);
  window.dispatchEvent(new Event('resize')); setTimeout(() => moreCue(s.el), 60); }
const cue = document.createElement('div'); cue.className = 'morecue'; cue.textContent = 'Scroll for more'; document.body.appendChild(cue);
function moreCue(el){ const more = el.scrollHeight - el.clientHeight - el.scrollTop > 30; cue.classList.toggle('show', more); }
deck.addEventListener('scroll', e => moreCue(e.target), true);
const order = ['intro.html', 'mechanisms.html', 'velocity.html', 'belts.html', 'gearing.html', 'cams.html', 'balancing.html'], me = location.pathname.split('/').pop(), NEXTCH = order[order.indexOf(me) + 1];
const next = () => { if (cur === slides.length - 1){ if (NEXTCH) location.href = NEXTCH; return; } go(cur + 1); }, prev = () => go(cur - 1);
ui.querySelector('.next').addEventListener('click', next); ui.querySelector('.prev').addEventListener('click', prev); sel.addEventListener('change', () => go(+sel.value));
// title slide: clicking a section jumps to it
slides[0].el.querySelectorAll('.tlist li').forEach(li => li.addEventListener('click', e => { e.stopPropagation(); const i = slides.findIndex(s => s.sec && s.sec === li.querySelector('span').textContent); if (i >= 0) go(i); }));
// keyboard (not while typing in a field)
document.addEventListener('keydown', e => { const t = e.target; if (t.matches && t.matches('input, select, textarea, [contenteditable]')) return; if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)){ if (e.key === ' ' && t.matches && t.matches('button, summary, a')) return; e.preventDefault(); next(); }
  else if (['ArrowLeft', 'PageUp'].includes(e.key)){ e.preventDefault(); prev(); } else if (e.key === 'Home'){ e.preventDefault(); go(0); } else if (e.key === 'End'){ e.preventDefault(); go(slides.length - 1); } else if (e.key === 'f' || e.key === 'F'){ e.preventDefault(); toggleFS(); } });
// click on plain parts of a slide advances; anything interactive is left alone
const INTERACTIVE = 'a, button, input, select, textarea, label, summary, canvas, details .exbody, .panel, table, .q, .chips, [role=button]';
deck.addEventListener('click', e => { if (window.getSelection && String(window.getSelection()).length) return; if (e.target.closest(INTERACTIVE)) return; const r = deck.getBoundingClientRect(); if (e.clientX < r.left + r.width*0.2) prev(); else next(); });
// swipe on touch screens (not on figures)
let sx = null, sy = null; deck.addEventListener('touchstart', e => { if (e.target.closest('canvas, input, .panel')){ sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive:true });
deck.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5*Math.abs(dy)){ dx < 0 ? next() : prev(); } sx = null; }, { passive:true });
// buttons in the page that scroll to a section (e.g. "Draw it" in the cam examples) switch to that section's first figure slide instead
const origScroll = Element.prototype.scrollIntoView;
Element.prototype.scrollIntoView = function(o){ const id = this.id && SECOF[this.id] != null ? this.id : null;
  if (id){ const list = slides.map((s, i) => [s, i]).filter(([s]) => s.secId === id), fig = list.find(([s]) => s.el.querySelector('.panel')); go((fig || list[0])[1]); return; }
  const i = slides.findIndex(s => s.el.contains(this)); if (i >= 0){ go(i); return; } return origScroll.call(this, o); };
const m = location.hash.match(/^#slide-(\d+)/); go(m ? +m[1] - 1 : 0);
})();

/* ---------- full screen ---------- */
(() => {
  const btn = document.querySelector('.deckbar .fs'), root = document.documentElement; if (!btn) return;
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const can = !!(root.requestFullscreen || root.webkitRequestFullscreen);
  if (!can){ btn.hidden = true; }
  window.toggleFS = () => { if (!can) return; if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else { const p = (root.requestFullscreen || root.webkitRequestFullscreen).call(root); if (p && p.catch) p.catch(() => {}); } };
  btn.addEventListener('click', toggleFS);
  const bar = document.querySelector('.deckbar');
  // in full screen the bar is hidden at once; it comes back only while the mouse is at the very bottom edge
  const hide = () => { if (fsEl()) root.classList.add('barhid'); }, show = () => root.classList.remove('barhid');
  const change = () => { const on = !!fsEl(); root.classList.toggle('fsmode', on); btn.textContent = on ? 'Exit full screen' : 'Full screen'; if (on){ hide(); btn.blur(); } else show(); window.dispatchEvent(new Event('resize')); };
  document.addEventListener('fullscreenchange', change); document.addEventListener('webkitfullscreenchange', change);
  document.addEventListener('mousemove', e => { if (!fsEl()) return; const H = window.innerHeight; if (e.clientY >= H - 6) show(); else if (!bar.contains(e.target) && e.clientY < H - 64) hide(); });
  bar.addEventListener('mouseleave', hide);
  document.addEventListener('keydown', hide); document.querySelector('.deck').addEventListener('click', hide);
  ['.next', '.prev'].forEach(c => bar.querySelector(c).addEventListener('click', () => { hide(); bar.querySelector(c).blur(); }));
  // stay in full screen when moving to the next chapter: remember and offer to resume
  try { if (sessionStorage.getItem('bme-fs') === '1'){ sessionStorage.removeItem('bme-fs'); const tip = document.createElement('button'); tip.type = 'button'; tip.className = 'fsresume'; tip.textContent = 'Back to full screen'; tip.addEventListener('click', () => { tip.remove(); toggleFS(); }); document.body.appendChild(tip); setTimeout(() => tip.remove(), 8000); } } catch (e) {}
  window.addEventListener('beforeunload', () => { try { if (fsEl()) sessionStorage.setItem('bme-fs', '1'); } catch (e) {} });
})();

/* ---------- 16:9 stage: every slide is 1280 x 720, scaled to the window; the content of each slide is scaled to fill it ---------- */
(() => {
  const root = document.documentElement, deck = document.querySelector('.deck'), bar = document.querySelector('.deckbar'); if (!deck || !bar) return;
  const SW = 1280, SH = 720, MAXZ = 1.6, MINZ = 0.45;
  function layout(){ if (root.classList.contains('printing')) return; const hid = root.classList.contains('barhid') && root.classList.contains('fsmode');
    const W = window.innerWidth, H = window.innerHeight - (hid ? 0 : 56), s = Math.min(W/SW, H/SH);
    deck.style.transform = `translate(${Math.round((W - SW*s)/2)}px, ${Math.round((H - SH*s)/2)}px) scale(${s})`; window.DECK_SCALE = s;
    clearTimeout(layout.t); layout.t = setTimeout(() => { if (typeof redrawAll === 'function') redrawAll(); }, 150); }
  // scale a slide's body so it fills the space under the heading without spilling over
  function fit(sl){ const body = sl.querySelector(':scope > .slidebody'), box = body || sl.querySelector('.tbox'); if (!box) return;
    const head = sl.querySelector(':scope > .slidehead'), cs = getComputedStyle(sl), gap = parseFloat(cs.rowGap) || 12;
    const availH = SH - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - (head ? head.offsetHeight + gap : 0), availW = SW - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    let z = box.dataset.z ? +box.dataset.z : 1;
    for (let k = 0; k < 6; k++){ box.style.width = (availW/z) + 'px'; box.style.transform = `scale(${z})`; const h = box.offsetHeight*z;
      const t = Math.max(MINZ, Math.min(body ? MAXZ : 1.2, z*availH/h*0.985)); if (Math.abs(t - z) < 0.004) break; z = t; }
    box.style.width = (availW/z) + 'px'; box.style.transform = `scale(${z})`;
    for (let k = 0; k < 20 && box.offsetHeight*z > availH + 1 && z > MINZ; k++){ z = Math.max(MINZ, z*0.97); box.style.width = (availW/z) + 'px'; box.style.transform = `scale(${z})`; }
    // wide equations or tables must not be cut off at the right
    for (let k = 0; k < 4; k++){ let r = 1; box.querySelectorAll('.eq, .tablewrap, table, .katex-display').forEach(e => { if (e.clientWidth > 20) r = Math.max(r, e.scrollWidth/e.clientWidth); });
      if (r <= 1.01) break; z = Math.max(MINZ, z/r*0.99); box.style.width = (availW/z) + 'px'; box.style.transform = `scale(${z})`; }
    box.dataset.z = z; box.style.marginTop = '0px';
    const spare = availH - box.offsetHeight*z; if (spare > 40) box.style.marginTop = Math.round(spare*(body ? 0.35 : 0.5)) + 'px'; }
  const fitted = new WeakSet();
  function fitOn(){ const sl = deck.querySelector('.slide.on'); if (sl){ fit(sl); fitted.add(sl); clearTimeout(fitOn.t); fitOn.t = setTimeout(() => { if (sl.classList.contains('on')) fit(sl); }, 350); } }
  // content that grows later (a quiz explanation, a longer caption) refits that slide
  const ro = new ResizeObserver(es => es.forEach(e => { const sl = e.target.closest('.slide'); if (!sl || !sl.classList.contains('on') || root.classList.contains('printing')) return;
    const b = e.target, z = +(b.dataset.z || 1), avail = SH - 60 - (sl.querySelector('.slidehead') ? sl.querySelector('.slidehead').offsetHeight + 12 : 0);
    if (b.offsetHeight*z > avail + 2 || b.offsetHeight*z < avail*0.8) { if (!b._t) b._t = setTimeout(() => { b._t = null; fit(sl); }, 120); } }));
  deck.querySelectorAll('.slide > .slidebody, .slide .tbox').forEach(b => ro.observe(b));
  window.addEventListener('resize', layout); document.addEventListener('fullscreenchange', () => setTimeout(layout, 60));
  new MutationObserver(() => { layout(); fitOn(); }).observe(root, { attributes:true, attributeFilter:['class'] });
  new MutationObserver(ms => { if (ms.some(m => m.target.classList && m.target.classList.contains('slide'))) fitOn(); }).observe(deck, { subtree:true, attributes:true, attributeFilter:['class'] });
  layout(); fitOn(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { deck.querySelectorAll('.slide').forEach(sl => { if (sl.classList.contains('on')) fit(sl); }); });
  window.deckStage = { layout, fit, fitAll:() => deck.querySelectorAll('.slide').forEach(fit) };

  /* export to PDF: one 16:9 page per slide */
  const pg = document.createElement('style'); pg.textContent = '@page{size:1280px 720px;margin:0}'; document.head.appendChild(pg);
  let busy = false, theme = null;
  function prep(){ if (busy) return; busy = true; theme = root.getAttribute('data-theme'); root.setAttribute('data-theme', 'light');
    deck.querySelectorAll('.exbody').forEach(b => b.classList.remove('steps-hidden')); root.classList.add('printing'); deck.style.transform = 'none';
    deck.querySelectorAll('.slide').forEach(fit); window.dispatchEvent(new Event('resize')); if (typeof redrawAll === 'function') redrawAll(); }
  function done(){ if (!busy) return; busy = false; root.classList.remove('printing'); if (theme == null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', theme); layout(); fitOn(); }
  bar.querySelector('.pdf').addEventListener('click', () => { prep(); setTimeout(() => { deck.querySelectorAll('.slide').forEach(fit); if (typeof redrawAll === 'function') redrawAll(); setTimeout(() => window.print(), 400); }, 500); });
  window.addEventListener('beforeprint', prep); window.addEventListener('afterprint', () => setTimeout(done, 100));
  window.deckPrint = { prep, done, fit:() => deck.querySelectorAll('.slide').forEach(fit) };
})();
