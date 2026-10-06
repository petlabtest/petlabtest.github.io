(function () {
  var imageFrames = document.querySelectorAll('.p-project-list__content .project-list__image');

  function updateProjectImageLayouts() {
    imageFrames.forEach(function (frame) {
      var images = Array.from(frame.querySelectorAll('img'));
      if (images.length < 2 || images.some(function (image) { return !image.naturalWidth || !image.naturalHeight; })) return;

      var landscapeCount = images.filter(function (image) {
        return image.naturalWidth > image.naturalHeight * 1.05;
      }).length;

      var stacked = landscapeCount >= images.length / 2;
      var isMobile = window.matchMedia('(max-width: 699px)').matches;
      frame.classList.toggle('project-list__image--stacked', stacked);

      var frameWidth = frame.clientWidth;
      var frameHeight = frame.clientHeight;
      var ratios = images.map(function (image) { return image.naturalWidth / image.naturalHeight; });

      if (stacked || isMobile) {
        var sharedWidth = Math.min(frameWidth, frameHeight / ratios.reduce(function (total, ratio) {
          return total + (1 / ratio);
        }, 0));
        frame.style.setProperty('--shared-image-width', sharedWidth + 'px');
      } else {
        var sharedHeight = Math.min(frameHeight, frameWidth / ratios.reduce(function (total, ratio) {
          return total + ratio;
        }, 0));
        frame.style.setProperty('--shared-image-height', sharedHeight + 'px');
      }
    });
  }

  imageFrames.forEach(function (frame) {
    frame.querySelectorAll('img').forEach(function (image) {
      image.addEventListener('load', updateProjectImageLayouts, { once: true });
    });
  });
  updateProjectImageLayouts();
  window.addEventListener('resize', updateProjectImageLayouts);
}());
