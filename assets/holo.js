/* Flash-AI.pro — hologram v3 "Subjugate"
   A legible silicon chip → swirl-wave morph → anatomical neural brain → back. Loop.
   Per-particle gradient (violet→cyan), staggered morph wave, phase-aware rotation,
   synapse flashes in brain phase, bus pulses in chip phase. */
(function () {
  const canvas = document.getElementById('holo');
  if (!canvas || !window.THREE) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const label = document.querySelector('.holo-label');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.15, 7.0);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const N = 5200, L = 2100, P = 300;
  const VIOLET = new THREE.Color('#7C5CFF'), CYAN = new THREE.Color('#36D6FF'), MINT = new THREE.Color('#5CFFC9');

  function glowTexture(inner, mid) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0, inner); g.addColorStop(0.3, mid); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(c);
  }
  const dotTex = glowTexture('rgba(255,255,255,1)', 'rgba(160,200,255,.6)');

  /* ============ SHAPE A — A CHIP YOU CAN READ ============
     Square die, double frame, regular bus grid (8x8 lanes), glowing core block,
     and pin rows on all four edges. Mostly flat: reads as silicon. */
  const chipPos = new Float32Array(N*3);
  (function chip() {
    let i = 0; const put=(x,y,z)=>{ chipPos[i*3]=x; chipPos[i*3+1]=y; chipPos[i*3+2]=z; i++; };
    const S = 2.0;
    // outer frame — crisp continuous edge
    const fr = Math.floor(N*0.16);
    for (let k=0;k<fr;k++){ const t=(k/fr)*4, s=Math.floor(t), f=t-s; let x,y;
      if(s===0){x=-S+2*S*f;y=S;} else if(s===1){x=S;y=S-2*S*f;} else if(s===2){x=S-2*S*f;y=-S;} else {x=-S;y=-S+2*S*f;}
      put(x,y,0); }
    // inner frame
    const fr2 = Math.floor(N*0.10), S2=S*0.62;
    for (let k=0;k<fr2;k++){ const t=(k/fr2)*4, s=Math.floor(t), f=t-s; let x,y;
      if(s===0){x=-S2+2*S2*f;y=S2;} else if(s===1){x=S2;y=S2-2*S2*f;} else if(s===2){x=S2-2*S2*f;y=-S2;} else {x=-S2;y=-S2+2*S2*f;}
      put(x,y,0.04); }
    // regular bus grid: 7 horizontal + 7 vertical lanes between frames
    const lanes = 7, perLane = Math.floor((N*0.34)/(lanes*2));
    for (let ln=0; ln<lanes; ln++) {
      const c = (ln-(lanes-1)/2)*(S2*2/ (lanes)) ;
      for (let k=0;k<perLane;k++){
        const t=(k/perLane*2-1)*S*0.97;
        put(t, c, 0.01);            // horizontal lane
        put(c, t, 0.02);            // vertical lane
      }
    }
    // core block — dense glowing square in centre
    const core = Math.floor(N*0.14);
    for (let k=0;k<core;k++) put((Math.random()-0.5)*0.8, (Math.random()-0.5)*0.8, 0.05+Math.random()*0.1);
    // pins — short regular ticks on all edges
    const pinsPerSide = 12;
    while (i < N) {
      const side=(i%4); const idx=Math.floor(Math.random()*pinsPerSide);
      const a = (idx/(pinsPerSide-1)*2-1)*S*0.86;
      const ext = S + 0.12 + Math.random()*0.22;
      if(side===0) put(a,ext,0); else if(side===1) put(a,-ext,0);
      else if(side===2) put(ext,a,0); else put(-ext,a,0);
    }
  })();

  /* ============ SHAPE B — AN ANATOMICAL BRAIN (profile-readable) ============
     Built for the side view: flat-ish frontal lobe, high parietal crown,
     occipital curve, temporal lobe bulge, deep horizontal Sylvian groove,
     ridged cerebellum at lower-back, brainstem. Dense surface + gyri bands. */
  const brainPos = new Float32Array(N*3);
  (function brain() {
    let i = 0;
    const cer = Math.floor(N*0.13), stem = Math.floor(N*0.035), main = N - cer - stem;
    for (let k=0;k<main;k++){
      const u=Math.random()*Math.PI*2, v=Math.acos(2*Math.random()-1);
      const r=0.93+Math.pow(Math.random(),6)*0.07;        // strong surface bias
      // base ellipsoid — z = front/back axis (profile faces camera after rotY)
      let x=r*Math.sin(v)*Math.cos(u)*1.05;               // width (thin: profile)
      let y=r*Math.cos(v)*1.18;                           // height
      let z=r*Math.sin(v)*Math.sin(u)*1.62;               // length front-back
      // anatomical shaping (z>0 = front)
      if (z>0.95) { y -= (z-0.95)*0.55; z = 0.95 + (z-0.95)*0.7; }   // frontal lobe drop
      if (z<-0.9) { y += (Math.abs(z)-0.9)*0.18; }                    // occipital lift
      if (y>0.85) { z -= (y-0.85)*0.25; }                              // parietal crown back-slope
      // temporal lobe bulge (lower-middle side)
      if (y<-0.15 && y>-0.85 && z>-0.35 && z<0.75) { x*=1.22; z+=0.06; }
      // Sylvian fissure — deep horizontal groove on the side
      const syl = Math.exp(-Math.pow((y+0.12)/0.10,2)) * (z>-0.4&&z<0.7?1:0);
      x *= (1 - syl*0.30);
      // gyri — folds running mostly front-to-back (horizontal bands in profile)
      const g1 = Math.sin(y*7.5 + z*2.0)*Math.cos(z*5.5)*0.085;
      const g2 = Math.sin(y*14 + 2.1)*Math.sin(z*9.5)*0.038;
      const w = g1+g2;
      x += w*0.7; y += w; z += w*0.6;
      // flat-ish base
      if (y<-0.78 && z>-0.5) y = -0.78-(y+0.78)*0.2;
      brainPos[i*3]=x; brainPos[i*3+1]=y+0.22; brainPos[i*3+2]=z; i++;
    }
    // cerebellum — ridged ball, lower-back, clearly separated
    for (let k=0;k<cer;k++){
      const u=Math.random()*Math.PI*2, v=Math.acos(2*Math.random()-1);
      const r=0.93+Math.pow(Math.random(),4)*0.07;
      let x=r*Math.sin(v)*Math.cos(u)*0.55;
      let y=r*Math.cos(v)*0.42;
      let z=r*Math.sin(v)*Math.sin(u)*0.58;
      y += Math.sin(z*22)*0.045;                       // fine horizontal striations
      brainPos[i*3]=x; brainPos[i*3+1]=y-0.66; brainPos[i*3+2]=z-1.18; i++;
    }
    // brainstem — angled column under cerebellum toward front
    for (let k=0;k<stem;k++){
      const a=Math.random()*Math.PI*2, rr=0.14*Math.sqrt(Math.random()), h=Math.random();
      brainPos[i*3]=Math.cos(a)*rr;
      brainPos[i*3+1]=-0.78-h*0.55;
      brainPos[i*3+2]=-0.55+Math.sin(a)*rr+h*0.22; i++;
    }
  })();

  /* per-particle morph stagger (wave sweeps left→right) + swirl seed */
  const delay = new Float32Array(N), swirl = new Float32Array(N);
  for (let k=0;k<N;k++){ delay[k] = (chipPos[k*3]+2.4)/4.8 * 0.55; swirl[k] = Math.random()*Math.PI*2; }

  /* per-particle colors — violet→cyan by height, mint sparkles */
  const colors = new Float32Array(N*3);
  const tmp = new THREE.Color();
  for (let k=0;k<N;k++){
    const t = Math.min(1, Math.max(0, (chipPos[k*3+1]+2.3)/4.6));
    tmp.copy(VIOLET).lerp(CYAN, t);
    if (Math.random()<0.06) tmp.copy(MINT);
    colors[k*3]=tmp.r; colors[k*3+1]=tmp.g; colors[k*3+2]=tmp.b;
  }

  const pos = new Float32Array(chipPos);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));

  const holoGroup = new THREE.Group();
  const pSharp = new THREE.Points(geo, new THREE.PointsMaterial({
    map:dotTex, vertexColors:true, size:0.075, transparent:true, opacity:.95,
    blending:THREE.AdditiveBlending, depthWrite:false }));
  const pHalo = new THREE.Points(geo, new THREE.PointsMaterial({
    map:dotTex, vertexColors:true, size:0.26, transparent:true, opacity:.14,
    blending:THREE.AdditiveBlending, depthWrite:false }));
  holoGroup.add(pHalo, pSharp);

  /* connection lines */
  const linePos = new Float32Array(L*6);
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(linePos,3));
  const lines = new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({
    color:0x6FA8FF, transparent:true, opacity:.12, blending:THREE.AdditiveBlending, depthWrite:false }));
  holoGroup.add(lines);

  const pairs = new Int32Array(L*2);
  function samplePairs(src, maxD){
    for (let k=0;k<L;k++){
      let a=(Math.random()*N)|0, best=-1, bd=maxD*maxD;
      for (let t=0;t<16;t++){
        const b=(Math.random()*N)|0;
        const dx=src[a*3]-src[b*3], dy=src[a*3+1]-src[b*3+1], dz=src[a*3+2]-src[b*3+2];
        const d=dx*dx+dy*dy+dz*dz;
        if (d>0.0004 && d<bd){ bd=d; best=b; }
      }
      pairs[k*2]=a; pairs[k*2+1]=best<0?a:best;
    }
  }
  samplePairs(chipPos, 0.5);

  /* data pulses */
  const pulseGeo = new THREE.BufferGeometry();
  const pulsePos = new Float32Array(P*3);
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos,3));
  const pulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({
    map:dotTex, color:0xCFF6FF, size:0.13, transparent:true, opacity:1,
    blending:THREE.AdditiveBlending, depthWrite:false }));
  holoGroup.add(pulses);
  const pl=new Int32Array(P), pt=new Float32Array(P), pv=new Float32Array(P);
  for (let k=0;k<P;k++){ pl[k]=(Math.random()*L)|0; pt[k]=Math.random(); pv[k]=0.4+Math.random()*1.2; }

  /* synapse flashes (brain phase) — brief bright bursts */
  const F = 26;
  const flashGeo = new THREE.BufferGeometry();
  const flashPos = new Float32Array(F*3);
  flashGeo.setAttribute('position', new THREE.BufferAttribute(flashPos,3));
  const flashMat = new THREE.PointsMaterial({ map:dotTex, color:0xFFFFFF, size:0.34,
    transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
  holoGroup.add(new THREE.Points(flashGeo, flashMat));
  const flashT = new Float32Array(F);
  for (let k=0;k<F;k++){ flashT[k]=Math.random()*2; resetFlash(k); }
  function resetFlash(k){ const p=(Math.random()*N)|0;
    flashPos[k*3]=brainPos[p*3]; flashPos[k*3+1]=brainPos[p*3+1]; flashPos[k*3+2]=brainPos[p*3+2]; }

  scene.add(holoGroup);

  /* ============ TIMELINE ============
     0–5s   chip (faces camera, slow tilt)     label: SILICON
     5–9s   morph wave → brain (swirl transit) label: TRANSFORMING
     9–14s  brain (3/4 rotation, synapses)     label: INTELLIGENCE
     14–18s morph back                          loop */
  const CH=4, MO=3, BR=5, MB=2.5, CYCLE=CH+MO+BR+MB;
  const ease = t => t<0 ? 0 : t>1 ? 1 : (t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2);
  let lastShape = 0;
  const labels = (label && label.dataset) ? {
    chip: label.dataset.chip || 'SILICON', morph: label.dataset.morph || 'TRANSFORMING',
    brain: label.dataset.brain || 'INTELLIGENCE' } : null;
  let lastLabel = '';

  let px=0, py=0, tx=0, ty=0;
  window.addEventListener('pointermove', e=>{
    tx=(e.clientX/window.innerWidth-0.5)*0.45; ty=(e.clientY/window.innerHeight-0.5)*0.3; },{passive:true});
  window.addEventListener('deviceorientation', e=>{
    if(e.gamma!==null){ tx=(e.gamma/45)*0.3; ty=(e.beta/90-0.4)*0.2; } },{passive:true});

  function resize(){
    const w=canvas.clientWidth, h=canvas.clientHeight;
    if (canvas.width!==w || canvas.height!==h){
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
      const sc = Math.min(w,h)/520; holoGroup.scale.setScalar(Math.max(0.72, Math.min(1.15, sc)));
    }
  }

  function setLabel(txt){ if(label && txt!==lastLabel){ label.style.opacity=0;
    setTimeout(()=>{ label.textContent=txt; label.style.opacity=1; },300); lastLabel=txt; } }

  const t0=performance.now();
  function frame(now){
    resize();
    const t=(now-t0)/1000, c=t%CYCLE;
    let gm, phase; // gm = global morph 0 chip → 1 brain
    if (c<CH){ gm=0; phase='chip'; }
    else if (c<CH+MO){ gm=(c-CH)/MO; phase='morph'; }
    else if (c<CH+MO+BR){ gm=1; phase='brain'; }
    else { gm=1-(c-CH-MO-BR)/MB; phase='morph'; }

    if (labels) setLabel(phase==='chip'?labels.chip : phase==='brain'?labels.brain : labels.morph);

    const shape = gm>0.5?1:0;
    if (shape!==lastShape){ samplePairs(shape?brainPos:chipPos, shape?0.46:0.5); lastShape=shape; }

    const breathe = 1+Math.sin(t*0.9)*0.012;
    for (let k=0;k<N;k++){
      const i3=k*3;
      // staggered per-particle morph: wave + ease
      let m = ease((gm - delay[k]*(gm<0.5?1:-1)*0 + 0)*1 ); // base
      m = ease( (gm*1.4) - delay[k]*0.7 );
      if (c>=CH+MO+BR) m = ease( (gm*1.4) - (0.55-delay[k])*0.7 ); // reverse wave on way back
      // swirl during transit — particles arc outward mid-morph
      const arc = Math.sin(Math.PI*Math.min(1,Math.max(0,m))) * (phase==='morph'?1:0);
      const sa = swirl[k] + t*0.6;
      const ox = Math.cos(sa)*arc*0.5, oy = Math.sin(sa*1.3)*arc*0.35, oz = Math.sin(sa)*arc*0.5;
      pos[i3]  =(chipPos[i3]  *(1-m)+brainPos[i3]  *m + ox)*breathe;
      pos[i3+1]=(chipPos[i3+1]*(1-m)+brainPos[i3+1]*m + oy)*breathe;
      pos[i3+2]=(chipPos[i3+2]*(1-m)+brainPos[i3+2]*m + oz)*breathe;
    }
    geo.attributes.position.needsUpdate=true;

    for (let k=0;k<L;k++){
      const a=pairs[k*2]*3, b=pairs[k*2+1]*3, o=k*6;
      linePos[o]=pos[a]; linePos[o+1]=pos[a+1]; linePos[o+2]=pos[a+2];
      linePos[o+3]=pos[b]; linePos[o+4]=pos[b+1]; linePos[o+5]=pos[b+2];
    }
    lGeo.attributes.position.needsUpdate=true;

    for (let k=0;k<P;k++){
      pt[k]+=pv[k]*0.016;
      if (pt[k]>1){ pt[k]=0; pl[k]=(Math.random()*L)|0; }
      const ln=pl[k], a=pairs[ln*2]*3, b=pairs[ln*2+1]*3, f=pt[k];
      pulsePos[k*3]  =pos[a]  *(1-f)+pos[b]  *f;
      pulsePos[k*3+1]=pos[a+1]*(1-f)+pos[b+1]*f;
      pulsePos[k*3+2]=pos[a+2]*(1-f)+pos[b+2]*f;
    }
    pulseGeo.attributes.position.needsUpdate=true;

    // synapse flashes only in brain phase
    let fo=0;
    if (phase==='brain'){
      for (let k=0;k<F;k++){
        flashT[k]-=0.016;
        if (flashT[k]<=0){ flashT[k]=0.5+Math.random()*2.5; resetFlash(k); }
      }
      flashGeo.attributes.position.needsUpdate=true;
      fo=0.7;
    }
    flashMat.opacity += (fo-flashMat.opacity)*0.08;
    flashMat.size = 0.2+Math.abs(Math.sin(t*6))*0.18;

    /* phase-aware rotation:
       chip — flat, facing camera with gentle tilt so the grid reads;
       brain — 3/4 view, slow continuous turn */
    px+=(tx-px)*0.05; py+=(ty-py)*0.05;
    const chipRotX=0.45, chipRotY=Math.sin(t*0.4)*0.18;
    // brain: hold a clear profile view (most recognizable), gentle sway only
    const brainRotX=0.06, brainRotY=1.35 + Math.sin(t*0.35)*0.28;
    const rl = ease(gm);
    holoGroup.rotation.x = chipRotX*(1-rl)+brainRotX*rl + py;
    holoGroup.rotation.y = chipRotY*(1-rl)+brainRotY*rl + px;

    // soft flicker — restrained
    const flick = 0.96 + Math.sin(t*19)*0.015 + (Math.random()<0.006?-0.12:0);
    pSharp.material.opacity=0.95*flick; pHalo.material.opacity=0.14*flick; lines.material.opacity=0.12*flick;

    renderer.render(scene,camera);
    if (!reduced) requestAnimationFrame(frame);
  }

  if (reduced){
    for (let k=0;k<N*3;k++) pos[k]=brainPos[k];
    geo.attributes.position.needsUpdate=true; samplePairs(brainPos,0.46);
    holoGroup.rotation.set(0.12,0.7,0); resize(); renderer.render(scene,camera);
    if (label) label.textContent = label.dataset ? (label.dataset.brain||'INTELLIGENCE') : '';
  } else requestAnimationFrame(frame);

  window.addEventListener('resize', resize);
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }}),{threshold:.1});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el));
})();
