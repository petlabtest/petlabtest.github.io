import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const research = path.join(root, 'Research');
const pages = fs.readdirSync(research)
  .filter(file => /^Research-(?:.+-Page\d+|Tech-.+)-(?:cn|en)\.html$/.test(file))
  .sort();
const overviewPages = fs.readdirSync(research)
  .filter(file => /^Research-(?:Core|Initiatives|Medical|Nuclear|Pharmaceutical|Physics)-(?:cn|en)\.html$/.test(file))
  .sort();
const expected = new Map([
  ['views-row-animation|transition-delay: 0.2s;', 56],
  ['views-row-animation|transition-delay: 0.3s;', 56],
  ['views-row-animation|transition-delay: 0.4s;', 112],
  ['views-row-animation|transition-delay: 0.5s;', 56],
  ['masonry-grid|position: relative; height: 1496.265625px;', 56],
  ['masonry-item|position: absolute; left: 0px; top: 0px; transition-delay: 0s;', 56],
  ['masonry-item|position: absolute; left: 558px; top: 0px; transition-delay: 0.2s;', 56],
  ['masonry-item|position: absolute; left: 0px; top: 371px; transition-delay: 0.4s;', 56],
]);

assert.equal(pages.length, 56, 'expected 44 Research subdetail and 12 technology pages');
const observed = new Map();
let subdetailCount = 0;
let technologyCount = 0;
const unexpected = [];

for (const file of pages) {
  const html = fs.readFileSync(path.join(research, file), 'utf8');
  const attributes = [...html.matchAll(/<([a-z][\w:-]*)\b([^>]*?)\sstyle=(['"])(.*?)\3([^>]*)>/gis)];
  assert.equal(attributes.length, 9, `${file} should retain the audited runtime style snapshot shape`);
  if (file.includes('-Tech-')) technologyCount += attributes.length;
  else subdetailCount += attributes.length;

  for (const [, tag, before, , rawValue, after] of attributes) {
    const classValue = /\bclass=(['"])(.*?)\1/i.exec(`${before} ${after}`)?.[2] || '';
    const classes = new Set(classValue.split(/\s+/).filter(Boolean));
    const value = rawValue.replace(/\s+/g, ' ').trim();
    let owner;
    if (classes.has('views-row') && value.startsWith('transition-delay:')) owner = 'views-row-animation';
    else if (classes.has('slick-track')) owner = 'slick-track';
    else if (classes.has('lab-carousel') && classes.has('slick-slide')) owner = 'slick-slide';
    else if (classes.has('p-masonry__grid')) owner = 'masonry-grid';
    else if (classes.has('p-masonry__item')) owner = 'masonry-item';

    const key = owner && `${owner}|${value}`;
    if (!owner || !expected.has(key)) {
      unexpected.push({ file, tag, classes: [...classes], value });
      continue;
    }
    observed.set(key, (observed.get(key) || 0) + 1);
  }
}

assert.equal(subdetailCount, 396);
assert.equal(technologyCount, 108);
assert.deepEqual(unexpected, [], 'all inline style attributes should be recognized runtime state');
assert.deepEqual(observed, expected, 'runtime style signatures should retain the audited Slick/Masonry/animation counts');

assert.equal(overviewPages.length, 12, 'expected six Research area overview pages in Chinese and English');
const overviewMasonry = new Map([
  ['masonry-grid|position: relative; height: 1496.265625px;', 12],
  ['masonry-item|position: absolute; left: 0px; top: 0px; transition-delay: 0s;', 12],
  ['masonry-item|position: absolute; left: 558px; top: 0px; transition-delay: 0.2s;', 12],
  ['masonry-item|position: absolute; left: 0px; top: 371px; transition-delay: 0.4s;', 12],
]);
const observedOverviewMasonry = new Map();
const unexpectedOverviewMasonry = [];
for (const file of overviewPages) {
  const html = fs.readFileSync(path.join(research, file), 'utf8');
  assert.match(html, /assets\/js\/root\/002\.js/, `${file} should load the shared Masonry behavior`);
  const elements = [...html.matchAll(/<([a-z][\w:-]*)\b([^>]*?)\sstyle=(['"])(.*?)\3([^>]*)>/gis)];
  let gridCount = 0;
  let itemCount = 0;
  for (const [, tag, before, , rawValue, after] of elements) {
    const classValue = /\bclass=(['"])(.*?)\1/i.exec(`${before} ${after}`)?.[2] || '';
    const classes = new Set(classValue.split(/\s+/).filter(Boolean));
    const owner = classes.has('p-masonry__grid') ? 'masonry-grid' : classes.has('p-masonry__item') ? 'masonry-item' : null;
    if (!owner) continue;
    if (owner === 'masonry-grid') gridCount += 1;
    else itemCount += 1;
    const value = rawValue.replace(/\s+/g, ' ').trim();
    const key = `${owner}|${value}`;
    if (!overviewMasonry.has(key)) unexpectedOverviewMasonry.push({ file, tag, owner, value });
    else observedOverviewMasonry.set(key, (observedOverviewMasonry.get(key) || 0) + 1);
  }
  assert.equal(gridCount, 1, `${file} should contain one Masonry grid snapshot`);
  assert.equal(itemCount, 3, `${file} should contain three Masonry item snapshots`);
}
assert.deepEqual(unexpectedOverviewMasonry, [], 'overview Masonry snapshots should use the audited runtime signatures');
assert.deepEqual(observedOverviewMasonry, overviewMasonry, 'overview Masonry signatures should have consistent bilingual counts');

process.stdout.write(`${JSON.stringify({ pages: pages.length, subdetailAttributes: subdetailCount, technologyAttributes: technologyCount, overviewMasonryPages: overviewPages.length, overviewMasonrySignatures: observedOverviewMasonry.size, totalMasonryGrids: observed.get('masonry-grid|position: relative; height: 1496.265625px;') + overviewMasonry.get('masonry-grid|position: relative; height: 1496.265625px;'), owners: ['Slick carousel', 'Masonry layout', 'per-row entrance delay'] }, null, 2)}\n`);
