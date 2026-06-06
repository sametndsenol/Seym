/* SEYM — Luxury interactions
   Page transitions · Parallax · Scroll reveals */

(function () {
  'use strict';

  /* ── 1. SCROLL REVEAL (section wrappers) ─────────────────────── */
  (function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.documentElement.classList.contains('shopify-design-mode')) return;

    var style = document.createElement('style');
    style.textContent = `
      [data-sr] {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1),
                    transform 0.9s cubic-bezier(0.22,1,0.36,1);
        will-change: opacity, transform;
      }
      [data-sr].sr-visible {
        opacity: 1; transform: none;
      }
      [data-sr][data-sr-delay="1"] { transition-delay: 0.09s; }
      [data-sr][data-sr-delay="2"] { transition-delay: 0.18s; }
      [data-sr][data-sr-delay="3"] { transition-delay: 0.27s; }
    `;
    document.head.appendChild(style);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('sr-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

    // Observe section children that should reveal.
    // EXCLUDE the hero (.shm) and its descendants — the hero runs its own
    // scroll animation and must not be double-animated.
    document.querySelectorAll('.shopify-section').forEach(function (sec) {
      if (sec.querySelector('.shm') || sec.closest('.shm')) return;
      sec.querySelectorAll(
        'h1,h2,h3,.rich-text__heading,.banner__heading,.card-wrapper,.seym-attr,.price,.product__title'
      ).forEach(function (el, i) {
        if (el.closest('.shm')) return;
        el.setAttribute('data-sr', '');
        // Stagger only a short run of siblings so above-the-fold groups
        // reveal in a quick cascade rather than a long awkward wait.
        if (i > 0 && i < 4) el.setAttribute('data-sr-delay', String(i));
        observer.observe(el);
      });
    });
  })();


  /* ── 3. PRODUCT IMAGE PARALLAX (subtle, desktop only) ────────── */
  (function initParallax() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 989px)').matches) return;

    // Never parallax inside the hero — it owns its own motion.
    var imgs = Array.prototype.filter.call(
      document.querySelectorAll('.product__media-item img, .banner__media img'),
      function (img) { return !img.closest('.shm'); }
    );
    if (!imgs.length) return;

    // Give each image a touch of vertical overflow room so a small shift
    // never reveals a gap, then transform only by translate (no scale) to
    // keep it buttery and layout-cheap.
    imgs.forEach(function (img) {
      img.style.willChange = 'transform';
    });

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      imgs.forEach(function (img) {
        var rect = img.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return; // off-screen, skip
        var center = rect.top + rect.height / 2 - vh / 2;
        // ≤6% of viewport height of drift, clamped, no scale.
        var shift = Math.max(-vh * 0.06, Math.min(vh * 0.06, center * 0.05));
        img.style.transform = 'translate3d(0,' + shift.toFixed(2) + 'px,0)';
      });
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  })();


  /* ── 4. PAGE TRANSITION (refined on-load reveal from ivory) ──────
     No navigation-intercept fade: instant navigation feels more premium
     than a forced wait, and an ivory wash matches the brand. We keep only
     a fast (~300ms) reveal from ivory on first paint. The body fade-in is
     handled in CSS (.shopify-section page-in keyframe); this overlay just
     covers the very first frame in brand ivory, not off-brand navy. */
  (function initPageTransitions() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.documentElement.classList.contains('shopify-design-mode')) return;

    var overlay = document.createElement('div');
    overlay.id = 'seym-curtain';
    overlay.style.cssText =
      'position:fixed;inset:0;background:#F5F1EA;z-index:99998;' +
      'pointer-events:none;opacity:1;' +
      'transition:opacity 300ms cubic-bezier(0.22,1,0.36,1);';
    document.body.appendChild(overlay);

    // Fade the ivory wash out on load.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.style.opacity = '0';
      });
    });
    // Clean up so it can never block interaction.
    overlay.addEventListener('transitionend', function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });
  })();

})();
