/* models-gears.js: gear types and a two-stage gearbox (Chapter 5) */
(function () {
  'use strict';
  var D2R = Math.PI / 180;

  /* gear body: rim (toothed), web with lightening holes, hub; axis z */
  function gearBody(THREE, T, m, w, o) {
    var G = M3D.geo, K = M3D.kit, g = new THREE.Group();
    var r = m * T / 2, rf = r - 1.25 * m, hubR = o.hubR, mat = o.mat;
    var solid = rf - hubR < 4 * m || !o.web;
    if (solid) {
      g.add(G.mesh(K.gearGeo(T, m, w, { phase: o.phase, bore: o.bore, keyway: true, helix: o.helix, herring: o.herring, nz: o.nz, crown: o.crown }), mat));
      if (hubR && hubR < rf - 0.001) {
        var hb0 = G.mesh(G.lathe([[o.bore, w / 2 - 0.001], [hubR, w / 2 - 0.001], [hubR, w / 2 + 0.014], [hubR - 0.0015, w / 2 + 0.0155], [o.bore, w / 2 + 0.0155]], 40), mat);
        hb0.rotation.x = Math.PI / 2; g.add(hb0);
        if (o.screw) { var ss0 = K.capScrew(0.0035, o.screw); ss0.position.set(0, hubR - 0.0012, w / 2 + 0.008); g.add(ss0); }
      }
    } else {
      var rimIn = rf - 1.6 * m;
      g.add(G.mesh(K.gearGeo(T, m, w, { phase: o.phase, bore: rimIn, helix: o.helix, herring: o.herring, nz: o.nz, crown: o.crown }), mat));
      var s = new THREE.Shape(); s.absarc(0, 0, rimIn + 0.0005, 0, Math.PI * 2, false);
      var hb = new THREE.Path(); hb.absarc(0, 0, hubR - 0.001, 0, Math.PI * 2, true); s.holes.push(hb);
      var nh = 6, rh = (rimIn - hubR) * 0.3, rc = (rimIn + hubR) / 2;
      if (rh > 0.004) for (var i = 0; i < nh; i++) { var a = i / nh * Math.PI * 2, hp = new THREE.Path(); hp.absarc(rc * Math.cos(a), rc * Math.sin(a), rh, 0, Math.PI * 2, true); s.holes.push(hp); }
      g.add(G.mesh(G.extrude(s, w * 0.35, 0.0008), mat));
      var hub = G.mesh(G.lathe([[o.bore, -w * 0.75], [hubR, -w * 0.75], [hubR + 0.001, -w * 0.72], [hubR + 0.001, w * 0.72], [hubR, w * 0.75], [o.bore, w * 0.75], [o.bore, -w * 0.75]], 48), mat);
      hub.rotation.x = Math.PI / 2; g.add(hub);
      if (o.screw) { var ss = K.capScrew(0.0035, o.screw); ss.position.set(0, hubR - 0.0005, w * 0.55); g.add(ss); }
    }
    return g;
  }
  /* shaft along z with key */
  function shaft(THREE, rs, z0, z1, mat) {
    var G = M3D.geo, g = new THREE.Group();
    var s = G.mesh(G.lathe([[0, z0], [rs * 0.85, z0], [rs, z0 + rs * 0.15], [rs, z1 - rs * 0.15], [rs * 0.85, z1], [0, z1]], 32), mat);
    s.rotation.x = Math.PI / 2;
    g.add(s);
    return g;
  }
  function onZ(o) { o.rotation.x = Math.PI / 2; return o; }

  /* ================= parallel-axis gear rig: spur, helical, double helical ================= */
  M3D.builders.gears = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var m = 0.004, T1 = 20, T2 = 40, a = m * (T1 + T2) / 2, H = 0.13, rs = 0.0125;
    var root = new THREE.Group();
    var steel = Mt.metal(0xc3c7cc, 0.28), steel2 = Mt.metal(0xb4b9bf, 0.3), bright = Mt.metal(0xd8dbdf, 0.18);
    var frame = Mt.castPaint(0x35506b, 0.5), bolts = Mt.metal(0x9aa0a8, 0.35);

    /* base and pedestals */
    var base = new THREE.Group();
    var bp = K.plate(0.36, 0.36, 0.02, frame); bp.position.x = a / 2; base.add(bp);
    [-0.09, 0.09].forEach(function (z) { [0, a].forEach(function (x) {
      var ped = G.mesh(G.roundedBox(0.13, H - 0.04, 0.05, 0.006, 0.003), frame); ped.position.set(x, (H - 0.04) / 2, z); base.add(ped);
    }); });
    [[-0.15, -0.16], [0.15, -0.16], [-0.15, 0.16], [0.15, 0.16]].forEach(function (q) { var b = K.bolt(0.012, 0, bolts); b.position.set(q[0] + a / 2, 0, q[1]); base.add(b); });
    var tag = G.decal(0.12, 0.04, T.label(420, 140, '#e6e2d6', [['GEAR TRAINER', 40, 700], ['module 4   20° involute', 28]], '#333')); tag.position.set(a / 2, 0.0005, 0.155); tag.rotation.x = -Math.PI / 2; base.add(tag);
    base.position.x = 0; root.add(base);

    /* bearings */
    var brg = new THREE.Group();
    [-0.09, 0.09].forEach(function (z) { [0, a].forEach(function (x) { var pb = K.pillow(rs, frame, bolts); pb.position.set(x, H, z); brg.add(pb); }); });
    root.add(brg);

    /* gear sets: pinion and wheel for each type */
    var types = { spur: { helix: 0, w: 0.03 }, helical: { helix: 20 * D2R, w: 0.034 }, double: { helix: 30 * D2R, w: 0.044, herring: true } };
    var ph2 = Gear.meshPhase(T1, 0, 0, T2, false);
    var pin = new THREE.Group(), whl = new THREE.Group(), sets = {};
    Object.keys(types).forEach(function (k) {
      var t = types[k];
      var p = gearBody(THREE, T1, m, t.w, { hubR: 0.024, bore: rs, phase: 0, helix: t.helix, herring: t.herring, nz: t.helix ? (t.herring ? 24 : 14) : 1, mat: steel, web: false, screw: bolts });
      var w = gearBody(THREE, T2, m, t.w, { hubR: 0.026, bore: rs, phase: ph2, helix: -t.helix, herring: t.herring, nz: t.helix ? (t.herring ? 24 : 14) : 1, mat: steel2, web: true, screw: bolts });
      pin.add(p); whl.add(w); sets[k] = [p, w];
    });
    /* set screws on hubs */
    var pinG = new THREE.Group(); pinG.add(pin); pinG.position.set(0, H, 0);
    var whlG = new THREE.Group(); whlG.add(whl); whlG.position.set(a, H, 0);
    root.add(pinG); root.add(whlG);

    /* shafts: input with handwheel at +z, output with coupling at -z */
    var sIn = new THREE.Group(), sOut = new THREE.Group();
    var s1 = shaft(THREE, rs, -0.13, 0.2, bright); sIn.add(s1);
    var hw = new THREE.Group();
    var rimG = new THREE.TorusGeometry(0.075, 0.009, 18, 64); var rim = G.mesh(rimG, Mt.metal(0x9aa0a8, 0.3)); hw.add(rim);
    for (var sp = 0; sp < 3; sp++) { var spk = K.unitRod(0.0055, Mt.metal(0x9aa0a8, 0.3)); var an = sp / 3 * Math.PI * 2; K.orient(spk, K.V(0, 0, 0), K.V(0.072 * Math.cos(an), 0.072 * Math.sin(an), 0)); hw.add(spk); }
    var hhub = onZ(G.mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 32), Mt.metal(0x9aa0a8, 0.3))); hw.add(hhub);
    var knob = new THREE.Group(); var kn = onZ(G.mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.05, 24), Mt.knurl(0x2a2d31))); kn.position.z = 0.03; knob.add(kn); knob.position.set(0.075, 0, 0); hw.add(knob);
    hw.position.z = 0.18; sIn.add(hw);
    sIn.position.set(0, H, 0);
    var s2 = shaft(THREE, rs, -0.2, 0.13, bright); sOut.add(s2);
    var cpl = new THREE.Group();
    var ch = onZ(G.mesh(G.lathe([[rs, -0.02], [0.03, -0.02], [0.03, 0.02], [rs, 0.02], [rs, -0.02]], 48), Mt.cast('#7d8288', 0.6))); cpl.add(ch);
    for (var j = 0; j < 4; j++) { var jw = G.mesh(new THREE.BoxGeometry(0.012, 0.016, 0.018), Mt.cast('#7d8288', 0.6)); var aj = j / 4 * Math.PI * 2; jw.position.set(0.02 * Math.cos(aj), 0.02 * Math.sin(aj), -0.028); jw.rotation.z = aj; cpl.add(jw); }
    var spider = onZ(G.mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 32), Mt.rubber(0xc8342b))); spider.position.z = -0.03; cpl.add(spider);
    cpl.position.z = -0.17; sOut.add(cpl);
    sOut.position.set(a, H, 0);
    root.add(sIn); root.add(sOut);

    /* pitch circles and force arrows */
    var guides = new THREE.Group();
    var pc1 = G.mesh(new THREE.TorusGeometry(m * T1 / 2, 0.0008, 6, 96), new THREE.MeshBasicMaterial({ color: 0x1d5fae }), false); pc1.position.set(0, H, 0); guides.add(pc1);
    var pc2 = G.mesh(new THREE.TorusGeometry(m * T2 / 2, 0.0008, 6, 96), new THREE.MeshBasicMaterial({ color: 0x1d5fae }), false); pc2.position.set(a, H, 0); guides.add(pc2);
    var aT = K.arrow(0xa8141c, 0.0022), aR = K.arrow(0x1d7a46, 0.0022), aA = K.arrow(0xb86a00, 0.0022), aA2 = K.arrow(0xb86a00, 0.0022);
    guides.add(aT); guides.add(aR); guides.add(aA); guides.add(aA2);
    guides.visible = false; root.add(guides);

    var state = { type: 'spur', rpm: 20, th: 0 };
    function show(k) { state.type = k; Object.keys(sets).forEach(function (q) { sets[q][0].visible = sets[q][1].visible = q === k; }); }
    show('spur');
    function tick(t, ex, dt) {
      state.th += dt * state.rpm * Math.PI / 30;
      var th = state.th;
      pin.rotation.z = th; whl.rotation.z = -th * T1 / T2;
      s1.rotation.z = th; hw.rotation.z = th; s2.rotation.z = -th * T1 / T2; cpl.rotation.z = -th * T1 / T2;
      knob.rotation.z = -th;
      /* forces on the wheel at the pitch point (input torque 100 N m), drawn at the mesh */
      if (guides.visible) {
        var Ft = 100 / (m * T1 / 2), phi = 20 * D2R, beta = types[state.type].helix, sc = 0.03 / 2500;
        var P = K.V(m * T1 / 2, H, 0);
        K.setArrow(aT, P, K.V(0, Ft, 0), sc, false);
        K.setArrow(aR, P.clone().add(K.V(0.002, 0, 0)), K.V(Ft * Math.tan(phi), 0, 0), sc, false);
        var Fa = Ft * Math.tan(beta);
        aA.visible = aA2.visible = !!beta && state.type === 'helical';
        if (aA.visible) { K.setArrow(aA, K.V(0, H + 0.03, 0.03), K.V(0, 0, Fa), sc * 1.5, false); K.setArrow(aA2, K.V(a, H + 0.03, -0.03), K.V(0, 0, -Fa), sc * 1.5, false); }
      }
    }
    function eps() {
      var t = types[state.type], phi = 20 * D2R, r1 = m * T1 / 2, r2 = m * T2 / 2, ra1 = r1 + m, ra2 = r2 + m;
      var path = Math.sqrt(ra1 * ra1 - Math.pow(r1 * Math.cos(phi), 2)) + Math.sqrt(ra2 * ra2 - Math.pow(r2 * Math.cos(phi), 2)) - (r1 + r2) * Math.sin(phi);
      var et = path / (Math.PI * m * Math.cos(phi)), eb = t.helix ? (t.herring ? t.w / 2 : t.w) * Math.tan(t.helix) / (Math.PI * m) : 0;
      return [et, eb];
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Pinion (driver), 20 teeth', obj: pin, off: [-0.06, 0.1, 0.06], at: [0, 0.03, 0.02], photo: 'Category:Spur gears', desc: 'Module 4 mm, 20° involute, pitch diameter 80 mm. Switch the type with the buttons: spur teeth are straight, helical teeth are cut on a helix (here 20°), and double-helical (herringbone) teeth have two opposite helices so the end thrusts cancel.' },
      { name: 'Wheel (driven), 40 teeth', obj: whl, off: [0.08, 0.12, -0.06], at: [0, 0.07, 0.02], photo: 'Category:Spur gears', desc: 'Pitch diameter 160 mm, so the ratio is 40/20 = 2 and the wheel turns at half the pinion speed in the opposite direction. A helical wheel has the opposite hand to its pinion. The web is lightened with six holes.' },
      { name: 'Input shaft and handwheel', obj: sIn, off: [-0.05, 0, 0.12], at: [0.07, 0, 0.18], photo: 'Category:Handwheels', desc: 'Turn it by hand in the lab and count turns: 2 turns of the input give 1 turn of the output.' },
      { name: 'Output shaft and jaw coupling', obj: sOut, off: [0.1, 0, -0.1], at: [0.03, 0, -0.17], photo: 'Category:Jaw couplings', desc: 'The jaw coupling with its rubber spider takes the drive to a brake or load. It tolerates small misalignment.' },
      { name: 'Plummer (pillow) blocks', obj: brg, off: [0, 0.05, 0], at: [0, 0.13 + 0.03, 0.09], photo: 'Category:Pillow block bearings', desc: 'Ball bearings in cast housings with grease nipples. Spur gears load them radially only; helical gears add an axial (end) load, so one bearing on each shaft must locate it axially.' },
      { name: 'Base and pedestals', obj: base, off: [0, -0.06, 0], at: [0.12, 0.0, 0.12], photo: 'Category:Spur gears', desc: 'Rigid cast base. The centre distance is fixed at m(T₁ + T₂)/2 = 120 mm.' }
    ];
    return {
      group: root, parts: parts, cam: [0.3, 0.55, 0.52], target: [0.06, 0.12, 0], tick: tick, fit: 0.85,
      controls: [{ label: 'Input speed', unit: 'rpm', min: 0, max: 60, step: 1, value: 20, set: function (v) { state.rpm = v; } }],
      buttons: [
        { label: 'Spur', fn: function () { show('spur'); } },
        { label: 'Helical', fn: function () { show('helical'); } },
        { label: 'Double helical', fn: function () { show('double'); } },
        { label: 'Pitch circles and forces', fn: function (b) { guides.visible = !guides.visible; b.classList.toggle('on', guides.visible); } }
      ],
      hud: function () {
        var e = eps(), t = types[state.type];
        return '<b>' + { spur: 'Spur', helical: 'Helical, 20°', double: 'Double helical, 30°' }[state.type] + '</b>: input ' + state.rpm.toFixed(0) + ' rpm, output ' + (state.rpm / 2).toFixed(1) + ' rpm<br>' +
          'Transverse contact ratio ' + e[0].toFixed(2) + (t.helix ? ', overlap ratio ' + e[1].toFixed(2) + ', total ' + (e[0] + e[1]).toFixed(2) : '') +
          (guides.visible ? '<br>At 100 N m input: F<sub>t</sub> = 2500 N (red), F<sub>r</sub> = ' + (2500 * Math.tan(20 * D2R)).toFixed(0) + ' N (green)' + (t.helix ? ', F<sub>a</sub> = ' + (t.herring ? '0 net' : (2500 * Math.tan(t.helix)).toFixed(0) + ' N (amber)') : '') : '');
      }
    };
  };

  /* ================= straight bevel gears at 90° ================= */
  M3D.builders.bevel = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var m = 0.005, T1 = 18, T2 = 27, d1 = Math.atan(T1 / T2), d2 = Math.PI / 2 - d1;
    var R1 = m * T1 / 2, R2 = m * T2 / 2, A0 = R1 / Math.sin(d1), F = A0 * 0.3, rs = 0.012;
    var root = new THREE.Group();
    var steel = Mt.metal(0xc6b07a, 0.3), steel2 = Mt.metal(0xb9bec4, 0.28), housing = Mt.castPaint(0x5a2e2a, 0.5), bright = Mt.metal(0xd8dbdf, 0.18), bolts = Mt.metal(0x9aa0a8, 0.35);
    /* apex at the origin. Pinion axis along +x (teeth towards the apex), wheel axis along +y */
    function bevelGroup(Tn, dl, Rp, phase, mat) {
      var g = new THREE.Group();
      var tooth = G.mesh(K.bevelGeo(Tn, m, F, dl, { phase: phase, bore: rs }), mat);
      g.add(tooth);
      var back = G.mesh(G.lathe([[rs, -0.012], [Rp * 0.9, -0.012], [Rp * 0.98, -0.002], [Rp * 0.98, 0.0], [rs, 0], [rs, -0.012]], 64), mat); back.rotation.x = Math.PI / 2; g.add(back);
      var hub = G.mesh(G.lathe([[rs, -0.05], [rs * 2.1, -0.05], [rs * 2.2, -0.045], [rs * 2.2, -0.01], [rs, -0.01]], 48), mat); hub.rotation.x = Math.PI / 2; g.add(hub);
      return { g: g, zb: A0 * Math.cos(dl) };
    }
    var p = bevelGroup(T1, d1, R1, -Math.PI / 2, steel), w = bevelGroup(T2, d2, R2, Math.PI + Math.PI / T2, steel2);
    /* pinion: local z -> world -x direction from back to apex: back face at x = -A0 cos d1 */
    var pin = new THREE.Group(); pin.add(p.g); pin.rotation.y = Math.PI / 2; pin.position.x = -p.zb;
    var whl = new THREE.Group(); whl.add(w.g); whl.rotation.x = -Math.PI / 2; whl.position.y = -w.zb;
    var pinS = new THREE.Group(); pinS.add(pin); var whlS = new THREE.Group(); whlS.add(whl);
    root.add(pinS); root.add(whlS);
    /* shafts */
    var sh1 = G.mesh(new THREE.CylinderGeometry(rs, rs, 0.3, 32), bright); sh1.rotation.z = Math.PI / 2; sh1.position.x = -p.zb - 0.145; pinS.add(sh1);
    var sh2 = G.mesh(new THREE.CylinderGeometry(rs, rs, 0.26, 32), bright); sh2.position.y = -w.zb - 0.1; whlS.add(sh2);
    var pul = G.mesh(G.lathe([[rs, -0.018], [0.05, -0.018], [0.05, -0.013], [0.044, 0], [0.05, 0.013], [0.05, 0.018], [rs, 0.018]], 64), Mt.cast('#6f757d', 0.6)); pul.rotation.z = Math.PI / 2; pul.position.x = -p.zb - 0.25; pinS.add(pul);
    /* housing: angle bracket with two bearing bosses */
    var hous = new THREE.Group();
    var floorY = -w.zb - 0.22;
    var bp = K.plate(0.42, 0.26, 0.018, housing); bp.position.y = floorY; bp.position.x = -0.1; hous.add(bp);
    function boss(len) { return G.mesh(G.lathe([[rs * 1.6, -len / 2], [rs * 3, -len / 2], [rs * 3.2, -len / 2 + 0.004], [rs * 3.2, len / 2 - 0.004], [rs * 3, len / 2], [rs * 1.6, len / 2]], 48), housing); }
    var b1 = boss(0.05); b1.rotation.z = Math.PI / 2; b1.position.x = -p.zb - 0.11; hous.add(b1);
    var st1 = G.mesh(G.roundedBox(0.05, 0.03, (-floorY) - 0.0, 0.006, 0.003), housing); st1.rotation.x = Math.PI / 2; st1.position.set(-p.zb - 0.11, floorY / 2, 0); st1.scale.set(1, 1, 1); hous.add(st1);
    var b2 = boss(0.05); b2.position.y = -w.zb - 0.12; hous.add(b2);
    var arm = G.mesh(G.roundedBox(0.03, 0.05, 0.05, 0.006, 0.003), housing); arm.position.set(0.0, -w.zb - 0.12, -0.05); hous.add(arm);
    var col = G.mesh(G.roundedBox(0.04, -floorY - w.zb - 0.12 + 0.02, 0.04, 0.006, 0.003), housing); col.position.set(0, (floorY + (-w.zb - 0.12)) / 2, -0.07); hous.add(col);
    var bottomB = G.mesh(G.roundedBox(0.07, 0.03, 0.07, 0.006, 0.003), housing); bottomB.position.set(0, floorY + 0.015, -0.05); hous.add(bottomB);
    var name = G.decal(0.1, 0.035, T.label(400, 140, '#e6e2d6', [['BEVEL GEARS', 40, 700], ['18 : 27   m 5   90°', 28]], '#333')); name.position.set(-0.12, floorY + 0.0005, 0.1); name.rotation.x = -Math.PI / 2; hous.add(name);
    root.add(hous);
    /* cone guides */
    var cones = new THREE.Group();
    var cm = new THREE.MeshBasicMaterial({ color: 0x1d5fae, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
    var c1 = new THREE.Mesh(new THREE.ConeGeometry(R1, A0 * Math.cos(d1), 64, 1, true), cm); c1.rotation.z = -Math.PI / 2; c1.position.x = -A0 * Math.cos(d1) / 2; cones.add(c1);
    var c2 = new THREE.Mesh(new THREE.ConeGeometry(R2, A0 * Math.cos(d2), 64, 1, true), cm); c2.position.y = -A0 * Math.cos(d2) / 2;
    cones.add(c2); cones.visible = false; root.add(cones);
    var state = { rpm: 20, th: 0 };
    function tick(t, ex, dt) {
      state.th += dt * state.rpm * Math.PI / 30;
      p.g.rotation.z = state.th; w.g.rotation.z = -state.th * T1 / T2 + 0;
      sh1.rotation.y = 0; pul.rotation.x = state.th;
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Bevel pinion, 18 teeth', obj: pinS, off: [-0.12, 0.04, 0], at: [-0.04, 0.03, 0.02], photo: 'Category:Bevel gears', desc: 'Pitch-cone angle tan⁻¹(18/27) = 33.7°. The teeth taper towards the common apex, so the tooth size falls along the face. Driven by the belt pulley.' },
      { name: 'Bevel wheel, 27 teeth', obj: whlS, off: [0.05, -0.12, 0], at: [0.03, -0.03, 0.05], photo: 'Category:Bevel gears', desc: 'Pitch-cone angle 56.3°; the two cone angles add to the 90° shaft angle. The two pitch cones roll on each other with a common apex: press "Pitch cones" to see them.' },
      { name: 'Housing with bearing bosses', obj: hous, off: [0, -0.08, -0.08], at: [-0.12, -0.2, 0.08], photo: 'Category:Bevel gears', desc: 'Holds both shafts so the cone apexes meet. If the pinion is set too far in or out, the teeth bind or run with backlash, so bevel gears are shimmed into position on assembly.' }
    ];
    return {
      group: root, parts: parts, cam: [0.45, 0.25, 0.55], target: [-0.08, -0.08, 0], tick: tick, fit: 0.85,
      controls: [{ label: 'Pinion speed', unit: 'rpm', min: 0, max: 60, step: 1, value: 20, set: function (v) { state.rpm = v; } }],
      buttons: [{ label: 'Pitch cones', fn: function (b) { cones.visible = !cones.visible; b.classList.toggle('on', cones.visible); } }],
      hud: function () { return 'Shaft angle 90°, ratio 27/18 = 1.5<br>Pinion ' + state.rpm.toFixed(0) + ' rpm, wheel ' + (state.rpm / 1.5).toFixed(1) + ' rpm'; }
    };
  };

  /* ================= worm and worm wheel ================= */
  M3D.builders.worm = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var m = 0.004, Tw = 30, rpw = 0.022, rw = m * Tw / 2, C = rpw + rw, rs = 0.01;
    var root = new THREE.Group();
    var steel = Mt.metal(0xc3c7cc, 0.22), bronze = Mt.metal(0xb87b3c, 0.32), frame = Mt.castPaint(0x34503d, 0.5), bright = Mt.metal(0xd8dbdf, 0.18), bolts = Mt.metal(0x9aa0a8, 0.35);
    /* worm along x at y = C above the wheel centre (wheel axis z) */
    var worms = {};
    var wormG = new THREE.Group();
    [1, 2].forEach(function (st) {
      var g = new THREE.Group(), wg = K.wormGeo(m, st, 0.09, rpw);
      var body = G.mesh(wg.geo, steel); g.add(body);
      [-1, 1].forEach(function (k) { var e = G.mesh(new THREE.CylinderGeometry(wg.rf, wg.rf, 0.002, 48), steel); e.rotation.x = Math.PI / 2; e.position.z = k * 0.045; g.add(e); });
      g.userData.lead = wg.lead; worms[st] = g; wormG.add(g);
    });
    var shW = G.mesh(new THREE.CylinderGeometry(rs, rs, 0.32, 32), bright); shW.rotation.x = Math.PI / 2; wormG.add(shW);
    var hw = new THREE.Group();
    var rim = G.mesh(new THREE.TorusGeometry(0.06, 0.008, 18, 64), Mt.metal(0x9aa0a8, 0.3)); hw.add(rim);
    for (var sp = 0; sp < 4; sp++) { var spk = K.unitRod(0.005, Mt.metal(0x9aa0a8, 0.3)); var an = sp / 4 * Math.PI * 2; K.orient(spk, K.V(0, 0, 0), K.V(0.058 * Math.cos(an), 0.058 * Math.sin(an), 0)); hw.add(spk); }
    var kn = G.mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.045, 24), Mt.knurl(0x2a2d31)); kn.rotation.x = Math.PI / 2; kn.position.set(0.06, 0, 0.025); hw.add(kn);
    hw.position.z = 0.15; wormG.add(hw);
    var wormS = new THREE.Group(); wormS.add(wormG); wormS.rotation.y = Math.PI / 2; wormS.position.y = C; root.add(wormS);
    /* wheel: throated helical gear, helix = lead angle */
    var wheels = {};
    var whl = new THREE.Group();
    [1, 2].forEach(function (st) {
      var lam = Math.atan(st * Math.PI * m / (2 * Math.PI * rpw));
      var g = gearBody(THREE, Tw, m, 0.028, { hubR: 0.022, bore: rs, phase: 0, helix: lam, nz: 14, crown: 0.025, mat: bronze, web: true });
      wheels[st] = g; whl.add(g);
    });
    var shWh = G.mesh(new THREE.CylinderGeometry(rs * 1.2, rs * 1.2, 0.26, 32), bright); shWh.rotation.x = Math.PI / 2; whl.add(shWh);
    var drum = G.mesh(G.lathe([[rs * 1.2, -0.03], [0.035, -0.03], [0.035, 0.03], [rs * 1.2, 0.03]], 48), Mt.cast('#6f757d', 0.6)); drum.rotation.x = Math.PI / 2; drum.position.z = -0.1; whl.add(drum);
    root.add(whl);
    /* rope and load on the drum */
    var load = new THREE.Group();
    var rope = K.unitRod(0.0018, Mt.rubber(0xcbb98a)); load.add(rope);
    var wt = G.mesh(G.lathe([[0, 0], [0.022, 0], [0.022, 0.035], [0.006, 0.04], [0.006, 0.05], [0, 0.05]], 32), Mt.cast('#3d4248', 0.6)); load.add(wt);
    var hook = G.mesh(new THREE.TorusGeometry(0.006, 0.0015, 8, 20), bolts); load.add(hook);
    root.add(load);
    /* frame */
    var frm = new THREE.Group();
    var floor = -0.16;
    var bp = K.plate(0.36, 0.32, 0.018, frame); bp.position.y = floor; frm.add(bp);
    function upright(x, z, top, w2) { var u = G.mesh(G.roundedBox(w2 || 0.05, top - floor, 0.03, 0.005, 0.003), frame); u.position.set(x, (top + floor) / 2, z); frm.add(u); var bb = G.mesh(G.ring(rs * 2.6, rs * 1.0, 0.034, 40), frame); bb.rotation.x = Math.PI / 2; bb.position.set(x, top, z); frm.add(bb); }
    upright(0, 0.07, 0, 0.06); upright(0, -0.07, 0, 0.06);
    [-0.07, 0.07].forEach(function (x) { var u = G.mesh(G.roundedBox(0.03, C - floor, 0.05, 0.005, 0.003), frame); u.position.set(x, (C + floor) / 2, 0); frm.add(u); var bb = G.mesh(G.ring(rs * 2.6, rs * 1.0, 0.034, 40), frame); bb.rotation.z = Math.PI / 2; bb.position.set(x, C, 0); frm.add(bb); });
    var name = G.decal(0.11, 0.035, T.label(400, 140, '#e6e2d6', [['WORM REDUCER', 40, 700], ['30 teeth   m 4', 28]], '#333')); name.position.set(0.06, floor + 0.0005, 0.12); name.rotation.x = -Math.PI / 2; frm.add(name);
    root.add(frm);
    var state = { rpm: 30, th: 0, st: 1, dir: 1 };
    function show(st) { state.st = st; [1, 2].forEach(function (k) { worms[k].visible = wheels[k].visible = k === st; }); }
    state.th = 0; show(1);
    function tick(t, ex, dt) {
      state.th += state.dir * dt * state.rpm * Math.PI / 30;
      wormG.rotation.z = state.th + (state.st === 1 ? Math.PI / 2 : 0);
      var wa = state.th * state.st / Tw;
      whl.rotation.z = wa;
      /* the load is wound up on the drum, then lowered again */
      var lift = 0.035 * wa;
      if (lift > 0.06) state.dir = -1; if (lift < 0) state.dir = 1;
      var ry = -0.09 + lift, top = K.V(0.035, 0, -0.1);
      K.orient(rope, top, K.V(0.035, ry, -0.1)); wt.position.set(0.035, ry - 0.05, -0.1); hook.position.set(0.035, ry - 0.002, -0.1);
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Worm (hardened steel)', obj: wormS, off: [0, 0.1, 0], at: [0, 0, 0.02], photo: 'Category:Worm drives', desc: 'A screw with an involute (straight-sided in the axial section) thread, module 4 mm. Single start: one turn of the worm moves the wheel one tooth. Try the two-start worm with the button.' },
      { name: 'Worm wheel (phosphor bronze)', obj: whl, off: [0, -0.04, 0.12], at: [0, 0.05, 0.015], photo: 'Category:Worm drives', desc: '30 teeth with a concave (throated) face that wraps round the worm. Bronze against steel resists seizure under the high sliding speed.' },
      { name: 'Hoist drum and load', obj: load, off: [0, -0.05, 0], at: [0.035, -0.12, -0.1], photo: 'Category:Worm drives', desc: 'With a single-start worm the lead angle is small (about 5.2° here), less than the friction angle, so the load cannot drive the worm backwards: the drive is self-locking, which is why worm gears are used in hoists and gate valves.' },
      { name: 'Frame and bearings', obj: frm, off: [0, -0.06, 0], at: [-0.07, 0.0, 0.03], photo: 'Category:Worm drives', desc: 'The worm shaft carries a large end thrust, so in a real reducer it runs in taper-roller or angular-contact bearings.' }
    ];
    return {
      group: root, parts: parts, cam: [0.42, 0.34, 0.58], target: [0, -0.02, 0], tick: tick, fit: 0.85,
      controls: [{ label: 'Worm speed', unit: 'rpm', min: 0, max: 120, step: 1, value: 30, set: function (v) { state.rpm = v; } }],
      buttons: [{ label: 'Single start', fn: function () { state.th = 0; show(1); } }, { label: 'Two start', fn: function () { state.th = 0; show(2); } }],
      hud: function () {
        var lam = Math.atan(state.st * Math.PI * m / (2 * Math.PI * rpw)) / D2R, ratio = Tw / state.st;
        return 'Ratio ' + Tw + '/' + state.st + ' = ' + ratio.toFixed(0) + ' : 1, wheel ' + (state.rpm / ratio).toFixed(2) + ' rpm<br>Lead angle ' + lam.toFixed(1) + '°: ' + (lam < 5.7 ? 'below a friction angle of about 5.7° (μ = 0.1), so self-locking' : 'above the friction angle, so the load can drive the worm back');
      }
    };
  };

  /* ================= rack and pinion (steering rack) ================= */
  M3D.builders.rack = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var m = 0.003, Tp = 16, rp = m * Tp / 2, rs = 0.008, nT = 34, wR = 0.018;
    /* built with the rack along x, teeth up (+y), pinion axis along z; then tilted so the column rises */
    var root = new THREE.Group(), body = new THREE.Group(); body.rotation.x = -Math.PI / 2 + 0.45; root.add(body);
    var steel = Mt.metal(0xc3c7cc, 0.25), alu = Mt.cast('#a9aeb4', 0.6), black = Mt.rubber(0x1a1a1a), bright = Mt.metal(0xd8dbdf, 0.18), bolts = Mt.metal(0x9aa0a8, 0.35);
    var rack = new THREE.Group();
    rack.add(G.mesh(K.rackGeo(nT, m, wR, 0.009), steel));
    var bar = G.mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.44, 40), steel); bar.rotation.z = Math.PI / 2; bar.position.y = -0.012; rack.add(bar);
    [-1, 1].forEach(function (k) {
      var ball = G.mesh(new THREE.SphereGeometry(0.0135, 32, 24), steel); ball.position.set(k * 0.225, -0.012, 0); rack.add(ball);
      var sock = G.mesh(G.lathe([[0, -0.016], [0.012, -0.016], [0.016, -0.004], [0.016, 0.01], [0.009, 0.016], [0, 0.016]], 32), bright); sock.rotation.z = -k * Math.PI / 2; sock.position.set(k * 0.233, -0.012, 0); rack.add(sock);
      var tie = G.mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.08, 20), bright); tie.rotation.z = Math.PI / 2; tie.position.set(k * 0.285, -0.012, 0); rack.add(tie);
      var thr = G.mesh(new THREE.CylinderGeometry(0.0072, 0.0072, 0.025, 20), Mt.knurl(0xb9bec4)); thr.rotation.z = Math.PI / 2; thr.position.set(k * 0.335, -0.012, 0); rack.add(thr);
      var nutL = K.nut(0.013, bolts); nutL.rotation.z = -k * Math.PI / 2; nutL.position.set(k * 0.322, -0.012, 0); rack.add(nutL);
      var end = G.mesh(G.roundedBox(0.036, 0.026, 0.026, 0.009, 0.003), Mt.cast('#5b6168', 0.6)); end.position.set(k * 0.362, -0.012, 0); rack.add(end);
      var stud = G.mesh(new THREE.CylinderGeometry(0.0055, 0.008, 0.03, 20), bright); stud.rotation.x = Math.PI / 2; stud.position.set(k * 0.368, -0.012, 0.026); rack.add(stud);
      var tb = G.mesh(new THREE.SphereGeometry(0.012, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), black); tb.rotation.x = Math.PI / 2; tb.position.set(k * 0.368, -0.012, 0.013); rack.add(tb);
    });
    body.add(rack);
    /* pinion and steering shaft along +z */
    var pin = new THREE.Group();
    pin.add(gearBody(THREE, Tp, m, wR, { hubR: 0, bore: 0.004, phase: -Math.PI / 2, nz: 1, mat: steel, web: false }));
    var ps = G.mesh(new THREE.CylinderGeometry(rs, rs, 0.22, 32), bright); ps.rotation.x = Math.PI / 2; ps.position.z = 0.11; pin.add(ps);
    var ps0 = G.mesh(new THREE.CylinderGeometry(rs, rs, 0.03, 32), bright); ps0.rotation.x = Math.PI / 2; ps0.position.z = -0.022; pin.add(ps0);
    for (var i = 0; i < 18; i++) { var tt = G.mesh(new THREE.BoxGeometry(0.0016, 0.0025, 0.03), bright); var a = i / 18 * Math.PI * 2; tt.position.set((rs + 0.0006) * Math.cos(a), (rs + 0.0006) * Math.sin(a), 0.06); tt.rotation.z = a; pin.add(tt); }
    var uj = new THREE.Group();
    var yk1 = G.mesh(G.roundedBox(0.03, 0.012, 0.03, 0.004, 0.002), Mt.metal(0x8a9098, 0.35)); yk1.position.z = 0.09; uj.add(yk1);
    var cross = G.mesh(new THREE.BoxGeometry(0.03, 0.008, 0.008), bright); cross.position.z = 0.105; uj.add(cross);
    var cross2 = G.mesh(new THREE.BoxGeometry(0.008, 0.03, 0.008), bright); cross2.position.z = 0.105; uj.add(cross2);
    var yk2 = G.mesh(G.roundedBox(0.012, 0.03, 0.03, 0.004, 0.002), Mt.metal(0x8a9098, 0.35)); yk2.position.z = 0.12; uj.add(yk2);
    pin.add(uj);
    var sw = new THREE.Group();
    var swr = G.mesh(new THREE.TorusGeometry(0.095, 0.012, 20, 96), Mt.rubber(0x202020)); sw.add(swr);
    for (var s2 = 0; s2 < 3; s2++) { var sp = K.unitRod(0.008, Mt.paint(0x2a2d31, 0.5)); var a2 = s2 / 3 * Math.PI * 2 - Math.PI / 2; K.orient(sp, K.V(0, 0, -0.025), K.V(0.09 * Math.cos(a2), 0.09 * Math.sin(a2), 0)); sw.add(sp); }
    var boss = G.mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.03, 40), Mt.paint(0x2a2d31, 0.5)); boss.rotation.x = Math.PI / 2; boss.position.z = -0.025; sw.add(boss);
    var badge = G.decal(0.03, 0.03, T.label(128, 128, '#2a2d31', [['', 10]])); badge.position.z = -0.0095; sw.add(badge);
    sw.position.z = 0.22; pin.add(sw);
    pin.position.set(0, rp, 0);
    body.add(pin);
    /* housing: aluminium tube, cut open along the top so the mesh shows */
    var hous = new THREE.Group();
    var tube = G.mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.3, 48, 1, true, Math.PI * 0.28, Math.PI * 1.44), alu); tube.material = tube.material.clone(); tube.material.side = THREE.DoubleSide; tube.rotation.z = Math.PI / 2; tube.position.y = -0.008; hous.add(tube);
    var tower = G.mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.045, 48, 1, true, Math.PI * 0.55, Math.PI * 1.5), alu); tower.material = tower.material.clone(); tower.material.side = THREE.DoubleSide; tower.rotation.x = Math.PI / 2; tower.position.set(0, rp, 0.02); hous.add(tower);
    var yoke = G.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 32), alu); yoke.position.set(0, -0.042, 0); hous.add(yoke);
    var yokeP = G.mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.006, 6), bolts); yokeP.position.set(0, -0.058, 0); hous.add(yokeP);
    [-1, 1].forEach(function (k) {
      for (var c = 0; c < 8; c++) { var r1 = c % 2 ? 0.0175 : 0.024, r2 = c % 2 ? 0.024 : 0.0175; var seg = G.mesh(new THREE.CylinderGeometry(r1, r2, 0.011, 32, 1, true), black); seg.material = seg.material.clone(); seg.material.side = THREE.DoubleSide; seg.rotation.z = Math.PI / 2; seg.position.set(k * (0.156 + c * 0.011), -0.01, 0); hous.add(seg); }
      var mount = G.mesh(G.roundedBox(0.045, 0.026, 0.05, 0.008, 0.003), alu); mount.position.set(k * 0.1, -0.025, -0.03); hous.add(mount);
      var bush = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.005, 12, 32), black); bush.position.set(k * 0.1, -0.025, -0.056); hous.add(bush);
      var bb = K.bolt(0.008, 0, bolts); bb.rotation.x = -Math.PI / 2; bb.position.set(k * 0.1, -0.025, -0.062); hous.add(bb);
    });
    body.add(hous);
    var state = { amp: 1, t: 0, x: 0, th: 0 };
    var travel = 0.07;
    function tick(t, ex, dt) {
      state.t += dt;
      var x = travel * Math.sin(state.t * 0.55) * state.amp;
      rack.position.x += x;
      pin.rotation.z = x / rp;
      state.x = x; state.th = x / rp;
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Rack', obj: rack, off: [0, -0.07, 0], at: [0.05, 0.004, 0.0], photo: 'Category:Rack and pinion', desc: 'A gear of infinite radius: straight teeth with 20° flanks, module 3 mm. Linear travel = pinion pitch radius × angle turned. Ball joints at the ends drive the track rods to the wheels.' },
      { name: 'Pinion, shaft and steering wheel', obj: pin, off: [0, 0.09, 0.06], at: [0, 0.0, 0.2], photo: 'Category:Rack and pinion', desc: '16 teeth, pitch radius 24 mm, so one turn of the steering wheel moves the rack 2π × 24 = 151 mm. The universal joint lets the column meet the pinion at an angle.' },
      { name: 'Housing, gaiters and mounts', obj: hous, off: [0, -0.03, -0.09], at: [-0.1, -0.025, -0.03], photo: 'Category:Rack and pinion', desc: 'Aluminium casting, cut open here over the mesh. A spring-loaded yoke under the rack holds it against the pinion to take up backlash. Rubber gaiters keep out dust and water.' }
    ];
    return {
      group: root, parts: parts, cam: [0.3, 0.42, 0.6], target: [0, 0.04, 0], tick: tick, fit: 0.72,
      controls: [{ label: 'Steering input', min: 0, max: 1, step: 0.05, value: 1, fmt: function (v) { return (v * 100).toFixed(0) + '% of lock'; }, set: function (v) { state.amp = v; } }],
      hud: function () { return 'Steering wheel ' + (state.th / D2R).toFixed(0) + '°, rack travel ' + (state.x * 1000).toFixed(1) + ' mm<br>x = r<sub>p</sub>θ, r<sub>p</sub> = mT/2 = 24 mm'; }
    };
  };

  /* ================= two-stage helical reduction gearbox with motor ================= */
  M3D.builders.gearbox = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var m1 = 0.0025, a1 = 17, b1 = 51, m2 = 0.0035, a2 = 15, b2 = 45;
    var c1 = m1 * (a1 + b1) / 2, c2 = m2 * (a2 + b2) / 2, beta = 15 * D2R;
    /* shafts along z, all in the x-y plane at y = 0 */
    var xI = 0, xM = c1, xO = c1 + c2;
    var root = new THREE.Group();
    var steel = Mt.metal(0xc3c7cc, 0.26), steel2 = Mt.metal(0xb0b6bc, 0.3), bright = Mt.metal(0xd8dbdf, 0.18), housing = Mt.castPaint(0x3c5a7a, 0.5), bolts = Mt.metal(0x9aa0a8, 0.35);
    var ph = Gear.meshPhase(a1, 0, 0, b1, false), ph2 = Gear.meshPhase(a2, 0, 0, b2, false);
    var sI = new THREE.Group(), sM = new THREE.Group(), sO = new THREE.Group();
    var gA1 = gearBody(THREE, a1, m1, 0.022, { hubR: 0.016, bore: 0.009, phase: 0, helix: beta, nz: 12, mat: steel, web: false }); gA1.position.z = 0.03; sI.add(gA1);
    var gB1 = gearBody(THREE, b1, m1, 0.022, { hubR: 0.02, bore: 0.012, phase: ph, helix: -beta, nz: 12, mat: steel2, web: true }); gB1.position.z = 0.03; sM.add(gB1);
    var gA2 = gearBody(THREE, a2, m2, 0.03, { hubR: 0.02, bore: 0.012, phase: 0, helix: -beta, nz: 12, mat: steel, web: false }); gA2.position.z = -0.03; sM.add(gA2);
    var gB2 = gearBody(THREE, b2, m2, 0.03, { hubR: 0.026, bore: 0.017, phase: ph2, helix: beta, nz: 12, mat: steel2, web: true }); gB2.position.z = -0.03; sO.add(gB2);
    function shaftZ(r, z0, z1) { var s = G.mesh(new THREE.CylinderGeometry(r, r, z1 - z0, 32), bright); s.rotation.x = Math.PI / 2; s.position.z = (z0 + z1) / 2; return s; }
    sI.add(shaftZ(0.009, -0.075, 0.16)); sM.add(shaftZ(0.012, -0.075, 0.075)); sO.add(shaftZ(0.017, -0.2, 0.075));
    /* bearings on each shaft at both walls */
    [[sI, 0.009], [sM, 0.012], [sO, 0.017]].forEach(function (q) { [-0.068, 0.068].forEach(function (z) {
      var o = G.mesh(G.ring(q[1] * 2.1, q[1] * 1.55, 0.014, 40), Mt.metal(0xc8ccd1, 0.2)); o.rotation.x = Math.PI / 2; o.position.z = z; q[0].add(o);
      var i2 = G.mesh(G.ring(q[1] * 1.35, q[1], 0.014, 40), Mt.metal(0xc8ccd1, 0.2)); i2.rotation.x = Math.PI / 2; i2.position.z = z; q[0].add(i2);
      for (var k = 0; k < 9; k++) { var bl = G.mesh(new THREE.SphereGeometry(q[1] * 0.17, 12, 8), Mt.metal(0xe0e3e6, 0.1)); var an = k / 9 * Math.PI * 2; bl.position.set(q[1] * 1.45 * Math.cos(an), q[1] * 1.45 * Math.sin(an), z); q[0].add(bl); }
    }); });
    /* output key and input coupling half */
    var key = G.mesh(new THREE.BoxGeometry(0.006, 0.005, 0.05), Mt.metal(0x8a9098, 0.4)); key.position.set(0, 0.017, -0.16); sO.add(key);
    sI.position.x = xI; sM.position.x = xM; sO.position.x = xO;
    root.add(sI); root.add(sM); root.add(sO);
    /* housing: lower half solid, upper half removed (shown as an outline cover that can be lifted) */
    var hous = new THREE.Group();
    var L = xO - xI + 0.2, x0 = xI - 0.085, Hh = 0.095, Wz = 0.16;
    /* walls as separate slabs */
    var wallMat = housing;
    function slab(w, h, d, x, y, z) { var b = G.mesh(G.roundedBox(w, h, d, 0.003, 0.0015), wallMat); b.position.set(x, y, z); hous.add(b); return b; }
    slab(L, 0.012, Wz, x0 + L / 2, -Hh + 0.006, 0);
    slab(0.012, Hh, Wz, x0 + 0.006, -Hh / 2, 0); slab(0.012, Hh, Wz, x0 + L - 0.006, -Hh / 2, 0);
    [-1, 1].forEach(function (k) {
      /* side walls with half bores: build from a shape with semicircle notches */
      var s = new THREE.Shape(); s.moveTo(x0, -Hh); s.lineTo(x0 + L, -Hh); s.lineTo(x0 + L, 0);
      [[xO, 0.017], [xM, 0.012], [xI, 0.009]].forEach(function (q) { var R = q[1] * 2.1; s.lineTo(q[0] + R, 0); s.absarc(q[0], 0, R, 0, -Math.PI, true); });
      s.lineTo(x0, 0); s.closePath();
      var wall = G.mesh(G.extrude(s, 0.012, 0.0015), wallMat); wall.position.z = k * 0.074; hous.add(wall);
      /* split-line flange */
      var fl = G.mesh(G.roundedBox(L + 0.03, 0.01, 0.022, 0.003, 0.0015), wallMat); fl.position.set(x0 + L / 2, -0.005, k * 0.085); hous.add(fl);
      for (var b = 0; b < 4; b++) { var bt = K.bolt(0.007, 0, bolts); bt.position.set(x0 + 0.02 + b * (L - 0.04) / 3, 0, k * 0.088); hous.add(bt); }
    });
    var feet = G.mesh(G.roundedBox(L + 0.06, 0.014, Wz + 0.06, 0.006, 0.003), wallMat); feet.position.set(x0 + L / 2, -Hh - 0.007, 0); hous.add(feet);
    /* oil */
    var oil = G.mesh(new THREE.BoxGeometry(L - 0.024, 0.04, 0.134), Mt.oil()); oil.position.set(x0 + L / 2, -Hh + 0.012 + 0.02, 0); hous.add(oil);
    var plug = K.bolt(0.012, 0, bolts); plug.rotation.z = -Math.PI / 2; plug.position.set(x0 + L, -Hh + 0.02, 0.03); hous.add(plug);
    var glass = G.mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.004, 32), Mt.glass()); glass.rotation.x = Math.PI / 2; glass.position.set(x0 + L / 2, -Hh + 0.035, 0.0815); hous.add(glass);
    var gring = G.mesh(G.ring(0.014, 0.011, 0.004, 32), bolts); gring.rotation.x = Math.PI / 2; gring.position.set(x0 + L / 2, -Hh + 0.035, 0.0815); hous.add(gring);
    var plateN = G.decal(0.08, 0.035, T.label(400, 170, '#cfd2d6', [['REDUCER  i = 9.0', 36, 700], ['2 stage helical', 28], ['oil: ISO VG 220', 26]], '#555')); plateN.position.set(x0 + L * 0.3, -Hh * 0.55, 0.0805 + 0.0002); hous.add(plateN);
    root.add(hous);
    /* motor and coupling on the input */
    var mot = K.motor(0.055, 0.15, 0x2f5d8a, 'MOTOR 1.5 kW'); mot.position.set(xI, 0, 0.365); mot.rotation.y = Math.PI;
    var motG = new THREE.Group(); motG.add(mot);
    var mbase = G.mesh(G.roundedBox(0.14, 0.02, 0.2, 0.005, 0.002), wallMat); mbase.position.set(xI, -0.055 * 1.13 - 0.01, mot.position.z); motG.add(mbase);
    var legTop = -0.055 * 1.13 - 0.02, legBot = -Hh - 0.014;
    var leg = G.mesh(G.roundedBox(0.12, legTop - legBot, 0.16, 0.005, 0.002), wallMat); leg.position.set(xI, (legTop + legBot) / 2, mot.position.z); motG.add(leg);
    root.add(motG);
    var cp = new THREE.Group();
    var cpA = G.mesh(G.lathe([[0.009, 0.165], [0.026, 0.165], [0.026, 0.19], [0.009, 0.19]], 48), Mt.cast('#7d8288', 0.6)); cpA.rotation.x = Math.PI / 2; cpA.scale.z = -1; cp.add(cpA);
    var spider = G.mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.01, 32), Mt.rubber(0xe0b020)); spider.rotation.x = Math.PI / 2; spider.position.z = 0.197; cp.add(spider);
    var cpB = G.mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.025, 48), Mt.cast('#7d8288', 0.6)); cpB.rotation.x = Math.PI / 2; cpB.position.z = 0.215; cp.add(cpB);
    sI.add(cp);
    var outPul = G.mesh(G.lathe([[0.017, -0.02], [0.06, -0.02], [0.06, -0.014], [0.052, -0.005], [0.06, 0.004], [0.052, 0.012], [0.06, 0.02], [0.017, 0.02]], 64), Mt.cast('#6f757d', 0.6)); outPul.rotation.x = Math.PI / 2; outPul.position.z = -0.17; sO.add(outPul);
    var state = { rpm: 1440, th: 0, slow: 0.02 };
    var i1 = b1 / a1, i2 = b2 / a2;
    function tick(t, ex, dt) {
      state.th += dt * state.rpm * state.slow * Math.PI / 30;
      sI.rotation.z = state.th; sM.rotation.z = -state.th / i1; sO.rotation.z = state.th / (i1 * i2);
      gA1.rotation.z = 0; gB1.rotation.z = 0; gA2.rotation.z = 0; gB2.rotation.z = 0;
      mot.userData.shaft.rotation.z = -state.th;
    }
    /* stage 2 pinion phase: it sits on the intermediate shaft with its own phase; align by rotating its body */
    gA2.rotation.z = 0;
    tick(0, 0, 0);
    var parts = [
      { name: 'Input shaft and pinion (17 teeth)', obj: sI, off: [0, 0.12, 0.05], at: [0, 0.03, 0.03], photo: 'Category:Helical gears', desc: 'Driven by the motor through a jaw coupling. First-stage helical pinion, module 2.5 mm, 15° helix.' },
      { name: 'Intermediate shaft: wheel 51 and pinion 15', obj: sM, off: [0, 0.2, 0], at: [0, 0.065, 0.03], photo: 'Category:Helical gears', desc: 'A compound shaft: the 51-tooth wheel and the 15-tooth second-stage pinion turn together. The helix hands are chosen so their end thrusts partly cancel on this shaft.' },
      { name: 'Output shaft and wheel (45 teeth)', obj: sO, off: [0.05, 0.14, -0.06], at: [0, 0.085, -0.03], photo: 'Category:Helical gears', desc: 'Ratio = (51/17)(45/15) = 3 × 3 = 9. At 1440 rpm in, the output turns at 160 rpm with nine times the torque (less about 2% loss per stage).' },
      { name: 'Housing (top half removed)', obj: hous, off: [0, -0.12, 0], at: [0.1, -0.05, 0.08], photo: 'Category:Gearboxes', desc: 'Cast iron, split at the shaft centre line so the shafts and bearings drop in. The gears dip into the oil and splash it onto the bearings; the sight glass shows the level.' },
      { name: 'Motor and coupling', obj: motG, off: [0, 0, 0.14], at: [0, 0.06, 0.3], photo: 'Category:Electric motors', desc: 'Four-pole induction motor, 1440 rpm. The rubber spider of the coupling absorbs shock and small misalignment.' }
    ];
    return {
      group: root, parts: parts, cam: [0.5, 0.45, 0.62], target: [0.12, -0.02, 0.05], tick: tick, fit: 0.82,
      controls: [{ label: 'Animation speed', unit: '% of real', min: 0.5, max: 5, step: 0.5, value: 2, fmt: function (v) { return v.toFixed(1); }, set: function (v) { state.slow = v / 100; } }],
      hud: function () { return 'Input 1440 rpm, intermediate ' + (1440 / i1).toFixed(0) + ' rpm, output ' + (1440 / i1 / i2).toFixed(0) + ' rpm<br>Overall ratio (51/17)(45/15) = 9; shown at ' + (state.slow * 100).toFixed(1) + '% of real speed'; }
    };
  };
})();
