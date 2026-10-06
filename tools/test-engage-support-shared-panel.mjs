import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['Engage/Engage-Support-cn.html', 'Engage/Engage-Support-en.html'];
const href = '../assets/css/engage/engage-support-panel.css?v=20260929-1';
const css = fs.readFileSync(path.join(root, 'assets/css/engage/engage-support-panel.css'), 'utf8');

assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length, 'shared panel CSS braces should balance');
assert(!/url\(/i.test(css), 'shared panel stylesheet should have no page-relative assets');
assert.match(css, /background-color:\s*#3171c8\s*!important;/, 'source blue panel color should be retained');
assert.match(css, /color:\s*#fff\s*!important;/, 'panel content should retain white text');

for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal(html.split(href).length - 1, 1, `${file}: shared panel CSS should load exactly once`);
  assert(html.indexOf(href) < html.indexOf('archive-consistency.css'), `${file}: preserve the original inline layer position`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: Support styles should no longer be inline`);
  for (const className of ['technical-support-panel', 'p-fullwidth__content', 'p-fullwidth__header', 'p-fullwidth__body', 'p-fullwidth__cta', 'cta--button', 'midnight-slope-overlay']) {
    assert(html.includes(className), `${file}: shared selector .${className} should have a DOM owner`);
  }
}

process.stdout.write('PASS: Technical Support bilingual panel styling is shared, ordered, and DOM-owned.\n');
