/* slides.js: turns a chapter page (section.sec blocks) into a 16:9 deck.
   Elements are moved, not copied, so every control keeps working.
   ?view=page shows the same content as one scrolling page. */
(function () {
  'use strict';
  var root = document.documentElement;
  var doc = document.getElementById('doc');
  if (!doc) return;
  var params = new URLSearchParams(location.search);
  var pageView = params.get('view') === 'page';
  var Deck = window.Deck = { slides: [], idx: 0, pageView: pageView, onShow: [] };

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* quiz behaviour: works in both views */
  function setupQuiz() {
    document.querySelectorAll('.quiz .q').forEach(function (q) {
      var ans = +q.dataset.a;
      var lis = q.querySelectorAll('ol.opts > li');
      lis.forEach(function (li, i) {
        li.addEventListener('click', function () {
          if (q.classList.contains('done')) return;
          q.classList.add('done');
          if (i === ans) li.classList.add('right');
          else { li.classList.add('wrong'); lis[ans].classList.add('right'); }
        });
      });
    });
  }

  /* is this element currently on screen (visible slide or page view)? */
  Deck.visible = function (node) {
    if (pageView) return true;
    if (root.classList.contains('printing')) return true;
    var s = node.closest('.slide');
    return !!(s && s.classList.contains('cur'));
  };

  var head = doc.querySelector('header.chead');
  var chNum = head ? head.dataset.ch : '';
  var chShort = head ? head.dataset.short : '';
  var chLabel = head ? (head.dataset.label || 'Chapter ' + chNum) : '';

  if (pageView) {
    var ph = document.querySelector('.sitebar');
    if (ph) ph.insertAdjacentHTML('beforeend', '<a href="' + location.pathname.split('/').pop() + '">Slide view</a>');
    setupQuiz();
    return;
  }

  root.classList.add('deck');
  var W = 1280, H = 720;
  var wrap = el('div', 'stagewrap'), stage = el('div', 'stage');
  wrap.appendChild(stage); document.body.appendChild(wrap);
  var slides = Deck.slides;

  /* ---- title slide ---- */
  function titleSlide() {
    var s = el('div', 'slide title');
    var course = head.querySelector('.course'), h1 = head.querySelector('h1'), who = head.querySelector('.who');
    var left = el('div', 'tl');
    left.appendChild(el('div', 'course', course ? course.innerHTML : ''));
    left.appendChild(el('h1', '', h1 ? h1.innerHTML : document.title));
    left.appendChild(el('div', 'bar'));
    left.appendChild(el('div', 'who', who ? who.innerHTML : ''));
    var toc = el('div', 'toc', '<h4>Contents</h4>');
    var ol = el('ol');
    doc.querySelectorAll('section.sec').forEach(function (sec) {
      var h2 = sec.querySelector('h2'); if (!h2) return;
      var li = el('li', '', h2.innerHTML);
      li.dataset.sec = sec.id;
      ol.appendChild(li);
    });
    toc.appendChild(ol);
    var box = el('div', 'tbox'); box.appendChild(left); box.appendChild(toc);
    s.appendChild(box);
    s.dataset.title = h1 ? h1.textContent : 'Title';
    s.dataset.sec = '';
    return s;
  }
  slides.push(titleSlide());

  /* ---- content slides ---- */
  var HEAVY = '.sim,.m3d,[data-model],[id^="sim-"]';
  var BIG = '.panel,figure,table,details.ex,.sim,.m3d,.quiz,.photogrid,.big';
  var LIMIT = 900;
  function weight(n) {
    var w = (n.textContent || '').replace(/\s+/g, ' ').length;
    n.querySelectorAll('.katex').forEach(function (k) { w -= (k.textContent || '').length; w += k.closest('.katex-display') ? 0 : 8; });
    w += 110 * n.querySelectorAll('.katex-display').length;

    w += 260 * n.querySelectorAll('svg,img,canvas').length;
    if (n.tagName === 'UL' || n.tagName === 'OL') w += 40 * n.children.length;
    return w;
  }

  var secOf = {};
  document.querySelectorAll('#doc section.sec').forEach(function (sec) {
    var h2 = sec.querySelector('h2');
    var h2html = h2 ? h2.innerHTML : '';
    var h2text = h2 ? h2.textContent.replace(/^\s*[\d.]+\s*/, '') : '';
    var cur = null, h3 = null, wsum = 0, first = true;

    function newSlide() {
      var s = el('div', 'slide');
      var sh = el('div', 'sh' + (h3 ? ' sub' : ''));
      sh.appendChild(el('h2', '', h2html));
      if (h3) sh.appendChild(el('h3', '', h3));
      s.appendChild(sh);
      var sb = el('div', 'sb'); var fb = el('div', 'fitbox'); sb.appendChild(fb); s.appendChild(sb);
      s.appendChild(el('div', 'pg'));
      s.dataset.sec = sec.id; s.dataset.sectitle = h2text;
      s.dataset.title = h3 ? h3.replace(/<[^>]+>/g, '') : h2text;
      if (first) { secOf[sec.id] = slides.length; first = false; }
      slides.push(s);
      cur = { s: s, fb: fb, full: false, n: 0 }; wsum = 0;
      return cur;
    }
    var kids = Array.prototype.slice.call(sec.children);
    kids.forEach(function (c) {
      if (c.tagName === 'H2') return;
      if (c.tagName === 'H3') { h3 = c.innerHTML; newSlide(); return; }
      if (c.matches('hr.brk')) { newSlide(); return; }
      if (c.matches('.quiz')) {
        var intro = Array.prototype.filter.call(c.children, function (k) { return !k.matches('.q'); });
        c.querySelectorAll('.q').forEach(function (q, i) {
          newSlide();
          var qz = el('div', 'quiz');
          if (i === 0) intro.forEach(function (k) { qz.appendChild(k); });
          qz.appendChild(q); cur.fb.appendChild(qz); cur.full = true;
        });
        return;
      }
      if (c.matches(BIG)) {
        var lead = null;
        if (cur && cur.fb.lastElementChild && cur.fb.lastElementChild.matches('.lead')) lead = cur.fb.lastElementChild;
        if (!cur || cur.n > (lead ? 1 : 0)) {
          newSlide();
          if (lead) { cur.fb.appendChild(lead); cur.n++; }
        }
        cur.fb.appendChild(c); cur.n++; cur.full = true;
        return;
      }
      var w = weight(c);
      if (c.matches('.keep') && cur) { cur.fb.appendChild(c); cur.n++; wsum += w; return; }
      if (!cur || cur.full || (cur.n > 0 && wsum + w > LIMIT)) newSlide();
      cur.fb.appendChild(c); cur.n++; wsum += w;
    });
  });
  slides.forEach(function (s, i) {
    var pg = s.querySelector('.pg'); if (pg) pg.textContent = (i + 1);
    stage.appendChild(s);
  });
  doc.innerHTML = '';
  setupQuiz();

  /* title contents links */
  slides[0].querySelectorAll('.toc li').forEach(function (li) {
    li.addEventListener('click', function () { if (secOf[li.dataset.sec] != null) go(secOf[li.dataset.sec]); });
  });

  /* ---- fit text to fill the slide body ---- */
  function fit(s) {
    var sb = s.querySelector('.sb'), fb = s.querySelector('.fitbox');
    if (!sb || !fb) return;
    var BW = sb.clientWidth, BH = sb.clientHeight;
    if (!BW || !BH) return;
    var heavy = fb.querySelector(HEAVY);
    var z = heavy ? 1.12 : 1.7, zmin = 0.5;
    for (var k = 0; k < 60; k++) {
      fb.style.width = (BW / z) + 'px';
      fb.style.transform = 'scale(' + z + ')';
      var h = fb.scrollHeight * z, w = fb.scrollWidth * z;
      if ((h <= BH - 4 && w <= BW + 1) || z <= zmin) break;
      z *= 0.97;
    }
    s._z = z; s._fitted = true; s._h = fb.scrollHeight;
  }
  Deck.fit = fit;
  function needsRefit(s) {
    var sb = s.querySelector('.sb'), fb = s.querySelector('.fitbox');
    if (!sb || !fb || !s._z) return true;
    var h = fb.scrollHeight * s._z;
    return h > sb.clientHeight + 0.5 || (h < sb.clientHeight * 0.86 && s._z < (fb.querySelector(HEAVY) ? 1.12 : 1.7) - 0.01);
  }
  var timers = new WeakMap();
  slides.forEach(function (s) {
    var fb = s.querySelector('.fitbox'); if (!fb) return;
    new MutationObserver(function () {
      if (!s.classList.contains('cur') && !root.classList.contains('printing')) { s._fitted = false; return; }
      clearTimeout(timers.get(s));
      timers.set(s, setTimeout(function () { if (needsRefit(s)) fit(s); }, 120));
    }).observe(fb, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
  });
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (en) {
        var s = en.target.closest('.slide');
        if (!s || !s.classList.contains('cur')) { if (s) s._fitted = false; return; }
        clearTimeout(timers.get(s));
        timers.set(s, setTimeout(function () { if (needsRefit(s)) fit(s); }, 150));
      });
    });
    slides.forEach(function (s) { s.querySelectorAll('.m3d, .sim, img, figure').forEach(function (n) { ro.observe(n); }); });
  }
  document.addEventListener('load', function (e) {
    if (e.target.tagName !== 'IMG') return;
    var s = e.target.closest && e.target.closest('.slide');
    if (s) { if (s.classList.contains('cur')) fit(s); else s._fitted = false; }
  }, true);

  /* ---- stage scaling ---- */
  function resize() {
    var w = wrap.clientWidth, h = wrap.clientHeight;
    var sc = Math.min(w / W, h / H);
    Deck.scale = sc;
    stage.style.transform = 'translate(' + ((w - W * sc) / 2) + 'px,' + ((h - H * sc) / 2) + 'px) scale(' + sc + ')';
  }
  window.addEventListener('resize', resize);

  /* ---- bottom bar ---- */
  var bar = el('div', 'deckbar');
  bar.innerHTML =
    '<div class="prog"></div>' +
    '<a href="./" title="All chapters">Home</a>' +
    '<div class="where"></div>' +
    '<select class="jump" title="Jump to slide"></select>' +
    '<button class="prev" title="Previous slide">Previous</button>' +
    '<span class="cnt"></span>' +
    '<button class="next" title="Next slide">Next</button>' +
    '<a class="opt pv" href="?view=page" title="Show as one scrolling page">Page view</a>' +
    '<button class="opt fs" title="Full screen">Full screen</button>' +
    '<button class="opt pdf" title="Save the deck as PDF">PDF</button>';
  document.body.appendChild(bar);
  var jump = bar.querySelector('.jump');
  slides.forEach(function (s, i) {
    var o = document.createElement('option'); o.value = i;
    o.textContent = (i + 1) + '. ' + (s.dataset.title || '').slice(0, 60);
    jump.appendChild(o);
  });
  jump.addEventListener('change', function () { go(+jump.value); jump.blur(); });
  bar.querySelector('.prev').addEventListener('click', function () { go(Deck.idx - 1); });
  bar.querySelector('.next').addEventListener('click', function () { go(Deck.idx + 1); });
  bar.querySelector('.fs').addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (root.requestFullscreen) root.requestFullscreen();
  });
  bar.querySelector('.pdf').addEventListener('click', function () { window.print(); });

  function updateBar() {
    var s = slides[Deck.idx];
    var where = bar.querySelector('.where');
    where.innerHTML = '<b>' + chLabel + '</b> ' + (s.dataset.sectitle ? s.dataset.sectitle : (chShort || ''));
    bar.querySelector('.cnt').textContent = (Deck.idx + 1) + ' / ' + slides.length;
    bar.querySelector('.prog').style.width = (100 * (Deck.idx + 1) / slides.length) + '%';
    jump.value = Deck.idx;
  }

  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    var old = slides[Deck.idx];
    if (old) old.classList.remove('cur');
    Deck.idx = i;
    var s = slides[i];
    s.classList.add('cur');
    if (!s._fitted) fit(s);
    updateBar();
    try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) { }
    var ev = new CustomEvent('deck:show', { detail: { slide: s, index: i } });
    document.dispatchEvent(ev);
  }
  Deck.go = go;

  /* keys */
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key;
    if (k === ' ' || k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown') { e.preventDefault(); go(Deck.idx + (e.shiftKey && k === ' ' ? -1 : 1)); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); go(Deck.idx - 1); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(slides.length - 1); }
  });

  /* touch swipe (not on controls or canvases) */
  var tx = null, ty = null;
  wrap.addEventListener('touchstart', function (e) {
    if (e.target.closest('input,select,button,canvas,.m3d,.sim .view')) { tx = null; return; }
    tx = e.touches[0].clientX; ty = e.touches[0].clientY;
  }, { passive: true });
  wrap.addEventListener('touchend', function (e) {
    if (tx == null) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(Deck.idx + (dx < 0 ? 1 : -1));
    tx = null;
  });

  /* full screen: hide the bar when the mouse is idle, show it near the bottom edge */
  var idle = null;
  function arm() {
    clearTimeout(idle);
    idle = setTimeout(function () { if (root.classList.contains('fsmode')) root.classList.add('barhid'); }, 1800);
  }
  document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement) { root.classList.add('fsmode'); arm(); bar.querySelector('.fs').textContent = 'Exit full screen'; }
    else { root.classList.remove('fsmode', 'barhid'); bar.querySelector('.fs').textContent = 'Full screen'; }
    setTimeout(resize, 60);
  });
  document.addEventListener('mousemove', function (e) {
    if (!root.classList.contains('fsmode')) return;
    if (e.clientY > window.innerHeight - 90) { root.classList.remove('barhid'); clearTimeout(idle); }
    else if (!root.classList.contains('barhid')) arm();
  });

  /* PDF: all slides one per page, light theme, bar hidden, canvases redrawn */
  var opened = [];
  window.addEventListener('beforeprint', function () {
    root.classList.add('printing');
    opened = [];
    document.querySelectorAll('details.ex:not([open])').forEach(function (d) { d.open = true; opened.push(d); });
    slides.forEach(function (s) { fit(s); });
    document.dispatchEvent(new Event('deck:print'));
  });
  window.addEventListener('afterprint', function () {
    root.classList.remove('printing');
    opened.forEach(function (d) { d.open = false; });
    slides.forEach(function (s) { s._fitted = false; });
    resize(); fit(slides[Deck.idx]);
    document.dispatchEvent(new Event('deck:afterprint'));
  });

  /* start */
  resize();
  var start = parseInt((location.hash || '').slice(1), 10);
  go(isNaN(start) ? 0 : start - 1);
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () {
    slides.forEach(function (s) { s._fitted = false; }); fit(slides[Deck.idx]);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { slides.forEach(function (s) { s._fitted = false; }); fit(slides[Deck.idx]); });
})();
