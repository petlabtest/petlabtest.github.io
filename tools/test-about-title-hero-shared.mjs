import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharedPath = 'assets/css/about/about-title-hero-shared.css';
const shared = fs.readFileSync(path.join(root, sharedPath), 'utf8');
const editorialTypePath = 'assets/css/about/about-title-hero-editorial-type.css';
const editorialType = fs.readFileSync(path.join(root, editorialTypePath), 'utf8');
const families = [
  ['mission', 'about-mission-layout.css', editorialTypePath],
  ['history', 'history-page-layout.css', 'history-title-hero.css'],
  ['leadership', 'leadership-layout.css', 'leadership-title-hero.css'],
  ['impact', 'impact-layout.css', editorialTypePath],
];

assert.equal((shared.match(/\.about-hero-wrap\s*\{/g) ?? []).length, 2, 'shared layer should own desktop and mobile hero container geometry');
assert.equal((shared.match(/\.about-hero-inner\s*\{/g) ?? []).length, 2, 'shared layer should own desktop and mobile content geometry');
assert.match(shared, /\.about-hero-wrap::after\s*\{[^}]*clip-path: polygon/s, 'shared layer should own the sloped background mask');
assert(!/\.about-hero-title\s*\{/.test(shared), 'geometry layer should not decide page-family title typography');
assert.match(editorialType, /\.about-hero-title\s*\{[^}]*font-size: clamp\(2\.5rem, 5vw, 4\.0625rem\)/s, 'Mission and Impact should share their matching title typography');

for (const [family, layout, typeLayer] of families) {
  for (const language of ['cn', 'en']) {
    const file = `About/About-${family}-${language}.html`;
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const layoutIndex = html.indexOf(layout);
    const sharedIndex = html.indexOf(`${sharedPath}?v=20261003-2`);
    const typeIndex = html.indexOf(typeLayer === editorialTypePath ? `${typeLayer}?v=20261003-1` : typeLayer);
    const archiveIndex = html.indexOf('archive-consistency.css');
    assert(layoutIndex >= 0 && layoutIndex < sharedIndex && sharedIndex < typeIndex && typeIndex < archiveIndex, `${file}: preserve layout > shared geometry > title type > archive order`);
  }
}

for (const file of ['history-title-hero.css', 'leadership-title-hero.css']) {
  const variant = fs.readFileSync(path.join(root, 'assets/css/about', file), 'utf8');
  assert(!/\.about-hero-wrap(?:::after)?\s*\{|\.about-hero-inner\s*\{|@media\s*\(max-width:\s*699px\)/.test(variant), `${file}: shared geometry should not be duplicated`);
  assert(/\.about-hero-title\s*\{/.test(variant), `${file}: page-specific title typography should remain`);
}
for (const file of ['history-page-layout.css', 'leadership-layout.css']) {
  const layout = fs.readFileSync(path.join(root, 'assets/css/about', file), 'utf8');
  assert(!/\.about-hero-wrap\s*\{|\.about-hero-wrap::after\s*\{|\.about-hero-inner\s*\{|\.about-hero-title\s*\{|@media\s*\(max-width:\s*1100px\)/.test(layout), `${file}: shared hero geometry and variant title type should not remain in the page layout layer`);
}
const historyType = fs.readFileSync(path.join(root, 'assets/css/about/history-title-hero.css'), 'utf8');
assert.match(historyType, /font-size:\s*clamp\(3rem, 6vw, 5\.2rem\)/);
assert.match(historyType, /line-height:\s*1;/);
assert.match(historyType, /font-weight:\s*700;/);
for (const file of ['about-mission-layout.css', 'impact-layout.css']) {
  const layout = fs.readFileSync(path.join(root, 'assets/css/about', file), 'utf8');
  assert(!/\.about-hero-wrap(?:::after)?\s*\{|\.about-hero-inner\s*\{|\.about-hero-title\s*\{|@media\s*\(max-width:\s*699px\)/.test(layout), `${file}: shared title hero rules should not be retained in the page layer`);
}

process.stdout.write('PASS: About title hero geometry is shared across eight pages with the editorial title type isolated from History and Leadership.\n');
