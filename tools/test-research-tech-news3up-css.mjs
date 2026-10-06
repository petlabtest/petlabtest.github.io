import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const research = path.join(root, 'Research');
const href = '../assets/css/research/tech-news3up-alignment.css?v=20260928-news3up1';
const projectListHref = '../assets/css/research/tech-project-list-layout.css?v=20260926-1';
const css = fs.readFileSync(path.join(root, 'assets/css/research/tech-news3up-alignment.css'), 'utf8');
const pages = fs.readdirSync(research)
  .filter(file => /^Research-Tech-.+-(?:cn|en)\.html$/.test(file))
  .sort();

assert.equal(pages.length, 12, 'expected six bilingual Research technology topics');
for (const file of pages) {
  const html = fs.readFileSync(path.join(research, file), 'utf8');
  assert.equal((html.match(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1, `${file} should load the shared CSS exactly once`);
  const styleBlocks = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
  assert(styleBlocks.every(([, block]) => !block.includes('Keep the three Latest News titles on one top-aligned baseline.')), `${file} should not retain the extracted alignment block`);
  assert(styleBlocks.every(([, block]) => !/(?:paragraph--type-p-news3up|p-news3up__|news3up)/i.test(block)), `${file} late inline styles should not override the shared news3up layer`);
  const extractedPageStyle = /href="([^"]*tech-[a-z]+-overrides\.css\?v=20260928-bilingual1)"/i.exec(html)?.[1];
  const layerEnds = [html.indexOf(projectListHref)];
  if (extractedPageStyle) layerEnds.push(html.indexOf(extractedPageStyle));
  const precedingLayerEnd = Math.max(...layerEnds);
  assert(precedingLayerEnd >= 0, `${file} should retain an identifiable preceding page-style layer`);
  assert(html.indexOf(href) > precedingLayerEnd, `${file} should preserve order after its base or extracted topic style layer`);
  assert(fs.existsSync(path.resolve(research, '../assets/css/research/tech-news3up-alignment.css')));
}

assert(css.includes('@media (min-width: 700px)'));
assert(css.includes('height: 240px;'));
assert(css.includes('max-height: none;'));
assert(css.includes('align-self: flex-start;'));
assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length, 'shared stylesheet braces should balance');

process.stdout.write('PASS: 12 Research technology pages load one shared news3up alignment contract after their active page-style layers.\n');
