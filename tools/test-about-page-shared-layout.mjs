import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const basePath = 'assets/css/about/about-page-layout.css';
const foundationPath = 'assets/css/about/about-page-foundation.css';
const enPath = 'assets/css/about/about-page-en-overrides.css';
const base = fs.readFileSync(path.join(root, basePath), 'utf8');
const foundation = fs.readFileSync(path.join(root, foundationPath), 'utf8');
const english = fs.readFileSync(path.join(root, enPath), 'utf8');
assert(base.includes('.dpet-stats') && base.includes('.dpet-stat__label'), 'shared About page layout should retain stat and label rules');
assert(base.includes('../../pic/School/jianzhu28.jpg') && base.includes('../../pic/root/media/07-bg-81ac28d2.jpg'), 'shared CSS should preserve rebased image URLs');
for (const url of [...base.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match => match[1])) {
  assert(fs.existsSync(path.resolve(root, 'assets/css/about', url)), `rebased image should exist: ${url}`);
}
assert(english.includes('font-family: inherit') && english.includes('font-size: 15px') && english.includes('font-weight: 600') && english.includes('line-height: 20px'), 'English statistic labels should retain their locale typography');
assert.match(foundation, /--shell: 1280px/);
assert.match(foundation, /\*\s*\{\s*box-sizing: border-box;/);
assert(!/:root|\*\s*\{|^html\s*\{|^body\s*\{|^a\s*\{|^img\s*\{/m.test(base), 'shared foundation rules should not be duplicated in the About page layout');

for (const language of ['cn', 'en']) {
  const file = `About/About-about-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const sharedFoundation = html.indexOf(`../${foundationPath}?v=20261003-base1`);
  const shared = html.indexOf(`../${basePath}?v=20261003-base1`);
  const archive = html.indexOf('../assets/css/archive-consistency.css');
  assert(sharedFoundation > 0 && sharedFoundation < shared && shared < archive, `${file}: foundation should precede page layout in the original head layer`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: extracted layout should no longer be inline`);
  const override = html.indexOf(`../${enPath}?v=20260929-shared5`);
  if (language === 'en') assert(shared < override && override < archive, `${file}: English override should follow shared CSS`);
  else assert.equal(override, -1, `${file}: English override should not load on the Chinese page`);
}

process.stdout.write('PASS: About Overview bilingual pages share layout while preserving English-only typography.\n');
