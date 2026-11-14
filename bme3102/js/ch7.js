/* Chapter 7 live models: Porter governor, Hartnell spring design, gyroscopic effect */
(function () {
  'use strict';
  var C = U.C, f = U.f, g = 9.81;
  function rpm(w) { return w * 60 / (2 * Math.PI); }
  function wOf(N) { return N * 2 * Math.PI / 60; }

  /* ================= Porter governor (equal arms pivoted on the axis, q = 1) ================= */
  (function () {
    var host = document.getElementById('sim-porter'); if (!host) return;
    var sh = U.simShell(host);
    var L = 200, rMin = 120, rMax = 160;
    function upd() { solve(); draw(); }
    var sN = U.slider(sh.ctl, { label: 'Engine speed N', unit: 'rpm', min: 120, max: 300, step: 1, value: 210, fmt: function (v) { return v.toFixed(0); } }, upd);
    var sm = U.slider(sh.ctl, { label: 'Ball mass m', unit: 'kg', min: 0.5, max: 8, step: 0.5, value: 4, fmt: function (v) { return v.toFixed(1); } }, upd);
    var sM = U.slider(sh.ctl, { label: 'Central load M', unit: 'kg', min: 0, max: 40, step: 1, value: 24, fmt: function (v) { return v.toFixed(0); } }, upd);
    var sf = U.slider(sh.ctl, { label: 'Sleeve friction f', unit: 'N', min: 0, max: 60, step: 1, value: 0, fmt: function (v) { return v.toFixed(0); } }, upd);
    U.buttons(sh.ctl, [['a', 'Speed up 5%', function () { sN.set(Math.min(300, Math.round(sN.v() * 1.05))); upd(); }], ['b', 'Slow down 5%', function () { sN.set(Math.max(120, Math.round(sN.v() / 1.05))); upd(); }]]);
    var ctx = U.canvas(sh.view, 860, 420);
    var out = U.outputs(sh.view, [['h', 'Height h', 'mm'], ['r', 'Ball radius r', 'mm'], ['lift', 'Sleeve lift', 'mm'], ['thr', 'Throttle open', '%'], ['N1', 'Speed at r = 120 mm', 'rpm'], ['N2', 'Speed at r = 160 mm', 'rpm']]);
    var msg = U.msg(sh.view);
    var r = 140, target = 140;
    function Fc(rr, sgn) { var h = Math.sqrt(L * L - rr * rr) / 1000; return (sm.v() * g + sM.v() * g + sgn * sf.v()) * (rr / 1000) / h; }
    function Nat(rr, sgn) { var h = Math.sqrt(L * L - rr * rr) / 1000; return rpm(Math.sqrt((sm.v() * g + sM.v() * g + sgn * sf.v()) / (sm.v() * h))); }
    /* radius where m w^2 r equals the controlling force with friction sign sgn */
    function rEq(sgn) {
      var w = wOf(sN.v()), lo = 1, hi = L - 0.01;
      var k = (sm.v() * g + sM.v() * g + sgn * sf.v()) / (sm.v() * w * w);
      /* h = k (m); h = sqrt(L^2 - r^2) */
      var h = k * 1000; if (h >= L) return 0; return Math.sqrt(L * L - h * h);
    }
    function solve() {
      var up = rEq(+1), dn = rEq(-1);
      if (up > r) target = up; else if (dn < r) target = dn; else target = r;
      target = U.clamp(target, rMin, rMax);
    }
    function draw() {
      ctx.clear();
      var h = Math.sqrt(L * L - r * r);
      var sc = 0.95, ox = 200, oy = 36;
      function P(x, y) { return [ox + x * sc, oy + y * sc]; }
      /* spindle and frame */
      U.line(ctx, [P(0, -10), P(0, 2 * L + 30)], C.ink, 5);
      ctx.fillStyle = '#d9dde2'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
      /* stops on the spindle */
      var yLow = 2 * Math.sqrt(L * L - rMin * rMin), yHigh = 2 * Math.sqrt(L * L - rMax * rMax);
      [yLow + 14, yHigh - 14].forEach(function (yy) { var a = P(-14, yy), b = P(14, yy); ctx.fillStyle = '#6d7682'; ctx.fillRect(a[0], a[1] - 3, b[0] - a[0], 6); });
      /* arms */
      [-1, 1].forEach(function (s) {
        var B = P(s * r, h);
        U.link(ctx, P(0, 0), B, C.steel, 6); U.link(ctx, B, P(0, 2 * h), C.steel, 6);
      });
      /* sleeve and load */
      var S = P(0, 2 * h);
      ctx.fillStyle = '#b9c0c8'; ctx.strokeStyle = C.ink;
      var mw = 22 + Math.sqrt(sM.v()) * 9;
      ctx.beginPath(); ctx.rect(S[0] - mw, S[1] - 2, 2 * mw, 26); ctx.fill(); ctx.stroke();
      U.label(ctx, 'M', S[0], S[1] + 11, { size: 13, align: 'center', italic: true });
      U.pin(ctx, P(0, 0)); U.pin(ctx, S);
      [-1, 1].forEach(function (s) { var B = P(s * r, h); var br = 8 + Math.sqrt(sm.v()) * 5; U.dot(ctx, B[0], B[1], br, '#c9ced5', C.ink); U.label(ctx, 'm', B[0], B[1], { size: 12, align: 'center' }); });
      /* height and radius marks */
      U.line(ctx, [P(0, h), P(r, h)], C.blue, 1.2, [4, 3]); U.label(ctx, 'r', P(r / 2, h)[0], P(r / 2, h)[1] + 12, { size: 13, color: C.blue, align: 'center' });
      U.line(ctx, [P(-r - 30, 0), P(-r - 30, h)], C.red, 1.2); U.label(ctx, 'h', P(-r - 40, h / 2)[0], P(-r - 40, h / 2)[1], { size: 13, color: C.red, align: 'center' });
      /* throttle lever: pivot at right, fork on the sleeve collar */
      var pv = P(170, 2 * h + 12), pvF = [pv[0], P(0, (yLow + yHigh) / 2 + 12)[1]];
      var fork = [S[0] + mw, S[1] + 12];
      U.link(ctx, fork, pvF, C.amber, 5); U.ground(ctx, pvF, 6);
      var open = U.clamp(1 - (r - rMin) / (rMax - rMin), 0, 1);
      var vx = 330, vy = 330;
      ctx.strokeStyle = C.ink; ctx.strokeRect(vx, vy, 16, 70);
      ctx.fillStyle = C.amber; ctx.fillRect(vx + 1, vy + 70 - 70 * open, 14, 70 * open);
      U.label(ctx, 'fuel', vx + 8, vy + 82, { size: 12, align: 'center', color: C.ink2, roman: true });

      /* controlling force plot */
      var bx = { x: 470, y: 30, w: 360, h: 300 };
      var r0 = 100, r1 = 180, Fm = Math.max(Fc(r1, 1), sm.v() * Math.pow(wOf(sN.v()), 2) * r1 / 1000) * 1.08;
      var ax = U.axes(ctx, bx, { xmin: r0, xmax: r1, ymin: 0, ymax: Fm, xlabel: 'ball radius r (mm)', ylabel: 'force on each ball (N)', ylabelOff: 46 });
      ctx.save(); ctx.fillStyle = 'rgba(29,95,174,0.07)';
      ctx.fillRect(ax.X(rMin), bx.y, ax.X(rMax) - ax.X(rMin), bx.h); ctx.restore();
      var xs = U.range(r0, Math.min(r1, L - 1), 80);
      if (sf.v() > 0) { U.curve(ctx, ax, xs, function (x) { return Fc(x, 1); }, C.blue, 1.2, [5, 3]); U.curve(ctx, ax, xs, function (x) { return Fc(x, -1); }, C.blue, 1.2, [5, 3]); }
      U.curve(ctx, ax, xs, function (x) { return Fc(x, 0); }, C.blue, 2.2);
      var w = wOf(sN.v());
      U.curve(ctx, ax, xs, function (x) { return sm.v() * w * w * x / 1000; }, C.red, 2);
      U.dot(ctx, ax.X(r), ax.Y(sm.v() * w * w * r / 1000), 5, C.red, C.ink);
      U.label(ctx, 'controlling force', bx.x + 8, bx.y + 12, { size: 12, color: C.blue, roman: true });
      U.label(ctx, 'mω^2r at ' + sN.v().toFixed(0) + ' rpm', bx.x + 8, bx.y + 30, { size: 12, color: C.red });
      U.label(ctx, 'between the stops', ax.X(rMin) + 4, bx.y + bx.h - 10, { size: 11, color: C.ink2, roman: true });

      out({ h: h.toFixed(1), r: r.toFixed(1), lift: (2 * (Math.sqrt(L * L - rMin * rMin) - h)).toFixed(1), thr: (open * 100).toFixed(0), N1: Nat(rMin, 0).toFixed(1), N2: Nat(rMax, 0).toFixed(1) });
      var up = rEq(1), dn = rEq(-1);
      if (Math.abs(target - r) > 0.3) msg('Balls moving ' + (target > r ? 'out: sleeve rising, throttle closing.' : 'in: sleeve falling, throttle opening.'), '');
      else if (up <= rMin && r <= rMin + 0.3) msg('Below ' + Nat(rMin, -1).toFixed(0) + ' rpm the balls rest on the lower stop and the throttle is wide open.', 'warn');
      else if (dn >= rMax && r >= rMax - 0.3) msg('Above ' + Nat(rMax, -1).toFixed(0) + ' rpm the balls stay on the upper stop: the governor has no more control.', 'warn');
      else if (sf.v() > 0) msg('Inside the friction dead band: the speed can change between ' + Nat(r, -1).toFixed(0) + ' and ' + Nat(r, 1).toFixed(0) + ' rpm before the sleeve moves.', 'warn');
      else msg('In equilibrium: the controlling force equals mω²r where the two curves cross.', 'ok');
    }
    solve(); r = target; draw(); U.onRedraw(draw);
    U.loop(host, function (dt) { if (Math.abs(target - r) > 0.05) { r += (target - r) * Math.min(1, dt * 3); draw(); } });
  })();

  /* ================= Hartnell governor: spring design and controlling force ================= */
  (function () {
    var host = document.getElementById('sim-hart'); if (!host) return;
    var sh = U.simShell(host);
    var t = 0, dir = 1, D = null;
    function upd() { calc(); draw(); }
    function sl(lab, unit, mn, mx, st, v, dp) { return U.slider(sh.ctl, { label: lab, unit: unit, min: mn, max: mx, step: st, value: v, fmt: function (x) { return x.toFixed(dp); } }, upd); }
    var sm = sl('Ball mass m', 'kg', 0.5, 6, 0.1, 2, 1);
    var sa = sl('Ball arm a', 'mm', 60, 160, 5, 100, 0);
    var sb = sl('Sleeve arm b', 'mm', 30, 120, 5, 60, 0);
    var sr1 = sl('Radius r_1', 'mm', 60, 140, 1, 100, 0);
    var sr2 = sl('Radius r_2', 'mm', 80, 180, 1, 130, 0);
    var sN1 = sl('Speed N_1', 'rpm', 100, 600, 1, 300, 0);
    var sN2 = sl('Speed N_2', 'rpm', 100, 600, 1, 315, 0);
    var sM = sl('Sleeve mass M', 'kg', 0, 20, 0.5, 0, 1);
    var ctx = U.canvas(sh.view, 860, 400);
    var out = U.outputs(sh.view, [['S1', 'Spring force S_1', 'N'], ['S2', 'Spring force S_2', 'N'], ['lift', 'Sleeve lift', 'mm'], ['s', 'Stiffness s', 'N/mm'], ['x0', 'Initial compression', 'mm'], ['beta', 'Intercept β', 'N']]);
    var msg = U.msg(sh.view);
    function calc() {
      var m = sm.v(), a = sa.v() / 1000, b = sb.v() / 1000, r1 = sr1.v() / 1000, r2 = sr2.v() / 1000, w1 = wOf(sN1.v()), w2 = wOf(sN2.v()), Mg = sM.v() * g;
      var F1 = m * w1 * w1 * r1, F2 = m * w2 * w2 * r2;
      var S1 = 2 * F1 * a / b - Mg, S2 = 2 * F2 * a / b - Mg;
      var lift = (r2 - r1) * b / a, s = (S2 - S1) / (lift * 1000);
      var al = (F2 - F1) / (r2 - r1), be = F1 - al * r1;
      D = { m: m, a: a, b: b, r1: r1, r2: r2, F1: F1, F2: F2, S1: S1, S2: S2, lift: lift, s: s, x0: S1 / s, al: al, be: be, ok: r2 > r1 && S1 > 0 && S2 > S1 };
      out({ S1: f(S1, 4), S2: f(S2, 4), lift: (lift * 1000).toFixed(1), s: D.ok ? f(s, 3) : '—', x0: D.ok ? (S1 / s).toFixed(1) : '—', beta: f(be, 3) });
      if (r2 <= r1) msg('r₂ must be larger than r₁.', 'warn');
      else if (S1 <= 0) msg('At N₁ the balls cannot even lift the sleeve: S₁ would be negative. Raise N₁ or reduce M.', 'warn');
      else if (S2 <= S1) msg('S₂ must exceed S₁, so the spring is compressed further as the sleeve rises. Raise N₂.', 'warn');
      else if (Math.abs(be) < 0.02 * F1) msg('The line passes (almost) through the origin: isochronous. Very sensitive, and it will hunt.', 'warn');
      else if (be < 0) msg('Intercept below the origin: stable. The speed rises steadily from ' + sN1.v().toFixed(0) + ' to ' + sN2.v().toFixed(0) + ' rpm as the balls fly out.', 'ok');
      else msg('Intercept above the origin: unstable. The equilibrium speed would fall as the balls fly out, so it runs to its stops.', 'bad');
    }
    function draw() {
      if (!D) return;
      ctx.clear();
      var tt = 0.5 - 0.5 * Math.cos(Math.PI * t), r = D.r1 + (D.r2 - D.r1) * tt;
      var F = D.al * r + D.be, Nnow = D.ok && F > 0 ? rpm(Math.sqrt(F / (D.m * r))) : NaN;
      /* schematic, px per metre */
      var sc = 900, cx = 210, top = 60;
      var rm = (D.r1 + D.r2) / 2, pivY = top + 70 + D.a * sc * 0.0;
      var th = Math.asin(U.clamp((r - rm) / D.a, -1, 1));
      var pivY0 = top + D.a * sc + 30;
      U.line(ctx, [[cx, top - 30], [cx, pivY0 + 140]], C.ink, 5);
      /* frame carrying the pivots */
      U.line(ctx, [[cx - rm * sc - 10, pivY0 + 14], [cx + rm * sc + 10, pivY0 + 14]], C.steel, 6);
      var sleeveY = pivY0 - D.b * sc * Math.sin(th) * 0 - (r - rm) * D.b / D.a * sc;
      [-1, 1].forEach(function (s) {
        var pv = [cx + s * rm * sc, pivY0];
        var ball = [pv[0] + s * D.a * sc * Math.sin(th), pv[1] - D.a * sc * Math.cos(th)];
        var tip = [pv[0] - s * D.b * sc * Math.cos(th), pv[1] - s * s * D.b * sc * Math.sin(th)];
        U.link(ctx, pv, ball, C.steel, 6); U.link(ctx, pv, tip, C.steel, 6);
        U.dot(ctx, ball[0], ball[1], 7 + Math.sqrt(D.m) * 5, '#c9ced5', C.ink);
        U.pin(ctx, pv); U.dot(ctx, tip[0], tip[1], 4, C.ink, false);
      });
      /* sleeve: rides on the lever tips */
      var sy = pivY0 - (r - rm) / D.a * D.b * sc;
      ctx.fillStyle = '#d9dde2'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
      ctx.fillRect(cx - 34, sy - 16, 68, 14); ctx.strokeRect(cx - 34, sy - 16, 68, 14);
      /* spring between top cap and sleeve */
      var capY = top - 10;
      ctx.fillStyle = '#6d7682'; ctx.fillRect(cx - 30, capY - 6, 60, 6);
      var n = 9, pts = [[cx, capY]];
      for (var i = 1; i < 2 * n; i++) pts.push([cx + (i % 2 ? 18 : -18), capY + (sy - 16 - capY) * i / (2 * n)]);
      pts.push([cx, sy - 16]);
      U.line(ctx, pts, C.green, 1.8);
      U.label(ctx, 'S', cx + 26, (capY + sy) / 2, { size: 14, color: C.green, italic: true });
      U.label(ctx, isFinite(Nnow) ? 'N = ' + Nnow.toFixed(0) + ' rpm' : '', cx, pivY0 + 50, { size: 15, align: 'center', bold: true, bg: '#fff' });
      U.label(ctx, 'r = ' + (r * 1000).toFixed(0) + ' mm', cx, pivY0 + 72, { size: 13, align: 'center', color: C.ink2, bg: '#fff' });

      /* controlling force plot from r = 0 */
      var bx = { x: 470, y: 24, w: 360, h: 300 };
      var rx = D.r2 * 1000 * 1.15, Fmax = Math.max(D.F2, D.m * Math.pow(wOf(sN2.v()), 2) * D.r2) * 1.15;
      var Fmin = Math.min(0, D.be * 1.2);
      var ax = U.axes(ctx, bx, { xmin: 0, xmax: rx, ymin: Fmin, ymax: Fmax, xlabel: 'ball radius r (mm)', ylabel: 'controlling force F (N)', ylabelOff: 46 });
      U.line(ctx, [[ax.X(0), ax.Y(D.be)], [ax.X(D.r1 * 1000), ax.Y(D.F1)]], C.blue, 1.4, [5, 4]);
      U.line(ctx, [[ax.X(D.r1 * 1000), ax.Y(D.F1)], [ax.X(D.r2 * 1000), ax.Y(D.F2)]], C.blue, 2.6);
      [[sN1.v(), D.r1, C.violet], [sN2.v(), D.r2, C.red]].forEach(function (q) {
        var w = wOf(q[0]); U.line(ctx, [[ax.X(0), ax.Y(0)], [ax.X(rx), ax.Y(D.m * w * w * rx / 1000)]], q[2], 1.2, [2, 3]);
      });
      U.dot(ctx, ax.X(D.r1 * 1000), ax.Y(D.F1), 4.5, '#fff', C.ink); U.dot(ctx, ax.X(D.r2 * 1000), ax.Y(D.F2), 4.5, '#fff', C.ink);
      U.dot(ctx, ax.X(r * 1000), ax.Y(F), 5, C.blue, C.ink);
      U.dot(ctx, ax.X(0), ax.Y(D.be), 4, C.red, false);
      U.label(ctx, 'β = ' + D.be.toFixed(0) + ' N', ax.X(0) + 8, ax.Y(D.be) + (D.be < 0 ? 10 : -10), { size: 12, color: C.red });
      U.label(ctx, 'dotted rays: mω^2r at N_1 and N_2', bx.x + 8, bx.y + 10, { size: 12, color: C.ink2 });
    }
    calc(); draw(); U.onRedraw(draw);
    U.loop(host, function (dt) { t += dir * dt * 0.35; if (t > 1) { t = 1; dir = -1; } if (t < 0) { t = 0; dir = 1; } draw(); });
  })();

  /* ================= Gyroscopic effect from vectors ================= */
  (function () {
    var host = document.getElementById('sim-gyro'); if (!host) return;
    var sh = U.simShell(host);
    var PRE = {
      plane: { m: 450, k: 320, N: 2000, v: 240, R: 60, wp: 0.5, mot: 'left' },
      ship: { m: 2200, k: 320, N: 1800, v: 25, R: 250, wp: 0.8, mot: 'right' }
    };
    var ang = 0, wob = 0;
    function upd() { calc(); draw(); }
    var veh = U.select(sh.ctl, 'Vehicle', [['plane', 'Aeroplane (engine and propeller)'], ['ship', 'Ship (turbine rotor)']], function () { var p = PRE[veh.v()]; smm.set(p.m); sk.set(p.k); sN.set(p.N); sv.set(p.v); sR.set(p.R); swp.set(p.wp); mot.set(p.mot); upd(); });
    var spin = U.select(sh.ctl, 'Rotor spin, seen from the rear', [['cw', 'Clockwise'], ['acw', 'Anticlockwise']], upd);
    var mot = U.select(sh.ctl, 'Motion', [['left', 'Turning left'], ['right', 'Turning right'], ['up', 'Pitching, nose rising'], ['down', 'Pitching, nose falling'], ['roll', 'Rolling']], upd);
    var smm = U.slider(sh.ctl, { label: 'Rotor mass', unit: 'kg', min: 100, max: 5000, step: 10, value: 450, fmt: function (v) { return v.toFixed(0); } }, upd);
    var sk = U.slider(sh.ctl, { label: 'Radius of gyration', unit: 'mm', min: 100, max: 600, step: 5, value: 320, fmt: function (v) { return v.toFixed(0); } }, upd);
    var sN = U.slider(sh.ctl, { label: 'Rotor speed', unit: 'rpm', min: 200, max: 4000, step: 10, value: 2000, fmt: function (v) { return v.toFixed(0); } }, upd);
    var sv = U.slider(sh.ctl, { label: 'Vehicle speed', unit: 'km/h', min: 5, max: 400, step: 1, value: 240, fmt: function (v) { return v.toFixed(0); } }, upd);
    var sR = U.slider(sh.ctl, { label: 'Turn radius', unit: 'm', min: 20, max: 1000, step: 5, value: 60, fmt: function (v) { return v.toFixed(0); } }, upd);
    var swp = U.slider(sh.ctl, { label: 'Pitch or roll rate', unit: 'rad/s', min: 0.05, max: 2, step: 0.05, value: 0.5, fmt: function (v) { return v.toFixed(2); } }, upd);
    var ctx = U.canvas(sh.view, 860, 400);
    var out = U.outputs(sh.view, [['I', 'I', 'kg m²'], ['w', 'ω', 'rad/s'], ['wp', 'ω_p', 'rad/s'], ['C', 'Couple C = Iωω_p', 'N m']]);
    var msg = U.msg(sh.view);
    var R = null;
    function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function calc() {
      var ship = veh.v() === 'ship', nose = ship ? 'bow' : 'nose', tail = ship ? 'stern' : 'tail';
      var I = smm.v() * Math.pow(sk.v() / 1000, 2), w = wOf(sN.v()), H = [spin.v() === 'cw' ? 1 : -1, 0, 0];
      var mv = mot.v(), wp, P;
      if (mv === 'left' || mv === 'right') { wp = sv.v() / 3.6 / sR.v(); P = [0, 0, mv === 'left' ? 1 : -1]; }
      else if (mv === 'roll') { wp = swp.v(); P = [1, 0, 0]; }
      else { wp = swp.v(); P = [0, mv === 'up' ? -1 : 1, 0]; }
      var app = cross(P, H), re = [-app[0], -app[1], -app[2]];
      var Cc = I * w * wp, eff;
      if (Math.abs(re[1]) > 0.5) eff = re[1] > 0 ? 'The reaction couple depresses the ' + nose + ' and raises the ' + tail + '.' : 'The reaction couple raises the ' + nose + ' and depresses the ' + tail + '.';
      else if (Math.abs(re[2]) > 0.5) eff = re[2] > 0 ? 'The reaction couple turns the ' + (ship ? 'ship to port (left)' : 'aircraft to the left') + '.' : 'The reaction couple turns the ' + (ship ? 'ship to starboard (right)' : 'aircraft to the right') + '.';
      else { eff = 'Precession is about the spin axis itself, so there is no gyroscopic couple.'; Cc = 0; }
      R = { H: H, P: P, re: re, I: I, w: w, wp: wp, C: Cc, eff: eff, ship: ship };
      out({ I: f(I, 4), w: f(w, 4), wp: f(wp, 3), C: Cc ? f(Cc, 4) : '0' });
      msg(eff + (Cc ? ' Its size is ' + f(Cc / 1000, 3) + ' kN m.' : ''), Cc ? 'ok' : '');
      sv.row.style.opacity = sR.row.style.opacity = (mv === 'left' || mv === 'right') ? 1 : 0.4;
      swp.row.style.opacity = (mv === 'left' || mv === 'right') ? 0.4 : 1;
    }
    /* oblique projection: x forward (right), y port (into the page), z up */
    var cx = 330, cy = 230, S = 1;
    function rot(p, axis, a) {
      if (!axis) return p;
      var k = axis, c = Math.cos(a), s = Math.sin(a), d = k[0] * p[0] + k[1] * p[1] + k[2] * p[2], kx = cross(k, p);
      return [p[0] * c + kx[0] * s + k[0] * d * (1 - c), p[1] * c + kx[1] * s + k[1] * d * (1 - c), p[2] * c + kx[2] * s + k[2] * d * (1 - c)];
    }
    function pr(p) { return [cx + S * (p[0] + 0.5 * p[1]), cy - S * (p[2] + 0.32 * p[1] - 0.12 * p[0])]; }
    function poly(pts, fill, stroke, tilt) {
      ctx.beginPath(); pts.forEach(function (p, i) { var q = pr(rot(p, tilt.ax, tilt.a)); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } ctx.strokeStyle = stroke || C.ink; ctx.lineWidth = 1.2; ctx.stroke();
    }
    function vec(v, len, col, lab) {
      var a = pr([0, 0, 0]), b = pr([v[0] * len, v[1] * len, v[2] * len]);
      U.arrow(ctx, a[0], a[1], b[0], b[1], col, 3, 11);
      var e = pr([v[0] * (len + 22), v[1] * (len + 22), v[2] * (len + 22)]);
      U.label(ctx, lab, e[0], e[1], { size: 14, color: col, align: 'center', bold: true });
    }
    function draw() {
      if (!R) return;
      ctx.clear();
      var tilt = { ax: R.C ? R.re : null, a: R.C ? 0.08 * (0.5 - 0.5 * Math.cos(wob)) : 0 };
      /* reference axes */
      [[[1, 0, 0], 'forward'], [[0, 1, 0], 'port'], [[0, 0, 1], 'up']].forEach(function (q) {
        var a = pr([0, 0, 0]), b = pr([q[0][0] * 250, q[0][1] * 250, q[0][2] * 170]);
        U.line(ctx, [a, b], C.line, 1, [3, 4]); U.label(ctx, q[1], b[0], b[1] - 8, { size: 12, color: C.mute, align: 'center', roman: true });
      });
      if (R.ship) {
        var hull = [[-200, 45, 0], [150, 45, 0], [215, 0, 0], [150, -45, 0], [-200, -45, 0]];
        poly(hull.map(function (p) { return [p[0], p[1], -55]; }), '#e7eaee', C.mute, tilt);
        poly(hull, 'rgba(201,206,213,0.55)', C.ink2, tilt);
        poly([[-110, 22, 0], [-20, 22, 0], [-20, 22, 45], [-110, 22, 45]], 'rgba(255,255,255,0.7)', C.ink2, tilt);
      } else {
        poly([[-210, 0, -14], [150, 0, -18], [200, 0, 0], [150, 0, 18], [-210, 0, 10]], '#e7eaee', C.ink2, tilt);
        poly([[-30, -210, 0], [40, -210, 0], [60, 210, 0], [-30, 210, 0]].map(function (p, i) { return [p[0], i === 1 || i === 2 ? p[1] : p[1], 0]; }), 'rgba(201,206,213,0.5)', C.ink2, tilt);
        poly([[-200, -70, 0], [-160, -70, 0], [-150, 70, 0], [-200, 70, 0]], 'rgba(201,206,213,0.5)', C.ink2, tilt);
        poly([[-205, 0, 8], [-175, 0, 8], [-200, 0, 60], [-215, 0, 60]], 'rgba(201,206,213,0.8)', C.ink2, tilt);
      }
      /* rotor disc in the y-z plane, with spokes */
      var disc = [], rr = 52;
      for (var i = 0; i <= 40; i++) { var t = i / 40 * Math.PI * 2; disc.push([R.ship ? -60 : 205, rr * Math.cos(t), rr * Math.sin(t)]); }
      poly(disc, 'rgba(29,95,174,0.10)', C.blue, tilt);
      for (var j = 0; j < 3; j++) {
        var t2 = ang * (R.H[0] > 0 ? -1 : 1) + j * 2 * Math.PI / 3;
        var a = pr(rot([R.ship ? -60 : 205, 0, 0], tilt.ax, tilt.a)), b = pr(rot([R.ship ? -60 : 205, rr * Math.cos(t2), rr * Math.sin(t2)], tilt.ax, tilt.a));
        U.line(ctx, [a, b], C.blue, 3);
      }
      vec(R.H, 150, C.blue, 'Iω');
      vec(R.P, 110, C.green, 'ω_p');
      if (R.C) vec(R.re.map(function (x) { return x; }), 120, C.red, 'reaction');
      /* legend */
      var lx = 620, ly = 40;
      U.label(ctx, 'Vectors (right-hand rule)', lx, ly, { size: 13, bold: true, roman: true });
      [[C.blue, 'spin, angular momentum Iω'], [C.green, 'precession ω_p'], [C.red, 'reaction couple on the vehicle']].forEach(function (q, k) {
        U.line(ctx, [[lx, ly + 24 + k * 22], [lx + 26, ly + 24 + k * 22]], q[0], 3); U.label(ctx, q[1], lx + 34, ly + 24 + k * 22, { size: 12, color: C.ink2 });
      });
      U.label(ctx, 'applied couple = ω_p × Iω', lx, ly + 104, { size: 12 });
      U.label(ctx, 'reaction = opposite of applied', lx, ly + 124, { size: 12 });
      U.label(ctx, 'tilt exaggerated to show the effect', lx, ly + 150, { size: 11, color: C.mute, roman: true });
    }
    calc(); draw(); U.onRedraw(draw);
    U.loop(host, function (dt) { ang += dt * 4; wob += dt * 1.6; draw(); });
  })();

  /* ================= live worked examples ================= */
  U.calcs.porter = function (v) {
    function N(r, F) { var h = Math.sqrt(v.l * v.l - r * r) / 1000; return rpm(Math.sqrt(F / (v.m * h))); }
    if (v.r1 >= v.l || v.r2 >= v.l || v.m <= 0) return { h1: '—', h2: '—', N1: '—', N2: '—', R: '—', N1f: '—', N2f: '—', Rf: '—' };
    var W = (v.m + v.M) * g, n1 = N(v.r1, W), n2 = N(v.r2, W), n1f = N(v.r1, W - v.f), n2f = N(v.r2, W + v.f);
    return { h1: Math.sqrt(v.l * v.l - v.r1 * v.r1).toFixed(1), h2: Math.sqrt(v.l * v.l - v.r2 * v.r2).toFixed(1), N1: n1.toFixed(1), N2: n2.toFixed(1), R: (n2 - n1).toFixed(1), N1f: n1f.toFixed(1), N2f: n2f.toFixed(1), Rf: (n2f - n1f).toFixed(1) };
  };
  U.calcs.car = function (v) {
    var rw = v.D / 2, Wq = v.m * g / 4;
    var cg = (4 * v.Iw + v.G * v.Ie) / (rw * v.R), cc = v.m * v.h / v.R, rg = cg / (2 * v.w), rc = cc / (2 * v.w);
    var v2 = Wq / (rg + rc), vv = Math.sqrt(v2);
    return { Wq: Wq.toFixed(1), cg: cg.toFixed(3), rg: rg.toFixed(4), cc: cc.toFixed(3), rc: rc.toFixed(3), v2: v2.toFixed(1), v: vv.toFixed(2), kmh: (vv * 3.6).toFixed(1) };
  };
  U.initLive();
})();
