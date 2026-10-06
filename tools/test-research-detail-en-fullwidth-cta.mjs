import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const research = path.join(root, 'Research');
const fullwidthHref = '../assets/css/research/research-fullwidth-cta.css?v=20261003-clean1';
const sharedHref = '../assets/css/research/research-detail-shared.css?v=20261003-lang1';
const css = fs.readFileSync(path.join(root, 'assets/css/research/research-fullwidth-cta.css'), 'utf8');
const cta = '.page-node-type-rdgroup .paragraph--type-p-fullwidth.background--grey.slope--pos.js-animate .p-fullwidth__cta a.cta--button';
const pseudoSelector = `${cta} .last-word::after`;
const pseudoBlocks = [...css.matchAll(new RegExp(`${pseudoSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^{}]*)\\}`, 'g'))].map(([, body]) => body);
const ruleBlocks = selector => [...css.matchAll(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^{}]*)\\}`, 'g'))].map(([, body]) => body);

assert(pseudoBlocks.length >= 3, 'base icon, IcoMoon replacement and desktop size rules should remain');
assert.match(pseudoBlocks[0], /display:\s*inline-block;/);
for (const deadDeclaration of ['width: 8px;', 'height: 8px;', 'border-top:', 'border-right:', 'transform: rotate(45deg);', 'transition: transform']) {
  assert(!pseudoBlocks[0].includes(deadDeclaration), `superseded border-arrow declaration should be removed: ${deadDeclaration}`);
}
assert(css.includes('font-family: "icomoon" !important;'));
assert(!css.includes('transform: translateX(3px) rotate(45deg);'), 'superseded arrow hover motion should be removed');
const buttonBlocks = ruleBlocks(cta);
assert.equal(buttonBlocks.length, 4, 'keep the base, mobile, active shared button variant, and desktop button variant');
assert(!buttonBlocks[0].includes('padding: 0 15px 0 11px;') && !buttonBlocks[0].includes('font-size: 20px;'), 'remove values superseded by the later shared button variant');
assert.match(buttonBlocks[1], /font-size:\s*16px;/);
assert.match(buttonBlocks[2], /padding:\s*0 20px;/);
assert.match(buttonBlocks[2], /font-size:\s*16px;/);
assert.match(buttonBlocks[3], /font-size:\s*25px;/);
const hoverBlocks = ruleBlocks(`${cta}:hover`);
assert.equal(hoverBlocks.length, 2, 'keep only the shared and desktop hover offsets');
assert.match(hoverBlocks[0], /padding-left:\s*19px;/);
assert.match(hoverBlocks[1], /padding-left:\s*36px;/);
const resetIndex = css.indexOf('outline: none;');
const focusIndex = css.lastIndexOf(`${cta}:focus-visible`);
assert(resetIndex >= 0 && focusIndex > resetIndex, 'keyboard focus indicator should follow the outline reset');
assert(css.includes('outline: 2px solid #00305c;'));
assert(css.includes('outline-offset: 4px;'));
assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length, 'English fullwidth CTA stylesheet braces should balance');

const pages = fs.readdirSync(research).filter(file => file.startsWith('Research-') && file.includes('-Page') && file.endsWith('-en.html')
  && fs.readFileSync(path.join(research, file), 'utf8').includes(fullwidthHref));
assert.equal(pages.length, 22, 'all English Research subdetail pages should share this layer');
for (const file of pages) {
  const html = fs.readFileSync(path.join(research, file), 'utf8');
  assert.equal(html.split(fullwidthHref).length - 1, 1, `${file} should load the shared fullwidth layer once`);
  assert.equal(html.split(sharedHref).length - 1, 1, `${file} should retain the common Research detail layer`);
  assert(html.indexOf(fullwidthHref) < html.indexOf(sharedHref), `${file} should preserve the original CTA/shared-detail cascade order`);
  assert(html.includes('paragraph--type-p-fullwidth'), `${file} should contain the styled fullwidth component`);
}

process.stdout.write('PASS: 22 English Research subdetail pages use the shared Research/Tech CTA layer and retain IcoMoon and keyboard focus styles.\n');
