import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = [
  'Engage/Engage-Project-cn.html',
  'Engage/Engage-Project-en.html',
  'Engage/Engage-inquiry-cn.html',
  'Engage/Engage-inquiry-en.html',
  'Engage/Engage-Research-cn.html',
  'Engage/Engage-Research-en.html',
  'Engage/Engage-Support-cn.html',
  'Engage/Engage-Support-en.html',
  'Engage/Engage-ov-cn.html',
  'Engage/Engage-ov-en.html',
  'Capabilities/Capabilities-Instrument-cn.html',
  'Capabilities/Capabilities-Instrument-en.html',
  'News/News-ov-cn.html',
  'News/News-ov-en.html',
];
const appShellCss = fs.readFileSync(path.join(root, 'assets/css/app-shell.css'), 'utf8');
const hostRule = /\.petlab-component-host\s*,[\s\S]*?\{\s*display:\s*block;\s*position:\s*relative;\s*width:\s*100%;/;
const duplicateInlineRule = /#petlab-header\s*,\s*#petlab-footer\s*\{\s*display:\s*block;\s*position:\s*relative;\s*width:\s*100%;\s*\}/;

assert.match(appShellCss, hostRule, 'AppShell should own the shared host geometry');
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const shellHref = '../assets/css/app-shell.css?v=20260926-1';
  assert.equal(html.split(shellHref).length - 1, 1, `${file}: AppShell CSS should load exactly once`);
  const inlineCss = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(([, css]) => css).join('\n');
  assert.doesNotMatch(inlineCss, duplicateInlineRule, `${file}: shared host geometry should not be duplicated inline`);
}

const projectEnHtml = fs.readFileSync(path.join(root, 'Engage/Engage-Project-en.html'), 'utf8');
const projectEnCss = fs.readFileSync(path.join(root, 'assets/css/engage/engage-project-en-overrides.css'), 'utf8');
const engageFooterCss = fs.readFileSync(path.join(root, 'assets/css/engage/engage-footer-spacing.css'), 'utf8');
assert.match(projectEnHtml, /assets\/css\/engage\/engage-project-en-overrides\.css/, 'Project EN should load its page-specific CTA/footer stylesheet');
assert.match(projectEnHtml, /assets\/css\/engage\/engage-footer-spacing\.css/, 'Project EN should load the shared footer spacing layer');
assert.doesNotMatch(projectEnCss, /margin-bottom:\s*0\s*!important/, 'Project EN should not duplicate shared footer spacing');
assert.match(engageFooterCss, /ifde-page__paragraphs\s*>\s*\.paragraph--type-p-fullwidth:last-child[\s\S]*?margin-bottom:\s*0\s*!important;/, 'shared footer layer should own the spacing rule');
assert.doesNotMatch(fs.readFileSync(path.join(root, 'assets/css/engage/engage-research-layout.css'), 'utf8'), /embedded-entity|media--view-mode-natural-center/, 'Research shared CSS should not retain media selectors absent from both page DOMs');
assert.match(fs.readFileSync(path.join(root, 'assets/css/engage/engage-support-panel.css'), 'utf8'), /\.technical-support-panel::after/, 'Support-specific panel treatment should remain in its shared stylesheet');
const instrumentCss = fs.readFileSync(path.join(root, 'assets/css/capabilities/instrument-layout.css'), 'utf8');
assert.match(instrumentCss, /\.paragraph--type-p-fullwidth \.p-fullwidth__cta a\.cta--button/, 'Capabilities CTA styling should remain in its page-family stylesheet');
for (const file of ['Capabilities/Capabilities-Instrument-cn.html', 'Capabilities/Capabilities-Instrument-en.html']) {
  assert.match(fs.readFileSync(path.join(root, file), 'utf8'), /assets\/css\/capabilities\/instrument-layout\.css/, `${file}: load the page-family CTA stylesheet`);
}
process.stdout.write(`PASS: AppShell owns shared header/footer host geometry on all ${pages.length} migrated Engage, Capabilities, and News pages; page-specific rules remain.\n`);
