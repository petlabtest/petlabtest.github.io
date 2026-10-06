import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const href = '../assets/css/research/tech-instruments-core-showcase.css?v=20260928-instruments1';
const css = fs.readFileSync(path.join(root, 'assets/css/research/tech-instruments-core-showcase.css'));
const source = css.toString('utf8');
assert.equal(css.byteLength, 10048);
assert.equal(crypto.createHash('sha256').update(css).digest('hex'), '8d7b41080c3a80216d12d662a3e3764a6e925b952d303e99c64df8ea56057a74');
assert.equal((source.match(/{/g) || []).length, (source.match(/}/g) || []).length, 'shared Core Technologies CSS braces should balance');
assert(source.includes('line-height: 1.4 !important;'), 'shared layer should preserve the CN title value');
assert.match(source, /html\[lang="en"\] \.core-technologies-showcase \.view-projects-blocks \.views-row \.node--view-mode-carousel \.project-carousel__title a\s*\{\s*line-height: 1\.65 !important;/, 'English title-link spacing should be explicit in the shared component layer');

for (const language of ['cn', 'en']) {
  const file = `Research-Tech-Instruments-${language}.html`;
  const html = fs.readFileSync(path.join(root, 'Research', file), 'utf8');
  assert.equal(html.split(href).length - 1, 1, `${file} should load the shared CSS once`);
  assert(html.indexOf('../assets/js/research/tech-project-carousel-static.js') < html.indexOf(href), `${file} should keep the stylesheet at its original late layer`);
  assert(html.indexOf(href) < html.indexOf('../assets/js/research/tech-instruments-core-showcase.js'), `${file} should keep the stylesheet before the following script`);
  if (language === 'cn') {
    assert(html.indexOf(href) < html.indexOf('../assets/css/research/tech-cn-cta-arrow.css'), 'CN arrow correction should remain after Core Technologies styles');
    assert.equal((html.match(/<style\b/gi) || []).length, 0, 'CN page should no longer need this inline style block');
  }
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file} should not retain this component's inline style block`);
}

process.stdout.write('PASS: Instruments shares its 9.8KB Core Technologies layer and preserves the EN title line-height override.\n');
