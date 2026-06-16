(function () {
  'use strict';

  var HINT_ICONS = {
    x:  '<svg width="24" height="16" viewBox="0 0 24 16" fill="none"><path d="M2 8H22M6 5L2 8L6 11M18 5L22 8L18 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    y:  '<svg width="16" height="24" viewBox="0 0 16 24" fill="none"><path d="M8 2V22M5 6L8 2L11 6M5 18L8 22L11 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    xy: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 7l3-4 3 4M9 17l3 4 3-4M7 9l-4 3 4 3M17 9l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  var HINT_LABELS = { x: 'Drag to rotate', y: 'Drag to rotate', xy: 'Drag to explore' };

  var PX_PER_STEP  = 30;
  var DEFAULT_FULL = 300;

  /* ── Shared drag + seek logic ────────────────────────────────────────────
     Used by both inline viewers (initViewer) and the lightbox.
     opts: { axis, stride, fps, invX, invY, sensitivity, hint, onStart, onEnd } */
  function initDrag(wrap, video, opts) {
    var axis        = (opts.axis || 'x').toLowerCase();
    var stride      = opts.stride      || 0;
    var fps         = opts.fps         || 24;
    var invX        = opts.invX  !== undefined ? opts.invX  : 1;
    var invY        = opts.invY  !== undefined ? opts.invY  : 1;
    var sensitivity = opts.sensitivity || 1;
    var hint    = opts.hint    || null;
    var onStart = opts.onStart || null;
    var onEnd   = opts.onEnd   || null;

    var pxPerStep = PX_PER_STEP / sensitivity;
    var posX = 0.5, posY = 0.5;
    var sensX = (axis === 'xy' && stride > 1) ? 1 / ((stride - 1) * pxPerStep) : 1 / DEFAULT_FULL;
    var sensY = 1 / DEFAULT_FULL;

    /* ── Seek engine ─────────────────────────────────────────────────────
       One seek in-flight at a time. If seeked fires late (> 800 ms), the
       video element is reloaded and the last position is re-applied.       */
    var rafId       = null;
    var seekPending = false;
    var watchdog    = null;

    function computeTime() {
      var d = video.duration;
      if (!d || isNaN(d)) return -1;
      if (axis === 'y') {
        return Math.max(0, Math.min(d, posY * d));
      } else if (axis === 'xy' && stride > 0) {
        var frames = Math.round(d * fps);
        var rows   = Math.ceil(frames / stride);
        var col    = Math.round(posX * (stride - 1));
        var row    = Math.round(posY * (rows   - 1));
        return Math.max(0, Math.min(d, (row * stride + col + 0.5) * d / frames));
      } else {
        return Math.max(0, Math.min(d, posX * d));
      }
    }

    function dispatch(t) {
      seekPending = false;
      clearTimeout(watchdog);
      video.currentTime = t;
      /* Watchdog: only recover if the target is already in the buffered range.
         During initial network download, seeks to unbuffered segments are
         expected to be slow — firing here would cause an infinite reload loop
         on a slow connection. Only reload when the data is local but the
         browser's seeking state is genuinely stuck.                          */
      watchdog = setTimeout(function () {
        if (!video.seeking) return;
        var inBuffer = false;
        try {
          for (var i = 0; i < video.buffered.length; i++) {
            if (video.buffered.start(i) <= t + 0.1 && t - 0.1 <= video.buffered.end(i)) {
              inBuffer = true; break;
            }
          }
        } catch (e) {}
        if (!inBuffer) return; // still downloading — slow but not stuck
        seekPending = false;
        video.load(); /* initDrag's loadedmetadata handler re-seeks to current pos */
      }, 800);
    }

    function seekNow() {
      var t = computeTime();
      if (t < 0) return;
      if (video.seeking) { seekPending = true; return; }
      dispatch(t);
    }

    video.addEventListener('seeked', function () {
      clearTimeout(watchdog);
      if (!seekPending) return;
      var t = computeTime();
      if (t >= 0) dispatch(t);
      else seekPending = false;
    });

    function schedSeek() {
      if (!rafId) rafId = requestAnimationFrame(function () { rafId = null; seekNow(); });
    }

    video.addEventListener('loadedmetadata', function () {
      if (axis === 'xy' && stride > 0) {
        var rows = Math.ceil(Math.round(video.duration * fps) / stride);
        sensY = rows > 1 ? 1 / ((rows - 1) * pxPerStep) : 1 / DEFAULT_FULL;
      }
      seekNow();
    });

    /* ── Drag state ──────────────────────────────────────────────────── */
    var capturedId = -1;
    var startX = 0, startY = 0, lastX = 0, lastY = 0;
    var moved  = false;

    wrap.style.touchAction = 'none';

    function checkMoved(cx, cy) {
      if (moved) return;
      if (Math.abs(cx - startX) > 4 || Math.abs(cy - startY) > 4) {
        moved = true;
        wrap.classList.add('interacted');
        if (hint) hint.style.opacity = '0';
      }
    }

    function applyDelta(dx, dy) {
      if (axis !== 'y') posX = Math.max(0, Math.min(1, posX + dx * sensX));
      if (axis !== 'x') posY = Math.max(0, Math.min(1, posY + dy * sensY));
    }

    /* ── Pointer events ──────────────────────────────────────────────────
       setPointerCapture routes all subsequent pointer events to wrap even
       when the pointer leaves the element. lostpointercapture fires on
       pointerup OR pointercancel, so both release paths are covered.
       touch-action:none (set above) prevents scroll-detection from
       firing pointercancel during a drag.                                */
    wrap.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      wrap.setPointerCapture(e.pointerId);
      e.preventDefault();
      capturedId = e.pointerId;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      moved = false;
      if (video.readyState === 0 && video.networkState !== 2) video.load();
      if (onStart) onStart();
    });

    wrap.addEventListener('pointermove', function (e) {
      if (e.pointerId !== capturedId) return;
      /* Do NOT call e.preventDefault() here — touch-action:none handles
         scroll prevention without triggering pointercancel on Safari.   */
      var dx = (e.clientX - lastX) * invX;
      var dy = (e.clientY - lastY) * invY;
      lastX = e.clientX; lastY = e.clientY;
      checkMoved(e.clientX, e.clientY);
      if (!moved) return;
      applyDelta(dx, dy);
      schedSeek();
    });

    wrap.addEventListener('lostpointercapture', function (e) {
      if (e.pointerId !== capturedId) return;
      capturedId = -1;
      if (onEnd) onEnd(moved);
    });
  }

  function initViewer(viewer) {
    var src         = viewer.dataset.src;
    var poster      = viewer.dataset.poster || '';
    var axis        = (viewer.dataset.axis || 'x').toLowerCase();
    var stride      = parseInt(viewer.dataset.frameStride, 10) || 0;
    var fps         = parseInt(viewer.dataset.fps,         10) || 24;
    var sensitivity = parseFloat(viewer.dataset.sensitivity)  || 1;
    var invert      = viewer.dataset.invert || '';
    var invX        = invert.indexOf('x') !== -1 ? -1 : 1;
    var invY        = invert.indexOf('y') !== -1 ? -1 : 1;

    if (!src) return;

    var video = document.createElement('video');
    video.src = src;
    if (poster) video.poster = poster;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'none';
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('data-lightbox', 'rotation');
    viewer.appendChild(video);

    var hint = document.createElement('div');
    hint.className = 'rot-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = (HINT_ICONS[axis] || HINT_ICONS.x) + '<span>' + (HINT_LABELS[axis] || HINT_LABELS.x) + '</span>';
    viewer.appendChild(hint);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          io.disconnect();
          /* preload=auto encourages the browser to buffer the full file so
             all seeks are served from memory and cannot get stuck.        */
          video.preload = 'auto';
          if (video.readyState === 0 && video.networkState !== 2) video.load();
        }
      }, { rootMargin: '300px' });
      io.observe(viewer);
    } else {
      video.preload = 'auto';
      if (video.readyState === 0 && video.networkState !== 2) video.load();
    }

    initDrag(viewer, video, {
      axis: axis, stride: stride, fps: fps, invX: invX, invY: invY, sensitivity: sensitivity,
      hint: hint,
      onEnd: function (moved) {
        if (!moved) video.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
  }

  document.querySelectorAll('.rotation-viewer').forEach(initViewer);

  window.RotationViewer = { initDrag: initDrag, HINT_ICONS: HINT_ICONS, HINT_LABELS: HINT_LABELS };
})();
