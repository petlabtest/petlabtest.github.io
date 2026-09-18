const SITE_ROOT_URL = new URL('../../', document.currentScript.src);
let searchIndexPromise;

function getPageLanguage() {
  return /-cn\.html$/i.test(window.location.pathname) || document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fetch(new URL('assets/data/search-index.json', SITE_ROOT_URL))
      .then(response => {
        if (!response.ok) throw new Error(`Search index: ${response.status}`);
        return response.json();
      })
      .catch(() => []);
  }
  return searchIndexPromise;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[character]);
}

function findPages(index, query, language, limit = Infinity) {
  const terms = query.toLocaleLowerCase(language === 'zh' ? 'zh-CN' : 'en').split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return index
    .filter(item => item.lang === language && terms.every(term => item.text.toLocaleLowerCase().includes(term)))
    .map(item => {
      const title = item.title.toLocaleLowerCase();
      const score = terms.reduce((total, term) => total + (title.startsWith(term) ? 3 : title.includes(term) ? 2 : 0), 0);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, language === 'zh' ? 'zh-CN' : 'en'))
    .slice(0, limit)
    .map(result => result.item);
}

// Inject skip-link style to hide it by default
(function() {
  const style = document.createElement('style');
  style.textContent = `
    a.skip-link {
      position: fixed !important;
      top: 0 !important;
      left: 1rem !important;
      z-index: 9999 !important;
      transform: translateY(-200%) !important;
      background: #fff !important;
      padding: .75rem 1rem !important;
      text-decoration: none !important;
      color: #000 !important;
      transition: transform .2s ease !important;
    }
    a.skip-link:focus,
    a.skip-link:focus-visible {
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
})();

async function loadComponent(selector, path) {
  const host = document.querySelector(selector);
  if (!host) return;
  try {
    const response = await fetch(new URL(path, SITE_ROOT_URL));
    if (!response.ok) throw new Error(String(response.status));
    host.innerHTML = await response.text();
    host.querySelectorAll('[src]').forEach(node => {
      const value = node.getAttribute('src');
      if (value && !/^(?:[a-z]+:|\/|#)/i.test(value)) node.src = new URL(value, SITE_ROOT_URL).href;
    });
    host.querySelectorAll('form[action]').forEach(form => {
      const value = form.getAttribute('action');
      if (value && !/^(?:[a-z]+:|\/|#)/i.test(value)) form.action = new URL(value, SITE_ROOT_URL).href;
    });
    host.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      const value = link.getAttribute('href');
      if (!value || /^(?:[a-z]+:|\/|#)/i.test(value)) return;
      event.preventDefault();
      window.location.href = new URL(value, SITE_ROOT_URL).href;
    });
  } catch (error) {
    host.innerHTML = `<p class="component-error">Open this website through a local web server to load shared navigation.</p>`;
  }
}

function closeNavigation() {
  document.querySelectorAll('.nav-group.open').forEach(group => {
    group.classList.remove('open');
    group.querySelector('.nav-trigger')?.setAttribute('aria-expanded','false');
  });
  document.querySelector('[data-site-header]')?.classList.remove('primary-menu-active');
}

function initHeader() {
  const header = document.querySelector('[data-site-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const searchButtons = [...document.querySelectorAll('[data-search-toggle]')];
  const searchPanel = document.querySelector('[data-search-panel]');
  const searchInput = document.querySelector('#site-search-input');
  const results = document.querySelector('[data-search-results]');
  document.querySelectorAll('.nav-trigger').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    const group = button.closest('.nav-group');
    const willOpen = !group.classList.contains('open');
    closeNavigation();
    group.classList.remove('dismissed');
    group.classList.toggle('open', willOpen);
    button.setAttribute('aria-expanded', String(willOpen));
    header.classList.toggle('primary-menu-active', Boolean(willOpen && group.closest('.primary-nav')));
  }));
  document.querySelectorAll('.nav-group').forEach(group => {
    let closeTimer;
    group.addEventListener('mouseenter', () => {
      if (!window.matchMedia('(min-width: 1101px)').matches) return;
      if (group.classList.contains('dismissed')) return;
      clearTimeout(closeTimer);
      closeNavigation();
      group.classList.add('open');
      group.querySelector(':scope > .nav-trigger')?.setAttribute('aria-expanded','true');
      header.classList.toggle('primary-menu-active', Boolean(group.closest('.primary-nav')));
    });
    group.addEventListener('mouseleave', () => {
      if (!window.matchMedia('(min-width: 1101px)').matches) return;
      closeTimer = setTimeout(() => {
        group.classList.remove('open');
        group.querySelector(':scope > .nav-trigger')?.setAttribute('aria-expanded','false');
        group.classList.remove('dismissed');
        if (group.closest('.primary-nav') && !header.querySelector('.primary-nav > .nav-group.open')) {
          header.classList.remove('primary-menu-active');
        }
      }, 120);
    });
  });
  document.querySelectorAll('[data-menu-close]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const group = button.closest('.nav-group');
    group?.classList.add('dismissed');
    group?.classList.remove('open');
    group?.querySelector(':scope > .nav-trigger')?.setAttribute('aria-expanded','false');
    header.classList.remove('primary-menu-active');
  }));
  document.addEventListener('click', event => { if (!event.target.closest('.nav-group')) closeNavigation(); });
  menuButton?.addEventListener('click', () => {
    const open = header.classList.toggle('menu-active');
    menuButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  });
  searchButtons.forEach(searchButton => searchButton.addEventListener('click', () => {
    const open = searchPanel.hasAttribute('hidden');
    searchPanel.toggleAttribute('hidden', !open);
    searchButtons.forEach(button => button.setAttribute('aria-expanded', String(open)));
    document.body.classList.toggle('search-open', open);
    if (open) setTimeout(() => searchInput?.focus(), 50);
  }));
  const runSearch = async () => {
    const query = searchInput.value.trim().toLowerCase();
    const language = getPageLanguage();
    const matches = query ? findPages(await loadSearchIndex(), query, language, 9) : [];
    const emptyMessage = language === 'zh' ? '没有找到匹配的页面。' : 'No matching pages found.';
    results.innerHTML = query && !matches.length
      ? `<p>${emptyMessage}</p>`
      : matches.map(item => `<a href="${new URL(item.url, SITE_ROOT_URL).href}">${escapeHTML(item.title)} →</a>`).join('');
  };
  searchInput?.addEventListener('input', runSearch);
  document.querySelector('[data-search-submit]')?.addEventListener('click', runSearch);
  document.querySelector('[data-language-toggle]')?.addEventListener('click', () => {
    const note = document.createElement('div');
    note.className = 'language-note';
    note.textContent = '中文版本正在准备中。';
    Object.assign(note.style,{position:'fixed',right:'20px',top:'36px',zIndex:'9999',background:'#fff',color:'#111820',padding:'12px 16px',boxShadow:'0 8px 30px rgba(0,0,0,.18)'});
    document.body.append(note); setTimeout(() => note.remove(),2500);
  });
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll(`a[href="${current}"]`).forEach(link => link.setAttribute('aria-current','page'));
}

async function initSearchPage() {
  const host = document.querySelector('[data-search-page-results]');
  if (!host) return;
  const query = new URLSearchParams(location.search).get('q')?.trim() || '';
  const input = document.querySelector('#search-page-input');
  if (input) input.value = query;
  const language = getPageLanguage();
  if (!query) {
    host.innerHTML = language === 'zh'
      ? '<p>请在上方输入研究方向、科研平台、合作机会或其他关键词。</p>'
      : '<p>Enter a research area, facility, opportunity, or other topic above.</p>';
    return;
  }
  const matches = findPages(await loadSearchIndex(), query, language);
  const safeQuery = escapeHTML(query);
  if (language === 'zh') {
    host.innerHTML = matches.length
      ? `<p>找到 ${matches.length} 个与“${safeQuery}”相关的结果</p>${matches.map(item => `<a class="search-result" href="${new URL(item.url, SITE_ROOT_URL).href}"><h2>${escapeHTML(item.title)}</h2><span>查看页面 →</span></a>`).join('')}`
      : `<p>没有找到与“${safeQuery}”匹配的页面。请尝试“研究”“平台”或“招生”等更宽泛的关键词。</p>`;
  } else {
    host.innerHTML = matches.length
      ? `<p>${matches.length} result${matches.length === 1 ? '' : 's'} for “${safeQuery}”</p>${matches.map(item => `<a class="search-result" href="${new URL(item.url, SITE_ROOT_URL).href}"><h2>${escapeHTML(item.title)}</h2><span>View page →</span></a>`).join('')}`
      : `<p>No pages matched “${safeQuery}”. Try a broader term such as “research”, “facility”, or “career”.</p>`;
  }
}

function initHero() {
  const carousel = document.querySelector('.home-carousel');
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll('.home-carousel__wrapper')];
  const dotsHost = carousel.querySelector('.dots');
  const previous = carousel.querySelector('.carousel-arrow.prev');
  const next = carousel.querySelector('.carousel-arrow.next');
  if (slides.length < 2 || !dotsHost || !previous || !next) return;
  let index = Math.max(0, slides.findIndex(slide => slide.classList.contains('active')));
  let timer;
  const playActiveVideo = () => {
    slides.forEach((slide, slideIndex) => {
      slide.querySelectorAll('video').forEach(video => {
        if (slideIndex !== index) {
          video.pause();
          return;
        }
        if (video.readyState === HTMLMediaElement.HAVE_NOTHING) video.load();
        const playback = video.play();
        if (playback) playback.catch(() => {});
      });
    });
  };
  slides.forEach((slide, slideIndex) => {
    slide.setAttribute('aria-hidden', String(slideIndex !== index));
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('role','tab');
    dot.setAttribute('aria-label', `Show featured story ${slideIndex + 1}`);
    dot.addEventListener('click', () => { show(slideIndex); restart(); });
    dotsHost.append(dot);
  });
  const dots = [...dotsHost.querySelectorAll('.carousel-dot')];
  const show = nextIndex => {
    slides[index].classList.remove('active');
    slides[index].setAttribute('aria-hidden','true');
    dots[index].classList.remove('active');
    dots[index].setAttribute('aria-selected','false');
    index = (nextIndex + slides.length) % slides.length;
    slides[index].classList.add('active');
    slides[index].setAttribute('aria-hidden','false');
    dots[index].classList.add('active');
    dots[index].setAttribute('aria-selected','true');
    playActiveVideo();
  };
  const restart = () => {
    clearInterval(timer);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => show(index + 1),5500);
  };
  previous.addEventListener('click', () => { show(index - 1); restart(); });
  next.addEventListener('click', () => { show(index + 1); restart(); });
  dots[index].classList.add('active');
  dots[index].setAttribute('aria-selected','true');
  carousel.addEventListener('mouseenter', () => clearInterval(timer));
  carousel.addEventListener('mouseleave', restart);

  let visibilityFrame = 0;
  const updateControlVisibility = () => {
    visibilityFrame = 0;
    const heroTop = carousel.getBoundingClientRect().top;
    carousel.classList.toggle('controls-visible', heroTop <= 1);
  };
  const requestVisibilityUpdate = () => {
    if (!visibilityFrame) visibilityFrame = window.requestAnimationFrame(updateControlVisibility);
  };
  window.addEventListener('scroll', requestVisibilityUpdate, { passive:true });
  window.addEventListener('resize', requestVisibilityUpdate);
  window.addEventListener('pageshow', playActiveVideo);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) playActiveVideo();
  });
  ['pointerdown','keydown','touchstart'].forEach(eventName => {
    document.addEventListener(eventName, playActiveVideo, { once:true, passive:true });
  });
  updateControlVisibility();
  playActiveVideo();
  restart();
}

function initHomeNews() {
  const items = document.querySelectorAll('.home-news__title-link');
  items.forEach(item => {
    const activate = () => item.classList.add('is-hovered');
    const deactivate = () => item.classList.remove('is-hovered');
    item.addEventListener('pointerenter', activate);
    item.addEventListener('pointerleave', deactivate);
    item.addEventListener('focus', activate);
    item.addEventListener('blur', deactivate);
  });
}

function initHomeCollaboration() {
  const section = document.querySelector('.home-programs__collaboration');
  if (!section) return;
  const targets = [...section.querySelectorAll('[data-collab-reveal]')];
  if (!targets.length) return;
  section.classList.add('js-collab-animate');
  const revealAll = () => targets.forEach(target => target.classList.add('is-visible'));
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    revealAll();
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {rootMargin:'0px 0px -12% 0px',threshold:.12});
  targets.forEach(target => observer.observe(target));
}

document.addEventListener('DOMContentLoaded', async () => {
  const isCN = getPageLanguage() === 'zh';
  const headerFile = isCN ? 'components/header-cn.html?v=20260908-wide1' : 'components/header.html?v=20260908-wide1';
  const footerFile = isCN ? 'components/footer-cn.html?v=20260918-collaboration' : 'components/footer.html?v=20260918-collaboration';
  await Promise.all([loadComponent('[data-component="header"]', headerFile), loadComponent('[data-component="footer"]', footerFile)]);
  initHeader(); initHero(); initHomeNews(); initHomeCollaboration(); initSearchPage();
  document.querySelectorAll('[data-current-year]').forEach(el => el.textContent = new Date().getFullYear());
});

/* Hide skip-link by default, show on keyboard focus - robust version */
(function(){
  function fixSkipLink(link){
    if(link.dataset.skipLinkFixed) return;
    link.dataset.skipLinkFixed = '1';
    link.style.position='fixed';
    link.style.top='0';
    link.style.left='1rem';
    link.style.zIndex='9999';
    link.style.transform='translateY(-200%)';
    link.style.background='#fff';
    link.style.padding='.75rem 1rem';
    link.style.textDecoration='none';
    link.style.color='#000';
    link.style.transition='transform .2s ease';
    link.addEventListener('focus',function(){link.style.transform='translateY(0)';});
    link.addEventListener('blur',function(){link.style.transform='translateY(-200%)';});
  }
  function fixAllSkipLinks(){
    document.querySelectorAll('.skip-link').forEach(fixSkipLink);
  }
  // Fix immediately if already present
  fixAllSkipLinks();
  // Fix when DOM changes (for dynamically loaded headers)
  var observer = new MutationObserver(function(){
    fixAllSkipLinks();
  });
  observer.observe(document.documentElement, {childList:true, subtree:true});
  // Also fix after load
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',fixAllSkipLinks);
  }
  window.addEventListener('load',function(){setTimeout(fixAllSkipLinks,100);});
})();

/* Hide skip-link by default, show on keyboard focus - robust v2 */
(function(){
  function fixSkipLink(link){
    if(link.dataset.skipLinkFixed2) return;
    link.dataset.skipLinkFixed2 = '1';
    // Remove visually-hidden class to avoid !important conflicts
    link.classList.remove('visually-hidden');
    // Use setProperty with !important to override any CSS
    link.style.setProperty('position','fixed','important');
    link.style.setProperty('top','0','important');
    link.style.setProperty('left','1rem','important');
    link.style.setProperty('z-index','9999','important');
    link.style.setProperty('transform','translateY(-200%)','important');
    link.style.setProperty('background','#fff','important');
    link.style.setProperty('padding','.75rem 1rem','important');
    link.style.setProperty('text-decoration','none','important');
    link.style.setProperty('color','#000','important');
    link.style.setProperty('transition','transform .2s ease','important');
    link.style.setProperty('clip','auto','important');
    link.style.setProperty('width','auto','important');
    link.style.setProperty('height','auto','important');
    link.style.setProperty('overflow','visible','important');
    link.addEventListener('focus',function(){
      link.style.setProperty('transform','translateY(0)','important');
    });
    link.addEventListener('blur',function(){
      link.style.setProperty('transform','translateY(-200%)','important');
    });
  }
  function fixAllSkipLinks(){
    document.querySelectorAll('.skip-link').forEach(fixSkipLink);
  }
  fixAllSkipLinks();
  var observer = new MutationObserver(function(){
    fixAllSkipLinks();
  });
  observer.observe(document.documentElement, {childList:true, subtree:true});
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',fixAllSkipLinks);
  }
  window.addEventListener('load',function(){setTimeout(fixAllSkipLinks,100);});
})();
