import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shell = fs.readFileSync(path.join(root, 'assets/js/app-shell.js'), 'utf8');
const shared = fs.readFileSync(path.join(root, 'assets/css/header-layout-shared.css'), 'utf8');
const marker = '/* PETLAB:HEADER_LAYOUT_SHARED */';

assert.match(shell, /header-layout-shared\.css\?v=' \+ version/);
assert.match(shell, /header-layout-cn\.css\?v=' \+ version[\s\S]*header-layout-en\.css\?v=' \+ version/);
assert.match(shell, /layoutStyle\.textContent = headerLayoutCssText/);
assert.match(shared, /\.lbl-header \.header-branding/);
assert.match(shared, /\.lbl-header \.upop-brand,\s*\.lbl-header \.donate-brand/);
for (const breakpoint of ['1251px', '1320px', '1101px', '1250px', 'max-width:1100px', 'max-width:700px', 'max-width:360px']) {
  assert.ok(shared.includes(breakpoint), `shared header layout should preserve ${breakpoint}`);
}

for (const file of ['components/header.html', 'components/header-cn.html']) {
  const markup = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(markup, /<style data-research-menu-layout><\/style>/, `${file} should keep the original Shadow DOM style slot`);
  const embeddedStyle = markup.match(/<style data-research-menu-layout>([\s\S]*?)<\/style>/)?.[1] ?? '';
  assert.equal(embeddedStyle, '', `${file} should not carry inline layout CSS`);
}

for (const language of ['en', 'cn']) {
  const localized = fs.readFileSync(path.join(root, `assets/css/header-layout-${language}.css`), 'utf8');
  assert.equal(localized.split(marker).length - 1, 1, `${language} CSS should have one shared-style insertion point`);
  assert.ok(!/url\s*\(|:root\b|@font-face/i.test(localized), `${language} CSS should not need resource rebasing`);
}

process.stdout.write('PASS: bilingual AppShell headers share the brand layout at its original cascade position and preserve all responsive breakpoints.\n');
