import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const research = path.join(root, 'Research');
const basePath = 'assets/css/research/physics-layout.css';
const cardMasonryHref = '../assets/css/research/research-rdgroups-card-masonry-base.css?v=20261006-base2';
const tabsHref = '../assets/css/research/research-rdgroups-tabs.css?v=20260929-1';
const summaryHref = '../assets/css/research/research-rdgroups-summary-22.css?v=20260929-1';
const enPath = 'assets/css/research/physics-en-overrides.css';
const base = fs.readFileSync(path.join(root, basePath), 'utf8');
const tabsCss = fs.readFileSync(path.join(root, 'assets/css/research/research-rdgroups-tabs.css'), 'utf8');
const summaryCss = fs.readFileSync(path.join(root, 'assets/css/research/research-rdgroups-summary-22.css'), 'utf8');
const english = fs.readFileSync(path.join(root, enPath), 'utf8');
assert(!base.includes('.p-rdgroups__tablist'), 'Physics layout should not duplicate the shared R&D Groups tab component');
assert(tabsCss.includes('.p-rdgroups__tablist li') && tabsCss.includes('.p-rdgroups__tablist li[aria-selected="true"] .contain::before'), 'shared tab layer should own tab typography and active marker');
assert(!base.includes('.p-project-carousel__content .project-carousel__content'), 'shared card geometry should not be duplicated in Physics layout');
assert(!base.includes('.p-rdgroups__summary'), 'Physics layout should not duplicate the shared summary typography');
assert.match(summaryCss, /\.p-rdgroups__summary\s*\{[^}]*font-size:\s*22px\s*!important;[^}]*line-height:\s*1\.7\s*!important;[^}]*font-weight:\s*300\s*!important/s, 'shared summary layer should own the Chinese default typography');
const tabConsumers = fs.readdirSync(research).filter(file => file.startsWith('Research-') && file.endsWith('.html')
  && fs.readFileSync(path.join(research, file), 'utf8').includes(tabsHref));
assert.equal(tabConsumers.length, 10, 'the shared Research tab layer should cover all eight original pages plus both Physics overviews');
const summaryConsumers = fs.readdirSync(research).filter(file => file.startsWith('Research-') && file.endsWith('.html')
  && fs.readFileSync(path.join(research, file), 'utf8').includes(summaryHref));
assert.equal(summaryConsumers.length, 7, 'the shared summary layer should cover all seven 22px summary pages');
const cardMasonry = fs.readFileSync(path.join(root, 'assets/css/research/research-rdgroups-card-masonry-base.css'), 'utf8');
assert.match(cardMasonry, /min-height:\s*362px\s*!important/);
assert.match(cardMasonry, /\.p-masonry__grid\s*\{\s*height:\s*1220px\s*!important/s);
assert.match(cardMasonry, /\.paragraph--type-p-masonry\s*\{\s*margin-bottom:\s*0\s*!important/s);
assert.doesNotMatch(base, /\.paragraph--type-p-masonry\s*\{\s*margin-bottom:\s*0\s*!important/);
assert(english.includes('font-size: 20px !important') && english.includes('min-height: 510px !important'), 'English typography and card height should remain explicit overrides');

for (const language of ['cn', 'en']) {
  const file = `Research/Research-Physics-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const shared = html.indexOf(`../${basePath}?v=20261006-shared9`);
  const cardMasonry = html.indexOf(cardMasonryHref);
  const summary = html.indexOf(summaryHref);
  const tabs = html.indexOf(tabsHref);
  const archive = html.indexOf('../assets/css/archive-consistency.css');
  assert(cardMasonry > 0 && cardMasonry < shared && shared < summary && summary < tabs && tabs < archive, `${file}: shared card/Masonry base precedes Physics layout, then summary and tabs`);
  assert.equal(html.split(summaryHref).length - 1, 1, `${file}: load the shared summary component once`);
  assert.equal(html.split(tabsHref).length - 1, 1, `${file}: load the shared tab component once`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: migrated layout should no longer be inline`);
  assert.doesNotMatch(html, /<span class="position"\s+style="width:/, `${file}: remove label widths already overridden by shared CSS`);
  const override = html.indexOf(`../${enPath}?v=20260929-shared6`);
  if (language === 'en') assert(tabs < override && override < archive, `${file}: English override should follow the shared tab component`);
  else {
    assert.equal(override, -1, `${file}: English override should not load on Chinese page`);
    assert(shared < html.indexOf('../assets/css/cn-link-label.css'), `${file}: Chinese link label CSS should keep its later position`);
  }
}

process.stdout.write('PASS: Research Physics shares structural CSS and preserves language-specific summary/card values.\n');
