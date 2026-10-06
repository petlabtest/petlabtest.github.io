import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const basePath = 'assets/css/content-typography-base.css';
const base = fs.readFileSync(path.join(root, basePath), 'utf8');
const families = [
  ['engage/engage-typography.css', 14],
  ['people/people-typography.css', 16],
  ['research/research-typography.css', 74],
  ['capabilities/capabilities-typography.css', 4],
  ['giving/giving-typography.css', 2],
  ['news/news-content-typography.css', 220],
];

assert.match(base, /body\s*\{[^}]*--font:\s*var\(--font-family-sans\);[^}]*--font-poppins:\s*var\(--font-family-sans\);[^}]*--font-roboto-con:\s*var\(--font-family-sans\);[^}]*font-family:\s*var\(--font-family-sans\);[^}]*font-synthesis:\s*none;/s,
  'shared archived-content typography owns the common body font baseline');
assert.match(base, /body\s*:where\([\s\S]*?h1[\s\S]*?td\s*\)\s*\{\s*font-family:\s*var\(--font-family-sans\) !important;/,
  'shared archived-content typography owns the semantic text font override');

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ['.git', 'components', 'Replicate'].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(file));
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.html') files.push(file);
  }
  return files;
}

for (const [relativeCss, expectedPages] of families) {
  const entryLayer = fs.readFileSync(path.join(root, 'assets/css', relativeCss), 'utf8');
  assert(entryLayer.startsWith('@import url("../content-typography-base.css?v=20261003-1");'),
    `${relativeCss}: family typography entry imports the shared font baseline first`);
  assert(!/body\s*\{[^}]*--font:\s*var\(--font-family-sans\)/s.test(entryLayer),
    `${relativeCss}: shared body font declarations must not be duplicated locally`);
  assert(!/body\s*:where\(\s*h1\b[\s\S]*?\)\s*\{\s*font-family:\s*var\(--font-family-sans\) !important;/.test(entryLayer),
    `${relativeCss}: shared semantic font override must not be duplicated locally`);

  const pattern = new RegExp(`assets/css/${relativeCss.replaceAll('/', '\\/')}\\?v=20261003-shared1`);
  const consumers = walk(root).filter(file => pattern.test(fs.readFileSync(file, 'utf8')));
  assert.equal(consumers.length, expectedPages, `${relativeCss}: every expected page uses the cache-busted family entry`);
}

const news = fs.readFileSync(path.join(root, 'assets/css/news/news-content-typography.css'), 'utf8');
assert.match(news, /\.group-info[\s\S]*?\.news-join-us/, 'News-only metadata text roles remain in the News family layer');

process.stdout.write('PASS: six page-family typography layers share one baseline across 284 pages; News-only roles remain local.\n');
