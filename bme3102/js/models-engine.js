/* Single-cylinder engine: procedural model for Chapter 2 */
(function () {
  'use strict';
  M3D.builders.engine = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, T = M3D.tex;
    var root = new THREE.Group();
    var r = 0.055, L = 0.21, bore = 0.1;
    var steel = Mt.metal(0xc9ccd1, 0.28), dark = Mt.metal(0x8d939b, 0.4), alu = Mt.cast('#a3a8ae', 0.7);
    var green = Mt.paint(0x1d4334, 0.5), black = Mt.paint(0x202326, 0.5);

    /* sector of an annulus in XZ, extruded along +Y from y0 to y1 */
    function sector(ri, ro, a0, a1, y0, y1) {
      var s = new THREE.Shape(), n = 48, i, a;
      for (i = 0; i <= n; i++) { a = a0 + (a1 - a0) * i / n; var p = [ro * Math.cos(a), ro * Math.sin(a)]; if (i === 0) s.moveTo(p[0], p[1]); else s.lineTo(p[0], p[1]); }
      for (i = n; i >= 0; i--) { a = a0 + (a1 - a0) * i / n; s.lineTo(ri * Math.cos(a), ri * Math.sin(a)); }
      var g = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false, curveSegments: 48 });
      g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); g.computeVertexNormals();
      return g;
    }
    /* opening of the cut-away faces the viewer (+x, +z) */
    var cut0 = Math.PI * 0.62, cut1 = Math.PI * 2.13;
    function sectorMirror(ri, ro, y0, y1) { var g = sector(ri, ro, cut0, cut1, y0, y1); g.scale(1, 1, -1); g.computeVertexNormals(); return g; }

    /* 1 cylinder with fins (cut away) */
    var cyl = new THREE.Group();
    cyl.add(G.mesh(sectorMirror(bore / 2 + 0.001, 0.062, 0.12, 0.335), alu));
    for (var f = 0; f < 9; f++) cyl.add(G.mesh(sectorMirror(0.061, 0.092, 0.145 + f * 0.021, 0.152 + f * 0.021), alu));
    cyl.add(G.mesh(sectorMirror(0.05, 0.1, 0.112, 0.124), alu));
    root.add(cyl);

    /* 2 cylinder head with spark plug */
    var head = new THREE.Group();
    var hb = G.mesh(G.roundedBox(0.2, 0.05, 0.2, 0.02, 0.006), alu); hb.position.y = 0.36; head.add(hb);
    for (var hf = 0; hf < 4; hf++) { var fin = G.mesh(G.roundedBox(0.2, 0.006, 0.2, 0.02, 0.002), alu); fin.position.y = 0.39 + hf * 0.014; head.add(fin); }
    var plugHex = G.mesh(G.hex(0.021, 0.014), dark); plugHex.position.set(0.04, 0.45, 0.02); head.add(plugHex);
    var por = G.mesh(G.lathe([[0, 0], [0.008, 0], [0.008, 0.01], [0.006, 0.03], [0.004, 0.036], [0, 0.036]], 32), Mt.porcelain()); por.position.set(0.04, 0.457, 0.02); head.add(por);
    var term = G.mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.012, 16), steel); term.position.set(0.04, 0.498, 0.02); head.add(term);
    for (var hb2 = 0; hb2 < 4; hb2++) {
      var nut = G.mesh(G.hex(0.016, 0.01), steel);
      nut.position.set((hb2 % 2 ? 1 : -1) * 0.08, 0.39, (hb2 < 2 ? 1 : -1) * 0.08); head.add(nut);
    }
    var warn = G.decal(0.05, 0.044, T.warning()); warn.position.set(-0.04, 0.36, 0.1 + 0.0015); head.add(warn);
    root.add(head);

    /* 3 piston with rings */
    var piston = new THREE.Group();
    var yTDC = r + L;
    var prof = [[0.012, -0.034], [0.0495, -0.034], [0.0495, -0.0], [0.0488, 0.004], [0.0495, 0.008], [0.0495, 0.012], [0.0488, 0.016], [0.0495, 0.02], [0.0495, 0.024], [0.0488, 0.028], [0.0495, 0.032], [0.0495, 0.046], [0.044, 0.05], [0, 0.05]];
    var pm = G.mesh(G.lathe(prof, 64), Mt.metal(0xb9bcc0, 0.45)); piston.add(pm);
    for (var rg = 0; rg < 3; rg++) { var ring = G.mesh(new THREE.TorusGeometry(0.049, 0.0016, 8, 64), Mt.metal(0x3b3e42, 0.35)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.006 + rg * 0.012; piston.add(ring); }
    piston.position.y = yTDC; root.add(piston);

    /* 4 gudgeon pin */
    var gp = new THREE.Group();
    var gpm = G.mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.094, 32), Mt.metal(0xdfe2e6, 0.15)); gpm.rotation.x = Math.PI / 2; gp.add(gpm);
    gp.position.y = yTDC; root.add(gp);

    /* 5 connecting rod: big end at origin, small end at (0, L) */
    var rod = new THREE.Group();
    var big = G.mesh(G.ring(0.036, 0.0205, 0.032, 48), Mt.metal(0x9ea3aa, 0.4)); big.rotation.x = Math.PI / 2; rod.add(big);
    var small = G.mesh(G.ring(0.021, 0.0115, 0.03, 40), Mt.metal(0x9ea3aa, 0.4)); small.rotation.x = Math.PI / 2; small.position.y = L; rod.add(small);
    var Ish = new THREE.Shape();
    Ish.moveTo(-0.014, -0.01); Ish.lineTo(0.014, -0.01); Ish.lineTo(0.014, -0.006); Ish.lineTo(0.004, -0.006); Ish.lineTo(0.004, 0.006); Ish.lineTo(0.014, 0.006); Ish.lineTo(0.014, 0.01); Ish.lineTo(-0.014, 0.01); Ish.lineTo(-0.014, 0.006); Ish.lineTo(-0.004, 0.006); Ish.lineTo(-0.004, -0.006); Ish.lineTo(-0.014, -0.006); Ish.lineTo(-0.014, -0.01);
    var shank = new THREE.ExtrudeGeometry(Ish, { depth: L - 0.06, bevelEnabled: false });
    shank.rotateX(-Math.PI / 2); shank.rotateY(Math.PI / 2); shank.translate(0, 0.032, 0);
    rod.add(G.mesh(shank, Mt.metal(0x9ea3aa, 0.4)));
    var cap = G.mesh(G.roundedBox(0.09, 0.016, 0.032, 0.006, 0.003), Mt.metal(0x8f949b, 0.4)); cap.position.y = -0.03; rod.add(cap);
    [-1, 1].forEach(function (s) {
      var bolt = G.mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.06, 16), steel); bolt.position.set(s * 0.036, -0.012, 0); rod.add(bolt);
      var bn = G.mesh(G.hex(0.012, 0.008), steel); bn.position.set(s * 0.036, -0.042, 0); rod.add(bn);
    });
    rod.position.set(0, r, 0); root.add(rod);

    /* 6 crankshaft */
    var crank = new THREE.Group();
    function web(z) {
      var s = new THREE.Shape();
      s.absarc(0, 0, 0.06, Math.PI * 1.08, Math.PI * 1.92, false);
      s.lineTo(0.026, 0); s.absarc(0, r, 0.03, 0, Math.PI, false); s.lineTo(-0.026, 0);
      var g = G.extrude(s, 0.02, 0.002); var m = G.mesh(g, Mt.metal(0x7f858d, 0.45)); m.position.z = z; return m;
    }
    crank.add(web(-0.036)); crank.add(web(0.036));
    var cpin = G.mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.054, 32), steel); cpin.rotation.x = Math.PI / 2; cpin.position.y = r; crank.add(cpin);
    var shaft = G.mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 32), steel); shaft.rotation.x = Math.PI / 2; shaft.position.z = -0.105; crank.add(shaft);
    var shaft2 = G.mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.2, 32), steel); shaft2.rotation.x = Math.PI / 2; shaft2.position.z = 0.145; crank.add(shaft2);
    var key = G.mesh(new THREE.BoxGeometry(0.008, 0.006, 0.04), dark); key.position.set(0, 0.023, 0.2); crank.add(key);
    root.add(crank);

    /* 7 flywheel */
    var fw = new THREE.Group();
    var rim = G.mesh(G.lathe([[0.17, -0.026], [0.205, -0.026], [0.21, -0.02], [0.21, 0.02], [0.205, 0.026], [0.17, 0.026], [0.165, 0.02], [0.165, -0.02], [0.17, -0.026]], 96), green);
    rim.rotation.x = Math.PI / 2; fw.add(rim);
    var hub = G.mesh(G.ring(0.045, 0.022, 0.06, 48), green); hub.rotation.x = Math.PI / 2; fw.add(hub);
    for (var sp = 0; sp < 6; sp++) {
      var arm = G.mesh(G.roundedBox(0.03, 0.13, 0.018, 0.008, 0.004), green);
      var ang = sp * Math.PI / 3; arm.position.set(Math.sin(ang) * 0.105, Math.cos(ang) * 0.105, 0); arm.rotation.z = -ang; fw.add(arm);
    }
    var face = G.mesh(G.ring(0.211, 0.2, 0.05, 96), Mt.metal(0xb8bcc2, 0.3)); face.rotation.x = Math.PI / 2; fw.add(face);
    fw.position.z = 0.2; root.add(fw);

    /* 8 frame and main bearings */
    var frame = new THREE.Group();
    var base = G.mesh(G.roundedBox(0.34, 0.03, 0.3, 0.02, 0.006), green); base.position.set(0, -0.15, -0.02); frame.add(base);
    [-0.075, 0.075].forEach(function (z) {
      var ped = G.mesh(G.roundedBox(0.09, 0.15, 0.03, 0.01, 0.004), green); ped.position.set(0, -0.07, z); frame.add(ped);
      var brg = G.mesh(G.ring(0.042, 0.022, 0.034, 40), Mt.metal(0xa48a4a, 0.35)); brg.rotation.x = Math.PI / 2; brg.position.z = z; frame.add(brg);
      var capb = G.mesh(G.roundedBox(0.11, 0.022, 0.036, 0.008, 0.003), green); capb.position.set(0, 0.045, z); frame.add(capb);
    });
    [[-0.13, -0.11], [0.13, -0.11], [-0.13, 0.08], [0.13, 0.08]].forEach(function (p) {
      var col = G.mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.265, 20), green); col.position.set(p[0], -0.003, p[1]); frame.add(col);
    });
    var deck = G.mesh(G.roundedBox(0.3, 0.012, 0.24, 0.02, 0.004), green); deck.position.set(0, 0.126, -0.015);
    frame.add(deck);
    var plate = G.decal(0.08, 0.04, T.label(320, 160, '#d9d4c6', [['UMU WORKSHOP', 26, 700], ['Single cylinder', 22], ['bore 100  stroke 110', 20], ['rated 1500 rpm', 20]], '#333'));
    plate.position.set(0.09, -0.15, 0.12 + 0.0015); frame.add(plate);
    root.add(frame);

    var parts = [
      { name: 'Cylinder (cut away)', obj: cyl, off: [0, 0.14, -0.3], at: [-0.085, 0.24, -0.03], photo: 'Category:Engine blocks', desc: 'Guides the piston in a straight line, so the piston and cylinder form the sliding (prismatic) pair. Its wall carries the side thrust F_N = F_P tan φ. The fins shed heat. Cut away here so you can see the piston.' },
      { name: 'Cylinder head and spark plug', obj: head, off: [0, 0.26, 0], at: [-0.08, 0.36, 0.1], photo: 'Category:Spark plugs', desc: 'Closes the cylinder. The gas pressure that drives the engine acts on the head and on the piston crown equally and oppositely, so the frame carries it as a tension load through the head studs.' },
      { name: 'Piston and rings', obj: piston, off: [0, 0.18, 0.18], at: [0.03, 0.05, 0.02], photo: 'File:Piston and connecting rod.jpg', desc: 'Takes the gas force, gas pressure × piston area. Its mass, with the gudgeon pin and the small-end share of the rod, is the reciprocating mass whose inertia force m_R a_P is largest near top dead centre.' },
      { name: 'Gudgeon pin', obj: gp, off: [0.2, 0.18, 0.18], at: [0, 0, 0.047], photo: 'Category:Pistons', desc: 'Pin joint between piston and connecting rod: a revolute pair. It carries the full piston effort F_P every stroke.' },
      { name: 'Connecting rod', obj: rod, off: [0, 0.04, 0.26], at: [0, 0.12, 0.012], photo: 'Category:Connecting rods', desc: 'Two-force member if its own inertia is ignored: it carries the thrust F_Q = F_P / cos φ along its length. In accurate work it is replaced by two point masses plus a correction couple.' },
      { name: 'Crankshaft', obj: crank, off: [0, 0, 0], at: [0, -0.04, 0.047], photo: 'File:T27 crankshaft.JPG', desc: 'The crank effort F_T, the part of the rod thrust square to the crank, times the crank radius gives the turning moment T. The webs carry counterweights to balance the rotating mass.' },
      { name: 'Flywheel', obj: fw, off: [0, 0, 0.22], at: [0, 0.03, 0.03], photo: 'File:Flywheel.JPG', desc: 'Stores energy when the turning moment exceeds the load and returns it when there is a shortfall. Most of its mass is in the rim, because I grows with the square of the radius. Rim speed is limited by σ = ρ v squared.' },
      { name: 'Frame and main bearings', obj: frame, off: [0, -0.12, 0], at: [-0.13, 0.02, 0.08], photo: 'Category:Stationary engines', desc: 'The fixed link. It carries the main-bearing reactions and the reaction to the turning moment, which is why engines are bolted down firmly.' }
    ];

    /* force arrows: gas force (red), connecting-rod thrust (amber), side thrust on the wall (green), crank effort (blue) */
    var K = M3D.kit, fg = new THREE.Group(); root.add(fg);
    var aGas = K.arrow(0xa8141c, 0.0055), aQ = K.arrow(0xc07a10, 0.0055), aN = K.arrow(0x1d7a46, 0.0055), aT = K.arrow(0x1d5fae, 0.0055), aI = K.arrow(0x6a3fa0, 0.0045);
    [aGas, aQ, aN, aT, aI].forEach(function (a) { fg.add(a); });
    var A = Math.PI * bore * bore / 4, Vs = A * 2 * r, rc = 7, Vc = Vs / (rc - 1), mR = 1.4, sc = 3.6e-6;
    var F = { rpm: 1500, slow: 1, th: 0, show: true, inertia: true };
    function gasP(cyc, x) {
      var V = Vc + A * x, deg = cyc * 180 / Math.PI, pa;
      if (deg < 180) { var pe = 1e5 * Math.pow(rc, 1.3) * 3.2 * Math.pow(Vc / V, 1.3), pc = 1e5 * Math.pow(rc, 1.3) * Math.pow(Vc / V, 1.3); var k = Math.min(1, deg / 15); k = k * k * (3 - 2 * k); pa = pc + (pe - pc) * k; }
      else if (deg < 360) pa = 1.15e5;
      else if (deg < 540) pa = 0.9e5;
      else pa = 1e5 * Math.pow((Vc + Vs) / V, 1.3);
      return pa - 1e5;
    }
    function forces(th) {
      var s = Math.sin(th), c = Math.cos(th), n = L / r, w = F.rpm * Math.PI / 30;
      var x = r * (1 - c) + L - Math.sqrt(L * L - r * r * s * s);
      var cyc = ((th % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
      var p = gasP(cyc, x), Fg = p * A, aP = r * w * w * (c + Math.cos(2 * th) / n), FI = F.inertia ? mR * aP : 0;
      var FP = Fg - FI, phi = Math.asin(r * s / L), FQ = FP / Math.cos(phi), FN = FP * Math.tan(phi), FT = FQ * Math.sin(th + phi);
      return { cyc: cyc, p: p, Fg: Fg, FI: FI, FP: FP, FQ: FQ, FN: FN, FT: FT, T: FT * r, phi: phi };
    }
    function tick(t, ex, dt) {
      F.th += (dt == null ? 0 : dt) * 2.4 * F.slow;
      var th = F.th;
      var s = Math.sin(th), c = Math.cos(th);
      var yP = r * c + Math.sqrt(L * L - r * r * s * s);
      crank.rotation.z = -th; fw.rotation.z = -th;
      piston.position.y += yP - yTDC; gp.position.y += yP - yTDC;
      rod.position.x += r * s; rod.position.y += r * c - r;
      rod.rotation.z = Math.asin(r * s / L);
      fg.visible = F.show && ex < 0.05;
      if (F.ghost !== fg.visible) { F.ghost = fg.visible; fw.traverse(function (o) { if (!o.isMesh) return; var on = F.ghost; o.material.transparent = on; o.material.opacity = on ? 0.16 : 1; o.material.depthWrite = !on; o.userData.op = o.material.opacity; o.userData.tr = on; o.material.needsUpdate = true; }); }
      if (fg.visible) {
        var f = forces(th), crown = new THREE.Vector3(0, yP + 0.05, 0.03), pinP = new THREE.Vector3(r * s, r * c, 0.075);
        var d = new THREE.Vector3(r * s, r * c - yP, 0).normalize();
        K.setArrow(aGas, crown, new THREE.Vector3(0, -f.Fg, 0), sc, true);
        K.setArrow(aI, new THREE.Vector3(0.0, yP - 0.034, 0.05), new THREE.Vector3(0, f.FI, 0), sc, false);
        K.setArrow(aQ, pinP, d.clone().multiplyScalar(f.FQ), sc, true);
        var fnx = -f.FQ * d.x, side = fnx >= 0 ? 1 : -1;
        K.setArrow(aN, new THREE.Vector3(side * 0.05, yP + 0.01, 0.0), new THREE.Vector3(fnx, 0, 0), sc * 3, true);
        var tt = new THREE.Vector3(c, -s, 0);
        K.setArrow(aT, pinP, tt.multiplyScalar(f.FT), sc, false);
        F.last = f;
      }
    }
    var STROKE = ['Power (expansion)', 'Exhaust', 'Suction', 'Compression'];
    var hud = function () {
      var f = F.last || forces(F.th); if (!F.show) return '';
      var deg = f.cyc * 180 / Math.PI;
      function kN(v) { return (v / 1000).toFixed(2) + ' kN'; }
      return '<b>' + STROKE[Math.floor(deg / 180) % 4] + '</b>, crank ' + deg.toFixed(0) + '° of 720°<br>' +
        'Gas p = ' + (f.p / 1e5).toFixed(1) + ' bar, <span style="color:#a8141c">F<sub>L</sub> = ' + kN(f.Fg) + '</span>, <span style="color:#6a3fa0">F<sub>I</sub> = ' + kN(f.FI) + '</span><br>' +
        'F<sub>P</sub> = ' + kN(f.FP) + ', <span style="color:#c07a10">F<sub>Q</sub> = ' + kN(f.FQ) + '</span>, <span style="color:#1d7a46">F<sub>N</sub> = ' + kN(f.FN) + '</span><br>' +
        '<span style="color:#1d5fae">F<sub>T</sub> = ' + kN(f.FT) + '</span>, turning moment T = ' + f.T.toFixed(0) + ' N m';
    };
    tick(0, 1, 0);
    return { group: root, parts: parts, cam: [0.42, 0.3, 1.0], target: [0, 0.1, 0.02], tick: tick, hud: hud, labTitle: 'Force analysis',
      controls: [
        { label: 'Engine speed (for inertia)', unit: 'rpm', min: 0, max: 4000, step: 100, value: 1500, fmt: function (v) { return v.toFixed(0); }, set: function (v) { F.rpm = v; } },
        { label: 'Animation', unit: 'slow motion', min: 0.1, max: 1.5, step: 0.1, value: 1, fmt: function (v) { return v.toFixed(1) + '×'; }, set: function (v) { F.slow = v; } }
      ],
      buttons: [
        { label: 'Hide forces', fn: function (b) { F.show = !F.show; b.textContent = F.show ? 'Hide forces' : 'Show forces'; } },
        { label: 'Inertia on', fn: function (b) { F.inertia = !F.inertia; b.textContent = F.inertia ? 'Inertia on' : 'Inertia off'; } }
      ] };
  };
})();
