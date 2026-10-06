import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pages = new Map([
  ['Engage/Engage-Contact-cn.html', '../assets/css/webarchive_contact-us/015.css'],
  ['Engage/Engage-Contact-en.html', '../assets/css/webarchive_contact-us/015.css'],
  ['Engage/Engage-Visit-cn.html', '../assets/css/webarchive_visitor-information/024.css'],
  ['Engage/Engage-Visit-en.html', '../assets/css/webarchive_visitor-information/024.css'],
  ['Capabilities/Capabilities-ov-cn.html', '../assets/css/webarchive_our-future/033.css'],
  ['Capabilities/Capabilities-ov-en.html', '../assets/css/webarchive_our-future/033.css'],
  ['People/People-Group-cn.html', '../assets/css/webarchive_technical-seminar-series/020.css'],
  ['People/People-Group-en.html', '../assets/css/webarchive_technical-seminar-series/020.css'],
  ['People/People-Stewardship-cn.html', '../assets/css/webarchive_inspiring-rising-stem-students/024.css'],
  ['Research/Research-Core-cn.html', '../assets/css/news/news-overview-components.css'],
  ['Giving/Giving-giving-cn.html', '../assets/css/giving/giving-layout.css'],
  ['Giving/Giving-giving-en.html', '../assets/css/giving/giving-layout.css'],
  ['News/News-ov-cn.html', '../assets/css/news/news-overview-layout.css'],
  ['News/News-ov-en.html', '../assets/css/news/news-overview-layout.css'],
  ['People/People-Career-cn.html', '../assets/css/people/fullwidth-cta-arrow.css?v=20261006-shared1'],
  ['People/People-Career-en.html', '../assets/css/people/fullwidth-cta-arrow.css?v=20261006-shared1'],
  ['People/People-ov-cn.html', '../assets/css/people/overview-layout.css'],
  ['People/People-ov-en.html', '../assets/css/people/overview-layout.css'],
  ['People/People-Life-cn.html', '../assets/css/people/people-life-layout.css'],
  ['People/People-Life-en.html', '../assets/css/people/people-life-layout.css'],
  ['People/People-Stewardship-en.html', '../assets/css/people/stewardship-en-layout.css'],
  ['People/People-Student-cn.html', '../assets/css/people/student-layout.css'],
  ['People/People-Student-en.html', '../assets/css/people/student-layout.css'],
  ['People/People-UPOP-cn.html', '../assets/css/people/upop-inline-layout.css'],
  ['People/People-UPOP-en.html', '../assets/css/people/upop-inline-layout.css'],
  ['Research/Research-Core-en.html', '../assets/css/research/research-core-en-overrides.css'],
  ['Research/Research-Initiatives-cn.html', '../assets/css/research/research-initiatives-components.css'],
  ['Research/Research-Initiatives-en.html', '../assets/css/research/research-initiatives-components.css'],
]);
const link = '../assets/css/app-shell-header-layer.css?v=20260929-1';
const sharedCss = readFileSync('assets/css/app-shell-header-layer.css', 'utf8');
const appShellCss = readFileSync('assets/css/app-shell.css', 'utf8');
const arrowLink = '../assets/css/engage/engage-cn-cta-arrow.css?v=20260929-1';
const arrowCss = readFileSync('assets/css/engage/engage-cn-cta-arrow.css', 'utf8');
const localShellStylesheets = [
  'assets/css/giving/giving-layout.css',
  'assets/css/news/news-overview-layout.css',
  'assets/css/people/fullwidth-cta-arrow.css',
  'assets/css/people/overview-layout.css',
  'assets/css/people/people-life-layout.css',
  'assets/css/people/stewardship-en-layout.css',
  'assets/css/people/student-layout.css',
  'assets/css/people/upop-inline-layout.css',
  'assets/css/research/research-core-en-overrides.css',
  'assets/css/research/research-initiatives-components.css',
];

assert.match(sharedCss, /#petlab-header\s*\{\s*z-index:\s*1000;/);
assert.match(appShellCss, /#petlab-header[\s\S]*?z-index:\s*999;/);

for (const [file, baseStylesheet] of pages) {
  const html = readFileSync(file, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.equal(html.split(link).length - 1, 1, `${file}: load the shared AppShell layer once`);
  assert.ok(head.indexOf(baseStylesheet) < head.indexOf(link), `${file}: shared layer follows its page-family styles`);
  assert.ok(head.indexOf(link) < head.indexOf('../assets/css/archive-consistency.css'), `${file}: preserve the page override order`);
  assert.match(html, /id="petlab-header"/, `${file}: header host exists`);
  assert.doesNotMatch(html, /<style\b[^>]*>[\s\S]*?#petlab-header\s*\{\s*z-index:\s*1000;/i, `${file}: remove the duplicate inline host layer`);
  if (file.endsWith('-cn.html') && file.startsWith('Engage/')) {
    assert.equal(html.split(arrowLink).length - 1, 1, `${file}: keep one Chinese CTA arrow override`);
    assert.ok(head.indexOf(link) < head.indexOf(arrowLink), `${file}: CTA arrow follows the host layer`);
    assert.ok(head.indexOf(arrowLink) < head.indexOf('../assets/css/archive-consistency.css'), `${file}: CTA arrow precedes archive overrides`);
  }
}

assert.match(arrowCss, /\.wysiwyg a\.cta--button \.last-word::after/);
assert.match(arrowCss, /\.p-fullwidth__cta a\.cta--button \.last-word::after/);
for (const stylesheet of localShellStylesheets) {
  const css = readFileSync(stylesheet, 'utf8');
  assert.doesNotMatch(css, /#petlab-header\s*\{\s*z-index:\s*1000;/, `${stylesheet}: header stacking should have one shared owner`);
}
console.log(`PASS: shared AppShell header stacking is consistent across ${pages.size} pages and ten former local rules are removed.`);
