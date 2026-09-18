(function () {
  'use strict';

  if (window.__petlabFloatingAssistant) return;
  window.__petlabFloatingAssistant = true;

  var script = document.currentScript;
  var siteRoot = new URL('../../', script.src);
  var mascotUrl = new URL('../pic/main/PETLAB_Mascot-v3.png', script.src).href;
  var isChinese = /-cn\.html$/i.test(location.pathname) || document.documentElement.lang.toLowerCase().startsWith('zh');
  var copy = isChinese ? {
    nav: '探索 PETLab',
    trigger: '打开 PETLab 对话气泡',
    close: '关闭 PETLab 对话气泡',
    hint: '一起探索科学',
    inspiration: '科学 · 灵感',
    research: '了解研究',
    giving: '支持研究',
    engage: '参与研究',
    people: '加入团队'
  } : {
    nav: 'Explore PETLab',
    trigger: 'Open PETLab conversation bubble',
    close: 'Close PETLab conversation bubble',
    hint: 'Explore science together',
    inspiration: 'SCIENCE · INSPIRATION',
    research: 'Research',
    giving: 'Donate',
    engage: 'Engage',
    people: 'Join'
  };
  var quotes = isChinese ? [
    { quote: '如果说我看得更远，那是因为我站在巨人的肩膀上。', scientist: '艾萨克·牛顿', years: '1643–1727', portrait: 'Isaac-Newton-1689.jpg', cite: 'https://en.wikiquote.org/wiki/Isaac_Newton' },
    { quote: '生活中没有什么可怕的东西，只有需要理解的东西。', scientist: '玛丽·居里', years: '1867–1934', portrait: 'Marie-Curie-1903.jpg', cite: 'https://en.wikiquote.org/wiki/Marie_Curie' },
    { quote: '你无法教会一个人任何东西，你只能帮助他在自己内心找到它。', scientist: '伽利略·伽利莱', years: '1564–1642', portrait: 'Galileo-Galilei-1636.jpg', cite: 'https://en.wikiquote.org/wiki/Galileo_Galilei' },
    { quote: '能够生存下来的物种，并非最强或最聪明，而是对变化反应最快的。', scientist: '查尔斯·达尔文', years: '1809–1882', portrait: 'Charles-Darwin-1881.jpg', cite: 'https://en.wikiquote.org/wiki/Charles_Darwin' },
    { quote: '未来属于那些属于美好梦想家的人。', scientist: '尼古拉·特斯拉', years: '1856–1943', portrait: 'Nikola-Tesla-1890.jpg', cite: 'https://en.wikiquote.org/wiki/Nikola_Tesla' },
    { quote: '我们只能看到前方不远的路，但那里有太多值得去做的事。', scientist: '艾伦·图灵', years: '1912–1954', portrait: 'Alan-Turing-1951.jpg', cite: 'https://en.wikiquote.org/wiki/Alan_Turing' },
    { quote: '想象力比知识更重要。', scientist: '阿尔伯特·爱因斯坦', years: '1879–1955', portrait: 'Albert-Einstein-1921.jpg', cite: 'https://www.saturdayeveningpost.com/wp-content/uploads/satevepost/what_life_means_to_einstein.pdf' }
  ] : [
    { quote: 'If I have seen further, it is by standing on the shoulders of giants.', scientist: 'Isaac Newton', years: '1643–1727', portrait: 'Isaac-Newton-1689.jpg', cite: 'https://en.wikiquote.org/wiki/Isaac_Newton' },
    { quote: 'Nothing in life is to be feared, it is only to be understood.', scientist: 'Marie Curie', years: '1867–1934', portrait: 'Marie-Curie-1903.jpg', cite: 'https://en.wikiquote.org/wiki/Marie_Curie' },
    { quote: 'You cannot teach a man anything; you can only help him find it within himself.', scientist: 'Galileo Galilei', years: '1564–1642', portrait: 'Galileo-Galilei-1636.jpg', cite: 'https://en.wikiquote.org/wiki/Galileo_Galilei' },
    { quote: 'It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.', scientist: 'Charles Darwin', years: '1809–1882', portrait: 'Charles-Darwin-1881.jpg', cite: 'https://en.wikiquote.org/wiki/Charles_Darwin' },
    { quote: 'The future belongs to those who belong to the beautiful dreamers.', scientist: 'Nikola Tesla', years: '1856–1943', portrait: 'Nikola-Tesla-1890.jpg', cite: 'https://en.wikiquote.org/wiki/Nikola_Tesla' },
    { quote: 'We can only see a short distance ahead, but we can see plenty there that needs to be done.', scientist: 'Alan Turing', years: '1912–1954', portrait: 'Alan-Turing-1951.jpg', cite: 'https://en.wikiquote.org/wiki/Alan_Turing' },
    { quote: 'Imagination is more important than knowledge.', scientist: 'Albert Einstein', years: '1879–1955', portrait: 'Albert-Einstein-1921.jpg', cite: 'https://www.saturdayeveningpost.com/wp-content/uploads/satevepost/what_life_means_to_einstein.pdf' }
  ];
  var suffix = isChinese ? 'cn' : 'en';

  var style = document.createElement('style');
  style.setAttribute('data-petlab-floating-assistant', '');
  style.textContent = [
    '.petlab-assistant{--petlab-scan-y:10px;position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:2147482000;width:410px;height:400px;pointer-events:none;isolation:isolate;font:600 14px/1.2 Arial,"Microsoft YaHei",sans-serif}',
    '.petlab-assistant,.petlab-assistant *{box-sizing:border-box}',
    '.petlab-assistant__trigger{position:absolute;right:0;bottom:0;width:168px;height:178px;border:0;padding:0;background:transparent;cursor:pointer;pointer-events:auto;-webkit-tap-highlight-color:transparent}',
    '.petlab-assistant__detector-ring{position:absolute;left:-8px;top:var(--petlab-scan-y);width:184px;height:80px;overflow:visible;pointer-events:none;transition:top .12s linear}',
    '.petlab-assistant__detector-ring--rear{z-index:1}',
    '.petlab-assistant__detector-ring--front{z-index:3}',
    '.petlab-assistant__mascot{position:absolute;z-index:2;left:25px;bottom:18px;width:118px;height:118px;object-fit:contain;filter:drop-shadow(0 10px 9px rgba(0,45,80,.24));transform-origin:54% 86%;animation:petlab-assistant-float 3.4s ease-in-out infinite;transition:filter .24s ease}',
    '.petlab-assistant__hint{position:absolute;z-index:5;right:158px;bottom:49px;width:max-content;max-width:160px;padding:10px 13px;border-radius:8px;background:#00305c;color:#fff;box-shadow:0 8px 24px rgba(0,35,64,.2);opacity:0;visibility:hidden;transform:translateX(8px);transition:opacity .18s ease,transform .18s ease,visibility .18s;pointer-events:none}',
    '.petlab-assistant__hint::after{content:"";position:absolute;right:-6px;top:50%;width:12px;height:12px;background:#00305c;transform:translateY(-50%) rotate(45deg)}',
    '.petlab-assistant:not(.is-open) .petlab-assistant__trigger:hover .petlab-assistant__hint,.petlab-assistant:not(.is-open) .petlab-assistant__trigger:focus-visible .petlab-assistant__hint{opacity:1;visibility:visible;transform:translateX(0)}',
    '.petlab-assistant__trigger:hover .petlab-assistant__mascot,.petlab-assistant__trigger:focus-visible .petlab-assistant__mascot{filter:drop-shadow(0 13px 10px rgba(0,45,80,.28)) brightness(1.035)}',
    '.petlab-assistant__trigger:active .petlab-assistant__mascot{scale:.96}',
    '.petlab-assistant__trigger:focus-visible{outline:3px solid #f45a2b;outline-offset:2px;border-radius:60px}',
    '.petlab-assistant__bubble{position:absolute;right:28px;bottom:184px;width:min(460px,calc(100vw - 56px));border:1px solid #dce5eb;border-radius:20px;background:#fff;color:#00305c;box-shadow:0 16px 48px rgba(0,40,72,.18);opacity:0;visibility:hidden;transform:translateY(12px) scale(.97);transform-origin:88% 100%;transition:opacity .2s ease,transform .25s ease,visibility .2s;pointer-events:none;text-align:left}',
    '.petlab-assistant__bubble::after{content:"";position:absolute;right:36px;bottom:-9px;width:17px;height:17px;background:#fff;border-right:1px solid #dce5eb;border-bottom:1px solid #dce5eb;transform:rotate(45deg)}',
    '.petlab-assistant.is-open .petlab-assistant__bubble{opacity:1;visibility:visible;transform:none;pointer-events:auto}',
    '.petlab-assistant__bubble-inner{padding:25px 22px 20px;max-height:calc(100vh - 230px);max-height:calc(100dvh - 230px);overflow-y:auto;overscroll-behavior:contain;border-radius:20px}',
    '.petlab-assistant__close{all:unset;position:absolute;right:8px;top:7px;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;cursor:pointer;color:#536c7a;font:400 23px/1 Arial,sans-serif}',
    '.petlab-assistant__close:hover{background:#edf3f7;color:#00305c}',
    '.petlab-assistant__quote-row{display:grid;grid-template-columns:76px minmax(0,1fr);gap:18px;align-items:center;padding:4px 9px 20px 0}',
    '.petlab-assistant__portrait{display:block!important;width:76px!important;height:94px!important;max-width:none!important;object-fit:cover;object-position:50% 18%;border-radius:12px;margin:0!important;border:1px solid #e1e8ed}',
    '.petlab-assistant__eyebrow{display:block;color:#637e8d;font:600 10px/1.5 Arial,"Microsoft YaHei",sans-serif;letter-spacing:1.4px;margin:0 0 8px}',
    '.petlab-assistant__quote{padding:0!important;margin:0 0 12px!important;border:0!important;background:none!important;color:#00305c!important;font:500 19px/1.55 Georgia,"Songti SC","SimSun",serif!important;quotes:none}',
    '.petlab-assistant__quote::before,.petlab-assistant__quote::after{content:none!important}',
    '.petlab-assistant__scientist{display:block;color:#00305c;font:600 12px/1.5 Arial,"Microsoft YaHei",sans-serif}',
    '.petlab-assistant__years{display:block;margin-top:3px;color:#718390;font:400 11px/1.5 Arial,sans-serif;letter-spacing:1px}',
    '.petlab-assistant__links{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;padding-top:18px;border-top:1px solid #e3eaf0}',
    '.petlab-assistant__links::before{content:"";position:absolute;top:-2px;left:0;width:28px;height:3px;background:#f45a2b;border-radius:2px}',
    '.petlab-assistant__action{all:unset;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;min-width:0!important;min-height:46px!important;padding:9px 5px!important;border-radius:8px!important;background:#eef4f8!important;color:#00305c!important;cursor:pointer!important;font:600 12px/1.4 Arial,"Microsoft YaHei",sans-serif!important;text-align:center!important;text-decoration:none!important;transition:color .18s ease,background .18s ease!important}',
    '.petlab-assistant__action::before,.petlab-assistant__action::after{content:none!important}',
    '.petlab-assistant__action:hover,.petlab-assistant__action:focus-visible{background:#00305c!important;color:#fff!important}',
    '.petlab-assistant__action:focus-visible,.petlab-assistant__close:focus-visible{outline:2px solid #f45a2b!important;outline-offset:3px!important}',
    '.petlab-assistant.is-open .petlab-assistant__mascot{animation-name:petlab-assistant-float,petlab-assistant-greet;animation-duration:3.4s,.55s;animation-iteration-count:infinite,1}',
    '@keyframes petlab-assistant-float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2px) rotate(-.6deg)}}',
    '@keyframes petlab-assistant-greet{0%,100%{rotate:0deg}35%{rotate:-5deg}70%{rotate:3deg}}',
    '@media(max-width:700px){.petlab-assistant{right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));width:310px;height:340px}.petlab-assistant__trigger{width:132px;height:142px}.petlab-assistant__detector-ring{left:-7px;width:146px;height:63.48px}.petlab-assistant__mascot{left:20px;bottom:14px;width:94px;height:94px}.petlab-assistant__hint{display:none}.petlab-assistant__bubble{right:4px;bottom:150px;width:min(420px,calc(100vw - 28px))}.petlab-assistant__bubble-inner{padding:24px 14px 16px;max-height:calc(100vh - 190px);max-height:calc(100dvh - 190px)}.petlab-assistant__quote-row{grid-template-columns:60px minmax(0,1fr);gap:12px}.petlab-assistant__portrait{width:60px!important;height:80px!important}.petlab-assistant__quote{font-size:17px!important}.petlab-assistant__links{gap:5px}.petlab-assistant__action{font-size:11px!important;padding:8px 3px!important}}',
    '@media(prefers-reduced-motion:reduce){.petlab-assistant__mascot{animation:none!important;transition:none}.petlab-assistant__bubble,.petlab-assistant__action,.petlab-assistant__detector-ring{transition:none!important}}',
    '@media print{.petlab-assistant{display:none!important}}'
  ].join('');
  document.head.appendChild(style);

  // Individual modules share world-space lighting. The depth split falls in
  // module gaps, so it never draws a seam across a continuous surface.
  function detectorRing(front) {
    var id = 'petlab-ring-' + (front ? 'front' : 'rear');
    function point(rx, ry, angle, depth) {
      return (100 + rx * Math.cos(angle)).toFixed(3) + ' ' +
        (40 + ry * Math.sin(angle) + (depth || 0)).toFixed(3);
    }
    var modules = [];
    var step = Math.PI * 2 / 24;
    var gap = .022;
    for (var index = front ? 0 : 12; index < (front ? 12 : 24); index += 1) {
      var a = index * step + gap;
      var b = (index + 1) * step - gap;
      var outerA = point(82, 25, a);
      var outerB = point(82, 25, b);
      var innerA = point(65, 18, a);
      var innerB = point(65, 18, b);
      var surface = 'M' + outerA + ' A82 25 0 0 1 ' + outerB +
        ' L' + innerB + ' A65 18 0 0 0 ' + innerA + ' Z';
      var rx = front ? 82 : 65;
      var ry = front ? 25 : 18;
      var wall = 'M' + point(rx, ry, a) + ' A' + rx + ' ' + ry + ' 0 0 1 ' +
        point(rx, ry, b) + ' L' + point(rx, ry, b, 5) +
        ' A' + rx + ' ' + ry + ' 0 0 0 ' + point(rx, ry, a, 5) + ' Z';
      modules.push('<path d="' + wall + '" fill="url(#' + id + '-wall)"/>');
      // The exposed radial end provides physical thickness without cast shadows.
      var end = Math.cos((a + b) / 2) > 0 ? b : a;
      modules.push('<path d="M' + point(82, 25, end) + ' L' + point(65, 18, end) +
        ' L' + point(65, 18, end, 5) + ' L' + point(82, 25, end, 5) +
        ' Z" fill="#c0cbd3"/>');
      modules.push('<path d="' + surface + '" fill="url(#' + id + '-surface)"/>');
      modules.push('<path d="M' + point(65, 18, a + .018, 1.5) +
        ' A65 18 0 0 1 ' + point(65, 18, b - .018, 1.5) +
        '" fill="none" stroke="#f47750" stroke-width="1.35" stroke-linecap="round"/>');
    }
    return [
      '<svg class="petlab-assistant__detector-ring petlab-assistant__detector-ring--' + (front ? 'front' : 'rear') + '" viewBox="0 0 200 87" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">',
      '<defs>',
      '<linearGradient id="' + id + '-surface" gradientUnits="userSpaceOnUse" x1="30" y1="15" x2="155" y2="65"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#eef2f5"/></linearGradient>',
      '<linearGradient id="' + id + '-wall" gradientUnits="userSpaceOnUse" x1="0" y1="15" x2="0" y2="72"><stop stop-color="#b9c5cf"/><stop offset="1" stop-color="#99aab8"/></linearGradient>',
      '</defs>',
      modules.join(''),
      '</svg>'
    ].join('');
  }

  function mount() {
    if (document.querySelector('.petlab-assistant')) return;
    var assistant = document.createElement('div');
    var menuId = 'petlab-assistant-menu';
    assistant.className = 'petlab-assistant';
    assistant.setAttribute('aria-label', copy.nav);
    var day = new Date().getDay();
    var quote = quotes[(day + 6) % 7];
    assistant.innerHTML = [
      '<section class="petlab-assistant__bubble" id="' + menuId + '" role="dialog" aria-label="' + copy.nav + '" aria-hidden="true" inert>',
      '<button class="petlab-assistant__close" type="button" aria-label="' + copy.close + '">×</button>',
      '<div class="petlab-assistant__bubble-inner"><div class="petlab-assistant__quote-row">',
      '<img class="petlab-assistant__portrait" src="' + new URL('../pic/main/' + quote.portrait, script.src).href + '" alt="' + quote.scientist + '" width="76" height="94" loading="lazy">',
      '<div><span class="petlab-assistant__eyebrow">' + copy.inspiration + '</span>',
      '<blockquote class="petlab-assistant__quote" cite="' + quote.cite + '">“' + quote.quote + '”</blockquote>',
      '<span class="petlab-assistant__scientist">' + quote.scientist + '</span><span class="petlab-assistant__years">' + quote.years + '</span></div></div>',
      '<nav class="petlab-assistant__links" aria-label="' + copy.nav + '">',
      '<a class="petlab-assistant__action" href="' + new URL('Research/Research-ov-' + suffix + '.html', siteRoot).href + '">' + copy.research + '</a>',
      '<a class="petlab-assistant__action" href="' + new URL('Giving/Giving-giving-' + suffix + '.html', siteRoot).href + '">' + copy.giving + '</a>',
      '<a class="petlab-assistant__action" href="' + new URL('Engage/Engage-ov-' + suffix + '.html', siteRoot).href + '">' + copy.engage + '</a>',
      '<a class="petlab-assistant__action" href="' + new URL('People/People-ov-' + suffix + '.html', siteRoot).href + '">' + copy.people + '</a>',
      '</nav></div></section>',
      '<button class="petlab-assistant__trigger" type="button" aria-expanded="false" aria-controls="' + menuId + '" aria-label="' + copy.trigger + '">',
      detectorRing(false),
      '<img class="petlab-assistant__mascot" src="' + mascotUrl + '" alt="" width="118" height="118">',
      detectorRing(true),
      '<span class="petlab-assistant__hint" aria-hidden="true">' + copy.hint + '</span>',
      '</button>'
    ].join('');
    document.body.appendChild(assistant);

    var trigger = assistant.querySelector('.petlab-assistant__trigger');
    var bubble = assistant.querySelector('.petlab-assistant__bubble');
    var closeButton = assistant.querySelector('.petlab-assistant__close');
    var frame = 0;

    function setOpen(open, returnFocus) {
      if (!open && (returnFocus || bubble.contains(document.activeElement))) trigger.focus();
      assistant.classList.toggle('is-open', open);
      bubble.inert = !open;
      bubble.setAttribute('aria-hidden', String(!open));
      trigger.setAttribute('aria-expanded', String(open));
      trigger.setAttribute('aria-label', open ? copy.close : copy.trigger);
      if (open) requestAnimationFrame(function () {
        if (assistant.classList.contains('is-open')) closeButton.focus({ preventScroll: true });
      });
    }

    function update() {
      frame = 0;
      var root = document.documentElement;
      var maximum = Math.max(1, root.scrollHeight - window.innerHeight);
      var progress = Math.min(1, Math.max(0, window.scrollY / maximum));
      var isMobile = window.innerWidth <= 700;
      var scanStart = isMobile ? 9 : 10;
      var scanDistance = isMobile ? 74 : 96;
      assistant.style.setProperty('--petlab-scan-y', (scanStart + progress * scanDistance).toFixed(1) + 'px');
    }

    function requestUpdate() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    trigger.addEventListener('click', function () {
      setOpen(!assistant.classList.contains('is-open'));
    });
    trigger.addEventListener('keydown', function (event) {
      if (event.key === 'Tab' && !event.shiftKey && assistant.classList.contains('is-open')) {
        event.preventDefault();
        closeButton.focus();
      }
    });
    closeButton.addEventListener('click', function () { setOpen(false, true); });
    document.addEventListener('click', function (event) {
      if (assistant.classList.contains('is-open') && !assistant.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && assistant.classList.contains('is-open')) setOpen(false, true);
    });
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
}());
