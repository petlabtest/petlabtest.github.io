import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = 'assets/css/research/research-tech-cn-late-layout.css';
const href = `../${cssPath}?v=20260929-techlate1`;
const css = fs.readFileSync(path.join(root, cssPath), 'utf8');
for (const page of ['Chips', 'Detectors', 'Imaging']) assert(css.includes(`petlab-research-Tech-${page}-`), `stylesheet should retain ${page} scope`);
assert(css.includes('max-width: 1024px') && css.includes('max-width: 699px'), 'tablet/mobile breakpoints should remain');
assert(css.includes('margin-top: -30px !important') && css.includes('font-size: clamp(20px, 5vw, 26px) !important'), 'Detectors responsive rules should remain');
assert(css.includes('white-space: normal !important'), 'Imaging mobile title wrap should remain');
assert(!/url\s*\(|@import/i.test(css), 'shared late rules should not need resource rebasing');

const expectations = [
  { file: 'Research/Research-Tech-Chips-cn.html', before: '../assets/js/root/002.js', after: '../assets/css/research/tech-cn-cta-arrow.css', owner: 'petlab-research-Tech-Chips-application' },
  { file: 'Research/Research-Tech-Imaging-cn.html', before: '../assets/css/research/tech-cn-cta-arrow.css', after: '../assets/js/research/project-list-image-layout.js', owner: 'petlab-research-Tech-Imaging-sampling' },
  { file: 'Research/Research-Tech-Detectors-cn.html', before: '../assets/js/root/002.js', after: '../assets/js/research/tech-application-grid-static.js', owner: 'petlab-research-Tech-Detectors-frontier' },
];
for (const { file, before, after, owner } of expectations) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const linkIndex = html.indexOf(href);
  assert(linkIndex > html.indexOf(before) && linkIndex < html.indexOf(after), `${file}: preserve original style/script order`);
  assert.equal(html.split(href).length - 1, 1, `${file}: load shared late stylesheet once`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: remove extracted inline block`);
  assert(html.includes(owner), `${file}: page-specific component owner remains`);
}

process.stdout.write('PASS: three Research technology pages share one scoped Chinese late-layout layer.\n');
