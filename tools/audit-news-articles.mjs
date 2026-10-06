import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'News/List');
const pages = fs.readdirSync(directory)
  .filter(file => file.endsWith('.html'))
  .sort()
  .map(file => ({ file, html: fs.readFileSync(path.join(directory, file), 'utf8') }));
const legacyThemeCss = fs.readFileSync(path.join(root, 'assets/css/research/counter-cwmd/15.css'), 'utf8');
const metadataCss = fs.readFileSync(path.join(root, 'assets/css/news/news-metadata.css'), 'utf8');

const metadataRules = [...metadataCss.matchAll(/([^{}]+)\{[^{}]*\}/g)]
  .map(match => match[1].trim())
  .filter(selector => /\.news-full__(?:meta|date|author)\b/.test(selector));
const metadataCssReferences = pages.flatMap(({ html }) => [...html.matchAll(/<link\b[^>]*href=["']([^"']*news-metadata\.css(?:\?[^"']*)?)["'][^>]*>/gi)]
  .map(match => match[1].split('?')[1] || '(no version)'));
const metadataCssContract = {
  legacyRulesRemain: /\.news-full__(?:meta|date|author)\b/.test(legacyThemeCss),
  unscopedRules: metadataRules.filter(selector => !selector.includes('.article-page')),
  scopedRuleCount: metadataRules.length,
  referenceCount: metadataCssReferences.length,
  versions: [...new Set(metadataCssReferences)].sort(),
};

function stylesheetPaths(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => /\brel=["']stylesheet["']/i.test(tag))
    .map(tag => (tag.match(/\bhref=["']([^"']+)/i) || [])[1])
    .filter(Boolean)
    .map(href => href.split(/[?#]/, 1)[0]);
}

function groupBy(keyFor) {
  const groups = new Map();
  for (const page of pages) {
    const key = keyFor(page);
    const group = groups.get(key) || { count: 0, examples: [] };
    group.count += 1;
    if (group.examples.length < 4) group.examples.push(page.file);
    groups.set(key, group);
  }
  return [...groups].map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

const records = pages.map(page => {
  const main = page.html.match(/<main\b([^>]*)>/i)?.[1] || '';
  const mainClass = main.match(/\bclass=["']([^"']*)/i)?.[1] || '(missing)';
  const node = page.html.match(/<(article|div)\b[^>]*class=["'][^"']*\bnode\b[^"']*["']/i)?.[1] || '(missing)';
  const articleOpenCount = (page.html.match(/<article\b/gi) || []).length;
  const articleCloseCount = (page.html.match(/<\/article\s*>/gi) || []).length;
  const malformedArticleCloseCount = (page.html.match(/<\/article(?!\s*>)/gi) || []).length;
  const metadataOpenCount = (page.html.match(/<[^>]+class=["'][^"']*\bnews-full__meta\b[^"']*["'][^>]*>/gi) || []).length;
  const metadataStart = page.html.search(/<[^>]+class=["'][^"']*\bnews-full__meta\b[^"']*["'][^>]*>/i);
  const bodyStart = metadataStart < 0 ? -1 : page.html.indexOf('news-full__body', metadataStart);
  const metadataRegion = metadataStart < 0 || bodyStart < 0 ? '' : page.html.slice(metadataStart, bodyStart);
  const metadataDateCount = (metadataRegion.match(/class=["'][^"']*\bnews-full__date\b/gi) || []).length;
  const metadataAuthorCount = (metadataRegion.match(/class=["'][^"']*\bnews-full__author\b/gi) || []).length;
  const metadataDatePosition = metadataRegion.search(/class=["'][^"']*\bnews-full__date\b/i);
  const metadataAuthorPosition = metadataRegion.search(/class=["'][^"']*\bnews-full__author\b/i);
  const styles = stylesheetPaths(page.html);
  const mainHtml = (page.html.match(/<main\b[\s\S]*?<\/main>/i) || [''])[0];
  const inlineStyles = (page.html.match(/\sstyle\s*=/gi) || []).length;
  const mainInlineStyles = (mainHtml.match(/\sstyle\s*=/gi) || []).length;
  return {
    file: page.file,
    mainClass,
    node,
    articleOpenCount,
    articleCloseCount,
    malformedArticleCloseCount,
    metadataOpenCount,
    metadataDateCount,
    metadataAuthorCount,
    metadataOrderValid: metadataDatePosition >= 0 && metadataAuthorPosition > metadataDatePosition,
    styles,
    inlineStyles,
    mainInlineStyles,
    articlePageCss: styles.some(href => href.endsWith('/article-page.css')),
    newsMetadataCss: styles.some(href => href.endsWith('/news-metadata.css')),
    newsTypography: styles.some(href => href.endsWith('/news-content-typography.css')),
  };
});

const mainClassGroups = groupBy(page => records.find(row => row.file === page.file).mainClass);
const nodeGroups = groupBy(page => records.find(row => row.file === page.file).node);
const stylesheetGroups = groupBy(page => [...new Set(stylesheetPaths(page.html))].sort().join(' | ') || '(none)');
const pageInlineStyleGroups = groupBy(page => String((page.html.match(/\sstyle\s*=/gi) || []).length));
const mainInlineStyleGroups = groupBy(page => {
  const main = (page.html.match(/<main\b[\s\S]*?<\/main>/i) || [''])[0];
  return String((main.match(/\sstyle\s*=/gi) || []).length);
});
const missingContracts = records.filter(row => row.node !== 'article' || row.articleOpenCount !== row.articleCloseCount || row.malformedArticleCloseCount > 0 || !row.mainClass.startsWith('article-page') || !row.articlePageCss || !row.newsMetadataCss || !row.newsTypography || row.metadataOpenCount !== 1 || row.metadataDateCount !== 1 || row.metadataAuthorCount !== 1 || !row.metadataOrderValid);
const pagesMissingMetadataCss = records.filter(row => !row.newsMetadataCss).map(row => row.file);
const inlineHeavy = records.filter(row => row.mainInlineStyles >= 10).map(({ file, mainInlineStyles }) => ({ file, mainInlineStyles }));
const pagesWithMainInlineStyles = records.filter(row => row.mainInlineStyles > 0)
  .map(({ file, mainInlineStyles }) => ({ file, mainInlineStyles }));

const report = {
  pages: records.length,
  mainClassGroups,
  nodeGroups,
  stylesheetCombinationCount: stylesheetGroups.length,
  metadataCssContract,
  pagesMissingMetadataCss,
  stylesheetGroups: stylesheetGroups.map(({ key, count, examples }) => ({ count, examples, stylesheets: key.split(' | ') })),
  pageInlineStyleGroups: pageInlineStyleGroups.map(({ key, count, examples }) => ({ count, inlineStyleAttributesPerPage: Number(key), examples })),
  mainInlineStyleGroups: mainInlineStyleGroups.map(({ key, count, examples }) => ({ count, inlineStyleAttributesPerPage: Number(key), examples })),
  inlineHeavy,
  pagesWithMainInlineStyles,
  missingContracts: missingContracts.map(({ file, mainClass, node, articleOpenCount, articleCloseCount, malformedArticleCloseCount, metadataOpenCount, metadataDateCount, metadataAuthorCount, metadataOrderValid, articlePageCss, newsMetadataCss, newsTypography }) => ({ file, mainClass, node, articleOpenCount, articleCloseCount, malformedArticleCloseCount, metadataOpenCount, metadataDateCount, metadataAuthorCount, metadataOrderValid, articlePageCss, newsMetadataCss, newsTypography })),
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (missingContracts.length || pagesWithMainInlineStyles.length || metadataCssContract.legacyRulesRemain || metadataCssContract.unscopedRules.length || !metadataCssContract.scopedRuleCount || metadataCssContract.referenceCount !== pages.length || metadataCssContract.versions.length !== 1 || pagesMissingMetadataCss.length) process.exitCode = 1;
