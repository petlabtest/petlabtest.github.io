import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const pages = [
  'Engage/Engage-ov-cn.html',
  'Engage/Engage-ov-en.html',
].map((path) => ({ path, html: readFileSync(path, 'utf8') }));

const backgroundPath = 'assets/css/engage/engage-overview-background.css';
const layoutPath = 'assets/css/engage/engage-overview-layout.css';
const latePath = 'assets/css/engage/engage-overview-late.css';
const backgroundCss = readFileSync(backgroundPath, 'utf8');
const layoutCss = readFileSync(layoutPath, 'utf8');
const lateCss = readFileSync(latePath, 'utf8');

assert(existsSync('assets/pic/root/media/r010.jpg'), 'callout background image exists');
assert(existsSync('assets/pic/School/xsclg.jpg'), 'category-grid background image exists');
assert.match(backgroundCss, /url\('\.\.\/\.\.\/pic\/root\/media\/r010\.jpg'\)/);
assert.match(layoutCss, /url\('\.\.\/\.\.\/pic\/School\/xsclg\.jpg'\)/);
assert.match(layoutCss, /\.hero--landing-page \.cat-grid \.views-view-responsive-grid\s*\{\s*--views-responsive-grid--column-count:\s*4\s*!important;\s*--views-responsive-grid--cell-min-width:\s*100px;\s*--views-responsive-grid--layout-gap:\s*0px;/);
assert.match(layoutCss, /height:\s*320px\s*!important/);
assert.match(lateCss, /\.ll-figure-box\s*\{\s*opacity:\s*1;\s*\}/);
assert.match(layoutCss, /\.hero-landing-cta-grid > \.engage-overview-project-column\s*\{\s*padding-right:\s*15px;\s*\}/);

for (const { path, html } of pages) {
  const head = html.slice(0, html.indexOf('</head>'));
  const backgroundLink = '../assets/css/engage/engage-overview-background.css?v=20260929-1';
  const layoutLink = '../assets/css/engage/engage-overview-layout.css?v=20260930-4';
  assert.equal(html.split(backgroundLink).length - 1, 1, `${path}: one shared background link`);
  assert.equal(html.split(layoutLink).length - 1, 1, `${path}: one shared layout link`);
  assert(head.indexOf(backgroundLink) < head.indexOf('../assets/css/engage/r012.css'), `${path}: background remains before theme CSS`);
  assert(head.indexOf('../assets/css/news/news-overview-components.css') < head.indexOf(layoutLink), `${path}: layout remains after component CSS`);
  assert(head.indexOf(layoutLink) < head.indexOf('../assets/css/archive-consistency.css'), `${path}: layout remains before archive consistency overrides`);
  if (head.includes('../assets/css/cn-link-label.css')) {
    assert(head.indexOf(layoutLink) < head.indexOf('../assets/css/cn-link-label.css'), `${path}: layout remains before localized link labels`);
  }
  assert(!head.includes('.paragraph--type-figure-callout-section {'), `${path}: background rules moved out of HTML`);
  assert(!head.includes('.paragraph--type-p-masonry-grid-socials {'), `${path}: layout rules moved out of HTML`);
  const lateLink = '../assets/css/engage/engage-overview-late.css?v=20260930-1';
  assert.equal(html.split(lateLink).length - 1, 1, `${path}: one late figure override stylesheet`);
  assert(html.indexOf(lateLink) < html.indexOf('paragraph--type-figure-callout-section'), `${path}: late figure override loads before its figure component`);
  assert(!/<style\b/i.test(html), `${path}: page skin remains externalized`);
  assert.equal((html.match(/class="engage-overview-project-column"/g) || []).length, 1, `${path}: the project intro column retains its semantic spacing owner`);
  assert.doesNotMatch(html, /style="padding-right:\s*15px;"/, `${path}: project-column spacing should not return inline`);
  assert.doesNotMatch(html, /class="views-view-responsive-grid views-view-responsive-grid--horizontal"\s*style=/, `${path}: all category-grid variables should remain in shared CSS`);
}

console.log('Engage Overview bilingual shared CSS contract passed (2 pages).');
