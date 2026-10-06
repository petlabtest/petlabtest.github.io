import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const basePath = 'assets/css/research/pharmaceutical-layout.css';
const enPath = 'assets/css/research/research-carousel-en-height.css';
const latePath = 'assets/css/research/research-rdarea-late-layout.css';
const cardMasonryHref = '../assets/css/research/research-rdgroups-card-masonry-base.css?v=20261006-base2';
const base = fs.readFileSync(path.join(root, basePath), 'utf8');
const english = fs.readFileSync(path.join(root, enPath), 'utf8');
const late = fs.readFileSync(path.join(root, latePath), 'utf8');
const cardMasonry = fs.readFileSync(path.join(root, 'assets/css/research/research-rdgroups-card-masonry-base.css'), 'utf8');
assert.match(cardMasonry, /min-height:\s*362px\s*!important/);
assert.match(cardMasonry, /height:\s*1220px\s*!important/);
assert.match(cardMasonry, /\.paragraph--type-p-masonry\s*\{\s*margin-bottom:\s*0\s*!important/);
assert.doesNotMatch(base, /\.paragraph--type-p-masonry\s*\{\s*margin-bottom:\s*0\s*!important/);
assert.doesNotMatch(base, /min-height:\s*362px\s*!important|height:\s*1220px\s*!important/, 'shared geometry should not be duplicated in Pharmaceutical layout');
assert(english.includes('min-height: 510px !important'), 'English carousel height should remain a language-only override');
assert.match(late, /@media\s*\(min-width:\s*1025px\)[\s\S]*margin-top:\s*-50px/);
assert(!/url\s*\(|@import/i.test(base + late), 'moved styles should not contain unresolved resources');

for (const language of ['cn', 'en']) {
  const file = `Research/Research-Pharmaceutical-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const tabs = html.indexOf('../assets/css/research/research-rdgroups-tabs.css');
  const summary = html.indexOf(language === 'cn' ? 'research-rdgroups-summary-22.css' : 'research-rdgroups-summary-en.css');
  const layout = html.indexOf(`../${basePath}?v=20261006-shared2`);
  const cardMasonry = html.indexOf(cardMasonryHref);
  const archive = html.indexOf('../assets/css/archive-consistency.css');
  assert(tabs < summary && summary < cardMasonry && cardMasonry < layout && layout < archive, `${file}: shared card/Masonry base precedes local layout at the original layer slot`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: both extracted style blocks should be removed`);
  const override = html.indexOf(`../${enPath}?v=20260930-1`);
  if (language === 'en') assert(layout < override && override < archive, `${file}: English override should follow the base`);
  else assert.equal(override, -1, `${file}: English card height should not load in Chinese`);
  const late = html.indexOf(`../${latePath}?v=20260929-shared1`);
  assert(late > html.indexOf('</main>') && late < html.indexOf('floating-assistant.js'), `${file}: late body rule should remain in its original late layer`);
}

process.stdout.write('PASS: Pharmaceutical bilingual card values and late hero offset are externalized at their original layers.\n');
