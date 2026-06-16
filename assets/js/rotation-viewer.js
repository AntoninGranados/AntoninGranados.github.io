(function () {
  'use strict';

  var HINT_ICONS = {
    x:  '<svg width="24" height="16" viewBox="0 0 24 16" fill="none"><path d="M2 8H22M6 5L2 8L6 11M18 5L22 8L18 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    y:  '<svg width="16" height="24" viewBox="0 0 16 24" fill="none"><path d="M8 2V22M5 6L8 2L11 6M5 18L8 22L11 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    xy: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 7l3-4 3 4M9 17l3 4 3-4M7 9l-4 3 4 3M17 9l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  var HINT_LABELS = { x: 'Drag to rotate', y: 'Drag to rotate', xy: 'Drag to explore' };

  var PX_PER_STEP = 30;

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  /* ── Frame mapping ──────────────────────────────────────────────────────────
   * xy  : xStrips strips cover one full y-row. xCols = stripFrames × xStrips.
   *        row = yRow × xStrips + floor(xi / stripFrames),  col = xi % stripFrames
   * x   : linear across all strips — row = floor(i/cols), col = i % cols
   *        (allows splitting long x-axis sequences across multiple strips to
   *         stay within the WebP 16383px width limit)
   * y   : row = posY × (rows-1),  col = 0                                     */
  function computeFrame(axis, stripRows, stripFrames, posX, posY, xStrips) {
    xStrips = xStrips || 1;
    if (axis === 'xy') {
      var yRows = Math.round(stripRows / xStrips);
      var xCols = stripFrames * xStrips;
      var yr = Math.round(posY * (yRows - 1));
      yr = Math.max(0, Math.min(yRows - 1, yr));
      var xi = Math.round(posX * (xCols - 1));
      xi = Math.max(0, Math.min(xCols - 1, xi));
      return { row: yr * xStrips + Math.floor(xi / stripFrames), col: xi % stripFrames };
    }
    if (axis === 'y') {
      return { row: Math.round(posY * (stripRows - 1)), col: 0 };
    }
    /* axis === 'x' — possibly multi-strip */
    var total = stripRows * stripFrames;
    var i = Math.round(posX * (total - 1));
    i = Math.max(0, Math.min(total - 1, i));
    return { row: Math.floor(i / stripFrames), col: i % stripFrames };
  }

  /* Clamp to [0,1] or wrap to [0,1) depending on loop flag. */
  function clampOrWrap(v, doLoop) {
    if (doLoop) return ((v % 1) + 1) % 1;
    return Math.max(0, Math.min(1, v));
  }

  /* ── initViewer ─────────────────────────────────────────────────────────────
   * Initialises a canvas-based strip rotation viewer.
   * Requires data-strip-src (URL template with "{row}"), data-strip-rows,
   * data-strip-frames. Silently skips if data-strip-src is absent.
   *
   * Optional attributes:
   *   data-axis        "x" | "y" | "xy"  (default "x")
   *   data-invert      "x" | "y" | "xy"  — flip drag direction per axis
   *   data-sensitivity  number            — multiplier; higher = faster
   *   data-loop        "x" | "y" | "xy"  — wrap instead of clamp per axis
   *   data-x-strips     number            — strips per y-row for xy axis (default 1)
   *   data-aspect      "W/H"             — initial aspect ratio hint               */
  function initViewer(viewer) {
    var stripSrc    = viewer.dataset.stripSrc;
    var stripRows   = parseInt(viewer.dataset.stripRows,   10) || 1;
    var stripFrames = parseInt(viewer.dataset.stripFrames, 10) || 1;
    var xStrips     = parseInt(viewer.dataset.xStrips,     10) || 1;
    var axis        = (viewer.dataset.axis        || 'x').toLowerCase();
    var invert      = viewer.dataset.invert       || '';
    var invX        = invert.indexOf('x') !== -1 ? -1 : 1;
    var invY        = invert.indexOf('y') !== -1 ? -1 : 1;
    var sensitivity = parseFloat(viewer.dataset.sensitivity) || 1;
    var loop        = viewer.dataset.loop         || '';
    var loopX       = loop.indexOf('x') !== -1;
    var loopY       = loop.indexOf('y') !== -1;

    if (!stripSrc) return;

    /* Aspect ratio and flex weight — applied immediately from data-aspect,
       then updated from the actual strip dimensions once loaded.            */
    function setAspect(w, h) {
      viewer.style.setProperty('--rv-aspect', w + '/' + h);
      viewer.style.flex = w / h;
    }
    var initialAspect = viewer.dataset.aspect;
    if (initialAspect) {
      var parts = initialAspect.split('/');
      if (parts.length === 2) setAspect(parseFloat(parts[0]), parseFloat(parts[1]));
    }

    /* Canvas */
    var canvas = document.createElement('canvas');
    canvas.setAttribute('data-lightbox', 'rotation');
    canvas.setAttribute('aria-hidden', 'true');
    viewer.appendChild(canvas);

    /* Hint overlay */
    var hint = document.createElement('div');
    hint.className = 'rot-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = (HINT_ICONS[axis] || HINT_ICONS.x) +
                     '<span>' + (HINT_LABELS[axis] || HINT_LABELS.x) + '</span>';
    viewer.appendChild(hint);

    /* ── Strip cache ─────────────────────────────────────────────────────── */
    var strips  = {};
    var pending = {};

    function loadStrip(row, cb) {
      if (strips[row])  { if (cb) cb(strips[row]); return; }
      if (pending[row]) { if (cb) pending[row].push(cb); return; }
      pending[row] = cb ? [cb] : [];
      var img = new Image();
      img.onload = function () {
        strips[row] = img;
        var cbs = pending[row] || [];
        delete pending[row];
        for (var i = 0; i < cbs.length; i++) cbs[i](img);
      };
      img.onerror = function () { delete pending[row]; };
      img.src = stripSrc.replace('{row}', pad2(row));
    }

    /* ── Position state ──────────────────────────────────────────────────── */
    var posX = 0.5, posY = 0.5;

    /* ── Canvas rendering ────────────────────────────────────────────────── */
    var ctx = canvas.getContext('2d');

    function drawAt(px, py) {
      if (!canvas.width || !canvas.height) return false;
      var f     = computeFrame(axis, stripRows, stripFrames, px, py, xStrips);
      var strip = strips[f.row];
      if (!strip) return false;
      var fw = strip.naturalWidth / stripFrames;
      var fh = strip.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(strip, f.col * fw, 0, fw, fh, 0, 0, canvas.width, canvas.height);
      return true;
    }

    /* ── Canvas sizing ───────────────────────────────────────────────────── */
    function resizeAndDraw() {
      var rect = viewer.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var dpr = window.devicePixelRatio || 1;
      canvas.width  = Math.round(rect.width  * dpr);
      canvas.height = Math.round(rect.height * dpr);
      drawAt(posX, posY);
    }

    var resizeRaf = null;
    function scheduleResize() {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(function () { resizeRaf = null; resizeAndDraw(); });
    }
    window.addEventListener('resize', scheduleResize, { passive: true });

    /* ── Loading ─────────────────────────────────────────────────────────── */
    function startLoading() {
      var f   = computeFrame(axis, stripRows, stripFrames, posX, posY, xStrips);
      var mid = f.row;
      loadStrip(mid, function (strip) {
        var fw = strip.naturalWidth / stripFrames;
        var fh = strip.naturalHeight;
        setAspect(fw, fh);
        resizeAndDraw();
      });
      for (var r = 0; r < stripRows; r++) {
        if (r !== mid) loadStrip(r);
      }
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); startLoading(); }
      }, { rootMargin: '300px' });
      io.observe(viewer);
    } else {
      startLoading();
    }

    /* ── Drag ────────────────────────────────────────────────────────────── */
    var xCols   = axis === 'xy' ? stripFrames * xStrips : (axis === 'x' ? stripRows * stripFrames : stripFrames);
    var yRows   = axis === 'y' ? stripRows : (axis === 'xy' ? Math.round(stripRows / xStrips) : 1);
    var pxStep  = PX_PER_STEP / sensitivity;
    var sensX   = (axis !== 'y' && xCols > 1) ? 1 / ((loopX ? xCols : xCols - 1) * pxStep) : 1 / 300;
    var sensY   = (axis !== 'x' && yRows > 1) ? 1 / ((loopY ? yRows : yRows - 1) * pxStep) : 1 / 300;

    var capturedId = -1, startX = 0, startY = 0, lastX = 0, lastY = 0, moved = false;
    viewer.style.touchAction = 'none';

    viewer.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      try { viewer.setPointerCapture(e.pointerId); } catch (ex) {}
      e.preventDefault();
      capturedId = e.pointerId;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      moved = false;
    });

    viewer.addEventListener('pointermove', function (e) {
      if (e.pointerId !== capturedId) return;
      var dx = (e.clientX - lastX) * invX;
      var dy = (e.clientY - lastY) * invY;
      lastX = e.clientX; lastY = e.clientY;

      if (!moved && (Math.abs(e.clientX - startX) > 4 || Math.abs(e.clientY - startY) > 4)) {
        moved = true;
        viewer.classList.add('interacted');
        hint.style.opacity = '0';
      }
      if (!moved) return;

      if (axis !== 'y') posX = clampOrWrap(posX + dx * sensX, loopX);
      if (axis !== 'x') posY = clampOrWrap(posY + dy * sensY, loopY);

      if (!drawAt(posX, posY)) {
        var f = computeFrame(axis, stripRows, stripFrames, posX, posY, xStrips);
        loadStrip(f.row, function () { drawAt(posX, posY); });
      }
    });

    viewer.addEventListener('lostpointercapture', function (e) {
      if (e.pointerId !== capturedId) return;
      capturedId = -1;
      if (!moved) canvas.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    /* ── API exposed for lightbox ─────────────────────────────────────────── */
    viewer._rvApi = {
      strips:      strips,
      loadStrip:   loadStrip,
      stripRows:   stripRows,
      stripFrames: stripFrames,
      xStrips:     xStrips,
      axis:        axis,
      invX:        invX,
      invY:        invY,
      sensX:       sensX,
      sensY:       sensY,
      loopX:       loopX,
      loopY:       loopY,
      getPos:      function () { return { posX: posX, posY: posY }; },
      computeFrame: function (px, py) { return computeFrame(axis, stripRows, stripFrames, px, py, xStrips); }
    };
  }

  /* ── initLightbox ───────────────────────────────────────────────────────────
   * Creates a canvas inside `container` sharing the strip cache from the
   * inline viewer (`rv`). The container is typically not yet in the DOM when
   * this is called, so the first draw is deferred via ResizeObserver / rAF.  */
  function initLightbox(container, rv, hintEl, opts) {
    if (!rv || !rv._rvApi) return null;
    var api = rv._rvApi;

    var start = api.getPos();
    var px = start.posX, py = start.posY;
    var active = true;

    /* Size container to source aspect ratio */
    var anySrc = api.strips[Object.keys(api.strips)[0]];
    if (anySrc) {
      var fw0 = anySrc.naturalWidth / api.stripFrames;
      var fh0 = anySrc.naturalHeight;
      container.style.aspectRatio = fw0 + '/' + fh0;
    }
    container.style.position = 'relative';

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    container.appendChild(canvas);
    if (hintEl) container.appendChild(hintEl);

    var lbCtx = canvas.getContext('2d');

    function drawAt(lpx, lpy) {
      if (!canvas.width || !canvas.height || !active) return false;
      var f     = api.computeFrame(lpx, lpy);
      var strip = api.strips[f.row];
      if (!strip) return false;
      var fw = strip.naturalWidth / api.stripFrames;
      var fh = strip.naturalHeight;
      lbCtx.clearRect(0, 0, canvas.width, canvas.height);
      lbCtx.drawImage(strip, f.col * fw, 0, fw, fh, 0, 0, canvas.width, canvas.height);
      return true;
    }

    function resize() {
      if (!active) return;
      var rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var dpr = window.devicePixelRatio || 1;
      canvas.width  = Math.round(rect.width  * dpr);
      canvas.height = Math.round(rect.height * dpr);
      drawAt(px, py);
    }

    /* First draw deferred — container is not yet in the DOM when initLightbox
       is called. ResizeObserver fires as soon as the container is sized.     */
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function () { ro.disconnect(); resize(); });
      ro.observe(container);
    } else {
      requestAnimationFrame(resize);
    }

    var resizeRaf = null;
    function scheduleResize() {
      if (!active || resizeRaf) return;
      resizeRaf = requestAnimationFrame(function () { resizeRaf = null; resize(); });
    }
    window.addEventListener('resize', scheduleResize, { passive: true });

    /* ── Drag ─────────────────────────────────────────────────────────────── */
    var capturedId = -1, startX = 0, startY = 0, lastX = 0, lastY = 0, moved = false;
    container.style.touchAction = 'none';

    function onDown(e) {
      if (!active) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      try { container.setPointerCapture(e.pointerId); } catch (ex) {}
      e.preventDefault();
      capturedId = e.pointerId;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      moved = false;
      if (opts && opts.onStart) opts.onStart();
    }

    function onMove(e) {
      if (!active || e.pointerId !== capturedId) return;
      var dx = (e.clientX - lastX) * api.invX;
      var dy = (e.clientY - lastY) * api.invY;
      lastX = e.clientX; lastY = e.clientY;

      if (!moved && (Math.abs(e.clientX - startX) > 4 || Math.abs(e.clientY - startY) > 4)) {
        moved = true;
        if (hintEl) hintEl.style.opacity = '0';
      }
      if (!moved) return;

      if (api.axis !== 'y') px = clampOrWrap(px + dx * api.sensX, api.loopX);
      if (api.axis !== 'x') py = clampOrWrap(py + dy * api.sensY, api.loopY);

      if (!drawAt(px, py)) {
        var f = api.computeFrame(px, py);
        api.loadStrip(f.row, function () { if (active) drawAt(px, py); });
      }
    }

    function onUp(e) {
      if (!active || e.pointerId !== capturedId) return;
      capturedId = -1;
      if (opts && opts.onEnd) opts.onEnd(moved);
    }

    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('lostpointercapture', onUp);

    return {
      destroy: function () {
        active = false;
        if (resizeRaf) { cancelAnimationFrame(resizeRaf); resizeRaf = null; }
        window.removeEventListener('resize', scheduleResize);
        container.removeEventListener('pointerdown', onDown);
        container.removeEventListener('pointermove', onMove);
        container.removeEventListener('lostpointercapture', onUp);
      }
    };
  }

  document.querySelectorAll('.rotation-viewer').forEach(initViewer);

  window.RotationViewer = { HINT_ICONS: HINT_ICONS, HINT_LABELS: HINT_LABELS, initLightbox: initLightbox };
})();
