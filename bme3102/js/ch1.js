/* Chapter 1 live models */
(function () {
  'use strict';
  var C = U.C, rad = U.rad, deg = U.deg, f = U.f;

  /* ================= mobility counter ================= */
  (function () {
    var host = document.getElementById('sim-mob'); if (!host) return;
    var sh = U.simShell(host);
    var N, P1, P2, ctx;
    function upd() { draw(); }
    N = U.slider(sh.ctl, { label: 'Links N (frame included)', min: 2, max: 10, step: 1, value: 4, fmt: function (v) { return v; } }, upd);
    P1 = U.slider(sh.ctl, { label: 'Lower pairs P_1', min: 0, max: 14, step: 1, value: 4, fmt: function (v) { return v; } }, upd);
    P2 = U.slider(sh.ctl, { label: 'Higher pairs P_2', min: 0, max: 4, step: 1, value: 0, fmt: function (v) { return v; } }, upd);
    var presets = U.select(sh.ctl, 'Preset', [['', 'Choose a preset'], ['4,4,0', 'Four-bar or slider-crank'], ['3,3,0', 'Pin-jointed triangle'], ['3,2,1', 'Cam and follower'], ['6,7,0', 'Watt or Stephenson six-bar'], ['5,5,0', 'Five-bar loop'], ['6,8,0', 'Braced square, two diagonals'], ['5,5,1', 'Tutorial problem 3']], function () {
      var v = presets.v(); if (!v) return; var p = v.split(',');
      N.set(+p[0]); P1.set(+p[1]); P2.set(+p[2]); draw();
    });
    ctx = U.canvas(sh.view, 760, 300);
    var out = U.outputs(sh.view, [['mov', 'Freedoms of the moving links 3(N−1)', ''], ['rem', 'Removed by pairs 2P_1 + P_2', ''], ['F', 'Mobility F', '']]);
    var msg = U.msg(sh.view);
    function draw() {
      var n = N.v(), p1 = P1.v(), p2 = P2.v();
      var mov = 3 * (n - 1), rem = 2 * p1 + p2, F = mov - rem;
      out({ mov: mov, rem: rem, F: F });
      if (F > 1) msg('F = ' + F + ': a mechanism that needs ' + F + ' independent inputs (for example ' + F + ' motors) for definite motion.', 'warn');
      else if (F === 1) msg('F = 1: a constrained mechanism. One input, such as turning the crank, fixes the position of every link.', 'ok');
      else if (F === 0) msg('F = 0: a structure. Nothing can move without deforming a link.', 'bad');
      else msg('F = ' + F + ': a preloaded (over-constrained) frame. It can only be assembled if links are forced into place, which locks in stress.', 'bad');
      ctx.clear();
      /* bar chart: available freedoms against removed */
      var x0 = 170, w = 540, maxv = Math.max(mov, rem, 6);
      function bar(y, val, col, lab) {
        U.label(ctx, lab, x0 - 10, y + 16, { size: 14, align: 'right', color: C.ink2, roman: true });
        ctx.fillStyle = col; ctx.fillRect(x0, y, w * val / maxv, 32);
        U.label(ctx, String(val), x0 + w * val / maxv + 8, y + 16, { size: 15, roman: true });
      }
      bar(40, mov, '#9fb6d3', 'available 3(N−1)');
      /* removed: stacked lower and higher */
      U.label(ctx, 'removed', x0 - 10, 116, { size: 14, align: 'right', color: C.ink2, roman: true });
      ctx.fillStyle = '#d9a3a6'; ctx.fillRect(x0, 100, w * 2 * p1 / maxv, 32);
      ctx.fillStyle = '#e6c58e'; ctx.fillRect(x0 + w * 2 * p1 / maxv, 100, w * p2 / maxv, 32);
      U.label(ctx, String(rem), x0 + w * rem / maxv + 8, 116, { size: 15, roman: true });
      U.label(ctx, 'lower pairs 2P_1 = ' + 2 * p1, x0, 150, { size: 13, color: C.ink2 });
      if (p2) U.label(ctx, 'higher pairs P_2 = ' + p2, x0 + 200, 150, { size: 13, color: C.ink2 });
      /* tally of F as dots */
      U.label(ctx, 'F = ' + mov + ' − ' + rem + ' = ' + F, 380, 210, { size: 26, align: 'center', bold: true });
      U.label(ctx, 'Kutzbach: F = 3(N − 1) − 2P_1 − P_2', 380, 255, { size: 15, align: 'center', color: C.ink2 });
    }
    draw(); U.onRedraw(draw);
  })();

  /* ================= four-bar solver ================= */
  function solveFB(d, a, b, c, t2, br) {
    var Bx = a * Math.cos(t2), By = a * Math.sin(t2);
    var dx = d - Bx, dy = -By, e = Math.hypot(dx, dy);
    if (e < 1e-9 || e > b + c || e < Math.abs(b - c)) return null;
    var aa = (b * b - c * c + e * e) / (2 * e), h = Math.sqrt(Math.max(0, b * b - aa * aa));
    var px = Bx + aa * dx / e, py = By + aa * dy / e;
    var s = br || 1;
    return { O2: [0, 0], O4: [d, 0], B: [Bx, By], C: [px - s * h * dy / e, py + s * h * dx / e], e: e };
  }
  function solve2(m11, m12, m21, m22, r1, r2) {
    var det = m11 * m22 - m12 * m21; if (Math.abs(det) < 1e-12) return null;
    return [(r1 * m22 - m12 * r2) / det, (m11 * r2 - r1 * m21) / det];
  }
  function lineX(p1, p2, p3, p4) {
    var d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
    if (Math.abs(d) < 1e-9) return null;
    var t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / d;
    return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
  }
  function mu(sol, b, c) { var e = sol.e; return deg(Math.acos(U.clamp((b * b + c * c - e * e) / (2 * b * c), -1, 1))); }

  /* ================= four-bar explorer (Grashof and inversion) ================= */
  (function () {
    var host = document.getElementById('sim-fourbar'); if (!host) return;
    var sh = U.simShell(host);
    var Ls = [], fixedSel, ctx, t = rad(30), dir = 1, playing = true;
    var names = ['Link 1', 'Link 2', 'Link 3', 'Link 4'];
    var defs = [100, 40, 90, 75];
    for (var i = 0; i < 4; i++) Ls.push(U.slider(sh.ctl, { label: names[i], unit: 'mm', min: 20, max: 160, step: 1, value: defs[i], fmt: function (v) { return v; } }, reset));
    fixedSel = U.select(sh.ctl, 'Fixed link (frame)', [['0', 'Link 1'], ['1', 'Link 2'], ['2', 'Link 3'], ['3', 'Link 4']], reset);
    var curveChk = U.check(sh.ctl, 'Show coupler curve', true, draw);
    var btn = U.buttons(sh.ctl, [['p', 'Pause', function () { playing = !playing; btn.p.textContent = playing ? 'Pause' : 'Play'; }]]);
    ctx = U.canvas(sh.view, 820, 400);
    var out = U.outputs(sh.view, [['cls', 'Grashof check', ''], ['mu', 'Transmission angle μ', 'degrees'], ['mur', 'Range of μ over the motion', 'degrees'], ['in', 'Input motion', '']]);
    var msg = U.msg(sh.view);
    var geo = null, feas = null, trace = [], muMin = 0, muMax = 0;
    var COL = ['#8a9099', C.blue, C.green, C.amber];

    function roles() {
      var k = +fixedSel.v();
      var L = Ls.map(function (s) { return s.v(); });
      return { k: k, d: L[k], a: L[(k + 1) % 4], b: L[(k + 2) % 4], c: L[(k + 3) % 4], idx: [k, (k + 1) % 4, (k + 2) % 4, (k + 3) % 4], L: L };
    }
    function classify(R) {
      var L = R.L.slice(), sorted = L.slice().sort(function (x, y) { return x - y; });
      var s = sorted[0], l = sorted[3], pq = sorted[1] + sorted[2];
      var si = L.indexOf(s);
      if (s + l > pq + 1e-9) return ['Non-Grashof (s + l = ' + (s + l) + ' &gt; p + q = ' + pq + ')', 'Triple-rocker: no link can turn fully, whichever link is fixed. A motor cannot drive it continuously.', 'bad'];
      var tag = 'Grashof (s + l = ' + (s + l) + (s + l === pq ? ' = ' : ' &lt; ') + 'p + q = ' + pq + ')';
      if (Math.abs(s + l - pq) < 1e-9) return [tag, 'Change-point chain: all links line up once per cycle. The linkage can lock or flip branch there.', 'warn'];
      if (si === R.idx[0]) return [tag, 'Double-crank (drag-link): the shortest link is fixed, so both side links turn fully.', 'ok'];
      if (si === R.idx[1]) return [tag, 'Crank-rocker: the shortest link is the input crank. It turns fully; the output rocks.', 'ok'];
      if (si === R.idx[3]) return [tag, 'Rocker-crank: the shortest link is the output. The output turns fully while the input rocks.', 'ok'];
      return [tag, 'Double-rocker: the shortest link is the coupler. Both side links rock; the coupler turns fully relative to them.', 'warn'];
    }
    function reset() {
      var R = roles(); geo = R;
      feas = []; var n = 720, any = false;
      for (var i = 0; i < n; i++) { var s = solveFB(R.d, R.a, R.b, R.c, 2 * Math.PI * i / n, 1); feas.push(!!s); if (s) any = true; }
      if (!solveFB(R.d, R.a, R.b, R.c, t, 1)) { for (var j = 0; j < n; j++) if (feas[j]) { t = 2 * Math.PI * (j + 0.5) / n; break; } }
      trace = []; muMin = 999; muMax = -1;
      /* coupler point: midway along the coupler, offset sideways by 40% of its length */
      for (var k = 0; k < n; k++) {
        var s2 = solveFB(R.d, R.a, R.b, R.c, 2 * Math.PI * k / n, 1);
        if (!s2) { trace.push(null); continue; }
        trace.push(cpt(s2, R));
        var m = mu(s2, R.b, R.c); muMin = Math.min(muMin, m); muMax = Math.max(muMax, m);
      }
      geo.any = any;
      draw();
    }
    function cpt(s, R) {
      var ux = (s.C[0] - s.B[0]) / R.b, uy = (s.C[1] - s.B[1]) / R.b;
      return [s.B[0] + ux * R.b * 0.5 - uy * R.b * 0.4, s.B[1] + uy * R.b * 0.5 + ux * R.b * 0.4];
    }
    function step(dt) {
      if (!playing || !geo || !geo.any) return;
      var full = feas.every(Boolean);
      var nt = t + dir * dt * 1.4;
      if (!full && !solveFB(geo.d, geo.a, geo.b, geo.c, nt, 1)) { dir = -dir; nt = t + dir * dt * 1.4; }
      t = ((nt % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      draw();
    }
    function draw() {
      if (!geo) return;
      var R = geo; ctx.clear();
      var cl = classify(R);
      var span = R.d + R.a + R.c, hgt = 2 * Math.max(R.a, R.c, R.b * 0.8) + R.b * 0.5;
      var sc = Math.min(760 / span, 330 / hgt) * 0.95;
      var ox = 410 - sc * (R.d + R.c - R.a) / 2, oy = 250;
      function P(p) { return [ox + p[0] * sc, oy - p[1] * sc]; }
      /* ground */
      U.hatchLine(ctx, P([0, 0])[0] - 30, oy + 26, P([R.d, 0])[0] + 30, oy + 26, 1);
      if (curveChk.v()) {
        ctx.save(); ctx.strokeStyle = C.violet; ctx.lineWidth = 1.3; ctx.setLineDash([4, 3]); ctx.beginPath();
        var pen = false;
        trace.forEach(function (q) { if (!q) { pen = false; return; } var s = P(q); if (!pen) { ctx.moveTo(s[0], s[1]); pen = true; } else ctx.lineTo(s[0], s[1]); });
        ctx.stroke(); ctx.restore();
      }
      var s = solveFB(R.d, R.a, R.b, R.c, t, 1);
      var O2 = P([0, 0]), O4 = P([R.d, 0]);
      U.link(ctx, O2, O4, COL[R.idx[0]], 10);
      if (s) {
        var B = P(s.B), Cc = P(s.C), Q = P(cpt(s, R));
        ctx.save(); ctx.fillStyle = 'rgba(29,122,70,0.12)'; ctx.strokeStyle = COL[R.idx[2]]; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(Cc[0], Cc[1]); ctx.lineTo(Q[0], Q[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        U.link(ctx, O2, B, COL[R.idx[1]], 9);
        U.link(ctx, B, Cc, COL[R.idx[2]], 9);
        U.link(ctx, O4, Cc, COL[R.idx[3]], 9);
        U.pin(ctx, B); U.pin(ctx, Cc); U.dot(ctx, Q[0], Q[1], 4, C.violet, false);
        /* transmission angle arc */
        var m = mu(s, R.b, R.c);
        var a1 = Math.atan2(B[1] - Cc[1], B[0] - Cc[0]), a2 = Math.atan2(O4[1] - Cc[1], O4[0] - Cc[0]);
        var da = ((a2 - a1 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
        ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(Cc[0], Cc[1], 24, a1, a1 + da, da < 0); ctx.stroke(); ctx.restore();
        U.label(ctx, 'μ = ' + m.toFixed(0) + '°', Cc[0] + 30, Cc[1] - 18, { size: 14, color: C.red });
        out({ mu: m.toFixed(1) });
        /* names */
        function nm(p1, p2, i, txt) { var mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2; U.label(ctx, txt, mx + 8, my - 12, { size: 13, color: COL[i], roman: true, bg: 'rgba(255,255,255,0.8)' }); }
        nm(O2, B, R.idx[1], names[R.idx[1]] + ' input');
        nm(B, Cc, R.idx[2], names[R.idx[2]] + ' coupler');
        nm(O4, Cc, R.idx[3], names[R.idx[3]] + ' output');
      } else out({ mu: '—' });
      U.ground(ctx, O2); U.ground(ctx, O4);
      U.label(ctx, names[R.idx[0]] + ' fixed', (O2[0] + O4[0]) / 2, oy + 42, { size: 13, align: 'center', color: C.ink2, roman: true });
      var full = feas.every(Boolean);
      out({ cls: cl[0].split(' (')[0], mur: R.any ? muMin.toFixed(0) + ' to ' + muMax.toFixed(0) : '—', in: full ? 'turns fully' : (R.any ? 'rocks between limits' : 'cannot assemble') });
      var warn = (R.any && (muMin < 40 || muMax > 140)) ? ' Transmission angle leaves the 40° to 140° band, so the output is driven poorly near those positions.' : '';
      msg(cl[0] + '. ' + cl[1] + warn, cl[2] === 'ok' && warn ? 'warn' : cl[2]);
    }
    reset();
    U.loop(host, step);
    U.onRedraw(draw);
  })();

  /* ================= four-bar velocity and acceleration polygons ================= */
  (function () {
    var host = document.getElementById('sim-fbvel'); if (!host) return;
    var sh = U.simShell(host);
    var a, b, c, d, w2, th, view, icChk, playing = false;
    function upd() { draw(); }
    a = U.slider(sh.ctl, { label: 'Crank O_2B', unit: 'mm', min: 20, max: 80, step: 1, value: 40, fmt: function (v) { return v; } }, upd);
    b = U.slider(sh.ctl, { label: 'Coupler BC', unit: 'mm', min: 60, max: 170, step: 1, value: 120, fmt: function (v) { return v; } }, upd);
    c = U.slider(sh.ctl, { label: 'Rocker O_4C', unit: 'mm', min: 40, max: 140, step: 1, value: 80, fmt: function (v) { return v; } }, upd);
    d = U.slider(sh.ctl, { label: 'Frame O_2O_4', unit: 'mm', min: 60, max: 160, step: 1, value: 100, fmt: function (v) { return v; } }, upd);
    w2 = U.slider(sh.ctl, { label: 'Crank speed ω_2', unit: 'rad/s', min: 1, max: 30, step: 0.5, value: 10 }, upd);
    th = U.slider(sh.ctl, { label: 'Crank angle θ_2', unit: 'degrees', min: 0, max: 360, step: 1, value: 120, fmt: function (v) { return v.toFixed(0); } }, upd);
    view = U.select(sh.ctl, 'Right-hand diagram', [['v', 'Velocity polygon'], ['a', 'Acceleration polygon']], upd);
    icChk = U.check(sh.ctl, 'Show I-centres ' + U.m('I_{13}') + ' and ' + U.m('I_{24}'), true, upd);
    var btn = U.buttons(sh.ctl, [['p', 'Play', function () { playing = !playing; btn.p.textContent = playing ? 'Pause' : 'Play'; }]]);
    var ctx = U.canvas(sh.view, 900, 420);
    var out = U.outputs(sh.view, [['vB', 'v_B', 'm/s'], ['vC', 'v_C', 'm/s'], ['vCB', 'v_{CB}', 'm/s'], ['w3', 'ω_3', 'rad/s'], ['w4', 'ω_4', 'rad/s'], ['w4i', 'ω_4 from I_{24}', 'rad/s'], ['al3', 'α_3', 'rad/s²'], ['al4', 'α_4', 'rad/s²']]);
    var msg = U.msg(sh.view);

    function draw() {
      ctx.clear();
      var A = a.v(), Bl = b.v(), Cl = c.v(), D = d.v(), W2 = w2.v(), T = rad(th.v());
      var s = solveFB(D, A, Bl, Cl, T, 1);
      /* left panel: mechanism */
      ctx.save(); ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(450, 20); ctx.lineTo(450, 400); ctx.stroke(); ctx.restore();
      var span = D + A + Cl, sc = Math.min(400 / span, 300 / (2 * Math.max(A, Cl, Bl * 0.7))) * 0.9;
      var ox = 225 - sc * (D + Cl - A) / 2 + 0, oy = 230;
      function P(p) { return [ox + p[0] * sc, oy - p[1] * sc]; }
      U.label(ctx, 'Configuration', 20, 22, { size: 14, color: C.ink2, roman: true });
      U.label(ctx, view.v() === 'v' ? 'Velocity polygon' : 'Acceleration polygon', 470, 22, { size: 14, color: C.ink2, roman: true });
      if (!s) {
        U.link(ctx, P([0, 0]), P([D, 0]), '#8a9099', 9); U.ground(ctx, P([0, 0])); U.ground(ctx, P([D, 0]));
        out({ vB: '—', vC: '—', vCB: '—', w3: '—', w4: '—', w4i: '—', al3: '—', al4: '—' });
        msg('The links cannot be assembled at this crank angle. The crank cannot reach this position with these lengths.', 'bad');
        return;
      }
      var Bx = s.B, Cx = s.C;
      var r3 = [Cx[0] - Bx[0], Cx[1] - Bx[1]], r4 = [Cx[0] - D, Cx[1]];
      var vB = [-W2 * Bx[1] / 1000, W2 * Bx[0] / 1000];
      var sol = solve2(-r3[1], r4[1], r3[0], -r4[0], -vB[0] * 1000, -vB[1] * 1000);
      var w3 = sol[0], w4 = sol[1];
      var vC = [-w4 * r4[1] / 1000, w4 * r4[0] / 1000];
      var vCB = [vC[0] - vB[0], vC[1] - vB[1]];
      var aB = [-W2 * W2 * Bx[0] / 1000, -W2 * W2 * Bx[1] / 1000];
      var Rr = [(-w4 * w4 * r4[0] + w3 * w3 * r3[0]) / 1000 - aB[0], (-w4 * w4 * r4[1] + w3 * w3 * r3[1]) / 1000 - aB[1]];
      var al = solve2(-r3[1], r4[1], r3[0], -r4[0], Rr[0] * 1000, Rr[1] * 1000);
      var al3 = al[0], al4 = al[1];
      var aC = [(-al4 * r4[1] - w4 * w4 * r4[0]) / 1000, (al4 * r4[0] - w4 * w4 * r4[1]) / 1000];
      /* I-centres */
      var I13 = lineX([0, 0], Bx, [D, 0], Cx), I24 = lineX([0, 0], [D, 0], Bx, Cx);
      var w4i = I24 ? W2 * I24[0] / (I24[0] - D) : NaN;

      var O2 = P([0, 0]), O4 = P([D, 0]), B = P(Bx), Cc = P(Cx);
      if (icChk.v()) {
        ctx.save(); ctx.strokeStyle = C.mute; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
        function ext(p, q, i) { if (!i) return; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(i[0], i[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
        var I13s = I13 ? P(I13) : null, I24s = I24 ? P(I24) : null;
        if (I13s && Math.abs(I13s[0]) < 3000 && Math.abs(I13s[1]) < 3000) { ext(O2, B, I13s); ext(O4, Cc, I13s); }
        if (I24s && Math.abs(I24s[0]) < 3000) { ext(O2, O4, I24s); ext(B, Cc, I24s); }
        ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 450, 420); ctx.clip();
        if (I13s) { U.dot(ctx, I13s[0], I13s[1], 5, C.violet, false); U.label(ctx, 'I_{13}', I13s[0] + 8, I13s[1] - 10, { size: 13, color: C.violet }); }
        if (I24s) { U.dot(ctx, I24s[0], I24s[1], 5, C.violet, false); U.label(ctx, 'I_{24}', I24s[0] + 6, I24s[1] + 16, { size: 13, color: C.violet }); }
        ctx.restore();
      }
      U.link(ctx, O2, O4, '#8a9099', 8);
      U.link(ctx, O2, B, C.blue, 9); U.link(ctx, B, Cc, C.green, 9); U.link(ctx, O4, Cc, C.amber, 9);
      U.ground(ctx, O2); U.ground(ctx, O4); U.pin(ctx, B); U.pin(ctx, Cc);
      U.label(ctx, 'O_2', O2[0] - 26, O2[1] + 4, { size: 13 }); U.label(ctx, 'O_4', O4[0] + 12, O4[1] + 4, { size: 13 });
      U.label(ctx, 'B', B[0] - 16, B[1] - 12, { size: 14 }); U.label(ctx, 'C', Cc[0] + 10, Cc[1] - 12, { size: 14 });
      /* velocity arrows on mechanism */
      var vmax = Math.max(Math.hypot(vB[0], vB[1]), Math.hypot(vC[0], vC[1]), 1e-6);
      var vs = 70 / vmax;
      if (view.v() === 'v') {
        U.arrow(ctx, B[0], B[1], B[0] + vB[0] * vs, B[1] - vB[1] * vs, C.blue, 2);
        U.arrow(ctx, Cc[0], Cc[1], Cc[0] + vC[0] * vs, Cc[1] - vC[1] * vs, C.amber, 2);
      }
      /* right panel polygon */
      var cx = 680, cy = 220;
      ctx.save(); ctx.beginPath(); ctx.rect(452, 30, 448, 390); ctx.clip();
      if (view.v() === 'v') {
        var m = Math.max(Math.hypot(vB[0], vB[1]), Math.hypot(vC[0], vC[1]), Math.hypot(vCB[0], vCB[1]), 1e-6);
        var k = 200 / m;
        var bxs = [0, vB[0], vC[0]], bys = [0, vB[1], vC[1]];
        var mcx = (Math.min.apply(0, bxs) + Math.max.apply(0, bxs)) / 2, mcy = (Math.min.apply(0, bys) + Math.max.apply(0, bys)) / 2;
        var o = [cx - mcx * k, cy + mcy * k];
        var pb = [o[0] + vB[0] * k, o[1] - vB[1] * k], pc = [o[0] + vC[0] * k, o[1] - vC[1] * k];
        U.arrow(ctx, o[0], o[1], pb[0], pb[1], C.blue, 2.4);
        U.arrow(ctx, o[0], o[1], pc[0], pc[1], C.amber, 2.4);
        U.arrow(ctx, pb[0], pb[1], pc[0], pc[1], C.green, 2.4);
        U.dot(ctx, o[0], o[1], 4, C.ink, false);
        U.label(ctx, 'o, o_2, o_4', o[0] - 8, o[1] + 16, { size: 13, align: 'right' });
        U.label(ctx, 'b', pb[0] + 8, pb[1] - 6, { size: 15 }); U.label(ctx, 'c', pc[0] + 8, pc[1] - 6, { size: 15 });
        U.label(ctx, 'v_B ⊥ O_2B', (o[0] + pb[0]) / 2 + 10, (o[1] + pb[1]) / 2 + 14, { size: 13, color: C.blue, bg: 'rgba(255,255,255,.85)' });
        U.label(ctx, 'v_C ⊥ O_4C', (o[0] + pc[0]) / 2 + 10, (o[1] + pc[1]) / 2 + 14, { size: 13, color: C.amber, bg: 'rgba(255,255,255,.85)' });
        U.label(ctx, 'v_{CB} ⊥ BC', (pb[0] + pc[0]) / 2 + 10, (pb[1] + pc[1]) / 2 - 12, { size: 13, color: C.green, bg: 'rgba(255,255,255,.85)' });
        scaleBar(1 * k, '1 m/s');
      } else {
        var anB = aB, anCB = [-w3 * w3 * r3[0] / 1000, -w3 * w3 * r3[1] / 1000], anC = [-w4 * w4 * r4[0] / 1000, -w4 * w4 * r4[1] / 1000];
        var pts = [[0, 0], aB, [aB[0] + anCB[0], aB[1] + anCB[1]], aC, anC];
        var mx = 1e-6; pts.forEach(function (p) { mx = Math.max(mx, Math.hypot(p[0], p[1])); });
        var k2 = 170 / mx;
        var axs = pts.map(function (q) { return q[0]; }), ays = pts.map(function (q) { return q[1]; });
        var acx = (Math.min.apply(0, axs) + Math.max.apply(0, axs)) / 2, acy = (Math.min.apply(0, ays) + Math.max.apply(0, ays)) / 2;
        var o2 = [cx - acx * k2, cy + acy * k2];
        function S(p) { return [o2[0] + p[0] * k2, o2[1] - p[1] * k2]; }
        var pb2 = S(aB), pm = S([aB[0] + anCB[0], aB[1] + anCB[1]]), pc2 = S(aC), pn = S(anC);
        U.arrow(ctx, o2[0], o2[1], pb2[0], pb2[1], C.blue, 2.4);
        U.arrow(ctx, pb2[0], pb2[1], pm[0], pm[1], C.green, 1.6); U.arrow(ctx, pm[0], pm[1], pc2[0], pc2[1], C.green, 1.6);
        U.arrow(ctx, o2[0], o2[1], pn[0], pn[1], C.amber, 1.6); U.arrow(ctx, pn[0], pn[1], pc2[0], pc2[1], C.amber, 1.6);
        U.line(ctx, [o2, pc2], C.ink, 2.4, [6, 4]);
        U.dot(ctx, o2[0], o2[1], 4, C.ink, false);
        U.label(ctx, "o'", o2[0] - 8, o2[1] + 14, { size: 14, align: 'right' }); U.label(ctx, "b'", pb2[0] + 8, pb2[1], { size: 14 }); U.label(ctx, "c'", pc2[0] + 8, pc2[1], { size: 14 });
        U.label(ctx, 'a_B = ω_2^2 O_2B', (o2[0] + pb2[0]) / 2 + 8, (o2[1] + pb2[1]) / 2 + 12, { size: 13, color: C.blue, bg: 'rgba(255,255,255,.85)' });
        U.label(ctx, 'a^n_{CB}, a^t_{CB}', (pb2[0] + pc2[0]) / 2 + 8, (pb2[1] + pc2[1]) / 2 - 12, { size: 13, color: C.green, bg: 'rgba(255,255,255,.85)' });
        U.label(ctx, 'a^n_C, a^t_C', (pn[0] + pc2[0]) / 2 + 8, (pn[1] + pc2[1]) / 2 + 12, { size: 13, color: C.amber, bg: 'rgba(255,255,255,.85)' });
        scaleBar(10 * k2, '10 m/s²');
      }
      ctx.restore();
      function scaleBar(len, txt) {
        if (len > 200) { len /= 10; txt = txt.replace('10 ', '1 ').replace('1 m/s', '0.1 m/s'); }
        U.line(ctx, [[480, 395], [480 + len, 395]], C.ink, 2);
        U.line(ctx, [[480, 390], [480, 400]], C.ink, 1.5); U.line(ctx, [[480 + len, 390], [480 + len, 400]], C.ink, 1.5);
        U.label(ctx, txt, 488 + len, 395, { size: 12, color: C.ink2, roman: true });
      }
      function sg(x) { return f(x, 3); }
      out({ vB: sg(Math.hypot(vB[0], vB[1])), vC: sg(Math.hypot(vC[0], vC[1])), vCB: sg(Math.hypot(vCB[0], vCB[1])), w3: sg(w3), w4: sg(w4), w4i: isFinite(w4i) ? sg(w4i) : 'parallel', al3: sg(al3), al4: sg(al4) });
      msg('', 'ok');
      host.querySelector('.msg').innerHTML =U.m('Sign convention: positive ω and α are anticlockwise.') + ' The value of ' + U.m('ω_4') + ' from the polygon and from ' + U.m('I_{24}') + ' agree, as Kennedy\'s theorem says. The crank turns at constant speed, so ' + U.m('a_B') + ' has no tangential part.';
    }
    draw(); U.onRedraw(draw);
    U.loop(host, function (dt) { if (!playing) return; th.set((th.v() + dt * 40) % 360); draw(); });
  })();

  /* ================= slider-crank kinematics with Klein ================= */
  (function () {
    var host = document.getElementById('sim-sc'); if (!host) return;
    var sh = U.simShell(host);
    var r, n, w, th, klein, playing = false;
    function upd() { draw(); }
    r = U.slider(sh.ctl, { label: 'Crank radius r', unit: 'mm', min: 20, max: 80, step: 1, value: 50, fmt: function (v) { return v; } }, upd);
    n = U.slider(sh.ctl, { label: 'n = L/r', min: 2.5, max: 8, step: 0.1, value: 4, fmt: function (v) { return v.toFixed(1); } }, upd);
    w = U.slider(sh.ctl, { label: 'Crank speed ω', unit: 'rad/s', min: 5, max: 60, step: 1, value: 20, fmt: function (v) { return v; } }, upd);
    th = U.slider(sh.ctl, { label: 'Crank angle θ from TDC', unit: 'degrees', min: 0, max: 360, step: 1, value: 60, fmt: function (v) { return v.toFixed(0); } }, upd);
    klein = U.check(sh.ctl, "Show Klein's construction", true, upd);
    var btn = U.buttons(sh.ctl, [['p', 'Play', function () { playing = !playing; btn.p.textContent = playing ? 'Pause' : 'Play'; }]]);
    var ctx = U.canvas(sh.view, 920, 580);
    var out = U.outputs(sh.view, [['x', 'Piston travel from TDC x', 'mm'], ['v', 'v_P exact', 'm/s'], ['va', 'v_P approximate', 'm/s'], ['a', 'a_P exact', 'm/s²'], ['aa', 'a_P approximate', 'm/s²'], ['wr', 'Rod ω_{AB}', 'rad/s'], ['phi', 'Obliquity φ', 'degrees']]);

    function kin(R, L, W, t) {
      var x = function (q) { return R * Math.cos(q) + Math.sqrt(L * L - Math.pow(R * Math.sin(q), 2)); };
      var h = 1e-4;
      var v = -(x(t + h) - x(t - h)) / (2 * h) * W;
      var a = -(x(t + h) - 2 * x(t) + x(t - h)) / (h * h) * W * W;
      return { pos: x(t), v: v, a: a };
    }
    function draw() {
      ctx.clear();
      var R = r.v() / 1000, N = n.v(), L = R * N, W = w.v(), T = rad(th.v());
      var k = kin(R, L, W, T);
      var phi = Math.asin(Math.sin(T) / N);
      var va = W * R * (Math.sin(T) + Math.sin(2 * T) / (2 * N)), aa = W * W * R * (Math.cos(T) + Math.cos(2 * T) / N);
      var wr = W * Math.cos(T) / (N * Math.cos(phi));
      out({ x: f((R + L - k.pos) * 1000, 4), v: f(k.v, 4), va: f(va, 4), a: f(k.a, 4), aa: f(aa, 4), wr: f(wr, 3), phi: f(deg(phi), 3) });
      /* mechanism (top band), crank angle measured anticlockwise; screen y down */
      var sc = Math.min(520 / ((R + L) * 1.05 + R * 1.2), 150 / (L / 2 + R * 0.2));
      var Ox = 90 + R * 1.2 * sc, Oy = 180;
      function P(p) { return [Ox + p[0] * sc, Oy - p[1] * sc]; }
      var A = [R * Math.cos(T), R * Math.sin(T)], B = [k.pos, 0];
      var O = P([0, 0]), As = P(A), Bs = P(B);
      ctx.save(); ctx.strokeStyle = C.line; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(O[0], O[1], R * sc, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      U.line(ctx, [[O[0] - R * sc - 20, Oy], [P([R + L + R * 0.5, 0])[0], Oy]], C.mute, 1, [6, 4]);
      /* cylinder walls */
      var cyl0 = P([L - R - R * 0.3, 0])[0], cyl1 = P([L + R + R * 0.6, 0])[0];
      U.hatchLine(ctx, cyl0, Oy - 22, cyl1, Oy - 22, -1); U.hatchLine(ctx, cyl0, Oy + 22, cyl1, Oy + 22, 1);
      if (klein.v()) {
        /* Klein: M on perpendicular through O; circle on AB; circle centre A radius AM */
        var tt = (0 - A[0]) / (B[0] - A[0]); var M = [0, A[1] + tt * (B[1] - A[1])];
        var R1 = Math.hypot(M[0] - A[0], M[1] - A[1]);
        var C2 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
        var D = [C2[0] - A[0], C2[1] - A[1]];
        var kk = (R1 * R1 - L * L / 4 + C2[0] * C2[0] + C2[1] * C2[1] - A[0] * A[0] - A[1] * A[1]) / 2;
        var Nx = kk / D[0];
        /* Q: radical line meets AB */
        var ab = [B[0] - A[0], B[1] - A[1]];
        var tq = (kk - (A[0] * D[0] + A[1] * D[1])) / (ab[0] * D[0] + ab[1] * D[1]);
        var Q = [A[0] + tq * ab[0], A[1] + tq * ab[1]];
        var Ms = P(M), Ns = P([Nx, 0]), Qs = P(Q), C2s = P(C2);
        ctx.save(); ctx.strokeStyle = 'rgba(106,63,160,0.5)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(C2s[0], C2s[1], L / 2 * sc, 0, 2 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(As[0], As[1], R1 * sc, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
        U.line(ctx, [O, Ms], C.blue, 1.5, [5, 3]); U.line(ctx, [As, Ms], C.ink2, 1, [3, 3]);
        /* radical line through N and Q extended */
        var dir = [Qs[0] - Ns[0], Qs[1] - Ns[1]], dl = Math.hypot(dir[0], dir[1]) || 1;
        U.line(ctx, [[Ns[0] - dir[0] / dl * 60, Ns[1] - dir[1] / dl * 60], [Qs[0] + dir[0] / dl * 60, Qs[1] + dir[1] / dl * 60]], C.violet, 1.2, [4, 3]);
        ctx.save(); ctx.fillStyle = 'rgba(168,20,28,0.10)'; ctx.strokeStyle = C.red; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(As[0], As[1]); ctx.lineTo(Qs[0], Qs[1]); ctx.lineTo(Ns[0], Ns[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        U.dot(ctx, Ms[0], Ms[1], 3.5, C.blue, false); U.label(ctx, 'M', Ms[0] - 18, Ms[1], { size: 13, color: C.blue });
        U.dot(ctx, Ns[0], Ns[1], 3.5, C.red, false); U.label(ctx, 'N', Ns[0] + 4, Ns[1] + 14, { size: 13, color: C.red });
        U.dot(ctx, Qs[0], Qs[1], 3.5, C.red, false); U.label(ctx, 'Q', Qs[0] + 6, Qs[1] - 8, { size: 13, color: C.red });
        U.label(ctx, 'Klein: v_P = ω × OM = ' + f(W * M[1], 3) + ' m/s,   a_P = ω^2 × ON = ' + f(W * W * Nx, 3) + ' m/s^2', 900, 20, { size: 13, color: C.ink2, align: 'right' });
      }
      U.link(ctx, O, As, C.blue, 9); U.link(ctx, As, Bs, C.green, 9);
      ctx.save(); ctx.fillStyle = '#dfe3e8'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
      ctx.fillRect(Bs[0] - 24, Oy - 20, 48, 40); ctx.strokeRect(Bs[0] - 24, Oy - 20, 48, 40); ctx.restore();
      U.ground(ctx, O); U.pin(ctx, As); U.pin(ctx, Bs);
      U.label(ctx, 'O', O[0] - 18, O[1] - 10, { size: 14 }); U.label(ctx, 'A', As[0] + 8, As[1] - 10, { size: 14 }); U.label(ctx, 'B', Bs[0] + 28, Bs[1] - 26, { size: 14 });
      /* piston velocity arrow (towards O positive) */
      var vsc = 60 / (W * R);
      U.arrow(ctx, Bs[0], Oy + 34, Bs[0] - k.v * vsc, Oy + 34, C.amber, 2.2);
      U.label(ctx, 'v_P', Bs[0] - k.v * vsc / 2, Oy + 50, { size: 13, color: C.amber, align: 'center' });

      /* plots */
      var thetas = U.range(0, 2 * Math.PI, 180);
      var vmax = W * R * (1 + 1 / (2 * N)) * 1.15, amax = W * W * R * (1 + 1 / N) * 1.12;
      var bx1 = { x: 70, y: 380, w: 360, h: 150 }, bx2 = { x: 530, y: 380, w: 360, h: 150 };
      var tk = [0, 90, 180, 270, 360];
      var ax1 = U.axes(ctx, bx1, { xmin: 0, xmax: 360, ymin: -vmax, ymax: vmax, xticks: tk, xlabel: 'crank angle θ (degrees)', ylabel: 'v_P (m/s)' });
      var ax2 = U.axes(ctx, bx2, { xmin: 0, xmax: 360, ymin: -amax, ymax: amax, xticks: tk, xlabel: 'crank angle θ (degrees)', ylabel: 'a_P (m/s^2)' });
      var dg = thetas.map(deg);
      U.curve(ctx, ax1, dg, function (q) { return kin(R, L, W, rad(q)).v; }, C.amber, 2);
      U.curve(ctx, ax1, dg, function (q) { q = rad(q); return W * R * (Math.sin(q) + Math.sin(2 * q) / (2 * N)); }, C.ink, 1.2, [5, 4]);
      U.curve(ctx, ax2, dg, function (q) { return kin(R, L, W, rad(q)).a; }, C.red, 2);
      U.curve(ctx, ax2, dg, function (q) { q = rad(q); return W * W * R * (Math.cos(q) + Math.cos(2 * q) / N); }, C.ink, 1.2, [5, 4]);
      U.curve(ctx, ax2, dg, function (q) { return W * W * R * Math.cos(rad(q)); }, C.mute, 1, [2, 3]);
      var td = th.v();
      U.dot(ctx, ax1.X(td), ax1.Y(k.v), 5, C.amber, false); U.dot(ctx, ax2.X(td), ax2.Y(k.a), 5, C.red, false);
      U.label(ctx, 'dotted: ω^2 r cos θ (infinitely long rod)', bx2.x + 6, bx2.y - 10, { size: 12, color: C.mute });
      U.label(ctx, 'solid: exact, dashed: approximate formula', bx1.x + 6, bx1.y - 10, { size: 12, color: C.mute, roman: true });
    }
    draw(); U.onRedraw(draw);
    U.loop(host, function (dt) { if (!playing) return; th.set((th.v() + dt * 50) % 360); draw(); });
  })();

  /* ================= slider-crank inversions ================= */
  (function () {
    var host = document.getElementById('sim-inv'); if (!host) return;
    var sh = U.simShell(host);
    var sel = U.select(sh.ctl, 'Fixed link', [['0', 'Frame (cylinder): 1st inversion'], ['1', 'Crank: 2nd inversion'], ['2', 'Connecting rod: 3rd inversion'], ['3', 'Slider (piston): 4th inversion']], function () { draw(); });
    var spd = U.slider(sh.ctl, { label: 'Speed', min: 0, max: 2, step: 0.05, value: 0.8, fmt: function (v) { return v.toFixed(2); } });
    var tr = U.check(sh.ctl, 'Trace a point on each moving link', true, function () { traces = [[], [], [], []]; });
    var info = U.el('div', 'tryit'); sh.ctl.appendChild(info);
    var ctx = U.canvas(sh.view, 860, 420);
    var th = 0.6, traces = [[], [], [], []];
    var R = 45, L = 120;
    var COL = ['#8a9099', C.blue, C.green, C.red];
    var NAMES = ['frame (cylinder)', 'crank', 'connecting rod', 'slider (piston)'];
    var MACH = [
      ['Reciprocating engine or compressor', 'The cylinder is fixed. The crank turns about a fixed bearing and the piston reciprocates in a straight line.'],
      ['Whitworth quick-return, rotary (Gnome) engine', 'The crank is fixed. The cylinder block (frame) rotates about O and the connecting rod rotates about the crank pin A. In the Gnome engine the cylinders spin with the propeller.'],
      ['Oscillating-cylinder engine, crank and slotted-lever quick-return', 'The connecting rod is fixed. The crank turns about A, and the cylinder (frame) rocks about the pin B on the piston.'],
      ['Hand pump (pendulum pump)', 'The piston is fixed. The cylinder (frame) slides up and down over it, the rod swings about B and the crank turns about O on the moving cylinder.']
    ];
    function poses(t) {
      var A = [R * Math.cos(t), R * Math.sin(t)], B = [A[0] + Math.sqrt(L * L - A[1] * A[1]), 0];
      return { A: A, B: B, pose: [[[0, 0], 0], [[0, 0], t], [A, Math.atan2(B[1] - A[1], B[0] - A[0])], [B, 0]] };
    }
    function tf(p, pose) { var dx = p[0] - pose[0][0], dy = p[1] - pose[0][1], c = Math.cos(-pose[1]), s = Math.sin(-pose[1]); return [dx * c - dy * s, dx * s + dy * c]; }
    function draw() {
      var k = +sel.v(); ctx.clear();
      info.innerHTML = '<b>' + MACH[k][0] + '.</b> ' + MACH[k][1];
      var g = poses(th), fp = g.pose[k];
      var T = function (p) { return tf(p, fp); };
      /* screen placement depends on fixed link */
      var origin = [[200, 200], [390, 200], [300, 200], [480, 200]][k];
      var sc = 2.0;
      function S(p) { var q = T(p); return [origin[0] + q[0] * sc, origin[1] - q[1] * sc]; }
      /* ground under fixed link */
      var gp = S(fp[0]);
      var gy = gp[1] + 120;
      U.hatchLine(ctx, gp[0] - 70, gy, gp[0] + 70, gy, 1);
      ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(gp[0] - 14, gy); ctx.lineTo(gp[0], gp[1] + 8); ctx.lineTo(gp[0] + 14, gy); ctx.stroke(); ctx.restore();
      U.label(ctx, NAMES[k] + ' fixed to the ground', gp[0], gy + 22, { size: 13, align: 'center', color: C.ink2, roman: true });
      /* frame: bar from O to cylinder, and the cylinder walls */
      var x0 = L - R - 25, x1 = L + R + 40;
      var fw = [[0, 0], [x0, 0]], c1 = [[x0, 20], [x1, 20]], c2 = [[x0, -20], [x1, -20]], cEnd = [[x1, 20], [x1, -20]];
      var fc = COL[0];
      U.line(ctx, [S(fw[0]), S([x0, 0])], fc, 8);
      U.line(ctx, [S(c1[0]), S(c1[1])], fc, 5); U.line(ctx, [S(c2[0]), S(c2[1])], fc, 5); U.line(ctx, [S(cEnd[0]), S(cEnd[1])], fc, 5);
      U.line(ctx, [S([x0, 20]), S([x0, -20])], fc, 5);
      /* slider block */
      var B = g.B, sb = [[B[0] - 18, -15], [B[0] + 18, -15], [B[0] + 18, 15], [B[0] - 18, 15]].map(S);
      ctx.save(); ctx.fillStyle = 'rgba(168,20,28,0.18)'; ctx.strokeStyle = COL[3]; ctx.lineWidth = 2;
      ctx.beginPath(); sb.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      U.link(ctx, S([0, 0]), S(g.A), COL[1], 9);
      U.link(ctx, S(g.A), S(B), COL[2], 9);
      U.pin(ctx, S([0, 0])); U.pin(ctx, S(g.A)); U.pin(ctx, S(B));
      U.label(ctx, 'O', S([0, 0])[0] - 18, S([0, 0])[1] - 12, { size: 14 }); U.label(ctx, 'A', S(g.A)[0] + 8, S(g.A)[1] - 12, { size: 14 }); U.label(ctx, 'B', S(B)[0] + 6, S(B)[1] - 22, { size: 14 });
      if (tr.v()) {
        var pts = [[x1, 0], [g.A[0] * 0.6, g.A[1] * 0.6], [(g.A[0] + B[0]) / 2, (g.A[1] + B[1]) / 2], [B[0] + 18, 0]];
        for (var i = 0; i < 4; i++) {
          if (i === k) continue;
          var sp = S(pts[i]); traces[i].push(sp); if (traces[i].length > 240) traces[i].shift();
          U.line(ctx, traces[i], COL[i], 1, [2, 3]);
        }
      }
      /* legend */
      for (var j = 0; j < 4; j++) { ctx.fillStyle = COL[j]; ctx.fillRect(700, 30 + j * 24, 18, 8); U.label(ctx, (j + 1) + ' ' + NAMES[j], 726, 34 + j * 24, { size: 13, roman: true }); }
    }
    sel.sel.addEventListener('change', function () { traces = [[], [], [], []]; });
    draw(); U.onRedraw(draw);
    U.loop(host, function (dt) { th = (th + dt * spd.v() * 2) % (2 * Math.PI); draw(); });
  })();

  /* ================= crank and slotted-lever quick return with Coriolis ================= */
  (function () {
    var host = document.getElementById('sim-qr'); if (!host) return;
    var sh = U.simShell(host);
    function upd() { draw(); }
    var r = U.slider(sh.ctl, { label: 'Crank radius r', unit: 'mm', min: 30, max: 100, step: 1, value: 60, fmt: function (v) { return v; } }, upd);
    var c = U.slider(sh.ctl, { label: 'Pivot distance c', unit: 'mm', min: 80, max: 200, step: 1, value: 120, fmt: function (v) { return v; } }, upd);
    var w = U.slider(sh.ctl, { label: 'Crank speed ω', unit: 'rad/s', min: 1, max: 10, step: 0.5, value: 3 }, upd);
    var spd = U.slider(sh.ctl, { label: 'Animation speed', min: 0, max: 1, step: 0.05, value: 0.4, fmt: function (v) { return v.toFixed(2); } });
    var corChk = U.check(sh.ctl, 'Show Coriolis component 2ωv', true, upd);
    var ctx = U.canvas(sh.view, 900, 440);
    var out = U.outputs(sh.view, [['beta', 'Return stroke angle β', 'degrees'], ['alpha', 'Cutting stroke angle α', 'degrees'], ['ratio', 'Time ratio α/β', ''], ['wl', 'Lever ω_l', 'rad/s'], ['vs', 'Sliding velocity v', 'm/s'], ['ac', 'Coriolis 2ω_l v', 'm/s²']]);
    var msg = U.msg(sh.view);
    var psi = -1.2;
    function state(R, Cc, W, ps) {
      var A = [R * Math.cos(ps), Cc + R * Math.sin(ps)];
      var s = Math.hypot(A[0], A[1]), e = [A[0] / s, A[1] / s], nn = [-e[1], e[0]];
      var vA = [-W * R * Math.sin(ps), W * R * Math.cos(ps)];
      var vs = vA[0] * e[0] + vA[1] * e[1], wl = (vA[0] * nn[0] + vA[1] * nn[1]) / s;
      return { A: A, s: s, e: e, n: nn, vs: vs, wl: wl, phi: Math.atan2(A[1], A[0]) };
    }
    function draw() {
      ctx.clear();
      var R = r.v(), Cc = c.v(), W = w.v();
      if (R >= Cc - 5) { msg('The crank radius must be smaller than the pivot distance, or the lever would have to turn fully.', 'bad'); return; }
      var beta = 2 * deg(Math.acos(R / Cc)), alpha = 360 - beta;
      var H = Cc + R + 40;
      var st = state(R, Cc, W, psi);
      var ac = 2 * st.wl * st.vs / 1000;
      out({ beta: f(beta, 4), alpha: f(alpha, 4), ratio: f(alpha / beta, 3), wl: f(st.wl, 3), vs: f(st.vs / 1000, 3), ac: f(ac, 3) });
      msg('', 'ok');
      host.querySelector('.msg').innerHTML = 'The block slides along the lever while the lever turns, so its acceleration includes ' + U.m('2ω_l v') + ' at right angles to the lever. The cutting stroke takes ' + f(alpha / beta, 3) + ' times as long as the return.';
      /* mechanism */
      var sc = 300 / (H + 30), P0 = [230, 400];
      function S(p) { return [P0[0] + p[0] * sc, P0[1] - p[1] * sc]; }
      var O = S([0, Cc]), A = S(st.A);
      /* return arc shading (near P) */
      var g1 = Math.acos(R / Cc);
      ctx.save(); ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(184,106,0,0.25)';
      ctx.beginPath(); ctx.arc(O[0], O[1], R * sc, Math.PI / 2 - g1, Math.PI / 2 + g1); ctx.stroke();
      ctx.strokeStyle = 'rgba(29,95,174,0.18)'; ctx.beginPath(); ctx.arc(O[0], O[1], R * sc, Math.PI / 2 + g1, Math.PI / 2 - g1 + 2 * Math.PI); ctx.stroke(); ctx.restore();
      U.label(ctx, 'return β', O[0], O[1] + R * sc + 20, { size: 12, align: 'center', color: C.amber, roman: true });
      U.label(ctx, 'cutting α', O[0], O[1] - R * sc - 14, { size: 12, align: 'center', color: C.blue, roman: true });
      /* lever */
      var Lend = [Math.cos(st.phi) * (H / Math.sin(st.phi)) * 1.0, H];
      var Ls = S([Math.cos(st.phi) * (H + 20) / Math.sin(st.phi), H + 20]);
      U.link(ctx, S([0, 0]), Ls, C.amber, 10);
      /* ram */
      var rx = H / Math.tan(st.phi);
      var ram = S([rx, H]);
      U.hatchLine(ctx, S([-170, H + 22])[0], S([0, H + 22])[1], S([170, H + 22])[0], S([0, H + 22])[1], -1);
      ctx.save(); ctx.fillStyle = '#dfe3e8'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
      ctx.fillRect(ram[0] - 60, ram[1] - 22, 120, 18); ctx.strokeRect(ram[0] - 60, ram[1] - 22, 120, 18); ctx.restore();
      U.pin(ctx, ram);
      U.label(ctx, 'ram (tool)', ram[0] + 64, ram[1] - 14, { size: 12, color: C.ink2, roman: true });
      /* crank */
      U.link(ctx, O, A, C.blue, 8);
      /* block on lever */
      ctx.save(); ctx.translate(A[0], A[1]); ctx.rotate(-st.phi); ctx.fillStyle = 'rgba(168,20,28,0.2)'; ctx.strokeStyle = C.red; ctx.lineWidth = 1.6;
      ctx.fillRect(-15, -9, 30, 18); ctx.strokeRect(-15, -9, 30, 18); ctx.restore();
      U.ground(ctx, S([0, 0])); U.ground(ctx, O); U.pin(ctx, A);
      U.label(ctx, 'P', S([0, 0])[0] - 22, S([0, 0])[1], { size: 13 }); U.label(ctx, 'O', O[0] - 20, O[1] - 6, { size: 13 }); U.label(ctx, 'A', A[0] + 14, A[1] + 14, { size: 13 });
      if (corChk.v()) {
        var am = 70 * Math.sign(ac) * Math.min(1, Math.abs(ac) / (2 * W * W * R / 1000 + 1e-9));
        U.arrow(ctx, A[0], A[1], A[0] + st.n[0] * am, A[1] - st.n[1] * am, C.red, 2.4);
        U.label(ctx, '2ω_l v', A[0] + st.n[0] * am + 6, A[1] - st.n[1] * am - 8, { size: 13, color: C.red });
        var vsl = 40 * st.vs / (W * R + 1e-9);
        U.arrow(ctx, A[0], A[1], A[0] + st.e[0] * vsl, A[1] - st.e[1] * vsl, C.green, 2);
        U.label(ctx, 'v', A[0] + st.e[0] * vsl + 6, A[1] - st.e[1] * vsl, { size: 13, color: C.green });
      }
      /* ram velocity plot over one crank turn */
      var bx = { x: 520, y: 60, w: 350, h: 300 };
      var data = [], vmax = 1e-6;
      for (var i = 0; i <= 360; i += 2) {
        var p = rad(i) - Math.PI / 2;
        var s2 = state(R, Cc, W, p);
        var vr = -H / Math.pow(Math.sin(s2.phi), 2) * s2.wl / 1000;
        data.push([i, vr]); vmax = Math.max(vmax, Math.abs(vr));
      }
      var ax = U.axes(ctx, bx, { xmin: 0, xmax: 360, ymin: -vmax * 1.1, ymax: vmax * 1.1, xticks: [0, 90, 180, 270, 360], xlabel: 'crank angle from bottom position (degrees)', ylabel: 'ram velocity (m/s)' });
      U.line(ctx, data.map(function (q) { return [ax.X(q[0]), ax.Y(q[1])]; }), C.ink, 2);
      var cur = ((deg(psi + Math.PI / 2) % 360) + 360) % 360;
      var vr0 = -H / Math.pow(Math.sin(st.phi), 2) * st.wl / 1000;
      U.dot(ctx, ax.X(cur), ax.Y(vr0), 5, C.red, false);
      U.label(ctx, 'fast return: short, high peak', bx.x + 8, bx.y + 14, { size: 12, color: C.amber, roman: true });
      U.label(ctx, 'slow cutting stroke: long, low plateau', bx.x + bx.w - 8, bx.y + bx.h - 14, { size: 12, color: C.blue, align: 'right', roman: true });
    }
    draw(); U.onRedraw(draw);
    U.loop(host, function (dt) { psi += dt * spd.v() * 3; draw(); });
  })();

  /* ================= live worked examples ================= */
  U.calcs.scv = function (v) {
    var r = v.r / 1000, L = v.L / 1000, n = L / r, t = rad(v.t);
    var phi = Math.asin(Math.sin(t) / n);
    return { vA: f(v.w * r, 3), vP: f(v.w * r * (Math.sin(t) + Math.sin(2 * t) / (2 * n)), 3), phi: f(deg(phi), 3), wr: f(v.w * r * Math.cos(t) / (L * Math.cos(phi)), 3) };
  };
  U.calcs.sca = function (v) {
    var r = v.r / 1000, n = v.L / v.r, t = rad(v.t), w2r = v.w * v.w * r;
    return { w2r: f(w2r, 3), aP: f(w2r * (Math.cos(t) + Math.cos(2 * t) / n), 3), aT: f(w2r * (1 + 1 / n), 3), aB: f(w2r * (-1 + 1 / n), 3) };
  };
  U.initLive();
})();
