import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = 'assets/css/research/research-slope-spacing.css';
const css = fs.readFileSync(path.join(root, cssPath), 'utf8');
const link = `../${cssPath}?v=20260929-1`;
assert.match(css, /@media\s*\(min-width:\s*1025px\)[\s\S]*\.paragraph--type-p-fullwidth\.background--grey\.slope--pos\.js-animate[\s\S]*margin-top:\s*-300px !important/);

for (const page of ['Research-Core-cn', 'Research-Initiatives-cn', 'Research-Initiatives-en', 'Research-Medical-en']) {
  const html = fs.readFileSync(path.join(root, `Research/${page}.html`), 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.equal(html.split(link).length - 1, 1, `${page}: load shared spacing once`);
  assert.ok(head.indexOf(link) < head.indexOf('../assets/css/archive-consistency.css'), `${page}: preserve its original cascade layer`);
  assert.doesNotMatch(html, /margin-top:\s*-300px !important/, `${page}: remove duplicate inline declaration`);
}

process.stdout.write('PASS: Research Core, Initiatives, and Medical EN share one 1025px desktop slope-spacing rule.\n');
