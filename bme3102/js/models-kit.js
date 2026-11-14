/* models-kit.js: shared 3D parts for the equipment models.
   Gears (spur, helical, double helical, bevel, rack, worm, worm wheel), fasteners, springs,
   bearings, motors, force arrows. Every function is called from inside a builder, after three.js has loaded. */
(function () {
  'use strict';
  var K = M3D.kit = {};
  var UP = null;
  function V(x, y, z) { return new THREE.Vector3(x, y, z); }
  K.V = V;

  /* ---------- rods and orientation ---------- */
  K.unitRod = function (r, mat, seg) { return M3D.geo.mesh(new THREE.CylinderGeometry(r, r, 1, seg || 20), mat); };
  /* place a unit-length y-axis object between points a and b */
  K.orient = function (obj, a, b) {
    UP = UP || V(0, 1, 0);
    var d = V().subVectors(b, a), len = d.length();
    obj.position.copy(a).addScaledVector(d, 0.5);
    if (len > 1e-9) obj.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / len));
    obj.scale.set(1, Math.max(len, 1e-6), 1);
    return obj;
  };
  K.cyl = function (r, len, mat, axis, seg) {
    var m = M3D.geo.mesh(new THREE.CylinderGeometry(r, r, len, seg || 32), mat);
    if (axis === 'x') m.rotation.z = Math.PI / 2; else if (axis === 'z') m.rotation.x = Math.PI / 2;
    return m;
  };

  /* ---------- fasteners ---------- */
  /* hex bolt standing on +y: washer on y = 0, head above, shank below */
  K.bolt = function (d, len, mat) {
    var G = M3D.geo, g = new THREE.Group();
    var w = G.mesh(G.ring(d * 1.05, d * 0.55, d * 0.18, 24), mat); w.position.y = d * 0.09; g.add(w);
    var hg = G.lathe([[0, 0], [d * 0.86, 0], [d * 0.86, d * 0.55], [d * 0.78, d * 0.65], [0, d * 0.65]], 6);
    var head = G.mesh(hg, mat); head.position.y = d * 0.18; g.add(head);
    if (len > 0) { var sh = G.mesh(new THREE.CylinderGeometry(d / 2, d / 2, len, 16), mat); sh.position.y = -len / 2; g.add(sh); }
    return g;
  };
  K.nut = function (d, mat) {
    var G = M3D.geo, g = new THREE.Group();
    var n = G.mesh(G.lathe([[d * 0.5, 0], [d * 0.86, 0], [d * 0.86, d * 0.75], [d * 0.78, d * 0.82], [d * 0.5, d * 0.82]], 6), mat); g.add(n);
    return g;
  };
  /* socket-head cap screw, axis +y */
  K.capScrew = function (d, mat) {
    var G = M3D.geo, g = new THREE.Group();
    var h = G.mesh(G.lathe([[d * 0.45, d], [d * 0.75, d], [d * 0.8, d * 0.92], [d * 0.8, 0.05 * d], [0, 0]], 24), mat); g.add(h);
    var sock = G.mesh(new THREE.CylinderGeometry(d * 0.32, d * 0.32, d * 0.2, 6), M3D.mat.rubber(0x111111)); sock.position.y = d * 0.92; g.add(sock);
    return g;
  };

  /* ---------- coil spring along +y from 0 to len (compress with scale.y) ---------- */
  K.coil = function (R, rw, turns, len, mat) {
    var pts = [], n = Math.round(turns * 32), e = 1 / turns;
    for (var i = 0; i <= n; i++) {
      var t = i / n, a = t * turns * Math.PI * 2, y;
      /* closed, ground ends: the first and last turn are flat */
      if (t < e) y = rw * (t / e);
      else if (t > 1 - e) y = len - rw * ((1 - t) / e);
      else y = rw + (len - 2 * rw) * (t - e) / (1 - 2 * e);
      pts.push(V(R * Math.cos(a), y, R * Math.sin(a)));
    }
    var geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.round(turns * 48), rw, 10, false);
    return M3D.geo.mesh(geo, mat);
  };

  /* ---------- gears (axis along z, faces at z = -w/2 and +w/2) ---------- */
  function circle(r, n) { var p = []; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; p.push([r * Math.cos(a), r * Math.sin(a)]); } return p; }
  function area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var q = p[(i + 1) % p.length]; s += p[i][0] * q[1] - q[0] * p[i][1]; } return s / 2; }
  /* swept solid: outer contour (anticlockwise), optional hole contour; layer k has z, rotation, scale */
  K.swept = function (outer, hole, layers) {
    if (area(outer) < 0) outer = outer.slice().reverse();
    if (hole && area(hole) > 0) hole = hole.slice().reverse();
    var pos = [], idx = [];
    function xf(p, L) { var c = Math.cos(L.a), s = Math.sin(L.a); return [(p[0] * c - p[1] * s) * L.s, (p[0] * s + p[1] * c) * L.s, L.z]; }
    function wall(cont, flip) {
      var n = cont.length, base = pos.length / 3;
      layers.forEach(function (L) { cont.forEach(function (p) { var q = xf(p, L); pos.push(q[0], q[1], q[2]); }); });
      for (var k = 0; k < layers.length - 1; k++) for (var i = 0; i < n; i++) {
        var a = base + k * n + i, b = base + k * n + (i + 1) % n, c = a + n, d = b + n;
        if (!flip) idx.push(a, b, d, a, d, c); else idx.push(a, d, b, a, c, d);
      }
    }
    wall(outer, false);
    if (hole) wall(hole, false);
    var g1 = new THREE.BufferGeometry();
    g1.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g1.setIndex(idx); g1.computeVertexNormals();
    /* caps */
    var cpos = [], cidx = [];
    var oV = outer.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    var hV = hole ? [hole.map(function (p) { return new THREE.Vector2(p[0], p[1]); })] : [];
    var tri = THREE.ShapeUtils.triangulateShape(oV, hV);
    /* make every triangle anticlockwise seen from +z */
    var allP = outer.concat(hole || []);
    tri = tri.map(function (t) {
      var A = allP[t[0]], B = allP[t[1]], C = allP[t[2]];
      var cr = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
      return cr < 0 ? [t[0], t[2], t[1]] : t;
    });
    var all = outer.concat(hole || []);
    [0, layers.length - 1].forEach(function (li, side) {
      var L = layers[li], base = cpos.length / 3;
      all.forEach(function (p) { var q = xf(p, L); cpos.push(q[0], q[1], q[2]); });
      tri.forEach(function (t) { if (side) cidx.push(base + t[0], base + t[1], base + t[2]); else cidx.push(base + t[0], base + t[2], base + t[1]); });
    });
    var g2 = new THREE.BufferGeometry();
    g2.setAttribute('position', new THREE.Float32BufferAttribute(cpos, 3)); g2.setIndex(cidx); g2.computeVertexNormals();
    return [g1, g2];
  };
  function merge(geos) {
    /* simple merge of indexed geometries with position + normal */
    var pos = [], nor = [], idx = [], off = 0;
    geos.forEach(function (g) {
      var p = g.attributes.position.array, n = g.attributes.normal.array, ix = g.index.array;
      for (var i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); }
      for (var j = 0; j < ix.length; j++) idx.push(ix[j] + off);
      off += p.length / 3;
    });
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setIndex(idx);
    return g;
  }
  K.merge = merge;
  /* involute gear. o: {phase, bore, helix (rad, + right hand), herring, nz, crown (wheel throat), keyway} */
  K.gearGeo = function (T, m, w, o) {
    o = o || {};
    var phi = (o.phi || 20) * Math.PI / 180;
    var ol = Gear.outline(T, m, phi, 1, 1.25, o.phase || 0, 6);
    var pts = ol.pts, r = ol.r;
    var hole = null;
    if (o.bore) {
      hole = circle(o.bore, 48);
      if (o.keyway) { /* notch at +x */
        var kw = o.bore * 0.5, kd = o.bore * 0.28, h2 = [];
        hole.forEach(function (p) { if (Math.abs(p[1]) < kw / 2 && p[0] > 0) h2.push([o.bore + kd, p[1]]); else h2.push(p); });
        hole = h2;
      }
    }
    var nz = o.nz || (o.helix || o.crown ? 16 : 1), layers = [];
    for (var k = 0; k <= nz; k++) {
      var z = -w / 2 + w * k / nz, tw = 0;
      if (o.helix) tw = (o.herring ? Math.abs(z) : z) * Math.tan(o.helix) / r;
      var sc = 1;
      if (o.crown) { var u = 2 * z / w; sc = 1 - o.crown * (1 - u * u); }
      layers.push({ z: z, a: tw, s: sc });
    }
    var g = K.swept(pts, hole, layers);
    return merge(g);
  };
  /* straight bevel gear: back face at z = 0, teeth run towards the apex on +z.
     delta: pitch-cone half angle (rad); F: face width along the cone */
  K.bevelGeo = function (T, m, F, delta, o) {
    o = o || {};
    var ol = Gear.outline(T, m, 20 * Math.PI / 180, 1, 1.25, o.phase || 0, 6);
    var R = ol.r, A0 = R / Math.sin(delta), smin = 1 - F / A0, nz = 6, layers = [];
    for (var k = 0; k <= nz; k++) { var s = 1 - (1 - smin) * k / nz; layers.push({ z: (1 - s) * A0 * Math.cos(delta), a: 0, s: s }); }
    return merge(K.swept(ol.pts, o.bore ? circle(o.bore, 40) : null, layers));
  };
  /* rack along x, teeth up (+y), pitch line at y = 0, width along z */
  K.rackGeo = function (n, m, w, depth) {
    var p = Math.PI * m, ta = Math.tan(20 * Math.PI / 180), ha = m, hf = 1.25 * m, pts = [];
    var x0 = -n * p / 2;
    pts.push([x0, -depth]);
    for (var i = 0; i < n; i++) {
      var c = x0 + p * (i + 0.5);
      pts.push([c - p / 2, -hf]);
      pts.push([c - p / 4 - hf * ta, -hf]);
      pts.push([c - p / 4 + ha * ta, ha]);
      pts.push([c + p / 4 - ha * ta, ha]);
      pts.push([c + p / 4 + hf * ta, -hf]);
    }
    pts.push([x0 + n * p, -hf]); pts.push([x0 + n * p, -depth]);
    var g = merge(K.swept(pts, null, [{ z: -w / 2, a: 0, s: 1 }, { z: w / 2, a: 0, s: 1 }]));
    return g;
  };
  /* worm along z: axial module m, starts, length, pitch radius rp */
  K.wormGeo = function (m, starts, len, rp) {
    var p = Math.PI * m, L = p * starts, ta = Math.tan(20 * Math.PI / 180), ra = rp + m, rf = rp - 1.25 * m;
    var na = 96, nzs = Math.round(len / p * 28), pos = [], idx = [];
    function rad(z, th) {
      var u = z - L * th / (2 * Math.PI); u = ((u % p) + p) % p;
      var d = Math.abs(u - p / 2);
      var rr = rp + (p / 4 - d) / ta;
      return Math.max(rf, Math.min(ra, rr));
    }
    for (var j = 0; j <= nzs; j++) {
      var z = -len / 2 + len * j / nzs;
      for (var i = 0; i < na; i++) { var th = i / na * Math.PI * 2, rr = rad(z, th); pos.push(rr * Math.cos(th), rr * Math.sin(th), z); }
    }
    for (var j2 = 0; j2 < nzs; j2++) for (var i2 = 0; i2 < na; i2++) {
      var a = j2 * na + i2, b = j2 * na + (i2 + 1) % na, c = a + na, d = b + na;
      idx.push(a, b, d, a, d, c);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return { geo: g, ra: ra, rf: rf, lead: L };
  };

  /* ---------- machine elements ---------- */
  /* pillow-block bearing: shaft along z through the origin, foot on y = -hgt */
  K.pillow = function (rs, mat, boltMat) {
    var G = M3D.geo, g = new THREE.Group(), hgt = rs * 3.2, L = rs * 2.4;
    var s = new THREE.Shape();
    s.moveTo(-rs * 5, -hgt); s.lineTo(rs * 5, -hgt); s.lineTo(rs * 5, -hgt + rs * 0.9); s.lineTo(rs * 2.6, -hgt + rs * 1.2);
    s.absarc(0, 0, rs * 2.6, -0.25, Math.PI + 0.25, false);
    s.lineTo(-rs * 5, -hgt + rs * 0.9); s.closePath();
    var hp = new THREE.Path(); hp.absarc(0, 0, rs * 1.6, 0, Math.PI * 2, true); s.holes.push(hp);
    var hous = G.mesh(G.extrude(s, L, rs * 0.12), mat); g.add(hous);
    var race = G.mesh(G.ring(rs * 1.62, rs * 1.02, L * 0.9, 40), M3D.mat.metal(0xc5c9ce, 0.25)); race.rotation.x = Math.PI / 2; g.add(race);
    var grease = G.mesh(new THREE.CylinderGeometry(rs * 0.22, rs * 0.3, rs * 0.7, 6), M3D.mat.metal(0xc9a24f, 0.3)); grease.position.y = rs * 2.9; g.add(grease);
    [-1, 1].forEach(function (k) { var b = K.bolt(rs * 0.7, 0, boltMat || M3D.mat.metal(0x9aa0a8, 0.35)); b.position.set(k * rs * 3.9, -hgt + rs * 0.9 + rs * 0.12, 0); g.add(b); });
    g.userData.h = hgt;
    return g;
  };
  /* electric motor along z (shaft out at +z), feet on y = -(R + foot) */
  K.motor = function (R, L, color, label) {
    var G = M3D.geo, Mt = M3D.mat, g = new THREE.Group(), body = Mt.castPaint(color || 0x2f5d8a, 0.5);
    var shell = G.mesh(new THREE.CylinderGeometry(R, R, L, 48), body); shell.rotation.x = Math.PI / 2; g.add(shell);
    for (var i = 0; i < 18; i++) {
      var a = i / 18 * Math.PI * 2; if (Math.abs(Math.sin(a) + 1) < 0.25) continue;
      var fin = G.mesh(new THREE.BoxGeometry(R * 0.1, R * 0.16, L * 0.86), body);
      fin.position.set((R + R * 0.06) * Math.cos(a), (R + R * 0.06) * Math.sin(a), 0); fin.rotation.z = a; g.add(fin);
    }
    var endF = G.mesh(G.lathe([[0, 0], [R * 1.02, 0], [R * 1.02, R * 0.08], [R * 0.7, R * 0.22], [R * 0.3, R * 0.28], [0, R * 0.28]], 48), body);
    endF.rotation.x = Math.PI / 2; endF.position.z = L / 2; g.add(endF);
    var cowl = G.mesh(G.lathe([[0, 0], [R * 1.02, 0], [R * 1.02, -R * 0.45], [R * 0.85, -R * 0.6], [0, -R * 0.62]], 48), Mt.paint(0x2a2d31, 0.55));
    cowl.rotation.x = Math.PI / 2; cowl.position.z = -L / 2; g.add(cowl);
    for (var s2 = 0; s2 < 10; s2++) { var slot = G.mesh(new THREE.BoxGeometry(R * 1.2, R * 0.03, 0.002 + R * 0.01), Mt.rubber(0x0d0d0d)); slot.position.set(0, -R * 0.55 + s2 * R * 0.12, -L / 2 - R * 0.62); slot.scale.x = Math.sqrt(Math.max(0.05, 1 - Math.pow((-R * 0.55 + s2 * R * 0.12) / R, 2))); g.add(slot); }
    var tb = G.mesh(G.roundedBox(R * 0.75, R * 0.45, R * 0.8, R * 0.08, R * 0.03), body); tb.position.set(0, R * 1.12, L * 0.1); g.add(tb);
    var gland = G.mesh(new THREE.CylinderGeometry(R * 0.09, R * 0.09, R * 0.2, 6), Mt.metal(0x9aa0a8, 0.3)); gland.rotation.z = Math.PI / 2; gland.position.set(R * 0.45, R * 1.12, L * 0.1); g.add(gland);
    var ft = G.mesh(G.roundedBox(R * 1.9, R * 0.16, L * 0.8, R * 0.05, R * 0.02), body); ft.position.y = -R * 1.05; g.add(ft);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { var b = K.bolt(R * 0.13, 0, Mt.metal(0x9aa0a8, 0.35)); b.position.set(q[0] * R * 0.78, -R * 0.97, q[1] * L * 0.3); g.add(b); });
    var plate = G.decal(R * 0.9, R * 0.45, M3D.tex.label(320, 160, '#c9ccd0', [[label || 'MOTOR', 30, 700], ['3 ph  415 V  50 Hz', 22], ['1440 rpm   IP55', 22]], '#555'));
    plate.position.set(R * 1.01, 0, -L * 0.1); plate.rotation.y = Math.PI / 2; g.add(plate);
    var shaft = new THREE.Group();
    var sh = G.mesh(new THREE.CylinderGeometry(R * 0.16, R * 0.16, R * 0.9, 24), Mt.metal(0xd3d7dc, 0.2)); sh.rotation.x = Math.PI / 2; sh.position.z = R * 0.45; shaft.add(sh);
    var key = G.mesh(new THREE.BoxGeometry(R * 0.07, R * 0.05, R * 0.5), Mt.metal(0x8a9098, 0.4)); key.position.set(0, R * 0.17, R * 0.55); shaft.add(key);
    shaft.position.z = L / 2 + R * 0.28; g.add(shaft);
    g.userData.shaft = shaft; g.userData.foot = R * 1.13;
    return g;
  };
  /* force arrow: shaft + cone, set with K.setArrow(a, origin, vector, metresPerUnit) */
  K.arrow = function (color, r) {
    var G = M3D.geo, g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: color, metalness: 0, roughness: 0.4, emissive: color, emissiveIntensity: 0.25 });
    var sh = G.mesh(new THREE.CylinderGeometry(r, r, 1, 16), mat, false); sh.position.y = 0.5; g.add(sh);
    var hd = G.mesh(new THREE.ConeGeometry(r * 2.6, r * 7, 20), mat, false); g.add(hd);
    g.userData = { sh: sh, hd: hd, r: r };
    return g;
  };
  K.setArrow = function (a, origin, vec, scale, tipAtOrigin) {
    UP = UP || V(0, 1, 0);
    var len = vec.length() * scale, u = a.userData, hl = u.r * 7;
    a.visible = len > u.r * 2;
    if (!a.visible) return;
    var d = vec.clone().normalize();
    a.quaternion.setFromUnitVectors(UP, d);
    var start = tipAtOrigin ? origin.clone().addScaledVector(d, -len) : origin.clone();
    a.position.copy(start);
    var sl = Math.max(0.0001, len - hl);
    u.sh.scale.y = sl; u.sh.position.y = sl / 2;
    u.hd.position.y = sl + hl / 2;
  };
  /* a flat base plate with chamfered edges, top face at y = 0 */
  K.plate = function (w, d, t, mat) {
    var m = M3D.geo.mesh(M3D.geo.roundedBox(w, d, t, Math.min(w, d) * 0.04, t * 0.2), mat);
    m.rotation.x = -Math.PI / 2; m.position.y = -t / 2;
    return m;
  };
})();
