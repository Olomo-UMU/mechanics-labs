/* models-ch3.js: universal vibration apparatus (pivoted beam, spring, dashpot, unbalanced exciter, drum recorder) */
(function () {
  'use strict';
  M3D.builders.vibrig = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var root = new THREE.Group();
    var frameM = Mt.castPaint(0x3a3f46, 0.5), blue = Mt.castPaint(0x1f4f7a, 0.5), steel = Mt.metal(0xc3c7cc, 0.26), bright = Mt.metal(0xdadde1, 0.16), dark = Mt.metal(0x7d838b, 0.4), bolts = Mt.metal(0x9aa0a8, 0.35), springM = Mt.metal(0x2b2e33, 0.35);
    /* beam pivots at x = 0, y = Hb; pen at x = Lb */
    var Lb = 0.8, Hb = 0.55, xs = 0.6, xd = 0.3, xe = 0.5, topY = 1.05;
    var P = { mb: 4, me: 4.5, k: 3000, c: 60, mue: 0.02, rpm: 0, on: true };
    function I() { return P.mb * Lb * Lb / 3 + P.me * xe * xe; }
    /* ---------- frame ---------- */
    var frame = new THREE.Group();
    var base = G.mesh(G.roundedBox(1.15, 0.05, 0.45, 0.01, 0.004), frameM); base.position.set(0.42, 0.025, 0); frame.add(base);
    function post(x) { var p = G.mesh(G.roundedBox(0.05, topY, 0.08, 0.004, 0.002), frameM); p.position.set(x, topY / 2 + 0.05, 0); frame.add(p); }
    post(-0.06); post(0.92);
    var top = G.mesh(G.roundedBox(1.04, 0.06, 0.1, 0.004, 0.002), frameM); top.position.set(0.43, topY + 0.05, 0); frame.add(top);
    /* pivot bracket */
    var pb = G.mesh(G.roundedBox(0.06, 0.1, 0.12, 0.004, 0.002), frameM); pb.position.set(-0.01, Hb, 0); frame.add(pb);
    var pinM = G.mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.14, 20), bright); pinM.rotation.x = Math.PI / 2; pinM.position.set(0, Hb, 0); frame.add(pinM);
    /* spring anchor with adjusting screw */
    var screw = G.mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 20), Mt.knurl(0xb9bec4)); screw.position.set(xs, topY - 0.01, 0); frame.add(screw);
    var hw = G.mesh(new THREE.TorusGeometry(0.035, 0.005, 12, 40), dark); hw.rotation.x = Math.PI / 2; hw.position.set(xs, topY + 0.1, 0); frame.add(hw);
    /* dashpot cylinder on the base */
    var dash = G.mesh(G.lathe([[0.012, 0], [0.04, 0], [0.04, 0.2], [0.036, 0.2], [0.036, 0.012], [0.012, 0.012]], 48), Mt.metal(0xb9bec4, 0.3)); dash.position.set(xd, 0.05, 0); frame.add(dash);
    var oil = G.mesh(new THREE.CylinderGeometry(0.0355, 0.0355, 0.15, 40), Mt.oil()); oil.position.set(xd, 0.05 + 0.087, 0); frame.add(oil);
    var valve = G.mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 16), Mt.knurl(0xc9a24f)); valve.rotation.z = Math.PI / 2; valve.position.set(xd + 0.052, 0.09, 0); frame.add(valve);
    /* recorder drum */
    var rec = new THREE.Group();
    var cvs = document.createElement('canvas'); cvs.width = 1024; cvs.height = 256; var cx = cvs.getContext('2d');
    cx.fillStyle = '#fbfaf5'; cx.fillRect(0, 0, 1024, 256); cx.fillStyle = '#d6dbe2'; for (var gx = 0; gx < 1024; gx += 64) cx.fillRect(gx, 0, 1, 256); for (var gy = 0; gy <= 256; gy += 32) cx.fillRect(0, gy, 1024, 1); cx.fillStyle = '#b9c0c9'; cx.fillRect(0, 128, 1024, 1);
    var ptex = T.canvasTex(cvs, true); ptex.wrapS = THREE.RepeatWrapping;
    var drum = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 64, 1, true), new THREE.MeshStandardMaterial({ map: ptex, roughness: 0.8, metalness: 0 }));
    drum.castShadow = true; drum.receiveShadow = true; rec.add(drum);
    [-1, 1].forEach(function (k) { var e = G.mesh(new THREE.CylinderGeometry(0.073, 0.073, 0.008, 64), dark); e.position.y = k * 0.084; rec.add(e); });
    var ax = G.mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 16), bright); rec.add(ax);
    var recBox = G.mesh(G.roundedBox(0.2, 0.1, 0.18, 0.01, 0.004), blue); recBox.position.y = -0.14; rec.add(recBox);
    var recG = new THREE.Group(); recG.add(rec); recG.position.set(Lb + 0.0, Hb, 0.0 - 0.0); recG.position.set(Lb + 0.1, Hb, 0); recG.rotation.x = 0;
    rec.position.set(0, 0, 0); rec.rotation.z = 0;
    var recStand = G.mesh(G.roundedBox(0.05, Hb - 0.24, 0.05, 0.004, 0.002), frameM); recStand.position.set(Lb + 0.1, (Hb - 0.19) / 2 + 0.05 - 0.02, 0); frame.add(recStand);
    root.add(recG);
    var plate = G.decal(0.16, 0.06, T.label(480, 180, '#e6e2d6', [['UNIVERSAL VIBRATION', 40, 700], ['APPARATUS', 40, 700], ['f_n about 3.7 Hz', 30]], '#333')); plate.position.set(0.42, 0.05, 0.2255); plate.rotation.x = 0; frame.add(plate);
    root.add(frame);
    /* ---------- moving beam with exciter, piston rod and pen ---------- */
    var beam = new THREE.Group();
    var bb = G.mesh(G.roundedBox(Lb + 0.04, 0.04, 0.05, 0.004, 0.002), Mt.metal(0xb7bcc2, 0.35)); bb.position.x = Lb / 2; beam.add(bb);
    var eye = G.mesh(G.ring(0.022, 0.009, 0.06, 32), dark); eye.rotation.x = Math.PI / 2; beam.add(eye);
    /* exciter: motor on a plate with two counter-rotating unbalanced discs */
    var ex = new THREE.Group();
    var exPlate = G.mesh(G.roundedBox(0.16, 0.012, 0.22, 0.004, 0.002), dark); exPlate.position.y = 0.026; ex.add(exPlate);
    var mot = K.motor(0.045, 0.1, 0x1f4f7a, 'EXCITER'); mot.position.set(0, 0.032 + 0.045 * 1.13, -0.03); ex.add(mot);
    var discs = [];
    [-1, 1].forEach(function (k) {
      var dg = new THREE.Group();
      var dsk = G.mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 48), bright); dsk.rotation.x = Math.PI / 2; dg.add(dsk);
      var mass = G.mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.016, 24), Mt.paint(0xa8141c, 0.3)); mass.rotation.x = Math.PI / 2; mass.position.y = 0.035; dg.add(mass);
      var nutD = K.nut(0.01, bolts); nutD.rotation.x = Math.PI / 2; nutD.position.z = 0.006; dg.add(nutD);
      dg.position.set(k * 0.03, 0.032 + 0.045 * 1.13, 0.075 + (k > 0 ? 0.015 : 0)); ex.add(dg); discs.push({ g: dg, k: k });
    });
    var gearbox = G.mesh(G.roundedBox(0.1, 0.07, 0.03, 0.006, 0.003), blue); gearbox.position.set(0, 0.032 + 0.045 * 1.13, 0.05); ex.add(gearbox);
    ex.position.x = xe; beam.add(ex);
    /* spring and damper attachments */
    var sEye = G.mesh(G.ring(0.012, 0.006, 0.03, 24), dark); sEye.rotation.x = Math.PI / 2; sEye.position.set(xs, 0.03, 0); beam.add(sEye);
    var dLug = G.mesh(G.roundedBox(0.03, 0.02, 0.03, 0.003, 0.001), dark); dLug.position.set(xd, -0.03, 0); beam.add(dLug);
    var penArm = G.mesh(G.roundedBox(0.09, 0.008, 0.012, 0.002, 0.001), dark); penArm.position.set(Lb + 0.035, 0, 0.0); beam.add(penArm);
    var pen = G.mesh(new THREE.ConeGeometry(0.006, 0.025, 16), Mt.paint(0x1d5fae, 0.3)); pen.rotation.z = -Math.PI / 2; pen.position.set(Lb + 0.025, 0, 0); beam.add(pen);
    beam.position.set(0, Hb, 0); root.add(beam);
    /* spring (stretches between frame and beam) */
    var spring = K.coil(0.026, 0.0042, 14, 1, springM); var springG = new THREE.Group(); springG.add(spring); root.add(springG);
    var rod = K.unitRod(0.006, bright); root.add(rod);
    var piston = G.mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.012, 32), dark); root.add(piston);
    /* ---------- dynamics ---------- */
    var S = { phi: 0, w: 0, th: 0, t: 0, hist: [], amp: 0, ampT: 0, maxA: 0, col: 0 };
    function step(h) {
      var Om = P.on ? P.rpm * Math.PI / 30 : 0;
      var kt = P.k * xs * xs, ct = P.c * xd * xd;
      var M = P.mue * Om * Om * Math.cos(S.th) * xe; /* vertical component of the two discs (horizontal parts cancel) */
      var acc = (M - ct * S.w - kt * S.phi) / I();
      S.w += acc * h; S.phi += S.w * h; S.th += Om * h; S.t += h;
    }
    function tick(time, exx, dt) {
      var n = Math.max(1, Math.ceil(dt / 0.001)), h = dt / n;
      for (var i = 0; i < n; i++) step(h);
      var y = S.phi * Lb;
      beam.rotation.z = S.phi;
      discs.forEach(function (d) { d.g.rotation.z = d.k * S.th; });
      mot.userData.shaft.rotation.z = S.th;
      /* spring from the screw down to the beam eye */
      var sy = Hb + Math.sin(S.phi) * xs + 0.03, sx = xs;
      spring.scale.y = (topY - 0.07) - sy; springG.position.set(sx, sy, 0);
      var dy = Hb + Math.sin(S.phi) * xd - 0.04;
      K.orient(rod, K.V(xd, 0.2, 0), K.V(xd, dy, 0)); piston.position.set(xd, 0.2, 0);
      /* recorder: drum turns, pen draws */
      S.col += dt * 60;
      drum.rotation.y = -S.col / 1024 * Math.PI * 2;
      var c = Math.floor(S.col) % 1024;
      cx.fillStyle = '#fbfaf5'; cx.fillRect(c + 2, 0, 6, 256);
      cx.fillStyle = '#d6dbe2'; for (var gy2 = 0; gy2 <= 256; gy2 += 32) cx.fillRect(c + 2, gy2, 6, 1);
      if ((c + 2) % 64 < 6) cx.fillRect(c + 2 + (64 - (c + 2) % 64) % 64, 0, 1, 256);
      cx.fillStyle = '#b9c0c9'; cx.fillRect(c + 2, 128, 6, 1);
      var py = 128 - U.clamp(y * 3000, -120, 120);
      if (S.lastY != null) { cx.strokeStyle = '#1d5fae'; cx.lineWidth = 2.2; cx.beginPath(); cx.moveTo(c - 1, S.lastY); cx.lineTo(c, py); cx.stroke(); }
      S.lastY = py; ptex.needsUpdate = true;
      /* amplitude over the last second */
      S.maxA = Math.max(S.maxA, Math.abs(y)); S.ampT += dt; if (S.ampT > 1.2) { S.amp = S.maxA; S.maxA = 0; S.ampT = 0; }
    }
    function theory() {
      var kt = P.k * xs * xs, ct = P.c * xd * xd, Ii = I(), wn = Math.sqrt(kt / Ii), z = ct / (2 * Math.sqrt(kt * Ii)), Om = P.rpm * Math.PI / 30, r = Om / wn;
      var Mst = P.mue * Om * Om * xe / kt, mf = 1 / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * z * r, 2));
      return { wn: wn, z: z, r: r, X: Mst * mf * Lb, mf: mf };
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Beam (pivoted at the left)', obj: beam, off: [0, 0.25, 0.25], at: [0.15, 0.02, 0.025], photo: 'Category:Vibration', desc: 'Rigid steel beam that swings about the left pivot: a single-degree-of-freedom system with I = mL²/3 + m_e x_e² about the pivot.' },
      { name: 'Exciter (unbalanced discs)', obj: ex, off: [0, 0.2, 0.3], at: [0, 0.08, 0.08], photo: 'Category:Vibration', desc: 'Two discs carrying equal red masses turn in opposite directions, so the side forces cancel and only a vertical force m e ω² cos ωt remains: forcing due to unbalance.' },
      { name: 'Spring', obj: springG, off: [0, 0.1, -0.25], at: [0.026, 0.3, 0], photo: 'Category:Coil springs', desc: 'Stiffness 3 kN/m acting 0.6 m from the pivot, so the torsional stiffness is k b². The hand screw at the top sets the beam level.' },
      { name: 'Dashpot (adjustable damper)', obj: frame, off: [0, -0.15, -0.2], at: [0.33, 0.25, 0.04], photo: 'Category:Dashpots', desc: 'A piston in oil. Turning the brass valve changes the orifice and so the damping coefficient c (lab slider).' },
      { name: 'Drum recorder', obj: recG, off: [0.25, 0, 0], at: [0, 0.08, 0.07], photo: 'Category:Chart recorders', desc: 'The drum turns at constant speed under the pen on the beam end, so it draws displacement against time. Measure amplitude, period and successive peaks for the logarithmic decrement directly from the record.' }
    ];
    return {
      group: root, parts: parts, cam: [1.25, 1.0, 1.45], target: [0.42, 0.55, 0], tick: tick, fit: 0.8, labTitle: 'Vibration lab',
      controls: [
        { label: 'Exciter speed', unit: 'rpm', min: 0, max: 600, step: 2, value: 0, fmt: function (v) { return v.toFixed(0); }, set: function (v) { P.rpm = v; } },
        { label: 'Damping c', unit: 'N s/m', min: 5, max: 300, step: 5, value: 60, fmt: function (v) { return v.toFixed(0); }, set: function (v) { P.c = v; } },
        { label: 'Spring k', unit: 'kN/m', min: 1, max: 6, step: 0.5, value: 3, fmt: function (v) { return v.toFixed(1); }, set: function (v) { P.k = v * 1000; } }
      ],
      buttons: [
        { label: 'Pluck (free vibration)', fn: function () { P.rpm = 0; var i = document.activeElement; S.phi = 0.03; S.w = 0; var r = document.querySelectorAll('.m3d[data-model="vibrig"] .lab input')[0]; if (r) { r.value = 0; r.dispatchEvent(new Event('input')); } } },
        { label: 'Go to resonance', fn: function () { var t = theory(); var r = document.querySelectorAll('.m3d[data-model="vibrig"] .lab input')[0]; if (r) { r.value = Math.round(t.wn * 30 / Math.PI); r.dispatchEvent(new Event('input')); } } }
      ],
      hud: function () {
        var t = theory();
        return '<b>f<sub>n</sub> = ' + (t.wn / (2 * Math.PI)).toFixed(2) + ' Hz (' + (t.wn * 30 / Math.PI).toFixed(0) + ' rpm), ζ = ' + t.z.toFixed(3) + '</b><br>' +
          'Exciter ' + P.rpm.toFixed(0) + ' rpm, ω/ω<sub>n</sub> = ' + t.r.toFixed(2) + '<br>' +
          'Pen amplitude: measured ' + (S.amp * 1000).toFixed(1) + ' mm, theory ' + (t.X * 1000).toFixed(1) + ' mm (steady state)';
      }
    };
  };
})();
