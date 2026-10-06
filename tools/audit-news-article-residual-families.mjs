import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'News/List');

function extract(html, file) {
  const bodyOpen = /<div\b(?=[^>]*\bclass=["'][^"']*\bnews-full__body\b[^"']*["'])[^>]*>/i.exec(html);
  assert.ok(bodyOpen, `${file}: article body slot missing`);
  const main = /<main\b[\s\S]*?<\/main>/i.exec(html)?.[0] || '';
  assert.ok(main, `${file}: main element missing`);
  const mainBodyOpen = /<div\b(?=[^>]*\bclass=["'][^"']*\bnews-full__body\b[^"']*["'])[^>]*>/i.exec(main);
  assert.ok(mainBodyOpen, `${file}: article body is not inside main`);
  const mainInfoStart = main.indexOf('news-full__info', mainBodyOpen);
  const mainOpen = /<main\b([^>]*)>/i.exec(main)?.[1] || '';
  const mainClass = mainOpen.match(/\bclass=["']([^"']*)/i)?.[1] || '(missing)';
  const articleOpen = /<article\b([^>]*)>/i.exec(main)?.[1] || '';
  const articleClass = articleOpen.match(/\bclass=["']([^"']*)/i)?.[1] || '(missing)';
  const bodyClass = bodyOpen[0].match(/\bclass=["']([^"']*)/i)?.[1] || '(missing)';
  const heroClass = main.match(/<div\b[^>]*class=["']([^"']*\bhero\b[^"']*)["']/i)?.[1] || '(missing)';
  const excerpt = /<div\b[^>]*class=["'][^"']*\bifde-page__intro\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(main)?.[1];
  const metadataPresent = /news-full__meta/.test(main);
  const linkList = /<ul\b[^>]*>([\s\S]*?)<\/ul>/i.exec(mainInfoStart >= 0 ? main.slice(mainInfoStart) : '')?.[0] || '';
  const listItems = (linkList.match(/<li[\s>]/gi) || []).length;
  const signature = markup => [...markup.matchAll(/<\/?([a-z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/gi)].map(([source, tag]) => {
    if (source.startsWith('</')) return `/${tag.toLowerCase()}`;
    const classes = source.match(/\bclass=["']([^"']*)["']/i)?.[1]?.trim().split(/\s+/).filter(Boolean).sort().join('.') || '';
    return `${tag.toLowerCase()}${classes ? `.${classes}` : ''}`;
  }).join('|');
  const relatedTail = mainInfoStart < 0 ? '' : main.slice(mainInfoStart);
  const tailClasses = [...relatedTail.matchAll(/<\/?([a-z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/gi)].map(([source, tag]) => {
    if (source.startsWith('</')) return `/${tag.toLowerCase()}`;
    const classes = source.match(/\bclass=["']([^"']*)["']/i)?.[1]?.trim().split(/\s+/).filter(Boolean).sort().join('.') || '';
    return `${tag.toLowerCase()}${classes ? `.${classes}` : ''}`;
  }).join('|');
  const allStyles = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)]
    .map(([tag]) => tag.match(/\bhref=["']([^"']+)/i)?.[1]?.split(/[?#]/, 1)[0])
    .filter(Boolean);
  return {
    mainClass, articleClass, heroClass, bodyClass,
    prefixSignature: signature(main.slice(0, mainBodyOpen.index + mainBodyOpen[0].length)),
    tailSignature: tailClasses,
    metadataPresent,
    datePresent: /news-full__date/.test(main),
    authorPresent: /news-full__author/.test(main),
    excerptState: excerpt === undefined ? 'missing' : excerpt.replace(/<[^>]+>/g, '').trim() ? 'filled' : 'empty',
    relatedLinkCount: listItems,
    stylesheets: [...new Set(allStyles)].sort(),
  };
}

const pages = fs.readdirSync(directory).filter(file => file.endsWith('.html')).sort().map(file => {
  const html = fs.readFileSync(path.join(directory, file), 'utf8');
  const language = file.endsWith('-cn.html') ? 'cn' : 'en';
  return { file, slug: file.replace(/-(?:cn|en)\.html$/, ''), language, ...extract(html, file) };
});
const byLanguage = Object.fromEntries(['cn', 'en'].map(language => {
  const group = pages.filter(page => page.language === language);
  const counts = new Map();
  for (const page of group) counts.set(page.prefixSignature, (counts.get(page.prefixSignature) || 0) + 1);
  const dominant = [...counts].sort((a, b) => b[1] - a[1])[0][0];
  return [language, { dominant, pages: group.filter(page => page.prefixSignature === dominant) }];
}));
const residual = pages.filter(page => page.prefixSignature !== byLanguage[page.language].dominant);

function groupsFor(rows, key) {
  const groups = new Map();
  for (const page of rows) {
    const signature = page[key];
    const members = groups.get(signature) || [];
    members.push(page.file);
    groups.set(signature, members);
  }
  return [...groups.values()].sort((a, b) => b.length - a.length)
    .map(files => ({ pages: files.length, examples: files.slice(0, 5), ...(files.length <= 12 ? { files } : {}) }));
}

const residualPairs = new Map();
for (const page of residual) {
  const pair = residualPairs.get(page.slug) || {};
  pair[page.language] = page;
  residualPairs.set(page.slug, pair);
}
const missingPairs = [...residualPairs].filter(([, pair]) => !pair.cn || !pair.en).map(([slug]) => slug);
const prefixMismatchPairs = [...residualPairs].filter(([, pair]) => pair.cn && pair.en && pair.cn.prefixSignature !== pair.en.prefixSignature).map(([slug]) => slug);
const tailMismatchPairs = [...residualPairs].filter(([, pair]) => pair.cn && pair.en && pair.cn.tailSignature !== pair.en.tailSignature).map(([slug]) => slug);
const mainClassCounts = Object.fromEntries([...new Set(residual.map(page => page.mainClass))]
  .map(value => [value, residual.filter(page => page.mainClass === value).length]));
const articleClassCounts = Object.fromEntries([...new Set(residual.map(page => page.articleClass))]
  .map(value => [value, residual.filter(page => page.articleClass === value).length]));
const result = {
  totalPages: pages.length,
  dominantPrefixPages: { cn: byLanguage.cn.pages.length, en: byLanguage.en.pages.length },
  residualPages: residual.length,
  residualBilingualPairs: residualPairs.size,
  missingPairs,
  prefixMismatchPairs,
  tailMismatchPairs,
  mainClassCounts,
  articleClassCounts,
  residualPrefixFamilies: Object.fromEntries(['cn', 'en'].map(language => [language, groupsFor(residual.filter(page => page.language === language), 'prefixSignature')])),
  residualTailFamilies: Object.fromEntries(['cn', 'en'].map(language => [language, groupsFor(residual.filter(page => page.language === language), 'tailSignature')])),
  excerptStates: Object.fromEntries(['cn', 'en'].map(language => [language, Object.fromEntries([...new Set(residual.filter(page => page.language === language).map(page => page.excerptState))].map(state => [state, residual.filter(page => page.language === language && page.excerptState === state).length]))])),
  relatedLinkCounts: Object.fromEntries(['cn', 'en'].map(language => [language, Object.fromEntries([...new Set(residual.filter(page => page.language === language).map(page => page.relatedLinkCount))].map(count => [count, residual.filter(page => page.language === language && page.relatedLinkCount === count).length]))])),
  metadataMissing: residual.filter(page => !page.metadataPresent || !page.datePresent || !page.authorPresent).map(page => page.file),
  stylesheetCombinationCount: new Set(residual.map(page => page.stylesheets.join(' | '))).size,
  stylesheetCombinationExamples: [...new Set(residual.map(page => page.stylesheets.join(' | ')))].slice(0, 8).map(value => ({ count: residual.filter(page => page.stylesheets.join(' | ') === value).length, stylesheets: value.split(' | ') })),
};
const metadataMissing = result.metadataMissing;

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (pages.length !== 174 || residual.length !== 46 || residualPairs.size !== 23 || missingPairs.length || metadataMissing.length) process.exitCode = 1;
