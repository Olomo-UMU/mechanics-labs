/* Chapter 5 live models: involute mesh and epicyclic train */
(function () {
  'use strict';
  var C = U.C, f = U.f, rad = U.rad, deg = U.deg;

  function fillPoly(ctx, pts, T, fill, stroke) {
    ctx.save(); ctx.beginPath();
    pts.forEach(function (p, i) { var q = T(p); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill('evenodd'); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.1; ctx.stroke(); } ctx.restore();
  }
  function rot(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }

  /* contact geometry for a pair: module 1 units */
  function contact(t, T, phi, add) {
    var r = t / 2, R = T / 2, ra = r + add, Ra = R + add;
    var KP = Math.sqrt(Ra * Ra - Math.pow(R * Math.cos(phi), 2)) - R * Math.sin(phi);
    var PL = Math.sqrt(ra * ra - Math.pow(r * Math.cos(phi), 2)) - r * Math.sin(phi);
    var pb = Math.PI * Math.cos(phi);
    var Ramax = Math.sqrt(Math.pow(R * Math.cos(phi), 2) + Math.pow((r + R) * Math.sin(phi), 2));
    var ramax = Math.sqrt(Math.pow(r * Math.cos(phi), 2) + Math.pow((r + R) * Math.sin(phi), 2));
    var G = T / t, s2 = Math.pow(Math.sin(phi), 2);
    var Tmin = 2 * add / (Math.sqrt(1 + (1 / G) * (1 / G + 2) * s2) - 1);
    return { r: r, R: R, KP: KP, PL: PL, path: KP + PL, pb: pb, cr: (KP + PL) / pb, Ramax: Ramax, ramax: ramax, Tmin: Tmin, tmin: Tmin / G, intW: KP > r * Math.sin(phi) + 1e-9, intP: PL > R * Math.sin(phi) + 1e-9 };
  }

  /* ================= involute mesh ================= */
  (function () {
    var host = document.getElementById('sim-mesh'); if (!host) return;
    var sh = U.simShell(host);
    var th = 0, playing = true, geo = null;
    function upd() { build(); draw(); }
    var t = U.slider(sh.ctl, { label: 'Pinion teeth t', min: 8, max: 40, step: 1, value: 20, fmt: function (v) { return v; } }, upd);
    var T = U.slider(sh.ctl, { label: 'Wheel teeth T', min: 12, max: 90, step: 1, value: 40, fmt: function (v) { return v; } }, upd);
    var ph = U.select(sh.ctl, 'Pressure angle φ', [['20', '20°'], ['14.5', '14.5°'], ['25', '25°']], upd);
    var ad = U.slider(sh.ctl, { label: 'Addendum', unit: 'modules', min: 0.6, max: 1.3, step: 0.05, value: 1, fmt: function (v) { return v.toFixed(2); } }, upd);
    var btn = U.buttons(sh.ctl, [['p', 'Pause', function () { playing = !playing; btn.p.textContent = playing ? 'Pause' : 'Play'; }]]);
    var ctx = U.canvas(sh.view, 900, 440);
    var out = U.outputs(sh.view, [['path', 'Path of contact', 'modules'], ['cr', 'Contact ratio', ''], ['now', 'Pairs in contact now', ''], ['amax', 'Largest wheel addendum without interference', 'modules'], ['tmin', 'Fewest pinion teeth at this ratio', ''], ['kp', 'Approach KP and recess PL', 'modules']]);
    var msg = U.msg(sh.view);
    function build() {
      var tt = t.v(), TT = T.v(), phi = rad(+ph.v()), a = ad.v();
      var g1 = Gear.outline(tt, 1, phi, a, 1.25, 0), g2 = Gear.outline(TT, 1, phi, a, 1.25, 0);
      var c = contact(tt, TT, phi, a);
      var phase2 = Gear.meshPhase(tt, 0, 0, TT, false);
      /* s0: where the leading flank of the pinion tooth centred at 0 crosses the line of action */
      var P = [c.r, 0], u = [Math.sin(phi), Math.cos(phi)], rb = c.r * Math.cos(phi);
      var half = Math.PI / (2 * tt) + Gear.inv(phi);
      function fn(s) { var x = P[0] + s * u[0], y = P[1] + s * u[1], rr = Math.hypot(x, y); var ps = half - Gear.inv(Math.acos(Math.min(1, rb / Math.max(rr, rb)))); return Math.atan2(y, x) - ps; }
      var lo = -c.pb, hi = c.pb, s0 = 0;
      for (var i = 0; i < 60; i++) { var mid = (lo + hi) / 2; if (fn(lo) * fn(mid) <= 0) hi = mid; else lo = mid; s0 = mid; }
      geo = { tt: tt, TT: TT, phi: phi, g1: g1, g2: g2, c: c, phase2: phase2, s0: s0, u: u, P: P, rb1: rb };
    }
    function draw() {
      if (!geo) return;
      ctx.clear();
      var G = geo, c = G.c;
      var th1 = th, th2 = -th * G.tt / G.TT;
      /* zoomed view centred on the pitch point: about 18 modules tall */
      var sc = 380 / 18, cx = 330, cy = 225;
      function W(p) { return [cx + (p[0] - c.r) * sc, cy - p[1] * sc]; }
      var O2 = [c.r + c.R, 0];
      fillPoly(ctx, G.g2.pts.map(function (p) { var q = rot(p, G.phase2 + th2); return [q[0] + O2[0], q[1]]; }), W, '#d8dde3', C.ink2);
      fillPoly(ctx, G.g1.pts.map(function (p) { return rot(p, th1); }), W, '#c3d4e8', C.ink2);
      /* circles */
      function arc(o, r, col, dash) { var q = W(o); ctx.save(); ctx.strokeStyle = col; ctx.setLineDash(dash || []); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q[0], q[1], r * sc, 0, 2 * Math.PI); ctx.stroke(); ctx.restore(); }
      arc([0, 0], c.r, C.blue, [6, 4]); arc(O2, c.R, C.blue, [6, 4]);
      arc([0, 0], G.rb1, C.mute, [2, 3]); arc(O2, c.R * Math.cos(G.phi), C.mute, [2, 3]);
      /* line of action, interference points, path of contact */
      var u = G.u, P = G.P;
      var T1 = [P[0] - c.r * Math.sin(G.phi) * u[0], P[1] - c.r * Math.sin(G.phi) * u[1]];
      var T2 = [P[0] + c.R * Math.sin(G.phi) * u[0], P[1] + c.R * Math.sin(G.phi) * u[1]];
      U.line(ctx, [W(T1), W(T2)], C.ink, 1.2, [6, 3]);
      var K = [P[0] - c.KP * u[0], P[1] - c.KP * u[1]], L = [P[0] + c.PL * u[0], P[1] + c.PL * u[1]];
      U.line(ctx, [W(K), W(L)], C.red, 4);
      U.dot(ctx, W(T1)[0], W(T1)[1], 4, '#fff', C.violet); U.dot(ctx, W(T2)[0], W(T2)[1], 4, '#fff', C.violet);
      U.label(ctx, 'T_1', W(T1)[0] - 24, W(T1)[1] + 4, { size: 13, color: C.violet }); U.label(ctx, 'T_2', W(T2)[0] + 8, W(T2)[1], { size: 13, color: C.violet });
      U.label(ctx, 'K', W(K)[0] + 8, W(K)[1] + 6, { size: 13, color: C.red }); U.label(ctx, 'L', W(L)[0] + 8, W(L)[1], { size: 13, color: C.red });
      U.dot(ctx, W(P)[0], W(P)[1], 3.5, C.ink, false); U.label(ctx, 'P', W(P)[0] + 8, W(P)[1] + 14, { size: 13 });
      /* contacts */
      var now = 0, s;
      var base = G.s0 + G.rb1 * th1; base = base - Math.floor((base + c.KP) / c.pb) * c.pb;
      for (var q = 0; q < 5; q++) {
        s = base + q * c.pb;
        if (s >= -c.KP - 1e-9 && s <= c.PL + 1e-9) { now++; var X = [P[0] + s * u[0], P[1] + s * u[1]]; U.dot(ctx, W(X)[0], W(X)[1], 6, C.red, '#fff'); }
      }
      /* overview inset */
      var iy = 90;
      ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(640, 10, 250, 160); ctx.strokeStyle = C.line; ctx.strokeRect(640, 10, 250, 160); ctx.restore();
      var isc2 = Math.min(230 / (2 * (c.r + c.R + 2)), 150 / (2 * (c.R + 1.5)));
      function I2(p) { return [650 + (p[0] + c.r + 1.4) * isc2, iy - p[1] * isc2]; }
      fillPoly(ctx, G.g1.pts.map(function (p) { return rot(p, th1); }), I2, '#c3d4e8', null);
      fillPoly(ctx, G.g2.pts.map(function (p) { var qq = rot(p, G.phase2 + th2); return [qq[0] + O2[0], qq[1]]; }), I2, '#d8dde3', null);
      U.label(ctx, 'whole pair', 650, 22, { size: 11, color: C.mute, roman: true });
      /* labels */
      U.label(ctx, 'pinion (driver, anticlockwise)', 20, 24, { size: 13, color: C.blue, roman: true, bg: 'rgba(255,255,255,0.9)' });
      U.label(ctx, 'wheel', 520, 24, { size: 13, color: C.ink2, roman: true });
      U.label(ctx, 'red: path of contact KL;  dashed: line of action T_1T_2;  violet: interference points', 20, 425, { size: 12, color: C.ink2, bg: 'rgba(255,255,255,0.9)' });
      out({ path: f(c.path, 3), cr: f(c.cr, 3), now: now, amax: f(c.Ramax - c.R, 3), tmin: Math.ceil(c.tmin - 1e-9), kp: f(c.KP, 3) + ' and ' + f(c.PL, 3) });
      if (c.intW || c.intP) msg('Interference: the ' + (c.intW ? "wheel's tip passes the pinion interference point T_1" : "pinion's tip passes the wheel interference point T_2") + '. In a gear cutter the pinion flank is undercut and weakened; in a gear with no undercut the tip would dig into the flank and jam. Use more pinion teeth, a larger pressure angle or a shorter addendum.', 'bad');
      else if (c.cr < 1.2) msg('Contact ratio ' + f(c.cr, 3) + ' is low: for part of each cycle only one pair carries the load and the drive is rough and noisy. Aim for 1.2 or more.', 'warn');
      else msg('No interference. On average ' + f(c.cr, 3) + ' pairs of teeth share the load. The path of contact stays between the interference points T_1 and T_2.', 'ok');
      var mEl = host.querySelector('.msg'); mEl.innerHTML = mEl.innerHTML.replace(/T_1/g, U.m('T_1')).replace(/T_2/g, U.m('T_2'));
    }
    build(); draw(); U.onRedraw(draw);
    U.loop(host, function (dt) { if (!playing) return; th += dt * 0.25; draw(); });
  })();

  /* ================= epicyclic train ================= */
  (function () {
    var host = document.getElementById('sim-epi'); if (!host) return;
    var sh = U.simShell(host);
    var ang = { s: 0, c: 0, a: 0 }, geo = null;
    function upd() { build(); draw(); }
    var S = U.slider(sh.ctl, { label: 'Sun teeth T_S', min: 12, max: 60, step: 1, value: 24, fmt: function (v) { return v; } }, upd);
    var Pp = U.slider(sh.ctl, { label: 'Planet teeth T_P', min: 12, max: 50, step: 1, value: 36, fmt: function (v) { return v; } }, upd);
    var np = U.slider(sh.ctl, { label: 'Number of planets', min: 2, max: 5, step: 1, value: 3, fmt: function (v) { return v; } }, upd);
    var fix = U.select(sh.ctl, 'Held member', [['a', 'Annulus held'], ['s', 'Sun held'], ['c', 'Arm (carrier) held']], upd);
    var inp = U.select(sh.ctl, 'Input', [['s', 'Sun'], ['a', 'Annulus'], ['c', 'Arm']], upd);
    var Nin = U.slider(sh.ctl, { label: 'Input speed', unit: 'rpm', min: 100, max: 3000, step: 50, value: 1500, fmt: function (v) { return v; } }, upd);
    var Tin = U.slider(sh.ctl, { label: 'Input torque', unit: 'N m', min: 1, max: 200, step: 1, value: 10, fmt: function (v) { return v; } }, upd);
    var ctx = U.canvas(sh.view, 820, 400);
    var out = U.outputs(sh.view, [['TA', 'Annulus teeth T_A', ''], ['Nout', 'Output speed', 'rpm'], ['ratio', 'Input ÷ output speed', ''], ['Tout', 'Output torque', 'N m'], ['Tfix', 'Holding torque on the held member', 'N m']]);
    var tbl = U.el('div', 'tryit'); sh.view.appendChild(tbl);
    var msg = U.msg(sh.view);
    var NAME = { s: 'sun', a: 'annulus', c: 'arm' };
    function speeds() {
      var s = S.v(), A = s + 2 * Pp.v(), fx = fix.v(), ip = inp.v();
      if (ip === fx) { ip = fx === 's' ? 'a' : 's'; inp.set(ip); }
      /* Willis: (Ns - Nc) = -(A/s)(Na - Nc) */
      var N = { s: null, a: null, c: null }; N[fx] = 0; N[ip] = Nin.v();
      var o = ['s', 'a', 'c'].filter(function (k) { return k !== fx && k !== ip; })[0];
      if (o === 'c') N.c = (s * N.s + A * N.a) / (s + A);
      else if (o === 's') N.s = N.c - (A / s) * (N.a - N.c);
      else N.a = N.c - (s / A) * (N.s - N.c);
      return { N: N, A: A, out: o, ip: ip, fx: fx, s: s };
    }
    function build() {
      var sp = speeds(), s = sp.s, A = sp.A, p = Pp.v(), n = np.v(), phi = rad(20);
      var gS = Gear.outline(s, 1, phi, 1, 1.25, 0);
      var plan = [];
      for (var j = 0; j < n; j++) {
        var g = 2 * Math.PI * j / n;
        plan.push({ g: g, ph: Gear.meshPhase(s, 0, g, p, false) });
      }
      var ring = Gear.internal(A, 1, phi, Gear.meshPhase(p, plan[0].ph, 0, A, true));
      geo = { s: s, A: A, p: p, n: n, gS: gS, gP: Gear.outline(p, 1, phi, 1, 1.25, 0), ring: ring, plan: plan, ok: ((s + A) % n) === 0 };
      ang = { s: 0, c: 0, a: 0 };
    }
    function draw() {
      if (!geo) return;
      ctx.clear();
      var G = geo, sp = speeds();
      var Ro = G.A / 2 + 3, sc = 185 / Ro, cx = 210, cy = 200;
      function W(p) { return [cx + p[0] * sc, cy - p[1] * sc]; }
      /* annulus with outer circle */
      ctx.save(); ctx.beginPath(); var o = W([0, 0]); ctx.arc(o[0], o[1], Ro * sc, 0, 2 * Math.PI);
      G.ring.pts.forEach(function (p, i) { var q = W(rot(p, ang.a)); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.closePath(); ctx.fillStyle = sp.fx === 'a' ? '#c9ced5' : '#dfe3e8'; ctx.fill('evenodd'); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
      var rc = (G.s + G.p) / 2;
      /* carrier */
      G.plan.forEach(function (pl) { var a = pl.g + ang.c; U.link(ctx, W([0, 0]), W([rc * Math.cos(a), rc * Math.sin(a)]), 'rgba(184,106,0,0.55)', 10); });
      G.plan.forEach(function (pl) {
        var a = pl.g + ang.c, pc = [rc * Math.cos(a), rc * Math.sin(a)];
        var spin = pl.ph + ang.c - (G.s / G.p) * (ang.s - ang.c);
        fillPoly(ctx, G.gP.pts.map(function (q) { var r2 = rot(q, spin); return [r2[0] + pc[0], r2[1] + pc[1]]; }), W, '#c3d4e8', C.ink2);
        U.dot(ctx, W(pc)[0], W(pc)[1], 4, C.amber, false);
      });
      fillPoly(ctx, G.gS.pts.map(function (q) { return rot(q, ang.s); }), W, sp.fx === 's' ? '#c9ced5' : '#f1d9a6', C.ink2);
      U.dot(ctx, cx, cy, 5, '#fff', C.ink);
      U.label(ctx, NAME[sp.fx] + ' held', 20, 24, { size: 13, color: C.red, roman: true });
      U.label(ctx, 'sun', cx - 10, cy + 4, { size: 11, color: C.ink2, roman: true });
      /* speed bars */
      var bx = 470, by = 60, Nmax = Math.max(Math.abs(sp.N.s), Math.abs(sp.N.a), Math.abs(sp.N.c), 1);
      ['s', 'c', 'a'].forEach(function (k, i) {
        var y = by + i * 70, w = 150 * sp.N[k] / Nmax;
        U.label(ctx, NAME[k] + (k === sp.ip ? ' (input)' : k === sp.out ? ' (output)' : ' (held)'), bx, y - 14, { size: 13, roman: true });
        ctx.fillStyle = k === 'c' ? C.amber : k === 's' ? '#d7a84a' : '#8a9099';
        ctx.fillRect(bx + 160, y - 6, w, 14);
        U.line(ctx, [[bx + 160, y - 12], [bx + 160, y + 14]], C.ink, 1);
        U.label(ctx, f(sp.N[k], 4) + ' rpm', bx + 160 + (w >= 0 ? w + 6 : 6), y + 1, { size: 12, color: C.ink2, roman: true });
      });
      U.label(ctx, 'speed (anticlockwise positive)', bx, by + 220, { size: 12, color: C.mute, roman: true });
      /* torques */
      var Ti = Tin.v(), To = -Ti * sp.N[sp.ip] / sp.N[sp.out], Tf = -(Ti + To);
      out({ TA: G.A, Nout: f(sp.N[sp.out], 4), ratio: f(sp.N[sp.ip] / sp.N[sp.out], 4), Tout: f(To, 4), Tfix: f(Tf, 4) });
      var x = { s: 1, c: 0, a: -G.s / G.A, p: -G.s / G.p };
      tbl.innerHTML = '<table><thead><tr><th>Step</th><th>Arm</th><th>Sun</th><th>Planet</th><th>Annulus</th></tr></thead><tbody>' +
        '<tr><td>Arm held, sun +x</td><td>0</td><td>+x</td><td>' + U.m('−(T_S/T_P)x') + ' = −' + f(G.s / G.p, 3) + 'x</td><td>' + U.m('−(T_S/T_A)x') + ' = −' + f(G.s / G.A, 3) + 'x</td></tr>' +
        '<tr><td>Add +y to all</td><td>y</td><td>y + x</td><td>y − ' + f(G.s / G.p, 3) + 'x</td><td>y − ' + f(G.s / G.A, 3) + 'x</td></tr>' +
        '<tr><td>Here (rpm)</td><td>' + f(sp.N.c, 4) + '</td><td>' + f(sp.N.s, 4) + '</td><td>' + f(sp.N.c - (G.s / G.p) * (sp.N.s - sp.N.c), 4) + '</td><td>' + f(sp.N.a, 4) + '</td></tr></tbody></table>';
      if (!G.ok) msg(G.n + ' planets cannot be spaced equally: (T_S + T_A)/n = ' + f((G.s + G.A) / G.n, 4) + ' is not a whole number. On the bench the last planet will not go in; the drawing shows it forced into place.', 'bad');
      else msg('Power balance: input ' + f(Ti * sp.N[sp.ip] * 2 * Math.PI / 60 / 1000, 3) + ' kW goes out unchanged (no friction). The casing or a brake band must hold ' + f(Math.abs(Tf), 4) + ' N m on the ' + NAME[sp.fx] + '.', 'ok');
    }
    build(); draw(); U.onRedraw(draw);
    U.loop(host, function (dt) {
      var sp = speeds(), k = dt * 2 * Math.PI * 0.25 / Math.max(Math.abs(sp.N[sp.ip]), 1);
      ang.s += sp.N.s * k; ang.c += sp.N.c * k; ang.a += sp.N.a * k; draw();
    });
  })();

  U.calcs.contact = function (v) {
    var phi = rad(v.phi), c = contact(v.t, v.T, phi, v.a), m = v.m;
    var r = v.t * m / 2, w1 = v.v / (r / 1000), w2 = w1 * v.t / v.T, arc = c.path * m / Math.cos(phi);
    var pm = Math.max(c.KP, c.PL) * m;
    return { r: f(r, 4), R: f(v.T * m / 2, 4), KP: f(c.KP * m, 4), PL: f(c.PL * m, 4), path: f(c.path * m, 4), arc: f(arc, 4), cr: f(c.cr, 3), aa: f(deg(arc / r), 3), w1: f(w1, 4), w2: f(w2, 4), pm: f(pm, 4), vs: f((w1 + w2) * pm / 1000, 3) };
  };
  U.initLive();
})();
