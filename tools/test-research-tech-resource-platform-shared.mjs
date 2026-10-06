import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharedPath = path.join(root, 'assets/css/research/tech-resource-platform-shared.css');
const shared = fs.readFileSync(sharedPath, 'utf8');
const importLine = '@import url("./tech-resource-platform-shared.css?v=20261003-resource1");';
const selectors = [
  '.paragraph--type-p-project-list~.paragraph--type-wysiwyg',
  '.resource-platform',
  '.resource-product--pi .resource-product__inner',
  '.resource-product--array .resource-product__image',
  '@media (max-width: 1100px)',
  '@media (max-width: 699px)',
];

assert.equal((shared.match(/{/g) || []).length, (shared.match(/}/g) || []).length, 'shared resource stylesheet braces should balance');
for (const selector of selectors) assert(shared.includes(selector), `shared resource stylesheet should own ${selector}`);

for (const family of ['Detectors', 'PnI']) {
  const cssPath = path.join(root, `assets/css/research/tech-${family.toLowerCase()}-overrides.css`);
  const css = fs.readFileSync(cssPath, 'utf8');
  assert(css.startsWith(`${importLine}\n`), `${family} should import the shared layer first`);
  assert(!css.includes('.resource-platform {'), `${family} should not duplicate resource showcase layout rules`);
  assert(!css.includes('.paragraph--type-p-project-list~.paragraph--type-wysiwyg {'), `${family} should not duplicate shared WYSIWYG alignment`);

  for (const language of ['cn', 'en']) {
    const page = path.join(root, `Research/Research-Tech-${family}-${language}.html`);
    const html = fs.readFileSync(page, 'utf8');
    assert.equal(html.split(`tech-${family.toLowerCase()}-overrides.css?v=20261003-resource1`).length - 1, 1, `${family}-${language} should use the resource layer cache key once`);
  }
}

process.stdout.write('PASS: Detectors and PnI share one bilingual resource showcase and WYSIWYG alignment layer.\n');
