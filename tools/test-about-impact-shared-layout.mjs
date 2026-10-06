import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stylesheet = '../assets/css/about/impact-layout.css?v=20261006-titlehero2';
const sharedHero = '../assets/css/about/about-title-hero-shared.css?v=20261003-2';
const editorialHeroType = '../assets/css/about/about-title-hero-editorial-type.css?v=20261003-1';
const pageStylesheet = '../assets/css/about/impact-page-layout.css?v=20260930-shared7';
const chineseOverride = '../assets/css/about/impact-page-cn-overrides.css?v=20260929-shared2';
const css = fs.readFileSync(path.join(root, 'assets/css/about/impact-layout.css'), 'utf8');

assert(css.includes('--impact-navy: #003c62'), 'shared impact tokens should be present');
assert(!/\.about-hero-(?:wrap|inner|title)\b/.test(css), 'page layout should not duplicate the shared title hero layers');
assert(!/\.impact-hero(?:__inner)?\b/.test(css), 'page layout should not retain the obsolete hero class absent from both page DOMs');
assert(!/url\s*\(|@import/i.test(css), 'relocation must not require URL rewriting');

for (const language of ['cn', 'en']) {
  const file = `About/About-impact-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal(html.split(stylesheet).length - 1, 1, `${file}: shared layout should load once`);
  assert.equal(html.split(sharedHero).length - 1, 1, `${file}: shared title hero geometry should load once`);
  assert.equal(html.split(editorialHeroType).length - 1, 1, `${file}: shared editorial title type should load once`);
  assert.equal(html.split(pageStylesheet).length - 1, 1, `${file}: remaining page layout should be shared once`);
  assert(html.indexOf('../assets/css/site.css') < html.indexOf(stylesheet), `${file}: site layer should precede impact layout`);
  assert(html.indexOf(stylesheet) < html.indexOf(sharedHero) && html.indexOf(sharedHero) < html.indexOf(editorialHeroType) && html.indexOf(editorialHeroType) < html.indexOf(pageStylesheet), `${file}: preserve impact layout, shared title geometry/type, then page-specific order`);
  assert(html.indexOf(pageStylesheet) < html.indexOf('../assets/css/archive-consistency.css'), `${file}: archive layer should follow impact layout`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: extracted page styles should no longer be inline`);
  assert(!html.includes('--impact-navy: #003c62'), `${file}: shared tokens should no longer be duplicated inline`);
  if (language === 'cn') assert(html.indexOf(pageStylesheet) < html.indexOf(chineseOverride), `${file}: Chinese exception should follow the shared page layer`);
  else assert(!html.includes(chineseOverride), `${file}: Chinese exception should not load in English`);
}

process.stdout.write('PASS: About Impact bilingual pages share one ordered layout layer and retain separate language-specific CSS.\n');
