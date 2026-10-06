import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shared = fs.readFileSync(path.join(root, 'assets/css/news/news-overview-layout.css'), 'utf8');
const english = fs.readFileSync(path.join(root, 'assets/css/news/news-overview-en-overrides.css'), 'utf8');
const heroMedia = fs.readFileSync(path.join(root, 'assets/css/news/news-overview-hero-media.css'), 'utf8');
assert(shared.length > 27000, 'shared News Overview layout should retain the full base layer');
assert(!/url\s*\(|@import/i.test(shared), 'shared CSS should have no rebased resources');
assert(shared.includes('.people-stories-section') && shared.includes('.conference-panel'), 'major page sections should remain in shared CSS');
assert.match(shared, /\.people-stories-section\s*\{[^}]*margin-top:\s*-2rem;/s, 'people-stories overlap spacing should be owned by the shared component rule');
assert.match(shared, /\.conference-panel \.conf-card p\s*\{\s*font-size:\s*1\.1rem !important;\s*line-height:\s*1\.6 !important;\s*font-weight:\s*400;/, 'conference body weight remains explicit after inline cleanup');
assert.match(shared, /#news_event_focus \.events-card-title\s*\{[^}]*font-size:\s*1\.2rem;[^}]*font-weight:\s*600;/, 'event card title typography has a shared owner');
assert.match(shared, /html\[lang="zh-CN"\] #news_event_focus \.events-card-desc\s*\{\s*font-size:\s*1rem;\s*line-height:\s*0\.7;/, 'Chinese event description keeps its established line-height in shared CSS');
assert.match(shared, /html\[lang="en"\] #news_event_focus \.events-card-desc\s*\{\s*font-size:\s*1rem;\s*line-height:\s*1\.6;/, 'English event description keeps its established line-height in shared CSS');
assert.match(shared, /\.conference-panel \.conf-card p:last-of-type\s*\{\s*font-size:\s*\.95rem !important;\s*margin-top:\s*\.8rem;/, 'conference narrative spacing has a shared owner');
assert.match(shared, /\.conference-panel \.conf-card h3\s*\{\s*font-size:\s*1\.35rem !important;\s*line-height:\s*1\.35 !important;\s*margin-bottom:\s*1\.2rem;\s*font-weight:\s*500;/, 'conference slide title typography has a shared owner');
assert.match(shared, /\.news-overview-hero-photo-wrap\s*\{\s*display:\s*flex;\s*\}/, 'hero photo row wrappers have a shared layout owner');
assert.match(heroMedia, /\.news-overview-hero-photo\s*\{\s*width:\s*100%;\s*object-position:\s*center;\s*object-fit:\s*cover;\s*background:\s*#eee;\s*\}/, 'hero photo crop and surface are owned by the dedicated shared stylesheet');
assert.match(heroMedia, /\.news-overview-hero-photo--short\s*\{\s*height:\s*10rem;\s*\}/, 'short hero photos retain their original height');
assert.match(heroMedia, /\.news-overview-hero-photo--medium\s*\{\s*height:\s*12rem;\s*\}/, 'medium hero photos retain their original height');
assert.match(heroMedia, /\.news-overview-intro\s*\{\s*background:\s*var\(--theme-color1\);\s*padding:\s*3rem 0 0 9rem;\s*margin-bottom:\s*7rem;\s*\}/, 'intro band background and geometry remain shared');
assert.match(heroMedia, /\.news-overview-intro__inner\s*\{\s*display:\s*flex;\s*flex-direction:\s*row;\s*align-items:\s*flex-start;\s*margin:\s*0 auto;\s*\}/, 'intro columns retain their original flex layout');
assert.match(heroMedia, /\.news-overview-intro__title\s*\{[^}]*font-size:\s*4rem;[^}]*margin-top:\s*12rem;[^}]*width:\s*34rem;/, 'intro heading geometry remains shared');
assert.match(heroMedia, /\.news-overview-intro__description\s*\{[^}]*font-size:\s*1\.2rem;[^}]*width:\s*85%;[^}]*line-height:\s*2\.5rem;/, 'intro description typography remains shared');
assert.match(heroMedia, /\.news-overview-intro__photos\s*\{[^}]*flex:\s*0\.63;[^}]*gap:\s*1rem;[^}]*margin-bottom:\s*-4rem;/, 'intro photo column spacing remains shared');
assert.match(shared, /#news_event_focus\s*\{\s*margin-top:\s*4rem;\s*\}/, 'academic events section spacing has a shared owner');
assert.match(shared, /\.conference-panel \.conf-card:nth-of-type\(2\) h3\s*\{\s*margin-bottom:\s*1\.1rem;/, 'second conference slide retains its distinct title spacing');
assert.match(shared, /\.conference-panel \.conf-card\s*\{\s*display:\s*none;\s*transform:\s*none;/, 'inactive conference cards are hidden by shared CSS');
assert.match(shared, /\.conference-panel \.conf-card\.is-active\s*\{\s*display:\s*block;/, 'active conference card visibility has a shared owner');
assert.match(shared, /\.conference-carousel-controls\s*\{[^}]*position:\s*absolute;[^}]*bottom:\s*20px;[^}]*transform:\s*translateX\(-50%\);/, 'conference carousel controls have a shared positioning owner');
assert.match(shared, /\.conference-carousel-dots \.conf-dot\.is-active\s*\{\s*opacity:\s*1;/, 'active carousel indicator appearance has a shared owner');
assert.match(shared, /\.conference-carousel\s*\{\s*--conference-panel-shift:[^;]+;\s*position:\s*relative;/, 'conference carousel positioning has a shared owner');
assert.match(shared, /\.conference-panel\s*\{[^}]*background:\s*#0f4c81;\s*color:\s*#fff;/, 'conference panel colors have a shared owner');
assert.match(shared, /\.conference-image-layer #conf-track\s*\{\s*display:\s*flex;\s*height:\s*100% !important;\s*transition:\s*transform \.5s;/, 'conference track transition is bound to shared CSS');
assert.match(shared, /\.conference-image-layer #conf-track>div\s*\{\s*width:\s*100%;\s*height:\s*100% !important;\s*flex-shrink:\s*0;/, 'conference slide sizing has a shared owner');
assert.match(shared, /\.focus-news-title,\s*\.tc-pt-b-title\s*\{[^}]*font-size:\s*23px !important;/, 'overview section title font size has a shared owner');
assert.match(shared, /\.focus-news-title,\s*\.tc-pt-b-title\s*\{\s*margin-right:\s*0 !important;\s*margin-left:\s*0 !important;/, 'overview section title horizontal alignment has a shared owner');
assert.match(shared, /\.latest-news-section \.updt3-grid\s*\{[^}]*margin-top:\s*0 !important;/, 'latest-news grid vertical spacing has a shared owner');
assert.match(shared, /#news_event_focus \.tc-pt-b-grid-3\s*\{[^}]*margin-top:\s*0 !important;/, 'event grid vertical spacing has a shared owner');
assert.match(shared, /\.people-stories-section\s*\{[^}]*position:\s*relative;/, 'people stories section positioning has a shared owner');
assert.match(shared, /\.people-stories-inner>\.dc-video-grid\s*\{[^}]*margin-top:\s*0 !important;/, 'people stories video grid vertical spacing has a shared owner');
assert(english.includes('min-height: 4.2em') && english.includes('height: 34rem !important'), 'English differences should remain');
assert.match(english, /\.news-overview-main\s*\{\s*width:\s*min\(68vw, 1088px\) !important;\s*margin:\s*0 auto !important;/, 'English main geometry remains owned by its compatibility override');
assert(/@media \(max-width: 900px\)[\s\S]*height: auto !important/.test(english), 'English conference panel should stay auto-height on narrow screens');

for (const language of ['cn', 'en']) {
  const file = `News/News-ov-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const sharedLink = html.indexOf('../assets/css/news/news-overview-layout.css?v=20261003-shell2');
  const archive = html.indexOf('../assets/css/archive-consistency.css');
  assert(sharedLink > 0 && sharedLink < html.indexOf('</head>'), `${file}: shared CSS should remain in head`);
  assert(sharedLink < archive, `${file}: archive layer should remain later`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: former large inline layer should be removed`);
  assert.equal((html.match(/\bstyle\s*=/gi) || []).length, 0, `${file}: static News Overview markup should remain free of inline style attributes`);
  assert.match(html, /<main id="main-content" class="news-overview-main">/, `${file}: overview main should use the shared layout class without inline geometry`);
  assert.equal((html.match(/class="news-overview-hero-photo news-overview-hero-photo--short"/g) || []).length, 2, `${file}: two hero photos should use the short geometry variant`);
  assert.equal((html.match(/class="news-overview-hero-photo news-overview-hero-photo--medium"/g) || []).length, 1, `${file}: one hero photo should use the medium geometry variant`);
  assert.equal((html.match(/class="news-overview-hero-photo[^"]*"[^>]*style=/g) || []).length, 0, `${file}: hero photo styles should not return inline`);
  assert(html.includes('news-overview-hero-media.css?v=20261002-hero2'), `${file}: dedicated intro and hero media CSS should be linked`);
  assert.equal((html.match(/class="news-overview-intro(?:__[a-z]+)?"/g) || []).length, 6, `${file}: intro band should use its six shared semantic classes`);
  assert.equal((html.match(/class="news-overview-intro(?:__[a-z]+)?"[^>]*style=/g) || []).length, 0, `${file}: intro geometry should not return inline`);
  assert.equal((html.match(/<p style="line-height:1\.6; font-size: 1rem;font-weight: 400;">/g) || []).length, 0, `${file}: shared conference paragraph styling should not return inline`);
  assert.equal((html.match(/<h3 class="events-card-title"[^>]*style=/g) || []).length, 0, `${file}: event card title styles should stay in shared CSS`);
  assert.equal((html.match(/<div class="events-card-desc"[^>]*style=/g) || []).length, 0, `${file}: event description styles should stay in shared CSS`);
  assert.equal((html.match(/<img src="\.\.\/assets\/pic\/archive-news\/event[123]\.png" style=/g) || []).length, 0, `${file}: event image sizing should stay in shared CSS`);
  assert.equal((html.match(/<p style="line-height:1\.6; font-size: 0\.[78]rem;font-weight: 400;(?: margin-top:0\.8rem;)?">/g) || []).length, 0, `${file}: conference narrative typography should stay in shared CSS`);
  assert.equal((html.match(/<h3 style="font-size:1\.2rem; margin-bottom:1\.[12]rem; font-weight: 500;">/g) || []).length, 0, `${file}: conference slide title styles should stay in shared CSS`);
  assert.equal((html.match(/<div class="conf-card(?: is-active)?" style=/g) || []).length, 0, `${file}: conference card visibility should be represented by classes`);
  assert.equal((html.match(/class="conference-carousel-controls"[^>]*style=|class="conference-carousel-dots"[^>]*style=|class="conf-dot(?: is-active)?"\s*style=/g) || []).length, 0, `${file}: carousel control visuals should stay in shared CSS`);
  assert.equal((html.match(/class="conference-(?:stage|shell|carousel|panel)"[^>]*style=/g) || []).length, 0, `${file}: conference structure geometry and panel colors should stay in shared CSS`);
  assert.equal((html.match(/class="conference-image-layer"[^>]*style=|id="conf-track" style=|<div style="width:100%; height:100%; flex-shrink:0;">|<img src="\.\.\/assets\/pic\/archive-news\/conf[123]\.jpg" style=/g) || []).length, 0, `${file}: static conference image-track geometry should stay in shared CSS`);
  assert(html.includes("dot.classList.toggle('is-active', i === currentIndex);"), `${file}: carousel logic should update the active indicator class`);
  const carouselScript = html.match(/<script>\s*\(function \(\) \{\s*const track = document\.getElementById\('conf-track'\);([\s\S]*?)\}\(\)\);\s*<\/script>/);
  assert(carouselScript, `${file}: carousel controller should remain embedded`);
  const track = { style: {} };
  const cards = Array.from({ length: 3 }, () => ({
    active: false,
    classList: { toggle(name, active) { assert.equal(name, 'is-active'); this.owner.active = active; } },
  }));
  cards.forEach((card) => { card.classList.owner = card; });
  const dotHandlers = [];
  const dots = Array.from({ length: 3 }, () => ({
    active: false,
    classList: { toggle(name, active) { assert.equal(name, 'is-active'); this.owner.active = active; } },
    addEventListener(type, handler) { dotHandlers.push(handler); },
  }));
  dots.forEach((dot) => { dot.classList.owner = dot; });
  const handlers = new Map();
  const buttons = new Map([
    ['conf-prev', { addEventListener(type, handler) { handlers.set('prev', handler); } }],
    ['conf-next', { addEventListener(type, handler) { handlers.set('next', handler); } }],
  ]);
  const document = {
    getElementById(id) { return id === 'conf-track' ? track : buttons.get(id); },
    querySelectorAll(selector) { return selector === '.conf-card' ? cards : dots; },
  };
  vm.runInNewContext(carouselScript[0].replace(/^<script>|<\/script>$/g, ''), { document });
  const click = (handler) => handler({ preventDefault() {} });
  assert.equal(track.style.transform, 'translateX(-0%)', `${file}: initial slide should be selected`);
  assert.deepEqual(cards.map((card) => card.active), [true, false, false], `${file}: initial card visibility should be preserved`);
  assert.deepEqual(dots.map((dot) => dot.active), [true, false, false], `${file}: initial active indicator should be preserved`);
  click(handlers.get('next'));
  assert.equal(track.style.transform, 'translateX(-100%)', `${file}: next control should advance the image track`);
  assert.deepEqual(cards.map((card) => card.active), [false, true, false], `${file}: next control should switch the text card`);
  assert.deepEqual(dots.map((dot) => dot.active), [false, true, false], `${file}: next control should switch active indicator class`);
  click(handlers.get('prev'));
  assert.equal(track.style.transform, 'translateX(-0%)', `${file}: previous control should return to the first slide`);
  click(dotHandlers[2]);
  assert.equal(track.style.transform, 'translateX(-200%)', `${file}: selecting a dot should switch the image track`);
  assert.deepEqual(cards.map((card) => card.active), [false, false, true], `${file}: selecting a dot should switch the text card`);
  assert.deepEqual(dots.map((dot) => dot.active), [false, false, true], `${file}: selecting a dot should switch active indicator class`);
  const styledHeadings = html.match(/<h2\b[^>]*class="(?:focus-news-title|tc-pt-b-title) section-heading-match"[^>]*style=/g) || [];
  assert.equal(styledHeadings.length, 0, `${file}: section headings should not carry the ineffective static-position z-index inline`);
  assert.equal((html.match(/class="(?:updt3-grid|tc-pt-b-grid-3|dc-video-grid)" style="margin-top: -2rem;"/g) || []).length, 0, `${file}: shared grids should not carry overridden negative margins inline`);
  assert.equal((html.match(/class="news-overview-hero-photo-wrap"/g) || []).length, 3, `${file}: all three hero photos retain their flex wrapper`);
  assert.doesNotMatch(html, /id="news_event_focus"[^>]*style=/, `${file}: academic events spacing should remain in shared CSS`);
  assert.equal((html.match(/class="[^"]*people-stories-section"\s*style=/g) || []).length, 0, `${file}: people-section overlap should be owned by shared CSS`);
  const override = html.indexOf('../assets/css/news/news-overview-en-overrides.css?v=20260929-shared3');
  if (language === 'en') assert(sharedLink < override && override < archive, `${file}: English override should follow shared CSS`);
  else assert.equal(override, -1, `${file}: English override should not load in Chinese page`);
}

process.stdout.write('PASS: News Overview bilingual layout is shared with ordered English-only overrides.\n');
