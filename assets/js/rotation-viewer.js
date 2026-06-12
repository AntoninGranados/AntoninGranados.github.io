(function () {
  var viewer = document.getElementById('lucy-viewer');
  var video  = document.getElementById('lucy-rot-video');
  if (!viewer || !video) return;

  var dragging = false, lastX = 0, startX = 0, moved = false;

  video.addEventListener('loadedmetadata', function () {
    video.currentTime = video.duration / 2;
  });

  function seekByDelta(dx) {
    var sensitivity = video.duration / viewer.offsetWidth;
    video.currentTime = Math.max(0, Math.min(video.duration,
      video.currentTime + dx * sensitivity));
  }

  function onStart(x) {
    dragging = true; moved = false; startX = lastX = x;
    document.body.classList.add('rot-dragging');
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
  window.addEventListener('touchend', onEnd);
})();
