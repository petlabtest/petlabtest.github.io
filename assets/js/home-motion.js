(function () {
  'use strict';

  if (!document.body || !document.body.classList.contains('home-motion')) return;

  function sequence(root, items, trigger, triggerRatio) {
    if (!root) return;
    root.setAttribute('data-home-sequence', '');
    var targets = [];
    items.filter(Boolean).forEach(function (entry, order) {
      var element = entry.element || entry;
      if (!element) return;
      element.setAttribute('data-home-reveal', '');
      element.setAttribute('data-home-effect', entry.effect || 'fade-up');
      element.style.setProperty('--home-order', String(entry.order == null ? order : entry.order));
      if (entry.delay != null) {
        element.style.setProperty('--home-delay', entry.delay + 'ms');
      }
      targets.push(element);
    });
    root.__homeMotionTargets = targets;
    root.__homeMotionTrigger = trigger || root;
    root.__homeMotionTriggerRatio = triggerRatio == null ? 0.65 : triggerRatio;
  }

  function one(selector, root) {
    return (root || document).querySelector(selector);
  }

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var mission = one('.home-fullwidth__panel');
  sequence(mission, mission ? [
    { element: mission, effect: 'background-mission', order: 0 },
    { element: one('.home-fullwidth__eyebrow', mission), delay: 280 },
    { element: one('h2', mission), delay: 350 },
    { element: one('p:not(.home-fullwidth__eyebrow)', mission), delay: 430 },
    { element: one('.home-fullwidth__cta', mission), effect: 'fade-right', delay: 510 }
  ] : [], mission, 0.74);

  var news = one('.home-news');
  var lead = news && one('.home-news__lead', news);
  var newsItems = news ? all('.home-news__item', news) : [];
  var newsHeading = news && one('.home-news__heading', news);
  sequence(newsHeading, newsHeading ? [
    { element: newsHeading, delay: 0 }
  ] : [], newsHeading, 0.7);
  sequence(lead, lead ? [
    { element: one('.home-news__lead-media', lead), effect: 'wipe-left', delay: 0 },
    { element: one('.home-news__lead-copy', lead), effect: 'wipe-left', delay: 400 }
  ] : [], lead, 0.7);
  newsItems.forEach(function (item, index) {
    sequence(item, [
      { element: item, effect: 'news-row', delay: index * 120 }
    ], item, 0.72);
  });
  var newsFooter = news && one('.home-news__footer', news);
  sequence(newsFooter, newsFooter ? [
    { element: newsFooter, delay: 0 }
  ] : [], newsFooter, 0.82);

  var impact = one('.home-impact');
  var impactFrame = impact && one('.group-content', impact);
  sequence(impact, impact ? [
    { element: impactFrame, effect: 'background-grey', delay: 0 },
    { element: one('.group-content__media', impact), effect: 'wipe-left', delay: 210 },
    { element: one('.group-content__body', impact), effect: 'content-group', delay: 500 }
  ] : [], impactFrame, 0.86);

  var research = one('.research-cards');
  var researchHead = research && one('.research-cards__head', research);
  sequence(research, research ? [
    { element: one('.research-cards__head .eyebrow', research), order: 0 },
    { element: one('.research-cards__head h2', research), order: 1 },
    { element: one('.research-cards__head > p:last-child', research), order: 2 }
  ] : [], researchHead, 0.62);
  var researchGrid = research && one('.research-card-grid', research);
  var researchCards = researchGrid ? all('.research-card', researchGrid) : [];
  sequence(researchGrid, researchGrid ? researchCards.map(function (card, index) {
    return { element: card, effect: 'card-fade', delay: index * 100 };
  }) : [], researchGrid, 0.58);

  var initiative = one('.home-programs__initiative');
  sequence(initiative, initiative ? [
    { element: one('h2', initiative), delay: 0 },
    { element: one('.home-programs__initiative-copy > p', initiative), delay: 90 },
    { element: one('.cta--button', initiative), effect: 'fade-right', delay: 180 },
    { element: one('.home-programs__initiative-accent', initiative), effect: 'card-fade', delay: 120 }
  ] : [], initiative && one('.home-programs__initiative-copy', initiative), 0.42);

  var collaboration = one('.home-programs__collaboration');
  var collaborationLinks = collaboration ? all('.home-programs__collaboration-links > a', collaboration) : [];
  sequence(collaboration, collaboration ? [
    { element: collaboration, effect: 'background-collaboration', delay: 0 },
    { element: one('.home-programs__collaboration-head', collaboration), effect: 'content-group', delay: 330 },
    { element: collaborationLinks[0], effect: 'news-row', delay: 500 },
    { element: collaborationLinks[1], effect: 'news-row', delay: 610 }
  ] : [], collaboration, 0.9);

  var team = one('.home-programs__engage');
  var teamFrame = team && one('.group-content--team', team);
  var teamBody = team && one('.group-content__body', team);
  sequence(team, team ? [
    { element: teamFrame, effect: 'background-grey', delay: 0 },
    { element: one('.group-content__media', team), effect: 'wipe-right', delay: 210 },
    { element: teamBody, effect: 'content-group', delay: 500 }
  ] : [], teamFrame, 0.86);

  var events = one('.home-programs__events');
  var eventsFrame = events && one('.group-content--events', events);
  sequence(events, events ? [
    { element: eventsFrame, effect: 'background-events', delay: 0 },
    { element: one('.group-content__media', events), effect: 'wipe-left', delay: 210 },
    { element: one('.group-content__body', events), effect: 'content-group', delay: 500 }
  ] : [], eventsFrame, 0.86);

  var groups = all('[data-home-sequence]');
  document.body.classList.add('home-motion-ready');

  function reveal(group) {
    if (group.__homeMotionRevealed) return;
    group.__homeMotionRevealed = true;
    group.classList.add('is-home-visible');
    (group.__homeMotionTargets || []).forEach(function (target) {
      target.classList.add('is-home-revealed');
    });
    window.setTimeout(function () {
      group.classList.add('is-home-complete');
      (group.__homeMotionTargets || []).forEach(function (target) {
        target.classList.add('is-home-reveal-complete');
      });
    }, 2200);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    groups.forEach(reveal);
    return;
  }

  var pending = groups.slice();
  var frame = 0;

  function checkGroups() {
    frame = 0;
    pending = pending.filter(function (group) {
      var trigger = group.__homeMotionTrigger || group;
      var triggerLine = window.innerHeight * (group.__homeMotionTriggerRatio || 0.65);
      if (trigger.getBoundingClientRect().top > triggerLine) return true;
      reveal(group);
      return false;
    });
    if (!pending.length) window.removeEventListener('scroll', requestCheck);
  }

  function requestCheck() {
    if (!frame) frame = window.requestAnimationFrame(checkGroups);
  }

  window.addEventListener('scroll', requestCheck, { passive: true });
  window.addEventListener('resize', requestCheck);
  checkGroups();
}());
