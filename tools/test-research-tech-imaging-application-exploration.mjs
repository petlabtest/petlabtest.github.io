import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const href = '../assets/css/research/tech-imaging-application-exploration.css?v=20260928-imaging1';
const css = fs.readFileSync(path.join(root, 'assets/css/research/tech-imaging-application-exploration.css'));
const source = css.toString('utf8');
assert.equal(css.byteLength, 4559);
assert.equal(crypto.createHash('sha256').update(source).digest('hex'), '7dc6711a25390cf0c05fc6ccc7b4150d5d45c911b849696983fca01aae39251e');
assert.equal(crypto.createHash('sha256').update(source.replace(/\s+/g, ' ').trim()).digest('hex'), 'dfc7eabe136cfa16881caad1447d1872411d35ea5240e003a5c9903ea70fb9cd');
assert.equal((source.match(/{/g) || []).length, (source.match(/}/g) || []).length, 'Imaging shared stylesheet braces should balance');

for (const language of ['cn', 'en']) {
  const file = `Research-Tech-Imaging-${language}.html`;
  const html = fs.readFileSync(path.join(root, 'Research', file), 'utf8');
  assert.equal(html.split(href).length - 1, 1, `${file} should load the shared late-layer CSS once`);
  assert(!html.includes('Match the Application Exploration geometry used on Research-Tech-Chips.'), `${file} should not retain the extracted CSS block`);
  assert(html.indexOf('../assets/js/root/002.js') < html.indexOf(href), `${file} should preserve the original post-script layer position`);
  assert(html.indexOf(href) < html.indexOf('../assets/js/research/project-list-image-layout.js'), `${file} should keep the late shared CSS before following page scripts`);
  if (language === 'cn') {
    assert(html.indexOf(href) < html.indexOf('../assets/css/research/tech-cn-cta-arrow.css'), 'CN CTA rules should retain their original later cascade position');
    const lateHref = '../assets/css/research/research-tech-cn-late-layout.css?v=20260929-techlate1';
    assert(html.indexOf(href) < html.indexOf(lateHref), 'CN Imaging late layout should follow the CTA layer');
    assert.equal((html.match(/<style\b/gi) || []).length, 0, 'CN Imaging-only CSS should stay externalized');
    const style = fs.readFileSync(path.join(root, lateHref.replace('../', '').split('?')[0]), 'utf8');
    const selectorGroup = [
      '.page-node-type-rdgroup .petlab-research-Tech-Imaging-sampling .project-carousel__title',
      '.page-node-type-rdgroup .petlab-research-Tech-Imaging-correction .project-carousel__title',
    ];
    const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const groupedRule = new RegExp(`^\\s*${escape(selectorGroup[0])},\\s*${escape(selectorGroup[1])}\\s*\\{`, 'gm');
    assert.equal([...style.matchAll(groupedRule)].length, 3, 'CN sampling and correction titles should share base, tablet, and mobile rules');
    for (const selector of selectorGroup) assert.equal(style.split(selector).length - 1, 3, 'each title selector should appear once per shared breakpoint group');
    assert.equal((style.match(/font-size:\s*20px\s*!important/g) || []).length, 2);
    assert.equal((style.match(/font-size:\s*18px\s*!important/g) || []).length, 2);
    assert.equal((style.match(/font-size:\s*16px\s*!important/g) || []).length, 1);
  } else {
    assert.equal((html.match(/<style\b/gi) || []).length, 0, 'EN page should not retain the extracted style block');
  }
}

process.stdout.write('PASS: Imaging bilingual application-exploration styles are shared without changing their late cascade layer.\n');
