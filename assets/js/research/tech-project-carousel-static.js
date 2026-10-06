(function () {
  var projectBlock = document.querySelector('.paragraph--type-p-project-carousel');
  var projectView = projectBlock && projectBlock.querySelector('.view-content');
  if (!projectView) return;

  function alignFourthProjectTitle() {
    var rows = Array.from(projectBlock.querySelectorAll('.views-row')).filter(function (row) {
      return !row.classList.contains('slick-cloned') && row.querySelector('.project-carousel__title');
    });
    if (rows.length < 4) return;

    var firstTitle = rows[0].querySelector('.project-carousel__title');
    var fourthTitle = rows[3].querySelector('.project-carousel__title');
    fourthTitle.style.setProperty('top', '0px', 'important');

    if (window.matchMedia('(max-width: 1100px)').matches) return;

    var offset = firstTitle.getBoundingClientRect().top - fourthTitle.getBoundingClientRect().top;
    fourthTitle.style.setProperty('top', offset + 'px', 'important');
  }

  function disableProjectCarousel() {
    projectView.classList.remove('slick-initialized', 'slick-slider', 'slick-dotted');
    projectView.style.transform = 'none';
    projectView.style.display = 'grid';
    projectView.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr)) minmax(0, 1.15fr)';
    projectView.style.gap = '24px';
    projectView.style.width = '100%';
    projectBlock.querySelectorAll('.slick-arrow, .slick-dots').forEach(function (control) {
      control.remove();
    });
    projectBlock.querySelectorAll('.slick-list, .slick-track').forEach(function (container) {
      container.style.display = 'contents';
      container.style.width = 'auto';
      container.style.height = 'auto';
      container.style.transform = 'none';
    });
    projectView.querySelectorAll('.slick-slide').forEach(function (slide) {
      slide.removeAttribute('aria-hidden');
      slide.removeAttribute('data-slick-index');
      slide.style.display = 'block';
      slide.style.visibility = 'visible';
      slide.style.opacity = '1';
      slide.style.transform = 'none';
      slide.style.position = 'static';
      slide.style.left = 'auto';
      slide.style.width = 'auto';
      slide.style.height = 'auto';
    });
    alignFourthProjectTitle();
  }

  disableProjectCarousel();
  projectBlock.querySelectorAll('img').forEach(function (image) {
    image.addEventListener('load', alignFourthProjectTitle);
  });
  window.addEventListener('load', function () {
    disableProjectCarousel();
    alignFourthProjectTitle();
  });
  window.addEventListener('resize', alignFourthProjectTitle);
  var attempts = 0;
  var timer = window.setInterval(function () {
    disableProjectCarousel();
    attempts += 1;
    if (attempts >= 20) window.clearInterval(timer);
  }, 100);
}());
