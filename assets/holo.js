/* Flash-AI.pro — hologram v8 "Triptych"
   Three acts now: SILICON (chip) → INTELLIGENCE (brain) → GLOBAL NETWORK
   (wireframe globe with city hubs + elevated great-circle arcs TLV·PAR·NYC·
   BUE·DXB·MAD, orbital ring). One shared particle pool + segment pool morphs
   through all three. Soft bloom layer for a liquid-glass glow. */
(function () {
  const canvas = document.getElementById('holo');
  if (!canvas || !window.THREE) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const label = document.querySelector('.holo-label');

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060A1C, 0.075); // depth falloff — far side melts into the dark
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.1, 7.0);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const N = 4200, L = 980, P = 300, SP = 460;

  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.3,'rgba(170,210,255,.6)'); g.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(c);
  }
  const dotTex = glowTexture();

  /* ================= BRAIN PROFILE GEOMETRY =================
     Hand-crafted side-view silhouette (z = front→back, y = up). */
  const CTRL = [
    [ 1.42,-0.10],[ 1.52, 0.30],[ 1.38, 0.72],[ 1.02, 1.04],[ 0.45, 1.22],
    [-0.20, 1.22],[-0.82, 1.04],[-1.28, 0.66],[-1.50, 0.18],[-1.46,-0.22],
    [-1.18,-0.40],                      /* occipital notch above cerebellum */
    [-1.30,-0.58],[-1.22,-0.92],[-0.86,-1.10],[-0.46,-1.04],[-0.30,-0.84], /* cerebellum */
    [-0.18,-1.00],[-0.06,-1.30],[ 0.12,-1.28],[ 0.16,-0.96],               /* brainstem */
    [ 0.34,-0.78],[ 0.78,-0.84],[ 1.14,-0.62],[ 1.36,-0.34]                /* temporal underside */
  ];
  const OUT = [];
  for (let i=0;i<CTRL.length;i++){
    const a=CTRL[i], b=CTRL[(i+1)%CTRL.length];
    for (let s=0;s<9;s++){ const f=s/9; OUT.push([a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f]); }
  }
  const NO = OUT.length;
  function inside(z,y){
    let c=false;
    for (let i=0,j=NO-1;i<NO;j=i++){
      const zi=OUT[i][0], yi=OUT[i][1], zj=OUT[j][0], yj=OUT[j][1];
      if (((yi>y)!==(yj>y)) && (z < (zj-zi)*(y-yi)/(yj-yi)+zi)) c=!c;
    }
    return c;
  }
  function distOut(z,y){
    let d=1e9;
    for (let i=0;i<NO;i+=2){ const dz=z-OUT[i][0], dy=y-OUT[i][1]; const q=dz*dz+dy*dy; if(q<d)d=q; }
    return Math.sqrt(d);
  }
  const W = (z,y)=> Math.min(0.72, 0.78*Math.tanh(distOut(z,y)*2.4));

  function brainSample(surfBias){
    let z,y,tries=0;
    do { z=-1.6+Math.random()*3.2; y=-1.4+Math.random()*2.7; tries++; } while(!inside(z,y)&&tries<60);
    if (tries>=60){ z=0; y=0.2; }
    const w=W(z,y);
    let x;
    const r=Math.random();
    if (r<surfBias) x=(Math.random()<0.5?-1:1)*w*(0.90+Math.random()*0.10);
    else if (r<surfBias+0.14){ const o=OUT[(Math.random()*NO)|0]; z=o[0]; y=o[1]; x=(Math.random()*2-1)*0.10; }
    else x=(Math.random()*2-1)*w*0.85;
    return [x,y+0.10,z];
  }

  /* ================= CHIP GEOMETRY ================= */
  const S=2.0, S2=1.22;
  function chipParticle(){
    const r=Math.random();
    if (r<0.18){
      const t=Math.random()*4, s=Math.floor(t), f=t-s;
      const e=[[ -S+2*S*f, S],[S, S-2*S*f],[ S-2*S*f,-S],[-S,-S+2*S*f]][s];
      return [e[0],e[1],0];
    }
    if (r<0.30){ const t=Math.random()*4, s=Math.floor(t), f=t-s;
      const e=[[ -S2+2*S2*f, S2],[S2, S2-2*S2*f],[ S2-2*S2*f,-S2],[-S2,-S2+2*S2*f]][s];
      return [e[0],e[1],0.03]; }
    if (r<0.66){
      const horiz=Math.random()>0.5, lane=(Math.floor(Math.random()*7)-3)*(S2/3.5);
      const t=(Math.random()*2-1)*S*0.97;
      return horiz?[t,lane,0.01]:[lane,t,0.02];
    }
    if (r<0.82) return [(Math.random()-0.5)*0.8,(Math.random()-0.5)*0.8,0.05+Math.random()*0.1];
    const side=Math.floor(Math.random()*4), idx=Math.floor(Math.random()*12);
    const a=(idx/11*2-1)*S*0.86, ext=S+0.12+Math.random()*0.22;
    return side===0?[a,ext,0]:side===1?[a,-ext,0]:side===2?[ext,a,0]:[-ext,a,0];
  }

  /* ================= GLOBE GEOMETRY ================= */
  const GR=1.78;
  function ll(latDeg,lonDeg,R){
    const la=latDeg*Math.PI/180, lo=lonDeg*Math.PI/180; R=R||GR;
    return [R*Math.cos(la)*Math.cos(lo), R*Math.sin(la), R*Math.cos(la)*Math.sin(lo)];
  }
  /* hub cities — Tel Aviv & Paris first, then the corridors */
  const CITIES=[[32.1,34.8],[48.85,2.35],[40.7,-74.0],[-34.6,-58.4],[25.2,55.3],[40.4,-3.7]];
  const LATS=[-60,-40,-20,0,20,40,60];
  function globeParticle(){
    const r=Math.random();
    if (r<0.13){ // glowing city clusters
      const c=CITIES[(Math.random()*CITIES.length)|0];
      return ll(c[0]+(Math.random()*6-3), c[1]+(Math.random()*6-3), GR*(1+Math.random()*0.05));
    }
    if (r<0.50){ const lat=LATS[(Math.random()*LATS.length)|0];
      return ll(lat+(Math.random()*2-1), Math.random()*360); }
    if (r<0.78){ const lon=((Math.random()*12)|0)*30;
      return ll((Math.random()*2-1)*88, lon+(Math.random()*2-1)); }
    return ll(Math.asin(Math.random()*2-1)*180/Math.PI, Math.random()*360);
  }

  /* ===== particle clouds (3 shapes) ===== */
  const chipPos=new Float32Array(N*3), brainPos=new Float32Array(N*3), globePos=new Float32Array(N*3);
  for (let k=0;k<N;k++){
    const c=chipParticle(); chipPos[k*3]=c[0]; chipPos[k*3+1]=c[1]; chipPos[k*3+2]=c[2];
    const b=brainSample(0.74); brainPos[k*3]=b[0]; brainPos[k*3+1]=b[1]; brainPos[k*3+2]=b[2];
    const g=globeParticle(); globePos[k*3]=g[0]; globePos[k*3+1]=g[1]; globePos[k*3+2]=g[2];
  }
  const delay=new Float32Array(N), swirl=new Float32Array(N);
  for (let k=0;k<N;k++){ delay[k]=(chipPos[k*3]+2.4)/4.8*0.5; swirl[k]=Math.random()*Math.PI*2; }

  const VIO=new THREE.Color('#7C5CFF'), CYA=new THREE.Color('#36D6FF'), MIN=new THREE.Color('#5CFFC9');
  const colors=new Float32Array(N*3), tmp=new THREE.Color();
  for (let k=0;k<N;k++){
    tmp.copy(VIO).lerp(CYA, Math.min(1,Math.max(0,(chipPos[k*3+1]+2.3)/4.6)));
    if (Math.random()<0.06) tmp.copy(MIN);
    colors[k*3]=tmp.r; colors[k*3+1]=tmp.g; colors[k*3+2]=tmp.b;
  }

  const pos=new Float32Array(chipPos);
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  const holoGroup=new THREE.Group();
  const pSharp=new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,vertexColors:true,size:0.07,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
  const pHalo=new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,vertexColors:true,size:0.24,transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false}));
  const pBloom=new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,vertexColors:true,size:0.62,transparent:true,opacity:.05,blending:THREE.AdditiveBlending,depthWrite:false}));
  holoGroup.add(pBloom,pHalo,pSharp);

  /* ===== EXPLICIT LINE SEGMENTS — what makes each shape readable ===== */
  const chipSegs=new Float32Array(L*6), brainSegs=new Float32Array(L*6), globeSegs=new Float32Array(L*6);
  let ci=0, bi=0, gi=0;
  const cSeg=(x1,y1,z1,x2,y2,z2)=>{ if(ci<L){ const o=ci*6;
    chipSegs[o]=x1;chipSegs[o+1]=y1;chipSegs[o+2]=z1;chipSegs[o+3]=x2;chipSegs[o+4]=y2;chipSegs[o+5]=z2; ci++; } };
  const bSeg=(x1,y1,z1,x2,y2,z2)=>{ if(bi<L){ const o=bi*6;
    brainSegs[o]=x1;brainSegs[o+1]=y1;brainSegs[o+2]=z1;brainSegs[o+3]=x2;brainSegs[o+4]=y2;brainSegs[o+5]=z2; bi++; } };
  const gSeg=(x1,y1,z1,x2,y2,z2)=>{ if(gi<L){ const o=gi*6;
    globeSegs[o]=x1;globeSegs[o+1]=y1;globeSegs[o+2]=z1;globeSegs[o+3]=x2;globeSegs[o+4]=y2;globeSegs[o+5]=z2; gi++; } };

  // chip lines: frames, lanes, pins, core
  function frame(SS,zz,n){ const cs=[[-SS,SS,SS,SS],[SS,SS,SS,-SS],[SS,-SS,-SS,-SS],[-SS,-SS,-SS,SS]];
    for (const c of cs) for (let s=0;s<n;s++){ const f0=s/n, f1=(s+1)/n;
      cSeg(c[0]+(c[2]-c[0])*f0, c[1]+(c[3]-c[1])*f0, zz, c[0]+(c[2]-c[0])*f1, c[1]+(c[3]-c[1])*f1, zz); } }
  frame(S,0,24); frame(S2,0.03,14); frame(0.42,0.08,6);
  for (let ln=0;ln<7;ln++){ const c=(ln-3)*(S2/3.5);
    for (let s=0;s<18;s++){ const f0=-S*0.97+ (s/18)*1.94*S, f1=-S*0.97+((s+1)/18)*1.94*S;
      cSeg(f0,c,0.01,f1,c,0.01); cSeg(c,f0,0.02,c,f1,0.02); } }
  for (let side=0;side<4;side++) for (let i2=0;i2<12;i2++){
    const a=(i2/11*2-1)*S*0.86;
    if(side===0)cSeg(a,S,0,a,S+0.3,0); else if(side===1)cSeg(a,-S,0,a,-S-0.3,0);
    else if(side===2)cSeg(S,a,0,S+0.3,a,0); else cSeg(-S,a,0,-S-0.3,a,0); }
  while(ci<L){ const x=(Math.random()*2-1)*S2,y=(Math.random()*2-1)*S2;
    cSeg(x,y,0.01,x+(Math.random()-0.5)*0.3,y+(Math.random()-0.5)*0.3,0.01); }

  // brain lines: silhouette rings, gyri strips, cerebellum striations, midline
  function ring(scale,xoff,step){
    for (let i=0;i<NO;i+=step){ const a=OUT[i], b=OUT[(i+step)%NO];
      bSeg(xoff, a[1]*scale+0.10, a[0]*scale, xoff, b[1]*scale+0.10, b[0]*scale); } }
  ring(1.0, 0, 2);
  ring(0.94, 0.34, 4); ring(0.94,-0.34, 4);
  for (let g=0; g<18; g++){
    const side=(g%2===0)?1:-1;
    let z=-0.9+Math.random()*1.9, y=-0.4+Math.random()*1.3;
    if(!inside(z,y)) continue;
    let ang=(Math.random()-0.5)*0.5;
    for (let s2=0;s2<15;s2++){
      const nz=z+Math.cos(ang)*0.15, ny=y+Math.sin(ang)*0.15;
      if(!inside(nz,ny)||distOut(nz,ny)<0.08) break;
      const w1=W(z,y)*0.98, w2=W(nz,ny)*0.98;
      bSeg(side*w1, y+0.10, z, side*w2, ny+0.10, nz);
      z=nz; y=ny; ang+=Math.sin(s2*1.7+g)*0.45;
    }
  }
  for (let r2=0;r2<7;r2++){ const yy=-0.62-r2*0.075;
    for (let s3=0;s3<5;s3++){ const z0=-1.22+s3*0.17, z1=z0+0.17;
      if(inside(z0,yy)&&inside(z1,yy)){ const ww=Math.min(0.30,W(z0,yy));
        bSeg(ww,yy+0.10,z0,ww,yy+0.10,z1); bSeg(-ww,yy+0.10,z0,-ww,yy+0.10,z1); } } }
  for (let i=0;i<NO;i++){ const a=OUT[i]; if(a[1]>0.55){ const b=OUT[(i+2)%NO];
    if (b[1]>0.55) bSeg(0,a[1]+0.13,a[0]*0.97,0,b[1]+0.13,b[0]*0.97); } }
  while(bi<L){ const p1=brainSample(0.9); bSeg(p1[0],p1[1],p1[2],p1[0]+0.05,p1[1],p1[2]); }

  // globe lines: latitude rings, meridians, then the elevated city arcs
  for (const lat of LATS){
    const n=lat===0?56:40;
    for (let s=0;s<n;s++){
      const a=ll(lat,s/n*360), b=ll(lat,(s+1)/n*360);
      gSeg(a[0],a[1],a[2],b[0],b[1],b[2]);
    }
  }
  for (let m=0;m<12;m++){
    const lon=m*30, n=36;
    for (let s=0;s<n;s++){
      const a=ll(-88+s/n*176,lon), b=ll(-88+(s+1)/n*176,lon);
      gSeg(a[0],a[1],a[2],b[0],b[1],b[2]);
    }
  }
  function arcRoute(A,B){
    const a=ll(A[0],A[1]), b=ll(B[0],B[1]), n=22;
    let prev=null;
    for (let s=0;s<=n;s++){
      const t=s/n;
      let x=a[0]+(b[0]-a[0])*t, y=a[1]+(b[1]-a[1])*t, z=a[2]+(b[2]-a[2])*t;
      const d=Math.hypot(x,y,z)||1, R=GR*(1+0.24*Math.sin(Math.PI*t));
      x=x/d*R; y=y/d*R; z=z/d*R;
      if (prev) gSeg(prev[0],prev[1],prev[2],x,y,z);
      prev=[x,y,z];
    }
  }
  const TLV=CITIES[0], PAR=CITIES[1], NYC=CITIES[2], BUE=CITIES[3], DXB=CITIES[4], MAD=CITIES[5];
  [[TLV,PAR],[TLV,NYC],[PAR,NYC],[TLV,BUE],[TLV,DXB],[PAR,MAD],[BUE,MAD]].forEach(r=>arcRoute(r[0],r[1]));
  while(gi<L){ // surface shimmer
    const lat=Math.asin(Math.random()*2-1)*180/Math.PI, lon=Math.random()*360;
    const a=ll(lat,lon), b=ll(lat+(Math.random()*8-4),lon+(Math.random()*8-4));
    gSeg(a[0],a[1],a[2],b[0],b[1],b[2]);
  }

  const shapePos=[chipPos,brainPos,globePos];
  const shapeSegs=[chipSegs,brainSegs,globeSegs];

  const linePos=new Float32Array(L*6);
  linePos.set(chipSegs);
  const lGeo=new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(linePos,3));
  const lines=new THREE.LineSegments(lGeo,new THREE.LineBasicMaterial({color:0x7FD8FF,transparent:true,opacity:.30,blending:THREE.AdditiveBlending,depthWrite:false}));
  holoGroup.add(lines);
  const segDelay=new Float32Array(L);
  for (let k=0;k<L;k++) segDelay[k]=(chipSegs[k*6]+chipSegs[k*6+3]+4.8)/9.6*0.5;

  /* ===== pulses along current segments ===== */
  const pulseGeo=new THREE.BufferGeometry();
  const pulsePos=new Float32Array(P*3);
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos,3));
  holoGroup.add(new THREE.Points(pulseGeo,new THREE.PointsMaterial({map:dotTex,color:0xE8FBFF,size:0.12,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false})));
  const pl=new Int32Array(P), pt=new Float32Array(P), pv=new Float32Array(P);
  for (let k=0;k<P;k++){ pl[k]=(Math.random()*L)|0; pt[k]=Math.random(); pv[k]=0.6+Math.random()*1.6; }

  /* ===== orbital ring — fades in for the globe act ===== */
  const RNG=130, ringPos=new Float32Array(RNG*3);
  for (let k=0;k<RNG;k++){
    const a=k/RNG*Math.PI*2;
    ringPos[k*3]=Math.cos(a)*2.55; ringPos[k*3+1]=Math.cos(a)*0.55; ringPos[k*3+2]=Math.sin(a)*2.55;
  }
  const ringGeo=new THREE.BufferGeometry();
  ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos,3));
  const ringMat=new THREE.PointsMaterial({map:dotTex,color:0x5CFFC9,size:0.05,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  holoGroup.add(new THREE.Points(ringGeo,ringMat));

  /* ===== rising sparkles — world-space, not rotating ===== */
  const sGeo=new THREE.BufferGeometry();
  const sPos=new Float32Array(SP*3), sCol=new Float32Array(SP*3);
  const sVel=new Float32Array(SP), sPh=new Float32Array(SP), sFr=new Float32Array(SP), sBase=[];
  for (let k=0;k<SP;k++){
    sPos[k*3]=(Math.random()*2-1)*3.0;
    sPos[k*3+1]=-3.4+Math.random()*6.4;
    sPos[k*3+2]=(Math.random()*2-1)*2.2;
    sVel[k]=0.22+Math.random()*0.5; sPh[k]=Math.random()*Math.PI*2; sFr[k]=1.5+Math.random()*4;
    const c=Math.random()<0.55?MIN:(Math.random()<0.5?CYA:new THREE.Color('#FFFFFF'));
    sBase.push(c);
    sCol[k*3]=c.r; sCol[k*3+1]=c.g; sCol[k*3+2]=c.b;
  }
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos,3));
  sGeo.setAttribute('color', new THREE.BufferAttribute(sCol,3));
  scene.add(new THREE.Points(sGeo,new THREE.PointsMaterial({map:dotTex,vertexColors:true,size:0.10,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false})));

  scene.add(holoGroup);

  /* ===== nebula veils — drifting colour clouds behind the shape ===== */
  function nebulaTex(col){
    const c=document.createElement('canvas'); c.width=c.height=128;
    const x=c.getContext('2d');
    const g=x.createRadialGradient(64,64,0,64,64,64);
    g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle=g; x.fillRect(0,0,128,128);
    return new THREE.CanvasTexture(c);
  }
  const nebs=[];
  [['rgba(106,72,255,.85)',-1.9, 1.3,-2.6, 7.5, .13],
   ['rgba(54,214,255,.8)',  2.2,-0.9,-3.0, 8.5, .10],
   ['rgba(12,201,155,.8)',  0.2,-2.3,-2.2, 6.0, .08]].forEach(n=>{
    const m=new THREE.SpriteMaterial({map:nebulaTex(n[0]),transparent:true,opacity:n[5],blending:THREE.AdditiveBlending,depthWrite:false});
    const s=new THREE.Sprite(m);
    s.position.set(n[1],n[2],n[3]); s.scale.setScalar(n[4]);
    s.userData={bx:n[1],by:n[2],ph:Math.random()*6,o:n[5]};
    scene.add(s); nebs.push(s);
  });

  /* ===== holographic floor grid — fades into the fog ===== */
  const gridPts=[];
  for (let x=-3;x<=3.01;x+=0.6) gridPts.push(x,-2.5,-2.2,x,-2.5,2.2);
  for (let z=-2.2;z<=2.21;z+=0.55) gridPts.push(-3,-2.5,z,3,-2.5,z);
  const gridGeo=new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gridPts),3));
  const gridMat=new THREE.LineBasicMaterial({color:0x5566D8,transparent:true,opacity:.13,blending:THREE.AdditiveBlending,depthWrite:false});
  scene.add(new THREE.LineSegments(gridGeo,gridMat));

  /* ===== occasional meteor streaking behind ===== */
  const MT=14, mtPos=new Float32Array(MT*3), mtCol=new Float32Array(MT*3);
  for (let k=0;k<MT;k++){ const fade=1-k/MT;
    mtCol[k*3]=fade; mtCol[k*3+1]=fade*0.97; mtCol[k*3+2]=Math.min(1,fade*1.2); }
  const mtGeo=new THREE.BufferGeometry();
  mtGeo.setAttribute('position', new THREE.BufferAttribute(mtPos,3));
  mtGeo.setAttribute('color', new THREE.BufferAttribute(mtCol,3));
  const mtMat=new THREE.PointsMaterial({map:dotTex,vertexColors:true,size:0.09,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  scene.add(new THREE.Points(mtGeo,mtMat));
  let mtLife=0, mtDur=2.2, mtNext=3+Math.random()*4;
  const mtP={x:0,y:0,z:-1.8}, mtV={x:0,y:0};

  /* ===== per-act colour grading ===== */
  const TINTS=[new THREE.Color(0.82,0.97,1.25),  // silicon: cool electric blue
               new THREE.Color(1.18,0.93,1.25),  // intelligence: warm violet
               new THREE.Color(0.85,1.20,1.05)]; // network: minted
  const tintCur=new THREE.Color();

  /* ===== timeline — three acts (~12.6s loop) =====
     chip 2.2 → morph 1.5 → brain 2.8 → morph 1.5 → globe 3.2 → morph 1.4 */
  const SEQ=[
    {d:2.2, a:0, b:1, g:0,  ph:'chip'},
    {d:1.5, a:0, b:1, g:-1, ph:'morph'},
    {d:2.8, a:0, b:1, g:1,  ph:'brain'},
    {d:1.5, a:1, b:2, g:-1, ph:'morph'},
    {d:3.2, a:1, b:2, g:1,  ph:'globe'},
    {d:1.4, a:2, b:0, g:-1, ph:'morph'}
  ];
  const CYCLE=SEQ.reduce((s,x)=>s+x.d,0);
  const ease=t=>t<0?0:t>1?1:(t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2);
  const labels=(label&&label.dataset)?{
    chip:label.dataset.chip||'SILICON',
    morph:label.dataset.morph||'TRANSFORMING',
    brain:label.dataset.brain||'INTELLIGENCE',
    globe:label.dataset.globe||'GLOBAL NETWORK'
  }:null;
  let lastLabel='';
  function setLabel(txt){ if(label&&txt!==lastLabel){ label.style.opacity=0;
    setTimeout(()=>{label.textContent=txt;label.style.opacity=1;},250); lastLabel=txt; } }

  let px=0,py=0,tx=0,ty=0;
  window.addEventListener('pointermove',e=>{tx=(e.clientX/window.innerWidth-0.5)*0.4;ty=(e.clientY/window.innerHeight-0.5)*0.25;},{passive:true});
  window.addEventListener('deviceorientation',e=>{if(e.gamma!==null){tx=(e.gamma/45)*0.28;ty=(e.beta/90-0.4)*0.18;}},{passive:true});

  function resize(){
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(canvas.width!==w||canvas.height!==h){
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
      const sc=Math.min(w,h)/540; holoGroup.scale.setScalar(Math.max(0.7,Math.min(1.12,sc)));
    }
  }

  // per-shape resting rotations (x tilt, y spin)
  function rotFor(s,t){
    if (s===0) return [0.5, Math.sin(t*0.5)*0.15];          // chip faces viewer
    if (s===1) return [0.10, t*0.85];                        // brain spins on itself
    return [0.24, t*0.5+2.0];                                // globe, slower stately spin
  }

  const t0=performance.now();
  function frame2(now){
    resize();
    const t=(now-t0)/1000;
    let cc=t%CYCLE, ai=0, bi2=1, gm=0, phase='chip';
    for (const Sq of SEQ){
      if (cc<Sq.d){ ai=Sq.a; bi2=Sq.b; gm=Sq.g<0?cc/Sq.d:Sq.g; phase=Sq.ph; break; }
      cc-=Sq.d;
    }
    if (labels) setLabel(labels[phase==='morph'?'morph':phase]);

    const A=shapePos[ai], B=shapePos[bi2];
    const SA=shapeSegs[ai], SB=shapeSegs[bi2];
    const breathe=1+Math.sin(t*1.1)*0.012;
    for (let k=0;k<N;k++){
      const i3=k*3;
      let m=ease(gm*1.4-delay[k]*0.6);
      const arc=Math.sin(Math.PI*Math.min(1,Math.max(0,m)))*(phase==='morph'?1:0);
      const sa=swirl[k]+t*0.9;
      pos[i3]  =(A[i3]  *(1-m)+B[i3]  *m+Math.cos(sa)*arc*0.45)*breathe;
      pos[i3+1]=(A[i3+1]*(1-m)+B[i3+1]*m+Math.sin(sa*1.3)*arc*0.3)*breathe;
      pos[i3+2]=(A[i3+2]*(1-m)+B[i3+2]*m+Math.sin(sa)*arc*0.45)*breathe;
    }
    geo.attributes.position.needsUpdate=true;

    for (let k=0;k<L;k++){
      const o=k*6, m=ease(gm*1.4-segDelay[k]*0.6);
      for (let j=0;j<6;j++) linePos[o+j]=(SA[o+j]*(1-m)+SB[o+j]*m)*breathe;
    }
    lGeo.attributes.position.needsUpdate=true;

    for (let k=0;k<P;k++){
      pt[k]+=pv[k]*0.016;
      if(pt[k]>1){pt[k]=0;pl[k]=(Math.random()*L)|0;}
      const o=pl[k]*6, f=pt[k];
      pulsePos[k*3]  =linePos[o]  *(1-f)+linePos[o+3]*f;
      pulsePos[k*3+1]=linePos[o+1]*(1-f)+linePos[o+4]*f;
      pulsePos[k*3+2]=linePos[o+2]*(1-f)+linePos[o+5]*f;
    }
    pulseGeo.attributes.position.needsUpdate=true;

    for (let k=0;k<SP;k++){
      sPos[k*3+1]+=sVel[k]*0.016;
      if(sPos[k*3+1]>3.4){ sPos[k*3+1]=-3.4; sPos[k*3]=(Math.random()*2-1)*3.0; sPos[k*3+2]=(Math.random()*2-1)*2.2; }
      const tw=0.35+0.65*Math.abs(Math.sin(t*sFr[k]+sPh[k]));
      const b=sBase[k];
      sCol[k*3]=b.r*tw; sCol[k*3+1]=b.g*tw; sCol[k*3+2]=b.b*tw;
    }
    sGeo.attributes.position.needsUpdate=true;
    sGeo.attributes.color.needsUpdate=true;

    // nebula drift
    for (const nb of nebs){
      nb.position.x=nb.userData.bx+Math.sin(t*0.13+nb.userData.ph)*0.5;
      nb.position.y=nb.userData.by+Math.cos(t*0.10+nb.userData.ph)*0.35;
      nb.material.opacity=nb.userData.o*(0.8+0.2*Math.sin(t*0.4+nb.userData.ph));
    }

    // meteor lifecycle
    if (mtLife<=0 && t>mtNext){
      const dir=Math.random()<0.5?1:-1;
      mtP.x=-dir*4.2; mtP.y=1.2+Math.random()*1.8; mtP.z=-1.4-Math.random()*1.2;
      mtV.x=dir*(3.0+Math.random()); mtV.y=-(0.7+Math.random()*0.9);
      mtLife=mtDur;
    }
    if (mtLife>0){
      mtLife-=0.016;
      mtP.x+=mtV.x*0.016; mtP.y+=mtV.y*0.016;
      const vl=Math.hypot(mtV.x,mtV.y)||1, ux=mtV.x/vl, uy=mtV.y/vl;
      for (let k=0;k<MT;k++){
        mtPos[k*3]=mtP.x-ux*k*0.11; mtPos[k*3+1]=mtP.y-uy*k*0.11; mtPos[k*3+2]=mtP.z;
      }
      mtGeo.attributes.position.needsUpdate=true;
      mtMat.opacity=Math.sin(Math.PI*(1-mtLife/mtDur))*0.9;
      if (mtLife<=0){ mtMat.opacity=0; mtNext=t+5+Math.random()*7; }
    }

    // rotation blends between the two active shapes
    px+=(tx-px)*0.06; py+=(ty-py)*0.06;
    const rl=ease(gm);
    const ra=rotFor(ai,t), rb=rotFor(bi2,t);
    holoGroup.rotation.x=ra[0]*(1-rl)+rb[0]*rl+py;
    holoGroup.rotation.y=ra[1]*(1-rl)+rb[1]*rl+px;

    // colour grading per act
    tintCur.copy(TINTS[ai]).lerp(TINTS[bi2],rl);
    pSharp.material.color.copy(tintCur);
    pHalo.material.color.copy(tintCur);
    pBloom.material.color.copy(tintCur);

    // cinematic camera breathing
    camera.position.z=7.0+Math.sin(t*0.33)*0.18;
    camera.position.x=Math.sin(t*0.17)*0.12;
    camera.position.y=0.1+Math.sin(t*0.23)*0.07;
    camera.lookAt(0,0,0);

    // globe weight drives the orbital ring
    let wG=0; if(ai===2)wG+=(1-gm); if(bi2===2)wG+=gm;

    const flick=0.97+Math.sin(t*21)*0.012+(Math.random()<0.004?-0.1:0);
    pSharp.material.opacity=0.95*flick; pHalo.material.opacity=0.14*flick;
    pBloom.material.opacity=(0.045+0.02*Math.sin(t*0.8))*flick;
    const lineBoost=(phase==='brain'||phase==='globe')?0.10:(phase==='morph'?0.05:0);
    lines.material.opacity=(0.26+lineBoost)*flick;
    ringMat.opacity=0.55*wG*flick;

    renderer.render(scene,camera);
    if(!reduced) requestAnimationFrame(frame2);
  }

  if (reduced){
    for(let k=0;k<N*3;k++)pos[k]=brainPos[k];
    linePos.set(brainSegs);
    geo.attributes.position.needsUpdate=true; lGeo.attributes.position.needsUpdate=true;
    holoGroup.rotation.set(0.1,1.3,0); resize(); renderer.render(scene,camera);
    if(label)label.textContent=label.dataset?(label.dataset.brain||'INTELLIGENCE'):'';
  } else requestAnimationFrame(frame2);

  window.addEventListener('resize',resize);
})();
