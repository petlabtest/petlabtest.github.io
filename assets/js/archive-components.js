(function () {
  'use strict';

  // Hide skip-link by default, show on focus
  function hideSkipLink() {
    document.querySelectorAll('.skip-link').forEach(function (link) {
      link.style.position = 'fixed';
      link.style.top = '0';
      link.style.left = '1rem';
      link.style.zIndex = '9999';
      link.style.transform = 'translateY(-200%)';
      link.style.background = '#fff';
      link.style.padding = '.75rem 1rem';
      link.style.textDecoration = 'none';
      link.style.color = '#000';
      link.style.transition = 'transform .2s ease';
      link.addEventListener('focus', function () {
        link.style.transform = 'translateY(0)';
      });
      link.addEventListener('blur', function () {
        link.style.transform = 'translateY(-200%)';
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideSkipLink);
  } else {
    hideSkipLink();
  }

  var script = document.currentScript;
  var siteRoot = new URL('../../', script.src);
  var componentCss = new URL('assets/css/site.css?v=20260908-wide1', siteRoot);

  function rewriteUrls(shadow) {
    shadow.querySelectorAll('[src], [href]').forEach(function (node) {
      ['src', 'href'].forEach(function (attribute) {
        var value = node.getAttribute(attribute);
        if (!value || /^(?:#|https?:|mailto:|tel:|javascript:|\/)/i.test(value)) return;
        node.setAttribute(attribute, new URL(value, siteRoot).href);
      });
    });
  }

  function initHeader(shadow) {
    var header = shadow.querySelector('[data-site-header]');
    if (!header) return;
    var groups = shadow.querySelectorAll('.nav-group');

    function closeAll(except) {
      groups.forEach(function (group) {
        if (group === except) return;
        group.classList.remove('open', 'dismissed');
        var trigger = group.querySelector(':scope > .nav-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }

    groups.forEach(function (group) {
      var timer;
      var trigger = group.querySelector(':scope > .nav-trigger');

      group.addEventListener('mouseenter', function () {
        if (!matchMedia('(min-width: 1101px)').matches) return;
        clearTimeout(timer);
        closeAll(group);
        group.classList.remove('dismissed');
        group.classList.add('open');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
      });
      group.addEventListener('mouseleave', function () {
        if (!matchMedia('(min-width: 1101px)').matches) return;
        timer = setTimeout(function () {
          group.classList.remove('open', 'dismissed');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        }, 180);
      });
      if (trigger) {
        trigger.addEventListener('click', function () {
          if (matchMedia('(min-width: 1101px)').matches) {
            closeAll(group);
            group.classList.remove('dismissed');
            group.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
            return;
          }
          var opening = !group.classList.contains('open');
          closeAll(group);
          group.classList.toggle('open', opening);
          trigger.setAttribute('aria-expanded', String(opening));
        });
      }
    });

    shadow.querySelectorAll('[data-menu-close]').forEach(function (button) {
      button.addEventListener('click', function () {
        var group = button.closest('.nav-group');
        if (!group) return;
        group.classList.remove('open');
        group.classList.add('dismissed');
        var trigger = group.querySelector(':scope > .nav-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    });

    var menuToggle = shadow.querySelector('[data-menu-toggle]');
    if (menuToggle) {
      menuToggle.addEventListener('click', function () {
        var active = header.classList.toggle('menu-active');
        menuToggle.setAttribute('aria-expanded', String(active));
      });
    }
  }

  async function mount(hostId, componentPath, isHeader) {
    var host = document.getElementById(hostId);
    if (!host) return;
    try {
      var responses = await Promise.all([
        fetch(new URL(componentPath, siteRoot)),
        fetch(componentCss)
      ]);
      if (!responses[0].ok || !responses[1].ok) throw new Error('Component request failed');

      var shadow = host.attachShadow({ mode: 'open' });
      var style = document.createElement('style');
      var css = await responses[1].text();
      css = css.replace(/url\((['"]?)\.\.\/([^'")]+)\1\)/g, function (_, quote, path) {
        return 'url(' + quote + new URL('assets/' + path, siteRoot).href + quote + ')';
      });
      style.textContent = css.replace(/^:root\s*\{/, ':host {');
      shadow.appendChild(style);

      var content = document.createElement('div');
      content.innerHTML = await responses[0].text();
      while (content.firstChild) shadow.appendChild(content.firstChild);
      rewriteUrls(shadow);

      if (isHeader) {
        initHeader(shadow);
      } else {
        var year = shadow.querySelector('[data-current-year]');
        if (year) year.textContent = String(new Date().getFullYear());
      }
    } catch (error) {
      host.textContent = '';
      console.error('Unable to load PETLab component', error);
    }
  }

  var headerComponent = /-cn\.html$/i.test(location.pathname) || /\/index-cn\.html$/i.test(location.pathname)
    ? 'components/header-cn.html?v=20260920-programs1'
    : 'components/header.html?v=20260920-programs1';
  var footerComponent = /-cn\.html$/i.test(location.pathname) || /\/index-cn\.html$/i.test(location.pathname)
    ? 'components/footer-cn.html?v=20260830-1'
    : 'components/footer.html?v=20260830-1';

  Promise.all([
    mount('petlab-header', headerComponent, true),
    mount('petlab-footer', footerComponent, false)
  ]);
}());
