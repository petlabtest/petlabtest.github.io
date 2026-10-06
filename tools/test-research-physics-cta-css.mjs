import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stylesheet = path.join(root, 'assets/css/research/research-physics-cn-fullwidth-cta.css');
const stylesheetHref = '../assets/css/research/research-physics-cn-fullwidth-cta.css?v=20260928-cta1';
const css = fs.readFileSync(stylesheet, 'utf8');
const sharedCss = fs.readFileSync(path.join(root, 'assets/css/research/research-detail-shared.css'), 'utf8');
const sharedHref = '../assets/css/research/research-detail-shared.css?v=20261003-lang1';

for (let page = 1; page <= 5; page++) {
  const file = path.join(root, `Research/Research-Physics-Page${page}-cn.html`);
  const html = fs.readFileSync(file, 'utf8');
  assert.equal((html.match(new RegExp(stylesheetHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1, `page ${page} should load the shared CTA CSS once`);
  assert(!/<style\b[^>]*>[\s\S]*?Chinese research-collaboration CTA normalization[\s\S]*?<\/style>/i.test(html), `page ${page} should not retain the extracted inline CSS`);
  assert.equal((html.match(new RegExp(sharedHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1, `page ${page} should load the shared Research detail CSS once`);
  assert(html.indexOf(stylesheetHref) < html.indexOf(sharedHref), `page ${page} should keep page sizing before shared CTA geometry`);
  assert.match(html, /<html\b[^>]*lang="zh-CN"/i, `page ${page} should match the shared Chinese CTA selector`);
  assert.match(html, /class="[^"]*paragraph--type-p-fullwidth[^"]*background--grey[^"]*slope--pos[^"]*js-animate/i, `page ${page} should contain the shared fullwidth component`);
}

assert(css.includes('.p-fullwidth__cta a.cta--button {\n  font-size: 16px;'));
assert(css.includes('.p-fullwidth__cta a.cta--button .last-word {\n  display: inline-block;\n  white-space: nowrap;'));
assert(!css.includes('::before'), 'Physics should rely on the shared orange CTA bar');
assert(!css.includes('::after'), 'Physics should rely on the shared anchor arrow and hidden nested arrow');
assert(!css.includes('padding-left:'), 'Physics should rely on the shared hover padding state');
assert(css.includes('@media (min-width: 1025px)'));
assert(css.includes('font-size: 25px;'));
assert(css.includes('white-space: nowrap;'), 'the Physics CN CTA last word should stay unbroken');
assert(sharedCss.includes('html[lang="zh-CN"] .page-node-type-rdgroup .paragraph--type-p-fullwidth .p-fullwidth__cta a.cta--button::before'));
assert(sharedCss.includes('html[lang="zh-CN"] .page-node-type-rdgroup .paragraph--type-p-fullwidth .p-fullwidth__cta a.cta--button:hover::before'));
assert(sharedCss.includes('.page-node-type-rdgroup a.cta--button .last-word::after {\n  display: none !important;'));
assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length, 'shared stylesheet braces should balance');

for (let page = 1; page <= 5; page++) {
  const file = path.join(root, `Research/Research-Physics-Page${page}-en.html`);
  const html = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(html, /research-physics-cn-fullwidth-cta\.css/, `English Physics page ${page} should not load the Chinese CTA variant`);
}

process.stdout.write('PASS: all five Physics CN pages use one shared CTA stylesheet at the original cascade position.\n');
