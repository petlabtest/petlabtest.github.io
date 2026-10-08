(function () {
  'use strict';

  var currentScript = document.currentScript;
  var siteRoot = new URL('../../', currentScript.src);
  var version = '20261008-light-inner7';
  var state = window.PETLAB_APP_SHELL || {};
  state.version = version;
  state.siteRoot = siteRoot.href;
  state.ready = false;
  window.PETLAB_APP_SHELL = state;

  function isChinesePage() {
    return document.documentElement.lang.toLowerCase().startsWith('zh') || /-cn\.html$/i.test(location.pathname);
  }

  function componentHost(kind) {
    return document.querySelector('[data-app-shell="' + kind + '"], #petlab-' + kind + ', [data-component="' + kind + '"]');
  }

  function isolateLegacyPrimaryMenu() {
    var headerHost = componentHost('header');
    var behavior = window.Drupal && window.Drupal.behaviors && window.Drupal.behaviors.menuPrimary;
    if (!headerHost || document.querySelector('.button--menu') || !behavior || typeof behavior.attach !== 'function') return;

    // The AppShell header lives in Shadow DOM; the legacy Drupal menu behavior cannot query it.
    behavior.attach = function () {};
  }

  function rewriteMarkupUrls(root) {
    root.querySelectorAll('[src], [href], form[action]').forEach(function (node) {
      ['src', 'href', 'action'].forEach(function (attribute) {
        var value = node.getAttribute(attribute);
        if (!value || /^(?:#|[a-z][a-z\d+.-]*:|\/)/i.test(value)) return;
        node.setAttribute(attribute, new URL(value, siteRoot).href);
      });
    });
  }

  function rewriteCssUrls(css) {
    return css
      .replace(/url\((['"]?)\.\.\/([^'")]+)\1\)/g, function (_, quote, path) {
        return 'url(' + quote + new URL('assets/' + path, siteRoot).href + quote + ')';
      })
      .replace(/:root\b/g, ':host');
  }

  var hoverTimer;

  function closeNavigation(root, except, immediate) {
    clearTimeout(hoverTimer);
    var animate = !immediate && matchMedia('(min-width: 1101px) and (prefers-reduced-motion: no-preference)').matches;
    root.querySelectorAll('.nav-group.open, .nav-group.closing, .nav-group.dismissed').forEach(function (group) {
      if (group === except) return;
      clearTimeout(group.closeTimer);
      var visible = group.classList.contains('open') || group.classList.contains('closing');
      group.classList.remove('open', 'revealed', 'dismissed');
      var panel = group.querySelector('.mega-menu');
      if (panel) { panel.inert = true; panel.setAttribute('aria-hidden', 'true'); }
      if (visible && animate) {
        group.classList.add('closing');
        group.closeTimer = setTimeout(function () { group.classList.remove('closing'); }, 200);
      } else group.classList.remove('closing');
      var trigger = group.querySelector(':scope > .nav-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
    if (!except) root.querySelector('[data-site-header]').classList.remove('primary-menu-active');
  }

  function initHeader(root) {
    var header = root.querySelector('[data-site-header]');
    if (!header) return;
    var searchToggle = root.querySelector('[data-header-search-toggle]');
    var searchInput = root.querySelector('.header-search input');
    function closeSearch() {
      header.classList.remove('search-active');
      searchToggle.setAttribute('aria-expanded', 'false');
    }
    searchToggle.addEventListener('click', function () {
      var opening = !header.classList.contains('search-active');
      closeNavigation(root);
      header.classList.toggle('search-active', opening);
      searchToggle.setAttribute('aria-expanded', String(opening));
      if (opening) searchInput.focus();
    });
    root.querySelector('[data-header-search-close]').addEventListener('click', function () {
      closeSearch();
      searchToggle.focus();
    });

    root.querySelectorAll('.nav-group').forEach(function (group) {
      var trigger = group.querySelector(':scope > .nav-trigger');
      function openGroup() {
        closeSearch();
        closeNavigation(root, group);
        clearTimeout(group.closeTimer);
        group.classList.remove('dismissed', 'closing');
        group.classList.add('open');
        var panel = group.querySelector('.mega-menu');
        panel.inert = false;
        panel.removeAttribute('aria-hidden');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
        header.classList.toggle('primary-menu-active', Boolean(group.closest('.primary-nav')));
        header.style.setProperty('--menu-height', panel.getBoundingClientRect().height + 'px');
        group.classList.add('revealed');
      }
      function closeGroup() {
        closeNavigation(root);
      }
      function supportsHover() {
        return matchMedia('(min-width: 1101px) and (hover: hover) and (pointer: fine)').matches;
      }
      group.addEventListener('mouseenter', function () {
        clearTimeout(hoverTimer);
        if (!supportsHover() || group.classList.contains('dismissed')) return;
        hoverTimer = setTimeout(openGroup, 150);
      });
      group.addEventListener('mouseleave', function () {
        clearTimeout(hoverTimer);
        if (!supportsHover()) return;
        hoverTimer = setTimeout(function () { closeNavigation(root); }, 220);
      });
      if (trigger) trigger.addEventListener('click', function (event) {
        event.stopPropagation();
        var opening = !group.classList.contains('open');
        if (opening) openGroup(); else closeGroup();
      });
      if (trigger) trigger.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowDown') return;
        event.preventDefault();
        openGroup();
        group.querySelector('.mega-menu a').focus();
      });
    });

    root.querySelectorAll('[data-menu-close]').forEach(function (button) {
      button.addEventListener('click', function () {
        clearTimeout(hoverTimer);
        var group = button.closest('.nav-group');
        if (!group) return;
        closeNavigation(root);
        group.classList.add('dismissed');
        var trigger = group.querySelector(':scope > .nav-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        header.classList.remove('primary-menu-active');
        if (trigger) trigger.focus();
      });
    });

    var menuToggle = root.querySelector('[data-menu-toggle]');
    if (menuToggle) menuToggle.addEventListener('click', function () {
      closeSearch();
      var active = header.classList.toggle('menu-active');
      if (!active) closeNavigation(root);
      menuToggle.setAttribute('aria-expanded', String(active));
      document.body.classList.toggle('menu-open', active);
    });

    document.addEventListener('click', function (event) {
      if (event.composedPath().includes(root.host)) return;
      closeNavigation(root);
      closeSearch();
    });
    root.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      var group = root.querySelector('.nav-group.open');
      var target = header.classList.contains('menu-active') ? menuToggle
        : header.classList.contains('search-active') ? searchToggle
        : group ? group.querySelector('.nav-trigger') : menuToggle;
      closeNavigation(root);
      if (group) group.classList.add('dismissed');
      closeSearch();
      header.classList.remove('menu-active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      if (target) target.focus();
    });
    matchMedia('(min-width: 1101px)').addEventListener('change', function () {
      closeNavigation(root, null, true);
      closeSearch();
      header.classList.remove('menu-active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    });

    window.addEventListener('resize', function () {
      var panel = root.querySelector('.nav-group.open .mega-menu');
      if (panel) header.style.setProperty('--menu-height', panel.getBoundingClientRect().height + 'px');
    });

    var currentUrl = new URL(location.href);
    root.querySelectorAll('a[href]').forEach(function (link) {
      try {
        var target = new URL(link.href);
        if (target.origin === currentUrl.origin && target.pathname === currentUrl.pathname) {
          link.setAttribute('aria-current', 'page');
        }
      } catch (_) {}
    });
  }

  async function mount(kind, componentPath, cssText, headerLayoutCssText) {
    var host = componentHost(kind);
    if (!host) return null;
    if (kind === 'header') {
      host.dataset.headerTheme = document.body.classList.contains('home') ? 'hero' : 'light';
      host.dataset.headerLanguage = isChinesePage() ? 'cn' : 'en';
    }
    host.setAttribute('data-app-shell', kind);
    host.classList.add('petlab-component-host');
    var response = await fetch(new URL(componentPath, siteRoot));
    if (!response.ok) throw new Error(componentPath + ': ' + response.status);
    var shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    shadow.replaceChildren();
    var style = document.createElement('style');
    style.textContent = cssText;
    shadow.appendChild(style);
    var template = document.createElement('template');
    template.innerHTML = await response.text();
    if (kind === 'header') {
      var layoutStyle = template.content.querySelector('style[data-research-menu-layout]');
      if (!layoutStyle) throw new Error('Header layout style slot missing');
      layoutStyle.textContent = headerLayoutCssText;
    }
    var content = template.content.cloneNode(true);
    rewriteMarkupUrls(content);
    shadow.appendChild(content);
    if (kind === 'header') initHeader(shadow);
    if (kind === 'footer') {
      var year = shadow.querySelector('[data-current-year]');
      if (year) year.textContent = String(new Date().getFullYear());
    }
    host.setAttribute('data-app-shell-ready', '');
    return host;
  }

  async function init() {
    isolateLegacyPrimaryMenu();
    var chinese = isChinesePage();
    var responses = await Promise.all([
      fetch(new URL('assets/css/site.css?v=20260908-wide1', siteRoot)),
      fetch(new URL('assets/css/header-layout-shared.css?v=' + version, siteRoot)),
      fetch(new URL(chinese
        ? 'assets/css/header-layout-cn.css?v=' + version
        : 'assets/css/header-layout-en.css?v=' + version, siteRoot))
    ]);
    if (!responses[0].ok) throw new Error('site.css: ' + responses[0].status);
    if (!responses[1].ok) throw new Error('header-layout-shared.css: ' + responses[1].status);
    if (!responses[2].ok) throw new Error('localized header layout: ' + responses[2].status);
    var cssText = rewriteCssUrls(await responses[0].text());
    var sharedHeaderCssText = await responses[1].text();
    var localizedHeaderCssText = await responses[2].text();
    var layoutMarker = '/* PETLAB:HEADER_LAYOUT_SHARED */';
    if (localizedHeaderCssText.split(layoutMarker).length !== 2) throw new Error('Shared header layout marker missing');
    var headerLayoutCssText = localizedHeaderCssText.replace(layoutMarker, sharedHeaderCssText);
    var suffix = chinese ? '-cn.html' : '.html';
    await Promise.all([
      mount('header', 'components/header' + suffix + '?v=' + version, cssText, headerLayoutCssText),
      mount('footer', 'components/footer' + suffix + '?v=' + version, cssText)
    ]);
    state.ready = true;
    document.dispatchEvent(new CustomEvent('petlab:app-shell-ready', { detail: { language: chinese ? 'zh-CN' : 'en' } }));
  }

  function showFailure(error) {
    console.error('Unable to load PETLab AppShell', error);
    ['header', 'footer'].forEach(function (kind) {
      var host = componentHost(kind);
      if (!host) return;
      host.setAttribute('data-app-shell-error', '');
      if (kind === 'header') host.textContent = isChinesePage()
        ? '公共导航加载失败，请刷新页面。'
        : 'Shared navigation failed to load. Please refresh the page.';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init().catch(showFailure); }, { once: true });
  } else {
    init().catch(showFailure);
  }
}());
