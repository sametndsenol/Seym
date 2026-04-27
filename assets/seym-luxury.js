/* SEYM — Luxury interactions
   Page transitions · Parallax · Scroll reveals */

(function () {
  'use strict';

  /* ── 1. SCROLL REVEAL (section wrappers) ─────────────────────── */
  (function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var style = document.createElement('style');
    style.textContent = `
      [data-sr] {
        opacity: 0;
        transform: translateY(28px);
        transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1),
                    transform 0.9s cubic-bezier(0.22,1,0.36,1);
      }
      [data-sr].sr-visible {
        opacity: 1; transform: none;
      }
      [data-sr][data-sr-delay="1"] { transition-delay: 0.1s; }
      [data-sr][data-sr-delay="2"] { transition-delay: 0.2s; }
      [data-sr][data-sr-delay="3"] { transition-delay: 0.32s; }
    `;
    document.head.appendChild(style);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('sr-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });

    // Observe section children that should reveal
    document.querySelectorAll('.shopify-section').forEach(function (sec) {
      sec.querySelectorAll(
        'h1,h2,h3,.rich-text__heading,.banner__heading,.card-wrapper,.seym-attr,.price,.product__title'
      ).forEach(function (el, i) {
        el.setAttribute('data-sr', '');
        if (i > 0 && i < 4) el.setAttribute('data-sr-delay', String(i));
        observer.observe(el);
      });
    });
  })();


  /* ── 3. PRODUCT IMAGE PARALLAX (subtle, desktop only) ────────── */
  (function initParallax() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var imgs = document.querySelectorAll('.product__media-item img, .banner__media img');
    if (!imgs.length) return;

    function onScroll() {
      imgs.forEach(function (img) {
        var rect = img.getBoundingClientRect();
        var center = rect.top + rect.height / 2 - window.innerHeight / 2;
        var shift = center * 0.04;
        img.style.transform = 'translate3d(0,' + shift + 'px,0) scale(1.06)';
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();


  /* ── 4. SMOOTH PAGE TRANSITIONS ──────────────────────────────── */
  (function initPageTransitions() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var overlay = document.createElement('div');
    overlay.id = 'seym-curtain';
    var s = overlay.style;
    s.cssText =
      'position:fixed;inset:0;background:#0a1424;z-index:99998;' +
      'pointer-events:none;opacity:0;' +
      'transition:opacity 350ms cubic-bezier(0.22,1,0.36,1);';
    document.body.appendChild(overlay);

    // Fade out on load (come from black)
    overlay.style.opacity = '1';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.style.opacity = '0';
      });
    });

    // Fade to black on navigation
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
          href.startsWith('tel:') || a.getAttribute('target') === '_blank') return;
      if (a.origin && a.origin !== location.origin) return;

      e.preventDefault();
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'all';
      setTimeout(function () {
        window.location.href = href;
      }, 360);
    });
  })();

})();
