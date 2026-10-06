import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = 'assets/css/home/home-cn-overrides.css';
const css = fs.readFileSync(path.join(root, cssPath), 'utf8');
assert(css.includes('body.home') && css.includes('home-carousel__title'), 'Chinese homepage typography should remain scoped');
assert(css.includes('.research-cards::before') && css.includes('background-attachment: scroll'), 'research-card backdrop and mobile behavior should remain');
const background = '../../pic/root/media/09-bg_rd-tool-2964bfbf.png';
assert(css.includes(background), 'background URL should be relative to the extracted stylesheet');
assert(fs.existsSync(path.resolve(root, path.dirname(cssPath), background)), 'rebased research-card background should exist');

const html = fs.readFileSync(path.join(root, 'index-cn.html'), 'utf8');
const link = `${cssPath}?v=20260929-home1`;
const linkIndex = html.indexOf(link);
assert(linkIndex > html.indexOf('assets/css/site.css') && linkIndex < html.indexOf('assets/js/site.js'), 'load extracted page rules at their original layer');
assert.equal(html.split(link).length - 1, 1, 'load Chinese homepage override once');
assert.equal((html.match(/<style\b/gi) || []).length, 0, 'remove the inline block');

process.stdout.write('PASS: Chinese homepage rules are externalized with the research-card image rebased.\n');
