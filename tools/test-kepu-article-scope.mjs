import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excludedDirectories = new Set(['.git', 'components', 'Replicate']);
const stylesheet = fs.readFileSync(path.join(root, 'assets/css/news/kepu-article.css'), 'utf8');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) return [];
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(file);
    return entry.isFile() && path.extname(entry.name).toLowerCase() === '.html' ? [file] : [];
  });
}

const files = walk(root).sort();
const pages = files.flatMap(filePath => {
  const file = path.relative(root, filePath).split(path.sep).join('/');
  const html = fs.readFileSync(filePath, 'utf8');
  if (!/assets\/css\/news\/kepu-article\.css(?:[?#"'])/i.test(html)) return [];
  const main = /<main\b([^>]*)>([\s\S]*?)<\/main>/i.exec(html);
  assert.ok(main, `${file}: main element not found`);
  assert.match(main[1], /\bclass=["'][^"']*\barticle-page\b/i, `${file}: ArticlePage root missing`);
  assert.match(main[2], /<div\b(?=[^>]*\bclass=["'][^"']*\bnews-full__body\b)[^>]*>/i, `${file}: article body is not inside main`);
  const pageType = /\barticle-page--(feature|science)\b/.exec(main[1])?.[1];
  assert.ok(pageType, `${file}: expected feature or science ArticlePage variant`);
  const classes = new Set([...html.matchAll(/\bclass=["']([^"']+)["']/g)].flatMap(([, value]) => value.split(/\s+/)));
  return [{ file, pageType, classes }];
});

assert.deepEqual(pages.map(page => page.file.startsWith('News/List/')), pages.map(() => true), 'kepu-article.css is referenced outside News/List');
assert.equal(pages.length, 24, 'kepu-article.css consumer page count changed; review its intended scope');
assert.equal(pages.filter(page => page.pageType === 'feature').length, 14, 'feature consumer count changed');
assert.equal(pages.filter(page => page.pageType === 'science').length, 10, 'science consumer count changed');

const selectors = [...stylesheet.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(?:^|[{}])\s*([^@{}][^{}]*)\{/g)]
  .flatMap(([, group]) => group.split(','))
  .map(selector => selector.trim())
  .filter(selector => !selector.startsWith('@'));
assert.ok(selectors.length > 0, 'no selectors found');
for (const selector of selectors) {
  assert.match(selector, /^:where\(\.article-page\) \.news-full__body\b/, `selector lacks ArticlePage scope: ${selector}`);
  assert.doesNotMatch(selector, /:where\(\.article-page\)[^\s]/, `scope must be specificity-neutral: ${selector}`);
}

const consumerClasses = new Set(pages.flatMap(page => [...page.classes]));
const classSelectors = new Set([...stylesheet.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(([, className]) => className));
const unmatchedClasses = [...classSelectors].filter(className => !consumerClasses.has(className)).sort();
assert.deepEqual(unmatchedClasses, [], 'kepu-article.css contains class selectors absent from all consumer pages');

console.log(`kepu-article scope contract passed: scanned ${files.length} content pages; ${pages.length} consumers (${pages.filter(page => page.pageType === 'feature').length} feature, ${pages.filter(page => page.pageType === 'science').length} science), ${selectors.length} scoped selectors, ${classSelectors.size} classes matched to consumer DOM.`);
