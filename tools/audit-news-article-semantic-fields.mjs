import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'News/List');

function bodyPrefix(html, file) {
  const match = /<div\b(?=[^>]*\bclass=["'][^"']*\bnews-full__body\b[^"']*["'])[^>]*>/i.exec(html);
  assert.ok(match, `${file}: .news-full__body not found`);
  return html.slice(0, match.index + match[0].length);
}

function structureSignature(markup) {
  return [...markup.matchAll(/<\/?([a-z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/gi)]
    .map(([source, tag]) => {
      if (source.startsWith('</')) return `/${tag.toLowerCase()}`;
      const classes = source.match(/\bclass=["']([^"']*)["']/i)?.[1]
        ?.trim().split(/\s+/).filter(Boolean).sort().join('.') || '';
      return `${tag.toLowerCase()}${classes ? `.${classes}` : ''}`;
    })
    .join('|');
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(match => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]));
}

function allTags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(match => match[0]);
}

function textForClass(html, tagName, className) {
  const classPattern = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`<${tagName}\\b(?=[^>]*\\bclass=["'][^"']*\\b${classPattern}\\b[^"']*["'])[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i').exec(html);
  return match?.[1]?.replace(/<[^>]+>/g, '').trim() ?? null;
}

function localAssetExists(reference) {
  const asset = reference.split(/[?#]/, 1)[0];
  if (/^[a-z][a-z\d+.-]*:/i.test(asset)) return false;
  return fs.existsSync(path.resolve(directory, asset));
}

function extractFields(file, html) {
  const language = file.endsWith('-cn.html') ? 'cn' : 'en';
  const meta = new Map(allTags(html, 'meta').map(tag => {
    const attrs = attributes(tag);
    const key = attrs.name || attrs.property;
    return key ? [key.toLowerCase(), attrs.content ?? null] : null;
  }).filter(Boolean));
  const links = allTags(html, 'link').map(attributes);
  const alternates = links.filter(link => link.rel?.toLowerCase() === 'alternate');
  const heroStart = html.indexOf('class="hero__image"');
  const heroMarkup = heroStart < 0 ? '' : html.slice(heroStart, html.indexOf('</picture>', heroStart));
  const heroImage = allTags(heroMarkup, 'img').map(attributes)[0] || {};
  const relatedStart = html.indexOf('news-full__info');
  const relatedMarkup = relatedStart < 0 ? '' : html.slice(relatedStart, html.indexOf('</ul>', relatedStart) + 5);
  const relatedLinks = [...relatedMarkup.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(([, item]) => {
    const anchor = /<a\b[^>]*>([\s\S]*?)<\/a>/i.exec(item);
    const anchorTag = /<a\b[^>]*>/i.exec(item)?.[0] || '';
    return anchor ? { href: attributes(anchorTag).href || null, label: anchor[1].replace(/<[^>]+>/g, '').trim() } : null;
  });

  return {
    file,
    language,
    title: /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? null,
    description: meta.get('description') ?? null,
    canonical: links.find(link => link.rel?.toLowerCase() === 'canonical')?.href ?? null,
    alternates: alternates.map(({ hreflang, href }) => ({ hreflang, href })),
    socialMeta: Object.fromEntries(['og:type', 'og:site_name', 'og:locale', 'og:title', 'og:description', 'og:url', 'og:image', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']
      .map(key => [key, meta.get(key) ?? null])),
    h1: textForClass(html, 'h1', 'hero__page-title'),
    excerpt: textForClass(html, 'div', 'ifde-page__intro'),
    hero: {
      src: heroImage.src ?? null,
      alt: heroImage.alt ?? null,
      sources: allTags(heroMarkup, 'source').map(attributes).map(({ srcset, media }) => ({ srcset: srcset ?? null, media: media ?? null })),
    },
    date: textForClass(html, 'div', 'news-full__date'),
    author: textForClass(html, 'div', 'news-full__author'),
    relatedLinks,
    bodySlotPresent: /<div\b(?=[^>]*\bclass=["'][^"']*\bnews-full__body\b)/i.test(html),
  };
}

const pages = fs.readdirSync(directory).filter(file => file.endsWith('.html')).sort().map(file => {
  const html = fs.readFileSync(path.join(directory, file), 'utf8');
  return { file, html, language: file.endsWith('-cn.html') ? 'cn' : 'en', prefixShape: structureSignature(bodyPrefix(html, file)) };
});
const families = Object.fromEntries(['cn', 'en'].map(language => {
  const counts = new Map();
  for (const page of pages.filter(item => item.language === language)) counts.set(page.prefixShape, (counts.get(page.prefixShape) || 0) + 1);
  const largest = [...counts].sort((a, b) => b[1] - a[1])[0];
  return [language, pages.filter(page => page.language === language && page.prefixShape === largest[0])];
}));

const failures = [];
const relatedCounts = {};
const languagePairs = new Map();
const emptyExcerptPages = [];
for (const language of ['cn', 'en']) {
  for (const page of families[language]) {
    const fields = extractFields(page.file, page.html);
    const required = [
      ['title', fields.title], ['description', fields.description], ['canonical', fields.canonical],
      ['hreflang alternates', fields.alternates.length === 3 ? fields.alternates : null],
      ['social metadata', Object.values(fields.socialMeta).every(Boolean) ? fields.socialMeta : null],
      ['hero h1', fields.h1], ['excerpt container', fields.excerpt !== null ? fields.excerpt : null], ['hero src/alt', fields.hero.src && fields.hero.alt],
      ['three responsive hero sources', fields.hero.sources.length === 3 ? fields.hero.sources : null],
      ['related-link href/label records', fields.relatedLinks.length && fields.relatedLinks.every(link => link?.href && link.label) ? fields.relatedLinks : null],
      ['local hero image paths', fields.hero.src && fields.hero.sources.every(source => source.srcset && localAssetExists(source.srcset.split(',')[0].trim().split(/\s+/)[0])) && localAssetExists(fields.hero.src) ? true : null],
      ['date', fields.date], ['author/source', fields.author], ['related links', fields.relatedLinks.length ? fields.relatedLinks : null],
      ['opaque body slot', fields.bodySlotPresent],
    ];
    for (const [field, value] of required) if (value === null || value === false) failures.push({ file: page.file, field });
    if (fields.excerpt === '') emptyExcerptPages.push(page.file);
    relatedCounts[fields.relatedLinks.length] = (relatedCounts[fields.relatedLinks.length] || 0) + 1;
    const slug = page.file.replace(/-(?:cn|en)\.html$/, '');
    const pair = languagePairs.get(slug) || {};
    pair[language] = fields;
    languagePairs.set(slug, pair);
  }
}

for (const [slug, pair] of languagePairs) {
  if (!pair.cn || !pair.en) failures.push({ file: slug, field: 'bilingual counterpart' });
  else {
    if (pair.cn.relatedLinks.length !== pair.en.relatedLinks.length) failures.push({ file: slug, field: 'bilingual related-link count' });
    if (pair.cn.alternates.find(link => link.hreflang === 'zh-CN')?.href !== pair.cn.canonical) failures.push({ file: slug, field: 'zh-CN canonical/hreflang consistency' });
    if (pair.en.alternates.find(link => link.hreflang === 'en')?.href !== pair.en.canonical) failures.push({ file: slug, field: 'English canonical/hreflang consistency' });
    if (pair.cn.alternates.find(link => link.hreflang === 'en')?.href !== pair.en.canonical) failures.push({ file: slug, field: 'Chinese page English alternate' });
    if (pair.en.alternates.find(link => link.hreflang === 'zh-CN')?.href !== pair.cn.canonical) failures.push({ file: slug, field: 'English page Chinese alternate' });
    if (pair.cn.alternates.find(link => link.hreflang === 'x-default')?.href !== pair.en.canonical || pair.en.alternates.find(link => link.hreflang === 'x-default')?.href !== pair.en.canonical) failures.push({ file: slug, field: 'x-default alternate consistency' });
  }
}

const result = {
  dominantPrefixFamily: { cnPages: families.cn.length, enPages: families.en.length },
  bilingualPairs: languagePairs.size,
  relatedLinkCountDistribution: relatedCounts,
  explicitlyEmptyExcerpts: emptyExcerptPages.sort(),
  fieldsPresentPerPage: ['title', 'description', 'canonical', '3 hreflang alternates', '11 social metadata tags', 'h1', 'excerpt', 'hero image src/alt + 3 sources', 'date', 'author/source', 'relatedLinks[]', 'opaque bodyHtml'],
  failures,
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (failures.length || families.cn.length !== 64 || families.en.length !== 64 || languagePairs.size !== 64) process.exitCode = 1;
