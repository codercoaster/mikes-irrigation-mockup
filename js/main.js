/* ==========================================================================
   Page-level behaviour: header, mobile menu, gallery, GSAP motion, FAQ, contact
   ========================================================================== */
(function () {
  'use strict';

  const MIL = (window.MIL = window.MIL || {});
  const html = document.documentElement;
  const hasGsap = typeof window.gsap !== 'undefined';
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduceMotion = () => reduceMQ.matches;

  if (hasGsap) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);
  } else {
    html.classList.remove('js-motion'); // never leave content hidden if the CDN fails
  }

  /* ---------- Hero review badge: a different real review on each load ---------- */
  (function rotateHeroReview() {
    const quoteEl = document.querySelector('[data-hero-quote]');
    const authorEl = document.querySelector('[data-hero-author]');
    if (!quoteEl || !authorEl) return;
    const reviews = [
      { quote: 'Excellent service and response time.', author: 'Kathy A., Google review' },
      { quote: 'They were here on time and completed the project according to plan.', author: 'Sharon M., Homeowner' },
      { quote: 'Thank you to Michael for the advice and help in getting irrigation system overhauled and working again.', author: 'William W., Google review' },
    ];
    const KEY = 'heroReviewIdx';
    let last = -1;
    try { last = parseInt(localStorage.getItem(KEY), 10); } catch (e) { /* storage blocked */ }
    let idx = Math.floor(Math.random() * reviews.length);
    if (idx === last) idx = (idx + 1 + Math.floor(Math.random() * (reviews.length - 1))) % reviews.length;
    try { localStorage.setItem(KEY, String(idx)); } catch (e) { /* storage blocked */ }
    quoteEl.textContent = '\u201C' + reviews[idx].quote + '\u201D';
    authorEl.textContent = '\u2014 ' + reviews[idx].author;
  })();

  let menuOpen = false;
  const headerH = () => parseInt(getComputedStyle(html).getPropertyValue('--header-h'), 10) || 68;

  /* ---------- Smooth scrolling helpers ---------- */
  MIL.scrollToY = (y) => {
    if (hasGsap && window.ScrollToPlugin && !reduceMotion()) {
      // CSS smooth-scroll would fight the tween, so disable it while GSAP drives the scroll
      html.style.scrollBehavior = 'auto';
      gsap.to(window, {
        scrollTo: { y, autoKill: true }, duration: 0.65, ease: 'power3.inOut', overwrite: true,
        onComplete: () => { html.style.scrollBehavior = ''; },
        onInterrupt: () => { html.style.scrollBehavior = ''; }
      });
    } else {
      window.scrollTo({ top: y, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
  };
  MIL.scrollTo = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return;
    // Land on the section's eyebrow/title rather than the section's top padding
    const anchor = el.querySelector('.section-head, .eyebrow') || el;
    // offsetTop chain ignores the reveal transform still applied to unrevealed heads
    let top = 0;
    for (let n = anchor; n; n = n.offsetParent) top += n.offsetTop;
    // Scrolling down hides the header, so only reserve its height when scrolling up
    const offset = top > window.scrollY ? 24 : headerH() + 24;
    MIL.scrollToY(Math.max(0, top - offset));
  };

  document.addEventListener('click', (e) => {
    // Header logo: full page refresh, landing at the top (no hash, no restored scroll)
    const reload = e.target.closest('a[data-reload]');
    if (reload) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      history.replaceState(null, '', location.pathname + location.search);
      location.reload();
      return;
    }
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (menuOpen) closeMenu(false);
    if (id === '#top') MIL.scrollToY(0); else MIL.scrollTo(id);
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  });

  /* ---------- Header state ---------- */
  const header = document.querySelector('[data-header]');
  let lastY = window.scrollY;
  // Bring the header back after the user stops scrolling for a moment
  const HEADER_IDLE_MS = 1500;
  let idleTimer = 0;
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 12);
    if (!menuOpen) {
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > 520) header.classList.add('is-hidden');
      else if (goingUp || y < 520) header.classList.remove('is-hidden');
    }
    lastY = y;
    clearTimeout(idleTimer);
    if (header.classList.contains('is-hidden')) {
      idleTimer = setTimeout(() => header.classList.remove('is-hidden'), HEADER_IDLE_MS);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Show header when keyboard focus moves into it
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  /* ---------- Mobile menu ---------- */
  const menu = document.querySelector('[data-mobile-menu]');
  const toggle = document.querySelector('[data-menu-toggle]');

  function openMenu() {
    menuOpen = true;
    menu.hidden = false;
    void menu.offsetHeight; // commit initial transform before transitioning
    menu.classList.add('is-open');
    header.classList.add('menu-active');
    header.classList.remove('is-hidden');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    const first = menu.querySelector('a');
    setTimeout(() => first && first.focus({ preventScroll: true }), 120);
  }
  function closeMenu(returnFocus = true) {
    menuOpen = false;
    menu.classList.remove('is-open');
    header.classList.remove('menu-active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    const done = () => { if (!menuOpen) menu.hidden = true; };
    menu.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 500);
    if (returnFocus) toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) closeMenu(); });
  window.matchMedia('(min-width: 1040px)').addEventListener('change', (e) => { if (e.matches && menuOpen) closeMenu(false); });

  /* ---------- Active nav link ---------- */
  const navLinks = [...document.querySelectorAll('.main-nav a')];
  // observe every top-level section so the highlight clears on sections that aren't in the nav
  const sectionMap = [...document.querySelectorAll('main > section[id]')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sectionMap.forEach((s) => io.observe(s));
  }

  /* ---------- Portfolio data (21 real project photos) ---------- */
  const PORTFOLIO = [
    { f: 'gallery_landscapes_4', t: 'Rock waterfall & poolside planting', type: 'Landscaping' },
    { f: 'gallery_landscapes_1', t: 'Courtyard pool garden', type: 'Landscaping' },
    { f: 'gallery_landscapes_12', t: 'Fountain island for a circular drive', type: 'Landscaping' },
    { f: 'gallery_irrigation_2', t: 'Even coverage along the walkway', type: 'Irrigation' },
    { f: 'gallery_landscapes_10', t: 'Flagstone corner with garden bench', type: 'Landscaping' },
    { f: 'gallery_landscapes_3', t: 'Stone‑edged entry bed', type: 'Landscaping' },
    { f: 'gallery_landscapes_6', t: 'Flagstone path through a shaded pool garden', type: 'Landscaping' },
    { f: 'gallery_landscapes_11', t: 'Front beds with clipped evergreens', type: 'Landscaping' },
    { f: 'gallery_irrigation_12', t: 'Rotor heads under a mature canopy', type: 'Irrigation' },
    { f: 'gallery_landscapes_5', t: 'Palm island bed for a Mediterranean home', type: 'Landscaping' },
    { f: 'gallery_landscapes_2', t: 'Backyard bed with natural stone border', type: 'Landscaping' },
    { f: 'gallery_landscapes_8', t: 'Tropical color beside the pool', type: 'Landscaping' },
    { f: 'gallery_landscapes_13', t: 'Fresh mulch & foundation planting', type: 'Landscaping' },
    { f: 'gallery_irrigation_1', t: 'Sprinklers keeping azaleas lush', type: 'Irrigation' },
    { f: 'gallery_landscapes_15', t: 'Stone‑bordered front landscape', type: 'Landscaping' },
    { f: 'gallery_landscapes_7', t: 'Sago & palm bed by the pool', type: 'Landscaping' },
    { f: 'gallery_landscapes_14', t: 'Timber‑framed beds for a new porch', type: 'Landscaping' },
    { f: 'gallery_landscapes_17', t: 'Rock garden at the pool’s edge', type: 'Landscaping' },
    { f: 'gallery_irrigation_3', t: 'Pop‑up spray for a green, even lawn', type: 'Irrigation' },
    { f: 'gallery_landscapes_9', t: 'Layered shrubs framing the facade', type: 'Landscaping' },
    { f: 'gallery_landscapes_16', t: 'New shade tree & foundation beds', type: 'Landscaping' }
  ];

  const pad2 = (n) => String(n).padStart(2, '0');
  const mod = (n, m) => ((n % m) + m) % m;
  const N = PORTFOLIO.length;

  /* ---------- Portfolio: infinite draggable grid ---------- */
  const gallery = document.querySelector('[data-gallery]');
  const plane = document.querySelector('[data-gallery-plane]');
  let openLightbox = () => {};

  if (gallery && plane) {
    const GAP = 14;
    const tiles = new Map(); // "c,r" -> element
    const pos = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };
    let W = 0, H = 0, PX = 0, PY = 0, VW = 0, VH = 0;
    let lastKey = '';
    let interacted = false, hovering = false, inView = false, dragging = false, inertia = false;
    let entered = !(hasGsap && !reduceMotion());
    if (!entered) gallery.classList.add('is-pre');
    document.querySelector('[data-gallery-total]').textContent = N;

    // Neighbours (incl. diagonals) never share a photo: offsets 1, 5, 4, 6 are all non-zero mod 21
    const photoAt = (c, r) => mod(c + r * 5, N);

    function measure() {
      VW = gallery.clientWidth; VH = gallery.clientHeight;
      W = Math.round(Math.min(300, Math.max(168, VW * 0.22)));
      H = Math.round(W * 0.75);
      PX = W + GAP; PY = H + GAP;
      lastKey = '';
      tiles.forEach((el) => el.remove());
      tiles.clear();
    }

    function makeTile(c, r) {
      const i = photoAt(c, r);
      const p = PORTFOLIO[i];
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'tile';
      el.tabIndex = -1;
      el.dataset.idx = i;
      el.setAttribute('aria-label', `Open photo: ${p.t}`);
      el.style.cssText = `left:${c * PX}px;top:${r * PY + (mod(c, 2) ? PY / 2 : 0)}px;width:${W}px;height:${H}px`;
      el.innerHTML = `<img src="assets/img/portfolio/${p.f}.jpg" alt="" loading="lazy" decoding="async" draggable="false">
        <span class="tile-cap"><span class="tile-title">${p.t}</span><span class="work-tag" data-type="${p.type}">${p.type}</span></span>`;
      return el;
    }

    function render() {
      plane.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      const c0 = Math.floor(-pos.x / PX) - 1, c1 = Math.ceil((VW - pos.x) / PX);
      const r0 = Math.floor(-pos.y / PY) - 1, r1 = Math.ceil((VH - pos.y) / PY);
      const key = `${c0},${c1},${r0},${r1}`;
      if (key === lastKey) return;
      lastKey = key;
      const keep = new Set();
      const frag = document.createDocumentFragment();
      for (let c = c0; c <= c1; c++) {
        for (let r = r0; r <= r1; r++) {
          const k = `${c},${r}`;
          keep.add(k);
          if (!tiles.has(k)) { const el = makeTile(c, r); tiles.set(k, el); frag.appendChild(el); }
        }
      }
      tiles.forEach((el, k) => { if (!keep.has(k)) { el.remove(); tiles.delete(k); } });
      plane.appendChild(frag);
    }

    function center() {
      // Start with the first project (the waterfall) in the middle of the viewport
      pos.x = Math.round((VW - W) / 2);
      pos.y = Math.round((VH - H) / 2);
    }

    measure(); center(); render();

    /* Frame loop: inertia + idle drift, only while the gallery is on screen */
    let raf = 0, lastT = 0;
    function frame(t) {
      const dt = Math.min(48, t - (lastT || t));
      lastT = t;
      if (inertia && !dragging) {
        pos.x += vel.x * dt; pos.y += vel.y * dt;
        const f = Math.pow(0.92, dt / 16);
        vel.x *= f; vel.y *= f;
        if (Math.hypot(vel.x, vel.y) < 0.01) inertia = false;
      } else if (!interacted && !hovering && !dragging && !reduceMotion()) {
        pos.x -= 0.012 * dt; pos.y -= 0.008 * dt;
      }
      render();
      raf = inView ? requestAnimationFrame(frame) : 0;
    }
    function startLoop() { if (!raf && inView) { lastT = 0; raf = requestAnimationFrame(frame); } }

    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) startLoop();
      if (inView && !entered && e.intersectionRatio > 0.2) runEntrance();
    }, { threshold: [0, 0.2] }).observe(gallery);

    function runEntrance() {
      entered = true;
      const cx = VW / 2, cy = VH / 2;
      const gr = gallery.getBoundingClientRect();
      const list = [...tiles.values()].map((el) => {
        const b = el.getBoundingClientRect();
        return { el, d: Math.hypot(b.left - gr.left + W / 2 - cx, b.top - gr.top + H / 2 - cy) };
      });
      gallery.classList.remove('is-pre');
      list.forEach(({ el, d }) => {
        gsap.fromTo(el, { opacity: 0, scale: 0.9 }, {
          opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out', delay: d * 0.0007, clearProps: 'opacity,transform'
        });
      });
    }

    /* Drag with inertia */
    let start = null, samples = [], moved = false;
    gallery.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y, id: e.pointerId };
      samples = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }];
      moved = false; inertia = false; interacted = true;
      if (hasGsap) gsap.killTweensOf(pos);
    });
    gallery.addEventListener('pointermove', (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!dragging) {
        if (Math.hypot(dx, dy) < (e.pointerType === 'mouse' ? 6 : 3)) return;
        dragging = moved = true;
        // Rebase so the grid doesn't jump by the threshold distance
        start.x = e.clientX; start.y = e.clientY;
        gallery.classList.add('is-dragging');
        try { gallery.setPointerCapture(e.pointerId); } catch (_) {}
        return;
      }
      pos.x = start.px + dx; pos.y = start.py + dy;
      samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
      while (samples.length > 2 && e.timeStamp - samples[0].t > 90) samples.shift();
      startLoop();
    });
    function endDrag(e) {
      if (!start || (e && e.pointerId !== start.id)) return;
      if (dragging && samples.length > 1 && !reduceMotion()) {
        const a = samples[0], b = samples[samples.length - 1];
        const dt = Math.max(16, b.t - a.t);
        const cap = (v) => Math.max(-3, Math.min(3, v));
        // A pause before releasing means no fling
        if (e && e.timeStamp - b.t < (e.pointerType === 'mouse' ? 60 : 100)) {
          vel.x = cap((b.x - a.x) / dt); vel.y = cap((b.y - a.y) / dt);
          inertia = true;
        }
      }
      dragging = false; start = null;
      gallery.classList.remove('is-dragging');
      startLoop();
    }
    gallery.addEventListener('pointerup', endDrag);
    gallery.addEventListener('pointercancel', endDrag);
    // On touch the tile holds implicit capture; handing it to the gallery fires a
    // bubbling lostpointercapture from the tile — that must not end the drag.
    gallery.addEventListener('lostpointercapture', (e) => { if (e.target === gallery) endDrag(e); });

    // Open on click — but never at the end of a drag
    gallery.addEventListener('click', (e) => {
      const tile = e.target.closest('.tile');
      if (!tile || moved) { moved = false; return; }
      openLightbox(+tile.dataset.idx, tile);
    });

    gallery.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
    gallery.addEventListener('pointerleave', () => { hovering = false; });

    // Horizontal trackpad swipes / shift+wheel pan; a plain vertical wheel keeps scrolling the page
    gallery.addEventListener('wheel', (e) => {
      const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!horiz && !e.shiftKey) return;
      e.preventDefault();
      interacted = true; inertia = false;
      pos.x -= horiz ? e.deltaX : e.deltaY;
      if (horiz) pos.y -= e.deltaY;
      startLoop();
    }, { passive: false });

    // Keyboard: arrows pan by one cell, Enter opens the photo nearest the centre
    gallery.addEventListener('keydown', (e) => {
      const dirs = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
      if (dirs[e.key]) {
        e.preventDefault();
        interacted = true; inertia = false;
        const [dx, dy] = dirs[e.key];
        const tx = pos.x + dx * PX, ty = pos.y + dy * PY;
        if (hasGsap && !reduceMotion()) gsap.to(pos, { x: tx, y: ty, duration: 0.2, ease: 'power3.out', overwrite: true, onUpdate: startLoop });
        else { pos.x = tx; pos.y = ty; startLoop(); }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const t = nearestTile();
        if (t) openLightbox(+t.dataset.idx, t);
      }
    });

    function nearestTile(idx) {
      const gr = gallery.getBoundingClientRect();
      const cx = gr.left + gr.width / 2, cy = gr.top + gr.height / 2;
      let best = null, bd = Infinity;
      tiles.forEach((el) => {
        if (idx != null && +el.dataset.idx !== idx) return;
        const b = el.getBoundingClientRect();
        if (b.right < gr.left || b.left > gr.right || b.bottom < gr.top || b.top > gr.bottom) return;
        const d = Math.hypot(b.left + b.width / 2 - cx, b.top + b.height / 2 - cy);
        if (d < bd) { bd = d; best = el; }
      });
      return best;
    }

    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const ow = PX;
        measure();
        // keep the same tile under the viewport centre
        pos.x = pos.x * (PX / ow); pos.y = pos.y * (PX / ow);
        render();
      }, 120);
    });

    /* ---------- Lightbox with a shared-element (FLIP) transition ---------- */
    const lb = document.querySelector('[data-lightbox]');
    if (lb) {
      const media = lb.querySelector('.lightbox-media');
      const img = lb.querySelector('[data-lightbox-img]');
      const titleEl = lb.querySelector('[data-lightbox-title]');
      const tagEl = lb.querySelector('[data-lightbox-tag]');
      const curEl = lb.querySelector('[data-lightbox-current]');
      const chrome = lb.querySelectorAll('.lightbox-caption, .lightbox-bar, .lightbox-close');
      lb.querySelector('[data-lightbox-total]').textContent = pad2(N);
      let current = 0, origin = null, closing = false;
      const animate = () => hasGsap && !reduceMotion();

      function fill(i) {
        current = mod(i, N);
        const p = PORTFOLIO[current];
        img.src = `assets/img/portfolio/${p.f}.jpg`;
        img.alt = p.t;
        titleEl.textContent = p.t;
        tagEl.textContent = p.type;
        tagEl.dataset.type = p.type;
        curEl.textContent = pad2(current + 1);
      }

      function flipFrom(el) {
        const to = media.getBoundingClientRect();
        const from = el.getBoundingClientRect();
        const s = from.width / to.width;
        return {
          x: from.left + from.width / 2 - (to.left + to.width / 2),
          y: from.top + from.height / 2 - (to.top + to.height / 2),
          scale: s
        };
      }

      openLightbox = (i, el) => {
        if (lb.open) return;
        fill(i);
        origin = el;
        closing = false;
        html.classList.add('lightbox-open');
        lb.showModal();
        if (!animate()) return;
        gsap.killTweensOf([lb, media, chrome]);
        gsap.fromTo(lb, { '--scrim': 0 }, { '--scrim': 1, duration: 0.35, ease: 'power2.out' });
        if (el && el.isConnected) {
          el.style.visibility = 'hidden';
          gsap.fromTo(media, flipFrom(el), { x: 0, y: 0, scale: 1, duration: 0.55, ease: 'expo.out' });
        } else {
          gsap.fromTo(media, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' });
        }
        gsap.fromTo(chrome, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, delay: 0.18, ease: 'power3.out', stagger: 0.04 });
      };

      function finishClose() {
        lb.close();
        html.classList.remove('lightbox-open');
        if (hasGsap) gsap.set([lb, media, chrome, img], { clearProps: "all" });
        if (origin) origin.style.visibility = '';
        origin = null; closing = false;
        gallery.focus({ preventScroll: true });
      }

      function close() {
        if (!lb.open || closing) return;
        closing = true;
        if (!animate()) return finishClose();
        // Return to the tile it came from (or a visible copy of the current photo)
        let target = origin && origin.isConnected && +origin.dataset.idx === current ? origin : nearestTile(current);
        if (target !== origin) { if (origin) origin.style.visibility = ''; origin = target; }
        gsap.to(chrome, { opacity: 0, duration: 0.15, ease: 'power2.out' });
        gsap.to(lb, { '--scrim': 0, duration: 0.3, ease: 'power2.out' });
        if (target) {
          target.style.visibility = 'hidden';
          gsap.to(media, { ...flipFrom(target), duration: 0.3, ease: 'power3.out', onComplete: finishClose });
        } else {
          gsap.to(media, { opacity: 0, scale: 0.96, duration: 0.25, ease: 'power2.out', onComplete: finishClose });
        }
      }

      function step(dir) {
        if (closing) return;
        if (origin) { origin.style.visibility = ''; origin = null; }
        // Swap immediately so rapid presses never drop a step; only the entrance animates
        fill(current + dir);
        if (!animate()) return;
        gsap.fromTo(img, { opacity: 0, x: dir * 12 }, { opacity: 1, x: 0, duration: 0.2, ease: 'power3.out', overwrite: true, clearProps: 'transform,opacity' });
      }

      lb.querySelector('[data-lightbox-prev]').addEventListener('click', () => step(-1));
      lb.querySelector('[data-lightbox-next]').addEventListener('click', () => step(1));
      lb.querySelector('[data-lightbox-close]').addEventListener('click', close);
      lb.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
      lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox-inner')) close(); });
      lb.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      });
    }
  }

  /* ---------- FAQ accordion (animated open/close on native <details>) ---------- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const summary = item.querySelector('summary');
    const body = item.querySelector('.faq-body');
    summary.addEventListener('click', (e) => {
      if (!hasGsap || reduceMotion()) return; // native behaviour
      e.preventDefault();
      if (item.open) {
        gsap.to(body, { height: 0, opacity: 0, duration: 0.18, ease: 'power2.out', overwrite: true, onComplete: () => { item.open = false; gsap.set(body, { clearProps: 'all' }); } });
      } else {
        item.open = true;
        gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.28, ease: 'power3.out', overwrite: true, clearProps: 'height,opacity' });
      }
    });
  });

  /* ---------- Contact form (simulated) ---------- */
  const contact = document.querySelector('[data-contact-form]');
  if (contact) {
    const rules = {
      name: (v) => v.trim().length >= 2,
      phone: (v) => v.replace(/\D/g, '').length >= 10,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      message: (v) => v.trim().length >= 5
    };
    const check = (name) => {
      const el = contact.elements[name];
      const ok = rules[name](el.value);
      el.closest('.field').classList.toggle('is-invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    Object.keys(rules).forEach((n) => contact.elements[n].addEventListener('input', () => {
      if (contact.elements[n].closest('.field').classList.contains('is-invalid')) check(n);
    }));
    contact.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = Object.keys(rules).map(check);
      if (ok.includes(false)) { contact.elements[Object.keys(rules)[ok.indexOf(false)]].focus(); return; }
      const btn = contact.querySelector('.btn-confirm');
      btn.classList.add('is-loading');
      setTimeout(() => {
        const body = contact.querySelector('.contact-form-body');
        const success = contact.querySelector('[data-contact-success]');
        const swap = () => { body.hidden = true; success.hidden = false; MIL.animateCheck && MIL.animateCheck(success.querySelector('.done-icon')); };
        if (hasGsap && !reduceMotion()) {
          gsap.to(body, { opacity: 0, filter: 'blur(4px)', duration: 0.18, ease: 'power2.out', onComplete: () => { swap(); gsap.from(success, { opacity: 0, y: 10, duration: 0.3, ease: 'power3.out' }); } });
        } else swap();
      }, 1200);
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- GSAP motion ---------- */
  if (!hasGsap) return;
  const mm = gsap.matchMedia();

  mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    const { motion } = ctx.conditions;

    if (!motion) {
      // Reduced motion: opacity only, no movement
      html.classList.remove('js-motion');
      return;
    }

    // Hero intro: the photo settles in, then the copy rises
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .fromTo('.hero-media img', { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: 'power2.out' }, 0)
      .to('[data-hero-item]', { opacity: 1, y: 0, duration: 0.8, stagger: 0.07 }, 0.25)
      .fromTo('.hero-badge', { opacity: 0, y: 12, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 }, 0.9);

    // Scroll reveals, batched with a short stagger
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06, overwrite: true })
    });

    // About photo reveal
    gsap.fromTo('.about-photo img', { scale: 1.12 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.about-photo', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.fromTo('.about-stamp', { rotation: -30, scale: 0.9, opacity: 0 }, {
      rotation: -8, scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: '.about-visual', start: 'top 70%', once: true }
    });

    return () => { html.classList.add('js-motion'); };
  });

  // Parallax on the hero photo (desktop only, subtle) — separate context so resizing never re-hides content
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 960px)', () => {
    gsap.utils.toArray('[data-parallax]').forEach((el) => {
      gsap.to(el, {
        yPercent: () => parseFloat(el.dataset.parallax),
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
    });
  });

  // Recalculate triggers once images (which affect layout) have loaded
  window.addEventListener('load', () => window.ScrollTrigger && ScrollTrigger.refresh());
})();
