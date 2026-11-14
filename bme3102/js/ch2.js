/* Chapter 2 live models */
(function () {
  'use strict';
  var C = U.C, rad = U.rad, deg = U.deg, f = U.f, g = 9.81;

  function solveFB(d, a, b, c, t2) {
    var Bx = a * Math.cos(t2), By = a * Math.sin(t2);
    var dx = d - Bx, dy = -By, e = Math.hypot(dx, dy);
    if (e < 1e-9 || e > b + c || e < Math.abs(b - c)) return null;
    var aa = (b * b - c * c + e * e) / (2 * e), h = Math.sqrt(Math.max(0, b * b - aa * aa));
    var px = Bx + aa * dx / e, py = By + aa * dy / e;
    return { B: [Bx, By], C: [px - h * dy / e, py + h * dx / e] };
  }
  function cross(p, q) { return p[0] * q[1] - p[1] * q[0]; }
  /* torque arc: positive anticlockwise (screen y down so draw mirrored) */
  function torqueArc(ctx, p, val, col, lab, rr) {
    rr = rr || 26; if (Math.abs(val) < 1e-9) return;
    var acw = val > 0;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2;
    var a0 = acw ? 0.3 : -0.3 + Math.PI, a1 = acw ? -1.9 : Math.PI + 1.9;
    ctx.beginPath(); ctx.arc(p[0], p[1], rr, a0, a1, acw); ctx.stroke();
    var ex = p[0] + rr * Math.cos(a1), ey = p[1] + rr * Math.sin(a1);
    var tx = acw ? Math.sin(a1) : -Math.sin(a1), ty = acw ? -Math.cos(a1) : Math.cos(a1);
    U.arrow(ctx, ex - tx * 8, ey - ty * 8, ex, ey, col, 2, 9);
    ctx.restore();
    U.label(ctx, lab, p[0] + rr + 6, p[1] - rr, { size: 13, color: col });
  }

  /* ================= static force analysis of a four-bar ================= */
  (function () {
    var host = document.getElementById('sim-static'); if (!host) return;
    var sh = U.simShell(host);
    function upd() { draw(); }
    var a = U.slider(sh.ctl, { label: 'Crank O_2B', unit: 'mm', min: 20, max: 80, step: 1, value: 40, fmt: function (v) { return v; } }, upd);
    var b = U.slider(sh.ctl, { label: 'Coupler BC', unit: 'mm', min: 60, max: 170, step: 1, value: 120, fmt: function (v) { return v; } }, upd);
    var c = U.slider(sh.ctl, { label: 'Output O_4C', unit: 'mm', min: 40, max: 140, step: 1, value: 80, fmt: function (v) { return v; } }, upd);
    var d = U.slider(sh.ctl, { label: 'Frame O_2O_4', unit: 'mm', min: 60, max: 160, step: 1, value: 100, fmt: function (v) { return v; } }, upd);
    var th = U.slider(sh.ctl, { label: 'Crank angle θ_2', unit: 'degrees', min: 0, max: 360, step: 1, value: 70, fmt: function (v) { return v.toFixed(0); } }, upd);
    var T4 = U.slider(sh.ctl, { label: 'Load torque on output T_4', unit: 'N m', min: -100, max: 100, step: 1, value: -40, fmt: function (v) { return v.toFixed(0); } }, upd);
    var ctx = U.canvas(sh.view, 820, 400);
    var out = U.outputs(sh.view, [['F', 'Coupler force F_{BC}', 'N'], ['st', 'Coupler is in', ''], ['T2', 'Input torque T_2 (free bodies)', 'N m'], ['T2v', 'T_2 by virtual work', 'N m'], ['R2', 'Pin reaction at O_2', 'N'], ['ma', 'Torque ratio |T_4/T_2| = |ω_2/ω_4|', '']]);
    var msg = U.msg(sh.view);
    function draw() {
      ctx.clear();
      var A = a.v() / 1000, B = b.v() / 1000, Cc = c.v() / 1000, D = d.v() / 1000, t = rad(th.v()), tq = T4.v();
      var s = solveFB(D, A, B, Cc, t);
      var sc = Math.min(560 / (D + A + Cc), 300 / (2 * Math.max(A, Cc, B * 0.7))) * 0.9;
      var ox = 300 - sc * (D + Cc - A) / 2, oy = 250;
      function P(p) { return [ox + p[0] * sc, oy - p[1] * sc]; }
      var O2 = P([0, 0]), O4 = P([D, 0]);
      if (!s) {
        U.link(ctx, O2, O4, '#8a9099', 8); U.ground(ctx, O2); U.ground(ctx, O4);
        out({ F: '—', st: '—', T2: '—', T2v: '—', R2: '—', ma: '—' });
        msg('The linkage cannot be assembled at this crank angle.', 'bad'); return;
      }
      var Bp = P(s.B), Cp = P(s.C);
      var u = [(s.C[0] - s.B[0]) / B, (s.C[1] - s.B[1]) / B];
      var r4 = [s.C[0] - D, s.C[1]];
      var fF = -tq / cross(r4, u);
      var T2 = fF * cross(s.B, u);
      /* velocity ratio for virtual work */
      var r3 = [s.C[0] - s.B[0], s.C[1] - s.B[1]];
      var det = (-r3[1]) * (-r4[0]) - r4[1] * r3[0];
      var vB = [-s.B[1], s.B[0]];
      var w3 = ((-vB[0]) * (-r4[0]) - r4[1] * (-vB[1])) / det, w4 = ((-r3[1]) * (-vB[1]) - (-vB[0]) * r3[0]) / det;
      var T2v = -tq * w4 / 1;
      U.link(ctx, O2, O4, '#8a9099', 8);
      U.link(ctx, O2, Bp, C.blue, 9); U.link(ctx, Bp, Cp, C.green, 9); U.link(ctx, O4, Cp, C.amber, 9);
      U.ground(ctx, O2); U.ground(ctx, O4); U.pin(ctx, Bp); U.pin(ctx, Cp);
      U.label(ctx, 'O_2', O2[0] - 28, O2[1] + 4, { size: 13 }); U.label(ctx, 'O_4', O4[0] + 12, O4[1] + 4, { size: 13 });
      U.label(ctx, 'B', Bp[0] - 18, Bp[1] - 10, { size: 14 }); U.label(ctx, 'C', Cp[0] + 10, Cp[1] - 10, { size: 14 });
      /* forces: on link 4 at C = fF u ; on link 2 at B = -fF u ; reactions */
      var Fm = Math.abs(fF), L = 70;
      var dir = [u[0] * Math.sign(fF), u[1] * Math.sign(fF)];
      var nx = -u[1] * 16, ny = -u[0] * 16;
      U.arrow(ctx, Cp[0] + nx, Cp[1] + ny, Cp[0] + nx + dir[0] * L, Cp[1] + ny - dir[1] * L, C.red, 2.4);
      U.label(ctx, 'F_{34}', Cp[0] + nx + dir[0] * L + 6, Cp[1] + ny - dir[1] * L - 8, { size: 13, color: C.red });
      U.arrow(ctx, Bp[0] + nx, Bp[1] + ny, Bp[0] + nx - dir[0] * L, Bp[1] + ny + dir[1] * L, C.red, 2.4);
      U.label(ctx, 'F_{32}', Bp[0] + nx - dir[0] * L - 34, Bp[1] + ny + dir[1] * L - 6, { size: 13, color: C.red });
      U.arrow(ctx, O4[0], O4[1], O4[0] - dir[0] * L * 0.8, O4[1] + dir[1] * L * 0.8, C.mute, 2);
      U.arrow(ctx, O2[0], O2[1], O2[0] + dir[0] * L * 0.8, O2[1] - dir[1] * L * 0.8, C.mute, 2);
      torqueArc(ctx, O4, tq, C.amber, 'T_4');
      torqueArc(ctx, O2, T2, C.blue, 'T_2');
      /* free body sketch of the coupler on the right */
      var fx = 690, fy = 120;
      U.label(ctx, 'Coupler free body', fx, 40, { size: 13, color: C.ink2, align: 'center', roman: true });
      var hb = [fx - u[0] * 55, fy + u[1] * 55], hc = [fx + u[0] * 55, fy - u[1] * 55];
      U.link(ctx, hb, hc, C.green, 9); U.pin(ctx, hb); U.pin(ctx, hc);
      var comp = fF > 0;
      if (comp) { U.arrow(ctx, hb[0] - u[0] * 50, hb[1] + u[1] * 50, hb[0], hb[1], C.red, 2.2); U.arrow(ctx, hc[0] + u[0] * 50, hc[1] - u[1] * 50, hc[0], hc[1], C.red, 2.2); }
      else { U.arrow(ctx, hb[0], hb[1], hb[0] - u[0] * 50, hb[1] + u[1] * 50, C.red, 2.2); U.arrow(ctx, hc[0], hc[1], hc[0] + u[0] * 50, hc[1] - u[1] * 50, C.red, 2.2); }
      U.label(ctx, comp ? 'compression' : 'tension', fx, 230, { size: 13, align: 'center', color: C.red, roman: true });
      out({ F: f(Fm, 4), st: comp ? 'compression' : 'tension', T2: f(T2, 4), T2v: f(T2v, 4), R2: f(Fm, 4), ma: f(Math.abs(tq / T2), 3) });
      msg('Moments about O_4 on the output link give F_{BC}; moments about O_2 on the crank give T_2. Virtual work: T_2 ω_2 + T_4 ω_4 = 0. Positive torques are anticlockwise.', 'ok');
      host.querySelector('.msg').innerHTML = 'Moments about ' + U.m('O_4') + ' on the output link give ' + U.m('F_{BC}') + '; moments about ' + U.m('O_2') + ' on the crank give ' + U.m('T_2') + '. Virtual work: ' + U.m('T_2 ω_2 + T_4 ω_4 = 0') + '. Positive torques are anticlockwise.';
    }
    draw(); U.onRedraw(draw);
  })();

  /* ================= engine force flow ================= */
  function engineForces(o, t) {
    var A = Math.PI * o.D * o.D / 4, w = 2 * Math.PI * o.N / 60;
    var aP = w * w * o.r * (Math.cos(t) + Math.cos(2 * t) / o.n);
    var Fg = o.p * A, Fi = o.mR * aP, FP = Fg - Fi;
    var phi = Math.asin(Math.sin(t) / o.n);
    var FQ = FP / Math.cos(phi), FN = FP * Math.tan(phi);
    var FT = FQ * Math.sin(t + phi), FR = FQ * Math.cos(t + phi);
    return { A: A, w: w, aP: aP, Fg: Fg, Fi: Fi, FP: FP, phi: phi, FQ: FQ, FN: FN, FT: FT, FR: FR, T: FT * o.r };
  }
  (function () {
    var host = document.getElementById('sim-engine'); if (!host) return;
    var sh = U.simShell(host);
    function upd() { draw(); }
    var r = U.slider(sh.ctl, { label: 'Crank radius r', unit: 'mm', min: 30, max: 150, step: 1, value: 60, fmt: function (v) { return v; } }, upd);
    var n = U.slider(sh.ctl, { label: 'n = L/r', min: 3, max: 6, step: 0.1, value: 4, fmt: function (v) { return v.toFixed(1); } }, upd);
    var N = U.slider(sh.ctl, { label: 'Speed N', unit: 'rpm', min: 200, max: 4000, step: 50, value: 1500, fmt: function (v) { return v.toFixed(0); } }, upd);
    var D = U.slider(sh.ctl, { label: 'Bore D', unit: 'mm', min: 60, max: 200, step: 1, value: 100, fmt: function (v) { return v; } }, upd);
    var p = U.slider(sh.ctl, { label: 'Gas pressure (gauge)', unit: 'kPa', min: 0, max: 5000, step: 50, value: 1500, fmt: function (v) { return v.toFixed(0); } }, upd);
    var mR = U.slider(sh.ctl, { label: 'Reciprocating mass m_R', unit: 'kg', min: 0.2, max: 6, step: 0.1, value: 1.5, fmt: function (v) { return v.toFixed(1); } }, upd);
    var th = U.slider(sh.ctl, { label: 'Crank angle θ from TDC', unit: 'degrees', min: 0, max: 360, step: 1, value: 30, fmt: function (v) { return v.toFixed(0); } }, upd);
    var ctx = U.canvas(sh.view, 900, 470);
    var out = U.outputs(sh.view, [['Fg', 'Gas force F_{gas}', 'kN'], ['Fi', 'Inertia force F_i', 'kN'], ['FP', 'Piston effort F_P', 'kN'], ['phi', 'Obliquity φ', 'degrees'], ['FQ', 'Rod thrust F_Q', 'kN'], ['FN', 'Side thrust F_N', 'kN'], ['FT', 'Crank effort F_T', 'kN'], ['T', 'Turning moment T', 'N m']]);
    function draw() {
      ctx.clear();
      var o = { r: r.v() / 1000, n: n.v(), N: N.v(), D: D.v() / 1000, p: p.v() * 1000, mR: mR.v() };
      var t = rad(th.v()), e = engineForces(o, t);
      out({ Fg: f(e.Fg / 1000, 4), Fi: f(e.Fi / 1000, 4), FP: f(e.FP / 1000, 4), phi: f(deg(e.phi), 3), FQ: f(e.FQ / 1000, 4), FN: f(e.FN / 1000, 4), FT: f(e.FT / 1000, 4), T: f(e.T, 4) });
      /* mechanism */
      var R = o.r, L = o.r * o.n;
      var sc = 520 / (R * 2.4 + L + R * 1.2);
      var Ox = 60 + R * 1.2 * sc, Oy = 140;
      function P(q) { return [Ox + q[0] * sc, Oy - q[1] * sc]; }
      var Aw = [R * Math.cos(t), R * Math.sin(t)], Bx = R * Math.cos(t) + Math.sqrt(L * L - Math.pow(R * Math.sin(t), 2));
      var Os = P([0, 0]), As = P(Aw), Bs = P([Bx, 0]);
      var x0 = P([L - R - R * 0.3, 0])[0], x1 = P([L + R + R * 0.9, 0])[0];
      U.hatchLine(ctx, x0, Oy - 30, x1, Oy - 30, -1); U.hatchLine(ctx, x0, Oy + 30, x1, Oy + 30, 1);
      ctx.save(); ctx.strokeStyle = C.line; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(Os[0], Os[1], R * sc, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      U.link(ctx, Os, As, C.blue, 9); U.link(ctx, As, Bs, C.green, 9);
      ctx.save(); ctx.fillStyle = '#dfe3e8'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.fillRect(Bs[0] - 10, Oy - 28, 64, 56); ctx.strokeRect(Bs[0] - 10, Oy - 28, 64, 56); ctx.restore();
      U.ground(ctx, Os); U.pin(ctx, As); U.pin(ctx, Bs);
      var Fmax = Math.max(Math.abs(e.Fg), Math.abs(e.Fi), Math.abs(e.FQ), 1);
      var k = 90 / Fmax;
      /* gas force on crown (towards crank = -x) */
      var crown = Bs[0] + 54;
      if (Math.abs(e.Fg) > 1) { U.arrow(ctx, crown + e.Fg * k, Oy - 10, crown, Oy - 10, C.red, 2.4); U.label(ctx, 'F_{gas}', crown + 8, Oy - 22, { size: 13, color: C.red }); }
      /* inertia force: opposite to piston acceleration (accel towards crank positive) */
      U.arrow(ctx, crown, Oy + 12, crown + e.Fi * k, Oy + 12, C.amber, 2.4);
      U.label(ctx, 'F_i', crown + e.Fi * k + (e.Fi > 0 ? 6 : -24), Oy + 26, { size: 13, color: C.amber });
      /* side thrust: wall on piston */
      var uAB = [(Bx - Aw[0]) / L, (0 - Aw[1]) / L];
      var Nw = -e.FQ * uAB[1];
      U.arrow(ctx, Bs[0] + 22, Oy, Bs[0] + 22, Oy - Nw * k, C.violet, 2.2);
      U.label(ctx, 'F_N', Bs[0] + 30, Oy - Nw * k + (Nw > 0 ? -6 : 10), { size: 13, color: C.violet });
      /* rod thrust on crank pin, and its components */
      var fq = [-uAB[0] * e.FQ, -uAB[1] * e.FQ];
      U.arrow(ctx, As[0], As[1], As[0] + fq[0] * k, As[1] - fq[1] * k, C.green, 2.4);
      U.label(ctx, 'F_Q', As[0] + fq[0] * k - 8, As[1] - fq[1] * k - 12, { size: 13, color: C.green });
      var tdir = [-Math.sin(t), Math.cos(t)], rdir = [Math.cos(t), Math.sin(t)];
      U.arrow(ctx, As[0], As[1], As[0] + tdir[0] * e.FT * k, As[1] - tdir[1] * e.FT * k, C.blue, 2.6);
      U.label(ctx, 'F_T', As[0] + tdir[0] * e.FT * k + 6, As[1] - tdir[1] * e.FT * k + 14, { size: 13, color: C.blue });
      U.line(ctx, [As, [As[0] + rdir[0] * -e.FR * k, As[1] - rdir[1] * -e.FR * k]], C.mute, 1.6, [4, 3]);
      U.label(ctx, 'O', Os[0] - 20, Os[1] - 10, { size: 14 }); U.label(ctx, 'A', As[0] - 6, As[1] - 16, { size: 14 }); U.label(ctx, 'B', Bs[0] - 6, Bs[1] - 36, { size: 14 });
      /* plot inertia torque and inertia force over a turn */
      var bx = { x: 90, y: 290, w: 760, h: 140 };
      var pts = [], pf = [], tmax = 1, fmax = 1;
      for (var i = 0; i <= 360; i += 2) {
        var q = engineForces({ r: o.r, n: o.n, N: o.N, D: o.D, p: 0, mR: o.mR }, rad(i));
        pts.push([i, q.T]); pf.push([i, q.Fi]); tmax = Math.max(tmax, Math.abs(q.T)); fmax = Math.max(fmax, Math.abs(q.Fi));
      }
      var ax = U.axes(ctx, bx, { xmin: 0, xmax: 360, ymin: -tmax * 1.15, ymax: tmax * 1.15, xticks: [0, 45, 90, 135, 180, 225, 270, 315, 360], xlabel: 'crank angle θ (degrees)', ylabel: 'T (N m)', ylabelOff: 50 });
      U.line(ctx, pf.map(function (q) { return [ax.X(q[0]), ax.Y(q[1] / fmax * tmax)]; }), C.amber, 1.4, [5, 4]);
      U.line(ctx, pts.map(function (q) { return [ax.X(q[0]), ax.Y(q[1])]; }), C.ink, 2);
      var cur = engineForces({ r: o.r, n: o.n, N: o.N, D: o.D, p: 0, mR: o.mR }, t);
      U.dot(ctx, ax.X(th.v()), ax.Y(cur.T), 5, C.red, false);
      U.label(ctx, 'solid: turning moment from inertia alone (no gas). dashed: inertia force, scaled (peak ' + f(fmax / 1000, 3) + ' kN)', bx.x + 4, bx.y - 12, { size: 12, color: C.ink2, roman: true });
    }
    draw(); U.onRedraw(draw);
  })();

  /* ================= turning-moment diagram and flywheel ================= */
  var ENG = {
    ic1: { name: 'Single-cylinder four-stroke petrol', cyc: 720, N: 2000, K: 2, rr: 0.12 },
    ic4: { name: 'Four-cylinder four-stroke petrol', cyc: 180, N: 2000, K: 2, rr: 0.12 },
    st1: { name: 'Steam engine: one double-acting cylinder', cyc: 360, N: 150, K: 2, rr: 1.0 },
    st2: { name: 'Steam engine: two cylinders, cranks at 90°', cyc: 360, N: 150, K: 2, rr: 1.0 },
    st3: { name: 'Steam engine: three cylinders, cranks at 120°', cyc: 360, N: 150, K: 2, rr: 1.0 },
    press: { name: 'Punching press (Example 2.8)', cyc: 360, N: 250, K: 10, rr: 0.5 }
  };
  /* single-cylinder petrol: bore 100 mm, stroke 120 mm, rc 8 */
  function icTorque(thd, N) {
    var r = 0.06, n = 4, A = Math.PI * 0.1 * 0.1 / 4, rc = 8, pa = 101.3e3, mR = 1.0;
    var t = rad(thd % 720), tt = t % (2 * Math.PI);
    var xf = (1 - Math.cos(tt)) / 2 + (n - Math.sqrt(n * n - Math.pow(Math.sin(tt), 2))) / 2; /* fraction of stroke from TDC */
    var Vc = 1 / (rc - 1), V = Vc + xf;
    var d = thd % 720, p;
    var p1 = 90e3, pc = p1 * Math.pow((Vc + 1) / Vc, 1.32), p3 = pc * 3.2;
    if (d < 180) p = p1;
    else if (d < 360) p = p1 * Math.pow((Vc + 1) / V, 1.32);
    else if (d < 540) p = p3 * Math.pow(Vc / V, 1.3);
    else p = 115e3;
    var w = 2 * Math.PI * N / 60;
    var FP = (p - pa) * A - mR * w * w * r * (Math.cos(tt) + Math.cos(2 * tt) / n);
    return FP * r * (Math.sin(tt) + Math.sin(2 * tt) / (2 * Math.sqrt(n * n - Math.pow(Math.sin(tt), 2))));
  }
  /* double-acting steam cylinder: bore 250 mm, stroke 400 mm, 900 kPa supply, cut-off 35% */
  function stTorque(thd, N) {
    var r = 0.2, n = 5, A = Math.PI * 0.25 * 0.25 / 4, mR = 45, ps = 900e3, pb = 120e3, cut = 0.35, cl = 0.08;
    var t = rad(((thd % 360) + 360) % 360);
    var xf = (1 - Math.cos(t)) / 2 + (n - Math.sqrt(n * n - Math.pow(Math.sin(t), 2))) / 2;
    function pr(s) { return s <= cut ? ps : ps * (cut + cl) / (s + cl); }
    var ph, pk;
    if (t <= Math.PI) { ph = pr(xf); pk = pb; } else { ph = pb; pk = pr(1 - xf); }
    var w = 2 * Math.PI * N / 60;
    var FP = (ph - pk) * A - mR * w * w * r * (Math.cos(t) + Math.cos(2 * t) / n);
    return FP * r * (Math.sin(t) + Math.sin(2 * t) / (2 * Math.sqrt(n * n - Math.pow(Math.sin(t), 2))));
  }
  function pressTorque(thd) {
    var Ep = 4712, dth = rad(36), Tm = Ep / (2 * Math.PI);
    var d = ((thd % 360) + 360) % 360, load = 0;
    if (d >= 180 && d < 216) { var s = (d - 180) / 36; load = 2 * Ep / dth * (1 - s); }
    return { net: Tm - load, load: load, Tm: Tm };
  }
  function torqueAt(type, thd, N) {
    switch (type) {
      case 'ic1': return icTorque(thd, N);
      case 'ic4': return icTorque(thd, N) + icTorque(thd + 180, N) + icTorque(thd + 360, N) + icTorque(thd + 540, N);
      case 'st1': return stTorque(thd, N);
      case 'st2': return stTorque(thd, N) + stTorque(thd + 90, N);
      case 'st3': return stTorque(thd, N) + stTorque(thd + 120, N) + stTorque(thd + 240, N);
      case 'press': return pressTorque(thd).load;
    }
  }
  (function () {
    var host = document.getElementById('sim-tm'); if (!host) return;
    var sh = U.simShell(host);
    var type = U.select(sh.ctl, 'Machine', Object.keys(ENG).map(function (k) { return [k, ENG[k].name]; }), function () {
      var E = ENG[type.v()]; N.set(E.N); K.set(E.K); rr.set(E.rr); draw();
    });
    function upd() { draw(); }
    var N = U.slider(sh.ctl, { label: 'Mean speed N', unit: 'rpm', min: 50, max: 4000, step: 10, value: 2000, fmt: function (v) { return v.toFixed(0); } }, upd);
    var K = U.slider(sh.ctl, { label: 'Allowed fluctuation K', unit: '%', min: 0.2, max: 15, step: 0.1, value: 2, fmt: function (v) { return v.toFixed(1); } }, upd);
    var mat = U.select(sh.ctl, 'Rim material', [['ci', 'Cast iron, 7200 kg/m³, 6 MPa'], ['cs', 'Cast steel, 7850 kg/m³, 20 MPa']], upd);
    var rr = U.slider(sh.ctl, { label: 'Mean rim radius', unit: 'm', min: 0.05, max: 2, step: 0.01, value: 0.12, fmt: function (v) { return v.toFixed(2); } }, upd);
    var ctx = U.canvas(sh.view, 920, 500);
    var out = U.outputs(sh.view, [['Tm', 'Mean torque', 'N m'], ['P', 'Power', 'kW'], ['W', 'Work per cycle', 'J'], ['e', 'Max fluctuation e', 'J'], ['CE', 'e ÷ work per cycle', ''], ['I', 'Flywheel I needed', 'kg m²'], ['v', 'Rim speed', 'm/s'], ['m', 'Rim mass', 'kg'], ['tb', 'Rim t × b (b = 2t)', 'mm']]);
    var msg = U.msg(sh.view);
    function draw() {
      ctx.clear();
      var tp = type.v(), E = ENG[tp], n = N.v(), w = 2 * Math.PI * n / 60, k = K.v() / 100;
      var span = tp === 'ic1' ? 720 : 360;
      var step = 1, T = [], sum = 0;
      for (var i = 0; i <= span; i += step) { var v = torqueAt(tp, i, n); T.push(v); if (i < span) sum += v; }
      var Tm = sum / (span / step);
      if (tp === 'press') Tm = pressTorque(0).Tm;
      var cycDeg = E.cyc, work = Tm * rad(cycDeg);
      /* cumulative energy over the plotted span */
      var Ecum = [0], emin = 0, emax = 0;
      for (var j = 1; j < T.length; j++) {
        var dE = tp === 'press' ? (Tm - (T[j] + T[j - 1]) / 2) * rad(step) : ((T[j] + T[j - 1]) / 2 - Tm) * rad(step);
        Ecum.push(Ecum[j - 1] + dE); emin = Math.min(emin, Ecum[j]); emax = Math.max(emax, Ecum[j]);
      }
      var e = emax - emin, I = e / (k * w * w);
      /* areas between crossings */
      var areas = [], acc = 0, start = 0;
      for (var q = 1; q < T.length; q++) {
        var y0 = (tp === 'press' ? Tm - T[q - 1] : T[q - 1] - Tm), y1 = (tp === 'press' ? Tm - T[q] : T[q] - Tm);
        acc += (y0 + y1) / 2 * rad(step);
        if ((y0 >= 0) !== (y1 >= 0) || q === T.length - 1) { areas.push({ a: acc, x0: start, x1: q * step }); acc = 0; start = q * step; }
      }
      /* plot torque */
      var tmin = Math.min.apply(0, T), tmax = Math.max.apply(0, T);
      if (tp === 'press') { tmin = 0; }
      var pad = (tmax - tmin) * 0.08 + 1;
      var bx = { x: 80, y: 30, w: 810, h: 250 };
      var xt = []; for (var xx = 0; xx <= span; xx += (span === 720 ? 90 : 45)) xt.push(xx);
      var ax = U.axes(ctx, bx, { xmin: 0, xmax: span, ymin: Math.min(tmin - pad, 0), ymax: tmax + pad, xticks: xt, ylabel: tp === 'press' ? 'load torque (N m)' : 'turning moment T (N m)', ylabelOff: 58 });
      /* shade areas */
      ctx.save();
      for (var z = 0; z < T.length - 1; z++) {
        var above = tp === 'press' ? T[z] < Tm : T[z] > Tm;
        ctx.fillStyle = above ? 'rgba(29,122,70,0.22)' : 'rgba(168,20,28,0.18)';
        ctx.beginPath(); ctx.moveTo(ax.X(z * step), ax.Y(Tm)); ctx.lineTo(ax.X(z * step), ax.Y(T[z])); ctx.lineTo(ax.X((z + 1) * step), ax.Y(T[z + 1])); ctx.lineTo(ax.X((z + 1) * step), ax.Y(Tm)); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      U.line(ctx, T.map(function (v, i2) { return [ax.X(i2 * step), ax.Y(v)]; }), C.ink, 2);
      U.line(ctx, [[ax.X(0), ax.Y(Tm)], [ax.X(span), ax.Y(Tm)]], C.blue, 1.6, [7, 4]);
      U.label(ctx, (tp === 'press' ? 'motor torque = mean load ' : 'mean torque ') + f(Tm, 3) + ' N m', ax.X(span) - 4, ax.Y(Tm) - 10, { size: 12, color: C.blue, align: 'right', roman: true, bg: 'rgba(255,255,255,.85)' });
      if (tp === 'ic1') { ['suction', 'compression', 'expansion', 'exhaust'].forEach(function (s2, i3) { U.label(ctx, s2, ax.X(90 + 180 * i3), bx.y + 12, { size: 12, color: C.ink2, align: 'center', roman: true }); }); }
      /* label big areas */
      var big = areas.filter(function (a2) { return Math.abs(a2.a) > 0.04 * e; });
      big.slice(0, 12).forEach(function (a2, i4) {
        var xm = (a2.x0 + a2.x1) / 2;
        var yv = torqueAt(tp, xm, n);
        var yy = (yv + Tm) / 2;
        U.label(ctx, 'a_{' + (i4 + 1) + '}', ax.X(xm), ax.Y(yy), { size: 13, align: 'center', color: a2.a > 0 ? C.green : C.red, bg: 'rgba(255,255,255,.75)' });
      });
      /* speed curve */
      var bx2 = { x: 80, y: 330, w: 810, h: 120 };
      var Emean = (emax + emin) / 2;
      var sp = Ecum.map(function (E2) { return (w + (E2 - Emean) / (I * w)) * 60 / (2 * Math.PI); });
      var smin = Math.min.apply(0, sp), smax = Math.max.apply(0, sp), sp2 = (smax - smin) * 0.3 + 1e-6;
      var ax2 = U.axes(ctx, bx2, { xmin: 0, xmax: span, ymin: smin - sp2, ymax: smax + sp2, xticks: xt, xlabel: 'crank angle (degrees)', ylabel: 'speed (rpm)', ylabelOff: 58, yfmt: function (v) { return v.toFixed(n < 500 ? 1 : 0); } });
      U.line(ctx, sp.map(function (v, i5) { return [ax2.X(i5 * step), ax2.Y(v)]; }), C.violet, 2);
      U.label(ctx, 'speed with this flywheel: ' + f(smin, 4) + ' to ' + f(smax, 4) + ' rpm', bx2.x + 6, bx2.y - 8, { size: 12, color: C.violet, roman: true });
      /* rim */
      var rho = mat.v() === 'ci' ? 7200 : 7850, sig = mat.v() === 'ci' ? 6e6 : 20e6;
      var R = rr.v(), v = w * R, vmax = Math.sqrt(sig / rho), mrim = I / (R * R), Arim = mrim / (2 * Math.PI * R * rho), t = Math.sqrt(Arim / 2);
      out({ Tm: f(Tm, 4), P: f(Tm * w / 1000, 3), W: f(work, 4), e: f(e, 4), CE: f(e / work, 3), I: f(I, 3), v: f(v, 3), m: f(mrim, 3), tb: f(t * 1000, 3) + ' × ' + f(2 * t * 1000, 3) });
      var list = big.slice(0, 8).map(function (a2, i6) { return 'a<sub>' + (i6 + 1) + '</sub> = ' + (a2.a > 0 ? '+' : '−') + f(Math.abs(a2.a), 3) + ' J'; }).join(', ');
      if (v > vmax) msg('Rim speed ' + f(v, 3) + ' m/s is above the safe ' + f(vmax, 3) + ' m/s for this material (σ = ρv² would reach ' + f(rho * v * v / 1e6, 3) + ' MPa). On a real machine the rim could burst. Reduce the radius to ' + f(vmax / w, 3) + ' m or less.', 'bad');
      else msg('Areas from the start of the cycle: ' + list + '. Rim speed ' + f(v, 3) + ' m/s is within the safe ' + f(vmax, 3) + ' m/s (largest safe radius ' + f(vmax / w, 3) + ' m).', 'ok');
    }
    draw(); U.onRedraw(draw);
  })();

  /* ================= live worked examples ================= */
  U.calcs.ex21 = function (v) {
    var b = v.l - v.a, tp = v.ts / v.nos, L = g * Math.pow(tp / (2 * Math.PI), 2);
    var k2 = b * (L - b), k = Math.sqrt(Math.max(0, k2));
    var ma = v.m * b / v.l, mb = v.m - ma, w = 2 * Math.PI * v.N / 60, n = v.l / v.r, t = rad(v.th);
    var s = Math.sin(t), rt = Math.sqrt(n * n - s * s);
    var Fb = mb * w * w * v.r * (Math.cos(t) + Math.cos(2 * t) / n), Fn = Fb - mb * g;
    var Tb = Fn * v.r * (s + Math.sin(2 * t) / (2 * rt));
    var ac = -w * w * s * (n * n - 1) / Math.pow(n * n - s * s, 1.5);
    var dT = v.m * b * ac * (v.l - L), Tc = dT * Math.cos(t) / rt, Ta = ma * g * v.r * s;
    return { b: f(b, 3), tp: f(tp, 4), L: f(L, 4), k: f(k, 4), ma: f(ma, 4), mb: f(mb, 4), w: f(w, 4), n: f(n, 3), Fb: f(Fb, 5), Fn: f(Fn, 5), Tb: f(Tb, 5), ac: f(ac, 4), dT: f(dT, 4), Tc: f(Tc, 4), Ta: f(Ta, 4), T: f(Tb - Tc - Ta, 5) };
  };
  U.calcs.rim = function (v) {
    var w = 2 * Math.PI * v.N / 60, I = v.e / (v.K * w * w), vv = Math.sqrt(v.s * 1e6 / v.rho), r = vv / w, m = I / (r * r), A = m / (2 * Math.PI * r * v.rho), t = Math.sqrt(A / 2);
    return { w: f(w, 4), I: f(I, 4), v: f(vv, 4), r: f(r, 4), D: f(2 * r, 3), m: f(m, 4), A: f(A * 1e6, 4), t: f(t * 1000, 3), bb: f(2 * t * 1000, 3) };
  };
  U.initLive();
})();
