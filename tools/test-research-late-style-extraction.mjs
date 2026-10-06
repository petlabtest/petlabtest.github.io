import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const families = [
  { stem: 'Research/Research-ov', css: 'research/overview/late-layout.css', inline: { cn: 0, en: 0 }, minimum: 4800 },
  { stem: 'Research/Research-Project', css: 'research/project/late-layout.css', inline: { cn: 0, en: 0 }, minimum: 1900 },
  { stem: 'Research/Research-Publication', css: 'research/publication/late-title-hero.css', inline: { cn: 0, en: 0 }, minimum: 900 },
];

for (const { stem, css, inline, minimum } of families) {
  const source = fs.readFileSync(path.join(root, 'assets/css', css), 'utf8');
  assert(source.trim().length > minimum, `${css}: late rules should remain intact`);
  assert(!/url\s*\(|@import/i.test(source), `${css}: no resource rebasing should be required`);

  const stylesheet = `../assets/css/${css}?v=20260929-late1`;
  for (const language of ['cn', 'en']) {
    const file = `${stem}-${language}.html`;
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const link = html.indexOf(stylesheet);
    assert(link > html.indexOf('</head>') && link < html.indexOf('</body>'), `${file}: stylesheet should stay in body`);
    assert.equal(html.split(stylesheet).length - 1, 1, `${file}: stylesheet should load once`);
    assert.equal((html.match(/<style\b/gi) || []).length, inline[language], `${file}: other style layers should remain`);
    assert(link < html.indexOf('Hide skip-link by default'), `${file}: late behavior script should remain after stylesheet`);
  }
}

const cnHtml = fs.readFileSync(path.join(root, 'Research/Research-ov-cn.html'), 'utf8');
const titleCss = fs.readFileSync(path.join(root, 'assets/css/research/research-overview-cn-title.css'), 'utf8');
const titleLink = '../assets/css/research/research-overview-cn-title.css?v=20260930-1';
assert.match(titleCss, /\.p-rdhero__item h3 a\s*\{\s*font-size:\s*1\.75rem\s*!important;/);
assert.equal(cnHtml.split(titleLink).length - 1, 1, 'CN overview title adjustment remains in its dedicated stylesheet');
assert(cnHtml.indexOf('../assets/js/root/010.js') < cnHtml.indexOf(titleLink), 'CN title stylesheet preserves its original late head position');
assert(cnHtml.indexOf(titleLink) < cnHtml.indexOf('../assets/css/cn-link-label.css'), 'CN title stylesheet remains before localized link labels');

process.stdout.write('PASS: Research overview, projects, and publications preserve three late bilingual style layers.\n');
