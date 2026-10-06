import assert from 'node:assert/strict';
import fs from 'node:fs';

const pages = new Map([
  ['Research/Research-Medical-cn.html', 7], ['Research/Research-Medical-en.html', 7],
  ['Research/Research-Nuclear-cn.html', 5], ['Research/Research-Nuclear-en.html', 5],
  ['Research/Research-Physics-cn.html', 5], ['Research/Research-Physics-en.html', 5],
  ['Research/Research-Pharmaceutical-cn.html', 5], ['Research/Research-Pharmaceutical-en.html', 5],
  ['Research/Research-Initiatives-cn.html', 7], ['Research/Research-Initiatives-en.html', 7],
]);
const heroPages = new Map([
  ['Research/Research-ov-cn.html', 12], ['Research/Research-ov-en.html', 12],
]);
const behavior = fs.readFileSync('assets/js/root/002.js', 'utf8');
const stylesheet = fs.readFileSync('assets/css/legacy-theme-foundation.css', 'utf8')
  + fs.readFileSync('assets/css/research/counter-cwmd/15.css', 'utf8');

assert.match(behavior, /rdGroupList[\s\S]*?\.p-rdgroups__panel[\s\S]*?matchHeight\(\{byRow:!1\}\)[\s\S]*?matchHeight\(\{remove:!0\}\)[\s\S]*?load resize/,
  'the existing behavior owns desktop equalization and responsive height removal');
assert.match(behavior, /rdHeroGrid[\s\S]*?\.p-rdhero__item[\s\S]*?matchHeight\(\{byRow:!1\}\)[\s\S]*?matchHeight\(\{remove:!0\}\)[\s\S]*?load resize/,
  'the existing behavior owns Research overview card equalization and responsive height removal');
assert.match(stylesheet, /\.p-rdgroups__panel\[aria-hidden=true\]\{display:none;\}/,
  'CSS retains the inactive-tab baseline when runtime heights are absent');

for (const [file, expectedPanels] of pages) {
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes('../assets/js/root/002.js'), `${file}: the height behavior remains loaded`);
  const panels = html.match(/class="[^"]*p-rdgroups__panel[^"]*"/g) || [];
  assert.equal(panels.length, expectedPanels, `${file}: preserve panel count`);
  assert.doesNotMatch(html, /class="[^"]*p-rdgroups__panel[^"]*"[^>]*style="height:/,
    `${file}: remove serialized panel heights so the load/resize behavior owns them`);
}

for (const [file, expectedItems] of heroPages) {
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes('../assets/js/root/002.js'), `${file}: the hero-grid behavior remains loaded`);
  const items = html.match(/<li class="p-rdhero__item"[^>]*>/g) || [];
  assert.equal(items.length, expectedItems, `${file}: preserve hero-card count`);
  assert.doesNotMatch(html, /<li class="p-rdhero__item"[^>]*style="height:/,
    `${file}: remove serialized hero heights so the load/resize behavior owns them`);
}

process.stdout.write(`PASS: ${pages.size} Research tab pages and ${heroPages.size} overview pages preserve content while runtime owns responsive heights.\n`);
