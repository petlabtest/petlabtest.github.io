import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(root, 'assets/css/engage/engage-cn-cta-arrow.css'), 'utf8');

for (const file of ['Engage/Engage-Contact-cn.html', 'Engage/Engage-Visit-cn.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal((html.match(/engage-cn-cta-arrow\.css/g) ?? []).length, 1, `${file}: load the shared CTA arrow stylesheet once`);
  assert.doesNotMatch(html, /<style\b[^>]*>[\s\S]*?\.cta--button[\s\S]*?<\/style>/i, `${file}: remove the migrated inline CTA rule`);
}

assert.match(css, /\.wysiwyg a\.cta--button \.last-word::after/);
assert.match(css, /\.p-fullwidth__cta a\.cta--button \.last-word::after/);
assert.match(css, /border-top:\s*2px solid currentColor/);
assert.match(css, /transform:\s*rotate\(45deg\) translateY\(-1px\)/);
assert.match(css, /\.wysiwyg a\.cta--button::after,[\s\S]*?content:\s*none !important/);

process.stdout.write('PASS: Chinese Engage Contact and Visit pages share one identical CSS chevron treatment.\n');
