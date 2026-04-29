document.addEventListener('DOMContentLoaded', function () {
  var btns = document.querySelectorAll('.team-detail-tab-btns .tab-btn');
  var panels = document.querySelectorAll('.team-detail-tab-content .tab-panel');
  btns.forEach(function (btn, idx) {
    btn.addEventListener('click', function () {
      btns.forEach(function (b, i) {
        b.classList.toggle('active', i === idx);
        panels[i].style.display = (i === idx) ? 'block' : 'none';
      });
    });
  });
});
