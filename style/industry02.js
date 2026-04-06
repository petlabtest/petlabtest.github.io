function onAwardClick(img) {
  var title = document.querySelector(".social-title h2");
  var desc = document.querySelector(".social-title p");
  var cert = document.querySelector(".social-cert div");

  title.innerText = img.title;
  desc.innerText = img.desc;

  // 使用图片的width和height属性计算比例
  var ratio = img.width / img.height;
  var fixedHeight = 18; // rem
  var calculatedWidth = fixedHeight * ratio;

  cert.style.backgroundImage = "url(" + img.src + ")";
  cert.style.height = fixedHeight + "rem";
  cert.style.width = calculatedWidth + "rem";
}

// 奖状图片数据
const awardsData = [
  {
    src: "images/team/team-achievements/4.jpg",
    width: "11.8",
    height: "8",
    alt: "奖状1",
    title: "中国十大科技进展",
    desc: "两院院士评选",
  },
  {
    src: "images/team/team-achievements/5.jpg",
    width: "10.5",
    height: "8",
    alt: "奖状2",
    title: "黄家驷生物医学工程技术发明一等奖",
    desc: "",
  },
  {
    src: "images/team/team-achievements/6.jpg",
    width: "11.2",
    height: "8",
    alt: "奖状4",
    title: "中国医学重大进展",
    desc: "",
  },
  {
    src: "images/team/team-achievements/7.jpg",
    width: "14.7",
    height: "8",
    alt: "奖状5",
    title: "CCTV科技盛典十大科技创新人物",
    desc: "中央电视台、科技部",
  },
  {
    src: "images/team/team-achievements/extra.jpg",
    width: "11.3",
    height: "8",
    alt: "奖状3",
    title: "省技术发明一等奖（两次）",
    desc: "",
  },
  {
    src: "images/team/team-achievements/extra2.jpg",
    width: "5.65",
    height: "8",
    alt: "奖状6",
    title: "创新医疗器械特别审批",
    desc: "数字 PET 领域第一个",
  },
  // 可继续扩展更多奖项
];

document.addEventListener("DOMContentLoaded", function () {
  const imgEls = Array.from(document.querySelectorAll(".social-awards img"));
  let currentIndex = 0; // 当前显示的起始索引

  function render() {
    for (let i = 0; i < imgEls.length; i++) {
      // 计算当前应该显示的奖项索引
      const awardIndex = (currentIndex + i) % awardsData.length;
      const award = awardsData[awardIndex];

      if (award) {
        imgEls[i].src = award.src;
        imgEls[i].alt = award.alt;
        imgEls[i].style.width = award.width + "rem";
        imgEls[i].style.height = award.height + "rem";

        // 添加点击事件回调 - 这里需要传递正确的奖项对象
        imgEls[i].onclick = (function (award) {
          return function () {
            onAwardClick(award);
          };
        })(award);
      } else {
        imgEls[i].src = "";
        imgEls[i].alt = "";
        imgEls[i].style.width = "0";
        imgEls[i].style.height = "0";
        imgEls[i].onclick = null;
      }
    }
  }

  render();

  // 左右按钮
  const btnLeft = document.querySelector(".social-awards .btn-left");
  const btnRight = document.querySelector(".social-awards .btn-right");

  btnLeft.addEventListener("click", function () {
    // 向左移动：当前索引增加1（循环移位）
    currentIndex = (currentIndex + 1) % awardsData.length;
    render();
    const award = awardsData[currentIndex];
    if (award) {
      onAwardClick(award);
    }
  });

  btnRight.addEventListener("click", function () {
    // 向右移动：当前索引减少1（循环移位）
    currentIndex = (currentIndex - 1 + awardsData.length) % awardsData.length;
    render();
    const award = awardsData[currentIndex];
    if (award) {
      onAwardClick(award);
    }
  });
});
