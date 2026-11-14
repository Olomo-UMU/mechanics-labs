/* Chapter 7: Porter governor with bevel drive and throttle lever (axis along y) */
(function () {
  'use strict';
  M3D.builders.governor = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, T = M3D.tex;
    var L = 0.2, rMin = 0.12, rMax = 0.16, Y0 = 0.62;
    var root = new THREE.Group();
    var brass = Mt.metal(0xc9a24f, 0.28), steel = Mt.metal(0xc9ccd1, 0.25), dark = Mt.metal(0x7d838b, 0.4);
    var iron = Mt.cast('#5b6168', 0.75), green = Mt.paint(0x24483a, 0.5), red = Mt.paint(0x8f1d1d, 0.45);
    var up = new THREE.Vector3(0, 1, 0);
    function rodBetween(mesh, a, b) {
      var d = new THREE.Vector3().subVectors(b, a), len = d.length();
      mesh.position.copy(a).addScaledVector(d, 0.5);
      mesh.quaternion.setFromUnitVectors(up, d.normalize());
      mesh.scale.set(1, len, 1);
    }
    function unitRod(rad, mat) { return G.mesh(new THREE.CylinderGeometry(rad, rad, 1, 20), mat); }

    /* 1 base frame with bevel drive */
    var base = new THREE.Group();
    var plinth = G.mesh(G.roundedBox(0.34, 0.06, 0.26, 0.02, 0.006), iron); plinth.position.y = 0.03; base.add(plinth);
    var house = G.mesh(G.lathe([[0, 0.06], [0.075, 0.06], [0.07, 0.16], [0.045, 0.2], [0.03, 0.22], [0, 0.22]], 48), iron); base.add(house);
    var bossH = G.mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.09, 32), iron); bossH.rotation.z = Math.PI / 2; bossH.position.set(0.09, 0.12, 0); base.add(bossH);
    var inShaft = G.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 24), steel); inShaft.rotation.z = Math.PI / 2; inShaft.position.set(0.17, 0.12, 0); base.add(inShaft);
    var pulley = new THREE.Group();
    var pg = G.mesh(G.lathe([[0.012, -0.022], [0.06, -0.022], [0.06, -0.016], [0.052, 0], [0.06, 0.016], [0.06, 0.022], [0.012, 0.022]], 64), dark);
    pulley.add(pg);
    for (var sp = 0; sp < 5; sp++) { var spk = G.mesh(G.roundedBox(0.008, 0.042, 0.008, 0.002, 0.001), dark); spk.position.y = 0.032; var hold = new THREE.Group(); hold.add(spk); hold.rotation.y = 0; hold.rotation.x = sp / 5 * Math.PI * 2; pulley.add(hold); }
    pulley.rotation.z = Math.PI / 2; pulley.position.set(0.25, 0.12, 0); base.add(pulley);
    var plate = G.decal(0.08, 0.035, T.label(320, 140, '#d8d3c2', [['PORTER', 44, 700], ['governor', 32]], '#333')); plate.position.set(0, 0.03, 0.1305); base.add(plate);
    root.add(base);

    /* 2 spindle with top cap and stops (rotates) */
    var spindle = new THREE.Group();
    spindle.add((function () { var m = G.mesh(new THREE.CylinderGeometry(0.011, 0.011, Y0 - 0.15 + 0.04, 24), steel); m.position.y = (Y0 + 0.04 + 0.15) / 2; return m; })());
    var cap = G.mesh(G.lathe([[0, -0.02], [0.03, -0.02], [0.03, 0.01], [0.018, 0.03], [0, 0.03]], 40), brass); cap.position.y = Y0; spindle.add(cap);
    var yoke = G.mesh(G.roundedBox(0.075, 0.022, 0.022, 0.006, 0.002), brass); yoke.position.y = Y0; spindle.add(yoke);
    var stopLow = G.mesh(G.ring(0.026, 0.011, 0.012, 40), dark); stopLow.position.y = Y0 - 2 * Math.sqrt(L * L - rMin * rMin) + 0.02 - 0.085; spindle.add(stopLow);
    var bevel = G.mesh(G.lathe([[0.011, 0], [0.055, 0], [0.03, 0.03], [0.011, 0.03]], 40), brass); bevel.position.y = 0.17; spindle.add(bevel);
    for (var tth = 0; tth < 24; tth++) { var tooth = G.mesh(new THREE.BoxGeometry(0.004, 0.026, 0.02), brass); var a0 = tth / 24 * Math.PI * 2; tooth.position.set(0.04 * Math.cos(a0), 0.183, 0.04 * Math.sin(a0)); tooth.rotation.y = -a0; tooth.rotation.z = 0.7; spindle.add(tooth); }
    root.add(spindle);

    /* 3 upper arms, 4 balls, 5 lower arms, 6 sleeve with central load (all rotate) */
    var upper = new THREE.Group(), balls = new THREE.Group(), lower = new THREE.Group(), sleeve = new THREE.Group();
    var uArm = [unitRod(0.006, steel), unitRod(0.006, steel)], lArm = [unitRod(0.0055, steel), unitRod(0.0055, steel)];
    uArm.forEach(function (m) { upper.add(m); }); lArm.forEach(function (m) { lower.add(m); });
    var ballM = [0, 1].map(function () { var b = G.mesh(new THREE.SphereGeometry(0.032, 48, 32), brass); balls.add(b); return b; });
    var load = G.mesh(G.lathe([[0.012, -0.05], [0.05, -0.05], [0.058, -0.035], [0.058, 0.02], [0.03, 0.04], [0.012, 0.04]], 64), Mt.cast('#4a4f56', 0.6));
    sleeve.add(load);
    var lug = G.mesh(G.roundedBox(0.07, 0.016, 0.02, 0.005, 0.002), brass); lug.position.y = 0.04; sleeve.add(lug);
    var collar = G.mesh(G.lathe([[0.012, -0.075], [0.038, -0.075], [0.038, -0.07], [0.028, -0.07], [0.028, -0.06], [0.038, -0.06], [0.038, -0.052], [0.012, -0.052]], 48), steel); sleeve.add(collar);
    var mLab = G.decal(0.05, 0.02, T.label(240, 96, '#3d4248', [['M', 64, 700, '#e8e4d8']])); mLab.position.set(0, -0.01, 0.0585); sleeve.add(mLab);
    root.add(upper); root.add(balls); root.add(lower); root.add(sleeve);

    /* 7 throttle lever and rod (does not rotate) */
    var lever = new THREE.Group();
    var bracket = G.mesh(G.roundedBox(0.03, 0.4, 0.03, 0.006, 0.002), green); bracket.position.set(-0.17, 0.26, 0); lever.add(bracket);
    var bar = unitRod(0.006, red), fork = G.mesh(G.ring(0.045, 0.039, 0.008, 40, 0), red), rod = unitRod(0.004, steel);
    lever.add(bar); lever.add(fork); lever.add(rod);
    var valve = new THREE.Group();
    var vb = G.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 32), iron); vb.rotation.x = Math.PI / 2; valve.add(vb);
    var vp = G.mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 24), dark); vp.rotation.z = Math.PI / 2; vp.position.x = -0.06; valve.add(vp);
    var flap = G.mesh(new THREE.BoxGeometry(0.002, 0.05, 0.04), brass); valve.add(flap);
    valve.position.set(-0.3, 0.08, 0); lever.add(valve);
    var vLab = G.decal(0.05, 0.02, T.label(240, 96, '#d8d3c2', [['FUEL', 54, 700]], '#333')); vLab.position.set(-0.3, 0.08, 0.026); lever.add(vLab);
    var pyFix = Y0 - 2 * Math.sqrt(L * L - (rMin + rMax) * (rMin + rMax) / 4) - 0.045;
    var pin = G.mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.05, 20), steel); pin.rotation.x = Math.PI / 2; pin.position.set(-0.17, pyFix, 0); lever.add(pin);
    root.add(lever);

    var GV = { auto: true, N: 210, r: 0.14, spin: 0, t: 0, m: 4, M: 24 };
    function rEq(N) { var w = N * Math.PI / 30, h = 9.81 / (w * w) * (GV.m + GV.M) / GV.m; return h >= L ? 0 : Math.sqrt(L * L - h * h); }
    function tick(t, ex, dt) {
      dt = dt || 0; GV.t += dt;
      if (GV.auto) GV.N = 213 + 25 * Math.sin(GV.t * 0.5);
      var rt = U.clamp(rEq(GV.N), rMin, rMax);
      GV.r += (rt - GV.r) * Math.min(1, dt * 2.5); if (!dt) GV.r = rt;
      var r = GV.r, s = (r - rMin) / (rMax - rMin);
      GV.spin += dt * GV.N * Math.PI / 30 * 0.12;
      var h = Math.sqrt(L * L - r * r), spin = GV.spin;
      [spindle, upper, balls, lower, sleeve].forEach(function (o) { o.rotation.y = spin; });
      var top = new THREE.Vector3(0, Y0, 0), sl = new THREE.Vector3(0, Y0 - 2 * h + 0.02, 0);
      [1, -1].forEach(function (k, i) {
        var B = new THREE.Vector3(k * r, Y0 - h, 0);
        rodBetween(uArm[i], new THREE.Vector3(k * 0.022, Y0, 0), B);
        rodBetween(lArm[i], B, new THREE.Vector3(k * 0.03, sl.y + 0.02, 0));
        ballM[i].position.copy(B);
      });
      sleeve.position.y = 0; load.position.y = sl.y; lug.position.y = sl.y + 0.04; collar.position.y = sl.y; mLab.position.y = sl.y - 0.01;
      /* lever: pivot on the bracket, fork in the collar groove, rod down to the valve */
      var P = new THREE.Vector3(-0.17, pyFix, 0.0), Fk = new THREE.Vector3(0, sl.y - 0.065, 0);
      var tail = new THREE.Vector3().subVectors(P, Fk).setLength(0.06).add(P);
      rodBetween(bar, Fk.clone().add(new THREE.Vector3(-0.04, 0, 0)), tail);
      fork.position.copy(Fk);
      rodBetween(rod, tail, new THREE.Vector3(-0.3 + 0.0, 0.11, 0));
      flap.rotation.z = 0.25 + 1.2 * (1 - s);
      pulley.rotation.x = -spin * 1.6;
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Spindle, cap and bevel drive', obj: spindle, off: [0, 0.18, 0], at: [0, 0.62, 0.03], photo: 'Category:Centrifugal governors', desc: 'Driven from the engine through the belt pulley and a pair of bevel gears, so the spindle speed is a fixed multiple of engine speed. The upper arms hang from the cap.' },
      { name: 'Upper arms (two)', obj: upper, off: [0, 0.1, -0.12], at: [0.08, 0.55, 0], photo: 'Category:Centrifugal governors', desc: 'Here 200 mm long and pivoted (nearly) on the axis, so q = 1 and the height is h = (g/ω²)(m + M)/m.' },
      { name: 'Governor balls (two)', obj: balls, off: [0, 0, 0.2], at: [0.15, 0.48, 0], photo: 'Category:Centrifugal governors', desc: 'Mass m each. As the speed rises they fly out from r = 120 mm towards the 160 mm stop, lifting the sleeve.' },
      { name: 'Lower arms (two)', obj: lower, off: [0, -0.04, -0.2], at: [0.08, 0.38, 0], photo: 'Category:Centrifugal governors', desc: 'Link the balls to the sleeve. With equal arms the sleeve moves twice as far as the ball height changes.' },
      { name: 'Sleeve with central load', obj: sleeve, off: [0.22, 0, 0], at: [0.05, 0.32, 0.03], photo: 'Category:Centrifugal governors', desc: 'The dead weight M (24 kg in Example 7.2) multiplies the speed for a given height by √((m + M)/m), so the governor works at real engine speeds. The grooved collar takes the lever fork.' },
      { name: 'Throttle lever and fuel valve', obj: lever, off: [-0.15, 0, 0], at: [-0.17, 0.26, 0.016], photo: 'Category:Centrifugal governors', desc: 'As the sleeve rises the lever closes the butterfly valve in the fuel (or steam) pipe. Friction here and at the sleeve is the f that gives the dead band.' },
      { name: 'Base and drive housing', obj: base, off: [0, -0.1, 0], at: [0.1, 0.12, 0.04], photo: 'Category:Centrifugal governors', desc: 'Cast-iron housing for the bevel gears and the horizontal input shaft driven by belt from the engine crankshaft.' }
    ];
    return { group: root, parts: parts, cam: [0.55, 0.55, 0.95], target: [0, 0.34, 0], tick: tick, fit: 0.9, labTitle: 'Governor lab',
      controls: [{ label: 'Engine speed', unit: 'rpm', min: 170, max: 260, step: 1, value: 210, fmt: function (v) { return v.toFixed(0); }, set: function (v) { if (GV.init) GV.auto = false; GV.init = true; GV.N = v; } }],
      buttons: [{ label: 'Load changes (auto)', fn: function () { GV.auto = true; } }],
      hud: function () {
        var r = GV.r, h = Math.sqrt(L * L - r * r), lift = 2 * (Math.sqrt(L * L - rMin * rMin) - h);
        var stop = rEq(GV.N) <= rMin + 1e-4 ? ' (on the lower stop)' : rEq(GV.N) >= rMax - 1e-4 ? ' (on the upper stop)' : '';
        return '<b>Spindle ' + GV.N.toFixed(0) + ' rpm</b>, m = 4 kg, M = 24 kg<br>Height h = ' + (h * 1000).toFixed(0) + ' mm, ball radius ' + (r * 1000).toFixed(0) + ' mm' + stop + '<br>Sleeve lift ' + (lift * 1000).toFixed(0) + ' mm, fuel valve ' + ((1 - (r - rMin) / (rMax - rMin)) * 100).toFixed(0) + '% open<br>Range 197.8 to 228.4 rpm between the stops';
      } };
  };
})();

