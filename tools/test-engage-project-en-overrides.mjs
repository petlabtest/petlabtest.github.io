import assert from 'node:assert/strict';
import fs from 'node:fs';

const file = 'Engage/Engage-Project-en.html';
const html = fs.readFileSync(file, 'utf8');
const href = '../assets/css/engage/engage-project-en-overrides.css?v=20260929-1';
const footerHref = '../assets/css/engage/engage-footer-spacing.css?v=20261006-shared1';
const css = fs.readFileSync('assets/css/engage/engage-project-en-overrides.css', 'utf8');
const footerCss = fs.readFileSync('assets/css/engage/engage-footer-spacing.css', 'utf8');

assert.equal(html.split(href).length - 1, 1, 'load the Project EN override stylesheet once');
assert.ok(html.indexOf('../assets/js/root/r034.js') < html.indexOf(href), 'preserve the post-script insertion point');
assert.ok(html.indexOf(href) < html.indexOf('../assets/css/archive-consistency.css'), 'preserve archive override order');
assert.equal(html.split(footerHref).length - 1, 1, 'load shared footer spacing once');
assert.ok(html.indexOf(href) < html.indexOf(footerHref) && html.indexOf(footerHref) < html.indexOf('../assets/css/archive-consistency.css'), 'shared footer spacing retains the original cascade layer');
assert.doesNotMatch(css, /margin-bottom:\s*0\s*!important/, 'footer spacing should not be duplicated in the page override');
assert.match(footerCss, /\.ifde-page__paragraphs\s*>\s*\.paragraph--type-p-fullwidth:last-child,[\s\S]*\.page__content\s*\{\s*margin-bottom:\s*0 !important/);
assert.doesNotMatch(html, /<style\b[^>]*>[\s\S]*?margin-bottom:\s*0 !important[\s\S]*?<\/style>/i);

process.stdout.write('PASS: Engage Project EN footer spacing is externalized at its original cascade position.\n');
