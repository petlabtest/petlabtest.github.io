import assert from 'node:assert/strict';
import fs from 'node:fs';

const stylesheet = '../assets/css/engage/engage-visit-layout.css?v=20260930-1';
const css = fs.readFileSync('assets/css/engage/engage-visit-layout.css', 'utf8');
assert.match(css, /^\.visit-requirements-intro\s*\{\s*margin-bottom:\s*11px;\s*\}\s*$/);

for (const language of ['cn', 'en']) {
  const file = `Engage/Engage-Visit-${language}.html`;
  const html = fs.readFileSync(file, 'utf8');
  assert.equal(html.split(stylesheet).length - 1, 1, `${file}: shared layout loads exactly once`);
  assert.equal((html.match(/<p class="visit-requirements-intro">/g) || []).length, 1, `${file}: preserve one marked requirements lead`);
  assert.equal((html.match(/<p style="margin-bottom:11px">/g) || []).length, 0, `${file}: remove the former inline margin`);
}

process.stdout.write('PASS: bilingual Engage Visit requirements share their paragraph spacing rule.\n');
