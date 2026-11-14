/* Chapter 4 procedural models: single-plate clutch, deep-groove ball bearing, screw jack */
(function () {
  'use strict';

  /* sweep a closed (r, y) profile along a helix about Y: square threads */
  function sweep(THREE, prof, turns, pitch, seg) {
    var n = Math.round(turns * seg), m = prof.length, pos = [], idx = [];
    for (var i = 0; i <= n; i++) {
      var a = i / seg * Math.PI * 2, dy = pitch * i / seg;
      for (var j = 0; j < m; j++) pos.push(prof[j][0] * Math.cos(a), prof[j][1] + dy, -prof[j][0] * Math.sin(a));
    }
    for (var i2 = 0; i2 < n; i2++) for (var j2 = 0; j2 < m; j2++) {
      var a0 = i2 * m + j2, a1 = i2 * m + (j2 + 1) % m, b0 = a0 + m, b1 = a1 + m;
      idx.push(a0, b0, a1, a1, b0, b1);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function helixSpring(THREE, R, wire, len, coils) {
    var pts = [];
    for (var i = 0; i <= coils * 24; i++) { var a = i / 24 * Math.PI * 2; pts.push(new THREE.Vector3(R * Math.cos(a), R * Math.sin(a), -len / 2 + len * i / (coils * 24))); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), coils * 24, wire, 8, false);
  }
  function onZ(mesh) { mesh.rotation.x = Math.PI / 2; return mesh; }

  /* ================= single-plate clutch (axis along z) ================= */
  M3D.builders.clutch = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, T = M3D.tex;
    var root = new THREE.Group();
    var castIron = Mt.cast('#5d6168', 0.7), machined = Mt.metal(0xc4c8cd, 0.25), steel = Mt.metal(0x9aa0a8, 0.38), black = Mt.paint(0x1f2124, 0.5);
    var lining = new THREE.MeshStandardMaterial({ map: T.lining(), roughness: 0.9, metalness: 0 });

    /* 1 flywheel: z from -0.05 to 0 */
    var fw = new THREE.Group();
    fw.add(onZ(G.mesh(G.lathe([[0.03, -0.05], [0.16, -0.05], [0.165, -0.045], [0.165, -0.004], [0.16, 0], [0.03, 0], [0.03, -0.05]], 96), castIron)));
    var face = onZ(G.mesh(G.ring(0.13, 0.07, 0.0016, 96), machined)); face.position.z = 0.0002; fw.add(face);
    var teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.012, 0.016), Mt.metal(0x7a8088, 0.4), 96);
    var dm = new THREE.Object3D();
    for (var i = 0; i < 96; i++) { var a = i / 96 * Math.PI * 2; dm.position.set(0.169 * Math.cos(a), 0.169 * Math.sin(a), -0.035); dm.rotation.z = a; dm.updateMatrix(); teeth.setMatrixAt(i, dm.matrix); }
    teeth.castShadow = true; fw.add(teeth);
    for (var b = 0; b < 6; b++) { var a2 = b / 6 * Math.PI * 2 + 0.2; var bh = onZ(G.mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 16), steel)); bh.position.set(0.04 * Math.cos(a2), 0.04 * Math.sin(a2), 0.003); fw.add(bh); }
    root.add(fw);

    /* 2 clutch plate (driven disc) */
    var disc = new THREE.Group();
    var plate = onZ(G.mesh(G.ring(0.122, 0.045, 0.0016, 96), steel)); plate.position.z = 0.006; disc.add(plate);
    var l1 = onZ(G.mesh(G.ring(0.125, 0.075, 0.0035, 96), lining)); l1.position.z = 0.0028; disc.add(l1);
    var l2 = onZ(G.mesh(G.ring(0.125, 0.075, 0.0035, 96), lining)); l2.position.z = 0.0092; disc.add(l2);
    for (var rv = 0; rv < 16; rv++) { var a3 = rv / 16 * Math.PI * 2; var riv = onZ(G.mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.0125, 10), Mt.metal(0xb9894a, 0.35))); riv.position.set(0.09 * Math.cos(a3), 0.09 * Math.sin(a3), 0.006); disc.add(riv); }
    var hub = onZ(G.mesh(G.ring(0.032, 0.0135, 0.03, 40), steel)); hub.position.z = 0.012; disc.add(hub);
    var ret1 = onZ(G.mesh(G.ring(0.068, 0.03, 0.0014, 64), Mt.metal(0x8a9098, 0.35))); ret1.position.z = 0.0005; disc.add(ret1);
    var ret2 = onZ(G.mesh(G.ring(0.068, 0.03, 0.0014, 64), Mt.metal(0x8a9098, 0.35))); ret2.position.z = 0.0115; disc.add(ret2);
    var sg = helixSpring(THREE, 0.006, 0.0011, 0.03, 6);
    for (var s = 0; s < 6; s++) {
      var a4 = s / 6 * Math.PI * 2, sp = G.mesh(sg, Mt.metal(0x3d4a5c, 0.35));
      sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-Math.sin(a4), Math.cos(a4), 0));
      sp.position.set(0.05 * Math.cos(a4), 0.05 * Math.sin(a4), 0.006);
      disc.add(sp);
    }
    for (var k = 0; k < 18; k++) { var a5 = k / 18 * Math.PI * 2; var spl = G.mesh(new THREE.BoxGeometry(0.003, 0.004, 0.03), steel); spl.position.set(0.0125 * Math.cos(a5), 0.0125 * Math.sin(a5), 0.012); spl.rotation.z = a5 + Math.PI / 2; disc.add(spl); }
    root.add(disc);

    /* 3 pressure plate */
    var pp = new THREE.Group();
    pp.add(onZ(G.mesh(G.lathe([[0.076, 0.0125], [0.128, 0.0125], [0.128, 0.026], [0.118, 0.03], [0.086, 0.03], [0.076, 0.026], [0.076, 0.0125]], 96), castIron)));
    var ppf = onZ(G.mesh(G.ring(0.127, 0.077, 0.0012, 96), machined)); ppf.position.z = 0.0122; pp.add(ppf);
    for (var lg = 0; lg < 3; lg++) { var a6 = lg / 3 * Math.PI * 2 + 0.5; var lug = G.mesh(G.roundedBox(0.02, 0.026, 0.012, 0.004, 0.002), castIron); lug.position.set(0.138 * Math.cos(a6), 0.138 * Math.sin(a6), 0.022); lug.rotation.z = a6 + Math.PI / 2; pp.add(lug); }
    root.add(pp);

    /* 4 diaphragm spring */
    var dia = new THREE.Group();
    var springSteel = Mt.metal(0x3a3f46, 0.3);
    dia.add(onZ(G.mesh(G.lathe([[0.088, 0.04], [0.13, 0.034], [0.13, 0.0362], [0.088, 0.0422], [0.088, 0.04]], 96), springSteel)));
    var fShape = new THREE.Shape(); fShape.moveTo(-0.0045, 0); fShape.lineTo(0.0045, 0); fShape.lineTo(0.0075, 0.058); fShape.lineTo(-0.0075, 0.058); fShape.closePath();
    var fGeo = G.extrude(fShape, 0.002, 0);
    for (var fi = 0; fi < 18; fi++) {
      var a7 = fi / 18 * Math.PI * 2;
      var fg = G.mesh(fGeo, springSteel);
      var holder = new THREE.Group(); holder.rotation.z = a7 - Math.PI / 2; holder.position.z = 0.0445;
      fg.position.set(0, 0.032, 0); fg.rotation.x = 0.07; holder.add(fg); dia.add(holder);
    }
    root.add(dia);

    /* 5 cover (with windows) */
    var cover = new THREE.Group();
    var pressed = Mt.paint(0x2b2e33, 0.45);
    for (var cw = 0; cw < 3; cw++) {
      var start = cw / 3 * Math.PI * 2 + 0.35;
      cover.add(onZ(G.mesh(G.lathe([[0.135, 0.002], [0.138, 0.002], [0.138, 0.046], [0.136, 0.049], [0.13, 0.049], [0.13, 0.046], [0.135, 0.044], [0.135, 0.002]], 32, start, Math.PI * 2 / 3 - 0.55), pressed)));
    }
    cover.add(onZ(G.mesh(G.lathe([[0.06, 0.049], [0.13, 0.049], [0.13, 0.052], [0.06, 0.052], [0.06, 0.049]], 96), pressed)));
    cover.add(onZ(G.mesh(G.lathe([[0.138, 0.0], [0.172, 0.0], [0.172, 0.003], [0.138, 0.003], [0.138, 0.0]], 96), pressed)));
    for (var cb = 0; cb < 6; cb++) { var a8 = cb / 6 * Math.PI * 2; var bolt = onZ(G.mesh(G.hex(0.011, 0.006), steel)); bolt.position.set(0.156 * Math.cos(a8), 0.156 * Math.sin(a8), 0.006); cover.add(bolt); }
    var lab = G.decal(0.05, 0.025, T.label(400, 200, '#e9e6dc', [['CLUTCH COVER', 34, 700], ['diaphragm type', 28], ['for 250 mm disc', 28]], '#333'));
    lab.position.set(0, 0.095, 0.0528); cover.add(lab);
    root.add(cover);

    /* 6 release bearing */
    var rel = new THREE.Group();
    var relb = onZ(G.mesh(G.ring(0.042, 0.024, 0.016, 48), Mt.metal(0xd1d4d8, 0.25))); relb.position.z = 0.068; rel.add(relb);
    var sleeve = onZ(G.mesh(G.ring(0.026, 0.019, 0.05, 40), black)); sleeve.position.z = 0.095; rel.add(sleeve);
    var fork = G.mesh(G.roundedBox(0.012, 0.09, 0.01, 0.003, 0.002), black); fork.position.set(0.0, -0.06, 0.085); rel.add(fork);
    root.add(rel);

    /* 7 input shaft */
    var sh = new THREE.Group();
    var shaft = onZ(G.mesh(new THREE.CylinderGeometry(0.0118, 0.0118, 0.26, 32), machined)); shaft.position.z = 0.1; sh.add(shaft);
    for (var ss = 0; ss < 18; ss++) { var a9 = ss / 18 * Math.PI * 2; var sl = G.mesh(new THREE.BoxGeometry(0.0026, 0.003, 0.05), machined); sl.position.set(0.0122 * Math.cos(a9), 0.0122 * Math.sin(a9), 0.012); sl.rotation.z = a9 + Math.PI / 2; sh.add(sl); }
    root.add(sh);

    var parts = [
      { name: 'Flywheel', obj: fw, off: [0, 0, -0.16], at: [0.11, 0.11, -0.01], photo: 'File:Flywheel.JPG', desc: 'Bolted to the crankshaft and always turning with the engine. Its machined face is one of the two friction surfaces of the clutch. The ring gear round its edge meshes with the starter motor.' },
      { name: 'Clutch plate (driven disc)', obj: disc, off: [0, 0, 0], at: [-0.1, 0.03, 0.011], photo: 'File:Clutchdisc.jpg', desc: 'Lined with friction material on both faces, so n = 2 pairs of surfaces. Its splined hub slides along the gearbox input shaft. The small coil springs soften the take-up and damp torsional vibration from the engine.' },
      { name: 'Pressure plate', obj: pp, off: [0, 0, 0.1], at: [0.0, -0.12, 0.03], photo: 'File:Pull type clutch.jpg', desc: 'A heavy cast-iron ring that clamps the clutch plate against the flywheel. It also soaks up the heat made while the clutch slips during take-off.' },
      { name: 'Diaphragm spring', obj: dia, off: [0, 0, 0.19], at: [0.05, 0.05, 0.045], photo: 'Category:Clutches', desc: 'A dished spring-steel disc that supplies the clamp force F. Pressing the release bearing on its fingers flips the dish and pulls the pressure plate away: clutch disengaged.' },
      { name: 'Clutch cover', obj: cover, off: [0, 0, 0.27], at: [0.0, 0.135, 0.03], photo: 'Category:Clutches', desc: 'Pressed steel, bolted to the flywheel, so it turns with the engine. It carries the diaphragm spring and the pressure plate. The windows let air through to cool the clutch.' },
      { name: 'Release (thrust) bearing', obj: rel, off: [0, 0, 0.36], at: [0.0, 0.04, 0.068], photo: 'Category:Clutches', desc: 'Pushed by the clutch fork when the pedal goes down. It is a thrust bearing because it presses on fingers that are turning while the sleeve does not.' },
      { name: 'Gearbox input shaft', obj: sh, off: [0, -0.24, 0.12], at: [0, 0.012, 0.18], photo: 'Category:Gearboxes', desc: 'Driven by the clutch plate through its splines. If the resisting torque here exceeds the clutch capacity n μ F R_m, the clutch slips.' }
    ];
    function tick(t) { var a = t * 1.2; [fw, disc, pp, dia, cover, sh].forEach(function (o) { o.rotation.z = a; }); }
    return { group: root, parts: parts, cam: [0.8, 0.3, 0.32], target: [0, 0, 0.05], tick: tick, fit: 0.9 };
  };

  /* ================= deep-groove ball bearing 6205 (scaled ten times) ================= */
  M3D.builders.bearing = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, T = M3D.tex;
    var k = 0.01, root = new THREE.Group();
    var race = Mt.metal(0xd5d8dc, 0.18), ballM = Mt.metal(0xeef0f3, 0.06), cageM = Mt.metal(0xb88a3e, 0.32);
    function arcPts(r0, sign, y0, y1, n) { var p = []; for (var i = 0; i <= n; i++) { var y = y0 + (y1 - y0) * i / n; p.push([19.25 + sign * Math.sqrt(Math.max(0, 4.1 * 4.1 - y * y)), y]); } return p; }
    var inner = [[12.5, -7.5], [16.7, -7.5], [17.0, -7.2], [17.0, -3.43]].concat(arcPts(19.25, -1, -3.43, 3.43, 24)).concat([[17.0, 3.43], [17.0, 7.2], [16.7, 7.5], [12.5, 7.5], [12.5, -7.5]]);
    var outer = [[26, 7.5], [21.8, 7.5], [21.5, 7.2], [21.5, 3.43]].concat(arcPts(19.25, 1, 3.43, -3.43, 24)).concat([[21.5, -3.43], [21.5, -7.2], [21.8, -7.5], [26, -7.5], [26, 7.5]]);
    function sc(p) { return p.map(function (q) { return [q[0] * k, q[1] * k]; }); }
    race.side = THREE.DoubleSide;
    var outerM = G.mesh(G.lathe(sc(outer), 96), race); var outerG = new THREE.Group(); outerG.add(outerM);
    var lab = G.decal(7 * k, 2.6 * k, (function () { var c = document.createElement('canvas'); c.width = 280; c.height = 104; var x = c.getContext('2d'); x.fillStyle = 'rgba(40,44,50,0.85)'; x.font = '700 64px Arial'; x.textAlign = 'center'; x.fillText('6205', 140, 74); return T.canvasTex(c, true); })());
    lab.rotation.x = -Math.PI / 2; lab.position.set(0, 7.5 * k + 0.0004, 23.8 * k); outerG.add(lab);
    root.add(outerG);
    var innerG = new THREE.Group(); innerG.add(G.mesh(G.lathe(sc(inner), 96), race)); root.add(innerG);
    var balls = new THREE.Group();
    for (var i = 0; i < 9; i++) { var a = i / 9 * Math.PI * 2; var b = G.mesh(new THREE.SphereGeometry(3.97 * k, 32, 24), ballM); b.position.set(19.25 * k * Math.cos(a), 0, 19.25 * k * Math.sin(a)); balls.add(b); }
    root.add(balls);
    var cage = new THREE.Group();
    [-1, 1].forEach(function (s) {
      var ring = G.mesh(G.lathe(sc([[18.3, s * 4.3], [20.2, s * 4.3], [20.2, s * 4.9], [18.3, s * 4.9], [18.3, s * 4.3]]), 96), cageM); cage.add(ring);
    });
    for (var j = 0; j < 9; j++) { var a2 = (j + 0.5) / 9 * Math.PI * 2; var rvt = G.mesh(new THREE.CylinderGeometry(0.8 * k, 0.8 * k, 10.6 * k, 12), cageM); rvt.position.set(19.25 * k * Math.cos(a2), 0, 19.25 * k * Math.sin(a2)); cage.add(rvt); }
    root.add(cage);
    root.rotation.x = 0.0;
    var parts = [
      { name: 'Outer race', obj: outerG, off: [0, -0.2, 0], at: [-0.25, 0.0, 0.05], photo: 'File:Deep Groove Ball Bearing.jpg', desc: 'A tight fit in the housing, so it does not turn relative to it. The groove radius is slightly larger than the ball radius, so each ball touches it over a small spot: rolling, not sliding.' },
      { name: 'Inner race', obj: innerG, off: [0, 0.36, 0], at: [0.0, 0.07, -0.16], photo: 'File:Ball bearing.jpg', desc: 'A press fit on the shaft and turns with it. The 6205 has a 25 mm bore, 52 mm outside diameter and 15 mm width (shown ten times full size).' },
      { name: 'Balls', obj: balls, off: [0, 0, 0], at: [0.1925 * Math.cos(0), 0.04, 0], photo: 'Category:Ball bearings', desc: 'Nine hardened chromium-steel balls. They roll between the races, so the friction is rolling friction: far lower than sliding at start-up, which is why a loaded shaft turns easily.' },
      { name: 'Cage (retainer)', obj: cage, off: [0, 0.18, 0], at: [0.0, 0.049, 0.2], photo: 'Category:Ball bearings', desc: 'A light pressed-brass or steel cage keeps the balls evenly spaced so they do not rub on each other. If the cage breaks, the balls bunch up and the bearing seizes within minutes.' }
    ];
    function tick(t) { innerG.rotation.y = t * 1.6; balls.rotation.y = t * 0.6; cage.rotation.y = t * 0.6; balls.children.forEach(function (bb) { bb.rotation.z = t * 4; }); }
    return { group: root, parts: parts, cam: [0.35, 0.55, 0.75], target: [0, 0, 0], tick: tick, fit: 1.0 };
  };

  /* ================= screw jack ================= */
  M3D.builders.jack = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, T = M3D.tex;
    var root = new THREE.Group();
    var red = Mt.paint(0x6a1212, 0.5), bronze = Mt.metal(0xb88a4a, 0.35), steel = Mt.metal(0xbfc4ca, 0.28), dark = Mt.metal(0x6e747c, 0.4);
    /* 1 body */
    var body = new THREE.Group();
    body.add(G.mesh(G.lathe([[0.022, 0.0], [0.095, 0.0], [0.095, 0.014], [0.085, 0.022], [0.05, 0.05], [0.036, 0.19], [0.042, 0.2], [0.042, 0.212], [0.022, 0.212], [0.022, 0.0]], 64), red));
    for (var rb = 0; rb < 4; rb++) { var a = rb / 4 * Math.PI * 2 + Math.PI / 4; var rib = G.mesh(G.extrude((function () { var s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.05, 0); s.lineTo(0, 0.13); s.closePath(); return s; })(), 0.008), red); var hold = new THREE.Group(); hold.rotation.y = a; rib.position.set(0.034, 0.018, 0); hold.add(rib); body.add(hold); }
    var pad = G.mesh(G.roundedBox(0.05, 0.034, 0.006, 0.004, 0.0015), red); pad.position.set(0, 0.095, 0.045); body.add(pad);
    var plate = G.decal(0.044, 0.028, T.label(300, 190, '#f1c400', [['SAFE WORKING', 30, 700], ['LOAD 3 t', 46, 700], ['Do not work under', 22], ['a load on a jack', 22]], '#111'));
    plate.position.set(0, 0.095, 0.0485); body.add(plate);
    root.add(body);
    /* 2 nut */
    var nut = new THREE.Group();
    nut.add(G.mesh(G.lathe([[0.0185, 0.2], [0.044, 0.2], [0.044, 0.212], [0.034, 0.214], [0.034, 0.236], [0.0185, 0.236], [0.0185, 0.2]], 48), bronze));
    root.add(nut);
    /* 3 screw with square thread */
    var screw = new THREE.Group();
    var core = G.mesh(new THREE.CylinderGeometry(0.0142, 0.0142, 0.22, 32), steel); core.position.y = 0.21; screw.add(core);
    var th = G.mesh(sweep(THREE, [[0.014, 0.0], [0.0185, 0.0], [0.0185, 0.0035], [0.014, 0.0035]], 26, 0.007, 40), steel); th.position.y = 0.105; screw.add(th);
    var head = G.mesh(G.lathe([[0, 0.318], [0.026, 0.318], [0.028, 0.322], [0.028, 0.356], [0.026, 0.36], [0, 0.36]], 48), steel); screw.add(head);
    root.add(screw);
    /* 4 tommy bar */
    var bar = new THREE.Group();
    var rod = G.mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.42, 20), dark); rod.rotation.z = Math.PI / 2; rod.position.y = 0.339; bar.add(rod);
    [-0.21, 0.21].forEach(function (x) { var e = G.mesh(new THREE.SphereGeometry(0.011, 20, 14), dark); e.position.set(x, 0.339, 0); bar.add(e); });
    var grip = G.mesh(new THREE.CylinderGeometry(0.0105, 0.0105, 0.11, 20), Mt.rubber(0x1c1c1c)); grip.rotation.z = Math.PI / 2; grip.position.set(0.15, 0.339, 0); bar.add(grip);
    root.add(bar);
    /* 5 thrust collar */
    var col = new THREE.Group();
    col.add(G.mesh(G.ring(0.03, 0.01, 0.005, 48), Mt.metal(0xd8dbe0, 0.15)).translateY(0.3625));
    root.add(col);
    /* 6 load cup */
    var cup = new THREE.Group();
    cup.add(G.mesh(G.lathe([[0.012, 0.365], [0.036, 0.365], [0.038, 0.369], [0.038, 0.392], [0.03, 0.392], [0.026, 0.386], [0.0, 0.386]], 64), dark));
    for (var sr = 0; sr < 16; sr++) { var a3 = sr / 16 * Math.PI * 2; var tooth = G.mesh(new THREE.BoxGeometry(0.004, 0.005, 0.014), dark); tooth.position.set(0.032 * Math.cos(a3), 0.394, 0.032 * Math.sin(a3)); tooth.rotation.y = -a3; cup.add(tooth); }
    root.add(cup);
    var parts = [
      { name: 'Body (base)', obj: body, off: [0, -0.16, 0], at: [-0.06, 0.04, 0.03], photo: 'File:Jackscrew.jpg', desc: 'Cast iron with a wide base, so the load cannot tip it. It holds the nut and takes the full load down to the ground.' },
      { name: 'Nut', obj: nut, off: [0, -0.07, 0], at: [0.04, 0.206, 0.0], photo: 'File:Jackscrew.jpg', desc: 'Bronze, fixed in the body. The screw thread slides on it, so it is the pair that has friction angle φ. Bronze against steel keeps μ low and wears the cheaper part.' },
      { name: 'Screw (square thread)', obj: screw, off: [0, 0, 0], at: [0.018, 0.25, 0], photo: 'File:Jackscrew.jpg', desc: 'Mean diameter about 32 mm and pitch 7 mm, so α is about 4°. With μ about 0.12, φ is about 7°: α is less than φ, so the jack is self-locking and holds the load when you let go.' },
      { name: 'Tommy bar (lever)', obj: bar, off: [0, 0.03, 0.2], at: [0.19, 0.339, 0], photo: 'Category:Car jacks', desc: 'The effort P acts at the end of this lever. A longer bar gives more mechanical advantage, MA = (L/r) cot(α + φ), but more turns for the same lift.' },
      { name: 'Thrust collar', obj: col, off: [0, 0.08, 0], at: [0.025, 0.365, 0], photo: 'Category:Washers (hardware)', desc: 'The load cup does not turn, so it rubs on this collar: collar friction μ_c W R_c adds to the thread torque. A thrust ball bearing here roughly doubles the jack efficiency.' },
      { name: 'Load cup (swivel head)', obj: cup, off: [0, 0.15, 0], at: [-0.03, 0.39, 0], photo: 'Category:Car jacks', desc: 'Swivels so the load does not turn with the screw. The serrations grip the load so it cannot slide off.' }
    ];
    return { group: root, parts: parts, cam: [0.55, 0.42, 0.75], target: [0, 0.19, 0], fit: 0.95 };
  };
})();
