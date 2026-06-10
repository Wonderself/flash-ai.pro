/* Flash-AI.pro — signature hologram v2
   Glowing holographic chip with flowing data pulses, scan plane, flicker,
   projection cone — morphing into a neural brain. */
(function () {
  const canvas = document.getElementById('holo');
  if (!canvas || !window.THREE) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0.7, 7.4);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const N = 3200;   // particles
  const L = 1300;   // line segments
  const P = 220;    // data pulses

  // ---- soft glow sprite (canvas texture) ----
  function glowTexture(inner, outer) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0, inner); g.addColorStop(0.35, outer); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0,0,64,64);
    const t = new THREE.CanvasTexture(c); return t;
  }
  const cyanTex  = glowTexture('rgba(220,255,255,1)', 'rgba(89,227,255,.55)');
  const brassTex = glowTexture('rgba(255,245,215,1)', 'rgba(232,196,120,.6)');

  // ---------- SHAPE A : the chip ----------
  const chipPos = new Float32Array(N * 3);
  (function buildChip() {
    let i = 0;
    const put = (x,y,z) => { chipPos[i*3]=x; chipPos[i*3+1]=y; chipPos[i*3+2]=z; i++; };
    const S = 2.1;
    const border = Math.floor(N * 0.20);
    for (let k = 0; k < border; k++) {
      const t = (k / border) * 4, side = Math.floor(t), f = t - side;
      let x, y;
      if (side === 0) { x = -S + 2*S*f; y =  S; }
      else if (side === 1) { x =  S; y =  S - 2*S*f; }
      else if (side === 2) { x =  S - 2*S*f; y = -S; }
      else { x = -S; y = -S + 2*S*f; }
      put(x, y, (Math.random()-0.5)*0.06);
    }
    // double inner frame
    const frame2 = Math.floor(N * 0.08);
    for (let k = 0; k < frame2; k++) {
      const t = (k / frame2) * 4, side = Math.floor(t), f = t - side, S2 = S*0.55;
      let x, y;
      if (side === 0) { x = -S2 + 2*S2*f; y =  S2; }
      else if (side === 1) { x =  S2; y =  S2 - 2*S2*f; }
      else if (side === 2) { x =  S2 - 2*S2*f; y = -S2; }
      else { x = -S2; y = -S2 + 2*S2*f; }
      put(x, y, 0.1);
    }
    const traces = Math.floor(N * 0.44);
    for (let k = 0; k < traces; k++) {
      const horiz = Math.random() > 0.5;
      const lane = (Math.floor(Math.random()*11) - 5) * (S/5.4);
      const t = (Math.random()*2 - 1) * S * 0.92;
      put(horiz ? t : lane, horiz ? lane : t, (Math.random()-0.5)*0.05);
    }
    const core = Math.floor(N * 0.12);
    for (let k = 0; k < core; k++)
      put((Math.random()-0.5)*0.95, (Math.random()-0.5)*0.95, 0.06+(Math.random())*0.18);
    while (i < N) {
      const side = Math.floor(Math.random()*4);
      const a = (Math.floor(Math.random()*16)/15 * 2 - 1) * S * 0.9;
      const out = S + 0.16 + Math.random()*0.34;
      if (side===0) put(a, out, 0); else if (side===1) put(a,-out,0);
      else if (side===2) put(out, a, 0); else put(-out, a, 0);
    }
  })();

  // ---------- SHAPE B : the brain ----------
  const brainPos = new Float32Array(N * 3);
  (function buildBrain() {
    for (let k = 0; k < N; k++) {
      const u = Math.random()*Math.PI*2, v = Math.acos(2*Math.random()-1);
      const r = 0.84 + Math.pow(Math.random(), 3) * 0.16;
      let x = r * Math.sin(v) * Math.cos(u) * 2.0;
      let y = r * Math.cos(v) * 1.45;
      let z = r * Math.sin(v) * Math.sin(u) * 1.6;
      x += (x > 0 ? 0.17 : -0.17);
      const w = Math.sin(x*5.2)*Math.cos(y*4.6)*Math.sin(z*5.8) * 0.12;
      x += w; y += w*0.8; z += w;
      if (y < -0.9) y = -0.9 - (y+0.9)*0.3;
      brainPos[k*3]=x; brainPos[k*3+1]=y+0.15; brainPos[k*3+2]=z;
    }
  })();

  // ---------- main particles (2 layers: sharp + halo) ----------
  const pos = new Float32Array(chipPos);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const pSharp = new THREE.Points(geo, new THREE.PointsMaterial({
    map: cyanTex, color: 0xB8F4FF, size: 0.085, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  const pHalo = new THREE.Points(geo, new THREE.PointsMaterial({
    map: cyanTex, color: 0x2FA8CC, size: 0.30, transparent: true, opacity: 0.20,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  const holoGroup = new THREE.Group();
  holoGroup.add(pHalo); holoGroup.add(pSharp);

  // ---------- connecting lines ----------
  const linePos = new Float32Array(L * 6);
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lines = new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({
    color: 0x59E3FF, transparent: true, opacity: 0.13,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  holoGroup.add(lines);

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

  // ---------- brass data pulses ----------
  const pulseGeo = new THREE.BufferGeometry();
  const pulsePos = new Float32Array(P * 3);
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
  const pulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({
    map: brassTex, color: 0xF2D9A0, size: 0.16, transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  holoGroup.add(pulses);
  const pulseLane = new Int32Array(P), pulseT = new Float32Array(P), pulseV = new Float32Array(P);
  for (let k = 0; k < P; k++) { pulseLane[k]=(Math.random()*L)|0; pulseT[k]=Math.random(); pulseV[k]=0.35+Math.random()*1.1; }

  // ---------- scan plane (hologram sweep) ----------
  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(6.2, 0.025),
    new THREE.MeshBasicMaterial({ color: 0x59E3FF, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  holoGroup.add(scan);

  // ---------- projection cone + emitter base ----------
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(2.9, 4.6, 48, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x2FA8CC, transparent: true, opacity: 0.045,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  cone.position.y = -2.0; cone.rotation.x = Math.PI;
  scene.add(cone);
  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.75, 64),
    new THREE.MeshBasicMaterial({ color: 0x59E3FF, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  baseRing.rotation.x = -Math.PI/2; baseRing.position.y = -4.25;
  scene.add(baseRing);
  const baseRing2 = baseRing.clone();
  baseRing2.scale.set(1.5,1.5,1); baseRing2.material = baseRing.material.clone();
  baseRing2.material.opacity = 0.18;
  scene.add(baseRing2);

  scene.add(holoGroup);

  // ---------- morph + animation ----------
  const CYCLE = 20;
  const ease = t => t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
  let lastShape = 0;

  // parallax (mouse / gyro)
  let px = 0, py = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', e => {
    tx = (e.clientX / window.innerWidth - 0.5) * 0.5;
    ty = (e.clientY / window.innerHeight - 0.5) * 0.3;
  }, { passive: true });
  window.addEventListener('deviceorientation', e => {
    if (e.gamma !== null) { tx = (e.gamma/45) * 0.35; ty = (e.beta/90 - 0.4) * 0.25; }
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      // shift hologram right on desktop, center on mobile
      holoGroup.position.x = w > 880 ? 1.6 : 0;
      cone.position.x = baseRing.position.x = baseRing2.position.x = holoGroup.position.x;
    }
  }

  const t0 = performance.now();
  function frame(now) {
    resize();
    const t = (now - t0) / 1000;
    const c = (t % CYCLE) / CYCLE * 4;
    let m;
    if (c < 1) m = 0;
    else if (c < 2) m = ease(c - 1);
    else if (c < 3) m = 1;
    else m = 1 - ease(c - 3);

    const shape = m > 0.5 ? 1 : 0;
    if (shape !== lastShape) {
      samplePairs(shape ? brainPos : chipPos, shape ? 0.5 : 0.55);
      lastShape = shape;
    }

    const breathe = 1 + Math.sin(t * 0.8) * 0.014;
    for (let k = 0; k < N; k++) {
      const i3 = k*3;
      pos[i3]   = (chipPos[i3]  *(1-m) + brainPos[i3]  *m) * breathe;
      pos[i3+1] = (chipPos[i3+1]*(1-m) + brainPos[i3+1]*m) * breathe;
      pos[i3+2] = (chipPos[i3+2]*(1-m) + brainPos[i3+2]*m) * breathe;
    }
    geo.attributes.position.needsUpdate = true;

    for (let k = 0; k < L; k++) {
      const a = pairs[k*2]*3, b = pairs[k*2+1]*3, o = k*6;
      linePos[o]=pos[a]; linePos[o+1]=pos[a+1]; linePos[o+2]=pos[a+2];
      linePos[o+3]=pos[b]; linePos[o+4]=pos[b+1]; linePos[o+5]=pos[b+2];
    }
    lGeo.attributes.position.needsUpdate = true;

    for (let k = 0; k < P; k++) {
      pulseT[k] += pulseV[k] * 0.016;
      if (pulseT[k] > 1) { pulseT[k] = 0; pulseLane[k] = (Math.random()*L)|0; }
      const ln = pulseLane[k], a = pairs[ln*2]*3, b = pairs[ln*2+1]*3, f = pulseT[k];
      pulsePos[k*3]  = pos[a]  *(1-f) + pos[b]  *f;
      pulsePos[k*3+1]= pos[a+1]*(1-f) + pos[b+1]*f;
      pulsePos[k*3+2]= pos[a+2]*(1-f) + pos[b+2]*f;
    }
    pulseGeo.attributes.position.needsUpdate = true;

    // hologram flicker — subtle, irregular
    const flick = 0.92 + Math.sin(t*23.7)*0.02 + Math.sin(t*7.3)*0.03 + (Math.random()<0.012 ? -0.25 : 0);
    pSharp.material.opacity = 0.95 * flick;
    pHalo.material.opacity  = 0.20 * flick;
    lines.material.opacity  = 0.13 * flick;

    // scan plane sweep
    const sy = ((t*0.55) % 2.4) - 1.2;
    scan.position.y = sy * 2.2;
    scan.material.opacity = 0.30 * (1 - Math.abs(sy/1.2)) * flick;

    // base rings pulse
    baseRing.material.opacity = 0.35 + Math.sin(t*2.2)*0.15;
    baseRing2.scale.setScalar(1.4 + Math.sin(t*2.2)*0.12);

    // parallax easing + drift rotation
    px += (tx - px) * 0.04; py += (ty - py) * 0.04;
    holoGroup.rotation.y = t * 0.17 + px;
    holoGroup.rotation.x = 0.30 + Math.sin(t*0.3)*0.04 + py;

    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(frame);
  }

  if (reduced) {
    for (let k = 0; k < N*3; k++) pos[k] = brainPos[k];
    geo.attributes.position.needsUpdate = true;
    samplePairs(brainPos, 0.5);
    holoGroup.rotation.set(0.3, 0.6, 0);
    resize(); renderer.render(scene, camera);
  } else {
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
})();
