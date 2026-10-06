(function () {
  var showcase = document.querySelector('.core-technologies-showcase');
  if (!showcase) return;
  var cards = Array.from(showcase.querySelectorAll('.node--view-mode-carousel'));
  cards.forEach(function (card) { card.classList.add('core-card-pending'); });
  function reveal(card) {
    card.classList.add('core-card-visible');
    card.classList.remove('core-card-pending');
  }
  var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionPreference.matches || !('IntersectionObserver' in window)) {
    cards.forEach(reveal);
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: .05 });
  cards.forEach(function (card) { observer.observe(card); });
  function revealAll() {
    cards.forEach(reveal);
    observer.disconnect();
  }
  if (motionPreference.addEventListener) {
    motionPreference.addEventListener('change', function (event) {
      if (event.matches) revealAll();
    });
  } else if (motionPreference.addListener) {
    motionPreference.addListener(function (event) {
      if (event.matches) revealAll();
    });
  }
}());
