import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = 'assets/css/people/stewardship-en-layout.css';
const css = fs.readFileSync(path.join(root, cssPath), 'utf8');
assert(css.includes('.ll-p-color-block-content') && css.includes('min-width: 1225px'), 'color-block layout and desktop breakpoint should remain');
assert(css.includes('.ll-p-color-block-content.js-animate') && css.includes('opacity: 0') && css.includes('transition-delay: .5s'), 'color-block entrance state and animation timing should remain');
assert(!/url\s*\(|@import/i.test(css), 'extracted stylesheet should not require resource rebasing');

const english = fs.readFileSync(path.join(root, 'People/People-Stewardship-en.html'), 'utf8');
const link = `../${cssPath}?v=20261003-shell2`;
const linkIndex = english.indexOf(link);
const englishShellLayerIndex = english.indexOf('../assets/css/app-shell-header-layer.css?v=20260929-1');
assert(linkIndex > english.indexOf('webarchive_inspiring-rising-stem-students/024.css') && linkIndex < englishShellLayerIndex && englishShellLayerIndex < english.indexOf('../assets/css/archive-consistency.css'), 'load extracted rules followed by the shared AppShell stacking layer');
assert.equal(english.split(link).length - 1, 1, 'load English layout once');
assert.equal((english.match(/<style\b/gi) || []).length, 0, 'remove extracted English inline block');

const chinese = fs.readFileSync(path.join(root, 'People/People-Stewardship-cn.html'), 'utf8');
assert.equal(chinese.indexOf(link), -1, 'do not extend the English-only layout without visual parity review');
const chineseShellLayer = '../assets/css/app-shell-header-layer.css?v=20260929-1';
const chineseShellLayerIndex = chinese.indexOf(chineseShellLayer);
assert.equal(chinese.split(chineseShellLayer).length - 1, 1, 'retain the shared AppShell header layer on Chinese');
assert(chineseShellLayerIndex > chinese.indexOf('webarchive_inspiring-rising-stem-students/024.css')
  && chineseShellLayerIndex < chinese.indexOf('../assets/css/archive-consistency.css'), 'keep the Chinese AppShell layer at its original cascade position');
assert.equal((chinese.match(/<style\b/gi) || []).length, 0, 'do not reintroduce an inline AppShell layer');

process.stdout.write('PASS: People Stewardship English layout is externalized without changing the Chinese layer.\n');
