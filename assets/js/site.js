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
  const videoHero = slides.find(slide => slide.hasAttribute('data-video-hero'));
  const introVideo = videoHero?.querySelector('video');
  const replay = videoHero?.querySelector('[data-hero-replay]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const playbackControl = carousel.querySelector('.carousel-playback');
  const road = carousel.querySelector('.journey-road__base');
  const roadProgress = carousel.querySelector('.journey-road__progress');
  const roadLight = carousel.querySelector('.journey-road__light');
  let timer;
  let pointerInside = false;
  let focusInside = false;
  let autoPaused = false;
  let pathFrame;
  let pathPosition = index / (slides.length - 1);

  const pathPoint = position => ({ x:80 + 840 * position, y:107 + 16 * Math.sin(3 * Math.PI * position) });
  const pathSamples = Array.from({ length:121 }, (_, i) => pathPoint(i / 120));
  const pathLengths = [0];
  pathSamples.slice(1).forEach((point, i) => {
    pathLengths.push(pathLengths[i] + Math.hypot(point.x - pathSamples[i].x, point.y - pathSamples[i].y));
  });
  if (road) {
    const shape = pathSamples.map((point, i) => `${i ? 'L' : 'M'}${point.x} ${point.y}`).join(' ');
    road.setAttribute('d', shape);
    roadProgress.setAttribute('d', shape);
    roadProgress.setAttribute('stroke-dasharray', pathLengths[120]);
  }
  const drawPath = position => {
    pathPosition = position;
    if (!road) return;
    const point = pathPoint(position);
    const sample = Math.min(119, Math.floor(position * 120));
    const length = pathLengths[sample] + (pathLengths[sample + 1] - pathLengths[sample]) * (position * 120 - sample);
    roadLight.setAttribute('cx', point.x);
    roadLight.setAttribute('cy', point.y);
    roadProgress.setAttribute('stroke-dashoffset', pathLengths[120] - length);
  };
  const movePath = (position, instant = false) => {
    window.cancelAnimationFrame(pathFrame);
    if (!road || instant) return drawPath(position);
    const start = pathPosition;
    const began = performance.now();
    const frame = now => {
      const elapsed = Math.min((now - began) / 800, 1);
      drawPath(start + (position - start) * (1 - Math.pow(1 - elapsed, 3)));
      if (elapsed < 1) pathFrame = window.requestAnimationFrame(frame);
    };
    pathFrame = window.requestAnimationFrame(frame);
  };
  const updatePlaybackControl = () => {
    if (!playbackControl) return;
    playbackControl.setAttribute('aria-pressed', String(autoPaused));
    playbackControl.setAttribute('aria-label', getPageLanguage() === 'zh'
      ? autoPaused ? '继续自动播放' : '暂停自动播放'
      : autoPaused ? 'Resume automatic playback' : 'Pause automatic playback');
  };

  const stopTimer = () => {
    window.clearTimeout(timer);
    timer = undefined;
  };
  const introIsPlaying = () => Boolean(
    videoHero &&
    introVideo &&
    slides[index] === videoHero &&
    !videoHero.classList.contains('is-video-complete')
  );
  const scheduleAdvance = () => {
    stopTimer();
    if (pointerInside || focusInside || autoPaused || document.hidden || reducedMotion.matches || introIsPlaying()) return;
    timer = window.setTimeout(() => show(index + 1), 8000);
  };
  const revealVideoHero = () => {
    if (!videoHero) return;
    videoHero.classList.remove('is-video-pending');
    videoHero.classList.add('is-video-complete');
    carousel.classList.remove('is-video-intro-pending');
    carousel.classList.add('is-video-intro-complete');
    scheduleAdvance();
  };
  const playActiveVideo = () => {
    slides.forEach((slide, slideIndex) => {
      slide.querySelectorAll('video').forEach(video => {
        if (slideIndex !== index) {
          video.pause();
          return;
        }
        if (reducedMotion.matches) {
          video.pause();
          if (slide === videoHero) revealVideoHero();
          return;
        }
        if (slide === videoHero && slide.classList.contains('is-video-complete')) return;
        if (video.readyState === HTMLMediaElement.HAVE_NOTHING) video.load();
        const playback = video.play();
        if (playback) playback.catch(() => {
          if (slide === videoHero) revealVideoHero();
        });
      });
    });
  };
  const handleReducedMotionChange = () => {
    if (reducedMotion.matches) {
      stopTimer();
      carousel.getAnimations({ subtree:true }).forEach(animation => animation.cancel());
      movePath(index / (slides.length - 1), true);
      introVideo?.pause();
      revealVideoHero();
      return;
    }
    playActiveVideo();
    scheduleAdvance();
  };
  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener('change', handleReducedMotionChange);
  } else if (reducedMotion.addListener) {
    reducedMotion.addListener(handleReducedMotionChange);
  }
  slides.forEach((slide, slideIndex) => {
    slide.setAttribute('aria-hidden', String(slideIndex !== index));
    slide.inert = slideIndex !== index;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    const title = (slide.querySelector('.home-carousel__title-text') || slide.querySelector('.home-carousel__title')).textContent.trim();
    dot.setAttribute('aria-label', getPageLanguage() === 'zh' ? `显示：${title}` : `Show: ${title}`);
    if (slide.dataset.pendant) {
      const pendant = document.createElement('img');
      pendant.className = 'carousel-dot__pendant';
      pendant.src = slide.dataset.pendant;
      pendant.alt = '';
      const node = document.createElement('span');
      node.className = 'carousel-dot__node';
      dot.append(pendant, node);
      const point = pathPoint(slideIndex / (slides.length - 1));
      dot.style.left = `${point.x / 10}%`;
      dot.style.top = `${point.y + 4.5}px`;
    }
    dot.addEventListener('click', () => show(slideIndex));
    dotsHost.append(dot);
  });
  const dots = [...dotsHost.querySelectorAll('.carousel-dot')];
  const show = nextIndex => {
    const target = (nextIndex + slides.length) % slides.length;
    if (target === index) return;
    const outgoing = slides[index];
    const incoming = slides[target];
    const wrap = (index === slides.length - 1 && target === 0) || (index === 0 && target === slides.length - 1);
    carousel.getAnimations({ subtree:true }).forEach(animation => animation.cancel());
    slides[index].classList.remove('active');
    slides[index].setAttribute('aria-hidden','true');
    slides[index].inert = true;
    dots[index].classList.remove('active');
    dots[index].removeAttribute('aria-current');
    index = target;
    slides[index].classList.add('active');
    slides[index].setAttribute('aria-hidden','false');
    slides[index].inert = false;
    dots[index].classList.add('active');
    dots[index].setAttribute('aria-current','true');
    if (!reducedMotion.matches) {
      const options = { duration:800, easing:'cubic-bezier(.2,.7,.2,1)' };
      // Keep the complete old image underneath the new one until its fade ends.
      outgoing.animate([
        { opacity:1, visibility:'visible', zIndex:1 },
        { opacity:1, visibility:'visible', zIndex:1 }
      ], options);
      incoming.animate([{ opacity:0 }, { opacity:1 }], options);
      outgoing.querySelector('.home-carousel__copy').animate([
        { opacity:1 }, { opacity:0 }
      ], { duration:220, easing:'ease-out', fill:'forwards' });
      incoming.querySelector('.home-carousel__copy').animate([
        { opacity:0 }, { opacity:1 }
      ], { duration:580, delay:120, fill:'backwards', easing:'ease-out' });
    }
    movePath(index / (slides.length - 1), reducedMotion.matches || wrap);
    playActiveVideo();
    scheduleAdvance();
  };
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  dots[index].classList.add('active');
  dots[index].setAttribute('aria-current','true');
  drawPath(pathPosition);
  updatePlaybackControl();
  playbackControl?.addEventListener('click', () => {
    autoPaused = !autoPaused;
    updatePlaybackControl();
    scheduleAdvance();
  });
  carousel.addEventListener('focusin', () => {
    focusInside = true;
    stopTimer();
  });
  carousel.addEventListener('focusout', () => {
    window.setTimeout(() => {
      focusInside = carousel.contains(document.activeElement);
      scheduleAdvance();
    }, 0);
  });
  carousel.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(index + (event.key === 'ArrowRight' ? 1 : -1));
  });
  carousel.addEventListener('mouseenter', () => {
    pointerInside = true;
    stopTimer();
  });
  carousel.addEventListener('mouseleave', () => {
    pointerInside = false;
    scheduleAdvance();
  });

  if (introVideo && videoHero) {
    introVideo.loop = false;
    introVideo.addEventListener('ended', revealVideoHero);
    introVideo.addEventListener('error', revealVideoHero);
    if (introVideo.ended) revealVideoHero();
  } else {
    revealVideoHero();
  }
  replay?.addEventListener('click', () => {
    if (!introVideo || !videoHero) return;
    stopTimer();
    videoHero.classList.remove('is-video-complete');
    videoHero.classList.add('is-video-pending');
    carousel.classList.remove('is-video-intro-complete');
    carousel.classList.add('is-video-intro-pending');
    introVideo.currentTime = 0;
    const playback = introVideo.play();
    if (playback) playback.catch(revealVideoHero);
  });

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
    scheduleAdvance();
  });
  ['pointerdown','keydown','touchstart'].forEach(eventName => {
    document.addEventListener(eventName, playActiveVideo, { once:true, passive:true });
  });
  updateControlVisibility();
  playActiveVideo();
  scheduleAdvance();
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

document.addEventListener('DOMContentLoaded', async () => {
  // Shared navigation and footer are mounted by app-shell.js on every page.
  // This file now owns page behavior only.
  initHero(); initHomeNews(); initSearchPage();
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
