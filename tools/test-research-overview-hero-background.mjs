import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const paths = ['Research/Research-ov-cn.html', 'Research/Research-ov-en.html'];
const href = '../assets/css/research/research-overview-hero-background.css?v=20260929-1';
const overlayHref = '../assets/css/research/research-overview-hero-overrides.css?v=20260929-1';
const css = readFileSync('assets/css/research/research-overview-hero-background.css', 'utf8');
const overlayCss = readFileSync('assets/css/research/research-overview-hero-overrides.css', 'utf8');

assert.match(css, /\.paragraph--type-p-rdhero\.paragraph--view-mode-full\s*\{\s*background-image:/);
assert.match(css, /url\('\.\.\/\.\.\/pic\/School\/xsclg\.jpg'\)/);
assert(existsSync('assets/pic/School/xsclg.jpg'), 'shared hero background image exists');
assert.match(overlayCss, /\.paragraph--type-p-rdhero\.paragraph--view-mode-full::after\s*\{\s*background-color:\s*rgba\(0, 115, 207, 0\.8\)/);

for (const path of paths) {
  const html = readFileSync(path, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.equal(html.split(href).length - 1, 1, `${path}: one shared hero stylesheet`);
  assert.equal(html.split(overlayHref).length - 1, 1, `${path}: one shared overlay stylesheet`);
  assert(head.indexOf(href) < head.indexOf('overview/08-css_'), `${path}: original pre-theme cascade slot retained`);
  assert(head.indexOf('overview/dpet-theme.css') < head.indexOf(overlayHref), `${path}: preserve the original post-theme overlay layer`);
  assert(!head.includes('media="(min-width: 700px)"'), `${path}: redundant repeated media wrapper removed`);
  assert(!head.includes('media="(min-width: 1025px)"'), `${path}: redundant repeated media wrapper removed`);
  assert(!head.includes('.paragraph--type-p-rdhero.paragraph--view-mode-full {'), `${path}: hero background no longer duplicated inline`);
  assert.match(html, /class="paragraph paragraph--type-p-rdhero paragraph--view-mode-full"/, `${path}: hero rule has a DOM owner`);
  assert(!html.includes('.paragraph--type-p-rdhero.paragraph--view-mode-full::after'), `${path}: remove the duplicate inline overlay rule`);
}

console.log('Research Overview bilingual hero-background contract passed (2 pages).');
