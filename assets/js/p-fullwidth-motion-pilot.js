(function () {
  'use strict';

  var panels = document.querySelectorAll('.paragraph--type-p-fullwidth.js-animate');
  if (!panels.length || !('IntersectionObserver' in window)) return;

  var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionPreference.matches) return;

  var root = document.documentElement;
  var pending = Array.prototype.slice.call(panels);
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) reveal(entry.target);
    });
  }, { rootMargin: '0px 0px -20% 0px' });

  function reveal(panel) {
    panel.classList.add('is-p-fullwidth-motion-visible');
    observer.unobserve(panel);
    pending = pending.filter(function (item) { return item !== panel; });
    if (!pending.length) {
      window.removeEventListener('scroll', checkPassed);
      document.removeEventListener('scroll', checkPassed);
      window.removeEventListener('resize', checkPassed);
    }
  }

  function checkPassed() {
    var triggerLine = window.innerHeight * 0.8;
    pending.slice().forEach(function (panel) {
      if (panel.getBoundingClientRect().top <= triggerLine) reveal(panel);
    });
  }

  function showAll() {
    panels.forEach(function (panel) {
      panel.classList.add('is-p-fullwidth-motion-visible');
    });
    observer.disconnect();
    window.removeEventListener('scroll', checkPassed);
    document.removeEventListener('scroll', checkPassed);
    window.removeEventListener('resize', checkPassed);
    root.classList.remove('p-fullwidth-motion-ready');
  }

  panels.forEach(function (panel) { observer.observe(panel); });
  root.classList.add('p-fullwidth-motion-ready');
  window.addEventListener('scroll', checkPassed);
  document.addEventListener('scroll', checkPassed);
  window.addEventListener('resize', checkPassed);
  checkPassed();

  if (motionPreference.addEventListener) {
    motionPreference.addEventListener('change', function (event) {
      if (event.matches) showAll();
    });
  } else if (motionPreference.addListener) {
    motionPreference.addListener(function (event) {
      if (event.matches) showAll();
    });
  }
}());
