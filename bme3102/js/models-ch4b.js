/* models-ch4b.js: centrifugal clutch with shoes, springs and drum; live engagement and torque */
(function () {
  'use strict';
  M3D.builders.cenclutch = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var root = new THREE.Group();
    var steel = Mt.metal(0xc3c7cc, 0.26), bright = Mt.metal(0xdadde1, 0.16), dark = Mt.metal(0x7d838b, 0.4), alu = Mt.cast('#a9aeb4', 0.6), bolts = Mt.metal(0x9aa0a8, 0.35);
    var lining = new THREE.MeshStandardMaterial({ map: T.lining(), roughness: 0.9, metalness: 0 });
    var n = 3, R = 0.075, gap = 0.003, P = { m: 0.3, rg: 0.058, mu: 0.3, Neng: 0, k: 0, TL: 10, auto: true };
    /* engagement speed set by spring preload: 900 rpm */
    var wE = 900 * Math.PI / 30, Sp = P.m * P.rg * wE * wE;
    /* ---------- crankcase half and input shaft ---------- */
    var cc = new THREE.Group();
    var cover = G.mesh(G.lathe([[0.02, 0], [0.092, 0], [0.098, 0.008], [0.098, 0.03], [0.085, 0.045], [0.03, 0.055], [0.02, 0.055]], 64), alu); cover.rotation.x = -Math.PI / 2; cover.position.z = -0.04; cc.add(cover);
    for (var b = 0; b < 6; b++) { var bt = K.bolt(0.008, 0, bolts); bt.rotation.x = -Math.PI / 2; var a = b / 6 * Math.PI * 2; bt.position.set(0.09 * Math.cos(a), 0.09 * Math.sin(a), -0.04 - 0.012); cc.add(bt); }
    var tag = G.decal(0.07, 0.025, T.label(320, 110, '#cfd2d6', [['CENTRIFUGAL CLUTCH', 30, 700], ['engages at 900 rpm', 24]], '#555')); tag.position.set(0, -0.085, -0.034); tag.rotation.x = 0; cc.add(tag);
    root.add(cc);
    /* ---------- hub (spider) on the crankshaft ---------- */
    var hub = new THREE.Group();
    var sh = G.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 24), bright); sh.rotation.x = Math.PI / 2; sh.position.z = -0.02; hub.add(sh);
    var boss = G.mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.028, 32), steel); boss.rotation.x = Math.PI / 2; boss.position.z = 0.01; hub.add(boss);
    for (var i = 0; i < n; i++) {
      var arm = G.mesh(G.roundedBox(0.03, 0.05, 0.012, 0.004, 0.002), steel); var an = i / n * Math.PI * 2;
      var hold = new THREE.Group(); arm.position.y = 0.03; hold.add(arm); hold.rotation.z = an + Math.PI / n; hold.position.z = 0.01; hub.add(hold);
    }
    var nutH = K.nut(0.016, bolts); nutH.rotation.x = Math.PI / 2; nutH.position.z = 0.026; hub.add(nutH);
    root.add(hub);
    /* ---------- shoes with linings, and springs ---------- */
    var shoes = new THREE.Group(), shoeL = [];
    var span = 1.6;
    for (var j = 0; j < n; j++) {
      var g = new THREE.Group(), c = j / n * Math.PI * 2, a0 = c - span / 2, a1 = c + span / 2;
      var s = new THREE.Shape(), N = 32, k;
      for (k = 0; k <= N; k++) { var aa = a0 + (a1 - a0) * k / N; var p = [(R - gap - 0.004) * Math.cos(aa), (R - gap - 0.004) * Math.sin(aa)]; if (!k) s.moveTo(p[0], p[1]); else s.lineTo(p[0], p[1]); }
      for (k = N; k >= 0; k--) { var ab = a0 + (a1 - a0) * k / N; s.lineTo(0.046 * Math.cos(ab), 0.046 * Math.sin(ab)); }
      var shoe = G.mesh(G.extrude(s, 0.026, 0.0008), Mt.metal(0x8f949b, 0.45)); shoe.position.z = 0.01; g.add(shoe);
      var ls = new THREE.Shape();
      for (k = 0; k <= N; k++) { var ac = a0 + 0.05 + (a1 - a0 - 0.1) * k / N; var q = [(R - gap) * Math.cos(ac), (R - gap) * Math.sin(ac)]; if (!k) ls.moveTo(q[0], q[1]); else ls.lineTo(q[0], q[1]); }
      for (k = N; k >= 0; k--) { var ad = a0 + 0.05 + (a1 - a0 - 0.1) * k / N; ls.lineTo((R - gap - 0.0042) * Math.cos(ad), (R - gap - 0.0042) * Math.sin(ad)); }
      var lm = G.mesh(G.extrude(ls, 0.024, 0), lining); lm.position.z = 0.01; g.add(lm);
      shoes.add(g); shoeL.push({ g: g, c: c });
    }
    root.add(shoes);
    var springs = new THREE.Group(), springL = [];
    for (var q2 = 0; q2 < n; q2++) {
      var sp = K.coil(0.004, 0.0011, 9, 1, Mt.metal(0x2b2e33, 0.35)); var sg = new THREE.Group(); sg.add(sp); springs.add(sg); springL.push({ g: sg, m: sp, j: q2 });
    }
    root.add(springs);
    /* ---------- drum with sprocket (output), cut open on the viewer side ---------- */
    var drum = new THREE.Group();
    var dg = G.lathe([[R, 0.038], [R, -0.004], [R + 0.006, -0.004], [R + 0.006, 0.044], [0.016, 0.05], [0.016, 0.044], [R - 0.004, 0.044], [R - 0.004, 0.038]], 96, Math.PI * 0.15, Math.PI * 1.7);
    var dm = G.mesh(dg, Mt.metal(0x9aa0a6, 0.35)); dm.rotation.x = Math.PI / 2; dm.material.side = THREE.DoubleSide; var dHold = new THREE.Group(); dHold.rotation.z = Math.PI * 0.75; dHold.add(dm); drum.add(dHold);
    var face = G.mesh(G.ring(R - 0.0005, R - 0.0035, 0.03, 96), Mt.metal(0xd2d5d9, 0.22)); face.rotation.x = Math.PI / 2; face.position.z = 0.017; face.visible = false; drum.add(face);
    var spr = new THREE.Group();
    var sprT = 14, sprR = 0.035;
    var sprDisk = G.mesh(new THREE.CylinderGeometry(sprR - 0.006, sprR - 0.006, 0.008, 48), steel); sprDisk.rotation.x = Math.PI / 2; spr.add(sprDisk);
    for (var t = 0; t < sprT; t++) { var tt = G.mesh(new THREE.CylinderGeometry(0.003, 0.006, 0.01, 4), steel); var at = t / sprT * Math.PI * 2; tt.position.set((sprR - 0.002) * Math.cos(at), (sprR - 0.002) * Math.sin(at), 0); tt.rotation.z = at - Math.PI / 2; tt.scale.z = 0.8; spr.add(tt); }
    spr.position.z = 0.065; drum.add(spr);
    var dsh = G.mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 32), steel); dsh.rotation.x = Math.PI / 2; dsh.position.z = 0.055; drum.add(dsh);
    root.add(drum);
    /* chain stub */
    var chain = new THREE.Group();
    for (var l = 0; l < 22; l++) { var lk = G.mesh(G.roundedBox(0.012, 0.006, 0.009, 0.003, 0.001), dark); lk.position.set(-0.036, -0.0 - l * 0.0127 + 0.0, 0.065); chain.add(lk); }
    root.add(chain);
    /* ---------- simulation ---------- */
    var S = { w: 0, wd: 0, ang: 0, angd: 0, t: 0, Tc: 0, lock: false };
    function Tcap(w) { var f = P.m * P.rg * w * w - Sp; return f > 0 ? n * P.mu * f * R : 0; }
    function tick(time, ex, dt) {
      S.t += dt;
      if (P.auto) { var ph = (S.t % 14) / 14; P.Neng = ph < 0.5 ? 600 + 2400 * (ph / 0.5) : 3000 - 2400 * ((ph - 0.5) / 0.5); }
      S.w = P.Neng * Math.PI / 30;
      var Tc = Tcap(S.w), Id = 0.02, h = dt / 10;
      for (var i = 0; i < 10; i++) {
        if (S.wd >= S.w - 1e-3 && Tc >= P.TL) { S.wd = S.w; S.lock = true; }
        else { S.lock = false; var Tf = S.wd < S.w ? Tc : -Tc; S.wd += (Tf - P.TL * (S.wd > 0.01 ? 1 : (Tf > P.TL ? 1 : 0))) / Id * h; if (S.wd < 0) S.wd = 0; }
      }
      S.Tc = Tc;
      /* shoes move out against the springs until they touch the drum */
      var f = P.m * P.rg * S.w * S.w, out = f > Sp ? gap : gap * Math.max(0, (f - 0.6 * Sp) / (0.4 * Sp));
      var vis = 0.03;
      S.ang += S.w * dt * vis; S.angd += S.wd * dt * vis;
      hub.rotation.z = S.ang; shoes.rotation.z = S.ang; springs.rotation.z = S.ang;
      shoeL.forEach(function (sl) { sl.g.position.set(out * Math.cos(sl.c), out * Math.sin(sl.c), 0); });
      springL.forEach(function (sp) {
        var j = sp.j, c1 = shoeL[j].c + span / 2 - 0.08, c2 = shoeL[(j + 1) % n].c - span / 2 + 0.08, rr = 0.052;
        var A = K.V((rr + out) * Math.cos(c1), (rr + out) * Math.sin(c1), 0.023), B = K.V((rr + out) * Math.cos(c2), (rr + out) * Math.sin(c2), 0.023);
        sp.g.position.copy(A); sp.g.quaternion.setFromUnitVectors(K.V(0, 1, 0), B.clone().sub(A).normalize()); sp.m.scale.y = A.distanceTo(B);
      });
      drum.rotation.z = S.angd;
      chain.children.forEach(function (lk, k) { lk.position.y = -((k * 0.0127 + S.angd * sprR) % (22 * 0.0127)); });
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Hub (spider) on the crankshaft', obj: hub, off: [0, 0, 0.12], at: [0, 0.03, 0.02], photo: 'Category:Centrifugal clutches', desc: 'Keyed to the engine shaft. Its arms drive the shoes round but leave them free to move outwards.' },
      { name: 'Shoes with friction linings (3)', obj: shoes, off: [0, 0, 0.2], at: [0, 0.062, 0.02], photo: 'Category:Centrifugal clutches', desc: 'Each shoe of mass m, centre of gravity at radius r, feels a centrifugal force m r ω². Above the engagement speed this beats the spring pull and presses the lining on the drum with force m r (ω² − ω′²).' },
      { name: 'Return springs', obj: springs, off: [0, 0, 0.27], at: [0.04, 0.03, 0.023], photo: 'Category:Centrifugal clutches', desc: 'Their preload equals m r ω′², which sets the engagement speed ω′ (900 rpm here). At idle the shoes stay clear and the engine runs without moving the vehicle.' },
      { name: 'Drum and output sprocket', obj: drum, off: [0, 0, 0.35], at: [-0.06, 0.0, 0.03], photo: 'Category:Centrifugal clutches', desc: 'Cut open here. Torque capacity T = n μ m r (ω² − ω′²) R, with R the drum radius. Mopeds, scooters, chainsaws and go-karts use this clutch.' },
      { name: 'Crankcase cover', obj: cc, off: [0, 0, -0.1], at: [0.09, 0.05, -0.02], photo: 'Category:Centrifugal clutches', desc: 'The fixed part. The input shaft comes from the engine behind it.' }
    ];
    return {
      group: root, parts: parts, cam: [0.26, 0.18, 0.26], target: [0, 0, 0.02], tick: tick, fit: 0.85, labTitle: 'Clutch lab',
      controls: [
        { label: 'Engine speed', unit: 'rpm', min: 600, max: 3000, step: 50, value: 600, fmt: function (v) { return v.toFixed(0); }, set: function (v) { if (v !== 600 || !P.auto) { P.auto = false; } P.Neng = v; } },
        { label: 'Load torque on the drum', unit: 'N m', min: 0, max: 40, step: 1, value: 10, fmt: function (v) { return v.toFixed(0); }, set: function (v) { P.TL = v; } }
      ],
      buttons: [{ label: 'Auto rev up and down', fn: function () { P.auto = true; } }],
      hud: function () {
        var dn = S.wd * 30 / Math.PI;
        return '<b>Engine ' + P.Neng.toFixed(0) + ' rpm, drum ' + dn.toFixed(0) + ' rpm</b>: ' + (S.Tc <= 0 ? 'disengaged' : S.lock ? 'engaged, no slip' : 'slipping') + '<br>' +
          'Torque capacity n μ m r (ω² − ω′²) R = ' + S.Tc.toFixed(1) + ' N m<br>Load ' + P.TL.toFixed(0) + ' N m; engagement at 900 rpm';
      }
    };
  };
})();
