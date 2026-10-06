import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const families = [
  { stem: 'About/About-history', css: 'about/history-layout.css', inline: 0, version: '20261006-component3' },
  { stem: 'News/News-list', css: 'news/news-list-layout.css', inline: 0 },
  { stem: 'About/About-leadership', css: 'about/leadership-title-hero.css', inline: 0, minimum: 100 },
  { stem: 'People/People-Career', css: 'people/career-page-overrides.css', inline: 0, version: '20261003-shell2' },
];

for (const { stem, css, inline, minimum = 500, version = '20260929-shared1' } of families) {
  const stylesheet = `../assets/css/${css}?v=${version}`;
  const source = fs.readFileSync(path.join(root, 'assets/css', css), 'utf8');
  assert(source.trim().length > minimum, `${css}: extracted rules should be present`);
  assert(!/url\s*\(|@import/i.test(source), `${css}: relocation must not change resource URLs`);

  for (const language of ['cn', 'en']) {
    const file = `${stem}-${language}.html`;
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const link = html.indexOf(stylesheet);
    assert(link > 0 && link < html.indexOf('</head>'), `${file}: shared layer should load in head`);
    assert.equal(html.split(stylesheet).length - 1, 1, `${file}: shared layer should load once`);
    assert.equal((html.match(/<style\b/gi) || []).length, inline, `${file}: language-specific style blocks should remain`);
    const archive = html.indexOf('../assets/css/archive-consistency.css');
    if (archive >= 0) assert(link < archive, `${file}: archive layer should remain later`);
  }
}

process.stdout.write('PASS: four bilingual page families share their former inline CSS without changing later page-specific layers.\n');
