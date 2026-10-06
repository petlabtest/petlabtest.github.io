import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharedPath = 'assets/css/people/overview-layout.css';
const englishPath = 'assets/css/people/overview-en-cta.css';
const shared = fs.readFileSync(path.join(root, sharedPath), 'utf8');
const english = fs.readFileSync(path.join(root, englishPath), 'utf8');
assert(shared.includes('object-fit: cover !important') && shared.includes('height: 48.303vw') && shared.includes('height: 772px'), 'shared hero crop and breakpoints should remain intact');
const appShellLayer = fs.readFileSync(path.join(root, 'assets/css/app-shell-header-layer.css'), 'utf8');
assert.match(appShellLayer, /#petlab-header\s*\{\s*z-index:\s*1000;/, 'AppShell layer ownership should remain in the shared header stylesheet');
assert(english.includes('.region-content a.cta--button .last-word::after') && english.includes('border-right: 2px solid currentColor'), 'English chevron should remain a language-specific override');

for (const language of ['cn', 'en']) {
  const file = `People/People-ov-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const sharedLink = `../${sharedPath}?v=20261003-shell2`;
  const englishLink = `../${englishPath}?v=20260929-shared1`;
  const sharedIndex = html.indexOf(sharedLink);
  const headerLayerIndex = html.indexOf('../assets/css/app-shell-header-layer.css?v=20260929-1');
  const archiveIndex = html.indexOf('../assets/css/archive-consistency.css');
  assert(sharedIndex > html.indexOf('webarchive_collaborations-dpet/019.css') && sharedIndex < headerLayerIndex && headerLayerIndex < archiveIndex, `${file}: shared rules should retain original cascade position before common AppShell stacking`);
  assert.equal(html.split(sharedLink).length - 1, 1, `${file}: shared layout should load once`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: extracted inline block should be removed`);
  const enIndex = html.indexOf(englishLink);
  if (language === 'en') assert(sharedIndex < enIndex && enIndex < archiveIndex, `${file}: English CTA override should follow shared rules`);
  else assert.equal(enIndex, -1, `${file}: English CTA override must not load on Chinese page`);
  assert(html.includes('hero--large-image') && html.includes('hero__image'), `${file}: hero component owner should remain in the DOM`);
}

process.stdout.write('PASS: People overview shares its bilingual hero/AppShell layout and keeps the English CTA exception layered.\n');
