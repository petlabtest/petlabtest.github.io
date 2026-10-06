import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const paths = ['Research/Research-Medical-en.html', 'Research/Research-Pharmaceutical-en.html'];
const baseHref = '../assets/css/research/research-rdgroups-tabs.css?v=20260929-1';
const summaryHref = '../assets/css/research/research-rdgroups-summary-en.css?v=20260929-1';
const summaryCss = readFileSync('assets/css/research/research-rdgroups-summary-en.css', 'utf8');
const pharmaCss = readFileSync('assets/css/research/pharmaceutical-layout.css', 'utf8');
const cardMasonryHref = '../assets/css/research/research-rdgroups-card-masonry-base.css?v=20261006-base1';
const cardMasonryCss = readFileSync('assets/css/research/research-rdgroups-card-masonry-base.css', 'utf8');
const pharmaEnCss = readFileSync('assets/css/research/research-carousel-en-height.css', 'utf8');
const slopeCss = readFileSync('assets/css/research/research-slope-spacing.css', 'utf8');
const tabCss = readFileSync('assets/css/research/research-rdgroups-tabs.css', 'utf8');
assert.match(summaryCss, /font-size:\s*20px\s*!important/);
assert.match(tabCss, /\.p-rdgroups__tablist \.position\s*\{[^}]*width:\s*auto\s*!important/s,
  'shared tab layer owns label widths instead of inline values');

for (const path of paths) {
  const html = readFileSync(path, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.equal(html.split(baseHref).length - 1, 1, `${path}: one shared tab stylesheet`);
  assert.equal(html.split(summaryHref).length - 1, 1, `${path}: one English summary stylesheet`);
  assert(head.indexOf('../assets/js/root/010.js') < head.indexOf(baseHref), `${path}: shared rules occupy former inline block slot`);
  assert(head.indexOf(baseHref) < head.indexOf(summaryHref), `${path}: tab structure precedes localized typography`);
  assert(head.indexOf(summaryHref) < head.indexOf('../assets/css/archive-consistency.css'), `${path}: page CSS ordering retained`);
  assert(!head.includes('.p-rdgroups__tablist li {'), `${path}: duplicate tab layout rules removed from head`);
  assert.doesNotMatch(html, /<span class="position"\s+style="width:/, `${path}: overridden fixed label widths removed`);
  assert.match(html, /class="[^"]*p-rdgroups__tablist/, `${path}: tab owner exists`);
  assert.match(html, /class="[^"]*p-rdgroups__summary/, `${path}: summary owner exists`);
}

const medical = readFileSync(paths[0], 'utf8');
assert.match(slopeCss, /\.paragraph--type-p-fullwidth\.background--grey\.slope--pos\.js-animate\s*\{\s*margin-top:\s*-300px/);
assert(medical.includes('../assets/css/research/research-slope-spacing.css?v=20260929-1'), 'Medical EN should load the shared slope spacing layer');
assert.match(pharmaCss, /\.paragraph--type-p-masonry\s*\{\s*margin-bottom:\s*0\s*!important/);
assert.match(cardMasonryCss, /\.p-masonry__grid\s*\{\s*height:\s*1220px\s*!important/);
assert.match(cardMasonryCss, /\.p-project-carousel__content \.project-carousel__content\s*\{\s*min-height:\s*362px/);
assert.doesNotMatch(pharmaCss, /min-height:\s*362px\s*!important|height:\s*1220px\s*!important/);
assert.match(pharmaEnCss, /min-height:\s*510px\s*!important/);

const nuclearEn = readFileSync('Research/Research-Nuclear-en.html', 'utf8');
const nuclearLate = [
  '../assets/css/research/research-rdarea-late-layout.css?v=20260929-shared1',
  baseHref,
  summaryHref,
  cardMasonryHref,
  '../assets/css/research/research-nuclear-late-layout.css?v=20261006-late2',
  '../assets/css/research/research-carousel-en-height.css?v=20260930-1',
];
const nuclearIndexes = nuclearLate.map(href => nuclearEn.indexOf(href));
assert(nuclearIndexes.every(index => index > nuclearEn.indexOf('</main>')), 'Nuclear EN shared rules retain the late body layer');
assert(nuclearIndexes.every((index, i) => i === 0 || nuclearIndexes[i - 1] < index), 'Nuclear EN late shared and local layers retain their order');
assert(nuclearIndexes.at(-1) < nuclearEn.indexOf('Hide skip-link by default'), 'Nuclear EN styles remain before late behavior script');
assert.equal((nuclearEn.match(/<style\b/gi) || []).length, 0, 'Nuclear EN inline block is removed');
assert.match(nuclearEn, /class="[^"]*p-rdgroups__tablist/);
assert.match(nuclearEn, /class="[^"]*p-rdgroups__summary/);
assert(nuclearIndexes[3] < nuclearIndexes[4], 'Nuclear shared card/Masonry base should precede its local late layout');
assert.match(pharmaEnCss, /\.p-project-carousel__content \.project-carousel__content\s*\{\s*min-height:\s*510px\s*!important/);
assert.doesNotMatch(readFileSync('assets/css/research/research-nuclear-late-layout.css', 'utf8'), /min-height:\s*362px\s*!important|height:\s*1220px\s*!important/);

console.log('Research Medical/Pharmaceutical/Nuclear English shared R&D-groups contract passed (3 pages; late layer order retained).');
