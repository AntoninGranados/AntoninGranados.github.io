(function () {
  'use strict';

  var HINT = {
    x:  { icon: '<svg width="40" height="16" viewBox="0 0 40 16" fill="none"><path d="M4 8H36M4 8L9 3M4 8L9 13M36 8L31 3M36 8L31 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>', label: 'Drag to rotate' },
    y:  { icon: '<svg width="16" height="40" viewBox="0 0 16 40" fill="none"><path d="M8 4V36M8 4L3 9M8 4L13 9M8 36L3 31M8 36L13 31" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>', label: 'Drag to rotate' },
    xy: { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 7l3-4 3 4M9 17l3 4 3-4M7 9l-4 3 4 3M17 9l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>', label: 'Drag to explore' }
  };

  var PX_PER_STEP  = 30;
  var DEFAULT_FULL = 300;

  function initViewer(viewer) {
    var src    = viewer.dataset.src;
    var poster = viewer.dataset.poster || '';
    var axis   = (viewer.dataset.axis || 'x').toLowerCase();
    var stride = parseInt(viewer.dataset.frameStride, 10) || 0;
    var fps    = parseInt(viewer.dataset.fps,         10) || 24;
    var invert = viewer.dataset.invert || '';
    var invX   = invert.indexOf('x') !== -1 ? -1 : 1;
    var invY   = invert.indexOf('y') !== -1 ? -1 : 1;

    if (!src) return;

    var sensX = (axis === 'xy' && stride > 1) ? 1 / ((stride - 1) * PX_PER_STEP) : 1 / DEFAULT_FULL;
    var sensY = 1 / DEFAULT_FULL;

    /* ── DOM ── */
    var video = document.createElement('video');
    video.src = src;
    if (poster) video.poster = poster;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'none';
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('data-lightbox', 'rotation');
    viewer.appendChild(video);

    var hData = HINT[axis] || HINT.x;
    var hint = document.createElement('div');
    hint.className = 'rot-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = hData.icon + '<span>' + hData.label + '</span>';
    viewer.appendChild(hint);

    /* ── State ── */
    var posX = 0.5, posY = 0.5;
    var capturedId = -1;
    var lastX = 0, lastY = 0;
    var startX = 0, startY = 0;
    var moved = false;

    function ensureLoad() {
      if (video.readyState === 0 && video.networkState !== 2) video.load();
    }

    function seek() {
      var d = video.duration;
      if (!d || isNaN(d)) return;
      if (axis === 'y') {
        video.currentTime = Math.max(0, Math.min(d, posY * d));
      } else if (axis === 'xy' && stride > 0) {
        var frames = Math.round(d * fps);
        var rows   = Math.ceil(frames / stride);
        var col    = Math.round(posX * (stride - 1));
        var row    = Math.round(posY * (rows   - 1));
        video.currentTime = Math.max(0, Math.min(d, (row * stride + col + 0.5) * d / frames));
      } else {
        video.currentTime = Math.max(0, Math.min(d, posX * d));
      }
    }

    function applyDelta(dx, dy) {
      dx *= invX; dy *= invY;
      /* Always update position — posX/posY hold the desired state even before load */
      if (axis !== 'y') posX = Math.max(0, Math.min(1, posX + dx * sensX));
      if (axis !== 'x') posY = Math.max(0, Math.min(1, posY + dy * sensY));
      var d = video.duration;
      if (!d || isNaN(d)) { ensureLoad(); return; }
      seek();
    }

    video.addEventListener('loadedmetadata', function () {
      if (axis === 'xy' && stride > 0) {
        var rows = Math.ceil(Math.round(video.duration * fps) / stride);
        sensY = rows > 1 ? 1 / ((rows - 1) * PX_PER_STEP) : 1 / DEFAULT_FULL;
      }
      /* Seek to wherever posX/posY already are (updated during any pre-load drag) */
      seek();
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); ensureLoad(); }
      }, { rootMargin: '300px' });
      io.observe(viewer);
    } else {
      ensureLoad();
    }

    /* ── Pointer events ──────────────────────────────────────────────────
       setPointerCapture routes all move/end events here — no window listeners.
       lostpointercapture fires for pointerup, pointercancel, and explicit
       releasePointerCapture — it is the single authoritative cleanup event.

       pointerdown always starts a new drag, overwriting any stale capturedId.
       If the old pointer's lostpointercapture fires later, the pointerId guard
       rejects it harmlessly.

       No e.buttons safety valve: on macOS trackpads, buttons can transiently
       report 0 mid-drag and would spuriously kill an active gesture. With
       pointer capture, pointerup is reliably delivered even outside the window,
       so the valve is not needed. */

    viewer.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      viewer.setPointerCapture(e.pointerId);
      capturedId = e.pointerId;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      moved = false;
      ensureLoad();
    });

    viewer.addEventListener('pointermove', function (e) {
      if (e.pointerId !== capturedId) return;
      var dx = e.clientX - lastX;
      var dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (!moved && (Math.abs(e.clientX - startX) > 4 || Math.abs(e.clientY - startY) > 4)) {
        moved = true;
        viewer.classList.add('interacted');
      }
      if (moved) applyDelta(dx, dy);
    });

    /* Covers pointerup + pointercancel + any explicit releasePointerCapture */
    viewer.addEventListener('lostpointercapture', function (e) {
      if (e.pointerId !== capturedId) return;
      capturedId = -1;
      if (!moved) {
        video.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
  }

  document.querySelectorAll('.rotation-viewer').forEach(initViewer);
})();
