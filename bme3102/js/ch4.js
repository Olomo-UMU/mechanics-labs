/* Chapter 4 live models */
(function () {
  'use strict';
  var C = U.C, f = U.f, rad = U.rad, deg = U.deg;
  function show(sl, on) { sl.row.style.display = on ? '' : 'none'; }

  /* ================= inclined plane and friction angle ================= */
  (function () {
    var host = document.getElementById('sim-incline'); if (!host) return;
    var sh = U.simShell(host);
    function upd() { draw(); }
    var th = U.slider(sh.ctl, { label: 'Plane angle θ', unit: 'degrees', min: 0, max: 60, step: 0.5, value: 20, fmt: function (v) { return v.toFixed(1); } }, upd);
    var mu = U.slider(sh.ctl, { label: 'Coefficient of friction μ', min: 0, max: 1, step: 0.01, value: 0.3, fmt: function (v) { return v.toFixed(2); } }, upd);
    var W = U.slider(sh.ctl, { label: 'Load W', unit: 'N', min: 100, max: 2000, step: 10, value: 500, fmt: function (v) { return v.toFixed(0); } }, upd);
    var eff = U.select(sh.ctl, 'Effort direction', [['h', 'Horizontal (like a screw thread)'], ['p', 'Parallel to the plane']], upd);
    var act = U.select(sh.ctl, 'Action', [['up', 'Push the load up'], ['down', 'Let the load down steadily']], upd);
    var ctx = U.canvas(sh.view, 820, 380);
    var out = U.outputs(sh.view, [['phi', 'Friction angle φ', 'degrees'], ['P', 'Effort P', 'N'], ['P0', 'Effort with no friction', 'N'], ['eta', 'Efficiency (raising)', '%']]);
    var msg = U.msg(sh.view);
    function draw() {
      ctx.clear();
      var t = rad(th.v()), phi = Math.atan(mu.v()), w = W.v(), up = act.v() === 'up', hz = eff.v() === 'h';
      var P, P0;
      if (hz) { P = up ? w * Math.tan(t + phi) : w * Math.tan(phi - t); P0 = w * Math.tan(t); }
      else { P = up ? w * Math.sin(t + phi) / Math.cos(phi) : w * Math.sin(phi - t) / Math.cos(phi); P0 = w * Math.sin(t); }
      var eta = hz ? Math.tan(t) / Math.tan(t + phi) : Math.sin(t) * Math.cos(phi) / Math.sin(t + phi);
      out({ phi: f(deg(phi), 3), P: (t + phi >= Math.PI / 2 && up && hz) ? 'cannot' : f(Math.abs(P), 4) + (P < 0 ? ' (holding back)' : ''), P0: f(P0, 4), eta: t > 0 ? f(eta * 100, 3) : '—' });
      /* plane */
      var ox = 80, oy = 330, Lp = 560;
      var ex = ox + Lp * Math.cos(t), ey = oy - Lp * Math.sin(t);
      ctx.save(); ctx.fillStyle = '#eef0f2'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.lineTo(ex, oy); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      U.hatchLine(ctx, 40, oy, 700, oy, 1);
      ctx.save(); ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(ox, oy, 60, -t, 0); ctx.stroke(); ctx.restore();
      U.label(ctx, 'θ', ox + 66, oy - 12, { size: 15 });
      /* block */
      var bx = ox + 280 * Math.cos(t), by = oy - 280 * Math.sin(t);
      ctx.save(); ctx.translate(bx, by); ctx.rotate(-t); ctx.fillStyle = '#dfe3e8'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
      ctx.fillRect(-45, -60, 90, 60); ctx.strokeRect(-45, -60, 90, 60); ctx.restore();
      var cx = bx - 30 * Math.sin(t), cy = by - 30 * Math.cos(t);
      var k = 120 / Math.max(w, Math.abs(P), 1);
      U.arrow(ctx, cx, cy, cx, cy + w * k, C.ink, 2.4); U.label(ctx, 'W', cx + 6, cy + w * k - 6, { size: 14 });
      /* effort */
      if (isFinite(P) && Math.abs(P) > 0.5) {
        var dx = hz ? 1 : Math.cos(t), dy = hz ? 0 : -Math.sin(t), s = P > 0 ? 1 : -1;
        var sx = cx - dx * s * (Math.abs(P) * k + 50), sy = cy - dy * s * (Math.abs(P) * k + 50);
        U.arrow(ctx, sx, sy, cx - dx * s * 50, cy - dy * s * 50, C.blue, 2.4);
        U.label(ctx, 'P', sx - 14, sy - 10, { size: 14, color: C.blue });
      }
      /* friction cone at contact */
      var px = bx, py = by;
      var nx = -Math.sin(t), ny = -Math.cos(t);
      function rot(a) { return [nx * Math.cos(a) - ny * Math.sin(a), nx * Math.sin(a) + ny * Math.cos(a)]; }
      var c1 = rot(phi), c2 = rot(-phi);
      ctx.save(); ctx.fillStyle = 'rgba(168,20,28,0.07)'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + c1[0] * 150, py + c1[1] * 150); ctx.lineTo(px + c2[0] * 150, py + c2[1] * 150); ctx.closePath(); ctx.fill(); ctx.restore();
      U.line(ctx, [[px, py], [px + c1[0] * 150, py + c1[1] * 150]], C.red, 1, [4, 3]);
      U.line(ctx, [[px, py], [px + c2[0] * 150, py + c2[1] * 150]], C.red, 1, [4, 3]);
      U.line(ctx, [[px, py], [px + nx * 160, py + ny * 160]], C.mute, 1, [2, 3]);
      /* reaction leans away from the motion: pushing up the slope, friction acts down it, so R leans down-slope */
      var Rv = rot(up ? -phi : phi);
      U.arrow(ctx, px, py, px + Rv[0] * 130, py + Rv[1] * 130, C.red, 2.4);
      U.label(ctx, 'R', px + Rv[0] * 130 + 6, py + Rv[1] * 130 - 6, { size: 14, color: C.red });
      U.label(ctx, 'friction cone ±φ', px + c2[0] * 150 + 4, py + c2[1] * 150 - 4, { size: 12, color: C.red, roman: true });
      if (t > phi) msg('θ is larger than the angle of repose φ = ' + f(deg(phi), 3) + '°: with no effort the block slides down. Lowering it steadily needs a holding force. A screw like this would overhaul.', 'warn');
      else msg('θ is within the angle of repose (φ = ' + f(deg(phi), 3) + '°): the block stays put by itself. A screw with α &lt; φ is self-locking for the same reason.', 'ok');
    }
    draw(); U.onRedraw(draw);
  })();

  /* ================= screw jack ================= */
  function jackCalc(o) {
    var a = Math.atan(o.l / (Math.PI * o.d)), phi = Math.atan(o.mu), r = o.d / 2;
    var Tt = o.W * r * Math.tan(a + phi), Tc = o.muc * o.W * o.Rc, T = Tt + Tc;
    var Tl = o.W * r * Math.tan(phi - a) + Tc;
    return { a: a, phi: phi, Tt: Tt, Tc: Tc, T: T, Tl: Tl, P: T / o.L, Pl: Tl / o.L, eta: o.W * o.l / (2 * Math.PI * T), eta0: Math.tan(a) / Math.tan(a + phi), MA: o.W / (T / o.L), VR: 2 * Math.PI * o.L / o.l, lock: phi > a };
  }
  (function () {
    var host = document.getElementById('sim-jack'); if (!host) return;
    var sh = U.simShell(host);
    function upd() { draw(); }
    var d = U.slider(sh.ctl, { label: 'Mean diameter d', unit: 'mm', min: 20, max: 100, step: 1, value: 50, fmt: function (v) { return v; } }, upd);
    var p = U.slider(sh.ctl, { label: 'Pitch p', unit: 'mm', min: 2, max: 30, step: 0.5, value: 10, fmt: function (v) { return v.toFixed(1); } }, upd);
    var st = U.slider(sh.ctl, { label: 'Number of starts', min: 1, max: 4, step: 1, value: 1, fmt: function (v) { return v; } }, upd);
    var mu = U.slider(sh.ctl, { label: 'Thread friction μ', min: 0.02, max: 0.3, step: 0.01, value: 0.12, fmt: function (v) { return v.toFixed(2); } }, upd);
    var muc = U.slider(sh.ctl, { label: 'Collar friction μ_c', min: 0, max: 0.3, step: 0.01, value: 0.15, fmt: function (v) { return v.toFixed(2); } }, upd);
    var Rc = U.slider(sh.ctl, { label: 'Collar mean radius R_c', unit: 'mm', min: 10, max: 60, step: 1, value: 30, fmt: function (v) { return v; } }, upd);
    var W = U.slider(sh.ctl, { label: 'Load W', unit: 'kN', min: 1, max: 100, step: 1, value: 20, fmt: function (v) { return v; } }, upd);
    var L = U.slider(sh.ctl, { label: 'Lever length', unit: 'm', min: 0.2, max: 1.5, step: 0.05, value: 0.5, fmt: function (v) { return v.toFixed(2); } }, upd);
    var ctx = U.canvas(sh.view, 900, 380);
    var out = U.outputs(sh.view, [['a', 'Helix angle α', 'degrees'], ['phi', 'Friction angle φ', 'degrees'], ['T', 'Torque to raise', 'N m'], ['P', 'Lever effort to raise', 'N'], ['Tl', 'Torque to lower', 'N m'], ['eta', 'Efficiency with collar', '%'], ['eta0', 'Thread alone', '%'], ['MA', 'Mechanical advantage', '']]);
    var msg = U.msg(sh.view);
    function draw() {
      ctx.clear();
      var o = { d: d.v() / 1000, l: p.v() * st.v() / 1000, mu: mu.v(), muc: muc.v(), Rc: Rc.v() / 1000, W: W.v() * 1000, L: L.v() };
      var c = jackCalc(o);
      out({ a: f(deg(c.a), 3), phi: f(deg(c.phi), 3), T: f(c.T, 4), P: f(c.P, 4), Tl: f(c.Tl, 4), eta: f(c.eta * 100, 3), eta0: f(c.eta0 * 100, 3), MA: f(c.MA, 3) });
      /* development of one turn with the force triangle */
      var ox = 40, oy = 300, base = 330, hgt = Math.min(250, base * Math.tan(c.a));
      ctx.save(); ctx.fillStyle = '#eef0f2'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + base, oy); ctx.lineTo(ox + base, oy - hgt); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      U.label(ctx, 'πd', ox + base / 2, oy + 18, { size: 14, align: 'center' }); U.label(ctx, 'l = ' + f(o.l * 1000, 3) + ' mm', ox + base + 8, oy - hgt / 2, { size: 13 });
      U.label(ctx, 'α = ' + f(deg(c.a), 3) + '°', ox + 70, oy - 12, { size: 13 });
      /* force triangle on the side */
      var fx = 200, fy = 200, Wl = 120, Fl = Wl * Math.tan(c.a + c.phi);
      U.arrow(ctx, fx, fy - Wl, fx, fy, C.ink, 2.2); U.label(ctx, 'W', fx - 20, fy - Wl / 2, { size: 14 });
      U.arrow(ctx, fx, fy, fx + Math.min(Fl, 160), fy, C.blue, 2.2); U.label(ctx, 'F = W tan(α + φ)', fx + 6, fy + 16, { size: 13, color: C.blue });
      U.arrow(ctx, fx + Math.min(Fl, 160), fy, fx, fy - Wl, C.red, 2.2); U.label(ctx, 'R', fx + Math.min(Fl, 160) / 2 + 8, fy - Wl / 2 - 6, { size: 14, color: C.red });
      U.label(ctx, 'force triangle on the thread', fx - 10, fy - Wl - 16, { size: 12, color: C.ink2, roman: true });
      /* efficiency against helix angle */
      var bx = { x: 500, y: 30, w: 370, h: 290 };
      var ax = U.axes(ctx, bx, { xmin: 0, xmax: 60, ymin: 0, ymax: 100, xticks: [0, 10, 20, 30, 40, 50, 60], xlabel: 'helix angle α (degrees)', ylabel: 'thread efficiency (%)', ylabelOff: 40 });
      var as = U.range(0.2, 60, 240);
      U.curve(ctx, ax, as, function (q) { return Math.max(0, Math.tan(rad(q)) / Math.tan(rad(q) + c.phi) * 100); }, C.ink, 2);
      var am = 45 - deg(c.phi) / 2, em = (1 - Math.sin(c.phi)) / (1 + Math.sin(c.phi)) * 100;
      U.dot(ctx, ax.X(am), ax.Y(em), 4, C.green, false);
      U.label(ctx, 'maximum ' + f(em, 3) + '% at 45° − φ/2 = ' + f(am, 3) + '°', ax.X(am) - 10, ax.Y(em) - 14, { size: 12, color: C.green, align: 'center', roman: true });
      ctx.save(); ctx.fillStyle = 'rgba(29,95,174,0.08)'; ctx.fillRect(bx.x, bx.y, ax.X(deg(c.phi)) - bx.x, bx.h); ctx.restore();
      U.label(ctx, 'self-locking (α < φ)', bx.x + 4, bx.y + bx.h - 10, { size: 11, color: C.blue, roman: true });
      U.dot(ctx, ax.X(deg(c.a)), ax.Y(c.eta0 * 100), 5, C.red, false);
      if (c.lock) msg('Self-locking: φ = ' + f(deg(c.phi), 3) + '° is larger than α = ' + f(deg(c.a), 3) + '°, so the load stays up when the lever is released. The price is a thread efficiency below 50%.', 'ok');
      else msg('Overhauling: α = ' + f(deg(c.a), 3) + '° is larger than φ = ' + f(deg(c.phi), 3) + '°. Let go of the lever and the load runs down, spinning the screw. Unsafe for a jack: a car would drop on whoever is under it.', 'bad');
    }
    draw(); U.onRedraw(draw);
  })();

  /* ================= collars and pivots ================= */
  function collarT(type, Ro, Ri, al, mu, F) {
    var s = (type === 'cc' || type === 'cp') ? Math.sin(al) : 1;
    if (type === 'fp' || type === 'cp') Ri = 0;
    var up = 2 * mu * F / (3 * s) * (Math.pow(Ro, 3) - Math.pow(Ri, 3)) / (Ro * Ro - Ri * Ri);
    var uw = mu * F / (2 * s) * (Ro + Ri);
    return { up: up, uw: uw, Ri: Ri };
  }
  (function () {
    var host = document.getElementById('sim-collar'); if (!host) return;
    var sh = U.simShell(host);
    function upd() { vis(); draw(); }
    var type = U.select(sh.ctl, 'Bearing', [['fc', 'Flat collar'], ['cc', 'Conical collar'], ['fp', 'Flat pivot'], ['cp', 'Conical pivot']], upd);
    var Ro = U.slider(sh.ctl, { label: 'Outer radius R_o', unit: 'mm', min: 20, max: 250, step: 1, value: 150, fmt: function (v) { return v; } }, upd);
    var Ri = U.slider(sh.ctl, { label: 'Inner radius R_i', unit: 'mm', min: 0, max: 200, step: 1, value: 100, fmt: function (v) { return v; } }, upd);
    var al = U.slider(sh.ctl, { label: 'Cone semi-angle α', unit: 'degrees', min: 10, max: 90, step: 1, value: 60, fmt: function (v) { return v; } }, upd);
    var mu = U.slider(sh.ctl, { label: 'μ', min: 0.01, max: 0.3, step: 0.005, value: 0.04, fmt: function (v) { return v.toFixed(3); } }, upd);
    var F = U.slider(sh.ctl, { label: 'Axial thrust F', unit: 'kN', min: 1, max: 100, step: 1, value: 40, fmt: function (v) { return v; } }, upd);
    var N = U.slider(sh.ctl, { label: 'Speed N', unit: 'rpm', min: 10, max: 1500, step: 10, value: 150, fmt: function (v) { return v; } }, upd);
    function vis() { var t = type.v(); show(Ri, t === 'fc' || t === 'cc'); show(al, t === 'cc' || t === 'cp'); }
    var ctx = U.canvas(sh.view, 860, 340);
    var out = U.outputs(sh.view, [['tp', 'Torque, uniform pressure', 'N m'], ['tw', 'Torque, uniform wear', 'N m'], ['pp', 'Power lost (uniform pressure)', 'kW'], ['pw', 'Power lost (uniform wear)', 'kW'], ['p1', 'Pressure, uniform pressure', 'kPa'], ['p2', 'Greatest pressure, uniform wear', 'kPa']]);
    var msg = U.msg(sh.view);
    function draw() {
      ctx.clear();
      var t = type.v(), ro = Ro.v() / 1000, ri = Math.min(Ri.v(), Ro.v() - 2) / 1000, a = rad(al.v()), m = mu.v(), Fv = F.v() * 1000, w = 2 * Math.PI * N.v() / 60;
      var r = collarT(t, ro, ri, a, m, Fv); ri = r.Ri;
      var pU = Fv / (Math.PI * (ro * ro - ri * ri)), C0 = Fv / (2 * Math.PI * (ro - ri));
      out({ tp: f(r.up, 4), tw: f(r.uw, 4), pp: f(r.up * w / 1000, 4), pw: f(r.uw * w / 1000, 4), p1: f(pU / 1000, 4), p2: ri > 0 ? f(C0 / ri / 1000, 4) : 'very high at the centre' });
      /* pressure distribution */
      var bx = { x: 330, y: 30, w: 500, h: 250 };
      var rmin = ri > 0 ? ri : ro * 0.02;
      var pmax = Math.max(pU, C0 / rmin) * 1.1;
      if (ri === 0) pmax = Math.max(pU * 3, pU * 1.2);
      var ax = U.axes(ctx, bx, { xmin: 0, xmax: ro * 1000, ymin: 0, ymax: pmax / 1000, xlabel: 'radius r (mm)', ylabel: 'normal pressure (kPa)', ylabelOff: 46 });
      ctx.save(); ctx.fillStyle = 'rgba(29,95,174,0.10)'; ctx.fillRect(ax.X(ri * 1000), ax.Y(pU / 1000), ax.X(ro * 1000) - ax.X(ri * 1000), ax.Y(0) - ax.Y(pU / 1000)); ctx.restore();
      U.line(ctx, [[ax.X(ri * 1000), ax.Y(pU / 1000)], [ax.X(ro * 1000), ax.Y(pU / 1000)]], C.blue, 2.4);
      ctx.save(); ctx.beginPath(); ctx.rect(bx.x, bx.y, bx.w, bx.h); ctx.clip();
      U.curve(ctx, ax, U.range(rmin * 1000, ro * 1000, 200), function (q) { return C0 / (q / 1000) / 1000; }, C.red, 2.4);
      ctx.restore();
      U.label(ctx, 'uniform pressure', ax.X(ro * 1000) - 4, ax.Y(pU / 1000) - 10, { size: 12, color: C.blue, align: 'right', roman: true });
      U.label(ctx, 'uniform wear, p r = constant', ax.X(rmin * 1000 + (ro - rmin) * 300) , ax.Y(Math.min(pmax * 0.9, C0 / (rmin + (ro - rmin) * 0.3)) / 1000) - 12, { size: 12, color: C.red, roman: true });
      /* sketch of the bearing face */
      var cx = 150, cy = 170, R = 110, sc = R / ro;
      ctx.save(); ctx.fillStyle = '#e7eaee'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.arc(cx, cy, ri * sc, 0, 2 * Math.PI, true); ctx.fill('evenodd'); ctx.stroke();
      if (ri > 0) { ctx.beginPath(); ctx.arc(cx, cy, ri * sc, 0, 2 * Math.PI); ctx.stroke(); }
      ctx.restore();
      U.line(ctx, [[cx, cy], [cx + R, cy]], C.ink2, 1); U.label(ctx, 'R_o', cx + R / 2, cy - 10, { size: 13, align: 'center' });
      if (ri > 0) { U.line(ctx, [[cx, cy], [cx - ri * sc * 0.7, cy + ri * sc * 0.7]], C.ink2, 1); U.label(ctx, 'R_i', cx - ri * sc * 0.35 - 14, cy + ri * sc * 0.35 + 6, { size: 13 }); }
      U.label(ctx, (t === 'cc' || t === 'cp') ? 'bearing face (cone, seen end on)' : 'bearing face', cx, cy + R + 22, { size: 12, align: 'center', color: C.ink2, roman: true });
      var ratio = r.up / r.uw;
      msg('Uniform pressure gives ' + f((ratio - 1) * 100, 3) + '% more torque than uniform wear. Use uniform wear for a clutch (the safe, lower capacity) and uniform pressure for the power lost in a bearing (the safe, higher loss).' + ((t === 'cc' || t === 'cp') ? ' The cone multiplies the flat-face torque by 1/sin α = ' + f(1 / Math.sin(a), 3) + '.' : ''), 'ok');
    }
    vis(); draw(); U.onRedraw(draw);
  })();

  /* ================= clutches ================= */
  (function () {
    var host = document.getElementById('sim-clutch'); if (!host) return;
    var sh = U.simShell(host);
    function upd() { vis(); draw(); }
    var type = U.select(sh.ctl, 'Clutch', [['sp', 'Single plate (both faces)'], ['mp', 'Multi-plate'], ['cone', 'Cone'], ['cf', 'Centrifugal']], upd);
    var Ro = U.slider(sh.ctl, { label: 'Outer radius R_o', unit: 'mm', min: 40, max: 200, step: 1, value: 125, fmt: function (v) { return v; } }, upd);
    var Ri = U.slider(sh.ctl, { label: 'Inner radius R_i', unit: 'mm', min: 20, max: 180, step: 1, value: 75, fmt: function (v) { return v; } }, upd);
    var mu = U.slider(sh.ctl, { label: 'μ', min: 0.05, max: 0.5, step: 0.01, value: 0.3, fmt: function (v) { return v.toFixed(2); } }, upd);
    var F = U.slider(sh.ctl, { label: 'Axial spring force F', unit: 'kN', min: 0.2, max: 10, step: 0.1, value: 4, fmt: function (v) { return v.toFixed(1); } }, upd);
    var n1 = U.slider(sh.ctl, { label: 'Driving plates n_1', min: 1, max: 8, step: 1, value: 4, fmt: function (v) { return v; } }, upd);
    var n2 = U.slider(sh.ctl, { label: 'Driven plates n_2', min: 1, max: 8, step: 1, value: 3, fmt: function (v) { return v; } }, upd);
    var al = U.slider(sh.ctl, { label: 'Cone semi-angle α', unit: 'degrees', min: 8, max: 30, step: 0.5, value: 12.5, fmt: function (v) { return v.toFixed(1); } }, upd);
    var sn = U.slider(sh.ctl, { label: 'Number of shoes', min: 2, max: 6, step: 1, value: 4, fmt: function (v) { return v; } }, upd);
    var sm = U.slider(sh.ctl, { label: 'Mass of each shoe m', unit: 'kg', min: 0.1, max: 3, step: 0.05, value: 1.5, fmt: function (v) { return v.toFixed(2); } }, upd);
    var sr = U.slider(sh.ctl, { label: 'Shoe centre radius r', unit: 'mm', min: 30, max: 200, step: 1, value: 120, fmt: function (v) { return v; } }, upd);
    var sR = U.slider(sh.ctl, { label: 'Drum radius R', unit: 'mm', min: 40, max: 250, step: 1, value: 150, fmt: function (v) { return v; } }, upd);
    var se = U.slider(sh.ctl, { label: 'Engagement speed', unit: 'rpm', min: 100, max: 3000, step: 50, value: 500, fmt: function (v) { return v; } }, upd);
    var N = U.slider(sh.ctl, { label: 'Running speed N', unit: 'rpm', min: 100, max: 6000, step: 50, value: 1000, fmt: function (v) { return v; } }, upd);
    var Te = U.slider(sh.ctl, { label: 'Engine torque to pass', unit: 'N m', min: 10, max: 800, step: 5, value: 200, fmt: function (v) { return v; } }, upd);
    function vis() {
      var t = type.v(), plate = t === 'sp' || t === 'mp' || t === 'cone';
      [Ro, Ri, F].forEach(function (s) { show(s, plate); }); show(n1, t === 'mp'); show(n2, t === 'mp'); show(al, t === 'cone');
      [sn, sm, sr, sR, se].forEach(function (s) { show(s, t === 'cf'); });
    }
    var ctx = U.canvas(sh.view, 820, 330);
    var out = U.outputs(sh.view, [['tw', 'Capacity, uniform wear', 'N m'], ['tp', 'Capacity, uniform pressure', 'N m'], ['P', 'Power it can pass at N', 'kW'], ['pm', 'Greatest lining pressure', 'kPa'], ['need', 'Least F or speed to carry the engine torque', '']]);
    var msg = U.msg(sh.view);
    function plateT(t, Fv, ro, ri, m) {
      var n = t === 'sp' ? 2 : t === 'mp' ? n1.v() + n2.v() - 1 : 1;
      var s = t === 'cone' ? Math.sin(rad(al.v())) : 1;
      return { uw: n * m * Fv * (ro + ri) / 2 / s, up: n * m * Fv * 2 / 3 * (Math.pow(ro, 3) - Math.pow(ri, 3)) / (ro * ro - ri * ri) / s, n: n };
    }
    function cfT(w) { var we = 2 * Math.PI * se.v() / 60; return w <= we ? 0 : sn.v() * mu.v() * sm.v() * sr.v() / 1000 * (w * w - we * we) * sR.v() / 1000; }
    function draw() {
      ctx.clear();
      var t = type.v(), m = mu.v(), w = 2 * Math.PI * N.v() / 60, Tneed = Te.v();
      var bx = { x: 80, y: 30, w: 700, h: 240 }, ax, cap, tp, pm, need;
      if (t !== 'cf') {
        var ro = Ro.v() / 1000, ri = Math.min(Ri.v(), Ro.v() - 5) / 1000, Fv = F.v() * 1000;
        var r = plateT(t, Fv, ro, ri, m); cap = r.uw; tp = r.up;
        pm = Fv / (2 * Math.PI * ri * (ro - ri)) / 1000;
        var Fneed = Tneed / (plateT(t, 1, ro, ri, m).uw);
        need = 'F = ' + f(Fneed / 1000, 3) + ' kN';
        var Fmax = Math.max(F.v() * 2, Fneed / 1000 * 1.3);
        ax = U.axes(ctx, bx, { xmin: 0, xmax: Fmax, ymin: 0, ymax: Math.max(tp / F.v() * Fmax * 1.05, Tneed * 1.2), xlabel: 'axial spring force F (kN)', ylabel: 'torque (N m)', ylabelOff: 48 });
        U.line(ctx, [[ax.X(0), ax.Y(0)], [ax.X(Fmax), ax.Y(cap / F.v() * Fmax)]], C.blue, 2.4);
        U.line(ctx, [[ax.X(0), ax.Y(0)], [ax.X(Fmax), ax.Y(tp / F.v() * Fmax)]], C.blue, 1.2, [5, 4]);
        U.dot(ctx, ax.X(F.v()), ax.Y(cap), 5, C.blue, false);
        U.label(ctx, 'capacity (solid: uniform wear, dashed: uniform pressure)', bx.x + 8, bx.y + 12, { size: 12, color: C.blue, roman: true });
        out({ tw: f(cap, 4), tp: f(tp, 4), P: f(cap * w / 1000, 4), pm: f(pm, 4), need: need });
      } else {
        cap = cfT(w); tp = cap;
        var we = 2 * Math.PI * se.v() / 60;
        var k = sn.v() * m * sm.v() * sr.v() / 1000 * sR.v() / 1000;
        var wneed = Math.sqrt(Tneed / k + we * we);
        need = f(wneed * 60 / (2 * Math.PI), 4) + ' rpm';
        var Nmax = Math.max(N.v() * 1.5, wneed * 60 / (2 * Math.PI) * 1.2);
        var Tmax = Math.max(cfT(Nmax * 2 * Math.PI / 60), Tneed) * 1.1;
        ax = U.axes(ctx, bx, { xmin: 0, xmax: Nmax, ymin: 0, ymax: Tmax, xlabel: 'speed (rpm)', ylabel: 'torque (N m)', ylabelOff: 48 });
        U.curve(ctx, ax, U.range(0, Nmax, 300), function (q) { return cfT(q * 2 * Math.PI / 60); }, C.blue, 2.4);
        U.dot(ctx, ax.X(N.v()), ax.Y(cap), 5, C.blue, false);
        U.line(ctx, [[ax.X(se.v()), ax.Y(0)], [ax.X(se.v()), ax.Y(Tmax)]], C.mute, 1, [3, 3]);
        U.label(ctx, 'shoes start to touch', ax.X(se.v()) + 4, bx.y + 12, { size: 12, color: C.mute, roman: true });
        out({ tw: f(cap, 4), tp: '(same)', P: f(cap * w / 1000, 4), pm: '—', need: need });
      }
      U.line(ctx, [[bx.x, ax.Y(Tneed)], [bx.x + bx.w, ax.Y(Tneed)]], C.red, 1.8, [7, 4]);
      U.label(ctx, 'engine torque ' + Tneed + ' N m', bx.x + bx.w - 4, ax.Y(Tneed) - 10, { size: 12, color: C.red, align: 'right', roman: true });
      if (cap < Tneed) msg('The clutch slips: capacity ' + f(cap, 4) + ' N m is below the engine torque. On the road the engine races, the vehicle barely moves, and the lining glazes and burns (you smell it). Raise the spring force, the radius or μ; you need ' + need + '.', 'bad');
      else msg('The clutch holds with a margin of ' + f((cap / Tneed - 1) * 100, 3) + '%. Designers usually allow 30% or more, so a worn lining or a weakened spring does not start slipping at once.', cap / Tneed < 1.3 ? 'warn' : 'ok');
    }
    vis(); draw(); U.onRedraw(draw);
  })();

  /* ================= journal friction circle ================= */
  (function () {
    var host = document.getElementById('sim-journal'); if (!host) return;
    var sh = U.simShell(host);
    function upd() { draw(); }
    var W = U.slider(sh.ctl, { label: 'Load W', unit: 'kN', min: 1, max: 100, step: 1, value: 25, fmt: function (v) { return v; } }, upd);
    var d = U.slider(sh.ctl, { label: 'Journal diameter', unit: 'mm', min: 20, max: 300, step: 5, value: 100, fmt: function (v) { return v; } }, upd);
    var mu = U.slider(sh.ctl, { label: 'μ (boundary)', min: 0.005, max: 0.4, step: 0.005, value: 0.05, fmt: function (v) { return v.toFixed(3); } }, upd);
    var N = U.slider(sh.ctl, { label: 'Speed N', unit: 'rpm', min: 10, max: 3000, step: 10, value: 300, fmt: function (v) { return v; } }, upd);
    var dir = U.select(sh.ctl, 'Rotation', [['cw', 'Clockwise'], ['acw', 'Anticlockwise']], upd);
    var ctx = U.canvas(sh.view, 760, 360);
    var out = U.outputs(sh.view, [['phi', 'Friction angle φ', 'degrees'], ['rf', 'Friction circle radius r sin φ', 'mm'], ['T', 'Friction torque', 'N m'], ['P', 'Power lost as heat', 'kW']]);
    var t = 0;
    function draw() {
      ctx.clear();
      var phi = Math.atan(mu.v()), r = d.v() / 2000, Wv = W.v() * 1000, w = 2 * Math.PI * N.v() / 60;
      var rf = r * Math.sin(phi), T = Wv * rf;
      out({ phi: f(deg(phi), 3), rf: f(rf * 1000, 4), T: f(T, 4), P: f(T * w / 1000, 4) });
      var cx = 230, cy = 170, Rb = 135, Rj = 118, s = dir.v() === 'cw' ? 1 : -1;
      /* bearing */
      ctx.save(); ctx.fillStyle = '#eef0f2'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, Rb + 22, 0, 2 * Math.PI); ctx.arc(cx, cy, Rb, 0, 2 * Math.PI, true); ctx.fill('evenodd'); ctx.stroke(); ctx.restore();
      /* contact point B climbs against the rotation by angle phi (exaggerated for clarity) */
      var shown = Math.max(phi, rad(4)) * 2.2;
      var bang = Math.PI / 2 + s * shown;
      var Bx = cx + Rb * Math.cos(bang), By = cy + Rb * Math.sin(bang);
      var Ox = Bx - Rj * Math.cos(bang), Oy = By - Rj * Math.sin(bang);
      ctx.save(); ctx.fillStyle = '#d4d9df'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(Ox, Oy, Rj, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
      t += 0.02 * s;
      U.line(ctx, [[Ox, Oy], [Ox + Rj * 0.8 * Math.cos(t), Oy + Rj * 0.8 * Math.sin(t)]], C.mute, 2);
      /* friction circle (drawn to a magnified scale) */
      var rfs = Math.max(6, Rj * Math.sin(Math.min(shown, 0.6)));
      ctx.save(); ctx.strokeStyle = C.red; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(Ox, Oy, rfs, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      U.dot(ctx, Ox, Oy, 3, C.ink, false); U.label(ctx, 'O', Ox + 6, Oy - 8, { size: 13 });
      U.dot(ctx, Bx, By, 3.5, C.ink, false); U.label(ctx, 'B', Bx + 8 * s, By + 14, { size: 13 });
      /* forces */
      U.arrow(ctx, Ox, Oy - 40, Ox, Oy + 60, C.ink, 2.2); U.label(ctx, 'W', Ox + 6, Oy + 50, { size: 14 });
      var Rx = Ox - s * rfs;
      U.arrow(ctx, Rx, By + 70, Rx, By - 10, C.red, 2.4); U.label(ctx, 'R = W', Rx - 14 * s - (s > 0 ? 40 : 0), By + 60, { size: 14, color: C.red });
      U.line(ctx, [[Ox, Oy], [Bx, By]], C.blue, 1.2, [5, 3]); U.label(ctx, 'normal at B', (Ox + Bx) / 2 + 8, (Oy + By) / 2, { size: 12, color: C.blue, roman: true });
      /* rotation arrow */
      ctx.save(); ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Ox, Oy, Rj * 0.5, s > 0 ? -2.4 : -0.7, s > 0 ? -0.7 : -2.4, s < 0); ctx.stroke(); ctx.restore();
      U.label(ctx, 'rotation', Ox, Oy - Rj * 0.5 - 12, { size: 12, color: C.green, align: 'center', roman: true });
      /* text panel */
      U.label(ctx, 'The contact point climbs against the rotation.', 440, 70, { size: 14, roman: true });
      U.label(ctx, 'R and W are equal, parallel and offset by', 440, 100, { size: 14, roman: true });
      U.label(ctx, 'r sin φ = ' + f(rf * 1000, 4) + ' mm, the friction circle (red).', 440, 124, { size: 14, roman: true });
      U.label(ctx, 'Friction couple = W r sin φ = ' + f(T, 4) + ' N m', 440, 160, { size: 14, color: C.red });
      U.label(ctx, 'Angles and the circle are enlarged to be seen.', 440, 200, { size: 12, color: C.mute, roman: true });
    }
    draw(); U.onRedraw(draw);
    U.loop(host, function () { draw(); });
  })();

  /* ================= live worked examples ================= */
  U.calcs.jack = function (v) {
    var c = jackCalc({ d: v.d / 1000, l: v.p / 1000, mu: v.mu, muc: v.muc, Rc: v.Rc / 1000, W: v.W * 1000, L: v.L });
    return { a: f(deg(c.a), 4), ph: f(deg(c.phi), 4), lock: c.lock ? 'the screw is self-locking' : 'the screw overhauls', Tt: f(c.Tt, 4), Tc: f(c.Tc, 4), T: f(c.T, 4), P: f(c.P, 4), Tl: f(c.Tl, 4), Pl: f(c.Pl, 4), e: f(c.eta * 100, 3), e0: f(c.eta0 * 100, 3) };
  };
  U.calcs.collar = function (v) {
    var r = collarT('fc', v.Do / 2000, v.Di / 2000, 0, v.mu, v.F * 1000), w = 2 * Math.PI * v.N / 60;
    return { Tp: f(r.up, 4), Tw: f(r.uw, 4), w: f(w, 4), Pp: f(r.up * w / 1000, 4), Pw: f(r.uw * w / 1000, 4) };
  };
  U.calcs.plate = function (v) {
    var ro = v.Do / 2000, ri = v.Di / 2000, F = v.F * 1000;
    var Rm = 2 / 3 * (Math.pow(ro, 3) - Math.pow(ri, 3)) / (ro * ro - ri * ri);
    var Tw = v.n * v.mu * F * (ro + ri) / 2, Tp = v.n * v.mu * F * Rm;
    return { Tw: f(Tw, 4), Rm: f(Rm * 1000, 4), Tp: f(Tp, 4), P: f(Tw * 2 * Math.PI * v.N / 60 / 1000, 4), pm: f(F / (2 * Math.PI * ri * (ro - ri)) / 1000, 4) };
  };
  U.initLive();
})();
