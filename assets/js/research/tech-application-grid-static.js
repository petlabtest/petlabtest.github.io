(function () {
  function makeApplicationGridStatic() {
    var block = document.querySelector('.paragraph--type-p-project-carousel');
    if (!block) return;

    var viewContent = block.querySelector('.application-grid');
    if (!viewContent) return;

    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.slick &&
      window.jQuery(viewContent).hasClass('slick-initialized')) {
      try {
        window.jQuery(viewContent).slick('unslick');
      } catch (error) {
        console.warn('Unable to remove project carousel state', error);
      }
    }

    block.querySelectorAll('.slick-arrow, .slick-dots, .slick-cloned').forEach(function (element) {
      element.remove();
    });

    [viewContent].concat(Array.from(block.querySelectorAll('.slick-list, .slick-track')))
      .forEach(function (element) {
        element.removeAttribute('style');
        element.classList.remove('slick-slider', 'slick-initialized', 'slick-dotted');
      });

    block.querySelectorAll('.lab-carousel.views-row').forEach(function (item) {
      item.removeAttribute('style');
      item.removeAttribute('aria-hidden');
      item.removeAttribute('tabindex');
      item.classList.remove('slick-slide', 'slick-current', 'slick-active');
    });
  }

  makeApplicationGridStatic();
  window.addEventListener('load', makeApplicationGridStatic, { once: true });
  window.setTimeout(makeApplicationGridStatic, 350);
}());
