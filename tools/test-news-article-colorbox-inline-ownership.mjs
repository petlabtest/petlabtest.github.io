import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const files = readdirSync('News/List').filter(file => file.endsWith('.html'));
const expectedStyles = new Set([
  'float: left;',
  'display: none;',
  'clear: left;',
  'position: absolute; width: 9999px; visibility: hidden; display: none; max-width: none;',
]);
let pagesWithRuntimeStyles = 0;
let runtimeStyleCount = 0;

for (const file of files) {
  const html = readFileSync(`News/List/${file}`, 'utf8');
  const styles = [...html.matchAll(/\sstyle="([^"]*)"/g)].map(([, value]) => value.trim());
  if (!styles.length) continue;

  const start = html.indexOf('<div id="cboxOverlay"');
  const end = html.indexOf('<script src="../../assets/js/floating-assistant.js', start);
  assert(start >= 0 && end > start, `${file}: Colorbox runtime block bounds are missing`);
  const runtime = html.slice(start, end);
  assert.equal((runtime.match(/\sstyle="/g) || []).length, styles.length, `${file}: inline style exists outside the Colorbox runtime block`);

  pagesWithRuntimeStyles += 1;
  runtimeStyleCount += styles.length;
  assert.equal(styles.length, 18, `${file}: Colorbox runtime markup should retain 18 style attributes`);
  assert(styles.every(style => expectedStyles.has(style)), `${file}: unexpected inline style outside the Colorbox runtime set`);
  assert.match(runtime, /<div id="cboxOverlay"[\s\S]*?<div id="colorbox"/, `${file}: Colorbox ownership markers are missing`);
}

assert.equal(files.length, 174, 'news article page inventory changed');
assert.equal(pagesWithRuntimeStyles, 22, 'Colorbox runtime-style page count changed');
assert.equal(runtimeStyleCount, 396, 'Colorbox runtime-style attribute count changed');

console.log('PASS: 396 inline style attributes on 22 article pages are limited to the preserved Colorbox runtime set.');
