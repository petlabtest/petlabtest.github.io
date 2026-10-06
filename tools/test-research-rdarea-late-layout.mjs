import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = 'assets/css/research/research-rdarea-late-layout.css';
const css = fs.readFileSync(path.join(root, cssPath), 'utf8');
assert.match(css, /@media\s*\(min-width:\s*1025px\)[\s\S]*body\.path-node\.page-node-type-rdarea \.hero\.hero--large-image[\s\S]*margin-top:\s*-50px/);
assert(!/url\s*\(|@import/i.test(css), 'late rdarea layer should not require resource rebasing');

for (const page of ['Research-Medical-cn', 'Research-Medical-en', 'Research-Pharmaceutical-cn', 'Research-Pharmaceutical-en', 'Research-Nuclear-cn', 'Research-Nuclear-en']) {
  const html = fs.readFileSync(path.join(root, `Research/${page}.html`), 'utf8');
  const linkText = `../${cssPath}?v=20260929-shared1`;
  const link = html.indexOf(linkText);
  assert(link > html.indexOf('</main>'), `${page}: keep shared rule in the late body layer`);
  assert(link < html.indexOf('Hide skip-link by default'), `${page}: load before late skip-link behavior`);
  assert.equal(html.split(linkText).length - 1, 1, `${page}: load shared late layer once`);
  assert(!/Keep this research-area hero clear[\s\S]{0,500}margin-top:\s*-50px/.test(html), `${page}: remove duplicated inline rule`);
}

process.stdout.write('PASS: Medical, Pharmaceutical, and Nuclear preserve one shared Research area late Hero layer.\n');
