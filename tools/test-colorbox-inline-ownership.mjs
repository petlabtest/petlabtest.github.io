import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(['.git', 'components', 'Replicate']);
const expectedStyles = new Set([
  'float: left;',
  'display: none;',
  'clear: left;',
  'position: absolute; width: 9999px; visibility: hidden; display: none; max-width: none;',
]);

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excluded.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(file));
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.html') files.push(file);
  }
  return files;
}

const pages = walk(root).map(file => ({
  file: path.relative(root, file).split(path.sep).join('/'),
  html: fs.readFileSync(file, 'utf8'),
})).filter(({ html }) => html.includes('<div id="colorbox"'));
let runtimeStyleCount = 0;
let researchPageCount = 0;

for (const { file, html } of pages) {
  const start = html.indexOf('<div id="cboxOverlay"');
  const end = html.indexOf('<script', start);
  assert(start >= 0 && end > start, `${file}: Colorbox runtime block bounds are missing`);
  const runtime = html.slice(start, end);
  const styles = [...runtime.matchAll(/\sstyle="([^"]*)"/g)].map(([, value]) => value.trim());
  assert.equal(styles.length, 18, `${file}: Colorbox runtime markup should retain 18 style attributes`);
  assert(styles.every(style => expectedStyles.has(style)), `${file}: unexpected Colorbox inline style value`);
  assert.match(runtime, /<div id="cboxOverlay"[\s\S]*?<div id="colorbox"/, `${file}: Colorbox ownership markers are missing`);
  if (file.startsWith('Research/')) researchPageCount += 1;
  runtimeStyleCount += styles.length;
}

assert.equal(pages.length, 48, 'site Colorbox page inventory changed');
assert.equal(researchPageCount, 12, 'Research Colorbox page inventory changed');
assert.equal(runtimeStyleCount, 864, 'site Colorbox inline style inventory changed');
process.stdout.write(`PASS: ${runtimeStyleCount} plugin-owned inline styles remain scoped to Colorbox markup across ${pages.length} pages, including ${researchPageCount} Research pages.\n`);
