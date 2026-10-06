import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const excluded = new Set(['.git', 'components', 'Replicate']);
const hrefs = {
  people: '../assets/css/people/people-group-cn-overrides.css?v=20260930-1',
  research: '../assets/css/research/research-overview-cn-title.css?v=20260930-1',
};

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excluded.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(file));
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.html') files.push(file);
  }
  return files;
}

assert.match(css('assets/css/people/people-group-cn-overrides.css'), /\.page-people-people-group-cn \.hero__page-title\s*\{\s*line-height:\s*1\.4;/);
assert.match(css('assets/css/research/research-overview-cn-title.css'), /\.p-rdhero__item h3 a\s*\{\s*font-size:\s*1\.75rem\s*!important;/);

for (const file of ['Engage/Engage-ov-cn.html', 'Engage/Engage-ov-en.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert(!html.includes('engage-overview-late.css'), `${file}: removed figure module should not load its retired override`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: remove the inline style block`);
}

const people = fs.readFileSync(path.join(root, 'People/People-Group-cn.html'), 'utf8');
assert.equal(people.split(hrefs.people).length - 1, 1, 'People Group CN override should load once');
assert(people.indexOf(hrefs.people) < people.indexOf('../assets/css/archive-consistency.css'), 'People Group override should retain its pre-archive cascade layer');
assert.equal((people.match(/<style\b/gi) || []).length, 0, 'People Group CN should not retain inline styles');

const research = fs.readFileSync(path.join(root, 'Research/Research-ov-cn.html'), 'utf8');
assert.equal(research.split(hrefs.research).length - 1, 1, 'Research Overview CN title override should load once');
assert(research.indexOf('../assets/js/root/010.js') < research.indexOf(hrefs.research), 'Research title override should follow the original script layer');
assert(research.indexOf(hrefs.research) < research.indexOf('../assets/css/cn-link-label.css'), 'Research title override should precede the following shared layer');
assert.equal((research.match(/<style\b/gi) || []).length, 0, 'Research Overview CN should not retain inline styles');

for (const language of ['cn', 'en']) {
  const file = `Engage/Engage-inquiry-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(html, /<div class="url-textfield js-form-wrapper form-wrapper" style="display: none !important;">[\s\S]*?<input[^>]+name="url"/, `${file}: preserve the hidden Drupal honeypot field and its required hidden state`);
}

const contentPages = walk(root);
assert.equal(contentPages.length, 356, 'content page inventory changed');
const pagesWithStyleBlocks = contentPages.filter(file => /<style\b/i.test(fs.readFileSync(file, 'utf8')));
assert.deepEqual(pagesWithStyleBlocks, [], 'content-page skin styles should be externalized from HTML');

process.stdout.write(`PASS: residual page skin blocks are externalized at their original cascade positions; all ${contentPages.length} content pages are free of inline style blocks.\n`);
