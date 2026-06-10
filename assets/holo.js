/* Flash-AI.pro — signature hologram
   A wireframe chip with flowing data pulses that morphs into a neural brain, in a loop. */
(function () {
  const canvas = document.getElementById('holo');
  if (!canvas || !window.THREE) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0.6, 7.2);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const N = 2400;          // particles
  const L = 900;           // connecting line segments
  const HOLO = new THREE.Color('#59E3FF');
  const BRASS = new THREE.Color('#C9A961');

  // ---------- SHAPE A : the chip ----------
  // square die + pin grid + circuit traces
  const chipPos = new Float32Array(N * 3);
  (function buildChip() {
    let i = 0;
    const put = (x, y, z) => { chipPos[i*3]=x; chipPos[i*3+1]=y; chipPos[i*3+2]=z; i++; };
    const S = 2.1;
    // die border (dense)
    const border = Math.floor(N * 0.22);
    for (let k = 0; k < border; k++) {
      const t = (k / border) * 4;
      const side = Math.floor(t), f = t - side;
      let x, y;
      if (side === 0) { x = -S + 2*S*f; y =  S; }
      else if (side === 1) { x =  S; y =  S - 2*S*f; }
      else if (side === 2) { x =  S - 2*S*f; y = -S; }
      else { x = -S; y = -S + 2*S*f; }
      put(x, y, (Math.random()-0.5)*0.06);
    }
    // inner traces: orthogonal circuit lines
    const traces = Math.floor(N * 0.5);
    for (let k = 0; k < traces; k++) {
      const horiz = Math.random() > 0.5;
      const lane = (Math.floor(Math.random()*9) - 4) * (S/4.6);
      const t = (Math.random()*2 - 1) * S * 0.92;
      put(horiz ? t : lane, horiz ? lane : t, (Math.random()-0.5)*0.05);
    }
    // core block
    const core = Math.floor(N * 0.12);
    for (let k = 0; k < core; k++) {
      put((Math.random()-0.5)*0.9, (Math.random()-0.5)*0.9, (Math.random()-0.5)*0.12);
    }
    // pins around
    while (i < N) {
      const side = Math.floor(Math.random()*4);
      const a = (Math.floor(Math.random()*14)/13 * 2 - 1) * S * 0.9;
      const out = S + 0.18 + Math.random()*0.3;
      if (side===0) put(a, out, 0); else if (side===1) put(a,-out,0);
      else if (side===2) put(out, a, 0); else put(-out, a, 0);
    }
  })();

  // ---------- SHAPE B : the brain ----------
  const brainPos = new Float32Array(N * 3);
  (function buildBrain() {
    for (let k = 0; k < N; k++) {
      // two-lobed ellipsoid w/ surface bias + cortical wrinkle noise
      const u = Math.random()*Math.PI*2, v = Math.acos(2*Math.random()-1);
      const r = 0.86 + Math.pow(Math.random(), 3) * 0.14; // surface-biased
      let x = r * Math.sin(v) * Math.cos(u) * 2.0;
      let y = r * Math.cos(v) * 1.45;
      let z = r * Math.sin(v) * Math.sin(u) * 1.6;
      // hemisphere split
      x += (x > 0 ? 0.16 : -0.16);
      // wrinkles
      const w = Math.sin(x*5.2)*Math.cos(y*4.6)*Math.sin(z*5.8) * 0.1;
      x += w; y += w*0.8; z += w;
      // flatten base slightly
      if (y < -0.9) y = -0.9 - (y+0.9)*0.3;
      brainPos[k*3]=x; brainPos[k*3+1]=y+0.1; brainPos[k*3+2]=z;
    }
  })();

  // ---------- particles ----------
  const pos = new Float32Array(chipPos);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({
    color: HOLO, size: 0.028, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const points = new THREE.Points(geo, pMat);
  scene.add(points);

  // ---------- connecting lines (sampled neighbour pairs, recomputed per phase) ----------
  const linePos = new Float32Array(L * 6);
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lMat = new THREE.LineBasicMaterial({
    color: HOLO, transparent: true, opacity: 0.16,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const lines = new THREE.LineSegments(lGeo, lMat);
  scene.add(lines);

  const pairs = new Int32Array(L * 2);
  function samplePairs(src, maxD) {
    for (let k = 0; k < L; k++) {
      let a = (Math.random()*N)|0, best = -1, bd = maxD*maxD;
      for (let t = 0; t < 14; t++) {
        const b = (Math.random()*N)|0;
        const dx = src[a*3]-src[b*3], dy = src[a*3+1]-src[b*3+1], dz = src[a*3+2]-src[b*3+2];
        const d = dx*dx+dy*dy+dz*dz;
        if (d > 0.0004 && d < bd) { bd = d; best = b; }
      }
      pairs[k*2] = a; pairs[k*2+1] = best < 0 ? a : best;
    }
  }
  samplePairs(chipPos, 0.55);

  // ---------- data pulses : bright dots travelling along lines ----------
  const P = 130;
  const pulseGeo = new THREE.BufferGeometry();
  const pulsePos = new Float32Array(P * 3);
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
  const pulseMat = new THREE.PointsMaterial({
    color: BRASS, size: 0.06, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  scene.add(new THREE.Points(pulseGeo, pulseMat));
  const pulseLane = new Int32Array(P), pulseT = new Float32Array(P), pulseV = new Float32Array(P);
  for (let k = 0; k < P; k++) { pulseLane[k]=(Math.random()*L)|0; pulseT[k]=Math.random(); pulseV[k]=0.3+Math.random()*0.9; }

  // ---------- morph cycle ----------
  // phase: 0..1 chip hold, 1..2 morph→brain, 2..3 brain hold, 3..4 morph→chip
  const CYCLE = 22; // seconds
  const ease = t => t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
  let lastShape = 0; // 0 chip, 1 brain

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
  }

  const t0 = performance.now();
  function frame(now) {
    resize();
    const t = (now - t0) / 1000;
    const c = (t % CYCLE) / CYCLE * 4;     // 0..4
    let m;                                  // morph factor 0=chip 1=brain
    if (c < 1) m = 0;
    else if (c < 2) m = ease(c - 1);
    else if (c < 3) m = 1;
    else m = 1 - ease(c - 3);

    const shape = m > 0.5 ? 1 : 0;
    if (shape !== lastShape) {
      samplePairs(shape ? brainPos : chipPos, shape ? 0.5 : 0.55);
      lastShape = shape;
    }

    // interpolate positions + idle breathing
    const breathe = 1 + Math.sin(t * 0.8) * 0.012;
    for (let k = 0; k < N; k++) {
      const i3 = k*3;
      pos[i3]   = (chipPos[i3]  *(1-m) + brainPos[i3]  *m) * breathe;
      pos[i3+1] = (chipPos[i3+1]*(1-m) + brainPos[i3+1]*m) * breathe;
      pos[i3+2] = (chipPos[i3+2]*(1-m) + brainPos[i3+2]*m) * breathe;
    }
    geo.attributes.position.needsUpdate = true;

    // lines follow particles
    for (let k = 0; k < L; k++) {
      const a = pairs[k*2]*3, b = pairs[k*2+1]*3, o = k*6;
      linePos[o]=pos[a]; linePos[o+1]=pos[a+1]; linePos[o+2]=pos[a+2];
      linePos[o+3]=pos[b]; linePos[o+4]=pos[b+1]; linePos[o+5]=pos[b+2];
    }
    lGeo.attributes.position.needsUpdate = true;

    // pulses travel a→b
    for (let k = 0; k < P; k++) {
      pulseT[k] += pulseV[k] * 0.016;
      if (pulseT[k] > 1) { pulseT[k] = 0; pulseLane[k] = (Math.random()*L)|0; }
      const ln = pulseLane[k], a = pairs[ln*2]*3, b = pairs[ln*2+1]*3, f = pulseT[k];
      pulsePos[k*3]  = pos[a]  *(1-f) + pos[b]  *f;
      pulsePos[k*3+1]= pos[a+1]*(1-f) + pos[b+1]*f;
      pulsePos[k*3+2]= pos[a+2]*(1-f) + pos[b+2]*f;
    }
    pulseGeo.attributes.position.needsUpdate = true;

    // slow drift rotation, slightly tilted like a held hologram
    const g = points.rotation;
    g.y = t * 0.16; g.x = 0.32 + Math.sin(t*0.3)*0.04;
    lines.rotation.copy(g);
    scene.children[2].rotation.copy(g);

    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(frame);
  }

  if (reduced) {
    // static brain frame for reduced motion
    for (let k = 0; k < N*3; k++) pos[k] = brainPos[k];
    geo.attributes.position.needsUpdate = true;
    samplePairs(brainPos, 0.5);
    points.rotation.set(0.32, 0.6, 0); lines.rotation.copy(points.rotation);
    resize(); renderer.render(scene, camera);
  } else {
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);

  // scroll reveals
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
})();
