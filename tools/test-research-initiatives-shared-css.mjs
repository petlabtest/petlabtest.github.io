import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pages = [
  'Research/Research-Initiatives-cn.html',
  'Research/Research-Initiatives-en.html',
];
const componentHref = '../assets/css/research/research-initiatives-components.css?v=20261003-shell2';
const tabsHref = '../assets/css/research/research-rdgroups-tabs.css?v=20260929-1';
const summaryHref = '../assets/css/research/research-rdgroups-summary-22.css?v=20260929-1';
const slopeHref = '../assets/css/research/research-slope-spacing.css?v=20260929-1';
const components = readFileSync('assets/css/research/research-initiatives-components.css', 'utf8');
const tabs = readFileSync('assets/css/research/research-rdgroups-tabs.css', 'utf8');
const summary = readFileSync('assets/css/research/research-rdgroups-summary-22.css', 'utf8');

const appShellLayer = readFileSync('assets/css/app-shell-header-layer.css', 'utf8');
assert.match(appShellLayer, /#petlab-header\s*\{\s*z-index:\s*1000/);
assert.match(components, /margin-top:\s*-50px/);
assert.match(components, /aspect-ratio:\s*16\s*\/\s*9/);
assert.match(components, /object-fit:\s*cover/);
assert.match(tabs, /left:\s*var\(--line-left,\s*100%\)/);
assert.match(tabs, /background:\s*#F45A2B\s*!important/);
assert.match(summary, /font-size:\s*22px\s*!important/);

for (const path of pages) {
  const html = readFileSync(path, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.equal(html.split(componentHref).length - 1, 1, `${path}: shared initiative component CSS loaded once`);
  assert.equal(html.split(tabsHref).length - 1, 1, `${path}: shared R&D tab layout loaded once`);
  assert.equal(html.split(summaryHref).length - 1, 1, `${path}: 22px summary contract loaded once`);
  assert.equal(html.split(slopeHref).length - 1, 1, `${path}: shared desktop slope spacing loaded once`);
  assert(head.indexOf('../assets/css/news/news-overview-components.css') < head.indexOf(componentHref), `${path}: component CSS retains first style-block position`);
  const headerLayerHref = '../assets/css/app-shell-header-layer.css?v=20260929-1';
  assert(head.indexOf(componentHref) < head.indexOf(headerLayerHref) && head.indexOf(headerLayerHref) < head.indexOf(tabsHref), `${path}: component CSS, shared AppShell stacking, and R&D-tab layer stay ordered`);
  assert(head.indexOf(tabsHref) < head.indexOf(summaryHref), `${path}: tab layout precedes summary typography`);
  assert(head.indexOf(summaryHref) < head.indexOf('../assets/css/archive-consistency.css'), `${path}: shared CSS remains before trailing page layers`);
  if (head.includes('../assets/css/cn-link-label.css')) {
    assert(head.indexOf(summaryHref) < head.indexOf('../assets/css/cn-link-label.css'), `${path}: shared CSS remains before localized link labels`);
  }
  assert(!head.includes('.p-rdgroups__tablist li {'), `${path}: repeated R&D tab selectors removed from inline CSS`);
  assert(head.indexOf(slopeHref) < head.indexOf('../assets/css/archive-consistency.css'), `${path}: shared slope spacing remains before trailing page layers`);
  assert.match(html, /class="[^"]*p-rdgroups__tablist/, `${path}: tab DOM owner exists`);
  const tabLabels = [...html.matchAll(/<span class="position"([^>]*)>/g)];
  assert.equal(tabLabels.length, 7, `${path}: all seven R&D labels remain present`);
  assert(tabLabels.every(([, attributes]) => !/\bstyle\s*=/.test(attributes)), `${path}: R&D label widths remain owned by shared CSS`);
  assert.match(html, /class="[^"]*p-rdgroups__summary/, `${path}: summary DOM owner exists`);
  assert.match(html, /class="[^"]*paragraph--type-p-project-carousel/, `${path}: carousel DOM owner exists`);
}

console.log('Research Initiatives shared component and R&D-tab CSS contract passed (2 pages).');
