(function () {
  'use strict';

  function init() {
    var steps = Array.prototype.slice.call(document.querySelectorAll('.transfer-process-flow__step'));
    if (!steps.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      steps.forEach(function (step) { step.classList.add('is-visible'); });
      return;
    }

    document.documentElement.classList.add('js-transfer-process');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .14, rootMargin: '0px 0px -8% 0px' });

    steps.forEach(function (step, index) {
      step.style.transitionDelay = Math.min(index * 70, 210) + 'ms';
      observer.observe(step);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());
