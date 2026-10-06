import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = 'assets/css/research/research-core-en-overrides.css';
const css = fs.readFileSync(path.join(root, cssPath), 'utf8');
assert(css.includes('@font-face') && css.includes('font-family: "icomoon"'), 'English CTA icon face should remain defined');
assert(css.includes('../../fonts/root/media/r029.ttf'), 'font source should be rebased to the stylesheet directory');
assert(fs.existsSync(path.join(root, 'assets/fonts/root/media/r029.ttf')), 'rebased font should exist');
assert(css.includes('.paragraph--type-p-fullwidth .p-fullwidth__cta .cta--button:hover') && css.includes('margin-top: -300px'), 'CTA interaction and English section offset should remain');

const english = fs.readFileSync(path.join(root, 'Research/Research-Core-en.html'), 'utf8');
const link = `../${cssPath}?v=20261003-shell2`;
const linkIndex = english.indexOf(link);
const headerLayer = '../assets/css/app-shell-header-layer.css?v=20260929-1';
assert(linkIndex > english.indexOf('news-overview-components.css') && linkIndex < english.indexOf(headerLayer) && english.indexOf(headerLayer) < english.indexOf('archive-consistency.css'), 'load English rules before the shared AppShell stacking layer');
assert.equal(english.split(link).length - 1, 1, 'load English override once');
assert.equal((english.match(/<style\b/gi) || []).length, 0, 'remove extracted English style block');

const chinese = fs.readFileSync(path.join(root, 'Research/Research-Core-cn.html'), 'utf8');
assert.equal(chinese.indexOf(link), -1, 'do not apply the English CTA layer to Chinese');
assert(chinese.includes('../assets/css/research/research-slope-spacing.css?v=20260929-1'), 'load the shared Chinese desktop section spacing layer');
assert(fs.readFileSync(path.join(root, 'assets/css/research/research-slope-spacing.css'), 'utf8').includes('margin-top: -300px !important'), 'preserve the shared desktop section offset');

process.stdout.write('PASS: Research Core English CTA rules are externalized; Chinese offset remains independent.\n');
