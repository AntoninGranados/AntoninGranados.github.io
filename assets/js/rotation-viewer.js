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
     opts: { axis, stride, fps, invX, invY, hint, onStart, onEnd }
       hint    — DOM element hidden when dragging begins
       onStart — called on pointerdown
       onEnd   — called on lostpointercapture with (moved: bool) */
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
    var capturedId = -1, lastX = 0, lastY = 0, startX = 0, startY = 0, moved = false;
    var rafId = null;

    wrap.style.touchAction = 'none';

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

    video.addEventListener('loadedmetadata', function () {
      if (axis === 'xy' && stride > 0) {
        var rows = Math.ceil(Math.round(video.duration * fps) / stride);
        sensY = rows > 1 ? 1 / ((rows - 1) * pxPerStep) : 1 / DEFAULT_FULL;
      }
      seek();
    });

    wrap.addEventListener('pointerdown', function (e) {
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
      var dx = (e.clientX - lastX) * invX;
      var dy = (e.clientY - lastY) * invY;
      lastX = e.clientX; lastY = e.clientY;
      if (!moved && (Math.abs(e.clientX - startX) > 4 || Math.abs(e.clientY - startY) > 4)) {
        moved = true;
        wrap.classList.add('interacted');
        if (hint) hint.style.opacity = '0';
      }
      if (!moved) return;
      if (axis !== 'y') posX = Math.max(0, Math.min(1, posX + dx * sensX));
      if (axis !== 'x') posY = Math.max(0, Math.min(1, posY + dy * sensY));
      if (!rafId) rafId = requestAnimationFrame(function () { rafId = null; seek(); });
    });

    wrap.addEventListener('lostpointercapture', function (e) {
      if (e.pointerId !== capturedId) return;
      capturedId = -1;
      if (onEnd) onEnd(moved);
    });
  }

  function initViewer(viewer) {
    var src    = viewer.dataset.src;
    var poster = viewer.dataset.poster || '';
    var axis   = (viewer.dataset.axis || 'x').toLowerCase();
    var stride = parseInt(viewer.dataset.frameStride, 10) || 0;
    var fps         = parseInt(viewer.dataset.fps,         10) || 24;
    var sensitivity = parseFloat(viewer.dataset.sensitivity)  || 1;
    var invert = viewer.dataset.invert || '';
    var invX   = invert.indexOf('x') !== -1 ? -1 : 1;
    var invY   = invert.indexOf('y') !== -1 ? -1 : 1;

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
          if (video.readyState === 0 && video.networkState !== 2) video.load();
        }
      }, { rootMargin: '300px' });
      io.observe(viewer);
    } else {
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
