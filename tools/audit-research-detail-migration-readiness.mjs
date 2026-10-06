import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'Research');
const files = fs.readdirSync(directory).filter(file => /^Research-(?:.+-Page\d+|Tech-.+)-(?:cn|en)\.html$/.test(file)).sort();
const components = {
  projectList: /\bproject-list\b/,
  fullwidth: /paragraph--type-p-fullwidth/,
  labCarousel: /\blab-carousel\b/,
  news3up: /paragraph--type-p-news3up|\bp-news3up__/,
  projectCarousel: /paragraph--type-p-project-carousel/,
  applicationGrid: /\bapplication-grid\b/,
  importedCapabilities: /\bimported-capabilities\b/,
  coreTechnologiesShowcase: /\bcore-technologies-showcase\b/,
  masonry: /paragraph--type-p-masonry|\bp-masonry__item\b/,
};

function sha(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

const pages = files.map(file => {
  const html = fs.readFileSync(path.join(directory, file), 'utf8');
  const technology = file.includes('-Tech-');
  const language = file.endsWith('-cn.html') ? 'cn' : 'en';
  const slug = file.replace(/-(?:cn|en)\.html$/, '');
  const styleBlocks = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(([, css]) => css);
  const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const stylesheetRefs = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)]
    .map(([tag]) => /\bhref=["']([^"']+)/i.exec(tag)?.[1]?.split(/[?#]/, 1)[0]).filter(Boolean);
  const scriptRefs = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)/gi)].map(([, src]) => src.split(/[?#]/, 1)[0]);
  const mainClass = /<main\b[^>]*\bclass=["']([^"']*)/i.exec(html)?.[1] || '(missing)';
  const styles = styleBlocks.map(css => ({
    bytes: Buffer.byteLength(css),
    exact: sha(css),
    normalized: sha(css.replace(/\s+/g, ' ').trim()),
    hasRulesOrDeclarations: css.replace(/\/\*[\s\S]*?\*\//g, '').trim().length > 0,
  }));
  const executableInlineScripts = scriptTags.filter(([, attrs]) => !/\bsrc\s*=/.test(attrs) && !/type=["']application\/json["']/i.test(attrs)).length;
  const embeddedJsonScripts = scriptTags.filter(([, attrs]) => !/\bsrc\s*=/.test(attrs) && /type=["']application\/json["']/i.test(attrs)).length;
  return {
    file, slug, language, cohort: technology ? 'technology' : 'subdetail',
    topic: slug.replace(/^Research-/, '').replace(/-Page\d+$/, '').replace(/^Tech-/, ''),
    mainClass, styleBlocks: styles, styleAttributeCount: (html.match(/\sstyle\s*=/gi) || []).length,
    executableInlineScripts, embeddedJsonScripts,
    stylesheets: [...new Set(stylesheetRefs)], scripts: [...new Set(scriptRefs)],
    components: Object.fromEntries(Object.entries(components).map(([name, pattern]) => [name, pattern.test(html)])),
  };
});

const pageBySlug = new Map();
for (const page of pages) {
  const pair = pageBySlug.get(page.slug) || {};
  pair[page.language] = page;
  pageBySlug.set(page.slug, pair);
}
const missingPairs = [...pageBySlug].filter(([, pair]) => !pair.cn || !pair.en).map(([slug]) => slug);
const pairMismatches = [...pageBySlug].filter(([, pair]) => pair.cn && pair.en && (
  pair.cn.cohort !== pair.en.cohort || pair.cn.mainClass !== pair.en.mainClass ||
  pair.cn.styleBlocks.length !== pair.en.styleBlocks.length ||
  pair.cn.styleBlocks.map(block => block.normalized).join('|') !== pair.en.styleBlocks.map(block => block.normalized).join('|') ||
  pair.cn.executableInlineScripts !== pair.en.executableInlineScripts ||
  JSON.stringify(pair.cn.components) !== JSON.stringify(pair.en.components)
)).map(([slug, pair]) => ({
  slug,
  mainClass: pair.cn.mainClass !== pair.en.mainClass,
  styleBlockCount: pair.cn.styleBlocks.length !== pair.en.styleBlocks.length,
  inlineStyleShape: pair.cn.styleBlocks.map(block => block.normalized).join('|') !== pair.en.styleBlocks.map(block => block.normalized).join('|'),
  executableScripts: pair.cn.executableInlineScripts !== pair.en.executableInlineScripts,
  componentFlags: JSON.stringify(pair.cn.components) !== JSON.stringify(pair.en.components),
}));

function countByStyleBlockLength(rows) {
  return Object.fromEntries([...new Set(rows.map(row => row.styleBlocks.length))].sort((a, b) => a - b)
    .map(length => [length, rows.filter(row => row.styleBlocks.length === length).length]));
}

const styleBlockSignatures = new Map();
for (const page of pages) for (const block of page.styleBlocks) {
  const group = styleBlockSignatures.get(block.normalized) || [];
  group.push(page.file);
  styleBlockSignatures.set(block.normalized, group);
}
const stylesheetCounts = Object.fromEntries([...new Set(pages.flatMap(page => page.stylesheets))].sort()
  .map(href => [href, pages.filter(page => page.stylesheets.includes(href)).length]));
const stylesheetProfiles = new Map();
for (const page of pages) {
  const key = `${page.cohort}:${page.stylesheets.join('|')}`;
  const group = stylesheetProfiles.get(key) || [];
  group.push(page.file);
  stylesheetProfiles.set(key, group);
}
const scriptCombinationCounts = new Map();
for (const page of pages) {
  const key = page.scripts.join(' | ');
  scriptCombinationCounts.set(key, (scriptCombinationCounts.get(key) || 0) + 1);
}
const inlineScriptShapes = new Map();
for (const page of pages) {
  const html = fs.readFileSync(path.join(directory, page.file), 'utf8');
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(attrs) || /type=["']application\/json["']/i.test(attrs) || !body.trim()) continue;
    const key = sha(body);
    const group = inlineScriptShapes.get(key) || { bytes: Buffer.byteLength(body), pages: [] };
    group.pages.push(page.file);
    inlineScriptShapes.set(key, group);
  }
}

const result = {
  pages: pages.length,
  cohorts: { subdetail: pages.filter(page => page.cohort === 'subdetail').length, technology: pages.filter(page => page.cohort === 'technology').length },
  bilingualPairs: pageBySlug.size,
  missingPairs,
  styleBlockCountDistribution: Object.fromEntries(['subdetail', 'technology'].map(cohort => [cohort, countByStyleBlockLength(pages.filter(page => page.cohort === cohort))])),
  inlineStyleAttributeCountByCohort: Object.fromEntries(['subdetail', 'technology'].map(cohort => [cohort, pages.filter(page => page.cohort === cohort).reduce((sum, page) => sum + page.styleAttributeCount, 0)])),
  executableInlineScriptsByCohort: Object.fromEntries(['subdetail', 'technology'].map(cohort => [cohort, pages.filter(page => page.cohort === cohort).reduce((sum, page) => sum + page.executableInlineScripts, 0)])),
  pagesWithInlineStyleBlocks: pages.filter(page => page.styleBlocks.length).map(page => ({ file: page.file, blocks: page.styleBlocks.length })),
  emptyInlineStyleBlocks: pages.flatMap(page => page.styleBlocks.flatMap((block, index) => block.hasRulesOrDeclarations ? [] : [{ file: page.file, block: index + 1 }])),
  inlineExecutableScriptShapes: [...inlineScriptShapes.values()].sort((a, b) => b.pages.length - a.pages.length),
  embeddedJsonScriptsByCohort: Object.fromEntries(['subdetail', 'technology'].map(cohort => [cohort, pages.filter(page => page.cohort === cohort).reduce((sum, page) => sum + page.embeddedJsonScripts, 0)])),
  componentPageCounts: Object.fromEntries(Object.keys(components).map(name => [name, Object.fromEntries(['subdetail', 'technology'].map(cohort => [cohort, pages.filter(page => page.cohort === cohort && page.components[name]).length]))])),
  stylesheetCounts,
  stylesheetCombinationCount: stylesheetProfiles.size,
  stylesheetCombinationSizes: [...stylesheetProfiles.values()].map(group => group.length).sort((a, b) => b - a),
  externalScriptCombinationCount: scriptCombinationCounts.size,
  externalScriptCombinationSizes: [...scriptCombinationCounts.values()].sort((a, b) => b - a),
  normalizedStyleBlockShapeCount: styleBlockSignatures.size,
  repeatedNormalizedStyleBlocks: [...styleBlockSignatures.values()].filter(group => group.length > 1).length,
  bilingualMismatchSlugs: pairMismatches,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (pages.length !== 56 || pageBySlug.size !== 28 || missingPairs.length || new Set(pages.map(page => page.cohort)).size !== 2 || result.emptyInlineStyleBlocks.length) process.exitCode = 1;
