(function () {
  'use strict';

  var MIN_GAP = 4;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function initSlider(el) {
    var imgs = el.querySelectorAll(':scope > img');
    if (imgs.length < 3) return;
    var mid = imgs[1], top = imgs[2];

    var handles = el.querySelectorAll('.compare-slider-handle');
    if (handles.length < 2) return;

    var labels = el.querySelectorAll('.compare-slider-label');

    var draggedRecently = false;
    el.addEventListener('click', function (e) {
      if (draggedRecently) {
        e.stopImmediatePropagation();
        draggedRecently = false;
      }
    });

    var p1 = clamp(parseFloat(el.dataset.p1) || 33.3, 0, 100);
    var p2 = clamp(parseFloat(el.dataset.p2) || 66.6, 0, 100);
    if (p2 - p1 < MIN_GAP) p2 = p1 + MIN_GAP;

    function render() {
      mid.style.clipPath = 'inset(0 0 0 ' + p1 + '%)';
      top.style.clipPath = 'inset(0 0 0 ' + p2 + '%)';
      handles[0].style.left = p1 + '%';
      handles[1].style.left = p2 + '%';
      handles[0].setAttribute('aria-valuenow', Math.round(p1));
      handles[1].setAttribute('aria-valuenow', Math.round(p2));

      if (labels.length >= 3) {
        var centers = [p1 / 2, (p1 + p2) / 2, (p2 + 100) / 2];
        var widths = [p1, p2 - p1, 100 - p2];
        for (var i = 0; i < 3; i++) {
          labels[i].style.left = centers[i] + '%';
          labels[i].style.opacity = widths[i] < 14 ? '0' : '1';
        }
      }
    }

    function percentFromEvent(e) {
      var rect = el.getBoundingClientRect();
      return clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    }

    function bindHandle(handle, idx) {
      var active = false;
      handle.addEventListener('pointerdown', function (e) {
        active = true;
        handle.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      handle.addEventListener('pointermove', function (e) {
        if (!active) return;
        draggedRecently = true;
        var v = percentFromEvent(e);
        if (idx === 0) p1 = clamp(v, 0, p2 - MIN_GAP);
        else p2 = clamp(v, p1 + MIN_GAP, 100);
        render();
      });
      function release() { active = false; }
      handle.addEventListener('pointerup', release);
      handle.addEventListener('pointercancel', release);
      handle.addEventListener('lostpointercapture', release);

      handle.addEventListener('keydown', function (e) {
        var step = e.shiftKey ? 5 : 1;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          if (idx === 0) p1 = clamp(p1 - step, 0, p2 - MIN_GAP);
          else p2 = clamp(p2 - step, p1 + MIN_GAP, 100);
          render(); e.preventDefault();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          if (idx === 0) p1 = clamp(p1 + step, 0, p2 - MIN_GAP);
          else p2 = clamp(p2 + step, p1 + MIN_GAP, 100);
          render(); e.preventDefault();
        }
      });
    }

    bindHandle(handles[0], 0);
    bindHandle(handles[1], 1);

    render();
  }

  document.querySelectorAll('.compare-slider').forEach(initSlider);
})();
