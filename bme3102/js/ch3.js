/* Chapter 3 live models */
(function () {
  'use strict';
  var C = U.C, f = U.f, deg = U.deg;

  /* draw a vertical coil spring between y1 and y2 at x */
  function spring(ctx, x, y1, y2, w, coils, col) {
    var n = coils || 8, L = y2 - y1, lead = Math.min(10, L * 0.12);
    var pts = [[x, y1], [x, y1 + lead]];
    for (var i = 0; i < n * 2; i++) pts.push([x + (i % 2 ? -w : w), y1 + lead + (L - 2 * lead) * (i + 0.5) / (n * 2)]);
    pts.push([x, y2 - lead]); pts.push([x, y2]);
    U.line(ctx, pts, col || C.ink, 1.6);
  }
  function dashpot(ctx, x, y1, y2, w) {
    var mid = (y1 + y2) / 2;
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y1 + 12); ctx.stroke();
    ctx.strokeRect(x - w, y1 + 12, 2 * w, Math.max(20, mid - y1 + 4));
    ctx.beginPath(); ctx.moveTo(x - w + 4, mid + 6); ctx.lineTo(x + w - 4, mid + 6); ctx.moveTo(x, mid + 6); ctx.lineTo(x, y2); ctx.stroke();
    ctx.restore();
  }
  function hatchTop(ctx, x1, x2, y) { U.hatchLine(ctx, x1, y, x2, y, -1); }

  /* free response, all regimes */
  function freeResp(wn, xi, x0, v0, t) {
    if (xi < 1 - 1e-6) {
      var wd = wn * Math.sqrt(1 - xi * xi);
      return Math.exp(-xi * wn * t) * (x0 * Math.cos(wd * t) + (v0 + xi * wn * x0) / wd * Math.sin(wd * t));
    }
    if (xi < 1 + 1e-6) return Math.exp(-wn * t) * (x0 + (v0 + wn * x0) * t);
    var q = Math.sqrt(xi * xi - 1), s1 = wn * (-xi + q), s2 = wn * (-xi - q);
    var A = (v0 - s2 * x0) / (s1 - s2), B = x0 - A;
    return A * Math.exp(s1 * t) + B * Math.exp(s2 * t);
  }

  /* ================= free and damped vibration ================= */
  (function () {
    var host = document.getElementById('sim-free'); if (!host) return;
    var sh = U.simShell(host);
    var t = 0, playing = true;
    function restart() { t = 0; draw(); }
    var m = U.slider(sh.ctl, { label: 'Mass m', unit: 'kg', min: 1, max: 50, step: 0.5, value: 10, fmt: function (v) { return v.toFixed(1); } }, restart);
    var s = U.slider(sh.ctl, { label: 'Stiffness s', unit: 'kN/m', min: 0.5, max: 20, step: 0.1, value: 4, fmt: function (v) { return v.toFixed(1); } }, restart);
    var ms = U.slider(sh.ctl, { label: 'Mass of the spring m_1', unit: 'kg', min: 0, max: 15, step: 0.5, value: 0, fmt: function (v) { return v.toFixed(1); } }, restart);
    var xi = U.slider(sh.ctl, { label: 'Damping ratio ξ', min: 0, max: 2, step: 0.01, value: 0.05, fmt: function (v) { return v.toFixed(2); } }, restart);
    var x0 = U.slider(sh.ctl, { label: 'Start displacement x_0', unit: 'mm', min: -30, max: 30, step: 1, value: 20, fmt: function (v) { return v.toFixed(0); } }, restart);
    var v0 = U.slider(sh.ctl, { label: 'Start velocity v_0', unit: 'm/s', min: -1, max: 1, step: 0.05, value: 0, fmt: function (v) { return v.toFixed(2); } }, restart);
    var btn = U.buttons(sh.ctl, [['p', 'Pause', function () { playing = !playing; btn.p.textContent = playing ? 'Pause' : 'Play'; }], ['r', 'Restart', restart]]);
    var ctx = U.canvas(sh.view, 900, 400);
    var out = U.outputs(sh.view, [['wn', 'ω_n', 'rad/s'], ['fn', 'f_n', 'Hz'], ['c', 'Damping coefficient c', 'N s/m'], ['wd', 'ω_d', 'rad/s'], ['Td', 'Damped period T_d', 's'], ['dl', 'Log decrement δ', ''], ['reg', 'Regime', '']]);
    function draw() {
      ctx.clear();
      var M = m.v() + ms.v() / 3, S = s.v() * 1000, Z = xi.v(), X0 = x0.v() / 1000, V0 = v0.v();
      var wn = Math.sqrt(S / M), wd = Z < 1 ? wn * Math.sqrt(1 - Z * Z) : 0;
      var Tw = Math.max(8 * 2 * Math.PI / wn, 1);
      var tt = t % Tw;
      var x = freeResp(wn, Z, X0, V0, tt);
      out({ wn: f(wn, 4), fn: f(wn / 2 / Math.PI, 4), c: f(2 * Z * Math.sqrt(S * M), 4), wd: Z < 1 ? f(wd, 4) : '0', Td: Z < 1 ? f(2 * Math.PI / wd, 4) : 'no oscillation', dl: Z < 1 ? f(2 * Math.PI * Z / Math.sqrt(1 - Z * Z), 3) : '—', reg: Z === 0 ? 'undamped' : Z < 1 ? 'under-damped' : Z === 1 ? 'critically damped' : 'over-damped' });
      /* animation on the left */
      var Xmax = Math.max(Math.abs(X0), Math.abs(V0 / wn), 1e-6) * 1.2;
      var px = 70 / Xmax;
      hatchTop(ctx, 30, 170, 30);
      var ym = 220 + x * px;
      spring(ctx, 70, 30, ym - 25, 12, 9);
      dashpot(ctx, 130, 30, ym - 25, 10);
      ctx.save(); ctx.fillStyle = '#dfe3e8'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.fillRect(40, ym - 25, 120, 50); ctx.strokeRect(40, ym - 25, 120, 50); ctx.restore();
      U.label(ctx, 'm', 100, ym, { size: 18, align: 'center' });
      U.line(ctx, [[20, 220], [180, 220]], C.mute, 1, [5, 4]);
      U.label(ctx, 'equilibrium', 20, 236, { size: 11, color: C.mute, roman: true });
      /* trace */
      var bx = { x: 270, y: 30, w: 600, h: 320 };
      var ax = U.axes(ctx, bx, { xmin: 0, xmax: Tw, ymin: -Xmax * 1000, ymax: Xmax * 1000, xlabel: 'time t (s)', ylabel: 'x (mm)' });
      var ts = U.range(0, Tw, 500);
      if (Z > 0 && Z < 1) {
        var Xe = Math.sqrt(X0 * X0 + Math.pow((V0 + Z * wn * X0) / wd, 2));
        U.curve(ctx, ax, ts, function (q) { return Xe * Math.exp(-Z * wn * q) * 1000; }, C.red, 1, [5, 4]);
        U.curve(ctx, ax, ts, function (q) { return -Xe * Math.exp(-Z * wn * q) * 1000; }, C.red, 1, [5, 4]);
      }
      U.curve(ctx, ax, ts, function (q) { return freeResp(wn, 0, X0, V0, q) * 1000; }, C.line, 1);
      U.curve(ctx, ax, ts.filter(function (q) { return q <= tt; }), function (q) { return freeResp(wn, Z, X0, V0, q) * 1000; }, C.blue, 2.2);
      U.dot(ctx, ax.X(tt), ax.Y(x * 1000), 5, C.blue, false);
      U.line(ctx, [[160, ym], [ax.X(tt), ax.Y(x * 1000)]], C.line, 1, [2, 3]);
      U.label(ctx, 'grey: same system with no damping; red dashed: decay envelope', bx.x + 6, bx.y - 12, { size: 12, color: C.ink2, roman: true });
    }
    draw(); U.onRedraw(draw);
    U.loop(host, function (dt) { if (!playing) return; t += dt * 0.6; draw(); });
  })();

  /* ================= forced response ================= */
  function MF(r, z) { return 1 / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * z * r, 2)); }
  function TR(r, z) { return Math.sqrt(1 + Math.pow(2 * z * r, 2)) * MF(r, z); }
  function PH(r, z) { return Math.atan2(2 * z * r, 1 - r * r); }
  (function () {
    var host = document.getElementById('sim-forced'); if (!host) return;
    var sh = U.simShell(host);
    var t = 0;
    function upd() { draw(); }
    var mode = U.select(sh.ctl, 'Excitation', [['f', 'Harmonic force F_0 sin ωt'], ['u', 'Rotating unbalance me'], ['b', 'Support motion Y sin ωt']], upd);
    var r = U.slider(sh.ctl, { label: 'Frequency ratio ω/ω_n', min: 0.05, max: 3, step: 0.01, value: 0.8, fmt: function (v) { return v.toFixed(2); } }, upd);
    var z = U.slider(sh.ctl, { label: 'Damping ratio ξ', min: 0, max: 1, step: 0.01, value: 0.1, fmt: function (v) { return v.toFixed(2); } }, upd);
    var spd = U.slider(sh.ctl, { label: 'Animation speed', min: 0, max: 1, step: 0.05, value: 0.4, fmt: function (v) { return v.toFixed(2); } });
    var ctx = U.canvas(sh.view, 920, 440);
    var out = U.outputs(sh.view, [['amp', 'Amplitude ratio', ''], ['ph', 'Phase lag φ', 'degrees'], ['tr', 'Transmissibility ε', ''], ['pk', 'Peak of this curve', '']]);
    var msg = U.msg(sh.view);
    var LAB = { f: 'MF = A/(F_0/s)', u: 'A/(me/M)', b: 'A/Y' };
    function amp(md, rr, zz) { return md === 'f' ? MF(rr, zz) : md === 'u' ? rr * rr * MF(rr, zz) : TR(rr, zz); }
    function draw() {
      ctx.clear();
      var md = mode.v(), R = r.v(), Z = z.v();
      var A = amp(md, R, Z), ph = PH(R, Z), e = TR(R, Z);
      var rs = U.range(0.01, 3, 400), pk = 0;
      rs.forEach(function (q) { pk = Math.max(pk, amp(md, q, Z)); });
      out({ amp: f(A, 3), ph: f(deg(ph), 3), tr: f(e, 3), pk: Z === 0 ? 'infinite' : f(pk, 3) });
      /* amplitude plot */
      var b1 = { x: 280, y: 25, w: 290, h: 260 }, b2 = { x: 640, y: 25, w: 250, h: 110 }, b3 = { x: 640, y: 175, w: 250, h: 110 };
      var ax = U.axes(ctx, b1, { xmin: 0, xmax: 3, ymin: 0, ymax: 5, xticks: [0, 0.5, 1, 1.5, 2, 2.5, 3], xlabel: 'ω/ω_n', ylabel: LAB[md], ylabelOff: 38 });
      ctx.save(); ctx.beginPath(); ctx.rect(b1.x, b1.y, b1.w, b1.h); ctx.clip();
      [0, 0.1, 0.2, 0.5, 1].forEach(function (zz) { U.curve(ctx, ax, rs, function (q) { return Math.min(6, amp(md, q, zz)); }, C.line, 1); });
      U.curve(ctx, ax, rs, function (q) { return Math.min(6, amp(md, q, Z)); }, C.blue, 2.4);
      ctx.restore();
      U.dot(ctx, ax.X(R), ax.Y(Math.min(5, A)), 5, C.red, false);
      U.label(ctx, 'grey: ξ = 0, 0.1, 0.2, 0.5, 1', b1.x + b1.w - 4, b1.y + 12, { size: 11, color: C.ink2, align: 'right' });
      /* phase */
      var ax2 = U.axes(ctx, b2, { xmin: 0, xmax: 3, ymin: 0, ymax: 180, xticks: [0, 1, 2, 3], yticks: [0, 90, 180], ylabel: 'φ (degrees)', ylabelOff: 36 });
      U.curve(ctx, ax2, rs, function (q) { return deg(PH(q, Z)); }, C.violet, 2);
      U.dot(ctx, ax2.X(R), ax2.Y(deg(ph)), 4, C.red, false);
      /* transmissibility */
      var ax3 = U.axes(ctx, b3, { xmin: 0, xmax: 3, ymin: 0, ymax: 4, xticks: [0, 1, Math.SQRT2, 2, 3], yticks: [0, 1, 2, 3, 4], xfmt: function (v) { return Math.abs(v - Math.SQRT2) < 1e-6 ? '√2' : String(v); }, xlabel: 'ω/ω_n', ylabel: 'ε', ylabelOff: 30 });
      ctx.save(); ctx.fillStyle = 'rgba(29,122,70,0.10)'; ctx.fillRect(ax3.X(Math.SQRT2), b3.y, ax3.X(3) - ax3.X(Math.SQRT2), b3.h); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(b3.x, b3.y, b3.w, b3.h); ctx.clip();
      U.curve(ctx, ax3, rs, function (q) { return Math.min(5, TR(q, Z)); }, C.green, 2); ctx.restore();
      U.dot(ctx, ax3.X(R), ax3.Y(Math.min(4, e)), 4, C.red, false);
      U.label(ctx, 'isolation', ax3.X(2.2), b3.y + 12, { size: 11, color: C.green, align: 'center', roman: true });
      /* animation: steady state */
      var wt = t, sc = 26 / Math.max(1, Math.min(A, 4));
      var x = Math.min(A, 4) * Math.sin(wt - ph) * sc * 0.9;
      var yb = md === 'b' ? Math.sin(wt) * 9 : 0;
      var baseY = 370 + yb;
      ctx.save(); ctx.fillStyle = md === 'b' ? '#e7eaee' : '#f3f4f6'; ctx.fillRect(20, baseY, 200, 14); ctx.restore();
      U.hatchLine(ctx, 20, baseY, 220, baseY, 1);
      var ym = 230 - x;
      spring(ctx, 80, ym + 25, baseY, 12, 8);
      dashpot(ctx, 160, ym + 25, baseY, 9);
      ctx.save(); ctx.fillStyle = '#dfe3e8'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.fillRect(50, ym - 25, 140, 50); ctx.strokeRect(50, ym - 25, 140, 50); ctx.restore();
      if (md === 'f') { var Fv = Math.sin(wt) * 40; U.arrow(ctx, 120, ym - 30, 120, ym - 30 - Fv, C.red, 2.4); U.label(ctx, 'F_0 sin ωt', 130, ym - 70, { size: 12, color: C.red }); }
      if (md === 'u') {
        U.dot(ctx, 120, ym, 13, '#fff', C.ink);
        var ux = 120 + 11 * Math.cos(-wt * 1), uy = ym + 11 * Math.sin(-wt * 1);
        U.line(ctx, [[120, ym], [ux, uy]], C.ink, 1.5); U.dot(ctx, ux, uy, 4.5, C.red, false);
        U.label(ctx, 'me', 145, ym - 8, { size: 13, color: C.red });
      } else U.label(ctx, md === 'b' ? 'm' : 'm', 120, ym, { size: 18, align: 'center' });
      if (md === 'b') U.label(ctx, 'y = Y sin ωt', 20, baseY + 28, { size: 12, color: C.ink2 });
      U.line(ctx, [[30, 230], [210, 230]], C.mute, 1, [4, 4]);
      var verdict;
      if (Z === 0 && Math.abs(R - 1) < 0.03) verdict = ['Resonance with no damping: the amplitude grows without limit. On site, something breaks or the machine walks off its base.', 'bad'];
      else if (R < 0.6) verdict = ['Well below resonance: the mass follows the force almost in phase, amplitude close to the static value.', 'ok'];
      else if (R < Math.SQRT2) verdict = ['Near resonance: large motion and the mounts pass on more force than is applied (ε = ' + f(e, 3) + '). Run the machine through this speed range quickly at start-up.', 'warn'];
      else verdict = ['Above √2 times the natural frequency: isolation. Only ' + f(e * 100, 3) + '% of the force reaches the foundation. Here more damping makes isolation slightly worse.', 'ok'];
      msg(verdict[0], verdict[1]);
    }
    draw(); U.onRedraw(draw);
    U.loop(host, function (dt) { t += dt * spd.v() * 8; draw(); });
  })();

  /* ================= live worked examples ================= */
  U.calcs.logdec = function (v) {
    var d = Math.log(v.x0 / v.xn) / v.n, xi = d / Math.sqrt(4 * Math.PI * Math.PI + d * d), cc = 2 * Math.sqrt(v.s * v.m), wn = Math.sqrt(v.s / v.m);
    return { d: f(d, 4), xi: f(xi, 4), c: f(xi * cc, 4), cc: f(cc, 4), wn: f(wn, 4), wd: f(wn * Math.sqrt(1 - xi * xi), 4) };
  };
  U.calcs.forced = function (v) {
    var wn = Math.sqrt(v.s / v.m), r = v.w / wn, xi = v.c / (2 * Math.sqrt(v.s * v.m)), mf = MF(r, xi);
    return { wn: f(wn, 4), r: f(r, 4), xi: f(xi, 4), st: f(v.F / v.s * 1000, 4), mf: f(mf, 4), A: f(mf * v.F / v.s * 1000, 4), ph: f(deg(PH(r, xi)), 4) };
  };
  U.calcs.iso = function (v) {
    var w = 2 * Math.PI * v.N / 60, r = Math.sqrt(1 + 1 / v.e), wn = w / r, S = v.m * wn * wn;
    return { w: f(w, 4), r: f(r, 4), wn: f(wn, 4), fn: f(wn / 2 / Math.PI, 3), S: f(S / 1000, 4), s1: f(S / 1000 / v.k, 4), D: f(9.81 / (wn * wn) * 1000, 3), ed: f(TR(r, v.xi), 3) };
  };
  U.initLive();
})();
