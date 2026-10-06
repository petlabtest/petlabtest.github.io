import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const paths = [
  'Research/Research-Medical-cn.html',
  'Research/Research-Nuclear-cn.html',
  'Research/Research-Pharmaceutical-cn.html',
];
const baseHref = '../assets/css/research/research-rdgroups-tabs.css?v=20260929-1';
const summaryHref = '../assets/css/research/research-rdgroups-summary-22.css?v=20260929-1';
const css = readFileSync('assets/css/research/research-rdgroups-tabs.css', 'utf8');
const summaryCss = readFileSync('assets/css/research/research-rdgroups-summary-22.css', 'utf8');
const pharmaCss = readFileSync('assets/css/research/pharmaceutical-layout.css', 'utf8');
const cardMasonryHref = '../assets/css/research/research-rdgroups-card-masonry-base.css?v=20261006-base2';
const cardMasonryCss = readFileSync('assets/css/research/research-rdgroups-card-masonry-base.css', 'utf8');
const medicalOverrides = readFileSync('assets/css/research/research-medical-overrides.css', 'utf8');

assert.match(css, /font-size:\s*24px\s*!important/);
assert.match(css, /left:\s*var\(--line-left,\s*100%\)/);
assert.match(css, /background:\s*#F45A2B\s*!important/);
assert.match(css, /\.p-rdgroups__tablist \.position\s*\{[^}]*width:\s*auto\s*!important/s,
  'shared tab layer owns label widths instead of inline values');
assert.match(summaryCss, /font-size:\s*22px\s*!important/);

for (const path of paths) {
  const html = readFileSync(path, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.equal(html.split(baseHref).length - 1, 1, `${path}: one shared tab stylesheet`);
  assert.equal(html.split(summaryHref).length - 1, 1, `${path}: one Chinese summary stylesheet`);
  assert(head.indexOf('../assets/js/root/010.js') < head.indexOf(baseHref), `${path}: original inline block position retained`);
  assert(head.indexOf(baseHref) < head.indexOf(summaryHref), `${path}: tab structure precedes localized typography`);
  assert(head.indexOf(summaryHref) < head.indexOf('../assets/css/cn-link-label.css'), `${path}: ordering before following shared styles retained`);
  assert(!head.includes('.p-rdgroups__tablist li {'), `${path}: duplicate inline component rules removed`);
  assert.doesNotMatch(html, /<span class="position"\s+style="width:/, `${path}: overridden fixed label widths removed`);
  for (const selector of ['p-rdgroups__tablist', 'p-rdgroups__summary', 'aria-selected="true"']) {
    assert(html.includes(selector), `${path}: component owns ${selector}`);
  }
}

const medicalCn = readFileSync(paths[0], 'utf8');
assert.match(medicalOverrides, /body\.page-research-research-medical-cn \.paragraph--type-p-masonry\s*\{\s*margin-bottom:\s*0\s*!important/);
assert.match(medicalOverrides, /body\.page-research-research-medical-cn \.p-masonry__grid\s*\{\s*height:\s*1220px\s*!important/);
assert.match(cardMasonryCss, /\.paragraph--type-p-masonry\s*\{\s*margin-bottom:\s*0\s*!important/);
assert.doesNotMatch(pharmaCss, /\.paragraph--type-p-masonry\s*\{\s*margin-bottom:\s*0\s*!important/);
assert.match(cardMasonryCss, /\.p-masonry__grid\s*\{\s*height:\s*1220px\s*!important/);
assert.doesNotMatch(pharmaCss, /height:\s*1220px\s*!important/);
for (const path of paths.slice(1)) {
  const html = readFileSync(path, 'utf8');
  const shared = html.indexOf(cardMasonryHref);
  const local = html.indexOf('research-nuclear-late-layout.css?v=20261006-late2');
  const pharmaceutical = html.indexOf('pharmaceutical-layout.css?v=20261006-shared2');
  assert(shared > 0, `${path}: shared card/Masonry base should load`);
  if (path.includes('Nuclear')) assert(shared < local, `${path}: shared base precedes local Nuclear styles`);
  if (path.includes('Pharmaceutical')) assert(shared < pharmaceutical, `${path}: shared base precedes local Pharmaceutical styles`);
  if (path.includes('Nuclear')) assert.doesNotMatch(readFileSync('assets/css/research/research-nuclear-late-layout.css', 'utf8'), /\.paragraph--type-p-masonry\s*\{\s*margin-bottom:\s*0\s*!important/);
}

console.log('Research Nuclear/Medical/Pharmaceutical Chinese R&D-groups shared CSS contract passed (3 pages).');
