import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const layoutPath = 'assets/css/about/history-page-layout.css';
const heroPath = 'assets/css/about/history-title-hero.css';
const sharedHeroPath = 'assets/css/about/about-title-hero-shared.css';
const layout = fs.readFileSync(path.join(root, layoutPath), 'utf8');
const hero = fs.readFileSync(path.join(root, heroPath), 'utf8');
assert(layout.includes('#timeline-embed') && layout.includes('.history-timeline'), 'shared page layer should retain timeline rules');
const sharedHero = fs.readFileSync(path.join(root, sharedHeroPath), 'utf8');
assert(sharedHero.includes('.about-hero-wrap::after') && sharedHero.includes('clip-path:'), 'shared sloped hero geometry should remain independent');
assert(sharedHero.includes('background: none !important'), 'shared title hero should continue to override earlier background declarations');
assert(!layout.includes('background-image:'), 'overridden English hero image should not remain in the shared source');
assert(!/\.about-hero-wrap\s*\{|\.about-hero-wrap::after\s*\{|\.about-hero-inner\s*\{|\.about-hero-title\s*\{/.test(layout), 'shared geometry and history title typography should not remain in the page layout');
assert.match(hero, /font-size:\s*clamp\(3rem, 6vw, 5\.2rem\)/, 'history title layer should own its retained size');

for (const language of ['cn', 'en']) {
  const file = `About/About-history-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const page = html.indexOf(`../${layoutPath}?v=20261003-hero-clean1`);
  const layoutBase = html.indexOf('../assets/css/about/history-layout.css?v=20261006-component3');
  const chapterBase = html.indexOf('../assets/css/about/about-chapter-navigation-base.css?v=20261006-base1');
  const navigationMotion = html.indexOf('../assets/css/about/about-chapter-navigation-motion.css?v=20261006-motion1');
  const heroIndex = html.indexOf(`../${heroPath}?v=20261003-hero1`);
  const sharedHeroIndex = html.indexOf(`../${sharedHeroPath}?v=20261003-2`);
  const archive = html.indexOf('../assets/css/archive-consistency.css');
  assert(layoutBase >= 0 && layoutBase < chapterBase && chapterBase < navigationMotion && navigationMotion < page && page < sharedHeroIndex && sharedHeroIndex < heroIndex && heroIndex < archive, `${file}: preserve local layout, shared chapter component/motion, and hero layer ordering`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: extracted page rules should no longer be inline`);
  assert(!html.includes('history-page-en-overrides.css'), `${file}: overridden language-only background layer should be removed`);
}

process.stdout.write('PASS: About History shares ordered layers and excludes the English background overridden by the later hero.\n');
