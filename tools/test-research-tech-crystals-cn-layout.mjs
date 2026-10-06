import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = 'assets/css/research/tech-crystals-cn-layout.css';
const css = fs.readFileSync(path.join(root, cssPath), 'utf8');
assert(css.includes('.petlab-research-Tech-Crystals-frontier'), 'styles should remain scoped to the Crystals section');
assert(css.includes('width: 480px !important') && css.includes('height: 366px !important'), 'desktop project-list frame should remain');
assert(css.includes('max-width: 1024px') && css.includes('max-width: 699px') && css.includes('width: min(100%, 480px)'), 'tablet/mobile project-list rules should remain');
assert(!/url\s*\(|@import/i.test(css), 'page stylesheet should not require resource rebasing');

const html = fs.readFileSync(path.join(root, 'Research/Research-Tech-Crystals-cn.html'), 'utf8');
const link = `../${cssPath}?v=20260929-layout1`;
const scripts = html.indexOf('../assets/js/research/counter-cwmd/4.js');
const nextLayer = html.indexOf('../assets/css/research/tech-news3up-alignment.css');
const linkIndex = html.indexOf(link);
assert(linkIndex > scripts && linkIndex < nextLayer, 'load layout at its original cascade position');
assert.equal(html.split(link).length - 1, 1, 'load page layout once');
assert.equal((html.match(/<style\b/gi) || []).length, 0, 'remove the extracted inline block');
assert(html.includes('petlab-research-Tech-Crystals-frontier'), 'scoped style owner remains in the page DOM');

process.stdout.write('PASS: Research Tech Crystals Chinese project-list layout is externalized at the original layer.\n');
