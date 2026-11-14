/* models-ch1.js: four-bar linkage lab kit, shaping machine (quick return), Oldham coupling */
(function () {
  'use strict';
  var D2R = Math.PI / 180;

  /* flat link with rounded ends and two holes, lying in the xy plane from (0,0) to (len,0), thickness t */
  function linkGeo(THREE, len, w, t, holeR) {
    var s = new THREE.Shape();
    s.absarc(0, 0, w / 2, Math.PI / 2, Math.PI * 1.5, false);
    s.lineTo(len, -w / 2); s.absarc(len, 0, w / 2, -Math.PI / 2, Math.PI / 2, false); s.lineTo(0, w / 2);
    [0, len].forEach(function (x) { var h = new THREE.Path(); h.absarc(x, 0, holeR, 0, Math.PI * 2, true); s.holes.push(h); });
    return M3D.geo.extrude(s, t, Math.min(0.0012, t * 0.2));
  }
  function circX(P0, r0, P1, r1, prev) {
    var dx = P1[0] - P0[0], dy = P1[1] - P0[1], e = Math.hypot(dx, dy);
    if (e < 1e-9 || e > r0 + r1 || e < Math.abs(r0 - r1)) return null;
    var aa = (r0 * r0 - r1 * r1 + e * e) / (2 * e), h = Math.sqrt(Math.max(0, r0 * r0 - aa * aa));
    var mx = P0[0] + aa * dx / e, my = P0[1] + aa * dy / e;
    var s1 = [mx - h * dy / e, my + h * dx / e], s2 = [mx + h * dy / e, my - h * dx / e];
    if (!prev) return s1;
    return Math.hypot(s1[0] - prev[0], s1[1] - prev[1]) <= Math.hypot(s2[0] - prev[0], s2[1] - prev[1]) ? s1 : s2;
  }

  /* ================= four-bar linkage lab kit ================= */
  M3D.builders.fourbar = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var root = new THREE.Group();
    var steel = Mt.metal(0xc8ccd1, 0.3), blue = Mt.paint(0x1d5fae, 0.4), green = Mt.paint(0x1d7a46, 0.4), amber = Mt.paint(0xc07a10, 0.4), grey = Mt.paint(0x6d7682, 0.45), bright = Mt.metal(0xd8dbdf, 0.18);
    var Lk = { a: 0.06, b: 0.16, c: 0.12, d: 0.15 };
    var t = 0.006, W = 0.022, Z0 = 0.0;
    /* board */
    var board = new THREE.Group();
    var bc = document.createElement('canvas'); bc.width = 1024; bc.height = 640; var x = bc.getContext('2d');
    x.fillStyle = '#e9ecef'; x.fillRect(0, 0, 1024, 640);
    x.strokeStyle = 'rgba(29,95,174,0.18)'; x.lineWidth = 1;
    for (var i = 0; i <= 1024; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 640); x.stroke(); }
    for (var j = 0; j <= 640; j += 16) { x.beginPath(); x.moveTo(0, j); x.lineTo(1024, j); x.stroke(); }
    x.strokeStyle = 'rgba(29,95,174,0.4)';
    for (i = 0; i <= 1024; i += 80) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 640); x.stroke(); }
    for (j = 0; j <= 640; j += 80) { x.beginPath(); x.moveTo(0, j); x.lineTo(1024, j); x.stroke(); }
    x.fillStyle = '#1b1d21'; x.font = '500 26px Roboto, Arial'; x.fillText('FOUR-BAR LINKAGE KIT', 24, 610);
    x.font = '20px Roboto, Arial'; x.fillStyle = '#4a4f57'; x.fillText('grid 10 mm', 860, 610);
    var tex = T.canvasTex(bc, true);
    var bw = 0.48, bh = 0.3;
    var top = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0 }));
    top.receiveShadow = true; top.position.z = 0.0005; board.add(top);
    var slab = G.mesh(G.roundedBox(bw + 0.01, bh + 0.01, 0.018, 0.006, 0.003), Mt.metal(0x9aa0a8, 0.4)); slab.position.z = -0.009; board.add(slab);
    var ox = -0.08, oy = -0.05; /* ground pivot A */
    /* ground pivot posts with protractor at A */
    var prot = document.createElement('canvas'); prot.width = prot.height = 512; var px = prot.getContext('2d');
    px.clearRect(0, 0, 512, 512); px.translate(256, 256);
    px.fillStyle = 'rgba(255,255,255,0.85)'; px.beginPath(); px.arc(0, 0, 250, 0, 7); px.fill();
    px.strokeStyle = '#1b1d21'; px.lineWidth = 2; px.beginPath(); px.arc(0, 0, 248, 0, 7); px.stroke();
    for (var dg = 0; dg < 360; dg += 5) { var big = dg % 30 === 0; px.lineWidth = big ? 3 : 1.4; px.beginPath(); px.moveTo(248 * Math.cos(dg * D2R), -248 * Math.sin(dg * D2R)); px.lineTo((big ? 210 : 230) * Math.cos(dg * D2R), -(big ? 210 : 230) * Math.sin(dg * D2R)); px.stroke(); if (big) { px.font = '500 26px Roboto'; px.fillStyle = '#1b1d21'; px.textAlign = 'center'; px.textBaseline = 'middle'; px.fillText(dg + '', 180 * Math.cos(dg * D2R), -180 * Math.sin(dg * D2R)); } }
    var protM = new THREE.Mesh(new THREE.CircleGeometry(0.045, 64), new THREE.MeshStandardMaterial({ map: T.canvasTex(prot, true), transparent: true, roughness: 0.4 }));
    protM.position.set(ox, oy, 0.0012); board.add(protM);
    root.add(board);
    var posts = new THREE.Group();
    function post() { var g = new THREE.Group(); var p = G.mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.02, 32), bright); p.rotation.x = Math.PI / 2; p.position.z = 0.01; g.add(p); return g; }
    var pA = post(); pA.position.set(ox, oy, 0); posts.add(pA);
    var pD = post(); posts.add(pD);
    root.add(posts);
    /* moving links */
    var links = { a: new THREE.Group(), b: new THREE.Group(), c: new THREE.Group() };
    var mats = { a: blue, b: amber, c: green };
    var meshes = {};
    Object.keys(links).forEach(function (k, n) { root.add(links[k]); });
    var fixedBar = new THREE.Group(); root.add(fixedBar);
    function rebuild() {
      ['a', 'b', 'c'].forEach(function (k, n) {
        if (meshes[k]) { links[k].remove(meshes[k]); meshes[k].geometry.dispose(); }
        meshes[k] = G.mesh(linkGeo(THREE, Lk[k], W, t, 0.0045), mats[k]);
        meshes[k].position.z = 0.022 + n * (t + 0.001);
        links[k].add(meshes[k]);
      });
      if (meshes.arm) { links.b.remove(meshes.arm); }
      var tri = new THREE.Shape(); tri.moveTo(0.35 * Lk.b, 0); tri.lineTo(0.8 * Lk.b, 0); tri.lineTo(0.6 * Lk.b, 0.04); tri.closePath();
      var hp = new THREE.Path(); hp.absarc(0.6 * Lk.b, 0.04, 0.003, 0, Math.PI * 2, true); tri.holes.push(hp);
      meshes.arm = G.mesh(G.extrude(tri, t * 0.6, 0.0005), Mt.metal(0xb8bcc2, 0.35)); meshes.arm.position.z = 0.022 + t + 0.001 + t * 0.8; links.b.add(meshes.arm);
      if (meshes.d) { fixedBar.remove(meshes.d); meshes.d.geometry.dispose(); }
      meshes.d = G.mesh(linkGeo(THREE, Lk.d, W * 0.9, t * 0.8, 0.009), grey); meshes.d.position.z = 0.004; fixedBar.add(meshes.d);
      fixedBar.position.set(ox, oy, 0);
      pD.position.set(ox + Lk.d, oy, 0);
    }
    /* pins with knurled nuts at B and C, and the crank handle */
    function pinNut() { var g = new THREE.Group(); var p = G.mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.03, 16), bright); p.rotation.x = Math.PI / 2; p.position.z = 0.03; g.add(p); var n = G.mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.007, 24), Mt.knurl(0x9aa0a8)); n.rotation.x = Math.PI / 2; n.position.z = 0.045; g.add(n); return g; }
    var pinB = pinNut(), pinC = pinNut(), pinA = pinNut(), pinD2 = pinNut();
    root.add(pinB); root.add(pinC); root.add(pinA); root.add(pinD2);
    var handle = G.mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.03, 20), Mt.knurl(0x2a2d31)); handle.rotation.x = Math.PI / 2; root.add(handle);
    /* coupler point marker and trace */
    var cp = G.mesh(new THREE.SphereGeometry(0.0055, 20, 14), Mt.paint(0xa8141c, 0.3)); root.add(cp);
    var traceN = 361, tracePos = new Float32Array(traceN * 3);
    var traceG = new THREE.BufferGeometry(); traceG.setAttribute('position', new THREE.BufferAttribute(tracePos, 3));
    var trace = new THREE.Line(traceG, new THREE.LineBasicMaterial({ color: 0xa8141c })); root.add(trace);
    var state = { th: 0.6, dir: 1, rpm: 12, prev: null, ok: true, rock: false, mu: 0, cls: '' };
    function solve(th, prev) {
      var A = [ox, oy], D = [ox + Lk.d, oy];
      var B = [A[0] + Lk.a * Math.cos(th), A[1] + Lk.a * Math.sin(th)];
      var C = circX(B, Lk.b, D, Lk.c, prev);
      return C ? { A: A, B: B, C: C, D: D } : null;
    }
    function classify() {
      var L = [Lk.a, Lk.b, Lk.c, Lk.d], s = L.slice().sort(function (p, q) { return p - q; });
      var gr = s[0] + s[3] <= s[1] + s[2] + 1e-9, sh = Math.min.apply(0, L);
      if (!gr) return 'Non-Grashof: no link turns fully (triple rocker)';
      if (sh === Lk.d) return 'Grashof, shortest link fixed: drag link (double crank)';
      if (sh === Lk.a || sh === Lk.c) return 'Grashof, shortest link next to the frame: crank-rocker';
      return 'Grashof, shortest link is the coupler: double rocker';
    }
    function retrace() {
      var prev = null, n = 0, first = null;
      for (var i = 0; i < traceN; i++) {
        var th = i / (traceN - 1) * Math.PI * 2, s = solve(th, prev);
        if (!s) continue;
        prev = s.C;
        var P = cpt(s);
        tracePos[n * 3] = P[0]; tracePos[n * 3 + 1] = P[1]; tracePos[n * 3 + 2] = 0.002; n++;
      }
      traceG.setDrawRange(0, n); traceG.attributes.position.needsUpdate = true;
      trace.visible = n > 2;
    }
    /* coupler point: 60% along BC and offset 40 mm to one side */
    function cpt(s) { var ux = s.C[0] - s.B[0], uy = s.C[1] - s.B[1], l = Math.hypot(ux, uy); ux /= l; uy /= l; return [s.B[0] + 0.6 * Lk.b * ux - 0.04 * uy, s.B[1] + 0.6 * Lk.b * uy + 0.04 * ux]; }
    function set(k, v) { Lk[k] = v; rebuild(); state.prev = null; state.cls = classify(); retrace(); var s = solve(state.th, null); if (!s) { for (var i = 0; i < 360; i++) { var th = i * D2R; if (solve(th, null)) { state.th = th; break; } } } }
    rebuild(); state.cls = classify(); retrace();
    function place(s) {
      links.a.position.set(s.A[0], s.A[1], 0); links.a.rotation.z = Math.atan2(s.B[1] - s.A[1], s.B[0] - s.A[0]);
      links.b.position.set(s.B[0], s.B[1], 0); links.b.rotation.z = Math.atan2(s.C[1] - s.B[1], s.C[0] - s.B[0]);
      links.c.position.set(s.D[0], s.D[1], 0); links.c.rotation.z = Math.atan2(s.C[1] - s.D[1], s.C[0] - s.D[0]);
      pinA.position.set(s.A[0], s.A[1], 0); pinD2.position.set(s.D[0], s.D[1], 0); pinB.position.set(s.B[0], s.B[1], 0); pinC.position.set(s.C[0], s.C[1], 0);
      var hx = s.A[0] + 0.7 * (s.B[0] - s.A[0]), hy = s.A[1] + 0.7 * (s.B[1] - s.A[1]); handle.position.set(hx, hy, 0.042);
      var P = cpt(s); cp.position.set(P[0], P[1], 0.04);
      /* transmission angle between coupler and rocker */
      var u = [s.B[0] - s.C[0], s.B[1] - s.C[1]], v = [s.D[0] - s.C[0], s.D[1] - s.C[1]];
      state.mu = Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]))) / D2R;
      state.out = Math.atan2(s.C[1] - s.D[1], s.C[0] - s.D[0]) / D2R;
    }
    function tick(tm, ex, dt) {
      var step = state.dir * dt * state.rpm * Math.PI / 30, s = solve(state.th + step, state.prev);
      if (!s && step) { state.dir = -state.dir; state.rock = true; s = solve(state.th, state.prev); }
      else if (step) state.th += step;
      if (!s) s = solve(state.th, null);
      if (!s) return;
      state.prev = s.C; place(s);
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Input crank AB (blue)', obj: links.a, off: [0, 0, 0.05], at: [0.03, 0, 0.025], photo: 'Category:Four-bar linkages', desc: 'Turned by the knurled handle. If it can turn a full circle it is a crank; otherwise it rocks between two dead-centre positions, as you will see when you change the lengths.' },
      { name: 'Coupler BC (amber)', obj: links.b, off: [0, 0, 0.08], at: [0.08, 0, 0.032], photo: 'Category:Four-bar linkages', desc: 'Joins crank and rocker. The red point on its extension traces the coupler curve drawn on the board: the shape is what path-generating mechanisms use.' },
      { name: 'Output rocker DC (green)', obj: links.c, off: [0, 0, 0.11], at: [0.06, 0, 0.04], photo: 'Category:Four-bar linkages', desc: 'Pivoted on the board at D. The transmission angle μ between coupler and rocker is shown in the readout; keep it between about 40° and 140° for smooth running.' },
      { name: 'Fixed link AD and board', obj: board, off: [0, 0, -0.06], at: [0.12, -0.11, 0.002], photo: 'Category:Four-bar linkages', desc: 'The board is the frame. Set the pivot spacing with the "Fixed link" slider. The protractor at A reads the crank angle.' }
    ];
    return {
      group: root, parts: parts, cam: [0.05, -0.32, 0.5], target: [0.0, -0.02, 0.02], tick: tick, fit: 0.78, noGround: false,
      controls: [
        { label: 'Crank a', unit: 'mm', min: 30, max: 160, step: 5, value: 60, fmt: function (v) { return v.toFixed(0); }, set: function (v) { set('a', v / 1000); } },
        { label: 'Coupler b', unit: 'mm', min: 40, max: 220, step: 5, value: 160, fmt: function (v) { return v.toFixed(0); }, set: function (v) { set('b', v / 1000); } },
        { label: 'Rocker c', unit: 'mm', min: 30, max: 200, step: 5, value: 120, fmt: function (v) { return v.toFixed(0); }, set: function (v) { set('c', v / 1000); } },
        { label: 'Fixed link d', unit: 'mm', min: 40, max: 220, step: 5, value: 150, fmt: function (v) { return v.toFixed(0); }, set: function (v) { set('d', v / 1000); } },
        { label: 'Crank speed', unit: 'rpm', min: 0, max: 40, step: 1, value: 12, fmt: function (v) { return v.toFixed(0); }, set: function (v) { state.rpm = v; } }
      ],
      buttons: [
        { label: 'Crank-rocker', fn: function () { presetLens(60, 160, 120, 150); } },
        { label: 'Double crank', fn: function () { presetLens(160, 170, 140, 60); } },
        { label: 'Double rocker', fn: function () { presetLens(120, 60, 130, 150); } },
        { label: 'Triple rocker', fn: function () { presetLens(120, 90, 130, 160); } }
      ],
      hud: function () {
        var th = ((state.th / D2R) % 360 + 360) % 360;
        return '<b>' + state.cls + '</b><br>Crank θ = ' + th.toFixed(0) + '°, transmission angle μ = ' + state.mu.toFixed(0) + '°';
      }
    };
    function presetLens(a, b, c, d) {
      var inputs = document.querySelectorAll('.m3d[data-model="fourbar"] .lab input[type=range]');
      [a, b, c, d].forEach(function (v, i) { if (inputs[i]) { inputs[i].value = v; inputs[i].dispatchEvent(new Event('input')); } });
    }
  };

  /* ================= shaping machine: crank and slotted lever quick return ================= */
  M3D.builders.shaper = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var root = new THREE.Group();
    var body = Mt.castPaint(0x3f6b55, 0.5), bodyD = Mt.castPaint(0x34584a, 0.5), steel = Mt.metal(0xc3c7cc, 0.26), bright = Mt.metal(0xdadde1, 0.16), dark = Mt.metal(0x7d838b, 0.4), bolts = Mt.metal(0x9aa0a8, 0.35);
    var d = 0.2, L = 0.44, yR = 0.265, rpin = 0.05, ell = 0.07;
    var O2 = [0, 0], O1 = [0, -d];
    /* column: back wall, sides, top with ram guides, front window (cut away) */
    var col = new THREE.Group();
    var xs = -0.2, xe = 0.3, yb = -0.36, yt = 0.215, zb = -0.13, zf = 0.13;
    function box(w, h, dd, x, y, z, mat) { var b = G.mesh(G.roundedBox(w, h, dd, 0.006, 0.003), mat || body); b.position.set(x, y, z); col.add(b); return b; }
    box(xe - xs, yt - yb, 0.02, (xs + xe) / 2, (yb + yt) / 2, zb);
    box(0.02, yt - yb, zf - zb, xs, (yb + yt) / 2, 0);
    box(0.02, yt - yb, zf - zb, xe, (yb + yt) / 2, 0);
    box(xe - xs + 0.02, 0.02, 0.12, (xs + xe) / 2, yt, -0.07); box(xe - xs + 0.02, 0.02, 0.06, (xs + xe) / 2, yt, 0.1);
    /* front wall with a window, slightly transparent edge */
    var fs = new THREE.Shape(); fs.moveTo(xs, yb); fs.lineTo(xe, yb); fs.lineTo(xe, yt); fs.lineTo(xs, yt); fs.closePath();
    var win = new THREE.Path(); win.moveTo(xs + 0.03, yb + 0.1); win.lineTo(xs + 0.03, yt - 0.03); win.lineTo(xe - 0.03, yt - 0.03); win.lineTo(xe - 0.03, yb + 0.1); win.closePath(); fs.holes.push(win);
    var front = G.mesh(G.extrude(fs, 0.016, 0.003), body); front.position.z = zf; col.add(front);
    var baseB = G.mesh(G.roundedBox(0.9, 0.04, 0.7, 0.01, 0.004), bodyD); baseB.position.set(-0.12, yb - 0.02, -0.13); col.add(baseB);
    /* ram guides (dovetail ways) on top */
    [-1, 1].forEach(function (k) { var g = G.mesh(new THREE.BoxGeometry(xe - xs + 0.04, 0.03, 0.025), bodyD); g.position.set((xs + xe) / 2, yt + 0.025, k * 0.07); col.add(g); var gib = G.mesh(new THREE.BoxGeometry(xe - xs + 0.04, 0.008, 0.012), dark); gib.position.set((xs + xe) / 2, yt + 0.044, k * 0.062); col.add(gib); });
    /* slotted-lever pivot bracket and bull-gear boss on the back wall */
    var boss2 = G.mesh(G.ring(0.035, 0.016, 0.05, 40), bodyD); boss2.rotation.x = Math.PI / 2; boss2.position.set(O2[0], O2[1], zb + 0.035); col.add(boss2);
    var boss1 = G.mesh(G.ring(0.03, 0.012, 0.09, 40), bodyD); boss1.rotation.x = Math.PI / 2; boss1.position.set(O1[0], O1[1], zb + 0.055); col.add(boss1);
    var plate = G.decal(0.12, 0.05, T.label(480, 200, '#e6e2d6', [['SHAPING MACHINE', 44, 700], ['stroke 0 to 300 mm', 30], ['crank and slotted lever', 30]], '#333')); plate.position.set(0.18, -0.25, zf + 0.0175); col.add(plate);
    root.add(col);
    /* bull gear with radial crank slot, driven by a pinion */
    var bull = new THREE.Group();
    var Tb = 64, mb = 0.0035, ph = 0;
    bull.add(G.mesh(K.gearGeo(Tb, mb, 0.03, { bore: 0.016 }), steel));
    var slotS = new THREE.Shape(); slotS.moveTo(-0.012, -0.01); slotS.lineTo(0.012, -0.01); slotS.lineTo(0.012, 0.085); slotS.lineTo(-0.012, 0.085); slotS.closePath();
    var slotM = G.mesh(G.extrude(slotS, 0.006, 0.001), dark); slotM.position.z = 0.018; bull.add(slotM);
    bull.position.set(O2[0], O2[1], -0.04);
    var crankPin = new THREE.Group();
    var cpm = G.mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.07, 24), bright); cpm.rotation.x = Math.PI / 2; crankPin.add(cpm);
    var die = G.mesh(G.roundedBox(0.026, 0.04, 0.03, 0.004, 0.0015), Mt.metal(0xb87b3c, 0.32)); die.position.z = 0.025; crankPin.add(die);
    root.add(bull); root.add(crankPin);
    var pin = new THREE.Group(); var Tp = 16;
    pin.add(G.mesh(K.gearGeo(Tp, mb, 0.03, { bore: 0.008, phase: Gear.meshPhase(Tb, 0, -Math.PI * 0.25, Tp, false) }), steel));
    var pc = mb * (Tb + Tp) / 2, pang = -Math.PI * 0.25;
    pin.position.set(O2[0] + pc * Math.cos(pang), O2[1] + pc * Math.sin(pang), -0.04);
    var pinSh = G.mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 20), bright); pinSh.rotation.x = Math.PI / 2; pinSh.position.z = -0.12; pin.add(pinSh);
    root.add(pin);
    /* step-cone pulley and motor behind */
    var drive = new THREE.Group();
    var cone = G.mesh(G.lathe([[0.008, -0.06], [0.07, -0.06], [0.07, -0.035], [0.055, -0.035], [0.055, -0.01], [0.04, -0.01], [0.04, 0.015], [0.008, 0.015]], 64), Mt.cast('#6f757d', 0.6));
    cone.rotation.x = Math.PI / 2; cone.position.set(pin.position.x, pin.position.y, -0.24); drive.add(cone);
    var mot = K.motor(0.07, 0.17, 0x3f6b55, 'MOTOR 2.2 kW'); mot.position.set(pin.position.x, -0.28, -0.32); drive.add(mot);
    var belt = G.mesh(new THREE.BoxGeometry(0.012, 0.25, 0.025), Mt.rubber(0x1b1b1b)); belt.position.set(pin.position.x + 0.0, (pin.position.y - 0.28) / 2, -0.21); drive.add(belt);
    root.add(drive);
    /* slotted lever */
    var lever = new THREE.Group();
    var ls = new THREE.Shape(); var lw = 0.05;
    ls.moveTo(-lw / 2, -0.02); ls.lineTo(lw / 2, -0.02); ls.lineTo(lw * 0.35, L + 0.02); ls.lineTo(-lw * 0.35, L + 0.02); ls.closePath();
    var sl = new THREE.Path(); sl.moveTo(-0.0135, 0.07); sl.lineTo(0.0135, 0.07); sl.lineTo(0.0135, 0.33); sl.lineTo(-0.0135, 0.33); sl.closePath(); ls.holes.push(sl);
    var ph1 = new THREE.Path(); ph1.absarc(0, 0, 0.012, 0, Math.PI * 2, true); ls.holes.push(ph1);
    var lm = G.mesh(G.extrude(ls, 0.022, 0.002), Mt.castPaint(0xb05a1a, 0.45)); lm.position.z = 0.0; lever.add(lm);
    var lpin = G.mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.1, 24), bright); lpin.rotation.x = Math.PI / 2; lever.add(lpin);
    lever.position.set(O1[0], O1[1], 0.02); root.add(lever);
    /* connecting link */
    var link = new THREE.Group();
    var lg = G.mesh(G.roundedBox(1, 0.018, 0.016, 0.008, 0.003), Mt.metal(0x8f949b, 0.35)); link.add(lg);
    root.add(link);
    /* ram with tool head, clapper box and tool */
    var ram = new THREE.Group();
    var rb = G.mesh(G.roundedBox(0.76, 0.07, 0.12, 0.008, 0.003), body); rb.position.set(-0.05, 0.035, 0); ram.add(rb);
    var rpinM = G.mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 20), bright); rpinM.rotation.x = Math.PI / 2; rpinM.position.set(0, -0.005, 0.05); ram.add(rpinM);
    var head = G.mesh(G.roundedBox(0.06, 0.13, 0.09, 0.006, 0.003), bodyD); head.position.set(-0.38, -0.03, 0); ram.add(head);
    var slide = G.mesh(G.roundedBox(0.045, 0.1, 0.06, 0.004, 0.002), dark); slide.position.set(-0.41, -0.07, 0); ram.add(slide);
    var clap = G.mesh(G.roundedBox(0.04, 0.05, 0.05, 0.004, 0.002), steel); clap.position.set(-0.415, -0.095, 0); ram.add(clap);
    var tool = G.mesh(new THREE.BoxGeometry(0.014, 0.07, 0.014), Mt.metal(0x5b5f66, 0.3)); tool.position.set(-0.42, -0.14, 0); tool.rotation.z = 0.12; ram.add(tool);
    var tip = G.mesh(new THREE.ConeGeometry(0.008, 0.015, 4), Mt.metal(0xd8b25a, 0.25)); tip.position.set(-0.425, -0.182, 0); tip.rotation.z = Math.PI; ram.add(tip);
    var hwh = new THREE.Group(); var hr = G.mesh(new THREE.TorusGeometry(0.028, 0.004, 12, 40), Mt.metal(0x9aa0a8, 0.3)); hr.rotation.x = Math.PI / 2; hwh.add(hr); var hs = G.mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.05, 12), bright); hs.position.y = -0.025; hwh.add(hs); hwh.position.set(-0.38, 0.06, 0); ram.add(hwh);
    root.add(ram);
    /* table, vice and work */
    var table = new THREE.Group();
    var rail = G.mesh(G.roundedBox(0.04, 0.08, 0.36, 0.006, 0.003), bodyD); rail.position.set(xs - 0.02, -0.06, 0); table.add(rail);
    var tb = G.mesh(G.roundedBox(0.2, 0.14, 0.24, 0.006, 0.003), body); tb.position.set(xs - 0.14, -0.08, 0); table.add(tb);
    for (var ts = 0; ts < 3; ts++) { var tsl = G.mesh(new THREE.BoxGeometry(0.202, 0.012, 0.012), Mt.rubber(0x15181b)); tsl.position.set(xs - 0.14, -0.006, -0.06 + ts * 0.06); table.add(tsl); }
    var sup = G.mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.21, 24), dark); sup.position.set(xs - 0.14, -0.255, 0); table.add(sup);
    var vb = G.mesh(G.roundedBox(0.16, 0.035, 0.08, 0.004, 0.002), Mt.castPaint(0x2a3a4a, 0.5)); vb.position.set(xs - 0.14, 0.0275, 0); table.add(vb);
    var jaw1 = G.mesh(G.roundedBox(0.16, 0.04, 0.018, 0.003, 0.0015), steel); jaw1.position.set(xs - 0.14, 0.065, -0.03); table.add(jaw1);
    var jaw2 = jaw1.clone(); jaw2.position.z = 0.03; table.add(jaw2);
    var work = G.mesh(new THREE.BoxGeometry(0.15, 0.025, 0.042), Mt.metal(0xa9adb2, 0.5)); work.position.set(xs - 0.14, 0.072, 0); table.add(work);
    var chips = new THREE.Group(); table.add(chips);
    root.add(table);
    var state = { r: rpin, th: 0, rpm: 20, xr: 0, v: 0, cut: true };
    function stroke() { return 2 * L * state.r / d; }
    function tick(t, ex, dt) {
      state.th += dt * state.rpm * Math.PI / 30;
      var th = state.th;
      var P = [O2[0] + state.r * Math.cos(th), O2[1] + state.r * Math.sin(th)];
      var ang = Math.atan2(P[1] - O1[1], P[0] - O1[0]);
      var Q = [O1[0] + L * Math.cos(ang), O1[1] + L * Math.sin(ang)];
      var xr = Q[0] + Math.sqrt(Math.max(0, ell * ell - Math.pow(yR - Q[1], 2)));
      state.v = dt ? (xr - state.xr) / dt : 0; state.xr = xr;
      state.cut = state.v < 0;
      bull.rotation.z = th - Math.PI / 2;
      pin.rotation.z = -(th - Math.PI / 2) * Tb / Tp;
      crankPin.position.set(P[0], P[1], 0.0); crankPin.rotation.z = ang - Math.PI / 2;
      lever.rotation.z = ang - Math.PI / 2;
      ram.position.set(xr, yR, 0);
      var a2 = Math.atan2(yR - Q[1], xr - Q[0]);
      link.position.set((Q[0] + xr) / 2, (Q[1] + yR) / 2, 0.05); link.rotation.z = a2; link.scale.x = Math.hypot(xr - Q[0], yR - Q[1]) + 0.016;
      cone.rotation.z = th * Tb / Tp * 0.6;
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Column (cut away at the front)', obj: col, off: [0.0, 0, -0.25], at: [0.25, 0.1, 0.13], photo: 'Category:Shaping machines', desc: 'The fixed link: carries the bull gear, the lever pivot and the ram ways. Cast iron damps the vibration of each cut.' },
      { name: 'Bull gear with crank pin and die block', obj: bull, off: [0, 0, 0.18], at: [0.08, 0.06, 0.02], photo: 'Category:Shaping machines', desc: 'Turns at constant speed. The crank pin (radius set by the "Stroke" slider) carries a bronze die block that slides in the lever slot: a turning pair plus a sliding pair, an inversion of the slider-crank.' },
      { name: 'Slotted lever', obj: lever, off: [0, 0, 0.28], at: [0, 0.3, 0.022], photo: 'Category:Shaping machines', desc: 'Pivoted at the bottom. The crank pin reaches the two tangent positions with the lever at its extremes; the crank takes the long way round (cutting) and the short way round (return).' },
      { name: 'Ram, tool head and tool', obj: ram, off: [0, 0.18, 0], at: [-0.38, -0.02, 0.045], photo: 'Category:Shaping machines', desc: 'Driven by the short link from the lever top. Cutting stroke towards the work, quick return away from it. The clapper box lets the tool lift on the return.' },
      { name: 'Table, vice and workpiece', obj: table, off: [-0.15, -0.06, 0.1], at: [-0.34, 0.07, 0.03], photo: 'Category:Shaping machines', desc: 'The table feeds the work sideways a little after every stroke.' },
      { name: 'Drive: motor, pulley and pinion', obj: drive, off: [0, -0.05, -0.2], at: [0.1, -0.28, -0.25], photo: 'Category:Shaping machines', desc: 'The pinion (16 teeth) drives the 64-tooth bull gear, a 4 to 1 reduction.' }
    ];
    return {
      group: root, parts: parts, cam: [-0.6, 0.45, 1.2], target: [-0.05, -0.02, 0], tick: tick, fit: 0.78,
      controls: [
        { label: 'Stroke (crank radius)', unit: 'mm', min: 25, max: 70, step: 1, value: 50, fmt: function (v) { return v.toFixed(0); }, set: function (v) { state.r = v / 1000; } },
        { label: 'Bull gear speed', unit: 'rpm', min: 0, max: 40, step: 1, value: 20, fmt: function (v) { return v.toFixed(0); }, set: function (v) { state.rpm = v; } }
      ],
      hud: function () {
        var phi = Math.acos(state.r / d), ret = 2 * phi / D2R, cutA = 360 - ret;
        return '<b>' + (state.cut ? 'Cutting stroke' : 'Return stroke') + '</b><br>Stroke ' + (stroke() * 1000).toFixed(0) + ' mm, cutting ' + cutA.toFixed(0) + '°, return ' + ret.toFixed(0) + '°<br>Time ratio ' + (cutA / ret).toFixed(2);
      }
    };
  };

  /* ================= Oldham coupling ================= */
  M3D.builders.oldham = function (THREE) {
    var G = M3D.geo, Mt = M3D.mat, K = M3D.kit, T = M3D.tex;
    var root = new THREE.Group();
    var steel = Mt.metal(0xc3c7cc, 0.26), bright = Mt.metal(0xdadde1, 0.16), frame = Mt.castPaint(0x5a4a7a, 0.5), nylon = Mt.plastic(0xf1ead7, 0.45), bolts = Mt.metal(0x9aa0a8, 0.35);
    var R = 0.05, H = 0.12, state = { e: 0.012, th: 0, rpm: 20 };
    /* hub with a diametral slot on its face (axis z, face at z = 0 facing +z) */
    function hub(dir) {
      var g = new THREE.Group();
      var body = G.mesh(G.lathe([[0.012, -0.06], [0.026, -0.06], [0.026, -0.028], [R, -0.024], [R, 0], [0.012, 0]], 64), steel); body.rotation.x = Math.PI / 2; g.add(body);
      /* two jaws either side of the slot */
      [-1, 1].forEach(function (k) {
        var s = new THREE.Shape(); var n = 32, a0 = k > 0 ? 0.25 : Math.PI + 0.25, a1 = k > 0 ? Math.PI - 0.25 : 2 * Math.PI - 0.25;
        for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; var p = [R * Math.cos(a), R * Math.sin(a)]; if (!i) s.moveTo(p[0], p[1]); else s.lineTo(p[0], p[1]); }
        s.lineTo(R * Math.cos(a1), k * 0.009); s.lineTo(R * Math.cos(a0), k * 0.009); s.closePath();
        var j = G.mesh(G.extrude(s, 0.012, 0.0008), steel); j.position.z = 0.006; g.add(j);
      });
      var shaft = G.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 32), bright); shaft.rotation.x = Math.PI / 2; shaft.position.z = -0.14; g.add(shaft);
      var ss = K.capScrew(0.004, bolts); ss.position.set(0, 0.0255, -0.045); g.add(ss);
      return g;
    }
    var h1 = hub(), h2 = hub();
    var H1 = new THREE.Group(); H1.add(h1); H1.position.set(0, H, -0.022);
    var H2 = new THREE.Group(); H2.add(h2); H2.rotation.y = Math.PI; H2.position.set(state.e, H, 0.022);
    root.add(H1); root.add(H2);
    /* centre disc with tongues on both faces at right angles */
    var disc = new THREE.Group();
    var dm = G.mesh(new THREE.CylinderGeometry(R * 0.98, R * 0.98, 0.012, 64), nylon); dm.rotation.x = Math.PI / 2; disc.add(dm);
    var t1 = G.mesh(G.roundedBox(2 * R * 0.94, 0.0175, 0.011, 0.002, 0.001), nylon); t1.position.z = -0.0115; disc.add(t1);
    var t2 = G.mesh(G.roundedBox(0.0175, 2 * R * 0.94, 0.011, 0.002, 0.001), nylon); t2.position.z = 0.0115; disc.add(t2);
    var dot = G.mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.0124, 16), Mt.paint(0xa8141c, 0.3)); dot.rotation.x = Math.PI / 2; disc.add(dot);
    root.add(disc);
    /* frame with two bearings for each shaft */
    var fr = new THREE.Group();
    var bp = K.plate(0.26, 0.5, 0.018, frame); bp.position.x = state.e / 2; fr.add(bp);
    var blocks = [];
    [[-0.13, 0], [-0.21, 0], [0.13, 1], [0.21, 1]].forEach(function (q) {
      var pb = K.pillow(0.012, frame, bolts); pb.position.set(0, H, q[0]);
      var ped = G.mesh(G.roundedBox(0.13, H - 0.038, 0.04, 0.005, 0.002), frame); ped.position.set(0, (H - 0.038) / 2, q[0]);
      var g = new THREE.Group(); g.add(pb); g.add(ped); fr.add(g); blocks.push({ g: g, side: q[1] });
    });
    var trace = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0007, 6, 64), new THREE.MeshBasicMaterial({ color: 0xa8141c })); fr.add(trace);
    var tag = G.decal(0.09, 0.03, T.label(360, 120, '#e6e2d6', [['OLDHAM COUPLING', 36, 700]], '#333')); tag.position.set(0.08, 0.0005, 0.2); tag.rotation.x = -Math.PI / 2; fr.add(tag);
    root.add(fr);
    function tick(t, ex, dt) {
      state.th += dt * state.rpm * Math.PI / 30;
      var th = state.th, e = state.e;
      h1.rotation.z = th; h2.rotation.z = Math.PI / 2 - th; /* H2 is turned round about y, so its local z is reversed */
      H2.position.x = e;
      blocks.forEach(function (b) { b.g.position.x = b.side ? e : 0; });
      /* disc centre on the line through O1 along the slot of hub 1 (direction th + π/2 ... use slot along x of hub 1) */
      var u = [Math.cos(th), Math.sin(th)], s = e * u[0];
      disc.position.set(s * u[0], H + s * u[1], 0);
      disc.rotation.z = th;
      trace.scale.set(e / 0.012 + 0.001, e / 0.012 + 0.001, 1); trace.position.set(e / 2, H, 0.0);
      trace.visible = e > 0.001;
    }
    tick(0, 0, 0);
    var parts = [
      { name: 'Driving shaft and hub', obj: H1, off: [0, 0, -0.1], at: [0, 0.04, 0.0], photo: 'Category:Oldham couplings', desc: 'Its face slot guides one tongue of the centre disc. Hub and disc form a sliding pair.' },
      { name: 'Centre disc (two tongues at 90°)', obj: disc, off: [0, 0.1, 0], at: [0, 0.045, 0.006], photo: 'Category:Oldham couplings', desc: 'Nylon or bronze. It turns at the same speed as both shafts while its centre runs round a small circle of diameter equal to the shaft offset, twice per turn. The red dot marks the centre; the red circle is its path.' },
      { name: 'Driven shaft and hub', obj: H2, off: [0, 0, 0.1], at: [0, 0.04, 0.0], photo: 'Category:Oldham couplings', desc: 'Its slot is at right angles to the first. The speed ratio is exactly 1 at every instant, unlike a Hooke joint.' },
      { name: 'Frame and bearings', obj: fr, off: [0, -0.06, 0], at: [0.1, 0.0, -0.2], photo: 'Category:Oldham couplings', desc: 'The fixed link. This is the double slider-crank chain with the link carrying both sliding pairs as the frame: one of its inversions.' }
    ];
    return {
      group: root, parts: parts, cam: [0.42, 0.32, 0.38], target: [0.006, 0.11, 0], tick: tick, fit: 0.66,
      controls: [
        { label: 'Shaft offset', unit: 'mm', min: 0, max: 20, step: 1, value: 12, fmt: function (v) { return v.toFixed(0); }, set: function (v) { state.e = v / 1000; } },
        { label: 'Speed', unit: 'rpm', min: 0, max: 60, step: 1, value: 20, fmt: function (v) { return v.toFixed(0); }, set: function (v) { state.rpm = v; } }
      ],
      hud: function () { return 'Both shafts ' + state.rpm.toFixed(0) + ' rpm (ratio exactly 1)<br>Disc centre circle diameter = offset = ' + (state.e * 1000).toFixed(0) + ' mm, travelled twice per turn'; }
    };
  };
})();
