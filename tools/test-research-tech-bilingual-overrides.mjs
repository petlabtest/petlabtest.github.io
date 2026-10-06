import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cases = [
  { name: 'Chips', bytes: 16290, sha256: '513d921719103a153cfc1ea20393e798ac3f0e108a12d3bd6bd4c71662eef5c5', remaining: { cn: 0, en: 0 } },
  { name: 'Detectors', bytes: 6618, sha256: 'a6d1f781aed45a87fa2163882cce1630aa1496a13b9fef52e86f79a06798d960', remaining: { cn: 0, en: 0 } },
  { name: 'Imaging', bytes: 1067, sha256: 'a3938a636fa17921fc3af015c4c423e843991e51acf975db85c59290ba92791b', remaining: { cn: 0, en: 0 } },
  { name: 'Instruments', bytes: 261, sha256: 'd15c1a7e2b478fd376d1d0c5ad620dbde4e96dbc9ce02933f10d4b84199c056e', remaining: { cn: 0, en: 0 } },
  { name: 'PnI', bytes: 73, sha256: 'd7da4cd847dec2c608f1857444f428889200f55e55f8de6db956d233396b962d', remaining: { cn: 0, en: 0 } },
];
const hrefs = {
  projectList: '../assets/css/research/tech-project-list-layout.css?v=20260926-1',
  overrides: name => `../assets/css/research/tech-${name.toLowerCase()}-overrides.css?v=${['Imaging', 'Instruments'].includes(name) ? '20261003-carouselguard1' : ['Chips'].includes(name) ? '20261006-carouselguard2' : ['Detectors', 'PnI'].includes(name) ? '20261003-resource1' : '20260928-bilingual1'}`,
  news: '../assets/css/research/tech-news3up-alignment.css?v=20260928-news3up1',
  cta: '../assets/css/research/tech-fullwidth-cta.css?v=20261003-offset2',
};

for (const { name, bytes, sha256, remaining } of cases) {
  const cssPath = path.join(root, 'assets/css/research', `tech-${name.toLowerCase()}-overrides.css`);
  const css = fs.readFileSync(cssPath);
  assert.equal(css.byteLength, bytes, `${name} shared stylesheet should retain the original CSS bytes`);
  assert.equal(crypto.createHash('sha256').update(css).digest('hex'), sha256, `${name} shared stylesheet should retain the original CSS content`);
  const text = css.toString('utf8');
  assert.equal((text.match(/{/g) || []).length, (text.match(/}/g) || []).length, `${name} stylesheet braces should balance`);

  for (const language of ['cn', 'en']) {
    const file = `Research-Tech-${name}-${language}.html`;
    const html = fs.readFileSync(path.join(root, 'Research', file), 'utf8');
    const overrideHref = hrefs.overrides(name);
    assert.equal(html.split(overrideHref).length - 1, 1, `${file} should load its bilingual stylesheet once`);
    assert(html.indexOf(overrideHref) > html.indexOf(hrefs.projectList), `${file} should preserve the original style layer position`);
    assert(html.indexOf(overrideHref) < html.indexOf(hrefs.news), `${file} should keep page styles before news3up alignment`);
    assert(html.indexOf(hrefs.news) < html.indexOf(hrefs.cta), `${file} should keep news3up before fullwidth CTA styles`);
    assert.equal((html.match(/<style\b/gi) || []).length, remaining[language], `${file} should retain only its page-specific residual style blocks`);
  }
}

process.stdout.write('PASS: five bilingual Research Tech style pairs retain their checked page-layer ownership and order.\n');
