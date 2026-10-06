import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const research = path.join(root, 'Research');
const pages = fs.readdirSync(research)
  .filter(file => /^Research-.+\.html$/.test(file))
  .filter(file => fs.readFileSync(path.join(research, file), 'utf8').includes('research-latest-news.css'))
  .sort();

assert.equal(pages.length, 68, 'expected 68 Research pages using the shared latest-news component');

for (const file of pages) {
  const html = fs.readFileSync(path.join(research, file), 'utf8');
  const links = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)].map(match => match[0]);
  const baseCss = '../assets/css/news/news-overview-components.css';
  const sharedCss = '../assets/css/research-latest-news.css?v=20260929-mobile-carousel1';
  const componentNodes = [...html.matchAll(/<[^>]+class=["'][^"']*paragraph--type-p-news3up[^"']*["'][^>]*>/gi)];
  const isTech = /^Research-Tech-/.test(file);
  const techCss = '../assets/css/research/tech-news3up-alignment.css?v=20260928-news3up1';

  assert.equal(links.filter(link => link.includes(baseCss)).length, 1, `${file}: shared news component CSS should load once`);
  assert.equal(links.filter(link => link.includes(sharedCss)).length, 1, `${file}: Research news CSS should load once`);
  assert(links.findIndex(link => link.includes(baseCss)) < links.findIndex(link => link.includes(sharedCss)), `${file}: Research news layer should follow base component CSS`);
  assert.equal(componentNodes.length, 1, `${file}: expected one news3up component`);
  assert(!html.includes('<div class="slider-wrapper"><div class="slider-content"></div></div>'), `${file}: slider controls should be created by the shared script only`);
  assert(/class=["'][^"']*js-animate[^"']*["']/.test(componentNodes[0][0]), `${file}: news3up should retain the shared reveal class`);
  assert(html.includes('../assets/js/root/002.js'), `${file}: shared news3up behavior script should be present`);

  const techLinks = links.filter(link => link.includes(techCss));
  assert.equal(techLinks.length, isTech ? 1 : 0, `${file}: Tech-only alignment layer scope should match page family`);
  if (isTech) {
    assert(links.findIndex(link => link.includes(techCss)) < links.findIndex(link => link.includes(sharedCss)), `${file}: Tech alignment layer should precede Research news layer`);
  }
}

const sharedRules = fs.readFileSync(path.join(root, 'assets/css/research-latest-news.css'), 'utf8');
assert(sharedRules.includes('.research-latest-news .slick-track > .views-row {\n  float: left;'), 'Slick rows must retain horizontal layout');
assert(sharedRules.includes('.research-latest-news .slick-track {\n  display: flow-root;'), 'Slick track must contain floated rows');

process.stdout.write('PASS: 68 Research pages share one news3up control host, reveal hook, behavior script, and ordered CSS layers (12 Tech pages retain the scoped alignment layer).\n');
