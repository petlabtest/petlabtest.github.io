import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = [
  'About/About-LinWan-cn.html', 'About/About-LinWan-en.html',
  'About/About-Nicola-cn.html', 'About/About-Nicola-en.html',
  'About/About-Ruizheng-cn.html', 'About/About-Ruizheng-en.html',
  'About/About-leadership-cn.html', 'About/About-leadership-en.html',
  'About/About-PengXiao-cn.html', 'About/About-PengXiao-en.html',
  'About/About-QingguoXie-cn.html', 'About/About-QingguoXie-en.html',
];
const href = '../assets/css/about/about-profile-shell-cleanup.css?v=20260929-1';
const css = fs.readFileSync(path.join(root, 'assets/css/about/about-profile-shell-cleanup.css'), 'utf8');

assert.match(css, /\.header-container,[\s\S]*\.header-spacer,[\s\S]*\.footer-container\s*\{\s*display:\s*none !important/);
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal(html.split(href).length - 1, 1, `${file}: load the shared legacy-wrapper cleanup once`);
  assert.match(html, /id="petlab-header"/);
  assert.match(html, /id="petlab-footer"/);
  assert.doesNotMatch(html, /class="header-container"[^>]*\bstyle\s*=/, `${file}: hidden legacy header has no inline geometry`);
  assert.doesNotMatch(html, /class="header-spacer"[^>]*\bstyle\s*=/, `${file}: hidden legacy spacer has no inline geometry`);
  assert.doesNotMatch(html, /<style\b[^>]*>[\s\S]*?\.header-container,[\s\S]*?\.footer-container\s*\{\s*display:\s*none !important[\s\S]*?<\/style>/i, `${file}: remove the duplicate inline wrapper rule`);
  assert.ok(html.indexOf(href) > html.indexOf('id="petlab-footer"'), `${file}: retain the post-footer cascade position`);
}

process.stdout.write(`PASS: all ${pages.length} About profile/team pages share the AppShell legacy-wrapper cleanup.\n`);
