(function () {
  var SUN  = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  var MOON = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  var btns = document.querySelectorAll('.theme-toggle');
  var html = document.documentElement;

  function updateBtns(theme) {
    var icon  = theme === 'dark' ? SUN : MOON;
    var label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    btns.forEach(function (btn) {
      btn.innerHTML = icon;
      btn.setAttribute('aria-label', label);
    });
  }

  updateBtns(html.getAttribute('data-theme') || 'dark');

  btns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      updateBtns(next);
    });
  });

  var mq = window.matchMedia('(prefers-color-scheme: light)');
  var mqHandler = function (e) {
    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch (ex) {}
    if (!stored) {
      var t = e.matches ? 'light' : 'dark';
      html.setAttribute('data-theme', t);
      updateBtns(t);
    }
  };
  if (mq.addEventListener) {
    mq.addEventListener('change', mqHandler);
  } else if (mq.addListener) {
    mq.addListener(mqHandler);
  }
})();
