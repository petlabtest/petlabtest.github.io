import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function classesIn(source) {
  return new Set([...source.matchAll(/\bclass="([^"]+)"/g)].flatMap(match => match[1].split(/\s+/)));
}

function assertStyleClassesPresent(stylesheet, pageClasses, context) {
  const css = stylesheet.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = new Set([...css.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(match => match[1]));
  const unmatched = [...selectors].filter(className => !pageClasses.has(className)).sort();
  assert.deepEqual(unmatched, [], `${context}: stylesheet class selectors must have a DOM owner`);
}

const cssPath = path.join(root, 'assets/css/about/about-editorial-sections.css');
const css = fs.readFileSync(cssPath, 'utf8');
const pageLayoutCss = fs.readFileSync(path.join(root, 'assets/css/about/about-page-layout.css'), 'utf8');
const pages = ['About-about-cn.html', 'About-about-en.html'].map(file => {
  const page = fs.readFileSync(path.join(root, 'About', file), 'utf8');
  return { file, page, inlineStyle: page.match(/<style>([\s\S]*?)<\/style>/i)?.[1] ?? '' };
});
assertStyleClassesPresent(css, new Set(pages.flatMap(({ page }) => [...classesIn(page)])), 'About EditorialSection');

for (const { file, page, inlineStyle } of pages) {
  assert.match(page, /<body class="page-about">/);
  assert.match(page, /<link rel="stylesheet" href="\.\.\/assets\/css\/about\/about-editorial-sections\.css\?v=20260928-p2pilot2">/);
  const editorialIndex = page.indexOf('about-editorial-sections.css');
  assert(editorialIndex < page.indexOf('../assets/css/archive-consistency.css'), `${file}: extracted rules must retain their page style layer`);
for (const selector of ['.about-section', '.about-content', '.about-copy', '.about-sec-navy', '.about-sec-blue', '.about-sec-white', '.about-sec-gray', '.cta']) {
  assert(css.includes(`:where(body.page-about) ${selector}`), `${selector} must remain scoped to About without added specificity`);
  if (selector === '.about-content') {
    assert.match(pageLayoutCss, /\.about-hero-inner,\s*\.about-content\s*\{[\s\S]*?width: calc\(100% - 36px\)/);
    assert(!/\.about-content\b/.test(inlineStyle), `${file}: the narrow-screen content-width rule should not return inline`);
  } else {
    assert(!new RegExp(`^\\s*${selector.replaceAll('.', '\\.')}\\b`, 'm').test(inlineStyle), `${selector} rules should no longer remain inline`);
  }
}
}
assert.match(css, /@media \(max-width: 699px\)[\s\S]*clip-path: none/);
assert.match(css, /@media \(min-width: 700px\)[\s\S]*line-height: 1\.5/);
assert.match(css, /@media \(min-width: 1025px\)[\s\S]*font-size: 1\.25rem[\s\S]*font-size: 25px/);
assert.match(css, /:where\(body\.page-about:lang\(en\)\) \.about-section p\s*\{[^}]*margin-bottom: 18px/s);
assert.match(css, /:where\(body\.page-about:lang\(en\)\) \.cta\s*\{[^}]*font-weight: 700/s);
assert(!/url\(/i.test(css), 'the extracted family currently has no page-relative asset URLs');

const editorialVariants = pages.map(({ page }) => [...page.matchAll(/<section class="about-section ([^"]+)"[^>]*>/g)].map(match => match[1]).slice(0, 5));
assert.deepEqual(editorialVariants[0], [
  'about-sec-navy', 'about-sec-white', 'about-sec-blue', 'about-sec-white', 'about-sec-gray',
]);
assert.deepEqual(editorialVariants[1], editorialVariants[0], 'Chinese and English pages should keep matching section variants');

const missionLayoutCss = fs.readFileSync(path.join(root, 'assets/css/about/about-mission-layout.css'), 'utf8');
const aboutFoundationCss = fs.readFileSync(path.join(root, 'assets/css/about/about-page-foundation.css'), 'utf8');
const sharedTitleHeroCss = fs.readFileSync(path.join(root, 'assets/css/about/about-title-hero-shared.css'), 'utf8');
const editorialHeroTypeCss = fs.readFileSync(path.join(root, 'assets/css/about/about-title-hero-editorial-type.css'), 'utf8');
const missionPages = ['About-mission-cn.html', 'About-mission-en.html'].map(file => ({ file, page: fs.readFileSync(path.join(root, 'About', file), 'utf8') }));
const missionPageClasses = new Set(missionPages.flatMap(({ page }) => [...classesIn(page)]));
assertStyleClassesPresent(missionLayoutCss, missionPageClasses, 'About mission layout');
assertStyleClassesPresent(sharedTitleHeroCss, missionPageClasses, 'About shared title hero geometry');
assertStyleClassesPresent(editorialHeroTypeCss, missionPageClasses, 'About shared editorial title typography');
for (const { file, page } of missionPages) {
  assert.match(page, /<body class="page-about-mission page-about-wide"/);
  assert(!page.includes('about-mission-sections.css'), `${file}: do not load the unrelated EditorialSection stylesheet`);
  assert(!page.includes('about-mission-hero.css'), `${file}: do not load the unused image-based hero rules`);
  assert(!page.includes('about-mission-title-hero.css'), `${file}: do not load the retired duplicate title layer`);
  assert.match(page, /<link rel="stylesheet" href="\.\.\/assets\/css\/about\/about-page-foundation\.css\?v=20261003-base1">/);
  assert.match(page, /<link rel="stylesheet" href="\.\.\/assets\/css\/about\/about-mission-layout\.css\?v=20261006-component3">/);
  assert.match(page, /<link rel="stylesheet" href="\.\.\/assets\/css\/about\/about-chapter-navigation-base\.css\?v=20261006-base1">/);
  assert.match(page, /<link rel="stylesheet" href="\.\.\/assets\/css\/about\/about-chapter-navigation-motion\.css\?v=20261006-motion1">/);
  assert.match(page, /<link rel="stylesheet" href="\.\.\/assets\/css\/about\/about-title-hero-shared\.css\?v=20261003-2">/);
  assert.match(page, /<link rel="stylesheet" href="\.\.\/assets\/css\/about\/about-title-hero-editorial-type\.css\?v=20261003-1">/);
  assert(page.indexOf('about-page-foundation.css') < page.indexOf('about-mission-layout.css') && page.indexOf('about-mission-layout.css') < page.indexOf('about-chapter-navigation-base.css') && page.indexOf('about-chapter-navigation-base.css') < page.indexOf('about-chapter-navigation-motion.css') && page.indexOf('about-chapter-navigation-motion.css') < page.indexOf('about-title-hero-shared.css') && page.indexOf('about-title-hero-shared.css') < page.indexOf('about-title-hero-editorial-type.css'), `${file}: foundation, layout, chapter component/motion, shared geometry, and editorial title type must remain ordered`);
  assert(page.indexOf('about-title-hero-editorial-type.css') < page.indexOf('archive-consistency.css'), `${file}: extracted hero must precede later page stylesheets`);
  assert.equal((page.match(/<style>/gi) ?? []).length, 0, `${file}: page styles should be maintained in shared stylesheets`);
}
assert.match(aboutFoundationCss, /--shell: 1280px/);
assert(!/:root|\*\s*\{|^html\s*\{|^body\s*\{|^a\s*\{|^img\s*\{/m.test(missionLayoutCss), 'mission page layout should not duplicate the shared foundation');
assert.match(missionLayoutCss, /#main>\.dpet-ll-pub-nav-chapters[\s\S]*flex-basis: calc\(20% - 8px\)/, 'the active chapter navigation remains styled at desktop widths');
assert.equal((css.match(/clip-path: polygon\(0 0, 100% 0, 100% 100%, 0 77%\)/g) ?? []).length, 1, 'blue section geometry should have one desktop rule owner');
assert(!missionLayoutCss.includes('width: min(calc(100% - 116px), 940px);'), 'overridden intro width should not remain in the initial layer');
assert(!missionLayoutCss.includes('font-size: clamp(2rem, 3.3vw, 3.35rem);'), 'overridden story heading size should have one owner');
assert(!missionLayoutCss.includes('width: min(calc(100% + 120px), 1060px);'), 'overridden wide-story width should not remain in the initial layer');
assert(!missionLayoutCss.includes('padding-top: 52px'), 'overridden narrow intro padding should not remain');
assert(!/\.about-(?:section|content|copy|sec-navy|sec-blue|sec-white|sec-gray|hero-wrap|hero-inner|hero-title)\b|\.mission-hero-/i.test(missionLayoutCss), 'mission layout must not contain selectors owned by another page layer or the later inline title hero');
assert(!/\.chapters\b|\.chapter-cards\b|\.chapter-card\b|\.dpet-stats\b|\.dpet-stat(?:__|\b)|\.story h2\b|\.story figure\b|\.story \.wide\b|\.story \.terminal\b/.test(missionLayoutCss), 'removed mission content variants must not leave unreferenced style rules');
assert(!/\.shell\b|\.component-frame\b/.test(missionLayoutCss), 'AppShell-only shadow DOM classes must not be restyled from the light-DOM mission sheet');
assert.equal((missionLayoutCss.match(/line-height: 1\.75/g) ?? []).length, 3, 'body and publication base rules own line-height without redundant breakpoint copies');
assert.match(sharedTitleHeroCss, /\.about-hero-wrap\s*\{[^}]*min-height: clamp\(225px, 27\.1vw, 390px\) !important/s);
assert.match(sharedTitleHeroCss, /\.about-hero-wrap::after\s*\{[^}]*clip-path: polygon/s);
assert.match(sharedTitleHeroCss, /@media \(max-width: 699px\)[\s\S]*min-height: 225px !important/s);
assert.match(editorialHeroTypeCss, /font-size: clamp\(2\.5rem, 5vw, 4\.0625rem\)/);
assert(!/url\(/i.test(editorialHeroTypeCss), 'shared editorial title type has no page-relative assets');

process.stdout.write('PASS: About editorial contracts, mission-page shared styles, responsive cascade ownership, and unused-selector cleanup are verified.\n');
