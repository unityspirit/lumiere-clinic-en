/* ═══════════════════════════════════════════
   LUMIÈRE CLINIC — ScrollCanvas Engine + UI
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Config ──
  const TOTAL_FRAMES = 560;
  const PAGE_COUNT = 6;
  const LERP = 0.02;
  const CONCURRENCY = 48;
  const isMobile = innerWidth < 768;
  const FRAME_DIR = isMobile ? 'frames-mobile' : 'frames-webp';

  // ── Elements ──
  const canvas = document.getElementById('gl-canvas');
  const ctx = canvas.getContext('2d');
  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loader-fill');
  const loaderPct = document.getElementById('loader-pct');
  const navbar = document.getElementById('navbar');
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('nav-drawer');
  const scrim = document.getElementById('nav-scrim');
  const drawerClose = document.getElementById('drawer-close');
  const pages = Array.from(document.querySelectorAll('.page'));
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const drawerLinks = Array.from(document.querySelectorAll('.drawer-link'));

  // ── State ──
  const frames = new Array(TOTAL_FRAMES);
  let loaded = 0;
  let isReady = false;
let preloaderDismissed = false;
const PRELOADER_THRESHOLD = 15;
  let currentFrame = 0;
  let targetFrame = 0;

  // ── Canvas Sizing ──
  function resizeCanvas() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ── Frame Loader ──
  function framePath(i) {
    const n = String(i + 1).padStart(6, '0');
    return FRAME_DIR + '/frame_' + n + '.webp';
  }

  async function loadFrame(idx) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { frames[idx] = img; loaded++; updateLoader(); resolve(); };
      img.onerror = () => { loaded++; updateLoader(); resolve(); };
      img.src = framePath(idx);
    });
  }

  function updateLoader() {
    const realPct = Math.min(100, Math.round((loaded / TOTAL_FRAMES) * 100));
    if (!preloaderDismissed) {
      const visualPct = Math.min(Math.round((realPct / PRELOADER_THRESHOLD) * 100), 100);
      loaderFill.style.width = visualPct + '%';
      loaderPct.textContent = visualPct + '%';
      if (realPct >= PRELOADER_THRESHOLD) {
        preloaderDismissed = true;
        loader.style.transition='opacity 0.7s';loader.style.opacity='0';setTimeout(function(){loader.style.display='none'},700);
        const slb = document.getElementById('siteLoadingBar');
        setTimeout(() => { if(slb) slb.style.opacity='1';slb.style.visibility='visible'; }, 600);
      }
    } else {
      const fill = document.getElementById('siteLoadingFillInner');
      const txt = document.getElementById('siteLoadingText');
      const phase2Pct = Math.round(((realPct - PRELOADER_THRESHOLD) / (100 - PRELOADER_THRESHOLD)) * 100);
      if (fill) fill.style.width = phase2Pct + '%';
      if (txt) txt.textContent = 'Loading video ' + realPct + '%';
    }
  }

  async function loadAllFrames() {
    const queue = Array.from({ length: TOTAL_FRAMES }, (_, i) => i);
    async function worker() {
      while (queue.length > 0) {
        const idx = queue.shift();
        await loadFrame(idx);
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  }

  // ── Draw Frame (cover fit) ──
  function drawFrame(idx) {
    const img = frames[idx];
    if (!img) return;
    const cw = canvas.width, ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const sw = iw * scale, sh = ih * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - sw) / 2, (ch - sh) / 2, sw, sh);
  }

  // ── Scroll Handler ──
  window.addEventListener('scroll', () => {
    if (!isReady) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    targetFrame = progress * (TOTAL_FRAMES - 1);
  }, { passive: true });

  // ── rAF Loop ──
  function animate() {
    requestAnimationFrame(animate);
    currentFrame += (targetFrame - currentFrame) * LERP;
    if (isReady) {
      drawFrame(Math.round(currentFrame));
    }
  }
  animate();

  // ── IntersectionObserver ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = pages.indexOf(entry.target);
        pages.forEach((p, i) => p.classList.toggle('is-active', i === idx));
        navLinks.forEach((l, i) => l.classList.toggle('active', i === idx - 1));
        drawerLinks.forEach((l, i) => l.classList.toggle('active', i === idx - 1));
      }
    });
  }, { root: null, rootMargin: '-40% 0px -40% 0px' });

  pages.forEach(p => observer.observe(p));

  // ── Smooth Scroll Navigation ──
  function scrollToSection(idx) {
    const target = pages[idx];
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }

  document.querySelectorAll('[data-scroll]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = parseInt(el.dataset.scroll);
      scrollToSection(idx);
      // Close drawer if open
      if (drawer && !drawer.hidden) {
        drawer.hidden = true;
        scrim.hidden = true;
      }
    });
  });

  // ── Mobile Drawer ──
  burger.addEventListener('click', () => {
    drawer.hidden = false;
    scrim.hidden = false;
  });
  drawerClose.addEventListener('click', () => {
    drawer.hidden = true;
    scrim.hidden = true;
  });
  scrim.addEventListener('click', () => {
    drawer.hidden = true;
    scrim.hidden = true;
  });

  // ── Navbar scroll effect ──
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // ── Contact Form ──
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit');
      btn.textContent = '✓ Request submitted!';
      btn.style.background = 'linear-gradient(135deg, #7abfb5, #5a9f95)';
      setTimeout(() => {
        btn.textContent = 'Book Now';
        btn.style.background = '';
        form.reset();
      }, 3000);
    });
  }

  // ── Init ──
  async function init() {
    // Draw a gradient background while loading
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0a0a12');
    grad.addColorStop(0.5, '#12101e');
    grad.addColorStop(1, '#0a0a12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await loadAllFrames();

    isReady = true;

    // If no frames loaded (no video yet), show static gradient
    if (!frames[0]) {
      isReady = false;
      // Draw elegant animated gradient as fallback
      drawFallbackBg();
    }

    // Activate first section
    pages[0].classList.add('is-active');

    // Hide loader
    if (!preloaderDismissed) { loader.style.transition='opacity 0.7s';loader.style.opacity='0';setTimeout(function(){loader.style.display='none'},700); }
    const slb = document.getElementById('siteLoadingBar');
    const slbTxt = document.getElementById('siteLoadingText');
    if (slbTxt) slbTxt.textContent = 'Loading complete';
    setTimeout(() => { if(slb) { slb.style.opacity='0';setTimeout(function(){if(slb)slb.remove()},600); } }, 800);
    setTimeout(() => { loader.style.display = 'none'; }, 700);
  }

  // ── Fallback animated background ──
  let fallbackHue = 0;
  function drawFallbackBg() {
    fallbackHue += 0.15;
    const cw = canvas.width, ch = canvas.height;

    const grad = ctx.createRadialGradient(cw * 0.3, ch * 0.3, 0, cw * 0.5, ch * 0.5, cw * 0.8);
    grad.addColorStop(0, `hsla(${(fallbackHue + 30) % 360}, 15%, 12%, 1)`);
    grad.addColorStop(0.4, `hsla(${(fallbackHue + 10) % 360}, 12%, 8%, 1)`);
    grad.addColorStop(1, '#0a0a12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    // Subtle gold particles
    for (let i = 0; i < 30; i++) {
      const x = (Math.sin(fallbackHue * 0.01 + i * 1.7) * 0.4 + 0.5) * cw;
      const y = (Math.cos(fallbackHue * 0.008 + i * 2.3) * 0.4 + 0.5) * ch;
      const r = 1 + Math.sin(fallbackHue * 0.02 + i) * 0.8;
      const alpha = 0.08 + Math.sin(fallbackHue * 0.015 + i * 0.5) * 0.06;
      ctx.beginPath();
      ctx.arc(x, y, r * devicePixelRatio, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201, 169, 110, ${alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(drawFallbackBg);
  }

  init();
})();


// Site loading bar CSS (Phase 2 - deferred)
const siteBarStyle = document.createElement('style');
siteBarStyle.textContent = '.site-loading-bar{position:fixed;bottom:0;left:0;width:100%;height:28px;background:rgba(10,10,10,.85);backdrop-filter:blur(8px);z-index:9998;display:flex;align-items:center;padding:0 16px;gap:10px;opacity:0;visibility:hidden;transition:opacity .5s,visibility .5s;border-top:1px solid rgba(255,255,255,.08)}.site-loading-bar.active{opacity:1;visibility:visible}.site-loading-bar.done{opacity:0;visibility:hidden}.site-loading-fill{flex:1;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}.site-loading-fill-inner{height:100%;width:0;background:linear-gradient(90deg,var(--gold,var(--accent,#c9a84c)),var(--gold-light,#e8c97a));border-radius:2px;transition:width .2s}.site-loading-text{font-size:11px;color:rgba(255,255,255,.5);white-space:nowrap}';
document.head.appendChild(siteBarStyle);

// === SITE LOADING BAR (Phase 2 — deferred) ===
(function(){
  if (document.getElementById('siteLoadingBar')) return;
  var el = document.createElement('div');
  el.id = 'siteLoadingBar';
  el.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;height:32px;background:rgba(10,10,10,.88);backdrop-filter:blur(10px);z-index:9998;display:flex;align-items:center;padding:0 20px;gap:12px;opacity:0;visibility:hidden;transition:opacity .5s,visibility .5s;border-top:1px solid rgba(255,255,255,.08);';
  el.innerHTML = '<div style="flex:1;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;"><div id="slbFill" style="height:100%;width:0;background:linear-gradient(90deg,var(--gold,var(--accent,#c9a84c)),#e8c97a);border-radius:2px;transition:width .25s;"></div></div><span id="siteLoadingText" style="font-size:11px;color:rgba(255,255,255,.5);white-space:nowrap;">Loading video...</span>';
  document.body.appendChild(el);
})();
