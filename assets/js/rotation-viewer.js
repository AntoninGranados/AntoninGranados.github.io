(function () {
  var viewer = document.getElementById('lucy-viewer');
  var video  = document.getElementById('lucy-rot-video');
  if (!viewer || !video) return;

  var dragging = false, lastX = 0, startX = 0, moved = false;
  var pendingDelta = 0;

  function isReady() {
    return video.readyState >= 1 && video.duration > 0;
  }

  function ensureLoad() {
    /* Start (or restart) loading if the video isn't fetching already */
    if (video.readyState === 0 && video.networkState !== 2) video.load();
  }

  /* Seek to middle when metadata arrives; absorb any drag delta that
     accumulated while the video was still loading. */
  video.addEventListener('loadedmetadata', function () {
    var w = Math.max(1, viewer.offsetWidth);
    var target = video.duration / 2 + pendingDelta * (video.duration / w);
    video.currentTime = Math.max(0, Math.min(video.duration, target));
    pendingDelta = 0;
  });

  /* Pre-fetch when the widget approaches the viewport */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); ensureLoad(); }
    }, { rootMargin: '300px' });
    io.observe(viewer);
  } else {
    ensureLoad();
  }

  function seekByDelta(dx) {
    if (!isReady()) {
      pendingDelta += dx;
      ensureLoad(); /* recover if iOS killed the previous load */
      return;
    }
    var sensitivity = video.duration / Math.max(1, viewer.offsetWidth);
    video.currentTime = Math.max(0, Math.min(video.duration,
      video.currentTime + dx * sensitivity));
  }

  function onStart(x) {
    dragging = true; moved = false; startX = lastX = x;
    document.body.classList.add('rot-dragging');
    ensureLoad(); /* kick off load on first touch if not already loading */
  }
  function onMove(x) {
    if (!dragging) return;
    if (Math.abs(x - startX) > 4) moved = true;
    seekByDelta(x - lastX);
    lastX = x;
  }
  function onEnd() {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('rot-dragging');
    if (!moved) {
      video.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    } else {
      viewer.classList.add('interacted');
    }
  }

  viewer.addEventListener('mousedown', function (e) { e.preventDefault(); onStart(e.clientX); });
  window.addEventListener('mousemove', function (e) { onMove(e.clientX); });
  window.addEventListener('mouseup', onEnd);

  viewer.addEventListener('touchstart', function (e) { e.preventDefault(); onStart(e.touches[0].clientX); }, { passive: false });
  window.addEventListener('touchmove',  function (e) { if (dragging) { e.preventDefault(); onMove(e.touches[0].clientX); } }, { passive: false });
  window.addEventListener('touchend',   onEnd);
  window.addEventListener('touchcancel', onEnd); /* system interrupts (notifications, home gesture) */
})();
