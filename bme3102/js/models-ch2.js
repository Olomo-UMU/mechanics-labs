/* models-ch2.js: C-frame punching press with flywheel, gear reduction and live speed-fluctuation simulation */
(function () {
  'use strict';
  M3D.builders.press = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var root = new THREE.Group();
    var paint = Mt.castPaint(0x2f4f6f, 0.5), paintD = Mt.castPaint(0x263f59, 0.5), steel = Mt.metal(0xc3c7cc, 0.26), bright = Mt.metal(0xdadde1, 0.16), dark = Mt.metal(0x7d838b, 0.4), bolts = Mt.metal(0x9aa0a8, 0.35), yellow = Mt.paint(0xe0b020, 0.4);
    var Yc = 1.05, zc = 0.18, rc = 0.04, lr = 0.22, Gm = 0.006, Tg = 90, Tp = 18, zb = zc - Gm * (Tg + Tp) / 2;
    var tipBDC = 0.476, dieTop = 0.48;
    /* ---------- frame: two C-shaped side plates ---------- */
    var frame = new THREE.Group();
    function cplate() {
      var s = new THREE.Shape();
      [[-0.3, 0], [0.36, 0], [0.36, 0.40], [0.02, 0.40], [0.02, 0.62], [0.06, 0.70], [0.33, 0.70], [0.33, 1.15], [-0.3, 1.15]].forEach(function (p, i) { if (i) s.lineTo(p[1] === undefined ? 0 : p[0], p[1]); else s.moveTo(p[0], p[1]); });
      s.closePath();
      var h = new THREE.Path(); h.absarc(zc, Yc, 0.045, 0, Math.PI * 2, true); s.holes.push(h);
      var h2 = new THREE.Path(); h2.absarc(zb, Yc, 0.035, 0, Math.PI * 2, true); s.holes.push(h2);
      var lw = new THREE.Path(); lw.absarc(-0.12, 0.62, 0.08, 0, Math.PI * 2, true); s.holes.push(lw);
      var g = G.extrude(s, 0.035, 0.004);
      var m = G.mesh(g, paint); m.rotation.y = -Math.PI / 2; return m;
    }
    [-0.12, 0.12].forEach(function (x) { var p = cplate(); p.position.x = x; frame.add(p); });
    function blk(w, h, d, x, y, z, mat) { var b = G.mesh(G.roundedBox(w, h, d, 0.008, 0.003), mat || paint); b.position.set(x, y, z); frame.add(b); return b; }
    blk(0.24, 1.1, 0.03, 0, 0.58, -0.285);
    blk(0.24, 0.04, 0.5, 0, 0.38, 0.1, paintD);
    blk(0.3, 0.06, 0.42, 0, 0.42, 0.18, paintD); /* bolster */
    blk(0.24, 0.03, 0.3, 0, 1.13, 0.0);
    blk(0.6, 0.06, 0.9, 0, 0.03, 0.02, paintD); /* base */
    /* bearing housings on the outside of the plates */
    [[-0.155, zc], [0.155, zc], [-0.155, zb], [0.155, zb]].forEach(function (q) {
      var b = G.mesh(G.ring(0.075, 0.04, 0.04, 48), paintD); b.rotation.z = Math.PI / 2; b.position.set(q[0], Yc, q[1]); frame.add(b);
      for (var k = 0; k < 4; k++) { var bt = K.bolt(0.012, 0, bolts); bt.rotation.z = (q[0] > 0 ? -1 : 1) * Math.PI / 2; var a = k / 4 * Math.PI * 2 + Math.PI / 4; bt.position.set(q[0] + (q[0] > 0 ? 0.02 : -0.02), Yc + 0.058 * Math.sin(a), q[1] + 0.058 * Math.cos(a)); frame.add(bt); }
    });
    /* ram guides (gibs) */
    [-1, 1].forEach(function (k) { var g = G.mesh(G.roundedBox(0.025, 0.42, 0.03, 0.003, 0.0015), dark); g.position.set(k * 0.09, 0.9, zc + 0.075); frame.add(g); });
    var nameP = G.decal(0.16, 0.07, T.label(480, 210, '#e6e2d6', [['POWER PRESS', 48, 700], ['25 t   stroke 80 mm', 32], ['flywheel 300 rpm', 32]], '#333')); nameP.position.set(0.1375 + 0.0005, 0.25, 0.05); nameP.rotation.y = Math.PI / 2; frame.add(nameP);
    var warnP = G.decal(0.08, 0.07, T.warning()); warnP.position.set(0, 0.8, zc + 0.122); frame.add(warnP);
    root.add(frame);
    /* ---------- crankshaft with gear ---------- */
    var crank = new THREE.Group();
    var cs = G.mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.46, 40), steel); cs.rotation.z = Math.PI / 2; crank.add(cs);
    [-0.045, 0.045].forEach(function (x) {
      var s = new THREE.Shape(); s.absarc(0, 0, 0.065, Math.PI * 0.9, Math.PI * 2.1, false); s.absarc(0, rc, 0.05, 0.1, Math.PI - 0.1, false); s.closePath();
      var w = G.mesh(G.extrude(s, 0.025, 0.003), dark); w.rotation.y = Math.PI / 2; w.position.x = x; crank.add(w);
    });
    var cpin = G.mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 32), bright); cpin.rotation.z = Math.PI / 2; cpin.position.y = rc; crank.add(cpin);
    var gear = G.mesh(K.gearGeo(Tg, Gm, 0.05, { bore: 0.04, phase: 0 }), steel); gear.rotation.y = Math.PI / 2; gear.position.x = -0.22; crank.add(gear);
    var web = new THREE.Shape(); web.absarc(0, 0, Gm * Tg / 2 - 0.02, 0, Math.PI * 2, false);
    var crankG = new THREE.Group(); crankG.add(crank); crankG.position.set(0, Yc, zc); root.add(crankG);
    /* ---------- back shaft: pinion and flywheel ---------- */
    var back = new THREE.Group();
    var bs = G.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 32), steel); bs.rotation.z = Math.PI / 2; bs.position.x = 0.0; back.add(bs);
    var pin = G.mesh(K.gearGeo(Tp, Gm, 0.055, { bore: 0.03, phase: Gear.meshPhase(Tg, 0, 0, Tp, false) }), steel); pin.rotation.y = Math.PI / 2; pin.position.x = -0.22; back.add(pin);
    var fw = new THREE.Group();
    var rim = G.mesh(G.lathe([[0.26, -0.05], [0.3, -0.05], [0.3, -0.035], [0.288, -0.028], [0.3, -0.02], [0.3, -0.006], [0.288, 0.0], [0.3, 0.006], [0.3, 0.02], [0.288, 0.028], [0.3, 0.035], [0.3, 0.05], [0.26, 0.05], [0.25, 0.04], [0.25, -0.04], [0.26, -0.05]], 128), Mt.cast('#4a5058', 0.6));
    fw.add(rim);
    var fhub = G.mesh(G.lathe([[0.03, -0.05], [0.07, -0.05], [0.075, -0.04], [0.075, 0.04], [0.07, 0.05], [0.03, 0.05]], 48), Mt.cast('#4a5058', 0.6)); fw.add(fhub);
    for (var sp = 0; sp < 6; sp++) { var arm = G.mesh(G.roundedBox(0.04, 0.19, 0.026, 0.01, 0.004), Mt.cast('#4a5058', 0.6)); var an = sp * Math.PI / 3; arm.position.set(Math.cos(an) * 0.16, 0, Math.sin(an) * 0.16); arm.rotation.set(Math.PI / 2, 0, 0); arm.rotation.z = 0; var hold = new THREE.Group(); hold.add(arm); hold.rotation.y = -an; arm.position.set(0.16, 0, 0); arm.rotation.set(0, 0, Math.PI / 2); fw.add(hold); }
    var mark = G.mesh(new THREE.BoxGeometry(0.03, 0.002, 0.02), yellow); mark.position.set(0.3, 0, 0.055); fw.add(mark);
    fw.rotation.z = Math.PI / 2; fw.position.x = 0.27; back.add(fw);
    var backG = new THREE.Group(); backG.add(back); backG.position.set(0, Yc, zb); root.add(backG);
    /* ---------- motor and belt ---------- */
    var drive = new THREE.Group();
    var mot = K.motor(0.08, 0.2, 0x2f4f6f, 'MOTOR 3 kW'); mot.rotation.y = -Math.PI / 2; mot.position.set(0.48, 0.55, zb); drive.add(mot);
    var mpul = G.mesh(G.lathe([[0.012, -0.02], [0.05, -0.02], [0.05, -0.014], [0.04, -0.006], [0.05, 0.002], [0.05, 0.02], [0.012, 0.02]], 48), Mt.cast('#6f757d', 0.6)); mpul.rotation.z = Math.PI / 2; mpul.position.set(0.27, 0.55, zb); drive.add(mpul);
    var stand = G.mesh(G.roundedBox(0.28, 0.44, 0.2, 0.01, 0.004), paintD); stand.position.set(0.47, 0.25, zb); drive.add(stand);
    [-1, 1].forEach(function (k) { var b = K.unitRod(0.009, Mt.rubber(0x161616)); var a = K.V(0.27, 0.55, zb + k * 0.05), bb = K.V(0.27, Yc, zb + k * 0.29); K.orient(b, a, bb); drive.add(b); });
    root.add(drive);
    /* ---------- connecting rod (pitman) and ram with punch ---------- */
    var rod = new THREE.Group();
    var be = G.mesh(G.ring(0.06, 0.036, 0.06, 40), dark); be.rotation.z = Math.PI / 2; rod.add(be);
    var shank = G.mesh(G.roundedBox(0.05, lr - 0.08, 0.04, 0.008, 0.003), dark); shank.position.y = -lr / 2; rod.add(shank);
    var se = G.mesh(G.ring(0.032, 0.018, 0.05, 32), dark); se.rotation.z = Math.PI / 2; se.position.y = -lr; rod.add(se);
    root.add(rod);
    var ram = new THREE.Group();
    var rb = G.mesh(G.roundedBox(0.15, 0.24, 0.12, 0.008, 0.003), paintD); rb.position.y = -0.09; ram.add(rb);
    var rpin = G.mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.17, 24), bright); rpin.rotation.z = Math.PI / 2; ram.add(rpin);
    var holder = G.mesh(G.roundedBox(0.1, 0.03, 0.09, 0.004, 0.002), steel); holder.position.y = -0.224; ram.add(holder);
    var punch = G.mesh(G.lathe([[0, 0], [0.0125, 0], [0.0125, 0.045], [0.016, 0.05], [0.016, 0.075], [0, 0.075]], 32), Mt.metal(0xe3e5e8, 0.12)); punch.position.y = -0.314; ram.add(punch);
    root.add(ram);
    /* ---------- die, stripper and strip ---------- */
    var tooling = new THREE.Group();
    var die = G.mesh(G.lathe([[0.0127, 0], [0.06, 0], [0.06, 0.03], [0.0127, 0.03]], 48), Mt.metal(0xb7bcc2, 0.3)); die.position.set(0, dieTop - 0.03, zc); tooling.add(die);
    var sheetT = 0.01;
    var strip = new THREE.Group();
    var sm = G.mesh(new THREE.BoxGeometry(0.7, 1, 0.08), Mt.metal(0x9aa0a6, 0.35)); strip.add(sm);
    var holes = []; for (var hI = 0; hI < 8; hI++) { var hm = new THREE.Mesh(new THREE.CircleGeometry(0.0125, 32), Mt.rubber(0x0a0a0a)); hm.rotation.x = -Math.PI / 2; strip.add(hm); holes.push(hm); }
    tooling.add(strip);
    var strp = G.mesh(G.roundedBox(0.16, 0.012, 0.1, 0.003, 0.001), Mt.metal(0x8a9098, 0.4)); tooling.add(strp);
    root.add(tooling);
    /* ---------- simulation ---------- */
    var S = { rim: 200, t: 0.01, scale: 0.25, w: 31.4, th: 0, last: null, cyc: { max: 0, min: 1e9 }, show: { max: 0, min: 0, E: 0, F: 0 }, feed: 0, nHoles: 0, Pm: 0, Eacc: 0, tacc: 0 };
    var ws = 300 * Math.PI / 30 * 1.0, Tr = 3000 / (ws * 0.96);
    function Iflywheel() { return S.rim * 0.275 * 0.275 + 1.5; }
    /* ram pin height and tip height from crank angle th (0 = top dead centre) */
    function pinY(th) { return Yc + rc * Math.cos(th) - Math.sqrt(lr * lr - Math.pow(rc * Math.sin(th), 2)); }
    var tipOff = tipBDC - pinY(Math.PI);
    function tipAt(th) { return pinY(th) + tipOff; }
    S.c = 0;
    function sheetTop() { return dieTop + S.t; }
    function tick(time, ex, dt) {
      var h = dt * S.scale, n = Math.max(1, Math.ceil(h / 0.002)), hs = h / n;
      var tau = 350e6, d = 0.025, Fmax = tau * Math.PI * d * S.t;
      for (var i = 0; i < n; i++) {
        var thc = S.th, tip = tipAt(thc), pen = sheetTop() - tip, Tl = 0, F = 0;
        var going = Math.sin(thc) > 0; /* descending between TDC and BDC */
        if (going && pen > 0 && pen < S.t) { F = Fmax * (1 - 0.5 * pen / S.t); var dy = Math.abs(tipAt(thc + 1e-4) - tip) / 1e-4; Tl = F * dy / (Tg / Tp); }
        var Tm = U.clamp(Tr * (ws - S.w) / (0.04 * ws), -2.5 * Tr, 2.5 * Tr);
        var Tf = 4 + 0.15 * S.w;
        var dw = (Tm - Tl - Tf) / Iflywheel() * hs;
        S.w += dw;
        S.th += S.w / (Tg / Tp) * hs;
        S.Eacc += Tm * S.w * hs; S.tacc += hs;
        if (F > 0) S.Fpk = Math.max(S.Fpk || 0, F);
        S.cyc.max = Math.max(S.cyc.max, S.w); S.cyc.min = Math.min(S.cyc.min, S.w);
        if (S.th >= 2 * Math.PI) {
          S.th -= 2 * Math.PI; var I = Iflywheel();
          S.show = { max: S.cyc.max, min: S.cyc.min, E: 0.5 * I * (S.cyc.max * S.cyc.max - S.cyc.min * S.cyc.min), F: S.Fpk || 0, P: S.Eacc / S.tacc };
          S.cyc = { max: S.w, min: S.w }; S.Fpk = 0; S.Eacc = 0; S.tacc = 0;
          S.c++;
        }
      }
      var th = S.th;
      crank.rotation.x = -th;
      back.rotation.x = th * Tg / Tp; pin.rotation.z = 0;
      mpul.rotation.x = th * Tg / Tp * 6;
      var py = pinY(th), cpY = Yc + rc * Math.cos(th), cpZ = zc;
      var cpPos = K.V(0, Yc + rc * Math.cos(th), zc - rc * Math.sin(th));
      rod.position.copy(cpPos); rod.rotation.x = Math.atan2(cpPos.z - zc, cpPos.y - py);
      ram.position.set(0, py, zc);
      /* strip: feeds one pitch on the way up, after the punch has cleared it */
      var pitch = 0.06, feed = th > Math.PI ? pitch * U.clamp((Math.cos(th) - 0.3) / 0.7, 0, 1) : 0;
      sm.scale.y = S.t; sm.position.set(-0.1, 0, 0);
      strip.position.set(0, dieTop + S.t / 2, zc);
      holes.forEach(function (hm, j) {
        var x = -j * pitch - feed;
        hm.visible = (j === 0 ? th > Math.PI - 0.05 : j <= S.c) && x > -0.44;
        hm.position.set(x, S.t / 2 + 0.0004, 0);
      });
      strp.position.set(0, sheetTop() + 0.012, zc);
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Flywheel (on the back shaft)', obj: fw, off: [0.25, 0, 0], at: [0, 0.3, 0.03], photo: 'Category:Flywheels', desc: 'Cast-iron rim with V-belt grooves, turning at about 300 rpm. It gives up kinetic energy ½I(ω₁² − ω₂²) during the punch and the small motor restores it during the rest of the revolution. Change its rim mass in the lab controls and watch the speed dip.' },
      { name: 'Gear and pinion (5 : 1)', obj: crankG, off: [-0.25, 0.15, 0], at: [-0.22, 0.27, 0.0], photo: 'Category:Mechanical presses', desc: 'The 18-tooth pinion on the flywheel shaft drives the 90-tooth gear on the crankshaft, so the flywheel turns five times faster than the crank. Flywheel energy grows with speed squared, so this makes the flywheel far more effective.' },
      { name: 'Connecting rod (pitman)', obj: rod, off: [0, 0.15, 0.3], at: [0.03, -0.1, 0.02], photo: 'Category:Mechanical presses', desc: 'A slider-crank: crank radius 40 mm gives an 80 mm stroke. Near bottom dead centre the ram moves slowly, so a small crank torque gives a very large punch force.' },
      { name: 'Ram and punch', obj: ram, off: [0, 0.3, 0.35], at: [0.0, -0.1, 0.06], photo: 'Category:Punching (metalworking)', desc: 'Hardened punch, 25 mm diameter. Punch force = shear strength × πd × t: about 275 kN for 10 mm mild steel.' },
      { name: 'Die, stripper and strip', obj: tooling, off: [0, 0, 0.35], at: [0.0, 0.5, 0.18], photo: 'Category:Punching (metalworking)', desc: 'The strip is fed one pitch after each stroke. The stripper plate pulls the strip off the punch as it rises.' },
      { name: 'C-frame and bolster', obj: frame, off: [0, 0, -0.3], at: [0.14, 0.9, -0.1], photo: 'Category:Mechanical presses', desc: 'Two steel side plates. The open front (gap) gives access from three sides; the frame stretches slightly under each punch.' },
      { name: 'Motor and V-belt', obj: drive, off: [0.3, 0, 0], at: [0.08, 0.1, 0], photo: 'Category:Electric motors', desc: 'Only 3 kW. Without the flywheel the motor would have to supply the whole punching energy in the fraction of a second the punch takes, needing a motor many times larger.' }
    ];
    return {
      group: root, parts: parts, cam: [1.3, 1.0, 1.55], target: [0.05, 0.62, 0.0], tick: tick, fit: 0.95, labTitle: 'Press lab',
      controls: [
        { label: 'Flywheel rim mass', unit: 'kg', min: 40, max: 400, step: 10, value: 200, fmt: function (v) { return v.toFixed(0); }, set: function (v) { S.rim = v; } },
        { label: 'Plate thickness', unit: 'mm', min: 2, max: 12, step: 1, value: 10, fmt: function (v) { return v.toFixed(0); }, set: function (v) { S.t = v / 1000; } },
        { label: 'Slow motion', min: 0.05, max: 1, step: 0.05, value: 0.25, fmt: function (v) { return v.toFixed(2) + '×'; }, set: function (v) { S.scale = v; } }
      ],
      hud: function () {
        var rpm = S.w * 30 / Math.PI, sh = S.show, mx = sh.max * 30 / Math.PI, mn = sh.min * 30 / Math.PI, mean = (mx + mn) / 2;
        if (!sh.max) return '<b>Flywheel ' + rpm.toFixed(0) + ' rpm</b><br>Readings appear after the first stroke.';
        return '<b>Flywheel ' + rpm.toFixed(0) + ' rpm</b><br>Last stroke: max ' + mx.toFixed(0) + ', min ' + mn.toFixed(0) + ' rpm, C<sub>s</sub> = ' + (mean ? ((mx - mn) / mean).toFixed(3) : '-') + '<br>' +
          'Energy from flywheel ' + (sh.E / 1000).toFixed(2) + ' kJ, peak punch force ' + (sh.F / 1000).toFixed(0) + ' kN<br>I = ' + Iflywheel().toFixed(1) + ' kg m², motor mean ' + ((sh.P || 0) / 1000).toFixed(2) + ' kW';
      }
    };
  };
})();
