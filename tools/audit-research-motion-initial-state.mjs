import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const research = path.join(root, 'Research');
const pages = fs.readdirSync(research).filter(file => file.startsWith('Research-') && file.endsWith('.html')
  && fs.readFileSync(path.join(research, file), 'utf8').includes('research-latest-news.css')).sort();
const motionFiles = {
  fullwidth: 'assets/css/p-fullwidth-motion.css',
  news3up: 'assets/css/news/news-overview-motion.css',
  masonry: 'assets/css/news/masonry-motion.css',
  behavior: 'assets/js/root/002.js',
};
const motionCss = Object.fromEntries(Object.entries(motionFiles).slice(0, 3)
  .map(([name, file]) => [name, fs.readFileSync(path.join(root, file), 'utf8')]));
const behavior = fs.readFileSync(path.join(root, motionFiles.behavior), 'utf8');
const counts = {
  pages: pages.length,
  fullwidth: { total: 0, preMarkedJsAnimate: 0 },
  news3up: { total: 0, preMarkedJsAnimate: 0 },
  masonryItems: { total: 0, preMarkedJsAnimate: 0 },
  pagesMissingMotionAssets: [],
  pagesWithInlineMotionOverrides: [],
};

function countClassTags(html, selector, result) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const openingTag = new RegExp(`<div\\b[^>]*class="([^"]*\\b${escaped}\\b[^"]*)"[^>]*>`, 'gi');
  for (const [, classValue] of html.matchAll(openingTag)) {
    result.total++;
    if (classValue.split(/\s+/).includes('js-animate')) result.preMarkedJsAnimate++;
  }
}

assert.equal(pages.length, 68, 'Research motion cohort should contain 12 topic overview, 44 subdetail, and 12 Tech pages');
for (const file of pages) {
  const html = fs.readFileSync(path.join(research, file), 'utf8');
  countClassTags(html, 'paragraph--type-p-fullwidth', counts.fullwidth);
  countClassTags(html, 'paragraph--type-p-news3up', counts.news3up);
  countClassTags(html, 'p-masonry__item', counts.masonryItems);
  if (!html.includes('news-overview-motion.css') || !html.includes('masonry-motion.css')
    || !html.includes('p-fullwidth-motion.css') || !html.includes('assets/js/root/002.js')) {
    counts.pagesMissingMotionAssets.push(file);
  }
  for (const [, rawCss] of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, selector, declarations] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/(?:p-fullwidth__content|paragraph--type-p-news3up|p-masonry__item)/.test(selector)
        && /(?:^|;)\s*(?:opacity|transform|visibility)\s*:/i.test(declarations)) {
        counts.pagesWithInlineMotionOverrides.push({ file, selector: selector.trim().replace(/\s+/g, ' ') });
      }
    }
  }
}

for (const [component, css] of Object.entries(motionCss)) {
  assert(css.includes('opacity: 0;'), `${component} should define an initial hidden state`);
  assert(css.includes('.js-animate'), `${component} should define its visible js-animate state`);
}
assert(behavior.includes('Drupal.behaviors.featureFullWidth') && behavior.includes('paragraph--type-p-fullwidth'), 'shared behavior should observe fullwidth sections');
assert(behavior.includes('Drupal.behaviors.newsThreeUp') && behavior.includes('paragraph--type-p-news3up'), 'shared behavior should observe news3up sections');
assert(behavior.includes('Waypoint') && behavior.includes('.p-masonry__item'), 'shared behavior should observe Masonry items');
assert(behavior.includes('addClass("js-animate")'), 'legacy reveal behavior should add the shared reveal class');
assert(!behavior.includes('removeClass("js-animate")'), 'legacy behavior should not clear the pre-rendered reveal class');
assert.deepEqual(counts.pagesMissingMotionAssets, [], 'all pages should load the three shared motion styles and behavior');
assert.deepEqual(counts.pagesWithInlineMotionOverrides, [], 'page inline styles should not fork shared reveal visibility/transform state');
assert.deepEqual(counts.fullwidth, { total: 80, preMarkedJsAnimate: 80 });
assert.deepEqual(counts.news3up, { total: 68, preMarkedJsAnimate: 68 });
assert.deepEqual(counts.masonryItems, { total: 204, preMarkedJsAnimate: 204 });

process.stdout.write(`${JSON.stringify({ ...counts, conclusion: 'All 68 audited pages enter with motion components pre-marked js-animate; legacy Waypoint scripts only add, never remove, that class.' }, null, 2)}\n`);
