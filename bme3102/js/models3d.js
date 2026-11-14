/* models3d.js: lazy three.js (r147) viewer for procedural equipment models.
   Each builder returns {group, parts:[{name,desc,photo,obj,off,at}], cam, target, noGround, noRotate, tick}.
   off: take-apart offset (group space); at: pin anchor in the part's local space. */
(function () {
  'use strict';
  var M3D = window.M3D = { builders: {} };
  var loading = null;

  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function loadThree() {
    if (window.THREE && THREE.OrbitControls) return Promise.resolve();
    if (!loading) loading = loadScript('vendor/three/three.min.js').then(function () { return loadScript('vendor/three/OrbitControls.js'); });
    return loading;
  }
  function webglOK() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
  }

  /* ---------------- procedural textures ---------------- */
  var T = M3D.tex = {};
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function noise(ctx, w, h, a, b, n, alpha) { for (var i = 0; i < n; i++) { var v = a + Math.random() * (b - a); ctx.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + alpha + ')'; ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } }
  T.canvasTex = function (c, srgb, repeat) {
    var t = new THREE.CanvasTexture(c);
    if (srgb) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  };
  T.brushed = function () {
    if (T._brushed) return T._brushed;
    var c = cv(256, 256), x = c.getContext('2d');
    x.fillStyle = 'rgb(110,110,110)'; x.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 1400; i++) { var v = 80 + Math.random() * 90; x.strokeStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.35)'; var y = Math.random() * 256; x.beginPath(); x.moveTo(0, y); x.lineTo(256, y + (Math.random() - 0.5) * 2); x.stroke(); }
    return (T._brushed = T.canvasTex(c, false, [2, 2]));
  };
  T.cast = function (base) {
    var c = cv(256, 256), x = c.getContext('2d');
    x.fillStyle = base || '#7d8288'; x.fillRect(0, 0, 256, 256);
    noise(x, 256, 256, 60, 180, 6000, 0.08);
    return T.canvasTex(c, true, [3, 3]);
  };
  T.castRough = function () {
    if (T._castR) return T._castR;
    var c = cv(256, 256), x = c.getContext('2d');
    x.fillStyle = 'rgb(200,200,200)'; x.fillRect(0, 0, 256, 256);
    noise(x, 256, 256, 120, 255, 12000, 0.5);
    return (T._castR = T.canvasTex(c, false, [3, 3]));
  };
  T.lining = function () {
    var c = cv(512, 512), x = c.getContext('2d');
    x.fillStyle = '#4a3b30'; x.fillRect(0, 0, 512, 512);
    noise(x, 512, 512, 20, 160, 26000, 0.35);
    for (var i = 0; i < 400; i++) { x.fillStyle = 'rgba(200,170,110,' + (0.15 + Math.random() * 0.3) + ')'; x.fillRect(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 6, 1); }
    return T.canvasTex(c, true);
  };
  /* text decal: lines [[text, sizePx, weight, colour]] */
  T.label = function (w, h, bg, lines, border) {
    var c = cv(w, h), x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    if (border) { x.strokeStyle = border; x.lineWidth = Math.max(2, w / 120); x.strokeRect(x.lineWidth, x.lineWidth, w - 2 * x.lineWidth, h - 2 * x.lineWidth); }
    var y = h * 0.08;
    lines.forEach(function (l) {
      x.fillStyle = l[3] || '#111'; x.font = (l[2] || 400) + ' ' + l[1] + 'px Roboto, Arial, sans-serif';
      x.textAlign = l[4] || 'center';
      y += l[1] * 1.15;
      x.fillText(l[0], l[4] === 'left' ? w * 0.06 : w / 2, y);
    });
    return T.canvasTex(c, true);
  };
  T.warning = function () {
    var c = cv(256, 224), x = c.getContext('2d');
    x.fillStyle = '#f2c200'; x.beginPath(); x.moveTo(128, 8); x.lineTo(248, 216); x.lineTo(8, 216); x.closePath(); x.fill();
    x.strokeStyle = '#111'; x.lineWidth = 12; x.lineJoin = 'round'; x.stroke();
    x.fillStyle = '#111'; x.font = '700 120px Arial'; x.textAlign = 'center'; x.fillText('!', 128, 190);
    return T.canvasTex(c, true);
  };

  /* height field to normal map; kind: 'grain' (cast), 'peel' (paint), 'knurl' */
  T.normal = function (kind) {
    T._nm = T._nm || {};
    if (T._nm[kind]) return T._nm[kind];
    var N = 256, h = new Float32Array(N * N), i, j;
    function blob(cx, cy, r, a) { for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) { var d = (x * x + y * y) / (r * r); if (d < 1) { var k = ((cy + y + N) % N) * N + ((cx + x + N) % N); h[k] += a * (1 - d) * (1 - d); } } }
    if (kind === 'knurl') { for (j = 0; j < N; j++) for (i = 0; i < N; i++) h[j * N + i] = Math.abs(Math.sin((i + j) * Math.PI / 16)) + Math.abs(Math.sin((i - j) * Math.PI / 16)); }
    else if (kind === 'peel') { for (i = 0; i < 900; i++) blob(Math.random() * N | 0, Math.random() * N | 0, 3 + Math.random() * 6 | 0, Math.random() - 0.5); }
    else { for (i = 0; i < 5000; i++) blob(Math.random() * N | 0, Math.random() * N | 0, 1 + Math.random() * 3 | 0, Math.random() - 0.45); }
    var c = cv(N, N), x = c.getContext('2d'), im = x.createImageData(N, N), st = kind === 'knurl' ? 2.5 : kind === 'peel' ? 2 : 3;
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      var dx = h[j * N + (i + 1) % N] - h[j * N + (i + N - 1) % N], dy = h[((j + 1) % N) * N + i] - h[((j + N - 1) % N) * N + i];
      var nx = -dx * st, ny = -dy * st, nz = 1, l = Math.hypot(nx, ny, nz), o = (j * N + i) * 4;
      im.data[o] = (nx / l * 0.5 + 0.5) * 255; im.data[o + 1] = (ny / l * 0.5 + 0.5) * 255; im.data[o + 2] = (nz / l * 0.5 + 0.5) * 255; im.data[o + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return (T._nm[kind] = T.canvasTex(c, false, kind === 'knurl' ? [6, 2] : [3, 3]));
  };
  /* ---------------- materials ---------------- */
  var Mt = M3D.mat = {};
  Mt.metal = function (color, rough, opts) {
    var m = new THREE.MeshStandardMaterial(Object.assign({ color: color, metalness: 1, roughness: rough == null ? 0.35 : rough, roughnessMap: T.brushed() }, opts || {}));
    return m;
  };
  Mt.cast = function (color, rough) { return new THREE.MeshStandardMaterial({ color: 0xffffff, map: T.cast(color), metalness: 0.55, roughness: rough == null ? 0.75 : rough, roughnessMap: T.castRough(), normalMap: T.normal('grain'), normalScale: new THREE.Vector2(0.35, 0.35) }); };
  Mt.paint = function (color, rough) { return new THREE.MeshPhysicalMaterial({ color: color, metalness: 0.1, roughness: rough == null ? 0.45 : rough, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.55, normalMap: T.normal('peel'), normalScale: new THREE.Vector2(0.06, 0.06) }); };
  /* cast iron painted over (machine frames): grainy hammer-tone paint */
  Mt.castPaint = function (color, rough) { return new THREE.MeshPhysicalMaterial({ color: color, metalness: 0.15, roughness: rough == null ? 0.55 : rough, clearcoat: 0.35, clearcoatRoughness: 0.4, envMapIntensity: 0.6, normalMap: T.normal('grain'), normalScale: new THREE.Vector2(0.07, 0.07) }); };
  Mt.knurl = function (color) { return new THREE.MeshStandardMaterial({ color: color || 0xb9bec4, metalness: 1, roughness: 0.4, normalMap: T.normal('knurl'), normalScale: new THREE.Vector2(1, 1) }); };
  Mt.wood = function () {
    var c = cv(512, 128), x = c.getContext('2d'); x.fillStyle = '#9a6a3c'; x.fillRect(0, 0, 512, 128);
    for (var i = 0; i < 90; i++) { x.strokeStyle = 'rgba(60,35,15,' + (0.08 + Math.random() * 0.18) + ')'; x.lineWidth = 0.5 + Math.random() * 2; var y = Math.random() * 128; x.beginPath(); x.moveTo(0, y); for (var k = 0; k <= 8; k++) x.lineTo(k * 64, y + Math.sin(k * 0.9 + i) * 3); x.stroke(); }
    return new THREE.MeshStandardMaterial({ map: T.canvasTex(c, true), metalness: 0, roughness: 0.6 });
  };
  Mt.oil = function () { return new THREE.MeshPhysicalMaterial({ color: 0x8a5a12, metalness: 0, roughness: 0.05, transmission: 0.3, transparent: true, opacity: 0.55, clearcoat: 1 }); };
  Mt.plastic = function (color, rough) { return new THREE.MeshStandardMaterial({ color: color, metalness: 0, roughness: rough == null ? 0.55 : rough }); };
  Mt.rubber = function (color) { return new THREE.MeshStandardMaterial({ color: color || 0x1a1a1a, metalness: 0, roughness: 0.9 }); };
  Mt.porcelain = function () { return new THREE.MeshPhysicalMaterial({ color: 0xf2f0ea, metalness: 0, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 }); };
  Mt.glass = function () { return new THREE.MeshPhysicalMaterial({ color: 0xcfe3ef, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.06, depthWrite: false }); };
  Mt.decal = function (tex) { return new THREE.MeshStandardMaterial({ map: tex, transparent: true, metalness: 0, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -4 }); };

  /* ---------------- geometry helpers ---------------- */
  var G = M3D.geo = {};
  G.roundRectShape = function (w, h, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    r = Math.min(r, w / 2, h / 2);
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };
  G.roundedBox = function (w, h, d, r, bevel) {
    bevel = bevel == null ? Math.min(r, d / 4) : bevel;
    var g = new THREE.ExtrudeGeometry(G.roundRectShape(w - 2 * bevel, h - 2 * bevel, Math.max(0.0001, r - bevel)), { depth: d - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10 });
    g.translate(0, 0, -(d - 2 * bevel) / 2);
    g.computeVertexNormals();
    return g;
  };
  /* lathe around Y from [[r,y],...] */
  G.lathe = function (pts, seg, phiStart, phiLen) {
    return new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), seg || 64, phiStart || 0, phiLen || Math.PI * 2);
  };
  /* tube ring (washer-like solid) around Y */
  G.ring = function (ro, ri, h, seg) { return G.lathe([[ri, -h / 2], [ro, -h / 2], [ro, h / 2], [ri, h / 2], [ri, -h / 2]], seg || 64); };
  G.hex = function (af, h) { var g = new THREE.CylinderGeometry(af / Math.sqrt(3), af / Math.sqrt(3), h, 6); return g; };
  G.extrude = function (shape, depth, bevel) {
    var g = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: !!bevel, bevelThickness: bevel || 0, bevelSize: bevel || 0, bevelSegments: 2, curveSegments: 24 });
    g.translate(0, 0, -depth / 2); g.computeVertexNormals(); return g;
  };
  G.mesh = function (geo, mat, cast) { var m = new THREE.Mesh(geo, mat); m.castShadow = cast !== false; m.receiveShadow = true; return m; };
  /* decal plane facing +z */
  G.decal = function (w, h, tex) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), Mt.decal(tex)); m.castShadow = false; return m; };

  /* ---------------- environment ---------------- */
  /* studio room with soft light boxes, for realistic reflections on metal */
  function envTexture(renderer) {
    var scene = new THREE.Scene(), geo = new THREE.BoxGeometry();
    var roomM = new THREE.MeshStandardMaterial({ side: THREE.BackSide, color: 0xbfc3c8, roughness: 1, metalness: 0 });
    var boxM = new THREE.MeshStandardMaterial({ color: 0x8a8d91, roughness: 1, metalness: 0 });
    var pl = new THREE.PointLight(0xffffff, 900, 0, 2); pl.position.set(0.4, 16, 0.3); scene.add(pl);
    var room = new THREE.Mesh(geo, roomM); room.position.set(-0.76, 13.2, 0.72); room.scale.set(31.7, 28.3, 28.6); scene.add(room);
    [[-10.9, 2.2, -2.8, 2.6, 4.4, 2.6], [5.8, 3.3, -6.3, 3.4, 6.6, 2.6], [-6.1, 1.6, 2.9, 3.1, 3.3, 3.6], [-0.2, 2.5, 5.9, 5, 5, 0.8], [7.7, 1.3, 5.3, 2.4, 2.6, 2.4]].forEach(function (b) {
      var m = new THREE.Mesh(geo, boxM); m.position.set(b[0], b[1], b[2]); m.scale.set(b[3], b[4], b[5]); scene.add(m);
    });
    function lightBox(intensity, p, sc) { var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity) })); m.position.set(p[0], p[1], p[2]); m.scale.set(sc[0], sc[1], sc[2]); scene.add(m); }
    lightBox(50, [-16.1, 14.4, 8.2], [0.1, 2.4, 2.7]);
    lightBox(50, [-16.1, 18.0, -8.2], [0.1, 2.4, 2.75]);
    lightBox(17, [14.9, 12.2, -1.8], [0.15, 4.3, 6.3]);
    lightBox(43, [-0.46, 8.9, 14.5], [4.4, 5.4, 0.09]);
    lightBox(20, [3.2, 11.5, -12.5], [2.5, 2, 0.1]);
    lightBox(100, [0, 20, 0], [1, 0.1, 1]);
    var pm = new THREE.PMREMGenerator(renderer);
    var env = pm.fromScene(scene, 0.035).texture; pm.dispose();
    return env;
  }
  function setupRenderer(canvasHost, w, h) {
    var r = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.setSize(w, h, false);
    r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.74;
    r.physicallyCorrectLights = true;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.setClearColor(0xffffff, 1);
    canvasHost.appendChild(r.domElement);
    r._env = envTexture(r);
    return r;
  }
  function addLights(scene, box, shadows) {
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.3));
    var size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    var R = Math.max(size.x, size.y, size.z);
    var sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(ctr.x + R * 1.2, ctr.y + R * 2.2, ctr.z + R * 1.5);
    sun.target.position.copy(ctr); scene.add(sun.target);
    if (shadows) {
      sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      var sc = sun.shadow.camera; sc.left = -R * 1.3; sc.right = R * 1.3; sc.top = R * 1.3; sc.bottom = -R * 1.3; sc.near = 0.01; sc.far = R * 8;
      sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.01;
    }
    scene.add(sun);
    var fill = new THREE.DirectionalLight(0xdfe8ff, 0.5); fill.position.set(ctr.x - R * 2, ctr.y + R, ctr.z - R); scene.add(fill);
  }

  /* one WebGL context drives every viewer on the page; each viewer copies the frame to its own 2D canvas */
  var shared = null;
  function getShared() {
    if (shared) return shared;
    var host = document.createElement('div');
    shared = setupRenderer(host, 640, 400);
    shared._w = 640; shared._h = 400;
    return shared;
  }
  /* ---------------- shared close-up renderer ---------------- */
  var zoom = null;
  function getZoom() {
    if (zoom) return zoom;
    var host = document.createElement('div');
    var r = setupRenderer(host, 300, 150);
    r.shadowMap.enabled = false;
    var scene = new THREE.Scene(); scene.environment = r._env; scene.background = new THREE.Color(0xfbfbfc);
    var cam = new THREE.PerspectiveCamera(35, 2, 0.001, 100);
    zoom = { r: r, scene: scene, cam: cam, obj: null, lightsDone: false };
    return zoom;
  }

  /* bounding box of visible meshes only */
  function visBox(obj) {
    var bx = new THREE.Box3(), tmp = new THREE.Box3();
    obj.updateMatrixWorld(true);
    (function walk(o) {
      if (!o.visible) return;
      if (o.isMesh && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); bx.union(tmp); }
      o.children.forEach(walk);
    })(obj);
    return bx;
  }
  M3D.visBox = visBox;
  /* ---------------- viewer ---------------- */
  function Viewer(el) {
    this.el = el; this.kind = el.dataset.model;
    var b = M3D.builders[this.kind];
    if (!b) { el.innerHTML = '<div class="fallback">Model "' + this.kind + '" not found.</div>'; return; }
    el.innerHTML = '';
    var stage = this.stage = document.createElement('div'); stage.className = 'stage3d';
    stage.innerHTML = '<div class="loading">Building the model.</div>';
    var pins = this.pinsEl = document.createElement('div'); pins.className = 'pins';
    var tools = document.createElement('div'); tools.className = 'tools';
    var parts = this.partsEl = document.createElement('div'); parts.className = 'parts';
    var call = this.call = document.createElement('div'); call.className = 'callout';
    call.innerHTML = '<button class="x" title="Close" aria-label="Close">×</button><h5></h5><div class="zoom"></div><div class="ph"></div><p></p>';
    var svg = this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'lead');
    svg.innerHTML = '<line stroke="#4a4f57" stroke-width="1.2" stroke-dasharray="4 3"/><circle r="3" fill="#4a4f57"/>';
    el.appendChild(stage); el.appendChild(parts); el.appendChild(call); el.appendChild(svg);
    stage.appendChild(pins); stage.appendChild(tools);
    var self = this;
    call.querySelector('.x').addEventListener('click', function () { self.select(-1); });
    var w = stage.clientWidth || 700, h = stage.clientHeight || 430;
    var r = this.r = getShared();
    var cv2 = this.cv = document.createElement('canvas'); cv2.className = 'view3d'; cv2.style.touchAction = 'none';
    stage.insertBefore(cv2, pins); this.ctx2 = cv2.getContext('2d');
    var hud = this.hud = document.createElement('div'); hud.className = 'hud'; stage.appendChild(hud);
    stage.querySelector('.loading').remove();
    var scene = this.scene = new THREE.Scene(); scene.environment = r._env; scene.background = new THREE.Color(0xffffff);
    var m = this.m = b(THREE);
    scene.add(m.group);
    m.group.updateMatrixWorld(true);
    var box = visBox(m.group);
    this.box = box;
    addLights(scene, box, true);
    if (!m.noGround) {
      var size = box.getSize(new THREE.Vector3());
      var pl = new THREE.Mesh(new THREE.PlaneGeometry(size.x * 8 + 1, size.z * 8 + 1), new THREE.ShadowMaterial({ opacity: 0.2 }));
      pl.rotation.x = -Math.PI / 2; pl.position.y = box.min.y - 0.0005; pl.receiveShadow = true; scene.add(pl);
    }
    var cam = this.cam = new THREE.PerspectiveCamera(32, w / h, 0.005, 200);
    /* fit: assembled box and taken-apart box */
    var dir = new THREE.Vector3().fromArray(m.cam).sub(new THREE.Vector3().fromArray(m.target)).normalize();
    var boxX = box.clone();
    m.parts.forEach(function (p) {
      var o = new THREE.Vector3().fromArray(p.off || [0, 0, 0]);
      var bp = visBox(p.obj); bp.min.add(o); bp.max.add(o); boxX.union(bp);
    });
    function fitOf(bx) {
      var ctr = bx.getCenter(new THREE.Vector3()), rad = bx.getSize(new THREE.Vector3()).length() / 2;
      var vf = THREE.MathUtils.degToRad(cam.fov) / 2, hf = Math.atan(Math.tan(vf) * Math.max(1, w / h));
      var dist = rad / Math.sin(Math.min(vf, hf)) * (m.fit || 0.82);
      return { target: ctr, dist: dist };
    }
    this.fitA = fitOf(box); this.fitX = fitOf(boxX); this.dir = dir;
    this.home = { cam: this.fitA.target.clone().addScaledVector(dir, this.fitA.dist), target: this.fitA.target.clone() };
    cam.position.copy(this.home.cam);
    var ctl = this.ctl = new THREE.OrbitControls(cam, cv2);
    ctl.target.copy(this.home.target); ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.autoRotateSpeed = 1.2;
    ctl.update();
    /* parts: remember base pose, own materials */
    m.parts.forEach(function (p, i) {
      p.base = p.obj.position.clone();
      p.offV = new THREE.Vector3().fromArray(p.off || [0, 0, 0]);
      p.atV = new THREE.Vector3().fromArray(p.at || [0, 0, 0]);
      p.obj.traverse(function (o) {
        if (o.isMesh) {
          o.material = o.material.clone();
          o.userData.op = o.material.opacity; o.userData.tr = o.material.transparent; o.userData.pi = i;
        }
      });
      var pin = document.createElement('div'); pin.className = 'pin'; pin.textContent = i + 1; pin.title = p.name;
      pin.addEventListener('click', function (e) { e.stopPropagation(); self.select(self.sel === i ? -1 : i); });
      pins.appendChild(pin); p.pin = pin;
    });
    parts.innerHTML = '<h4>Parts</h4><ol></ol><p class="muted" style="font-size:12px;margin-top:8px">Drag to turn, scroll or pinch to zoom. Click a part, a number or a name for a close-up.</p>';
    if (m.controls || m.buttons) {
      var lab = document.createElement('div'); lab.className = 'lab';
      lab.innerHTML = '<h4>' + (m.labTitle || 'Lab controls') + '</h4>';
      parts.insertBefore(lab, parts.firstChild);
      (m.controls || []).forEach(function (c) {
        var row = document.createElement('label'); row.className = 'lrow';
        var fmt = c.fmt || function (v) { return String(v); };
        row.innerHTML = '<span>' + c.label + (c.unit ? ' <i>(' + c.unit + ')</i>' : '') + '</span><output></output>';
        var inp = document.createElement('input'); inp.type = 'range'; inp.min = c.min; inp.max = c.max; inp.step = c.step || 'any'; inp.value = c.value;
        inp.setAttribute('aria-label', c.label);
        row.appendChild(inp); lab.appendChild(row);
        var out = row.querySelector('output');
        function apply() { out.textContent = fmt(+inp.value); c.set(+inp.value); }
        inp.addEventListener('input', apply); apply();
        inp.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      });
      if (m.buttons) { var bd = document.createElement('div'); bd.className = 'lbtns'; m.buttons.forEach(function (b) { var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = b.label; bt.addEventListener('click', function () { b.fn(bt); }); bd.appendChild(bt); }); lab.appendChild(bd); }
    }
    var ol = parts.querySelector('ol');
    m.parts.forEach(function (p, i) { var li = document.createElement('li'); li.textContent = p.name; li.addEventListener('click', function () { self.select(self.sel === i ? -1 : i); }); ol.appendChild(li); p.li = li; });
    /* tools */
    this.ex = 0; this.exT = 0; this.running = !!m.tick; this.sel = -1; this.time = 0;
    function btn(txt, fn) { var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = txt; bt.addEventListener('click', function () { fn(bt); }); tools.appendChild(bt); return bt; }
    btn('Take apart', function (bt) { self.exT = self.exT ? 0 : 1; bt.textContent = self.exT ? 'Put together' : 'Take apart'; bt.classList.toggle('on', !!self.exT); self.dolly = 1; });
    if (!m.noRotate) btn('Turn slowly', function (bt) { ctl.autoRotate = !ctl.autoRotate; bt.classList.toggle('on', ctl.autoRotate); });
    if (m.tick) { var rb = btn(m.runLabel || 'Stop', function (bt) { self.running = !self.running; bt.textContent = self.running ? 'Stop' : 'Run'; }); rb.textContent = 'Stop'; }
    btn('Reset view', function () { self.dolly = 0; var F = self.exT ? self.fitX : self.fitA; ctl.target.copy(F.target); cam.position.copy(F.target).addScaledVector(self.dir, F.dist); ctl.autoRotate = false; tools.querySelectorAll('button').forEach(function (bb) { if (bb.textContent === 'Turn slowly') bb.classList.remove('on'); }); ctl.update(); });
    /* picking */
    var ray = new THREE.Raycaster(), down = null;
    cv2.addEventListener('pointerdown', function (e) { down = [e.clientX, e.clientY]; });
    cv2.addEventListener('pointerup', function (e) {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      var rc = cv2.getBoundingClientRect();
      var v = new THREE.Vector2((e.clientX - rc.left) / rc.width * 2 - 1, -(e.clientY - rc.top) / rc.height * 2 + 1);
      ray.setFromCamera(v, cam);
      var hits = ray.intersectObject(m.group, true).filter(function (hh) { return hh.object.userData.pi != null && (self.sel < 0 || hh.object.material.opacity > 0.5); });
      self.select(hits.length ? (hits[0].object.userData.pi === self.sel ? -1 : hits[0].object.userData.pi) : -1);
    });
    this.resize();
    window.addEventListener('resize', function () { self.resize(); });
    document.addEventListener('deck:show', function () { setTimeout(function () { self.resize(); }, 30); });
    var last = performance.now();
    function frame(t) {
      requestAnimationFrame(frame);
      var dt = Math.min(0.05, (t - last) / 1000); last = t;
      var vis = window.Deck ? window.Deck.visible(el) : true;
      if (!vis && !document.documentElement.classList.contains('printing')) return;
      self.step(dt);
    }
    requestAnimationFrame(frame);
    document.addEventListener('deck:print', function () { self.resize(); self.step(0); });
  }
  Viewer.prototype.resize = function () {
    var w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h) return;
    var pr = this.r.getPixelRatio();
    this.cv.width = Math.round(w * pr); this.cv.height = Math.round(h * pr);
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
  };
  Viewer.prototype.step = function (dt) {
    var self = this, m = this.m;
    this.ex += (this.exT - this.ex) * Math.min(1, dt * 4);
    if (this.dolly) {
      var F = this.exT ? this.fitX : this.fitA, k = Math.min(1, dt * 3);
      var cur = this.cam.position.clone().sub(this.ctl.target), d = cur.length();
      this.ctl.target.lerp(F.target, k);
      cur.setLength(d + (F.dist - d) * k);
      this.cam.position.copy(this.ctl.target).add(cur);
      if (Math.abs(F.dist - d) < F.dist * 0.01 && this.ctl.target.distanceTo(F.target) < F.dist * 0.005) this.dolly = 0;
    }
    if (this.running && m.tick) this.time += dt;
    m.parts.forEach(function (p) { p.obj.position.copy(p.base); });
    if (m.tick) m.tick(this.time, this.ex, this.running ? dt : 0);
    m.parts.forEach(function (p) { p.obj.position.addScaledVector(p.offV, self.ex); });
    this.ctl.update();
    var w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h) return;
    if (this.r._w !== w || this.r._h !== h) { this.r.setSize(w, h, false); this.r._w = w; this.r._h = h; }
    if (this.cv.width !== Math.round(w * this.r.getPixelRatio())) this.resize();
    this.r.render(this.scene, this.cam);
    this.ctx2.drawImage(this.r.domElement, 0, 0, this.cv.width, this.cv.height);
    if (m.hud) { this.hudT = (this.hudT || 0) + dt; if (this.hudT > 0.1 || !this.hudDone) { this.hudT = 0; this.hudDone = 1; this.hud.innerHTML = m.hud(); } }
    /* pins */
    m.group.updateMatrixWorld(true);
    var v = new THREE.Vector3();
    m.parts.forEach(function (p, i) {
      v.copy(p.atV).applyMatrix4(p.obj.matrixWorld).project(self.cam);
      var x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
      p.pin.style.left = x + 'px'; p.pin.style.top = y + 'px';
      p.pin.style.display = (v.z < 1 && x > -10 && x < w + 10 && y > -10 && y < h + 10) ? '' : 'none';
      p.sx = x; p.sy = y;
    });
    if (this.sel >= 0) this.placeCallout();
    if (this.sel >= 0 && zoom && zoom.obj) {
      zoom.obj.rotation.y += dt * 0.6;
      zoom.r.render(zoom.scene, zoom.cam);
    }
  };
  Viewer.prototype.placeCallout = function () {
    var p = this.m.parts[this.sel], el = this.el, call = this.call;
    if (window.innerWidth < 760) { this.svg.style.display = 'none'; return; }
    var W = el.clientWidth, sw = this.stage.clientWidth;
    var cw = call.offsetWidth || 300, ch = call.offsetHeight || 300;
    var left = p.sx < sw * 0.55 ? Math.min(W - cw - 4, sw - cw * 0.35) : 8;
    var top = Math.max(0, Math.min(this.stage.clientHeight - ch, p.sy - ch / 2));
    if (top < 0) top = 0;
    call.style.left = left + 'px'; call.style.top = top + 'px';
    var line = this.svg.querySelector('line'), dot = this.svg.querySelector('circle');
    var ex = left > p.sx ? left : left + cw, ey = Math.max(top + 14, Math.min(top + ch - 14, p.sy));
    line.setAttribute('x1', p.sx); line.setAttribute('y1', p.sy); line.setAttribute('x2', ex); line.setAttribute('y2', ey);
    dot.setAttribute('cx', p.sx); dot.setAttribute('cy', p.sy);
    this.svg.style.display = '';
  };
  Viewer.prototype.select = function (i) {
    var self = this, m = this.m;
    this.sel = i;
    m.parts.forEach(function (p, k) {
      p.pin.classList.toggle('on', k === i); p.li.classList.toggle('on', k === i);
      p.obj.traverse(function (o) {
        if (!o.isMesh) return;
        if (i < 0 || k === i) { o.material.opacity = o.userData.op; o.material.transparent = o.userData.tr; o.material.depthWrite = !o.userData.tr; }
        else { o.material.opacity = 0.14; o.material.transparent = true; o.material.depthWrite = false; }
        o.material.needsUpdate = true;
      });
    });
    if (i < 0) { this.call.classList.remove('show'); this.svg.style.display = 'none'; return; }
    var p = m.parts[i], call = this.call;
    call.querySelector('h5').textContent = (i + 1) + '. ' + p.name;
    call.querySelector('p').textContent = p.desc;
    call.classList.add('show');
    /* close-up */
    var z = getZoom();
    var zh = call.querySelector('.zoom');
    zh.innerHTML = ''; zh.appendChild(z.r.domElement);
    z.r.setSize(zh.clientWidth || 280, zh.clientHeight || 150, false);
    z.cam.aspect = (zh.clientWidth || 280) / (zh.clientHeight || 150); z.cam.updateProjectionMatrix();
    if (z.obj) { z.scene.remove(z.obj); }
    var clone = p.obj.clone(true);
    clone.position.set(0, 0, 0);
    clone.traverse(function (o) { if (o.isMesh) { o.material = o.material.clone(); o.material.opacity = o.userData.op; o.material.transparent = o.userData.tr; o.material.depthWrite = !o.userData.tr; } });
    var holder = new THREE.Group(); holder.add(clone);
    var bb = visBox(clone), ctr = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
    clone.position.sub(ctr);
    z.scene.add(holder); z.obj = holder;
    var big = Math.max(sz.x, sz.y, sz.z) || 0.1;
    z.cam.position.set(big * 1.05, big * 0.75, big * 1.6); z.cam.lookAt(0, 0, 0);
    if (!z.lightsDone) { addLights(z.scene, new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1)), false); z.lightsDone = true; }
    z.r.render(z.scene, z.cam);
    if (p.photo && window.renderPhoto) window.renderPhoto(call.querySelector('.ph'), p.photo, p.name);
    else call.querySelector('.ph').innerHTML = '';
    this.placeCallout();
  };

  /* ---------------- lazy start ---------------- */
  function start(el) {
    if (el._started) return; el._started = true;
    if (!webglOK()) { el.innerHTML = '<div class="fallback">This browser cannot show 3D graphics (WebGL is off). The rest of the page works normally.</div>'; return; }
    el.innerHTML = '<div class="stage3d"><div class="loading">Loading the 3D model.</div></div>';
    loadThree().then(function () {
      try { el._viewer = new Viewer(el); }
      catch (e) { el.innerHTML = '<div class="fallback">The 3D model could not start: ' + e.message + '</div>'; if (window.console) console.warn(e); }
    }).catch(function () { el.innerHTML = '<div class="fallback">The 3D library could not be loaded.</div>'; });
  }
  function init() {
    var els = document.querySelectorAll('.m3d[data-model]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(start); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { start(e.target); io.unobserve(e.target); } }); }, { rootMargin: '200px' });
    els.forEach(function (e) { io.observe(e); });
  }
  M3D.init = init;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  else setTimeout(init, 0);
})();
