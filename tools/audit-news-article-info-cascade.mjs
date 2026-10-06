import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(['.git', 'components', 'Replicate']);

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

const files = walk(root);
const infoPages = files.filter(file => /class=["'][^"']*\bnews-full__info\b/.test(fs.readFileSync(file, 'utf8')));
const metadataCss = fs.readFileSync(path.join(root, 'assets/css/news/news-metadata.css'), 'utf8');
const articleCss = fs.readFileSync(path.join(root, 'assets/css/news/article-page.css'), 'utf8');
const sharedInfoRule = metadataCss.match(/\.node--type-news\.node--view-mode-full \.news-full__info\s*\{([^}]*)\}/)?.[1] || '';

assert.equal(infoPages.length, 174, 'News full-info component page count changed');
for (const file of infoPages) {
  const html = fs.readFileSync(file, 'utf8');
  const main = /<main\b[^>]*>/i.exec(html)?.[0] || '';
  assert.match(main, /\bclass=["'][^"']*\barticle-page\b/, `${path.relative(root, file)}: missing ArticlePage scope`);
  assert.equal((html.match(/news-metadata\.css(?:[?#"'])/g) || []).length, 1, `${path.relative(root, file)}: metadata stylesheet reference changed`);
  assert.equal((html.match(/article-page\.css(?:[?#"'])/g) || []).length, 1, `${path.relative(root, file)}: ArticlePage stylesheet reference changed`);
}

assert.match(sharedInfoRule, /display:\s*flex\s*;/, 'Shared info rule lost its layout contract');
assert.match(sharedInfoRule, /align-items:\s*center\s*;/, 'Shared info rule lost its alignment contract');
assert.doesNotMatch(sharedInfoRule, /(?:^|\n)\s*(?:margin|padding)(?:-[\w]+)?\s*:/, 'Shared info rule must not own geometry overridden by ArticlePage');
assert.match(articleCss, /\.article-page \.node--type-news\.node--view-mode-full \.news-full__info\s*\{[^}]*margin:/s, 'ArticlePage must own base info geometry');
assert.match(articleCss, /@media\s*\(min-width:\s*700px\)[\s\S]*?\.news-full__info\s*\{[^}]*padding:/, 'ArticlePage must own tablet info geometry');
assert.match(articleCss, /@media\s*\(min-width:\s*1025px\)[\s\S]*?\.news-full__info\s*\{[^}]*padding:/, 'ArticlePage must own desktop info geometry');

process.stdout.write(`${JSON.stringify({
  pages: infoPages.length,
  sharedInfoRuleProperties: ['display:flex', 'align-items:center'],
  geometryOwner: 'assets/css/news/article-page.css',
  breakpoints: ['base', 'min-width:700px', 'min-width:1025px'],
}, null, 2)}\n`);
