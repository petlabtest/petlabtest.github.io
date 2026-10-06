import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = 'assets/css/research/research-medical-overrides.css';
const css = fs.readFileSync(path.join(root, cssPath), 'utf8');
const link = `../${cssPath}?v=20260929-1`;

assert.match(css, /body\.page-research-research-medical-cn \.p-masonry__grid[\s\S]*?height:\s*1220px !important/);
assert.match(css, /html\[lang="en"\] body\.node-51 \.p-project-carousel__content[\s\S]*?min-height:\s*510px !important/);

for (const [page, marker] of [['Research-Medical-cn', 'page-research-research-medical-cn'], ['Research-Medical-en', 'node-51']]) {
  const html = fs.readFileSync(path.join(root, `Research/${page}.html`), 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.equal(html.split(link).length - 1, 1, `${page}: load the Medical overrides once`);
  assert.ok(head.indexOf('../assets/css/research/research-rdgroups-summary-') < head.indexOf(link), `${page}: load after research summary styles`);
  assert.ok(head.indexOf(link) < head.indexOf('../assets/css/archive-consistency.css'), `${page}: retain the original late-head cascade position`);
  assert.match(html, new RegExp(`body[\\s\\S]{0,100}class="[^"]*${marker}`), `${page}: retain expected style scope`);
  assert.doesNotMatch(html, /\.paragraph--type-p-masonry\s*\{\s*margin-bottom:\s*0|margin-top:\s*-300px !important|min-height:\s*510px !important/, `${page}: remove migrated inline rules`);
}

process.stdout.write('PASS: Medical bilingual layout overrides share one stylesheet with isolated language scopes and preserved load order.\n');
