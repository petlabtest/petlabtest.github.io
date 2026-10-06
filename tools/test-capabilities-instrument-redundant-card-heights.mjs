import assert from 'node:assert/strict';
import fs from 'node:fs';

const shared = fs.readFileSync('assets/css/capabilities/instrument-layout.css', 'utf8');
const english = fs.readFileSync('assets/css/capabilities/instrument-en-overrides.css', 'utf8');
assert.match(shared, /\.view-laboratory-story-list-grid \.lab-grid__info\s*\{[^}]*height:\s*104px !important;/s);
assert.match(shared, /\.view-laboratory-story-list-grid \.lab-grid__wrapper:not\(:hover\):not\(:focus-within\) \.lab-grid__info\s*\{[^}]*height:\s*auto !important;/s);
assert.match(shared, /@media\s*\(max-width:\s*699px\)[\s\S]*?\.lab-grid__info\s*\{[^}]*height:\s*84px !important;/);
assert.match(english, /\.view-laboratory-story-list-grid \.lab-grid__wrapper:not\(:hover\):not\(:focus-within\) \.lab-grid__info\s*\{[^}]*height:\s*84px !important;/s);

for (const language of ['cn', 'en']) {
  const file = `Capabilities/Capabilities-Instrument-${language}.html`;
  const html = fs.readFileSync(file, 'utf8');
  assert.equal((html.match(/class="lab-grid__info"/g) || []).length, 21, `${file}: preserve all 21 instrument cards`);
  assert.equal((html.match(/class="lab-grid__info" style="height: (?:80|96)px;"/g) || []).length, 0, `${file}: remove inline heights overridden by !important layout rules`);
}

process.stdout.write('PASS: 42 redundant instrument-card height attributes are removed; shared hover/responsive heights and English idle override remain owned by CSS.\n');
