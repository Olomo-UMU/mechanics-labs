/* common.js: shared helpers for the live models, plus mathify for plain-text symbols */
(function () {
  'use strict';
  var U = window.U = {};
  var GREEK = 'αβγδεζηθικλμνξπρστυφχψωΔΦΩΣΘ';

  U.$ = function (s, r) { return (r || document).querySelector(s); };
  U.el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  U.clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  U.rad = function (d) { return d * Math.PI / 180; };
  U.deg = function (r) { return r * 180 / Math.PI; };

  /* number formatting: about 3 to 4 significant figures, no exponent for normal ranges */
  U.f = function (x, sig) {
    if (x == null || !isFinite(x)) return x === Infinity ? 'infinite' : '—';
    sig = sig || 4;
    var a = Math.abs(x);
    if (a === 0) return '0';
    if (a >= 1e6 || a < 1e-4) return x.toExponential(2).replace('e', ' × 10^').replace(/\^\+?(-?\d+)/, function (m, p) { return '<sup>' + p + '</sup>'; });
    var d = Math.max(0, sig - 1 - Math.floor(Math.log10(a)));
    var s = x.toFixed(Math.min(d, 6));
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (a >= 1000) { var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' '); s = p.join('.'); }
    return s.replace(/^-/, '−');
  };

  /* plain text symbols to HTML: single letters and Greek italic, _x subscripts, ^x superscripts */
  U.m = function (str) {
    var out = '', i = 0, s = String(str);
    function grp() {
      if (s[i] === '{') { var j = s.indexOf('}', i); var g = s.slice(i + 1, j); i = j + 1; return g; }
      var c = s[i]; i++; return c;
    }
    while (i < s.length) {
      var c = s[i];
      if (c === '_') { i++; out += '<sub>' + U.m(grp()) + '</sub>'; continue; }
      if (c === '^') { i++; out += '<sup>' + U.m(grp()) + '</sup>'; continue; }
      if (/[A-Za-z]/.test(c)) {
        var j = i; while (j < s.length && /[A-Za-z]/.test(s[j])) j++;
        var word = s.slice(i, j); i = j;
        out += word.length === 1 ? '<i>' + word + '</i>' : word;
        continue;
      }
      if (GREEK.indexOf(c) >= 0 && 'ΔΦΩΣΘ'.indexOf(c) < 0) { out += '<i>' + c + '</i>'; i++; continue; }
      if (c === '<') out += '&lt;'; else if (c === '>') out += '&gt;'; else out += c;
      i++;
    }
    return out;
  };
  window.mathify = function (rootEl) {
    (rootEl || document).querySelectorAll('.mf').forEach(function (e) { if (!e._mf) { e.innerHTML = U.m(e.textContent); e._mf = 1; } });
  };

  /* ---- controls ---- */
  /* spec: {id,label,min,max,step,value,unit,fmt} ; returns object with .v() */
  U.slider = function (parent, sp, onchange) {
    var row = U.el('div', 'row');
    var lab = U.el('label', '', U.m(sp.label) + (sp.unit ? ' <span class="muted">(' + sp.unit + ')</span>' : ''));
    var out = U.el('output');
    var inp = U.el('input'); inp.type = 'range'; inp.min = sp.min; inp.max = sp.max; inp.step = sp.step || 'any'; inp.value = sp.value;
    inp.setAttribute('aria-label', sp.label.replace(/[_^{}]/g, ''));
    row.appendChild(lab); row.appendChild(out); row.appendChild(inp);
    parent.appendChild(row);
    var fmt = sp.fmt || function (v) { return U.f(v, 3); };
    function show() { out.innerHTML = fmt(+inp.value); }
    inp.addEventListener('input', function () { show(); if (onchange) onchange(); });
    show();
    return { input: inp, row: row, v: function () { return +inp.value; }, set: function (v) { inp.value = v; show(); } };
  };
  U.select = function (parent, label, options, onchange) {
    var row = U.el('div', 'row');
    var lab = U.el('label', '', U.m(label));
    var sel = U.el('select');
    options.forEach(function (o) { var op = U.el('option', '', o[1]); op.value = o[0]; sel.appendChild(op); });
    sel.style.gridColumn = '1/3';
    row.appendChild(lab); row.appendChild(U.el('span')); row.appendChild(sel);
    parent.appendChild(row);
    sel.addEventListener('change', function () { if (onchange) onchange(); });
    return { sel: sel, v: function () { return sel.value; }, set: function (v) { sel.value = v; } };
  };
  U.check = function (parent, label, checked, onchange) {
    var lab = U.el('label', 'chk');
    var c = U.el('input'); c.type = 'checkbox'; c.checked = !!checked;
    lab.appendChild(c); lab.appendChild(U.el('span', '', label));
    parent.appendChild(lab);
    c.addEventListener('change', function () { if (onchange) onchange(); });
    return { box: c, v: function () { return c.checked; } };
  };
  U.buttons = function (parent, list) {
    var d = U.el('div', 'btns');
    var res = {};
    list.forEach(function (b) { var bt = U.el('button', '', b[1]); bt.type = 'button'; bt.addEventListener('click', b[2]); d.appendChild(bt); res[b[0]] = bt; });
    parent.appendChild(d);
    return res;
  };
  /* outputs grid: items [[key,label,unit]] */
  U.outputs = function (parent, items) {
    var g = U.el('div', 'out'), map = {};
    items.forEach(function (it) {
      var d = U.el('div', '', '<span>' + U.m(it[1]) + (it[2] ? ' (' + it[2] + ')' : '') + '</span><b>—</b>');
      g.appendChild(d); map[it[0]] = d.querySelector('b');
    });
    parent.appendChild(g);
    return function (vals) { for (var k in vals) if (map[k]) map[k].innerHTML = vals[k]; };
  };
  U.msg = function (parent) {
    var d = U.el('div', 'msg'); parent.appendChild(d);
    return function (html, kind) { d.innerHTML = html; d.className = 'msg ' + (kind || ''); };
  };

  /* build the standard sim layout inside a container */
  U.simShell = function (host, wide) {
    host.classList.add('sim'); if (wide) host.classList.add('wide');
    var ctl = U.el('div', 'ctl'), view = U.el('div', 'view');
    host.appendChild(ctl); host.appendChild(view);
    return { ctl: ctl, view: view };
  };

  /* ---- canvas ---- */
  U.canvas = function (parent, w, h) {
    var c = U.el('canvas'); var k = 2;
    c.width = w * k; c.height = h * k;
    c.style.aspectRatio = w + ' / ' + h;
    parent.appendChild(c);
    var ctx = c.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.W = w; ctx.H = h;
    ctx.clear = function () { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.restore(); };
    return ctx;
  };
  /* convert pointer event to canvas drawing units */
  U.ptr = function (ctx, e) {
    var r = ctx.canvas.getBoundingClientRect();
    var p = e.touches ? e.touches[0] : e;
    return { x: (p.clientX - r.left) * ctx.W / r.width, y: (p.clientY - r.top) * ctx.H / r.height };
  };
  U.FONT = '"Roboto",system-ui,sans-serif';
  U.C = { ink: '#1b1d21', ink2: '#4a4f57', mute: '#8a9099', line: '#d9dce1', grid: '#eceef1', red: '#a8141c', blue: '#1d5fae', green: '#1d7a46', amber: '#b86a00', violet: '#6a3fa0', steel: '#6d7682', fill: '#e7eaee' };

  U.line = function (ctx, pts, col, w, dash) {
    if (pts.length < 2) return;
    ctx.save(); ctx.strokeStyle = col || U.C.ink; ctx.lineWidth = w || 1.5; ctx.setLineDash(dash || []);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) { if (pts[i] == null) continue; ctx.lineTo(pts[i][0], pts[i][1]); }
    ctx.stroke(); ctx.restore();
  };
  U.arrow = function (ctx, x1, y1, x2, y2, col, w, hs) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 0.5) return;
    hs = Math.min(hs || 10, L * 0.6); w = w || 2;
    var ux = dx / L, uy = dy / L;
    ctx.save(); ctx.strokeStyle = ctx.fillStyle = col || U.C.ink; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hs * 0.8, y2 - uy * hs * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * hs - uy * hs * 0.42, y2 - uy * hs + ux * hs * 0.42);
    ctx.lineTo(x2 - ux * hs + uy * hs * 0.42, y2 - uy * hs - ux * hs * 0.42);
    ctx.closePath(); ctx.fill(); ctx.restore();
  };
  U.dot = function (ctx, x, y, r, fill, stroke) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = fill || '#fff'; ctx.fill();
    if (stroke !== false) { ctx.strokeStyle = stroke || U.C.ink; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.restore();
  };
  /* a bar link drawn as a rounded thick line with pin holes */
  U.link = function (ctx, a, b, col, w) {
    ctx.save(); ctx.strokeStyle = col || U.C.steel; ctx.lineWidth = w || 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore();
  };
  U.pin = function (ctx, p, r) { U.dot(ctx, p[0], p[1], r || 4.5, '#fff', U.C.ink); };
  /* fixed pivot with hatched ground */
  U.ground = function (ctx, p, r) {
    r = r || 6;
    ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = U.C.ink; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] - 11, p[1] + 16); ctx.lineTo(p[0] + 11, p[1] + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p[0] - 16, p[1] + 16); ctx.lineTo(p[0] + 16, p[1] + 16); ctx.stroke();
    for (var i = -14; i < 16; i += 6) { ctx.beginPath(); ctx.moveTo(p[0] + i, p[1] + 16); ctx.lineTo(p[0] + i - 5, p[1] + 22); ctx.stroke(); }
    ctx.restore();
    U.dot(ctx, p[0], p[1], r * 0.75, '#fff', U.C.ink);
  };
  U.hatchLine = function (ctx, x1, y1, x2, y2, side) {
    side = side || 1;
    ctx.save(); ctx.strokeStyle = U.C.ink; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy * side, ny = ux * side;
    for (var s = 4; s < L; s += 7) {
      var px = x1 + ux * s, py = y1 + uy * s;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + nx * 6 - ux * 5, py + ny * 6 - uy * 5); ctx.stroke();
    }
    ctx.restore();
  };

  /* draw text with simple _sub and ^sup, italic for single letters and Greek */
  U.label = function (ctx, str, x, y, o) {
    o = o || {};
    var size = o.size || 14, col = o.color || U.C.ink, align = o.align || 'left', base = o.base || 'middle';
    var runs = [], s = String(str), i = 0;
    function push(t, kind) { if (t) runs.push([t, kind]); }
    while (i < s.length) {
      var c = s[i];
      if (c === '_' || c === '^') {
        var kind = c === '_' ? 'sub' : 'sup'; i++;
        var g; if (s[i] === '{') { var j = s.indexOf('}', i); g = s.slice(i + 1, j); i = j + 1; } else { g = s[i]; i++; }
        push(g, kind); continue;
      }
      if (/[A-Za-z]/.test(c)) {
        var j2 = i; while (j2 < s.length && /[A-Za-z]/.test(s[j2])) j2++;
        var w = s.slice(i, j2); i = j2; push(w, w.length === 1 && !o.roman ? 'it' : 'rm'); continue;
      }
      if (GREEK.indexOf(c) >= 0) { push(c, 'ΔΦΩΣΘ'.indexOf(c) >= 0 ? 'rm' : 'it'); i++; continue; }
      var j3 = i; while (j3 < s.length && !/[A-Za-z_^]/.test(s[j3]) && GREEK.indexOf(s[j3]) < 0) j3++;
      push(s.slice(i, j3), 'rm'); i = j3;
    }
    function font(k) { var sz = (k === 'sub' || k === 'sup') ? size * 0.72 : size; return ((k === 'it') ? 'italic ' : '') + (o.bold ? '500 ' : '400 ') + sz + 'px ' + U.FONT; }
    ctx.save(); ctx.fillStyle = col; ctx.textBaseline = base;
    var total = 0;
    runs.forEach(function (r) { ctx.font = font(r[1]); total += ctx.measureText(r[0]).width + (r[1] === 'it' ? 1 : 0); });
    var cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(cx - 3, y - size * 0.62, total + 6, size * 1.24); ctx.fillStyle = col; }
    runs.forEach(function (r) {
      ctx.font = font(r[1]);
      var dy = r[1] === 'sub' ? size * 0.3 : r[1] === 'sup' ? -size * 0.38 : 0;
      ctx.fillText(r[0], cx, y + dy);
      cx += ctx.measureText(r[0]).width + (r[1] === 'it' ? 1 : 0);
    });
    ctx.restore();
    return total;
  };

  /* ---- plots ---- */
  U.niceTicks = function (a, b, n) {
    var span = b - a; if (span <= 0) return [a];
    var step = Math.pow(10, Math.floor(Math.log10(span / (n || 5))));
    var err = span / (n || 5) / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var t = [], s = Math.ceil(a / step - 1e-9) * step;
    for (var v = s; v <= b + step * 1e-6; v += step) t.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return t;
  };
  /* box {x,y,w,h}; o: xmin xmax ymin ymax xlabel ylabel xticks yticks xfmt yfmt */
  U.axes = function (ctx, box, o) {
    var X = function (v) { return box.x + (v - o.xmin) / (o.xmax - o.xmin) * box.w; };
    var Y = function (v) { return box.y + box.h - (v - o.ymin) / (o.ymax - o.ymin) * box.h; };
    ctx.save();
    ctx.font = '12px ' + U.FONT; ctx.fillStyle = U.C.ink2; ctx.strokeStyle = U.C.grid; ctx.lineWidth = 1;
    var xt = o.xticks || U.niceTicks(o.xmin, o.xmax, 6), yt = o.yticks || U.niceTicks(o.ymin, o.ymax, 5);
    var xf = o.xfmt || function (v) { return U.f(v, 3).replace(/<[^>]+>/g, ''); }, yf = o.yfmt || function (v) { return U.f(v, 3).replace(/<[^>]+>/g, ''); };
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    xt.forEach(function (v) { var x = X(v); ctx.beginPath(); ctx.moveTo(x, box.y); ctx.lineTo(x, box.y + box.h); ctx.stroke(); ctx.fillText(xf(v), x, box.y + box.h + 4); });
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    yt.forEach(function (v) { var y = Y(v); ctx.beginPath(); ctx.moveTo(box.x, y); ctx.lineTo(box.x + box.w, y); ctx.stroke(); ctx.fillText(yf(v), box.x - 5, y); });
    ctx.strokeStyle = U.C.ink2;
    ctx.beginPath(); ctx.moveTo(box.x, box.y); ctx.lineTo(box.x, box.y + box.h); ctx.lineTo(box.x + box.w, box.y + box.h); ctx.stroke();
    if (o.ymin < 0 && o.ymax > 0) { ctx.strokeStyle = U.C.mute; ctx.beginPath(); ctx.moveTo(box.x, Y(0)); ctx.lineTo(box.x + box.w, Y(0)); ctx.stroke(); }
    ctx.restore();
    if (o.xlabel) U.label(ctx, o.xlabel, box.x + box.w / 2, box.y + box.h + 30, { size: 13, align: 'center', color: U.C.ink2 });
    if (o.ylabel) {
      ctx.save(); ctx.translate(box.x - (o.ylabelOff || 44), box.y + box.h / 2); ctx.rotate(-Math.PI / 2);
      U.label(ctx, o.ylabel, 0, 0, { size: 13, align: 'center', color: U.C.ink2 }); ctx.restore();
    }
    return { X: X, Y: Y };
  };
  U.curve = function (ctx, ax, xs, f, col, w, dash) {
    var pts = [];
    for (var i = 0; i < xs.length; i++) { var y = f(xs[i]); if (isFinite(y)) pts.push([ax.X(xs[i]), ax.Y(y)]); }
    U.line(ctx, pts, col, w, dash);
  };
  U.range = function (a, b, n) { var r = []; for (var i = 0; i <= n; i++) r.push(a + (b - a) * i / n); return r; };

  /* ---- animation loop that only runs while the element is on screen ---- */
  U.loop = function (node, step) {
    var last = null, running = true;
    function frame(t) {
      if (!running) return;
      var dt = last == null ? 0 : Math.min(0.05, (t - last) / 1000); last = t;
      var vis = window.Deck ? window.Deck.visible(node) : true;
      if (vis && (!window.IntersectionObserver || node._inView !== false)) step(dt);
      requestAnimationFrame(frame);
    }
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { node._inView = e.isIntersecting; }); }).observe(node);
    }
    requestAnimationFrame(frame);
    return { stop: function () { running = false; } };
  };
  /* redraw hooks for print and slide changes */
  U.onRedraw = function (fn) {
    document.addEventListener('deck:print', fn);
    document.addEventListener('deck:afterprint', fn);
    document.addEventListener('deck:show', fn);
  };

  /* live worked examples: <div class="live" data-calc="name"> inputs with data-k, outputs with data-o */
  U.calcs = {};
  U.initLive = function () {
    document.querySelectorAll('[data-calc]').forEach(function (box) {
      var fn = U.calcs[box.dataset.calc]; if (!fn) return;
      var scope = box.closest('.sol') || box.parentNode;
      function run() {
        var v = {};
        box.querySelectorAll('input[data-k]').forEach(function (i) { v[i.dataset.k] = +i.value; });
        var r = fn(v);
        scope.querySelectorAll('[data-o]').forEach(function (o) { if (r[o.dataset.o] != null) o.innerHTML = r[o.dataset.o]; });
      }
      box.querySelectorAll('input').forEach(function (i) { i.addEventListener('input', run); });
      run();
    });
  };

  document.addEventListener('DOMContentLoaded', function () { window.mathify(); });
})();
