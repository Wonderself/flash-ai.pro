/* ============================================================================
   Flash-AI.pro — fx.js  ·  expert motion layer (v8)
   ── scroll progress · nav condense · cascade blur reveals · kinetic H1
      HUD text decode · self-drawing SVG diagrams · 3D card tilt + spotlight
      magnetic buttons + ripple · cursor aura · floating orbs · marquee
      page transitions · stat count-up
   Progressive enhancement only; stands down under prefers-reduced-motion.
   ========================================================================== */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- scroll progress + nav condense + parallax ---------- */
  const prog = document.createElement('div');
  prog.className = 'scroll-prog';
  document.body.appendChild(prog);
  const nav = $('nav');
  const stage = $('.holo-stage');
  let ticking = false;
  function onScroll() {
    const y = scrollY;
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', y > 12);
    if (stage && !reduced) stage.style.setProperty('--plx', (y * 0.06).toFixed(1) + 'px');
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- cascade reveals ---------- */
  const groups = new Map();
  $$('.rv').forEach(el => {
    const p = el.parentElement;
    if (!groups.has(p)) groups.set(p, 0);
    const i = groups.get(p); groups.set(p, i + 1);
    el.style.setProperty('--rvd', Math.min(i * 90, 360) + 'ms');
  });
  /* ---------- lifecycle sequencer — steps light up one by one ---------- */
  const lc = document.getElementById('lifecycle');
  if (lc) {
    const sts = $$('.st', lc);
    const wheels = $$('.wheel', lc);
    const stepEl = document.getElementById('lcStep');
    const nEl = document.getElementById('lcN');
    const aTop = $('.flowTop', lc), aBot = $('.flowBot', lc);
    const firstOp = sts.findIndex(s => s.closest('.wheel') !== sts[0].closest('.wheel'));
    let li = 0;
    const tick = () => {
      sts.forEach((s, j) => s.classList.toggle('on', j === li));
      const w = sts[li].closest('.wheel');
      wheels.forEach(x => x.classList.toggle('live', x === w));
      if (stepEl) {
        stepEl.style.opacity = 0;
        setTimeout(() => { stepEl.textContent = sts[li].dataset.name || ''; stepEl.style.opacity = 1; }, 160);
      }
      if (nEl) nEl.textContent = String(li + 1).padStart(2, '0') + ' / ' + String(sts.length).padStart(2, '0');
      if (aTop) aTop.classList.toggle('hot', li === firstOp);   // build → operate handoff
      if (aBot) aBot.classList.toggle('hot', li === 0);          // feedback loop closes
      li = (li + 1) % sts.length;
    };
    tick();
    setInterval(tick, 1700);
  }

  /* ---------- contact form — AJAX submit, inline status, no page leave ---------- */
  const form = document.querySelector('.form-wrap');
  if (form) {
    const lang = (document.documentElement.lang || 'en').slice(0, 2);
    const T = {
      en: { send: 'Sending…', ok: 'Thank you — your message is on its way. We’ll come back to you shortly.', err: 'Something went wrong. Please email contact@flash-ai.pro directly.' },
      fr: { send: 'Envoi…',   ok: 'Merci — votre message part vers nous. Nous revenons vers vous très vite.', err: 'Une erreur est survenue. Écrivez-nous directement à contact@flash-ai.pro.' },
      es: { send: 'Enviando…', ok: 'Gracias — su mensaje está en camino. Le responderemos en breve.', err: 'Algo salió mal. Escríbanos directamente a contact@flash-ai.pro.' }
    }[lang] || null;
    const m = T || { send: 'Sending…', ok: 'Thank you — your message is on its way.', err: 'Something went wrong. Please email contact@flash-ai.pro.' };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('.f-submit');
      const res = form.querySelector('.form-result');
      const data = Object.fromEntries(new FormData(form).entries());
      const orig = btn.textContent;
      btn.disabled = true; btn.textContent = m.send;
      if (res) { res.hidden = false; res.className = 'form-result'; res.textContent = m.send; }
      try {
        const r = await fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.success) {
          form.reset();
          if (res) { res.className = 'form-result ok'; res.textContent = m.ok; }
        } else {
          if (res) { res.className = 'form-result err'; res.textContent = m.err; }
        }
      } catch (err) {
        if (res) { res.className = 'form-result err'; res.textContent = m.err; }
      } finally {
        btn.disabled = false; btn.textContent = orig;
      }
    });
  }

  if (reduced) {
    $$('.rv').forEach(el => el.classList.add('in'));
    return; // everything below is motion sugar
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* ---------- kinetic title — words rise out of a blur, one by one ---------- */
  const h1 = $('.hero h1') || $('.page-hero h1');
  if (h1) {
    const splitNode = (node, grad) => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const s = document.createElement('span');
        s.className = 'w' + (grad ? ' gw' : '');
        s.textContent = part;
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    };
    const walk = el => {
      [...el.childNodes].forEach(n => {
        if (n.nodeType === 3 && n.textContent.trim()) splitNode(n, !!el.closest('.grad-text'));
        else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(h1);
    $$('.w', h1).forEach((w, i) => { w.style.transitionDelay = (90 + i * 75) + 'ms'; });
    h1.classList.add('kinetic');
    requestAnimationFrame(() => requestAnimationFrame(() => h1.classList.add('go')));
  }

  /* ---------- HUD decode on eyebrows (mono font → no layout shift) ---------- */
  const GLYPHS = '█▓▒░<>/\\|=+*#';
  $$('.eyebrow').forEach(el => {
    if (el.querySelector('*')) return; // text-only eyebrows
    const orig = el.textContent;
    if (!orig.trim()) return;
    let done = false;
    const dio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting || done) return;
      done = true; dio.disconnect();
      const t0 = performance.now(), dur = Math.min(1000, 320 + orig.length * 26);
      (function tick(now) {
        const p = (now - t0) / dur;
        if (p >= 1) { el.textContent = orig; return; }
        const reveal = Math.floor(p * orig.length);
        let s = '';
        for (let i = 0; i < orig.length; i++)
          s += i < reveal ? orig[i] : (orig[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]);
        el.textContent = s;
        requestAnimationFrame(tick);
      })(t0);
    }), { threshold: .5 });
    dio.observe(el);
  });

  /* ---------- self-drawing SVG diagrams ---------- */
  $$('svg').forEach(svg => {
    if (svg.closest('nav, footer, .logo, .btn, button')) return;
    const items = [];
    svg.querySelectorAll('path, circle, rect, line, polyline, ellipse').forEach(el => {
      const stroke = el.getAttribute('stroke') || '';
      if (!stroke || stroke === 'none') return;
      let len = 0;
      try { len = el.getTotalLength(); } catch (e) { return; }
      if (!len || !isFinite(len)) return;
      items.push({ el, len, dash: el.getAttribute('stroke-dasharray') });
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
    });
    if (!items.length) return;
    const sio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      sio.disconnect();
      items.forEach((it, i) => {
        const d = Math.min(i * 55, 850);
        it.el.style.transition = `stroke-dashoffset 1.1s cubic-bezier(.45,0,.2,1) ${d}ms`;
        it.el.style.strokeDashoffset = '0';
        setTimeout(() => { // hand back any intended dash pattern (dashed borders etc.)
          it.el.style.transition = '';
          it.el.style.strokeDashoffset = '';
          it.el.style.strokeDasharray = it.dash || '';
        }, 1250 + d);
      });
    }), { threshold: .3 });
    sio.observe(svg);
  });

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

  /* ---------- tech marquee under the hero (home pages only) ---------- */
  const hero = $('header.hero');
  if (hero) {
    const words = ['MISTRAL','LLAMA','DEEPSEEK','RAG','ON-PREMISE','PRIVATE CLOUD','AIR-GAP','SOVEREIGN AI','ZERO EXFILTRATION','GDPR-NATIVE','TLV ✕ PAR'];
    const mq = document.createElement('div');
    mq.className = 'marquee';
    mq.setAttribute('aria-hidden', 'true');
    const track = document.createElement('div');
    track.className = 'mq-track';
    const seq = words.map(w => `<span>${w}</span><i>✦</i>`).join('');
    track.innerHTML = seq + seq;
    mq.appendChild(track);
    hero.after(mq);
  }

  /* ---------- magnetic buttons + ripple ---------- */
  $$('.btn').forEach(btn => {
    if (fine) {
      const strength = 0.3;
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * strength}px, ${dy * strength - 2}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    }
    btn.addEventListener('click', e => {
      const r = btn.getBoundingClientRect();
      const rip = document.createElement('span');
      rip.className = 'ripple';
      const sz = Math.max(r.width, r.height);
      rip.style.width = rip.style.height = sz + 'px';
      rip.style.left = (e.clientX - r.left - sz / 2) + 'px';
      rip.style.top = (e.clientY - r.top - sz / 2) + 'px';
      btn.appendChild(rip);
      setTimeout(() => rip.remove(), 650);
    });
  });

  /* ---------- 3D tilt + cursor spotlight on glass cards ---------- */
  if (fine) $$('.cell, .acc, .step').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', px * 100 + '%');
      card.style.setProperty('--my', py * 100 + '%');
      card.style.setProperty('--ry', ((px - .5) * 5).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-(py - .5) * 5).toFixed(2) + 'deg');
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  /* ---------- holo stage 3D tilt ---------- */
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

  /* ---------- cursor aura — a soft light that follows the pointer ---------- */
  if (fine) {
    const aura = document.createElement('div');
    aura.className = 'cursor-aura';
    document.body.appendChild(aura);
    let ax = innerWidth / 2, ay = -300, mx2 = ax, my2 = ay;
    addEventListener('pointermove', e => { mx2 = e.clientX; my2 = e.clientY; }, { passive: true });
    (function auraLoop() {
      ax += (mx2 - ax) * .14; ay += (my2 - ay) * .14;
      aura.style.transform = `translate(${ax - 215}px, ${ay - 215}px)`;
      requestAnimationFrame(auraLoop);
    })();
  }

  /* ---------- stat count-up ---------- */
  const nums = $$('.tk b .grad-text, [data-count]').filter(el => /^\d+$/.test(el.textContent.trim()));
  if (nums.length) {
    const cio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.textContent.trim();
      cio.unobserve(el);
      const dur = 900, t0 = performance.now();
      const easeOut = t => 1 - Math.pow(1 - t, 3);
      (function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(easeOut(p) * target);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }), { threshold: .6 });
    nums.forEach(el => cio.observe(el));
  }

  /* ---------- soft page transitions ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (href.includes('#') && href.split('#')[0] === location.pathname) return; // same-page anchor
    e.preventDefault();
    document.body.classList.add('page-leave');
    setTimeout(() => { location.href = href; }, 230);
  });
  addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('page-leave'); });
})();