/* Hartnell governor and motorised gyroscope apparatus */
(function () {
  'use strict';
  var D2R = Math.PI / 180;
  function baseDrive(THREE, G, Mt, K, T, label) {
    var base = new THREE.Group(), iron = Mt.cast('#5b6168', 0.75), steel = Mt.metal(0xc9ccd1, 0.25), dark = Mt.metal(0x7d838b, 0.4);
    var plinth = G.mesh(G.roundedBox(0.34, 0.05, 0.26, 0.02, 0.006), iron); plinth.position.y = 0.025; base.add(plinth);
    var house = G.mesh(G.lathe([[0, 0.05], [0.075, 0.05], [0.07, 0.15], [0.045, 0.19], [0.03, 0.21], [0, 0.21]], 48), iron); base.add(house);
    var boss = G.mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.09, 32), iron); boss.rotation.z = Math.PI / 2; boss.position.set(0.09, 0.11, 0); base.add(boss);
    var ins = G.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 24), steel); ins.rotation.z = Math.PI / 2; ins.position.set(0.17, 0.11, 0); base.add(ins);
    var pul = G.mesh(G.lathe([[0.012, -0.02], [0.055, -0.02], [0.055, -0.014], [0.047, 0], [0.055, 0.014], [0.055, 0.02], [0.012, 0.02]], 64), dark); pul.rotation.z = Math.PI / 2; pul.position.set(0.24, 0.11, 0); base.add(pul);
    var plate = G.decal(0.09, 0.035, T.label(360, 140, '#d8d3c2', [[label, 40, 700], ['governor', 30]], '#333')); plate.position.set(0, 0.026, 0.1305); base.add(plate);
    base.userData.pul = pul;
    return base;
  }

  M3D.builders.hartnell = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var root = new THREE.Group();
    var brass = Mt.metal(0xc9a24f, 0.28), steel = Mt.metal(0xc9ccd1, 0.25), bright = Mt.metal(0xdadde1, 0.16), red = Mt.paint(0x8f1d1d, 0.45), dark = Mt.metal(0x7d838b, 0.4), springM = Mt.metal(0x2b2e33, 0.32);
    var a = 0.1, b = 0.06, rp = 0.115, Yp = 0.4, Yc = 0.64, r1 = 0.1, r2 = 0.13, m = 2, s = 15840;
    var H = { N: 300, x0: 0.0415, auto: true, t: 0, r: r1, spin: 0, init: false };
    var base = baseDrive(THREE, G, Mt, K, T, 'HARTNELL'); root.add(base);
    var spindle = new THREE.Group();
    var sp = G.mesh(new THREE.CylinderGeometry(0.011, 0.011, Yc + 0.04 - 0.15, 24), steel); sp.position.y = (Yc + 0.04 + 0.15) / 2; spindle.add(sp);
    var bev = G.mesh(G.lathe([[0.011, 0], [0.05, 0], [0.028, 0.028], [0.011, 0.028]], 40), brass); bev.position.y = 0.165; spindle.add(bev);
    root.add(spindle);
    /* frame: crossbar with pivot forks, two posts, top cap with adjusting nut */
    var frame = new THREE.Group();
    var cross = G.mesh(G.roundedBox(2 * rp + 0.05, 0.022, 0.03, 0.005, 0.002), red); cross.position.y = Yp - 0.018; frame.add(cross);
    [-1, 1].forEach(function (k) {
      [-1, 1].forEach(function (q) { var f = G.mesh(G.roundedBox(0.022, 0.03, 0.006, 0.003, 0.001), red); f.position.set(k * rp, Yp - 0.004, q * 0.012); frame.add(f); });
      var post = G.mesh(G.roundedBox(0.016, Yc - Yp + 0.02, 0.016, 0.003, 0.001), red); post.position.set(0, (Yc + Yp) / 2 - 0.005, k * 0.085); frame.add(post);
      var ft = G.mesh(G.roundedBox(0.03, 0.02, 0.03, 0.004, 0.002), red); ft.position.set(0, Yp - 0.018, k * 0.075); frame.add(ft);
    });
    var cap = G.mesh(G.roundedBox(0.05, 0.02, 0.2, 0.005, 0.002), red); cap.position.y = Yc + 0.01; frame.add(cap);
    var nut = G.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.016, 6), Mt.knurl(0xb9bec4)); frame.add(nut);
    var lock = K.nut(0.02, Mt.metal(0x9aa0a8, 0.35)); frame.add(lock);
    var hub = G.mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 24), red); hub.position.y = Yp - 0.018; frame.add(hub);
    root.add(frame);
    /* bell-crank levers with balls and rollers */
    var levers = new THREE.Group(), L = [];
    [1, -1].forEach(function (k) {
      var g = new THREE.Group();
      var up = G.mesh(G.roundedBox(0.014, a, 0.012, 0.004, 0.0015), steel); up.position.y = a / 2; g.add(up);
      var side = G.mesh(G.roundedBox(b, 0.014, 0.012, 0.004, 0.0015), steel); side.position.x = -k * b / 2; g.add(side);
      var pv = G.mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.03, 20), bright); pv.rotation.x = Math.PI / 2; g.add(pv);
      var roll = G.mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.016, 20), bright); roll.rotation.x = Math.PI / 2; roll.position.x = -k * b; g.add(roll);
      levers.add(g); L.push({ g: g, k: k });
    });
    root.add(levers);
    var balls = new THREE.Group(), B = [];
    [1, -1].forEach(function (k) { var bm = G.mesh(new THREE.SphereGeometry(0.03, 48, 32), brass); balls.add(bm); B.push({ m: bm, k: k }); });
    root.add(balls);
    var sleeve = new THREE.Group();
    var slv = G.mesh(G.lathe([[0.012, 0], [0.068, 0], [0.068, 0.008], [0.026, 0.012], [0.024, 0.06], [0.012, 0.06]], 64), Mt.metal(0xb0b6bc, 0.3)); sleeve.add(slv);
    var groove = G.mesh(G.ring(0.03, 0.024, 0.008, 40), dark); groove.position.y = 0.035; sleeve.add(groove);
    root.add(sleeve);
    var spring = K.coil(0.03, 0.0045, 9, 1, springM); var springG = new THREE.Group(); springG.add(spring); root.add(springG);
    /* fork lever to the fuel rack */
    var link = new THREE.Group();
    var fork = G.mesh(G.ring(0.042, 0.036, 0.008, 40), red); link.add(fork);
    var bar = K.unitRod(0.005, red); link.add(bar);
    var bracket = G.mesh(G.roundedBox(0.025, Yp + 0.05, 0.025, 0.004, 0.002), Mt.paint(0x24483a, 0.5)); bracket.position.set(-0.2, (Yp + 0.05) / 2, 0); link.add(bracket);
    root.add(link);
    function rAt(N) {
      var w = N * Math.PI / 30, k2 = s * b * b / (2 * a * a), beta = s * b / (2 * a) * (H.x0 - r1 * b / a), den = m * w * w - k2;
      if (Math.abs(beta) < 0.5) return den > 0 ? r2 : den < 0 ? r1 : H.r;
      if (beta > 0) return m * w * w * r1 > k2 * r1 + beta ? r2 : r1;
      if (den >= 0) return r2;
      return U.clamp(beta / den, r1, r2);
    }
    function Nat(r) { var F = s * b / (2 * a) * (H.x0 + (r - r1) * b / a); return Math.sqrt(Math.max(0, F / (m * r))) * 30 / Math.PI; }
    function tick(t, ex, dt) {
      dt = dt || 0; H.t += dt;
      if (H.auto) H.N = 307 + 14 * Math.sin(H.t * 0.45);
      var rt = rAt(H.N); H.r += (rt - H.r) * Math.min(1, dt * 3); if (!dt) H.r = rt;
      var r = H.r, psi = Math.asin((r - rp) / a), spin = (H.spin += dt * H.N * Math.PI / 30 * 0.12);
      [spindle, frame, levers, balls, sleeve, springG].forEach(function (o) { o.rotation.y = spin; });
      L.forEach(function (l) { l.g.position.set(l.k * rp, Yp, 0); l.g.rotation.z = -l.k * psi; });
      B.forEach(function (q) { q.m.position.set(q.k * (rp + a * Math.sin(psi)), Yp + a * Math.cos(psi), 0); });
      var tipY = Yp + b * Math.sin(psi), ys = tipY + 0.0065;
      sleeve.position.y += ys;
      var nutY = Yc + 0.028; nut.position.y = nutY; lock.position.y = nutY + 0.012;
      spring.scale.y = (Yc - 0.002) - (ys + 0.06); springG.position.y += ys + 0.06;
      var Fk = K.V(0, ys + 0.035, 0); fork.position.copy(Fk); fork.rotation.x = 0;
      K.orient(bar, K.V(-0.04, ys + 0.035, 0), K.V(-0.2, Yp + 0.05 + (ys - Yp) * 0.6, 0));
      base.userData.pul.rotation.x = -spin * 1.6;
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Balls (2 kg each)', obj: balls, off: [0, 0.12, 0.15], at: [0.14, 0.5, 0.02], photo: 'Category:Centrifugal governors', desc: 'Mounted on the vertical arms of the bell cranks (length a = 100 mm). As speed rises they swing out from r = 100 mm to 130 mm.' },
      { name: 'Bell-crank levers', obj: levers, off: [0, 0.06, -0.15], at: [0.1, 0.42, 0.01], photo: 'Category:Centrifugal governors', desc: 'Pivoted on the frame. The horizontal arms (b = 60 mm) carry rollers that lift the sleeve: lift = (r₂ − r₁) b/a = 18 mm.' },
      { name: 'Sleeve', obj: sleeve, off: [0, 0.0, 0.2], at: [0.06, 0.005, 0.0], photo: 'Category:Centrifugal governors', desc: 'Slides on the spindle; its groove takes the fork of the fuel lever.' },
      { name: 'Spring (15.8 N/mm)', obj: springG, off: [0, 0.1, 0.25], at: [0.03, 0.08, 0], photo: 'Category:Coil springs', desc: 'Pushes the sleeve down: Mg + S = 2 m ω² r (a/b). Turn the adjusting nut (lab slider) to change the initial compression and watch the speed range move. At 60 mm compression the governor becomes isochronous; beyond that, unstable.' },
      { name: 'Frame and adjusting nut', obj: frame, off: [0, 0.2, 0], at: [0, 0.65, 0.09], photo: 'Category:Centrifugal governors', desc: 'Turns with the spindle and carries the lever pivots and the spring seat.' },
      { name: 'Spindle, drive and fuel lever', obj: base, off: [0, -0.1, 0], at: [0.1, 0.11, 0.04], photo: 'Category:Centrifugal governors', desc: 'Belt-driven from the engine through bevel gears.' }
    ];
    return {
      group: root, parts: parts, cam: [0.55, 0.6, 0.9], target: [0, 0.4, 0], tick: tick, fit: 0.88, labTitle: 'Governor lab',
      controls: [
        { label: 'Engine speed', unit: 'rpm', min: 270, max: 340, step: 1, value: 300, fmt: function (v) { return v.toFixed(0); }, set: function (v) { if (H.init) H.auto = false; H.init = true; H.N = v; } },
        { label: 'Spring initial compression', unit: 'mm', min: 30, max: 70, step: 0.5, value: 41.5, fmt: function (v) { return v.toFixed(1); }, set: function (v) { H.x0 = v / 1000; } }
      ],
      buttons: [{ label: 'Load changes (auto)', fn: function () { H.auto = true; } }],
      hud: function () {
        var beta = s * b / (2 * a) * (H.x0 - r1 * b / a), S = s * (H.x0 + (H.r - r1) * b / a);
        var kind = Math.abs(beta) < 3 ? 'isochronous' : beta < 0 ? 'stable' : 'unstable';
        return '<b>' + H.N.toFixed(0) + ' rpm, r = ' + (H.r * 1000).toFixed(0) + ' mm</b>, lift ' + ((H.r - r1) * b / a * 1000).toFixed(1) + ' mm<br>Spring force ' + S.toFixed(0) + ' N; working range ' + Nat(r1).toFixed(0) + ' to ' + Nat(r2).toFixed(0) + ' rpm<br>Controlling force intercept β = ' + beta.toFixed(0) + ' N: <b>' + kind + '</b>';
      }
    };
  };

  /* ================= motorised gyroscope apparatus ================= */
  M3D.builders.gyro = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var root = new THREE.Group();
    var iron = Mt.castPaint(0x2f3b48, 0.5), steel = Mt.metal(0xc9ccd1, 0.25), bright = Mt.metal(0xdadde1, 0.16), brass = Mt.metal(0xc9a24f, 0.28), dark = Mt.metal(0x7d838b, 0.4), red = Mt.paint(0xa8141c, 0.35);
    var Yt = 0.42, l = 0.22, mR = 3.2, rR = 0.11, I = 0.5 * mR * rR * rR;
    var S = { rpm: 1500, W: 0.5, dir: 1, psi: 0, tilt: 0, th: 0, wp: 0, t0: 0, lastRev: 0, revT: 0 };
    /* base with a graduated ring */
    var base = new THREE.Group();
    var bd = G.mesh(G.lathe([[0, 0], [0.22, 0], [0.23, 0.01], [0.23, 0.04], [0.21, 0.05], [0, 0.05]], 96), iron); base.add(bd);
    var pc = document.createElement('canvas'); pc.width = pc.height = 1024; var px = pc.getContext('2d'); px.translate(512, 512);
    px.fillStyle = '#eef0f2'; px.beginPath(); px.arc(0, 0, 505, 0, 7); px.fill(); px.fillStyle = '#2f3b48'; px.beginPath(); px.arc(0, 0, 330, 0, 7); px.fill();
    px.strokeStyle = '#1b1d21';
    for (var dg = 0; dg < 360; dg += 2) { var bg = dg % 10 === 0; px.lineWidth = bg ? 3 : 1.5; px.beginPath(); px.moveTo(500 * Math.cos(dg * D2R), 500 * Math.sin(dg * D2R)); px.lineTo((bg ? 445 : 470) * Math.cos(dg * D2R), (bg ? 445 : 470) * Math.sin(dg * D2R)); px.stroke(); if (dg % 30 === 0) { px.save(); px.rotate(dg * D2R + Math.PI / 2); px.fillStyle = '#1b1d21'; px.font = '500 34px Roboto'; px.textAlign = 'center'; px.fillText(dg + '', 0, -395); px.restore(); } }
    var ring = new THREE.Mesh(new THREE.CircleGeometry(0.2, 128), new THREE.MeshStandardMaterial({ map: T.canvasTex(pc, true), roughness: 0.5 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.0505; ring.receiveShadow = true; base.add(ring);
    var col = G.mesh(G.lathe([[0, 0.05], [0.05, 0.05], [0.045, 0.07], [0.03, 0.09], [0.03, 0.27], [0.04, 0.28], [0.04, 0.3], [0, 0.3]], 48), iron); base.add(col);
    var plate = G.decal(0.1, 0.03, T.label(400, 120, '#d8d3c2', [['GYROSCOPE', 44, 700], ['I = 0.0194 kg m²', 30]], '#333')); plate.position.set(0, 0.03, 0.2305); base.add(plate);
    root.add(base);
    /* yoke turning about the vertical axis */
    var yoke = new THREE.Group();
    var tt = G.mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 48), iron); tt.position.y = 0.31; yoke.add(tt);
    var ptr = G.mesh(new THREE.ConeGeometry(0.008, 0.2, 12), red); ptr.rotation.z = -Math.PI / 2; ptr.position.set(0.1, 0.055, 0); yoke.add(ptr);
    var ptrRod = G.mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.27, 12), dark); ptrRod.position.set(0.05, 0.18, 0); ptrRod.rotation.z = 0.0; yoke.add(ptrRod);
    var arm0 = G.mesh(G.roundedBox(0.03, 0.03, 0.3, 0.005, 0.002), iron); arm0.position.y = 0.33; yoke.add(arm0);
    [-1, 1].forEach(function (k) {
      var up = G.mesh(G.roundedBox(0.03, Yt - 0.32 + 0.03, 0.02, 0.005, 0.002), iron); up.position.set(0, (Yt + 0.32) / 2, k * 0.14); yoke.add(up);
      var brg = G.mesh(G.ring(0.022, 0.008, 0.024, 32), brass); brg.rotation.x = Math.PI / 2; brg.position.set(0, Yt, k * 0.14); yoke.add(brg);
    });
    root.add(yoke);
    /* rotor assembly: frame, rotor disc, motor, arm with counterweight; tilts about the trunnion (local z) */
    var rotA = new THREE.Group();
    var rf = new THREE.Group();
    [-1, 1].forEach(function (k) { var sbar = G.mesh(G.roundedBox(0.3, 0.025, 0.012, 0.004, 0.0015), steel); sbar.position.set(0, 0, k * 0.11); rf.add(sbar); var tp = G.mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.04, 16), bright); tp.rotation.x = Math.PI / 2; tp.position.z = k * 0.125; rf.add(tp); });
    [-1, 1].forEach(function (k) { var e = G.mesh(G.roundedBox(0.012, 0.03, 0.23, 0.003, 0.0015), steel); e.position.set(k * 0.06, 0, 0); rf.add(e); });
    rotA.add(rf);
    var rotor = new THREE.Group();
    var disc = G.mesh(G.lathe([[0.008, -0.012], [rR - 0.004, -0.012], [rR, -0.008], [rR, 0.008], [rR - 0.004, 0.012], [0.008, 0.012]], 96), Mt.metal(0xd4d7db, 0.18)); disc.rotation.z = Math.PI / 2; rotor.add(disc);
    for (var mk = 0; mk < 2; mk++) { var spot = G.mesh(new THREE.BoxGeometry(0.0125, 0.02, 0.02), red); spot.position.set(0, (mk ? -1 : 1) * (rR - 0.02), 0); rotor.add(spot); }
    var ax = G.mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.13, 16), bright); ax.rotation.z = Math.PI / 2; rotor.add(ax);
    rotA.add(rotor);
    /* the disc is larger than the frame width, so the frame sides sit outside it */
    rf.children.forEach(function (c) { if (Math.abs(c.position.z) > 0.05) c.position.z *= 1.15; });
    var mot = K.motor(0.04, 0.09, 0x2f3b48, 'GYRO'); mot.rotation.y = Math.PI / 2; mot.position.set(-0.13, 0, 0); rotA.add(mot);
    var armX = G.mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 16), bright); armX.rotation.z = Math.PI / 2; armX.position.x = 0.0; rotA.add(armX);
    var cw = G.mesh(G.lathe([[0.006, -0.02], [0.035, -0.02], [0.035, 0.02], [0.006, 0.02]], 40), Mt.cast('#3d4248', 0.6)); cw.rotation.z = Math.PI / 2; cw.position.x = -0.22; rotA.add(cw);
    var hook = G.mesh(new THREE.TorusGeometry(0.007, 0.0018, 8, 20), dark); hook.position.x = l; rotA.add(hook);
    rotA.position.y = Yt; root.add(rotA);
    /* weight pan hanging from the arm end */
    var pan = new THREE.Group();
    var hr = G.mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.1, 8), dark); hr.position.y = -0.05; pan.add(hr);
    var pd = G.mesh(G.lathe([[0, 0], [0.035, 0], [0.038, 0.006], [0.036, 0.006], [0, 0.003]], 40), dark); pd.position.y = -0.1; pan.add(pd);
    var wts = [];
    for (var w = 0; w < 6; w++) { var wd = G.mesh(G.lathe([[0.004, 0], [0.03, 0], [0.03, 0.008], [0.004, 0.008]], 40), Mt.cast('#7a5c2e', 0.5)); wd.position.y = -0.097 + w * 0.0085; pan.add(wd); wts.push(wd); }
    root.add(pan);
    var g = 9.81;
    function tick(t, ex, dt) {
      dt = dt || 0;
      var w = S.dir * S.rpm * Math.PI / 30, C = S.W * g * l, wpT = Math.abs(w) > 1 ? C / (I * w) : 0;
      var falls = Math.abs(w) < 1 || Math.abs(wpT) > 3;
      var tiltT = falls && C > 0 ? -0.26 : 0;
      S.tilt += (tiltT - S.tilt) * Math.min(1, dt * 2);
      var wpNow = falls ? 0 : wpT;
      S.wp += (wpNow - S.wp) * Math.min(1, dt * 3);
      S.psi += S.wp * dt;
      if (Math.floor(Math.abs(S.psi) / (2 * Math.PI)) !== S.lastRev) { var now = (S.tt || 0); if (S.lastRev !== null && S.revStart != null) S.revT = now - S.revStart; S.revStart = now; S.lastRev = Math.floor(Math.abs(S.psi) / (2 * Math.PI)); }
      S.tt = (S.tt || 0) + dt;
      S.th += w * dt * 0.02;
      yoke.rotation.y = S.psi;
      rotA.rotation.set(0, S.psi, S.tilt);
      rotor.rotation.x = S.th; mot.userData.shaft.rotation.z = S.th;
      var end = K.V(l, 0, 0).applyEuler(new THREE.Euler(0, S.psi, S.tilt)).add(K.V(0, Yt, 0));
      pan.position.copy(end); pan.rotation.y = S.psi;
      var nW = Math.round(S.W / 0.25); wts.forEach(function (wd, i) { wd.visible = i < nW; });
      S.wpT = wpT; S.C = C; S.falls = falls;
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Rotor disc', obj: rotor, off: [0, 0.18, 0], at: [0, 0.1, 0.0], photo: 'Category:Gyroscopes', desc: 'Steel disc, 3.2 kg, radius 110 mm: I = ½ m r² = 0.0194 kg m². The red marks show it spinning (slowed down here).' },
      { name: 'Rotor frame, motor and arm', obj: rotA, off: [0, 0.3, -0.2], at: [-0.13, 0.04, 0.0], photo: 'Category:Gyroscopes', desc: 'Free to tilt on the trunnion pins. With no added weight the counterweight balances it, so nothing happens. Hang weights on the pan: the couple W l should tip the arm down, but instead the whole assembly turns about the vertical axis at ω_p = W l / (I ω).' },
      { name: 'Weight pan', obj: pan, off: [0.12, -0.05, 0.1], at: [0, -0.1, 0.03], photo: 'Category:Gyroscopes', desc: 'Each disc is 0.25 kg. Weight acts 220 mm from the trunnion axis. Double the weight and the precession doubles; double the rotor speed and it halves.' },
      { name: 'Yoke (precesses)', obj: yoke, off: [0, 0.05, 0.25], at: [0, 0.38, 0.14], photo: 'Category:Gyroscopes', desc: 'Turns on the column bearing. Its pointer moves over the graduated base: time one revolution with a stopwatch to measure ω_p.' },
      { name: 'Base and column', obj: base, off: [0, -0.12, 0], at: [0.18, 0.05, 0.05], photo: 'Category:Gyroscopes', desc: 'Heavy cast base with a 0 to 360° scale.' }
    ];
    return {
      group: root, parts: parts, cam: [0.75, 0.6, 0.85], target: [0, 0.3, 0], tick: tick, fit: 0.85, labTitle: 'Gyroscope lab',
      controls: [
        { label: 'Rotor speed', unit: 'rpm', min: 0, max: 3000, step: 50, value: 1500, fmt: function (v) { return v.toFixed(0); }, set: function (v) { S.rpm = v; } },
        { label: 'Weight on the pan', unit: 'kg', min: 0, max: 1.5, step: 0.25, value: 0.5, fmt: function (v) { return v.toFixed(2); }, set: function (v) { S.W = v; } }
      ],
      buttons: [{ label: 'Reverse the spin', fn: function () { S.dir = -S.dir; } }],
      hud: function () {
        var w = S.rpm * Math.PI / 30;
        if (S.falls && S.C > 0) return '<b>Rotor too slow: the arm falls on to its stop</b><br>A gyroscope only resists the couple while it spins fast.';
        return '<b>C = W l = ' + S.C.toFixed(2) + ' N m</b>, Iω = ' + (I * w).toFixed(2) + ' kg m²/s<br>' +
          'ω<sub>p</sub> = C/(Iω) = ' + Math.abs(S.wpT).toFixed(3) + ' rad/s, ' + (S.wpT === 0 ? 'no precession' : (S.wpT > 0 ? 'anticlockwise' : 'clockwise') + ' seen from above') + '<br>' +
          'Time for one turn: theory ' + (S.wpT ? (2 * Math.PI / Math.abs(S.wpT)).toFixed(1) + ' s' : '-') + (S.revT ? ', last measured ' + S.revT.toFixed(1) + ' s' : '');
      }
    };
  };
})();
