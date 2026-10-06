import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const research = path.join(root, 'Research');
const shared = fs.readFileSync(path.join(root, 'assets/css/research/tech-carousel-static-guard.css'), 'utf8');
assert.equal((shared.match(/{/g) || []).length, (shared.match(/}/g) || []).length, 'shared carousel guard braces should balance');
for (const selector of ['.slick-slide[aria-hidden="true"]', '.slick-list', '.slick-track', '.p-project-carousel__cta', '@media (max-width: 1100px)', '@media (max-width: 699px)']) {
  assert(shared.includes(selector), `shared carousel guard should retain ${selector}`);
}

for (const topic of ['Imaging', 'Instruments']) {
  const override = fs.readFileSync(path.join(root, `assets/css/research/tech-${topic.toLowerCase()}-overrides.css`), 'utf8');
  assert.match(override, new RegExp(`^@import url\\("\\./tech-featured-strengths-grid\\.css\\?v=20261003-staticgrid1"\\);\\n@import url\\("\\./tech-carousel-static-guard\\.css\\?v=20261003-carouselguard1"\\);`),
    `${topic} should load Featured Strengths then the shared guard before local styles`);
  assert(!override.includes('Final layout guard: the local carousel scripts'), `${topic} should not retain a duplicate guard block`);

  for (const language of ['cn', 'en']) {
    const html = fs.readFileSync(path.join(research, `Research-Tech-${topic}-${language}.html`), 'utf8');
    assert(html.includes(`tech-${topic.toLowerCase()}-overrides.css?v=20261003-carouselguard1`), `${topic}-${language} should use the cache-busted override`);
  }
}

const chipsOverride = fs.readFileSync(path.join(root, 'assets/css/research/tech-chips-overrides.css'), 'utf8');
assert.match(chipsOverride, /^@import url\("\.\/tech-featured-strengths-grid\.css\?v=20261003-staticgrid1"\);\n@import url\("\.\/tech-carousel-static-guard\.css\?v=20261006-carouselguard2"\);/,
  'Chips should import the shared guard after the featured grid and before local styles');
assert(!chipsOverride.includes('Final layout guard: the local carousel scripts'), 'Chips should not retain a duplicate shared guard block');
for (const language of ['cn', 'en']) {
  const html = fs.readFileSync(path.join(research, `Research-Tech-Chips-${language}.html`), 'utf8');
  assert(html.includes('tech-chips-overrides.css?v=20261006-carouselguard2'), `Chips-${language} should use the cache-busted shared guard layer`);
}

process.stdout.write('PASS: Chips, Imaging, and Instruments share one script-resistant static carousel guard with page-owned grid variants.\n');
