(function () {
  'use strict';

  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-editorial-section]'));
  var root = document.documentElement;
  var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  var observers = [];
  var observerBySection = new Map();

  function reveal(section) {
    section.classList.add('is-editorial-visible');
  }

  function disconnectObservers() {
    observers.forEach(function (observer) { observer.disconnect(); });
    observers = [];
    observerBySection.clear();
  }

  function revealAll() {
    sections.forEach(reveal);
    root.classList.remove('editorial-motion-ready');
    disconnectObservers();
    window.removeEventListener('resize', observePending);
  }

  if (!sections.length || preference.matches || !('IntersectionObserver' in window)) {
    revealAll();
    return;
  }

  sections.forEach(function (section) {
    Array.prototype.forEach.call(section.querySelectorAll('[data-editorial-target]'), function (target, index) {
      target.style.setProperty('--editorial-order', String(index));
      var delay = Number(target.getAttribute('data-editorial-delay'));
      if (Number.isFinite(delay) && delay >= 0) target.style.setProperty('--editorial-delay-ms', delay + 'ms');
    });
  });

  var pending = sections.slice();
  function observePending() {
    disconnectObservers();
    var groups = new Map();
    pending.forEach(function (section) {
      var threshold = Number(section.getAttribute('data-editorial-threshold'));
      if (!Number.isFinite(threshold) || threshold <= 0 || threshold >= 1) threshold = 0.65;
      if (!groups.has(threshold)) groups.set(threshold, []);
      groups.get(threshold).push(section);
    });
    groups.forEach(function (group, threshold) {
      var bottomInset = Math.round(window.innerHeight * (1 - threshold));
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var index = pending.indexOf(entry.target);
          if (!entry.isIntersecting || index === -1) return;
          reveal(entry.target);
          pending.splice(index, 1);
          observer.unobserve(entry.target);
          observerBySection.delete(entry.target);
          if (!pending.length) window.removeEventListener('resize', observePending);
        });
      }, { rootMargin: '0px 0px -' + bottomInset + 'px 0px', threshold: 0 });
      observers.push(observer);
      group.forEach(function (section) {
        observerBySection.set(section, observer);
        observer.observe(section);
      });
    });
  }

  observePending();

  document.addEventListener('focusin', function (event) {
    var section = event.target && event.target.closest && event.target.closest('[data-editorial-section]');
    var index = pending.indexOf(section);
    if (!section || index === -1) return;
    reveal(section);
    pending.splice(index, 1);
    var observer = observerBySection.get(section);
    if (observer) observer.unobserve(section);
    observerBySection.delete(section);
    if (!pending.length) window.removeEventListener('resize', observePending);
  });

  window.addEventListener('resize', observePending);
  root.classList.add('editorial-motion-ready');

  function onPreferenceChange(event) {
    if (event.matches) revealAll();
  }
  if (preference.addEventListener) preference.addEventListener('change', onPreferenceChange);
  else if (preference.addListener) preference.addListener(onPreferenceChange);
})();
