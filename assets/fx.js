/* ============================================================================
   Flash-AI.pro — fx.js  ·  expert micro-interaction layer (v7)
   Progressive enhancement only: works with the existing markup, degrades
   gracefully, and fully stands down under prefers-reduced-motion.
   ── scroll progress · nav condense · cascade reveals · magnetic buttons
      cursor spotlight · floating glass orbs · stat count-up · holo tilt
   ========================================================================== */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- scroll progress bar ---------- */
  const prog = document.createElement('div');
  prog.className = 'scroll-prog';
  document.body.appendChild(prog);

  /* ---------- nav condense ---------- */
  const nav = $('nav');
  let ticking = false;
  function onScroll() {
    const y = scrollY;
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', y > 12);
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- cascade reveals (replaces the basic per-page observer) ---------- */
  // stagger siblings that share a parent so groups flow in one after another
  const groups = new Map();
  $$('.rv').forEach(el => {
    const p = el.parentElement;
    if (!groups.has(p)) groups.set(p, 0);
    const i = groups.get(p); groups.set(p, i + 1);
    el.style.setProperty('--rvd', Math.min(i * 90, 360) + 'ms');
  });
  if (reduced) {
    $$('.rv').forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(el => io.observe(el));
  }

  if (reduced) return; // everything below is pure motion sugar

  /* ---------- floating glass orbs ---------- */
  const orbs = document.createElement('div');
  orbs.className = 'orbs';
  const palette = ['rgba(106,72,255,.5)', 'rgba(43,170,226,.5)', 'rgba(12,201,155,.45)'];
  for (let i = 0; i < 7; i++) {
    const o = document.createElement('div');
    o.className = 'orb';
    const size = 70 + Math.random() * 220;
    o.style.width = o.style.height = size + 'px';
    o.style.left = Math.random() * 100 + 'vw';
    o.style.top = 100 + Math.random() * 40 + 'vh';
    o.style.background = `radial-gradient(circle at 34% 30%, rgba(255,255,255,.85), ${palette[i % 3]} 38%, transparent 64%)`;
    o.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
    o.style.animationDuration = (24 + Math.random() * 26) + 's';
    o.style.animationDelay = -(Math.random() * 40) + 's';
    o.style.opacity = (.25 + Math.random() * .35).toFixed(2);
    orbs.appendChild(o);
  }
  document.body.appendChild(orbs);

  /* ---------- magnetic buttons ---------- */
  if (fine) $$('.btn').forEach(btn => {
    const strength = 0.32;
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${dx * strength}px, ${dy * strength - 2}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });

  /* ---------- cursor spotlight on glass cards ---------- */
  if (fine) $$('.cell, .acc').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  });

  /* ---------- holo stage 3D tilt ---------- */
  const stage = $('.holo-stage');
  if (stage && fine) {
    let raf;
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        stage.style.setProperty('--ty', (px * 9).toFixed(2) + 'deg');
        stage.style.setProperty('--tx', (-py * 9).toFixed(2) + 'deg');
      });
    });
    stage.addEventListener('pointerleave', () => {
      stage.style.setProperty('--tx', '0deg'); stage.style.setProperty('--ty', '0deg');
    });
  }

  /* ---------- stat count-up ---------- */
  const nums = $$('.tk b .grad-text, [data-count]').filter(el => /^\d+$/.test(el.textContent.trim()));
  if (nums.length) {
    const cio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.textContent.trim();
      cio.unobserve(el);
      const dur = 900, t0 = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);
      (function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(ease(p) * target);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }), { threshold: .6 });
    nums.forEach(el => cio.observe(el));
  }
})();
