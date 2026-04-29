document.addEventListener("DOMContentLoaded", function () {
  var basePath = window.location.pathname;
  basePath = basePath.substring(0, basePath.lastIndexOf("/"));
  basePath += document
    .getElementById("base-path")
    .getAttribute("href")
    .slice(0, -1);

  // 初次进入页面的情况处理
  if (window.location.pathname.endsWith(".psp") || window.location.pathname == "/" || window.location.pathname == "/main.htm"){
    window.location.href = basePath + "/en/main.htm";
    return;
  }

  const header = `
        <div class="header-logo">
          <a
            href="main-zh.htm"
            style="color: inherit; text-decoration: none"
            ><img src="${basePath}/images/petlab.png" alt="PETLab Logo" class="header-logo-img" alt="了解更多" class="more-icon"
          /></a>
        </div>
        <nav class="header-menu">
          <ul>
          <li class="hover-menu">关于我们
            <ul>
              <li><a href="${basePath}/team-achievements.htm">团队简介</a></li>
              <li><a href="${basePath}/team-intro.htm">研究团队</a></li>
              <li><a href="${basePath}/industry02.htm">科研成果</a></li>
              <li><a href="${basePath}/industry01.htm">产业转化</a></li>
            </ul>
          </li>
          <li class="hover-menu">科学研究
            <ul>
              <li><a href="${basePath}/science-method01.htm">方法研究</a></li>
              <li class="hover-menu">技术开发
                <ul>
                  <li><a href="${basePath}/science-tech01.htm">闪烁晶体</a></li>
                  <li><a href="${basePath}/science-tech03.htm">极弱光探测芯片</a></li>
                  <li><a href="${basePath}/science-tech05.htm">粒子探测模块</a></li>
                  <li><a href="${basePath}/science-tech02.htm">Plug-n-Image</a></li>
                  <li><a href="${basePath}/science-tech04.htm">图像重建</a></li>
                </ul>
              </li>
              <li><a href="${basePath}/science-system01.htm">创新系统</a></li>
              <li><a href="${basePath}/science-application01.htm">前沿应用</a></li>
            </ul>
          </li>
          <li class="hover-menu">人才培养
            <ul>
              <li><a href="${basePath}/student-train.htm">培养理念</a></li>
              <li><a href="${basePath}/student-conference.htm">国际视野</a></li>
              <li><a href="${basePath}/student-join.htm">加入我们</a></li>
            </ul>
          </li>
          <li class="hover-menu">近期动态
            <ul>
              <li><a href="${basePath}/news-paper.htm">学术论文</a></li>
              <li><a href="${basePath}/news-project.htm">自媒体宣传</a></li>
            </ul>
          </li>
          <li><a href="${basePath}/donation.htm">捐赠</a></li>
          <li><a href="${basePath}/contact.htm">联系我们</a></li>
        </ul>
      </nav>
    `;
  const footer = `
        <div class="footer-main">
            <div class="footer-info-cols">
            <div class="footer-contact">
                <div>petlab@ustc.edu.cn</div>
                <div>中国科学技术大学高新校区信智楼9楼</div>
                <div><br/></div>
            </div>
            <div class="footer-links">
                <div><a href="http://www.raysolution.com" target="_blank">锐世医疗：www.raysolution.com</a></div>
                <div><a href="http://www.ray-quant.com" target="_blank">锐光科技：www.ray-quant.com</a></div>
                <div><a href="http://www.ray-can.com" target="_blank">瑞派宁：www.ray-can.com</a></div>
            </div>
            </div>
            <div class="footer-qrcode-wrap">
                <img src="${basePath}/images/qrcode.png" alt="二维码" class="footer-qrcode">
            </div>
        </div>
        <div class="footer-bottom">
            <span>版权所有：中国科学技术大学智能探测与成像实验室</span>
        </div>
    `;
  // 语言按钮 HTML
  const languageButton = `
     <div class="header-language">
        <div class="header-language-circle"></div>
        <span class="header-language-text">EN</span>
    </div>
  `;

  document.querySelector(".header-container").innerHTML = header;
  document
    .querySelector(".header-container")
    .insertAdjacentHTML("beforeend", languageButton);
  document.querySelector(".footer-container").innerHTML = footer;

  const targetLang = "en";
  function getTargetUrl() {
    const currentPath = window.location.pathname;
    var fileName = currentPath.split("/").pop();
    if (fileName === "main-zh.htm") fileName = "main.htm";
    return `${basePath}/${targetLang}/${fileName}`;
  }
  document.querySelector(".header-language").addEventListener("click", function (event) {
    event.stopPropagation();
    const targetUrl = getTargetUrl();
    window.location.href = targetUrl;
  });

  // 如果在移动环境，:hover 无效，改用点击切换 .active 来展开菜单
  (function setupTouchMenus(){
    // :hover 有效时返回
    if (window.matchMedia("(hover: hover)").matches) return;

    const menuRoot = document.querySelector('.header-menu');
    if (!menuRoot) return;

    // 顶级 hover-menu（header-menu > ul > .hover-menu）
    const topLevel = menuRoot.querySelectorAll(':scope > ul > .hover-menu');
    // 二级 hover-menu（在顶级内部的 .hover-menu）
    const nested = menuRoot.querySelectorAll('.hover-menu .hover-menu');

    // 点击顶级时：关闭其它顶级，仅切换当前
    topLevel.forEach(li => {
      li.addEventListener('click', function(e){
        e.stopPropagation();
        const wasActive = li.classList.contains('active');
        topLevel.forEach(t => { if (t !== li) t.classList.remove('active'); });
        if (wasActive) li.classList.remove('active'); else li.classList.add('active');
        // 取消所有二级展开
        nested.forEach(n => n.classList.remove('active'));
      });
      // 确保键盘可用（Enter/Space）
      li.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          li.click();
        }
      });
    });

    // 二级 hover-menu（在顶级内部的 .hover-menu），允许在所属顶级内切换
    nested.forEach(n => {
      n.addEventListener('click', function(e){
        e.stopPropagation();
        const top = n.closest(':scope > ul > .hover-menu, .header-menu > ul > .hover-menu');
        // 关闭同一顶级内其它二级
        if (top) {
          const siblings = top.querySelectorAll('.hover-menu');
          siblings.forEach(s => { if (s !== n) s.classList.remove('active'); });
          // 确保顶级保持展开
          top.classList.add('active');
        }
        n.classList.toggle('active');
      });
    });

    // 点击页面空白处关闭所有展开的菜单
    function closeAll(){ topLevel.forEach(t => t.classList.remove('active')); }
    document.addEventListener('click', closeAll);
    document.addEventListener('touchstart', function(e){ if (!menuRoot.contains(e.target)) closeAll(); });
  })();

  // 增加Ctrl+滑轮缩放功能
  var zooms = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0, 5.0]
  var zoomIndex = 7;
  document.addEventListener('wheel', function(event) {
    if (event.ctrlKey) {
      event.preventDefault();
      var delta = event.deltaY;
      if (delta < 0) {
        zoomIndex = Math.min(zoomIndex + 1, zooms.length - 1);
      } else {
        zoomIndex = Math.max(zoomIndex - 1, 0);
      }
      var zoom = zooms[zoomIndex];
      document.documentElement.style.fontSize = `${zoom}vw`;
      document.documentElement.style.width = `${zoom * 100}vw`;
      if (zoomIndex > 7){
        document.documentElement.style.overflowX = "scroll";
      } else {
        document.documentElement.style.overflowX = "hidden";
      }
    }
  });

  
  // 回退：确保 header 在所有情况下固定（若 sticky 因父容器样式失效）
  (function ensureHeaderFixed() {
    const headerEl = document.querySelector('header') || document.querySelector('.header-container');
    if (!headerEl) return;

    // 防止重复插入
    if (document.querySelector('.header-spacer')) return;

    const spacer = document.createElement('div');
    spacer.className = 'header-spacer';
    spacer.style.height = '0px';
    spacer.style.width = '100%';
    // 将 spacer 插入到 header 之后
    headerEl.parentNode.insertBefore(spacer, headerEl.nextSibling);

    function applyFixed() {
      const h = headerEl.offsetHeight;
      headerEl.style.position = 'fixed';
      headerEl.style.top = '0';
      headerEl.style.left = '0';
      headerEl.style.right = '0';
      headerEl.style.zIndex = '9999';
      spacer.style.height = h + 'px';
    }

    // 初次应用并在 resize 时重新计算
    applyFixed();
    window.addEventListener('resize', applyFixed);
  })();
});
