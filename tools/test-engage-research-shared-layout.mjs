import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = [
  ['Engage/Engage-Research-cn.html', '研究合作'],
  ['Engage/Engage-Research-en.html', 'Research Collaboration'],
];
const href = '../assets/css/engage/engage-research-layout.css?v=20260929-1';
const footerHref = '../assets/css/engage/engage-footer-spacing.css?v=20261006-shared1';
const stylesheet = fs.readFileSync(path.join(root, 'assets/css/engage/engage-research-layout.css'), 'utf8');
const footerStylesheet = fs.readFileSync(path.join(root, 'assets/css/engage/engage-footer-spacing.css'), 'utf8');

assert.equal((stylesheet.match(/{/g) || []).length, (stylesheet.match(/}/g) || []).length, 'shared layout CSS braces should balance');
assert(!/url\(/i.test(stylesheet), 'shared layout CSS should not gain page-relative assets');

for (const [file, title] of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal(html.split(href).length - 1, 1, `${file}: shared CSS should load exactly once`);
  assert.equal(html.split(footerHref).length - 1, 1, `${file}: shared footer spacing should load exactly once`);
  assert(html.indexOf(href) < html.indexOf(footerHref) && html.indexOf(footerHref) < html.indexOf('archive-consistency.css'), `${file}: shared footer spacing stays at the original cascade layer`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: page-specific layout CSS should no longer be inline`);
  assert(html.includes(title), `${file}: retain localized page content`);
  for (const className of ['page__inner', 'page__intro', 'ifde-page__intro', 'ifde-page__paragraphs', 'paragraph--type-p-fullwidth', 'page__content']) {
    assert(html.includes(className), `${file}: shared selector .${className} should have a page DOM owner`);
  }
}
assert.doesNotMatch(stylesheet, /embedded-entity|media--view-mode-natural-center/, 'shared CSS must not reintroduce media rules absent from either static page DOM');
assert.doesNotMatch(stylesheet, /margin-bottom:\s*0\s*!important/, 'footer spacing should have one shared owner');
assert.match(footerStylesheet, /\.ifde-page__paragraphs\s*>\s*\.paragraph--type-p-fullwidth:last-child,[\s\S]*\.page__content\s*\{\s*margin-bottom:\s*0\s*!important/);
assert.match(stylesheet, /\.page__inner>\.page__intro>\.ifde-page__intro\s*\{[^}]*margin-top:\s*16px\s*!important;/, 'desktop intro offset should be retained');
assert.match(stylesheet, /@media\s*\(max-width:\s*699px\)[\s\S]*?margin-top:\s*-1rem\s*!important;/, 'mobile page-inner offset should be retained');

process.stdout.write('PASS: bilingual Research Collaboration pages share one ordered layout stylesheet with DOM-owned selectors.\n');
