import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const research = path.join(root, 'Research');
const newsHref = '../assets/css/research/tech-news3up-alignment.css?v=20260928-news3up1';
const ctaHref = '../assets/css/research/tech-fullwidth-cta.css?v=20261003-offset2';
const sharedCtaHref = '../assets/css/research/research-fullwidth-cta.css?v=20261003-clean1';
const css = fs.readFileSync(path.join(root, 'assets/css/research/tech-fullwidth-cta.css'), 'utf8');
const sharedCss = fs.readFileSync(path.join(root, 'assets/css/research/research-fullwidth-cta.css'), 'utf8');
const pages = fs.readdirSync(research).filter(file => /^Research-Tech-.+-(?:cn|en)\.html$/.test(file)).sort();

assert.equal(pages.length, 12);
function fullwidthSections(html) {
  const sections = [];
  const opening = /<div\b[^>]*class="[^"]*\bparagraph--type-p-fullwidth\b[^"]*"[^>]*>/gi;
  for (const match of html.matchAll(opening)) {
    const start = match.index;
    let depth = 0;
    let end = -1;
    for (const tag of html.slice(start).matchAll(/<\/?div\b[^>]*>/gi)) {
      if (tag[0].startsWith('</')) depth--;
      else depth++;
      if (depth === 0) {
        end = start + tag.index + tag[0].length;
        break;
      }
    }
    assert(end > start, 'fullwidth paragraph should have a matching closing div');
    sections.push(html.slice(start, end));
  }
  return sections;
}

for (const file of pages) {
  const html = fs.readFileSync(path.join(research, file), 'utf8');
  assert.equal(html.split(ctaHref).length - 1, 1, `${file} should load the CTA stylesheet once`);
  assert.equal(html.split(sharedCtaHref).length - 1, 1, `${file} should load the shared CTA treatment once`);
  assert(html.indexOf(sharedCtaHref) > html.indexOf(newsHref), `${file} should keep news3up before the shared CTA styles`);
  assert(html.indexOf(ctaHref) > html.indexOf(sharedCtaHref), `${file} should keep the Tech overlap override after shared CTA styles`);
  const styleBlocks = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(([, block]) => block);
  assert(styleBlocks.every(block => !block.includes('Local styling for the full-width call-to-action copied from the researcher page.')), `${file} should not retain the extracted CTA block`);
  assert.match(html, /<body\b[^>]*class="[^"]*\bpage-node-type-rdgroup\b/i, `${file} should have the page class required by the shared CTA selector`);
  const sections = fullwidthSections(html);
  assert.equal(sections.length, 1, `${file} should contain one audited fullwidth section`);
  assert.match(sections[0], /class="[^"]*\bbackground--grey\b[^"]*\bslope--pos\b[^"]*\bjs-animate\b/i, `${file} fullwidth section should match the shared selector`);
  assert.match(sections[0], /<a\b[^>]*href="[^"]+"[^>]*class="[^"]*\bcta--button\b/i, `${file} fullwidth section should contain a navigable CTA`);
  assert(fs.existsSync(path.resolve(research, '../assets/css/research/tech-fullwidth-cta.css')));
}

for (const selector of [
  '.page-node-type-rdgroup .paragraph--type-p-fullwidth.background--grey.slope--pos.js-animate',
  '.p-fullwidth__header', '.p-fullwidth__body', '.p-fullwidth__cta a.cta--button::before',
]) assert(sharedCss.includes(selector), `shared CTA stylesheet should keep ${selector}`);
assert(sharedCss.includes('@media (min-width: 1025px)'));
assert(sharedCss.includes('@media (max-width: 699px)'));
assert(sharedCss.includes('font-family: "icomoon" !important;'));
assert(sharedCss.includes('.p-fullwidth__cta a.cta--button:focus-visible'));
assert(sharedCss.includes('outline: 2px solid #00305c;'));
assert(sharedCss.includes('outline-offset: 4px;'));
assert(!sharedCss.includes('border-top: 2px solid currentColor;'), 'the superseded border-drawn arrow should not remain in the icomoon CTA rules');
assert(!sharedCss.includes('transform: translateX(3px) rotate(45deg);'), 'the superseded border-arrow hover motion should not remain');
assert(css.includes('margin-top: -300px;'), 'Tech should retain its fullwidth overlap offset');
assert.equal((css.match(/margin-top:\s*-300px;/g) || []).length, 1, 'Tech overlap offset should be declared once across viewports');
assert(!css.includes('@media'), 'Tech overlap should not retain a redundant responsive override');
assert(!css.includes('opacity:') && !css.includes('transform:'), 'Tech override should not duplicate shared layout or motion declarations');
assert.equal((sharedCss.match(/{/g) || []).length, (sharedCss.match(/}/g) || []).length, 'shared CTA stylesheet braces should balance');
assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length, 'shared stylesheet braces should balance');

process.stdout.write('PASS: all 12 Research technology pages share the CTA treatment while retaining only their -300px overlap override.\n');
