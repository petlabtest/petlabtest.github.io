(function () {
  'use strict';

  var panels = document.querySelectorAll('.paragraph--type-p-rdgroups');
  if (!panels.length) return;

  var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  var observer = null;
  function handleMotionPreferenceChange(event) {
    if (!event.matches) return;
    panels.forEach(function (panel) { panel.classList.add('js-animate'); });
    if (observer) observer.disconnect();
  }
  if (motionPreference.addEventListener) {
    motionPreference.addEventListener('change', handleMotionPreferenceChange);
  } else if (motionPreference.addListener) {
    motionPreference.addListener(handleMotionPreferenceChange);
  }

  if (motionPreference.matches || !('IntersectionObserver' in window)) {
    panels.forEach(function (panel) { panel.classList.add('js-animate'); });
    return;
  }

  observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('js-animate');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -20% 0px' });

  panels.forEach(function (panel) { observer.observe(panel); });
}());
