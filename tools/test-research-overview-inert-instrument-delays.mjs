import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pages = ['Research/Research-ov-cn.html', 'Research/Research-ov-en.html'];
const cssFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && path.extname(file).toLowerCase() === '.css') cssFiles.push(file);
  }
}

walk('assets/css');
const transitionOwners = [];
for (const file of cssFiles) {
  const css = fs.readFileSync(file, 'utf8');
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1];
    const declarations = match[2];
    if (selector.includes('.paragraph--type-p-masonry-instrument')
      && selector.includes('.views-row')
      && /\btransition(?:-property)?\s*:/.test(declarations)) {
      transitionOwners.push(`${file}: ${selector.trim()}`);
    }
  }
}

assert.equal(transitionOwners.length, 2, 'only the News masonry component defines transition rules for instrument rows');
assert(transitionOwners.every(owner => owner.includes('.paragraph--type-p-masonry.paragraph--view-mode-full .p-masonry__item')),
  'transition rules require the separate nested News masonry container');
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const start = html.indexOf('<!-- Featured Instruments -->');
  const end = html.indexOf('<!-- Featured Facilities -->', start);
  assert(start >= 0 && end > start, `${file}: retain the Featured Instruments section boundaries`);
  const section = html.slice(start, end);
  assert.equal((section.match(/<div class="views-row">/g) || []).length, 3, `${file}: preserve all three instrument rows`);
  assert(!section.includes('paragraph--type-p-masonry paragraph--view-mode-full') && !section.includes('p-masonry__item'),
    `${file}: Featured Instruments is not nested under the News masonry transition owner`);
  assert.doesNotMatch(section, /class="views-row"[^>]*\bstyle\s*=|transition-delay/, `${file}: remove inert row-delay attributes`);
}

process.stdout.write('PASS: Research Overview Featured Instruments keeps three rows and no-op transition delays are removed.\n');
