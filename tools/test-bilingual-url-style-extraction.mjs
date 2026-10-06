import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const families = [
  { stem: 'About/About-QingguoXie', css: 'about/qingguoxie-layout.css', inline: 0, urls: 3, version: '20261006-shared5' },
  { stem: 'About/About-PengXiao', css: 'about/pengxiao-layout.css', inline: 0, urls: 3, version: '20261006-shared5' },
  { stem: 'Capabilities/Capabilities-ov', css: 'capabilities/overview-layout.css', inline: 0, urls: 1 },
  { stem: 'Giving/Giving-giving', css: 'giving/giving-layout.css', inline: 0, urls: 1, version: '20261003-shell2' },
  { stem: 'People/People-UPOP', css: 'people/upop-inline-layout.css', inline: 0, urls: 2, version: '20261003-shell2' },
];

for (const { stem, css, inline, urls, version = '20260929-shared2' } of families) {
  const cssPath = path.join(root, 'assets/css', css);
  const source = fs.readFileSync(cssPath, 'utf8');
  const references = [...source.matchAll(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi)].map((match) => match[2]);
  assert.equal(references.length, urls, `${css}: all relative resources should be retained`);
  assert(!source.includes('../assets/'), `${css}: page-relative URLs should be rebased`);
  for (const reference of references) {
    assert(reference.startsWith('../../'), `${css}: resource should resolve from stylesheet directory`);
    assert(fs.existsSync(path.resolve(path.dirname(cssPath), reference)), `${css}: missing ${reference}`);
  }

  const stylesheet = `../assets/css/${css}?v=${version}`;
  for (const language of ['cn', 'en']) {
    const file = `${stem}-${language}.html`;
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const link = html.indexOf(stylesheet);
    assert(link > 0 && link < html.indexOf('</head>'), `${file}: shared CSS should load in head`);
    assert.equal(html.split(stylesheet).length - 1, 1, `${file}: shared CSS should load once`);
    assert.equal((html.match(/<style\b/gi) || []).length, inline, `${file}: other inline layers should remain`);
    assert(link < html.indexOf('../assets/css/archive-consistency.css'), `${file}: archive layer should remain later`);
  }
}

process.stdout.write('PASS: five bilingual page families share extracted CSS with rebased, existing resources.\n');
