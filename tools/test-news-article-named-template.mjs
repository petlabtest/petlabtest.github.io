import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'News/List');
const relatedListMarker = '@@RELATED_LINKS_BLOCK@@';

function extractBody(html, file) {
  const opening = /<div\b(?=[^>]*\bclass=["'][^"']*\bnews-full__body\b[^"']*["'])[^>]*>/i.exec(html);
  assert.ok(opening, `${file}: .news-full__body opening tag not found`);
  const bodyStart = opening.index + opening[0].length;
  let depth = 1;
  const divToken = /<!--(?:[\s\S]*?)-->|<\/?div\b[^>]*>/gi;
  for (const match of html.slice(bodyStart).matchAll(divToken)) {
    if (match[0].startsWith('<!--')) continue;
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) {
      const bodyEnd = bodyStart + match.index;
      return { prefix: html.slice(0, bodyStart), bodyHtml: html.slice(bodyStart, bodyEnd), suffix: html.slice(bodyEnd) };
    }
  }
  assert.fail(`${file}: .news-full__body closing tag not found`);
}

function tagShape(markup) {
  return [...markup.matchAll(/<\/?([a-z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/gi)]
    .map(([source, tag]) => {
      if (source.startsWith('</')) return `/${tag.toLowerCase()}`;
      const classes = source.match(/\bclass=["']([^"']*)["']/i)?.[1]
        ?.trim().split(/\s+/).filter(Boolean).sort().join('.') || '';
      return `${tag.toLowerCase()}${classes ? `.${classes}` : ''}`;
    }).join('|');
}

function pieces(markup) {
  const result = [];
  const tags = /<\/?([a-z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/gi;
  let cursor = 0;
  for (const match of markup.matchAll(tags)) {
    result.push(markup.slice(cursor, match.index), match[0]);
    cursor = match.index + match[0].length;
  }
  result.push(markup.slice(cursor));
  return result;
}

function parseAttributes(tag) {
  return new Map([...tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(match => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]));
}

function parseLinkItem(item, file) {
  const anchor = /<a\b[^>]*>([\s\S]*?)<\/a>/i.exec(item);
  assert.ok(anchor, `${file}: related-link item lacks an anchor`);
  const openingAnchor = /<a\b[^>]*>/i.exec(item)[0];
  const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(openingAnchor);
  assert.ok(href, `${file}: related-link anchor lacks href`);
  const rawHref = href[1] ?? href[2] ?? href[3];
  const anchorStart = item.indexOf(openingAnchor);
  const valueInAttribute = href[0].indexOf(rawHref);
  const hrefStart = anchorStart + href.index + valueInAttribute;
  const labelStart = anchorStart + openingAnchor.length;
  const labelEnd = labelStart + anchor[1].length;
  const itemTemplate = `${item.slice(0, hrefStart)}{{href}}${item.slice(hrefStart + rawHref.length, labelStart)}{{label}}${item.slice(labelEnd)}`;
  return { href: rawHref, label: anchor[1], itemTemplate };
}

function parseRelatedList(markup, file) {
  const opening = /^<ul\b[^>]*>/i.exec(markup);
  const closingStart = markup.toLowerCase().lastIndexOf('</ul>');
  assert.ok(opening && closingStart >= opening[0].length, `${file}: malformed related-links list`);
  const inner = markup.slice(opening[0].length, closingStart);
  const itemMatches = [...inner.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/gi)];
  assert.ok(itemMatches.length, `${file}: empty related-links list`);
  const items = [];
  const separators = [];
  let cursor = 0;
  for (const match of itemMatches) {
    separators.push(inner.slice(cursor, match.index));
    const parsed = parseLinkItem(match[0], file);
    items.push({ href: parsed.href, label: parsed.label, template: parsed.itemTemplate });
    cursor = match.index + match[0].length;
  }
  return {
    opening: opening[0],
    closing: markup.slice(closingStart),
    leading: separators[0],
    between: separators.slice(1),
    trailing: inner.slice(cursor),
    items,
  };
}

function activeElements(tokens, endIndex) {
  const stack = [];
  for (const token of tokens.slice(0, endIndex)) {
    if (!token.startsWith('<') || token.startsWith('<!--') || token.startsWith('<!')) continue;
    const closing = token.startsWith('</');
    const tag = /^<\/?([\w:-]+)/.exec(token)?.[1]?.toLowerCase();
    if (!tag) continue;
    if (closing) {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].tag === tag) {
          stack.length = index;
          break;
        }
      }
    } else if (!/\/\s*>$/.test(token) && !['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(tag)) {
      stack.push({ tag, attrs: parseAttributes(token) });
    }
  }
  return stack;
}

function semanticField(region, tokens, index, alternatives) {
  const token = tokens[index];
  const tag = /^<\s*([\w:-]+)/.exec(token)?.[1]?.toLowerCase();
  if (tag) {
    const maps = [token, ...alternatives.map(items => items[index])].map(parseAttributes);
    const names = new Set(maps.flatMap(attrs => [...attrs.keys()]));
    const changed = [...names].filter(name => new Set(maps.map(attrs => attrs.get(name) ?? '(missing)')).size > 1);
    if (changed.length) {
      const attrs = maps[0];
      const valueName = changed.join('_');
      const slug = value => (value || 'default').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      if (tag === 'meta') return `seo_meta_${slug(attrs.get('property') || attrs.get('name') || attrs.get('itemprop'))}_${valueName}`;
      if (tag === 'link') return `seo_link_${slug(attrs.get('rel'))}_${slug(attrs.get('hreflang'))}_${valueName}`;
      if (tag === 'source') return `hero_source_${slug(attrs.get('media'))}_${valueName}`;
      if (tag === 'img') return `hero_image_${valueName}`;
      if (tag === 'html') return `document_${valueName}`;
      if (valueName === 'aria-label' && attrs.get('class')?.split(/\s+/).includes('news-full__meta')) return 'article_metadata_region_label';
      if (valueName === 'aria-label' && attrs.get('role') === 'region') return 'article_region_label';
      return `element_${slug(attrs.get('class') || tag)}_${valueName}`;
    }
  }

  if (/^\s*$/.test(token)) return `formatting_${region}_${index}`;
  const active = activeElements(tokens, index);
  const classNames = new Set(active.flatMap(element => element.attrs.get('class')?.split(/\s+/) || []));
  if (active.at(-1)?.tag === 'title') return 'document_title_text';
  if (classNames.has('hero__page-title')) return 'article_title_text';
  if (classNames.has('ifde-page__intro')) return 'article_excerpt_text';
  if (classNames.has('news-full__date')) return 'article_date_text';
  if (classNames.has('news-full__author')) return 'article_source_text';
  if (classNames.has('tagged-as__label')) return 'related_links_heading_text';
  if (active.findLast(element => element.attrs.get('role') === 'region' && element.attrs.has('aria-label'))) return 'article_region_label_text';
  return `unclassified_${region}_${index}`;
}

const allPages = fs.readdirSync(directory).filter(file => file.endsWith('.html')).sort().map(file => {
  const html = fs.readFileSync(path.join(directory, file), 'utf8');
  const language = file.endsWith('-cn.html') ? 'cn' : 'en';
  const parts = extractBody(html, file);
  const main = /<main\b[\s\S]*?<\/main>/i.exec(html)?.[0];
  assert.ok(main, `${file}: main element missing`);
  const mainParts = extractBody(main, file);
  const listMatches = [...parts.suffix.matchAll(/<ul\b[^>]*>[\s\S]*?<\/ul>/gi)];
  assert.equal(listMatches.length, 1, `${file}: expected exactly one related-links list`);
  const [listMatch] = listMatches;
  const linkList = parseRelatedList(listMatch[0], file);
  const mainClass = /<main\b[^>]*\bclass=["']([^"']*)/i.exec(html)?.[1] || '(missing)';
  const articleClass = /<article\b[^>]*\bclass=["']([^"']*)/i.exec(html)?.[1] || '(missing)';
  const stylesheets = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)]
    .map(([tag]) => /\bhref=["']([^"']+)/i.exec(tag)?.[1]?.split(/[?#]/, 1)[0]).filter(Boolean).sort();
  return {
    file, slug: file.replace(/-(?:cn|en)\.html$/, ''), language, html,
    mainClass, articleClass, stylesheets,
    ...parts, mainPrefix: mainParts.prefix, mainSuffix: mainParts.suffix,
    linkList,
    suffixWithoutList: parts.suffix.replace(listMatch[0], relatedListMarker),
    prefixShape: tagShape(parts.prefix),
  };
});

const cohorts = Object.fromEntries(['cn', 'en'].map(language => {
  const counts = new Map();
  for (const row of allPages.filter(page => page.language === language)) counts.set(row.prefixShape, (counts.get(row.prefixShape) || 0) + 1);
  const shape = [...counts].sort((a, b) => b[1] - a[1])[0][0];
  return [language, allPages.filter(page => page.language === language && page.prefixShape === shape)];
}));
assert.equal(cohorts.cn.length, 79, 'Chinese dominant prefix cohort size changed');
assert.equal(cohorts.en.length, 79, 'English dominant prefix cohort size changed');
const pageBySlug = new Map();
for (const page of [...cohorts.cn, ...cohorts.en]) {
  const group = pageBySlug.get(page.slug) || {};
  group[page.language] = page;
  pageBySlug.set(page.slug, group);
}
assert.equal(pageBySlug.size, 79, 'dominant prefix cohort lost bilingual pairing');
for (const [slug, pair] of pageBySlug) assert.ok(pair.cn && pair.en, `${slug}: bilingual counterpart missing`);
const dominantRecords = [...pageBySlug.values()].flatMap(pair => [pair.cn, pair.en]);
const records = allPages;
const baseline = dominantRecords[0];
for (const page of dominantRecords) {
  assert.equal(tagShape(baseline.prefix), tagShape(page.prefix), `${page.file}: prefix structure differs`);
  assert.equal(tagShape(baseline.suffixWithoutList), tagShape(page.suffixWithoutList), `${page.file}: suffix outside related links differs`);
  assert.equal(page.linkList.opening, baseline.linkList.opening, `${page.file}: related list wrapper differs`);
  assert.equal(page.linkList.closing, baseline.linkList.closing, `${page.file}: related list close differs`);
  for (const link of page.linkList.items) assert.equal(link.template, baseline.linkList.items[0].template, `${page.file}: related-link item structure differs`);
}

const values = dominantRecords.map(() => new Map());
function buildRegion(region, sourceText, alternatives) {
  const sourceTokens = pieces(sourceText);
  const otherTokens = alternatives.map(text => pieces(text));
  for (const [index, row] of otherTokens.entries()) assert.equal(row.length, sourceTokens.length, `${region}: token count differs for ${dominantRecords[index + 1].file}`);
  return sourceTokens.map((token, index) => {
    const otherValues = otherTokens.map(row => row[index]);
    if (otherValues.every(value => value === token)) return token;
    const name = semanticField(region, sourceTokens, index, otherTokens);
    const slotValues = [token, ...otherValues];
    slotValues.forEach((value, page) => {
      if (values[page].has(name)) assert.equal(values[page].get(name), value, `${records[page].file}: conflicting semantic value ${name}`);
      values[page].set(name, value);
    });
    return `{{${name}}}`;
  }).join('');
}

const prefixTemplate = buildRegion('prefix', baseline.prefix, dominantRecords.slice(1).map(page => page.prefix));
const suffixTemplate = buildRegion('suffix', baseline.suffixWithoutList, dominantRecords.slice(1).map(page => page.suffixWithoutList));
const unclassified = [...new Set(values.flatMap(map => [...map.keys()].filter(key => key.startsWith('unclassified_') || key.startsWith('element_'))))];
assert.deepEqual(unclassified, [], 'semantic template has unclassified varying shell fields');
const linkItemTemplate = baseline.linkList.items[0].template;

function variationSummary(group) {
  const names = new Set();
  let varyingTokenPositions = 0;
  const base = group[0];
  for (const [region, source] of [['prefix', base.prefix], ['suffix', base.suffixWithoutList]]) {
    const tokens = pieces(source);
    const alternatives = group.slice(1).map(page => pieces(region === 'prefix' ? page.prefix : page.suffixWithoutList));
    for (const other of alternatives) assert.equal(other.length, tokens.length, `${region}: ${group[0].language} token count differs`);
    for (let index = 0; index < tokens.length; index += 1) {
      const valuesAtPosition = alternatives.map(other => other[index]);
      if (valuesAtPosition.every(value => value === tokens[index])) continue;
      varyingTokenPositions += 1;
      names.add(semanticField(region, tokens, index, alternatives));
    }
  }
  const fields = [...names];
  return {
    varyingTokenPositions,
    semanticFields: fields.filter(name => !name.startsWith('formatting_')).length,
    formattingOnlySlots: fields.filter(name => name.startsWith('formatting_')).length,
    namedFields: fields.sort(),
  };
}

function formatSignature(page) {
  const normalized = ['prefix', 'suffixWithoutList'].map(region => pieces(page[region]).map(token => {
      if (!token.startsWith('<')) return token.trim() ? '#TEXT' : token;
      const tag = /^<\/?([a-z][\w:-]*)/i.exec(token)?.[1]?.toLowerCase() || 'declaration';
      if (token.startsWith('</')) return `/${tag}`;
      const classes = token.match(/\bclass=["']([^"']*)["']/i)?.[1]
        ?.trim().split(/\s+/).filter(Boolean).sort().join('.') || '';
      return `${tag}${classes ? `.${classes}` : ''}`;
    }));
  return JSON.stringify(normalized);
}

function structuralSignature(page) {
  const tagShapeOnly = markup => pieces(markup).filter(token => token.startsWith('<')).map(token => {
      const tag = /^<\/?([a-z][\w:-]*)/i.exec(token)?.[1]?.toLowerCase() || 'declaration';
      if (token.startsWith('</')) return `/${tag}`;
      const classes = token.match(/\bclass=["']([^"']*)["']/i)?.[1]
        ?.trim().split(/\s+/).filter(Boolean).sort().join('.') || '';
      return `${tag}${classes ? `.${classes}` : ''}`;
    });
  const mainSuffix = page.mainSuffix.replace(/<ul\b[^>]*>[\s\S]*?<\/ul>/i, '@@RELATED_LINKS@@');
  const shells = [tagShapeOnly(page.mainPrefix), tagShapeOnly(mainSuffix)];
  const links = [page.linkList.opening, page.linkList.items[0]?.template || '', page.linkList.closing].map(tagShapeOnly);
  return JSON.stringify([shells, links]);
}

function formatFamilies(group) {
  const grouped = new Map();
  for (const page of group) {
    const signature = formatSignature(page);
    const members = grouped.get(signature) || [];
    members.push(page.file);
    grouped.set(signature, members);
  }
  return [...grouped.values()].sort((a, b) => b.length - a.length)
    .map(files => ({ pages: files.length, examples: files.slice(0, 3) }));
}
const perLanguageTemplates = Object.fromEntries(['cn', 'en'].map(language => [
  language,
  {
    ...variationSummary(dominantRecords.filter(page => page.language === language)),
    formattingFamilies: formatFamilies(dominantRecords.filter(page => page.language === language)),
  },
]));

function renderLinkList(page) {
  const items = page.linkList.items.map(link => (link.template || linkItemTemplate)
    .replaceAll('{{href}}', link.href)
    .replaceAll('{{label}}', link.label));
  const separators = page.linkList.between;
  return `${page.linkList.opening}${page.linkList.leading}${items.map((item, index) => `${index ? separators[index - 1] : ''}${item}`).join('')}${page.linkList.trailing}${page.linkList.closing}`;
}

function makeFormatTemplate(group) {
  const fieldValues = group.map(() => new Map());
  const base = group[0];
  function build(region, source) {
    const tokens = pieces(source);
    const alternatives = group.slice(1).map(page => pieces(region === 'prefix' ? page.prefix : page.suffixWithoutList));
    for (const [index, other] of alternatives.entries()) assert.equal(other.length, tokens.length, `${group[index + 1].file}: ${region} token count differs`);
    return tokens.map((token, index) => {
      const otherTokens = alternatives.map(row => row[index]);
      if (otherTokens.every(value => value === token)) return token;
      const field = semanticField(region, tokens, index, alternatives);
      assert.ok(!field.startsWith('formatting_'), `${base.file}: format family still needs slot ${field}`);
      const fieldRowValues = [token, ...otherTokens];
      fieldRowValues.forEach((value, pageIndex) => {
        if (fieldValues[pageIndex].has(field)) assert.equal(fieldValues[pageIndex].get(field), value, `${group[pageIndex].file}: conflicting ${field}`);
        fieldValues[pageIndex].set(field, value);
      });
      return `{{${field}}}`;
    }).join('');
  }
  const prefix = build('prefix', base.prefix);
  const suffix = build('suffix', base.suffixWithoutList);
  const unknown = [...new Set(fieldValues.flatMap(map => [...map.keys()].filter(field => field.startsWith('unclassified_') || field.startsWith('element_'))))];
  assert.deepEqual(unknown, [], `${base.language}/${base.file}: unclassified fields in format template`);
  return { group, fieldValues, prefix, suffix };
}

const groupsByFormat = new Map();
for (const page of records) {
  const key = `${page.language}:${formatSignature(page)}`;
  const group = groupsByFormat.get(key) || [];
  group.push(page);
  groupsByFormat.set(key, group);
}
const formatTemplates = [...groupsByFormat.values()].map(makeFormatTemplate);
const structuralFamilies = new Map();
const layoutStyleProfiles = new Map();
for (const page of records) {
  const key = `${page.language}:${page.mainClass}:${structuralSignature(page)}`;
  const members = structuralFamilies.get(key) || [];
  members.push(page);
  structuralFamilies.set(key, members);
  const profile = `${page.mainClass}\n${page.stylesheets.join('|')}`;
  const profileMembers = layoutStyleProfiles.get(profile) || [];
  profileMembers.push(page);
  layoutStyleProfiles.set(profile, profileMembers);
}
const structuralPairs = new Map();
for (const page of records) {
  const pair = structuralPairs.get(page.slug) || {};
  pair[page.language] = page;
  structuralPairs.set(page.slug, pair);
}
const structuralPairMismatches = [...structuralPairs].filter(([, pair]) => pair.cn && pair.en &&
  (pair.cn.mainClass !== pair.en.mainClass || structuralSignature(pair.cn) !== structuralSignature(pair.en))).map(([slug, pair]) => ({
  slug,
  mainClass: pair.cn.mainClass !== pair.en.mainClass,
  prefix: tagShape(pair.cn.mainPrefix) !== tagShape(pair.en.mainPrefix),
  suffix: tagShape(pair.cn.mainSuffix.replace(/<ul\b[^>]*>[\s\S]*?<\/ul>/i, '@@RELATED_LINKS@@')) !== tagShape(pair.en.mainSuffix.replace(/<ul\b[^>]*>[\s\S]*?<\/ul>/i, '@@RELATED_LINKS@@')),
  relatedListItem: tagShape(pair.cn.linkList.items[0]?.template || '') !== tagShape(pair.en.linkList.items[0]?.template || ''),
  relatedListWrapper: tagShape(pair.cn.linkList.opening + pair.cn.linkList.closing) !== tagShape(pair.en.linkList.opening + pair.en.linkList.closing),
}));
const contentComponentProfiles = [...new Set(records.map(page => page.mainClass))].map(mainClass => {
  const pages = records.filter(page => page.mainClass === mainClass);
  return {
    mainClass,
    pages: pages.length,
    featureArticle: pages.filter(page => /\bfeature-article\b/.test(page.html)).length,
    paperFigure: pages.filter(page => /\bpaper-figure\b/.test(page.html)).length,
    applicationList: pages.filter(page => /\bapplication-list\b/.test(page.html)).length,
    scienceNote: pages.filter(page => /\bscience-note\b/.test(page.html)).length,
  };
});
const compactRebuilt = new Array(records.length);
const compactFieldNames = new Set();
for (const template of formatTemplates) {
  template.fieldValues.forEach((map, index) => {
    for (const field of map.keys()) compactFieldNames.add(field);
    const page = template.group[index];
    const substitutions = new Map(map);
    substitutions.set('bodyHtml', page.bodyHtml);
    substitutions.set('relatedLinksHtml', renderLinkList(page));
    const generated = `${template.prefix}{{bodyHtml}}${template.suffix}`.replace(/\{\{([\w-]+)\}\}/g, (_, field) => {
      assert.ok(substitutions.has(field), `${page.file}: missing compact-template field ${field}`);
      return substitutions.get(field);
    });
    const originalIndex = records.indexOf(page);
    compactRebuilt[originalIndex] = generated.replaceAll(relatedListMarker, substitutions.get('relatedLinksHtml'));
  });
}
for (const [index, page] of records.entries()) {
  const expected = crypto.createHash('sha256').update(page.html).digest('hex');
  const actual = crypto.createHash('sha256').update(compactRebuilt[index]).digest('hex');
  if (actual !== expected) {
    const mismatchAt = [...compactRebuilt[index]].findIndex((char, offset) => char !== page.html[offset]);
    assert.equal(actual, expected, `${page.file}: format-family template changed source bytes at ${mismatchAt}; actual=${JSON.stringify(compactRebuilt[index].slice(mismatchAt - 30, mismatchAt + 80))}; source=${JSON.stringify(page.html.slice(mismatchAt - 30, mismatchAt + 80))}`);
  }
}

const dominantRebuilt = dominantRecords.map((page, index) => {
  const substitutions = new Map(values[index]);
  substitutions.set('bodyHtml', page.bodyHtml);
  substitutions.set('relatedLinksHtml', renderLinkList(page));
  const generated = `${prefixTemplate}{{bodyHtml}}${suffixTemplate}`.replace(/\{\{([\w-]+)\}\}/g, (_, name) => {
    assert.ok(substitutions.has(name), `${page.file}: no value for template field ${name}`);
    return substitutions.get(name);
  });
  return generated.replaceAll(relatedListMarker, substitutions.get('relatedLinksHtml'));
});

const dominantFailures = [];
dominantRecords.forEach((page, index) => {
  const expected = crypto.createHash('sha256').update(page.html).digest('hex');
  const actual = crypto.createHash('sha256').update(dominantRebuilt[index]).digest('hex');
  if (actual !== expected) dominantFailures.push(page.file);
});
assert.deepEqual(dominantFailures, [], 'generated dominant-cohort named-template HTML differs from source');
const failures = [];
records.forEach((page, index) => {
  const expected = crypto.createHash('sha256').update(page.html).digest('hex');
  const actual = crypto.createHash('sha256').update(compactRebuilt[index]).digest('hex');
  if (actual !== expected) failures.push(page.file);
});
assert.deepEqual(failures, [], 'generated format-family HTML differs from source');

const linkDistribution = {};
for (const page of records) linkDistribution[page.linkList.items.length] = (linkDistribution[page.linkList.items.length] || 0) + 1;
process.stdout.write(`${JSON.stringify({
  totalBilingualPages: records.length,
  dominantBilingualPages: dominantRecords.length,
  sharedLanguageNeutralShell: true,
  semanticFieldNames: [...new Set(values.flatMap(map => [...map.keys()]))].sort(),
  relatedLinkDistribution: linkDistribution,
  perLanguageTemplateSummary: perLanguageTemplates,
  relatedLinksStructuredAs: '{ href, label }[]',
  rawBodyHtmlSlots: records.length,
  exactByteRoundTrips: records.length,
  formatFamilyTemplates: formatTemplates.length,
  formatFamilySizes: formatTemplates.map(template => ({ language: template.group[0].language, pages: template.group.length, examples: template.group.slice(0, 3).map(page => page.file) })),
  structureFamilyCount: structuralFamilies.size,
  structureFamilySizeHistogram: Object.fromEntries([...new Set([...structuralFamilies.values()].map(group => group.length))].sort((a, b) => a - b).map(size => [size, [...structuralFamilies.values()].filter(group => group.length === size).length])),
  structuralPairMismatchSlugs: structuralPairMismatches,
  contentComponentProfiles,
  layoutStylesheetProfiles: [...layoutStyleProfiles.entries()].map(([key, pages]) => ({ mainClass: key.split('\n')[0], pages: pages.length, stylesheets: pages[0].stylesheets, examples: pages.slice(0, 3).map(page => page.file) })).sort((a, b) => b.pages - a.pages),
  structureFamilies: [...structuralFamilies.values()].sort((a, b) => b.length - a.length).map(group => ({ pages: group.length, language: group[0].language, mainClass: group[0].mainClass, articleClass: group[0].articleClass, stylesheetCombinationCount: new Set(group.map(page => page.stylesheets.join('|'))).size, examples: group.slice(0, 4).map(page => page.file) })),
  compactTemplateSemanticFields: [...compactFieldNames].sort(),
  compactTemplateFormattingSlots: [...compactFieldNames].filter(field => field.startsWith('formatting_')).length,
  unclassifiedVaryingFields: unclassified.length,
  dominantFailures: dominantFailures.length,
  failures: failures.length,
}, null, 2)}\n`);
