import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharedPath = 'assets/css/people/student-layout.css';
const enPath = 'assets/css/people/fullwidth-cta-arrow.css';
const shared = fs.readFileSync(path.join(root, sharedPath), 'utf8');
const english = fs.readFileSync(path.join(root, enPath), 'utf8');
assert(shared.includes('.p-fullwidth__body a.professor-link'), 'professor-link styles should remain in the page-family layer');
assert.match(shared, /\.student-admissions-emphasis\s*\{\s*text-decoration:\s*underline;\s*\}/, 'bilingual student admissions emphasis should be owned by shared CSS');
assert(english.includes('background--grey.slope--pos') && english.includes('transform: translateX(3px) rotate(45deg)'), 'shared English full-width CTA arrow and hover motion should remain in its component layer');

for (const language of ['cn', 'en']) {
  const file = `People/People-Student-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const sharedLink = `../${sharedPath}?v=20261003-shell2`;
  const enLink = `../${enPath}?v=20261006-shared1`;
  const sharedIndex = html.indexOf(sharedLink);
  const headerLayerIndex = html.indexOf('../assets/css/app-shell-header-layer.css?v=20260929-1');
  const archiveIndex = html.indexOf('../assets/css/archive-consistency.css');
  assert(sharedIndex > html.indexOf('webarchive_dpet-independent-activities-period/013.css') && sharedIndex < headerLayerIndex && headerLayerIndex < archiveIndex, `${file}: preserve page-family and shared AppShell layer position`);
  assert.equal(html.split(sharedLink).length - 1, 1, `${file}: load shared layer once`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: extracted style block should be removed`);
  if (language === 'en') assert(sharedIndex < html.indexOf(enLink) && html.indexOf(enLink) < archiveIndex, `${file}: CTA override should follow shared styles`);
  else assert.equal(html.indexOf(enLink), -1, `${file}: English CTA should not load on Chinese page`);
  assert(html.includes('class="professor-link"'), `${file}: professor-link owner remains in page`);
  assert.equal((html.match(/class="student-admissions-emphasis"/g) || []).length, 1, `${file}: preserve one language-specific emphasis span`);
  assert.doesNotMatch(html, /student-admissions-emphasis[^>]*style=|<span style="text-decoration:\s*underline"/, `${file}: underline should not return inline`);
}

for (const file of ['People/People-Career-cn.html', 'People/People-Career-en.html', 'People/People-Student-en.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const arrowLink = `../${enPath}?v=20261006-shared1`;
  assert.equal(html.split(arrowLink).length - 1, 1, `${file}: load the shared full-width CTA arrow once`);
  assert(html.indexOf(arrowLink) < html.indexOf('../assets/css/archive-consistency.css'), `${file}: keep the shared arrow ahead of archive overrides`);
}
assert.equal((english.match(/background--grey\.slope--pos \.p-fullwidth__cta \.cta--button \.last-word::after/g) || []).length, 1, 'the full-width CTA arrow should have one shared owner');

process.stdout.write('PASS: People Student shares AppShell/professor-link rules and keeps English CTA motion layered.\n');
