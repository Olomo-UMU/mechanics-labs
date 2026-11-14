/* Chapter 5: planetary gear set with true involute teeth (axis along z) */
(function () {
  'use strict';
  M3D.builders.planetary = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, T = M3D.tex;
    var m = 0.004, S = 24, P = 36, A = S + 2 * P, n = 3, phi = 20 * Math.PI / 180, w = 0.03;
    var root = new THREE.Group();
    function shapeOf(pts) { return new THREE.Shape(pts.map(function (p) { return new THREE.Vector2(p[0] * m, p[1] * m); })); }
    function gearGeo(o) { var g = new THREE.ExtrudeGeometry(shapeOf(o.pts), { depth: w, bevelEnabled: true, bevelThickness: 0.0008, bevelSize: 0.0005, bevelSegments: 1, curveSegments: 4 }); g.translate(0, 0, -w / 2); g.computeVertexNormals(); return g; }
    var steelS = Mt.metal(0xc7a960, 0.3), steelP = Mt.metal(0xb7bdc5, 0.28), ringM = Mt.metal(0x6f757d, 0.42), paint = Mt.paint(0x1f4f7a, 0.45), shaftM = Mt.metal(0xd3d7dc, 0.2);

    /* sun with shaft */
    var sun = new THREE.Group();
    var gS = Gear.outline(S, 1, phi, 1, 1.25, 0);
    sun.add(G.mesh(gearGeo(gS), steelS));
    var sh = G.mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 32), shaftM); sh.rotation.x = Math.PI / 2; sh.position.z = 0.09; sun.add(sh);
    var key = G.mesh(new THREE.BoxGeometry(0.006, 0.004, 0.05), Mt.metal(0x8a9098, 0.4)); key.position.set(0, 0.019, 0.13); sun.add(key);
    root.add(sun);

    /* planets */
    var planetsG = new THREE.Group(), planets = [];
    var gP = Gear.outline(P, 1, phi, 1, 1.25, 0), pGeo = gearGeo(gP), rc = (S + P) / 2 * m;
    for (var j = 0; j < n; j++) {
      var g = 2 * Math.PI * j / n, ph = Gear.meshPhase(S, 0, g, P, false);
      var pg = new THREE.Group(); pg.add(G.mesh(pGeo, steelP));
      var bore = G.mesh(G.ring(0.016, 0.011, w + 0.002, 32), Mt.metal(0x9aa0a8, 0.3)); bore.rotation.x = Math.PI / 2; pg.add(bore);
      planetsG.add(pg); planets.push({ g: g, ph: ph, obj: pg });
    }
    root.add(planetsG);

    /* carrier: plate behind, pins, output shaft */
    var car = new THREE.Group();
    var plate = G.mesh(G.extrude((function () { var s = new THREE.Shape(); for (var i = 0; i <= 3 * 24; i++) { var a = i / (3 * 24) * Math.PI * 2; var rr = 0.075 + 0.045 * Math.pow(Math.cos(1.5 * a), 2); if (i) s.lineTo(rr * Math.cos(a), rr * Math.sin(a)); else s.moveTo(rr * Math.cos(a), rr * Math.sin(a)); } return s; })(), 0.012, 0.002), paint);
    plate.position.z = -w / 2 - 0.012; car.add(plate);
    for (var k = 0; k < n; k++) { var a2 = 2 * Math.PI * k / n; var pin = G.mesh(new THREE.CylinderGeometry(0.011, 0.011, w + 0.03, 24), shaftM); pin.rotation.x = Math.PI / 2; pin.position.set(rc * Math.cos(a2), rc * Math.sin(a2), -0.004); car.add(pin); }
    var out = G.mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.12, 32), shaftM); out.rotation.x = Math.PI / 2; out.position.z = -w / 2 - 0.07; car.add(out);
    root.add(car);

    /* annulus with housing flange (held) */
    var ring = new THREE.Group();
    var phR = Gear.meshPhase(P, planets[0].ph, 0, A, true);
    var gA = Gear.internal(A, 1, phi, phR);
    var outer = new THREE.Shape(); outer.absarc(0, 0, (A / 2 + 4) * m, 0, Math.PI * 2, false);
    outer.holes.push(new THREE.Path(gA.pts.map(function (p) { return new THREE.Vector2(p[0] * m, p[1] * m); })));
    var rg = new THREE.ExtrudeGeometry(outer, { depth: w, bevelEnabled: false, curveSegments: 96 }); rg.translate(0, 0, -w / 2); rg.computeVertexNormals();
    ring.add(G.mesh(rg, ringM));
    var fl = G.mesh(G.ring((A / 2 + 9) * m, (A / 2 + 3.5) * m, 0.012, 96), paint); fl.rotation.x = Math.PI / 2; fl.position.z = -w / 2 + 0.006; ring.add(fl);
    for (var b = 0; b < 8; b++) { var a3 = b / 8 * Math.PI * 2; var bolt = G.mesh(G.hex(0.012, 0.007), Mt.metal(0xb9bec4, 0.3)); bolt.rotation.x = Math.PI / 2; bolt.position.set((A / 2 + 6.5) * m * Math.cos(a3), (A / 2 + 6.5) * m * Math.sin(a3), -w / 2 + 0.015); ring.add(bolt); }
    var arm = G.mesh(G.roundedBox(0.05, 0.11, 0.012, 0.01, 0.003), paint); arm.position.set(0, -(A / 2 + 12) * m, -w / 2 + 0.006); ring.add(arm);
    var lab = G.decal(0.045, 0.022, T.label(320, 160, '#e9e6dc', [['HELD', 40, 700], ['torque arm', 30]], '#333')); lab.position.set(0, -(A / 2 + 12) * m - 0.012, -w / 2 + 0.0125); ring.add(lab);
    root.add(ring);

    function tick(t) {
      var ts = t * 1.2, tc = ts * S / (S + A);
      sun.rotation.z = ts; car.rotation.z = tc;
      planets.forEach(function (p) {
        var a = p.g + tc; p.obj.position.set(rc * Math.cos(a), rc * Math.sin(a), 0);
        p.obj.rotation.z = p.ph + tc - (S / P) * (ts - tc);
      });
    }
    tick(0);
    var parts = [
      { name: 'Sun gear and input shaft', obj: sun, off: [0, 0, 0.16], at: [0, 0.03, 0.02], photo: 'Category:Epicyclic gearing', desc: '24 teeth, module 4 mm, 20° involute. It is the input here. With the annulus held, the arm turns at T_S/(T_S + T_A) = 24/120 of its speed: a 5 to 1 reduction.' },
      { name: 'Planet gears (three)', obj: planetsG, off: [0, 0, 0.07], at: [0.12, 0, 0.015], photo: 'Category:Epicyclic gearing', desc: '36 teeth each. They mesh with the sun outside and the annulus inside and share the load three ways. (T_S + T_A)/3 = 40 is a whole number, so three planets fit equally spaced.' },
      { name: 'Carrier (arm) and output shaft', obj: car, off: [0, 0, -0.1], at: [0.0, 0.1, -0.03], photo: 'Category:Epicyclic gearing', desc: 'Carries the planet pins and is the output. It turns the same way as the sun, five times slower, with five times the torque (less friction).' },
      { name: 'Annulus (internal gear), held', obj: ring, off: [0, 0, -0.22], at: [0.0, -0.2, 0.016], photo: 'Category:Epicyclic gearing', desc: '96 internal teeth = 24 + 2 × 36. It is held by the torque arm, which must resist the holding torque: four times the input torque here. In an automatic gearbox a brake band does this job.' }
    ];
    return { group: root, parts: parts, cam: [0.32, 0.22, 0.62], target: [0, 0, 0], tick: tick, noGround: true, fit: 0.9 };
  };
})();
