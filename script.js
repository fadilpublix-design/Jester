/* script.js - responsive placement for {x} and hamburger */

(function () {
  'use strict';

  // selectors
  const SVG_ID = 'svg-root';
  const PATH_BOTTOM_ID = 'curve-bottom';
  const ON_SEL = '.on';
  const AFTER_SEL = '.after';
  const IMG_ID = 'x-img';

  // tunables
  const SAMPLES = 300;
  const PADDING = 8;
  const FINE_TUNE_Y = -6; // adjust vertical visual center

  // place + rotate function
  function placeXIcon() {
    const svg = document.getElementById(SVG_ID);
    if (!svg) return;
    const path = svg.querySelector('#' + PATH_BOTTOM_ID);
    const onT = svg.querySelector(ON_SEL);
    const afterT = svg.querySelector(AFTER_SEL);
    const img = svg.querySelector('#' + IMG_ID);
    if (!path || !onT || !afterT || !img) return;

    try {
      // measure
      let onBox = onT.getBBox();
      let afterBox = afterT.getBBox();
      // computed text length if available gives better result
      let onWidth = (typeof onT.getComputedTextLength === 'function') ? onT.getComputedTextLength() : onBox.width;
      const onEndX = onBox.x + onWidth + PADDING;
      const afterStartX = afterBox.x - PADDING;
      const centerX = (onEndX + afterStartX) / 2;

      // find closest point on path to centerX by sampling
      const total = path.getTotalLength();
      let best = { d: Infinity, t: 0, pt: path.getPointAtLength(0) };
      for (let i = 0; i <= SAMPLES; i++) {
        const t = (i / SAMPLES) * total;
        const pt = path.getPointAtLength(t);
        const d = Math.abs(pt.x - centerX);
        if (d < best.d) best = { d, t, pt };
      }

      const target = best.pt;
      // tangent for rotation
      const delta = Math.max(0.5, total / SAMPLES);
      const p1 = path.getPointAtLength(Math.max(0, best.t - delta));
      const p2 = path.getPointAtLength(Math.min(total, best.t + delta));
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      // image size (from attributes)
      let imgW = Number(img.getAttribute('width')) || 90;
      let imgH = Number(img.getAttribute('height')) || 90;

      // try to scale down if it doesn't fit gap
      const gap = Math.max(6, afterStartX - onEndX);
      if (imgW > gap) {
        const s = Math.max(0.28, (gap - 4) / imgW);
        imgW = Math.max(8, Math.round(imgW * s));
        imgH = Math.max(8, Math.round(imgH * s));
        img.setAttribute('width', imgW);
        img.setAttribute('height', imgH);
      }

      // compute position (centered on target), allow fine-tune Y
      let x = target.x - imgW / 2;
      const y = target.y - imgH / 2 + FINE_TUNE_Y;

      // clamp to gap edges
      const leftLimit = onEndX + 2;
      const rightLimit = afterStartX - 2 - imgW;
      if (x < leftLimit) x = leftLimit;
      if (x > rightLimit) x = rightLimit;

      // set attributes (SVG user-space coords)
      img.setAttribute('x', x);
      img.setAttribute('y', y);
      // rotate around center of image
      img.setAttribute('transform', `rotate(${angle}, ${x + imgW/2}, ${y + imgH/2})`);
    } catch (err) {
      // if measurement fails, skip silently
      console.warn('placeXIcon error', err);
    }
  }

  // keep header CSS variable updated
  function updateHeaderHeight() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    const h = Math.ceil(nav.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--header-h', h + 'px');
  }

  // run placement sequence (multiple passes stabilize on mobile)
  function runPlacement() {
    placeXIcon();
    setTimeout(placeXIcon, 120);
    setTimeout(placeXIcon, 300);
    updateHeaderHeight();
  }

  // DOM ready
  window.addEventListener('load', () => { runPlacement(); });
  window.addEventListener('resize', () => { clearTimeout(window._pxT); window._pxT = setTimeout(runPlacement, 140); });
  window.addEventListener('orientationchange', () => setTimeout(runPlacement, 180));

  // hamburger behavior
  (function () {
    const btn = document.getElementById('menu-toggle');
    const mobile = document.getElementById('mobile-menu');
    if (!btn || !mobile) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = btn.classList.toggle('active');
      if (open) {
        mobile.classList.add('show');
        mobile.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
        mobile.setAttribute('aria-hidden', 'false');
      } else {
        mobile.classList.remove('show');
        mobile.style.display = 'none';
        btn.setAttribute('aria-expanded', 'false');
        mobile.setAttribute('aria-hidden', 'true');
      }
    });
    // close when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobile.contains(e.target) && !btn.contains(e.target)) {
        btn.classList.remove('active');
        mobile.classList.remove('show');
        mobile.style.display = 'none';
        btn.setAttribute('aria-expanded', 'false');
        mobile.setAttribute('aria-hidden', 'true');
      }
    });
  })();

})();
