import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pages = [
  'Research/Research-Publication-cn.html',
  'Research/Research-Publication-en.html',
].map((path) => ({ path, html: readFileSync(path, 'utf8') }));
const link = '../assets/css/research/research-publication-links.css?v=20260929-1';
const titleLink = '../assets/css/research/publication/late-title-hero.css?v=20260929-late1';
const css = readFileSync('assets/css/research/research-publication-links.css', 'utf8');
const titleCss = readFileSync('assets/css/research/publication/late-title-hero.css', 'utf8');
assert.match(titleCss, /#block-dpet-theme-page-title\s*\{/);

for (const selector of [
  '.authors-more__link',
  '.publication-list__primary-tag',
  '.info__value--list',
  '.flex-column a:hover',
]) {
  assert(css.includes(selector), `shared CSS retains ${selector}`);
}

for (const { path, html } of pages) {
  const head = html.slice(0, html.indexOf('</head>'));
  assert.equal(html.split(link).length - 1, 1, `${path}: one shared stylesheet link`);
  assert(head.indexOf('../assets/css/template10/r025.css') < head.indexOf(link), `${path}: shared rules follow the legacy publication theme`);
  assert(head.indexOf(link) < head.indexOf('../assets/css/archive-consistency.css'), `${path}: original cascade position retained`);
  assert(!head.includes('.authors-more__link'), `${path}: duplicated head style block removed`);
  assert.equal(html.split(titleLink).length - 1, 1, `${path}: late title stylesheet retained once`);
  assert(html.indexOf(titleLink) > html.indexOf('</head>'), `${path}: late title layer should remain after the head styles`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${path}: do not restore inline title styles`);
  for (const selector of ['authors-more__link', 'publication-list__primary-tag', 'info__value--list', 'flex-column']) {
    assert(html.includes(selector), `${path}: selector owner ${selector} exists in document`);
  }
}

console.log('Research Publication bilingual shared link-style contract passed (2 pages).');
