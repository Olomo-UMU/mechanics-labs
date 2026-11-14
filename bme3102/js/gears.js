/* gears.js: involute gear geometry shared by the 2D models and the 3D planetary set */
(function () {
  'use strict';
  var Gear = window.Gear = {};
  function inv(a) { return Math.tan(a) - a; }
  Gear.inv = inv;
  /* outline of an external gear, centred at the origin, tooth k centred at angle phase + 2πk/T.
     m: module, phi: pressure angle (rad), add/ded in modules. Returns [[x,y],...] closed loop, anticlockwise. */
  Gear.outline = function (T, m, phi, add, ded, phase, nf) {
    add = add == null ? 1 : add; ded = ded == null ? 1.25 : ded; phase = phase || 0; nf = nf || 7;
    var r = m * T / 2, rb = r * Math.cos(phi), ra = r + add * m, rf = Math.max(r - ded * m, 0.2 * r);
    var half = Math.PI / (2 * T) + inv(phi);
    function psi(rr) { var c = rb / Math.max(rr, rb); return half - inv(Math.acos(Math.min(1, c))); }
    var r0 = Math.max(rb, rf);
    var tipHalf = psi(ra);
    if (tipHalf < 0.002) { /* pointed tooth: trim the addendum */
      var lo = r0, hi = ra;
      for (var it = 0; it < 40; it++) { var mid = (lo + hi) / 2; if (psi(mid) > 0.002) lo = mid; else hi = mid; }
      ra = lo; tipHalf = psi(ra);
    }
    var pts = [];
    function P(rr, a) { pts.push([rr * Math.cos(a), rr * Math.sin(a)]); }
    for (var k = 0; k < T; k++) {
      var c = phase + 2 * Math.PI * k / T, j;
      var aRoot = c - psi(r0);
      /* root arc from mid-space to the flank */
      var a0 = c - Math.PI / T;
      for (j = 0; j <= 3; j++) P(rf, a0 + (aRoot - a0) * j / 3);
      if (rf < rb) P(rb, aRoot);
      for (j = 0; j <= nf; j++) { var rr = r0 + (ra - r0) * j / nf; P(rr, c - psi(rr)); }
      for (j = 1; j < 3; j++) P(ra, c - tipHalf + 2 * tipHalf * j / 3);
      for (j = nf; j >= 0; j--) { var rr2 = r0 + (ra - r0) * j / nf; P(rr2, c + psi(rr2)); }
      if (rf < rb) P(rf, c + psi(r0));
      var a1 = c + Math.PI / T;
      for (j = 1; j <= 3; j++) P(rf, c + psi(r0) + (a1 - c - psi(r0)) * j / 3);
    }
    return { pts: pts, r: r, rb: rb, ra: ra, rf: rf };
  };
  /* internal (annulus) teeth: the spaces of the annulus are external-tooth shapes on the same base circle.
     toothPhase: angle of the centre of an annulus tooth */
  Gear.internal = function (T, m, phi, toothPhase) {
    var o = Gear.outline(T, m, phi, 1.25, 1.0, (toothPhase || 0) + Math.PI / T);
    return o;
  };
  /* meshing phase: given gear A (teeth TA, radius rA) with a tooth centre at angle cA,
     and gear B at direction dirAB from A, return a tooth-centre angle for B (external mesh). */
  Gear.meshPhase = function (TA, cA, dirAB, TB, internal) {
    var pitchA = 2 * Math.PI / TA;
    var d = dirAB - cA; d = d - Math.round(d / pitchA) * pitchA; /* offset of the direction from the nearest A tooth */
    var rA = TA, rB = TB; /* radii proportional to teeth */
    var s = -d * rA; /* pitch-arc position of A's tooth relative to the contact, anticlockwise positive */
    if (!internal) {
      /* B's direction towards A is dirAB + π; arc s maps to angle -s/rB about B */
      return dirAB + Math.PI - s / rB + Math.PI / TB;
    }
    /* internal: B is the annulus around A; contact is in direction dirAB from both centres */
    return dirAB + s / rB + Math.PI / TB;
  };
})();
