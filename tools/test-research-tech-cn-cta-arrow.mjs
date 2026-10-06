import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const topics = ['Chips', 'Crystals', 'Imaging', 'Instruments', 'PnI'];
const href = '../assets/css/research/tech-cn-cta-arrow.css?v=20260928-arrow1';
const css = fs.readFileSync(path.join(root, 'assets/css/research/tech-cn-cta-arrow.css'));
assert.equal(css.byteLength, 569, 'shared CTA arrow CSS should preserve the original declaration block plus newline');
assert.equal(crypto.createHash('sha256').update(css.toString('utf8').trim()).digest('hex'), '0d52ef1b87ab4269e274364d4631c2605877b44dda4d2f39357e2bc798d0000a');
assert.equal((css.toString('utf8').match(/{/g) || []).length, 3, 'shared CTA stylesheet should contain its three original rules');
assert.equal((css.toString('utf8').match(/{/g) || []).length, (css.toString('utf8').match(/}/g) || []).length, 'shared CTA stylesheet braces should balance');

for (const topic of topics) {
  const html = fs.readFileSync(path.join(root, 'Research', `Research-Tech-${topic}-cn.html`), 'utf8');
  assert.equal(html.split(href).length - 1, 1, `${topic} CN page should load the shared arrow stylesheet once`);
  assert(!html.includes(`petlab-research-Tech-${topic}-cta:`), `${topic} CN page should not retain the inline arrow block`);
  const styleBlocks = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(([, block]) => block);
  assert(styleBlocks.every(block => !block.includes('.page-node-type-rdgroup a.cta--button::after')), `${topic} CN page should not duplicate the shared arrow rules inline`);
  const followingScript = topic === 'Instruments'
    ? '../assets/js/research/tech-instruments-core-showcase.js'
    : '../assets/js/research/project-list-image-layout.js';
  assert(html.indexOf(href) < html.indexOf(followingScript), `${topic} CN page should keep the CTA layer before scripts that originally followed it`);
  if (topic === 'Imaging') {
    const imagingLateLayer = '../assets/css/research/research-tech-cn-late-layout.css?v=20260929-techlate1';
    assert(html.indexOf(href) < html.indexOf(imagingLateLayer), 'Imaging page-specific CSS after the arrow rules should remain in its later shared stylesheet');
    assert.equal((html.match(/<style\b/gi) || []).length, 0, 'Imaging late rules should not return inline');
  }
}

for (const topic of ['Chips', 'Crystals', 'Detectors', 'Imaging', 'Instruments', 'PnI']) {
  const html = fs.readFileSync(path.join(root, 'Research', `Research-Tech-${topic}-en.html`), 'utf8');
  assert(!html.includes(href), `${topic} EN page should not gain a Chinese-only CTA rule`);
}

process.stdout.write('PASS: five CN Research Tech pages share the same CTA arrow rules without widening scope to EN or Detectors pages.\n');
