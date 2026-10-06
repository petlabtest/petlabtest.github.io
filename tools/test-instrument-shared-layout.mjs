import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharedPath = 'assets/css/capabilities/instrument-layout.css';
const englishPath = 'assets/css/capabilities/instrument-en-overrides.css';
const shared = fs.readFileSync(path.join(root, sharedPath), 'utf8');
const english = fs.readFileSync(path.join(root, englishPath), 'utf8');

assert(shared.includes('.view-laboratory-story-list-grid'), 'shared page layout should retain the story-card rules');
assert(shared.includes('url("../../fonts/root/media/r029.ttf")'), 'shared stylesheet should retain the rebased icon font');
assert(fs.existsSync(path.join(root, 'assets/fonts/root/media/r029.ttf')), 'rebased icon font should exist');
assert(english.includes('font-size: clamp(17px, 1.8vw, 25px) !important'), 'English title size should remain page-specific');
assert(english.includes('height: 84px !important') && english.includes('min-height: 84px'), 'English resting card height should remain page-specific');
assert(english.includes('font-size: clamp(15px, 1.2vw, 18px)'), 'English area font size should remain page-specific');

for (const language of ['cn', 'en']) {
  const file = `Capabilities/Capabilities-Instrument-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const sharedLink = html.indexOf(`../${sharedPath}?v=20260929-shared4`);
  const scripts = html.lastIndexOf('../assets/js/root/r023.js');
  const archive = html.indexOf('../assets/css/archive-consistency.css');
  assert(sharedLink > scripts && sharedLink < archive, `${file}: shared CSS should preserve its original cascade layer`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: extracted page CSS should no longer be inline`);

  const override = html.indexOf(`../${englishPath}?v=20260929-shared4`);
  if (language === 'en') assert(sharedLink < override && override < archive, `${file}: English override should follow shared CSS`);
  else assert.equal(override, -1, `${file}: English override should not load on the Chinese page`);
}

process.stdout.write('PASS: bilingual instrument pages share the base layout and preserve ordered English-only overrides.\n');
