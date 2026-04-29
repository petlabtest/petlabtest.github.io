document.addEventListener("DOMContentLoaded", function () {
  const carouselImages = document.querySelectorAll(".main-hero-img");
  let currentIndex = 0;

  // 初始化：设置第一张图片为不透明
  carouselImages[currentIndex].classList.add("active");

  function showNextImage() {
    carouselImages[currentIndex].classList.remove("active");
    currentIndex = (currentIndex + 1) % carouselImages.length;
    carouselImages[currentIndex].classList.add("active");
  }

  // 每 5 秒切换一次图片
  setInterval(showNextImage, 5000);
});
