// Hero: two illustrated scenes (globe, then flat horizon). Each has a greyscale image and a colour
// image on top, masked to a few discs: one that follows the cursor (the lens) and one per object
// the visitor has hovered. Objects share keys across both scenes, so finding the Merlion on the
// globe also colours it on the flat map. Once every object is found, the colour floods the scene.
(() => {
  const hero = document.querySelector('.hero');
  const stage = hero.querySelector('.stage');
  const tip = hero.querySelector('.tip');
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RATIO = 1983 / 793; // image width / height, to turn %-of-width radii into circles
  const disc = '#000 calc(100% - 1px), transparent 100%';

  const reg = (name, syntax, initialValue) => {
    try { CSS.registerProperty({ name, syntax, inherits: false, initialValue }); } catch (e) { /* already registered */ }
  };
  reg('--lr', '<length>', '0px');
  reg('--ka', '<number>', '0');

  const scenes = [...hero.querySelectorAll('.scene')].map((el) => {
    const art = el.querySelector('.art');
    const colour = el.querySelector('.art-colour');
    // The bright star is the theme switch, not one of the objects to find.
    const spots = [...el.querySelectorAll('.spot:not([data-theme-toggle])')].map((b, i) => ({
      el: b, key: b.dataset.key, label: b.dataset.label, i,
      x: parseFloat(b.style.getPropertyValue('--x')),
      y: parseFloat(b.style.getPropertyValue('--y')),
      r: parseFloat(b.style.getPropertyValue('--r')),
    }));
    spots.forEach((s) => reg(`--k${s.i}`, '<number>', '0'));
    // Everything is in % of the art box, so the mask stays put through resizes and the zoom.
    const layers = [
      `radial-gradient(circle var(--lr) at var(--lx) var(--ly), ${disc})`,
      `radial-gradient(ellipse calc(var(--ka) * 160%) calc(var(--ka) * 160%) at var(--xa) var(--ya), ${disc})`,
      ...spots.map((s) => `radial-gradient(ellipse calc(var(--k${s.i}) * ${(s.r * 1.2).toFixed(2)}%) calc(var(--k${s.i}) * ${(s.r * 1.2 * RATIO).toFixed(2)}%) at ${s.x}% ${s.y}%, ${disc})`),
    ].join(',');
    const st = colour.style;
    st.maskImage = layers; st.webkitMaskImage = layers;
    st.maskRepeat = 'no-repeat'; st.webkitMaskRepeat = 'no-repeat';
    st.transition = [
      '--lr .3s cubic-bezier(.16,1,.3,1)',
      `--ka ${reduce ? 0.4 : 1.8}s cubic-bezier(.65,0,.35,1)`,
      ...spots.map((s) => `--k${s.i} ${reduce ? 0.2 : 0.9}s cubic-bezier(.16,1,.3,1)`),
    ].join(',');
    st.setProperty('--lx', '-999px'); st.setProperty('--ly', '-999px');
    st.setProperty('--xa', '50%'); st.setProperty('--ya', '60%');
    return { el, art, colour, lens: el.querySelector('.lens'), spots };
  });

  // Only count objects you can actually see (phones crop the sides of the artwork).
  let keys = [];
  function countable() {
    const box = stage.getBoundingClientRect();
    const s0 = scenes[0];
    keys = [...new Set(s0.spots.filter((s) => {
      const b = s.el.getBoundingClientRect();
      const cx = b.left + b.width / 2;
      return cx > box.left + 8 && cx < box.right - 8;
    }).map((s) => s.key))];
  }

  const found = new Set();
  let complete = false;

  function finish(spot) {
    complete = true;
    for (const sc of scenes) {
      const s = spot && sc.spots.find((p) => p.key === spot.key);
      sc.colour.style.setProperty('--xa', s ? `${s.x}%` : '50%');
      sc.colour.style.setProperty('--ya', s ? `${s.y}%` : '60%');
    }
    requestAnimationFrame(() => scenes.forEach((sc) => sc.colour.style.setProperty('--ka', '1')));
    hero.classList.add('is-complete');
  }

  function reveal(spot) {
    if (complete || found.has(spot.key)) return;
    found.add(spot.key);
    for (const sc of scenes) sc.spots.forEach((s) => { if (s.key === spot.key) sc.colour.style.setProperty(`--k${s.i}`, '1'); });
    if (keys.every((k) => found.has(k))) finish(spot);
  }


  // Lens: follows the mouse in whichever scene is showing (both get it; the hidden one is invisible).
  let raf = 0, cx = 0, cy = 0, lensOn = false;
  const lensR = () => Math.round(Math.min(100, Math.max(64, window.innerWidth * 0.06)));
  function placeLens() {
    raf = 0;
    const r = lensR();
    for (const sc of scenes) {
      const b = sc.art.getBoundingClientRect();
      if (!b.width) continue;
      const k = sc.art.offsetWidth / b.width; // undo the zoom transform
      const x = (cx - b.left) * k, y = (cy - b.top) * k;
      sc.colour.style.setProperty('--lx', `${x}px`);
      sc.colour.style.setProperty('--ly', `${y}px`);
      sc.colour.style.setProperty('--lr', lensOn ? `${r}px` : '0px');
      sc.lens.style.width = sc.lens.style.height = `${r * 2}px`;
      sc.lens.style.transform = `translate(${x - r}px, ${y - r}px)`;
      sc.lens.classList.toggle('on', lensOn);
    }
  }
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    cx = e.clientX; cy = e.clientY; lensOn = true;
    if (!raf) raf = requestAnimationFrame(placeLens);
  });
  stage.addEventListener('pointerleave', () => { lensOn = false; placeLens(); });

  // Labels and reveals for each object.
  let tipTimer = 0;
  function showTip(spot) {
    const b = spot.el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    // Default: just above the hover area. Spots with data-tip ("x y", % of the artwork) point at a
    // specific spot instead, e.g. the top of the alien's and the dog's heads.
    let ax = b.left + b.width / 2, ay = b.top + b.height * 0.15;
    if (spot.el.dataset.tip) {
      const [px, py] = spot.el.dataset.tip.split(' ').map(Number);
      const a = spot.el.closest('.art').getBoundingClientRect();
      ax = a.left + (a.width * px) / 100;
      ay = a.top + (a.height * py) / 100;
    }
    const x = Math.min(s.width - 90, Math.max(90, ax - s.left));
    tip.textContent = spot.label;
    // "right" puts the label beside the anchor (vertically centred) instead of above it.
    const side = spot.el.dataset.tipSide === 'right';
    tip.style.translate = side ? '12px -50%' : '';
    tip.style.transform = `translate(${side ? ax - s.left : x}px, ${side ? ay - s.top : Math.max(72, ay - s.top)}px)`;
    tip.classList.add('on');
  }
  const hideTip = () => tip.classList.remove('on');

  for (const sc of scenes) {
    for (const spot of sc.spots) {
      const show = () => { reveal(spot); showTip(spot); };
      spot.el.addEventListener('pointerenter', show);
      spot.el.addEventListener('focus', show);
      spot.el.addEventListener('pointerleave', hideTip);
      spot.el.addEventListener('blur', hideTip);
      spot.el.addEventListener('click', (e) => {
        show();
        // Spots with data-href (e.g. "Me") are links: colour in, then go to that section.
        if (spot.el.dataset.href) {
          hideTip();
          const target = document.querySelector(spot.el.dataset.href);
          if (target) { target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', spot.el.dataset.href); }
          return;
        }
        if (e.pointerType !== 'mouse') { clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 1600); }
      });
    }
  }

  // Dark / bright mode. The bright star in the scene (and a star in the nav on phones) flips it:
  // daylight spreads across the sky from the star and the whole globe floods with colour.
  const toggles = [...document.querySelectorAll('[data-theme-toggle]')];
  const STAR = { x: 80.94, y: 14.5 };
  function applyTheme(light, save) {
    if (light) root.dataset.theme = 'light'; else delete root.dataset.theme;
    if (save) { try { localStorage.setItem('feryanto-theme', light ? 'light' : 'dark'); } catch (e) { /* storage blocked */ } }
    toggles.forEach((t) => {
      t.setAttribute('aria-pressed', String(light));
      t.setAttribute('aria-label', light ? 'Dark mode' : 'Bright mode');
      t.dataset.label = light ? 'Dark mode' : 'Bright mode';
    });
    if (complete) return;
    for (const sc of scenes) {
      sc.colour.style.setProperty('--xa', `${STAR.x}%`);
      sc.colour.style.setProperty('--ya', `${STAR.y}%`);
      sc.colour.style.setProperty('--ka', light ? '1' : '0');
    }
  }
  // One wipe for the whole page: snapshot it, switch theme instantly underneath, then reveal the new
  // theme as a circle growing from the star that was clicked. Header, sky and globe change together,
  // so there is never a bright header over a dark sky (or the reverse).
  function switchTheme(origin) {
    const light = root.dataset.theme !== 'light';
    if (!document.startViewTransition || reduce) { applyTheme(light, true); return; }
    const b = origin.getBoundingClientRect();
    const x = b.left + b.width / 2, y = b.top + b.height / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('theme-switching');
    const vt = document.startViewTransition(() => applyTheme(light, true));
    // Soft-edged circle: the new theme fades in over a 160px band at the edge of the circle.
    root.style.setProperty('--vt-x', `${x}px`);
    root.style.setProperty('--vt-y', `${y}px`);
    vt.ready.then(() => {
      root.animate(
        { '--vt-r': ['0px', `${r + 200}px`] },
        { duration: 1200, easing: 'cubic-bezier(.65, 0, .35, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => {});
    vt.finished.finally(() => root.classList.remove('theme-switching'));
  }

  toggles.forEach((t) => {
    t.addEventListener('click', (e) => {
      switchTheme(t);
      if (t.classList.contains('spot')) {
        tip.textContent = t.dataset.label;
        if (e.pointerType !== 'mouse') { clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 1600); }
      }
    });
    if (t.classList.contains('spot')) {
      const show = () => showTip({ el: t, label: t.dataset.label });
      t.addEventListener('pointerenter', show);
      t.addEventListener('focus', show);
      t.addEventListener('pointerleave', hideTip);
      t.addEventListener('blur', hideTip);
    }
  });
  applyTheme(root.dataset.theme === 'light', false);
  countable();
  new ResizeObserver(countable).observe(stage);

  // About photos: the front photo slides out, then tucks in behind the others.
  const stack = document.querySelector('.stack');
  if (stack) {
    const snaps = [...stack.querySelectorAll('.snap')];
    const hint = document.querySelector('.stack-hint');
    if (!matchMedia('(hover: none)').matches) hint.textContent = 'Click the photo to shuffle';
    let order = snaps.slice();
    let busy = false;
    stack.addEventListener('click', () => {
      if (busy || order.length < 2) return;
      busy = true;
      const front = order[0];
      front.classList.add('is-leaving');
      setTimeout(() => {
        order = [...order.slice(1), front];
        order.forEach((el, i) => { el.dataset.pos = i; });
        front.classList.remove('is-leaving');
        hint.textContent = `Photo ${snaps.indexOf(order[0]) + 1} of ${snaps.length}`;
        busy = false;
      }, reduce ? 0 : 320);
    });
  }

  // Sections fade up as they enter the viewport.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();
