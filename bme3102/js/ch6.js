/* Chapter 6 live models: motion generation, crank-rocker design, Freudenstein function generator */
(function () {
  'use strict';
  var C = U.C, f = U.f, rad = U.rad, deg = U.deg;

  function circX(P0, r0, P1, r1, prev) {
    var dx = P1[0] - P0[0], dy = P1[1] - P0[1], e = Math.hypot(dx, dy);
    if (e < 1e-9 || e > r0 + r1 || e < Math.abs(r0 - r1)) return null;
    var aa = (r0 * r0 - r1 * r1 + e * e) / (2 * e), h = Math.sqrt(Math.max(0, r0 * r0 - aa * aa));
    var mx = P0[0] + aa * dx / e, my = P0[1] + aa * dy / e;
    var s1 = [mx - h * dy / e, my + h * dx / e], s2 = [mx + h * dy / e, my - h * dx / e];
    if (!prev) return s1;
    return Math.hypot(s1[0] - prev[0], s1[1] - prev[1]) <= Math.hypot(s2[0] - prev[0], s2[1] - prev[1]) ? s1 : s2;
  }
  function circumcentre(p1, p2, p3) {
    var ax = p1[0], ay = p1[1], bx = p2[0], by = p2[1], cx = p3[0], cy = p3[1];
    var d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(d) < 1e-9) return null;
    var a2 = ax * ax + ay * ay, b2 = bx * bx + by * by, c2 = cx * cx + cy * cy;
    return [(a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d, (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d];
  }
  function dist(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1]); }
  function grashof(L) {
    var s = L.slice().sort(function (x, y) { return x - y; });
    return s[0] + s[3] <= s[1] + s[2] + 1e-9;
  }
  function ground(ctx, p) { U.ground(ctx, p, 6); }

  /* ================= three-position motion generation ================= */
  (function () {
    var host = document.getElementById('sim-mg'); if (!host) return;
    var sh = U.simShell(host);
    var PRE = {
      box: { name: 'Lift a box onto a bench', P: [[0, 0, 0], [25, 45, 35], [75, 55, -10]], h: [-15, 0, 0] },
      bucket: { name: 'Tip a bucket', P: [[0, 0, 0], [26, 30, 50], [40, 44, 110]], h: [-15, 15, 0] },
      lid: { name: 'Swing a lid up and over', P: [[0, 0, 0], [-10, 35, 70], [-40, 45, 160]], h: [-15, 15, 0] }
    };
    var t = 0, dir = 1, geo = null;
    function upd() { build(); draw(); }
    var pre = U.select(sh.ctl, 'Task', Object.keys(PRE).map(function (k) { return [k, PRE[k].name]; }), function () { var h = PRE[pre.v()].h; uB.set(h[0]); uC.set(h[1]); vv.set(h[2]); t = 0; upd(); });
    var uB = U.slider(sh.ctl, { label: 'Hinge B along the body', unit: 'cm', min: -25, max: 25, step: 0.5, value: -15, fmt: function (v) { return v.toFixed(1); } }, upd);
    var uC = U.slider(sh.ctl, { label: 'Hinge C along the body', unit: 'cm', min: -25, max: 25, step: 0.5, value: 0, fmt: function (v) { return v.toFixed(1); } }, upd);
    var vv = U.slider(sh.ctl, { label: 'Hinges below the body by', unit: 'cm', min: -15, max: 15, step: 0.5, value: 0, fmt: function (v) { return v.toFixed(1); } }, upd);
    var ctx = U.canvas(sh.view, 820, 420);
    var out = U.outputs(sh.view, [['a', 'Input link AB', 'cm'], ['b', 'Coupler BC', 'cm'], ['c', 'Output link DC', 'cm'], ['d', 'Fixed link AD', 'cm'], ['g', 'Grashof', '']]);
    var msg = U.msg(sh.view);
    function pose(P, loc) { var a = rad(P[2]), c = Math.cos(a), s = Math.sin(a); return [P[0] + loc[0] * c - loc[1] * s, P[1] + loc[0] * s + loc[1] * c]; }
    function build() {
      var Ps = PRE[pre.v()].P, lb = [uB.v(), -vv.v()], lc = [uC.v(), -vv.v()];
      var B = Ps.map(function (P) { return pose(P, lb); }), Cc = Ps.map(function (P) { return pose(P, lc); });
      var A = circumcentre(B[0], B[1], B[2]), D = circumcentre(Cc[0], Cc[1], Cc[2]);
      geo = { Ps: Ps, lb: lb, lc: lc, B: B, C: Cc, A: A, D: D, ok: true, why: '' };
      if (!A || !D || dist(A, B[0]) > 600 || dist(D, Cc[0]) > 600) { geo.ok = false; geo.why = 'far'; return; }
      var a1 = Math.atan2(B[0][1] - A[1], B[0][0] - A[0]), a2 = Math.atan2(B[1][1] - A[1], B[1][0] - A[0]), a3 = Math.atan2(B[2][1] - A[1], B[2][0] - A[0]);
      function ccw(x) { return ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); }
      var d13 = ccw(a3 - a1), d12 = ccw(a2 - a1), sweep = d12 < d13 ? d13 : -(2 * Math.PI - d13);
      geo.a1 = a1; geo.sweep = sweep; geo.rB = dist(A, B[0]); geo.rC = dist(D, Cc[0]); geo.bc = dist(B[0], Cc[0]);
      /* trace and check the order */
      var prev = Cc[0], best = Infinity, n = 240, mid = Math.abs(ccw(a2 - a1) / Math.abs(sweep));
      if (sweep < 0) mid = ccw(a1 - a2) / Math.abs(sweep);
      for (var i = 0; i <= n; i++) {
        var th = a1 + sweep * i / n, Bp = [A[0] + geo.rB * Math.cos(th), A[1] + geo.rB * Math.sin(th)];
        var Cp = circX(Bp, geo.bc, D, geo.rC, prev);
        if (!Cp) { geo.ok = false; geo.why = 'stuck'; geo.stuckAt = i / n; break; }
        prev = Cp;
        if (Math.abs(i / n - mid) < 0.5 / n + 1e-9) best = dist(Cp, Cc[1]);
      }
      if (geo.ok && dist(prev, Cc[2]) > 1) { geo.ok = false; geo.why = 'branch'; }
      else if (geo.ok && best > 1) { geo.ok = false; geo.why = 'order'; }
    }
    function draw() {
      if (!geo) return;
      ctx.clear();
      var G = geo, pts = G.B.concat(G.C);
      if (G.A && dist(G.A, G.B[0]) < 600) pts.push(G.A); if (G.D && dist(G.D, G.C[0]) < 600) pts.push(G.D);
      var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(0, xs) - 25, x1 = Math.max.apply(0, xs) + 25, y0 = Math.min.apply(0, ys) - 25, y1 = Math.max.apply(0, ys) + 25;
      var sc = Math.min(560 / (x1 - x0), 380 / (y1 - y0));
      function W(p) { return [20 + (p[0] - x0) * sc + (560 - (x1 - x0) * sc) / 2, 400 - (p[1] - y0) * sc]; }
      function body(P, style) {
        var cn = [[-25, -10], [25, -10], [25, 10], [-25, 10]].map(function (q) { return W(pose(P, q)); });
        ctx.save(); ctx.beginPath(); cn.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath();
        if (style === 'ghost') { ctx.setLineDash([5, 4]); ctx.strokeStyle = C.mute; ctx.stroke(); }
        else { ctx.fillStyle = 'rgba(29,122,70,0.25)'; ctx.fill(); ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.stroke(); }
        ctx.restore();
      }
      G.Ps.forEach(function (P, i) { body(P, 'ghost'); var q = W(pose(P, [0, 0])); U.label(ctx, String(i + 1), q[0], q[1], { size: 14, align: 'center', color: C.mute, roman: true }); });
      G.B.forEach(function (p) { U.dot(ctx, W(p)[0], W(p)[1], 3, C.blue, false); });
      G.C.forEach(function (p) { U.dot(ctx, W(p)[0], W(p)[1], 3, C.amber, false); });
      if (!G.ok && G.why === 'far') {
        out({ a: '—', b: '—', c: '—', d: '—', g: '—' });
        msg('The three positions of one hinge are almost on a straight line, so its pivot would be very far away (or does not exist). Move that hinge along the body.', 'bad'); return;
      }
      /* midnormal construction lines */
      [[G.B, G.A, C.blue], [G.C, G.D, C.amber]].forEach(function (z) {
        var P3 = z[0], O = z[1];
        [[0, 1], [1, 2]].forEach(function (pr) { var m = [(P3[pr[0]][0] + P3[pr[1]][0]) / 2, (P3[pr[0]][1] + P3[pr[1]][1]) / 2]; U.line(ctx, [W(m), W(O)], z[2], 0.8, [3, 3]); });
        ctx.save(); ctx.strokeStyle = z[2]; ctx.globalAlpha = 0.35; ctx.setLineDash([2, 4]); var o = W(O); ctx.beginPath(); ctx.arc(o[0], o[1], dist(O, P3[0]) * sc, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      });
      /* moving linkage */
      var th = G.a1 + G.sweep * t, Bp = [G.A[0] + G.rB * Math.cos(th), G.A[1] + G.rB * Math.sin(th)];
      var Cp = G.ok ? circX(Bp, G.bc, G.D, G.rC, G._prev || G.C[0]) : G.C[0];
      if (!G.ok) Bp = G.B[0];
      if (Cp) {
        G._prev = Cp;
        var angBody = Math.atan2(Cp[1] - Bp[1], Cp[0] - Bp[0]) - Math.atan2(G.lc[1] - G.lb[1], G.lc[0] - G.lb[0]);
        var cs = Math.cos(angBody), sn = Math.sin(angBody);
        var org = [Bp[0] - (G.lb[0] * cs - G.lb[1] * sn), Bp[1] - (G.lb[0] * sn + G.lb[1] * cs)];
        body([org[0], org[1], deg(angBody)], 'solid');
        U.link(ctx, W(G.A), W(Bp), C.blue, 7); U.link(ctx, W(G.D), W(Cp), C.amber, 7);
        U.pin(ctx, W(Bp)); U.pin(ctx, W(Cp));
      }
      ground(ctx, W(G.A)); ground(ctx, W(G.D));
      U.label(ctx, 'A', W(G.A)[0] - 20, W(G.A)[1] - 6, { size: 14 }); U.label(ctx, 'D', W(G.D)[0] + 10, W(G.D)[1] - 6, { size: 14 });
      var L = [G.rB, G.bc, G.rC, dist(G.A, G.D)];
      out({ a: f(L[0], 3), b: f(L[1], 3), c: f(L[2], 3), d: f(L[3], 3), g: grashof(L) ? 'yes' : 'no' });
      U.label(ctx, 'dashed outlines: the three required positions; dotted: midnormals and pivot circles', 20, 20, { size: 12, color: C.ink2, roman: true });
      if (G.ok) msg('The linkage carries the body through positions 1, 2 and 3 in order. Pivot A is the centre of the circle through B₁, B₂, B₃; D through C₁, C₂, C₃.', 'ok');
      else if (G.why === 'stuck') msg('Defect: the linkage locks up part-way (the coupler cannot reach) before it gets to position 3. On the real machine it would jam. Move a hinge.', 'bad');
      else if (G.why === 'branch') msg('Branch defect: the linkage reaches position 3 only by being taken apart and reassembled the other way. Move a hinge.', 'bad');
      else msg('Order defect: the linkage reaches the positions, but not in the order 1, 2, 3. Move a hinge.', 'bad');
    }
    build(); draw(); U.onRedraw(draw);
    U.loop(host, function (dt) {
      if (!geo || !geo.ok) { draw(); return; }
      t += dir * dt * 0.3; if (t > 1) { t = 1; dir = -1; } if (t < 0) { t = 0; dir = 1; } draw();
    });
  })();

  /* ================= crank-rocker design ================= */
  (function () {
    var host = document.getElementById('sim-crq'); if (!host) return;
    var sh = U.simShell(host);
    var th = 0, geo = null;
    function upd() { build(); draw(); }
    var c = U.slider(sh.ctl, { label: 'Rocker O_4C', unit: 'mm', min: 40, max: 120, step: 1, value: 80, fmt: function (v) { return v; } }, upd);
    var psi = U.slider(sh.ctl, { label: 'Rocker swing ψ', unit: 'degrees', min: 20, max: 100, step: 1, value: 60, fmt: function (v) { return v; } }, upd);
    var Q = U.slider(sh.ctl, { label: 'Time ratio Q', min: 1.02, max: 2, step: 0.01, value: 1.25, fmt: function (v) { return v.toFixed(2); } }, upd);
    var lam = U.slider(sh.ctl, { label: 'Position of O_2 on its circle', unit: 'degrees', min: -80, max: 80, step: 1, value: -30, fmt: function (v) { return v; } }, upd);
    U.buttons(sh.ctl, [['b', 'Find the best transmission angle', function () { best(); draw(); }]]);
    function best() {
      var bv = 0, bs = -1;
      for (var v = -80; v <= 80; v += 1) {
        lam.set(v); build();
        var G = geo, ok = G.ok && grashof([G.a, G.b, G.cc, G.d]) && G.a <= Math.min(G.b, G.cc, G.d);
        if (!ok) continue;
        var sc = Math.min(G.mumin, 180 - G.mumax);
        if (sc > bs) { bs = sc; bv = v; }
      }
      lam.set(bv); build();
    }
    var ctx = U.canvas(sh.view, 820, 420);
    var out = U.outputs(sh.view, [['al', 'Angle α', 'degrees'], ['a', 'Crank a', 'mm'], ['b', 'Coupler b', 'mm'], ['d', 'Frame d', 'mm'], ['mu', 'Transmission angle range', 'degrees'], ['chk', 'Swing and Q from the linkage', '']]);
    var msg = U.msg(sh.view);
    function build() {
      var cc = c.v(), ps = rad(psi.v()), al = Math.PI * (Q.v() - 1) / (Q.v() + 1);
      var C1 = [cc * Math.cos(Math.PI / 2 + ps / 2), cc * Math.sin(Math.PI / 2 + ps / 2)], C2 = [cc * Math.cos(Math.PI / 2 - ps / 2), cc * Math.sin(Math.PI / 2 - ps / 2)];
      var h = cc * Math.sin(ps / 2), ym = cc * Math.cos(ps / 2), R = h / Math.sin(al), yc = ym - Math.sqrt(Math.max(0, R * R - h * h));
      var lmax = Math.PI - Math.asin(Math.min(1, h / R));
      var l = rad(lam.v()) * lmax / (Math.PI / 2) * 0.9;
      var O2 = [R * Math.sin(l), yc - R * Math.cos(l)];
      var L1 = dist(O2, C1), L2 = dist(O2, C2);
      var a = Math.abs(L1 - L2) / 2, b = (L1 + L2) / 2, d = dist(O2, [0, 0]);
      geo = { cc: cc, ps: ps, al: al, C1: C1, C2: C2, yc: yc, R: R, O2: O2, a: a, b: b, d: d, ext: L1 > L2 ? C1 : C2 };
      /* simulate: frame from O2 to O4 */
      var base = Math.atan2(-O2[1], -O2[0]);
      geo.base = base;
      var mus = [], phis = [], prev = null, ok = true;
      var thExt = Math.atan2(geo.ext[1] - O2[1], geo.ext[0] - O2[0]);
      for (var i = 0; i <= 360; i++) {
        var t2 = thExt + rad(i), B = [O2[0] + a * Math.cos(t2), O2[1] + a * Math.sin(t2)];
        var Cp = circX(B, b, [0, 0], cc, prev || geo.ext);
        if (!Cp) { ok = false; break; }
        prev = Cp; phis.push(Math.atan2(Cp[1], Cp[0]));
        var v1 = [B[0] - Cp[0], B[1] - Cp[1]], v2 = [-Cp[0], -Cp[1]];
        mus.push(deg(Math.acos(U.clamp((v1[0] * v2[0] + v1[1] * v2[1]) / (b * cc), -1, 1))));
      }
      geo.ok = ok;
      if (ok) {
        var imin = 0, imax = 0; phis.forEach(function (p, i2) { if (p < phis[imin]) imin = i2; if (p > phis[imax]) imax = i2; });
        geo.swing = deg(phis[imax] - phis[imin]);
        var arc = Math.abs(imax - imin); geo.Qs = Math.max(arc, 360 - arc) / Math.min(arc, 360 - arc);
        geo.mumin = Math.min.apply(0, mus); geo.mumax = Math.max.apply(0, mus);
      }
      geo.thExt = thExt;
    }
    function draw() {
      if (!geo) return;
      ctx.clear();
      var G = geo, sc = 150 / G.cc, cx = 300, cy = 300;
      var span = Math.max(G.R * 2.2, G.cc * 1.5);
      sc = Math.min(330 / span, 2.2);
      cy = 60 + Math.max(G.cc * Math.cos(G.ps / 2), G.cc) * sc;
      function W(p) { return [cx + p[0] * sc, cy - p[1] * sc]; }
      /* locus circle */
      var oc = W([0, G.yc]); ctx.save(); ctx.strokeStyle = C.line; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(oc[0], oc[1], G.R * sc, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      /* extreme rocker positions */
      U.line(ctx, [W([0, 0]), W(G.C1)], C.amber, 1.2, [4, 3]); U.line(ctx, [W([0, 0]), W(G.C2)], C.amber, 1.2, [4, 3]);
      U.line(ctx, [W(G.O2), W(G.C1)], C.blue, 1, [2, 3]); U.line(ctx, [W(G.O2), W(G.C2)], C.blue, 1, [2, 3]);
      U.label(ctx, 'C_1', W(G.C1)[0] - 26, W(G.C1)[1] - 6, { size: 13 }); U.label(ctx, 'C_2', W(G.C2)[0] + 8, W(G.C2)[1] - 6, { size: 13 });
      if (G.ok) {
        var t2 = G.thExt + th, B = [G.O2[0] + G.a * Math.cos(t2), G.O2[1] + G.a * Math.sin(t2)];
        var Cp = circX(B, G.b, [0, 0], G.cc, G._prev || G.ext);
        if (Cp) {
          G._prev = Cp;
          U.link(ctx, W(G.O2), W([0, 0]), '#8a9099', 6);
          U.link(ctx, W(G.O2), W(B), C.blue, 8); U.link(ctx, W(B), W(Cp), C.green, 8); U.link(ctx, W([0, 0]), W(Cp), C.amber, 8);
          U.pin(ctx, W(B)); U.pin(ctx, W(Cp));
        }
      }
      ground(ctx, W([0, 0])); ground(ctx, W(G.O2));
      U.label(ctx, 'O_4', W([0, 0])[0] + 10, W([0, 0])[1] + 4, { size: 13 }); U.label(ctx, 'O_2', W(G.O2)[0] - 28, W(G.O2)[1] + 4, { size: 13, color: C.blue });
      U.label(ctx, 'dashed circle: every point on it gives the required time ratio', 20, 24, { size: 12, color: C.ink2, roman: true });
      out({ al: f(deg(G.al), 3), a: f(G.a, 3), b: f(G.b, 3), d: f(G.d, 3), mu: G.ok ? f(G.mumin, 3) + ' to ' + f(G.mumax, 3) : '—', chk: G.ok ? 'ψ = ' + f(G.swing, 3) + '°, Q = ' + f(G.Qs, 3) : '—' });
      var gr = grashof([G.a, G.b, G.cc, G.d]) && G.a <= Math.min(G.b, G.cc, G.d);
      if (!G.ok || !gr) msg('This choice does not give a crank-rocker: the crank cannot turn fully. Move O₂ along the circle.', 'bad');
      else if (G.mumin < 40 || G.mumax > 140) msg('A working crank-rocker, but the transmission angle reaches ' + f(G.mumin < 40 ? G.mumin : G.mumax, 3) + '°: the rocker will be driven poorly near that position, with high joint forces. Try another position of O₂, or a smaller swing or time ratio.', 'warn');
      else msg('A good crank-rocker: the crank turns fully, the swing and time ratio are met, and the transmission angle stays between 40° and 140°.', 'ok');
    }
    best(); draw(); U.onRedraw(draw);
    U.loop(host, function (dt) { th += dt * 1.5; draw(); });
  })();

  /* ================= Freudenstein function generator ================= */
  function solve3(M, b) {
    function det(m) { return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]); }
    var D = det(M); if (Math.abs(D) < 1e-12) return null;
    return [0, 1, 2].map(function (i) { return det(M.map(function (row, j) { return row.map(function (v, k) { return k === i ? b[j] : v; }); })) / D; });
  }
  function freud(th, ph, d) {
    var M = th.map(function (t, i) { return [Math.cos(ph[i]), Math.cos(t), 1]; }), b = th.map(function (t, i) { return Math.cos(t - ph[i]); });
    var k = solve3(M, b); if (!k) return null;
    var a = d / k[0], c = -d / k[1], b2 = a * a + c * c + d * d - 2 * a * c * k[2];
    return { k: k, a: a, c: c, b: b2 > 0 ? Math.sqrt(b2) : NaN };
  }
  function phiOf(k, th, prev) {
    var A = k[0] - Math.cos(th), B = -Math.sin(th), Cc = -(k[1] * Math.cos(th) + k[2]), R = Math.hypot(A, B);
    if (Math.abs(Cc / R) > 1) return null;
    var base = Math.atan2(B, A), dd = Math.acos(Cc / R), p1 = base + dd, p2 = base - dd;
    function near(p) { return Math.abs(Math.atan2(Math.sin(p - prev), Math.cos(p - prev))); }
    var p = near(p1) < near(p2) ? p1 : p2;
    return prev + Math.atan2(Math.sin(p - prev), Math.cos(p - prev));
  }
  (function () {
    var host = document.getElementById('sim-fg'); if (!host) return;
    var sh = U.simShell(host);
    var FN = {
      p15: { n: 'y = x^1.5, 1 to 4 (Rattan Ex. 5.11)', f: function (x) { return Math.pow(x, 1.5); }, xs: 1, xf: 4, ts: 30, dt: 90, ps: 60, dp: 70, sp: 'cheb', d: 30 },
      sq: { n: 'y = x^2, 0 to 2 (Rattan Ex. 5.8)', f: function (x) { return x * x; }, xs: 0, xf: 2, ts: 50, dt: 100, ps: 80, dp: 80, sp: 'ends', d: 50 },
      sq2: { n: 'y = x^2, 0 to 2, better ranges', f: function (x) { return x * x; }, xs: 0, xf: 2, ts: 130, dt: 110, ps: 50, dp: 60, sp: 'cheb', d: 50 },
      log: { n: 'y = log10 x, 1 to 10', f: function (x) { return Math.log10(x); }, xs: 1, xf: 10, ts: 30, dt: 90, ps: 80, dp: 90, sp: 'cheb', d: 50 },
      sin: { n: 'y = sin x, 0 to 90 degrees', f: function (x) { return Math.sin(rad(x)); }, xs: 0, xf: 90, ts: 100, dt: 110, ps: 90, dp: 60, sp: 'cheb', d: 50 },
      inv: { n: 'y = 1/x, 1 to 3', f: function (x) { return 1 / x; }, xs: 1, xf: 3, ts: 30, dt: 80, ps: 100, dp: 60, sp: 'cheb', d: 50 }
    };
    var t = 0, dir = 1, geo = null;
    function upd() { build(); draw(); }
    function preset() { var F = FN[fn.v()]; ts.set(F.ts); dtt.set(F.dt); ps.set(F.ps); dp.set(F.dp); spc.set(F.sp); d.set(F.d); }
    var fn = U.select(sh.ctl, 'Function', Object.keys(FN).map(function (k) { return [k, FN[k].n]; }), function () { preset(); upd(); });
    var ts = U.slider(sh.ctl, { label: 'Input start θ_s', unit: 'degrees', min: 0, max: 180, step: 1, value: 50, fmt: function (v) { return v; } }, upd);
    var dtt = U.slider(sh.ctl, { label: 'Input range Δθ', unit: 'degrees', min: 30, max: 150, step: 1, value: 100, fmt: function (v) { return v; } }, upd);
    var ps = U.slider(sh.ctl, { label: 'Output start φ_s', unit: 'degrees', min: 0, max: 180, step: 1, value: 80, fmt: function (v) { return v; } }, upd);
    var dp = U.slider(sh.ctl, { label: 'Output range Δφ', unit: 'degrees', min: 30, max: 150, step: 1, value: 80, fmt: function (v) { return v; } }, upd);
    var spc = U.select(sh.ctl, 'Precision points', [['cheb', 'Chebyshev spacing'], ['ends', 'Equal, including the ends']], upd);
    var d = U.slider(sh.ctl, { label: 'Fixed link d', unit: 'mm', min: 20, max: 100, step: 1, value: 50, fmt: function (v) { return v; } }, upd);
    var ctx = U.canvas(sh.view, 900, 400);
    var out = U.outputs(sh.view, [['k', 'k_1, k_2, k_3', ''], ['L', 'a, b, c', 'mm'], ['xp', 'Precision points x', ''], ['err', 'Largest error', '% of Δφ']]);
    var msg = U.msg(sh.view);
    function build() {
      var F = FN[fn.v()], xs = F.xs, xf = F.xf, ys = F.f(xs), yf = F.f(xf);
      var xp = spc.v() === 'cheb' ? [1, 2, 3].map(function (j) { return (xs + xf) / 2 - (xf - xs) / 2 * Math.cos((2 * j - 1) * Math.PI / 6); }) : [xs, (xs + xf) / 2, xf];
      function TH(x) { return rad(ts.v() + (x - xs) / (xf - xs) * dtt.v()); }
      function PH(y) { return rad(ps.v() + (y - ys) / (yf - ys) * dp.v()); }
      var th = xp.map(TH), ph = xp.map(function (x) { return PH(F.f(x)); });
      var r = freud(th, ph, d.v());
      geo = { F: F, xs: xs, xf: xf, ys: ys, yf: yf, xp: xp, TH: TH, PH: PH, r: r, th: th, ph: ph };
      if (!r || !isFinite(r.b)) { geo.bad = 'nob'; return; }
      var err = [], prev = ph[0], maxe = 0, okk = true;
      /* start the branch at the first precision point and sweep both ways */
      var xsAll = U.range(xs, xf, 200);
      var startIdx = 0, best = 1e9; xsAll.forEach(function (x, i) { if (Math.abs(x - xp[0]) < best) { best = Math.abs(x - xp[0]); startIdx = i; } });
      var gen = new Array(xsAll.length);
      prev = ph[0];
      for (var i = startIdx; i < xsAll.length; i++) { var p = phiOf(r.k, TH(xsAll[i]), prev); if (p == null) { okk = false; break; } gen[i] = p; prev = p; }
      prev = gen[startIdx];
      for (var j = startIdx - 1; j >= 0 && okk; j--) { var p2 = phiOf(r.k, TH(xsAll[j]), prev); if (p2 == null) { okk = false; break; } gen[j] = p2; prev = p2; }
      geo.gen = gen; geo.xsAll = xsAll; geo.okk = okk;
      xsAll.forEach(function (x, i) { if (gen[i] == null) return; var e = deg(gen[i] - PH(F.f(x))) / dp.v() * 100; err.push([x, e]); maxe = Math.max(maxe, Math.abs(e)); });
      geo.err = err; geo.maxe = maxe;
    }
    function draw() {
      if (!geo) return; ctx.clear();
      var G = geo;
      out({ k: G.r ? G.r.k.map(function (v) { return f(v, 4); }).join(', ') : '—', L: G.r && isFinite(G.r.b) ? [G.r.a, G.r.b, G.r.c].map(function (v) { return f(v, 3); }).join(', ') : '—', xp: G.xp.map(function (v) { return f(v, 3); }).join(', '), err: G.err ? f(G.maxe, 3) : '—' });
      if (G.bad || !G.okk) { msg(G.bad ? 'No real coupler length: b² comes out negative. Change the angle ranges or starting angles.' : 'The linkage cannot reach the whole input range without coming apart. Change the angle ranges.', 'bad'); if (G.bad) return; }
      var r = G.r, D0 = d.v();
      /* linkage on the left */
      var x = G.xs + (G.xf - G.xs) * t, th = G.TH(x);
      var idx = Math.round(t * 200), phi = G.gen[idx] != null ? G.gen[idx] : G.ph[0];
      var pts = [[0, 0], [D0, 0], [r.a * Math.cos(th), r.a * Math.sin(th)], [D0 + r.c * Math.cos(phi), r.c * Math.sin(phi)]];
      var ext = Math.max(Math.abs(r.a), Math.abs(r.c), D0) * 1.25;
      var sc = Math.min(180 / ext, 360 / (D0 + 2 * Math.max(Math.abs(r.a), Math.abs(r.c))));
      var ox = 210 - D0 * sc / 2, oy = 220;
      function W(p) { return [ox + p[0] * sc, oy - p[1] * sc]; }
      /* dials */
      function dial(o, len, a0, a1, lab, vals, fmt, col) {
        var c0 = W(o);
        ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(c0[0], c0[1], len * sc, -a1, -a0); ctx.stroke(); ctx.restore();
        vals.forEach(function (v) { var a = v[0]; var p1 = [c0[0] + len * sc * Math.cos(a), c0[1] - len * sc * Math.sin(a)], p2 = [c0[0] + (len * sc + 8) * Math.cos(a), c0[1] - (len * sc + 8) * Math.sin(a)]; U.line(ctx, [p1, p2], col, 1); U.label(ctx, fmt(v[1]), c0[0] + (len * sc + 20) * Math.cos(a), c0[1] - (len * sc + 20) * Math.sin(a), { size: 11, align: 'center', color: col, roman: true }); });
        U.label(ctx, lab, c0[0] + (col === C.blue ? -30 : 30), c0[1] + 30, { size: 12, align: 'center', color: col, roman: true });
      }
      var sA = Math.sign(r.a) || 1, sC = Math.sign(r.c) || 1;
      var xt = U.range(G.xs, G.xf, 4).map(function (xx) { return [G.TH(xx) + (sA < 0 ? Math.PI : 0), xx]; });
      var yt = U.range(G.ys, G.yf, 4).map(function (yy) { return [G.PH(yy) + (sC < 0 ? Math.PI : 0), yy]; });
      dial([0, 0], Math.abs(r.a) * 1.15, 0, 0, 'input x', xt, function (v) { return f(v, 2); }, C.blue);
      dial([D0, 0], Math.abs(r.c) * 1.15, 0, 0, 'output y', yt, function (v) { return f(v, 2); }, C.amber);
      U.link(ctx, W(pts[0]), W(pts[1]), '#8a9099', 7);
      U.link(ctx, W(pts[0]), W(pts[2]), C.blue, 8); U.link(ctx, W(pts[2]), W(pts[3]), C.green, 8); U.link(ctx, W(pts[1]), W(pts[3]), C.amber, 8);
      ground(ctx, W(pts[0])); ground(ctx, W(pts[1])); U.pin(ctx, W(pts[2])); U.pin(ctx, W(pts[3]));
      var yGen = G.ys + (deg(phi) - ps.v()) / dp.v() * (G.yf - G.ys);
      U.label(ctx, 'x = ' + f(x, 3) + '   y wanted = ' + f(G.F.f(x), 3) + '   y given = ' + f(yGen, 3), 20, 385, { size: 13 });
      /* error plot */
      var bx = { x: 520, y: 40, w: 350, h: 290 };
      var em = Math.max(G.maxe * 1.2, 0.5);
      var ax = U.axes(ctx, bx, { xmin: G.xs, xmax: G.xf, ymin: -em, ymax: em, xlabel: 'x', ylabel: 'structural error (% of Δφ)', ylabelOff: 42 });
      U.line(ctx, G.err.map(function (q) { return [ax.X(q[0]), ax.Y(q[1])]; }), C.red, 2);
      G.xp.forEach(function (xx) { U.dot(ctx, ax.X(xx), ax.Y(0), 5, '#fff', C.ink); });
      U.dot(ctx, ax.X(x), ax.Y(G.err[Math.min(G.err.length - 1, idx)] ? G.err[Math.min(G.err.length - 1, idx)][1] : 0), 4, C.red, false);
      U.label(ctx, 'open circles: precision points (zero error)', bx.x + 4, bx.y - 14, { size: 12, color: C.ink2, roman: true });
      if (!G.bad && G.okk) {
        var gr = grashof([Math.abs(r.a), r.b, Math.abs(r.c), D0]);
        msg('Largest error ' + f(G.maxe, 3) + '% of the output range' + (G.maxe < 1 ? ', good enough for a gauge or a mechanism that only has to be close.' : (spc.v() === 'cheb' ? ': too large for an accurate instrument. Try other angle ranges.' : ': too large for an accurate instrument. Try Chebyshev spacing.')) + (gr ? '' : ' Note: not a Grashof linkage, so it can only rock.'), G.maxe < 1 ? 'ok' : 'warn');
      }
    }
    preset(); build(); draw(); U.onRedraw(draw);
    U.loop(host, function (dt) { t += dir * dt * 0.18; if (t > 1) { t = 1; dir = -1; } if (t < 0) { t = 0; dir = 1; } draw(); });
  })();

  U.calcs.freud = function (v) {
    var r = freud([v.t1, v.t2, v.t3].map(rad), [v.p1, v.p2, v.p3].map(rad), v.d);
    if (!r) return { k1: '—', k2: '—', k3: '—', a: '—', b: '—', c: '—' };
    return { k1: f(r.k[0], 4), k2: f(r.k[1], 4), k3: f(r.k[2], 4), a: f(r.a, 4), c: f(r.c, 4), b: isFinite(r.b) ? f(r.b, 4) : 'no real value' };
  };
  U.initLive();
})();
