import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = '20261003-themebase1';
const sharedPath = path.join(root, 'assets/css/legacy-theme-foundation.css');
const shared = fs.readFileSync(sharedPath, 'utf8');
assert.equal((shared.match(/{/g) || []).length, (shared.match(/}/g) || []).length, 'shared theme foundation braces should balance');
assert.equal((shared.match(/{/g) || []).length - (shared.match(/@media\b/g) || []).length, 184, 'shared theme foundation should retain the complete original rule set');
assert(!shared.includes('@font-face'), 'theme-specific font-face declarations must stay in their original stylesheet directories');
assert(!shared.includes('url('), 'shared theme foundation should not rebase legacy relative assets');
for (const selector of [':root{', '*{', 'h1{', '.ifde-page__intro{', '.region-content ul', '.icon--facebook:before']) {
  assert(shared.includes(selector), `shared theme foundation should retain ${selector}`);
}

const entries = [
  { css: 'assets/css/engage/r018.css', href: 'assets/css/engage/r018.css', import: '../legacy-theme-foundation.css', pages: 2 },
  { css: 'assets/css/research/counter-cwmd/15.css', href: 'assets/css/research/counter-cwmd/15.css', import: '../../legacy-theme-foundation.css', pages: 282 },
  { css: 'assets/css/research/dpet.css', href: 'assets/css/research/dpet.css', import: '../legacy-theme-foundation.css', pages: 4, prelude: 'assets/css/research/dpet-prelude.css' },
  { css: 'assets/css/research/overview/dpet-theme.css', href: 'assets/css/research/overview/dpet-theme.css', import: '../../legacy-theme-foundation.css', pages: 2 },
];
const htmlFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && file.endsWith('.html')) htmlFiles.push(file);
  }
}
walk(root);

for (const entry of entries) {
  const cssPath = path.join(root, entry.css);
  const css = fs.readFileSync(cssPath, 'utf8');
  const importHref = `${entry.import}?v=${version}`;
  assert(css.includes(`@import url("${importHref}");`), `${entry.css} should import the shared foundation at its original cascade position`);
  assert(fs.existsSync(path.resolve(path.dirname(cssPath), entry.import)), `${entry.css} shared import should resolve locally`);
  assert.equal((css.match(/@font-face\s*\{/g) || []).length, 2, `${entry.css} should retain its two local icon font families`);
  assert(!css.includes(':root{'), `${entry.css} should not duplicate the shared root/theme reset`);

  const hrefNeedle = `${entry.href}?v=${version}`;
  const consumers = htmlFiles.filter(file => fs.readFileSync(file, 'utf8').includes(hrefNeedle));
  assert.equal(consumers.length, entry.pages, `${entry.href} should update all ${entry.pages} HTML consumers`);

  if (entry.prelude) {
    const prelude = fs.readFileSync(path.join(root, entry.prelude), 'utf8');
    assert.match(prelude, /^(?:\/\*[\s\S]*?\*\/\s*)?\.progress\{/, 'the Drupal progress prelude should preserve its original first rule');
    assert.equal((prelude.match(/@font-face\s*\{/g) || []).length, 3, 'the Poppins font faces should stay before shared theme rules');
    for (const file of consumers) {
      const html = fs.readFileSync(file, 'utf8');
      const preludeHref = `${entry.prelude}?v=${version}`;
      assert.equal(html.split(preludeHref).length - 1, 1, `${path.relative(root, file)} should load the prelude once`);
      assert(html.indexOf(preludeHref) < html.indexOf(hrefNeedle), `${path.relative(root, file)} should preserve prelude → theme order`);
    }
  }
}

process.stdout.write('PASS: 290 pages share the path-independent legacy theme foundation; local font assets and Drupal prelude order remain page-family owned.\n');
