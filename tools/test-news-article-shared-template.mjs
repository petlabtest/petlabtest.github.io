import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'News/List');
const pages = ['News-page13-cn.html', 'News-page13-en.html', 'News-page16-cn.html', 'News-page16-en.html'];

function extractBody(html, file) {
  const opening = /<div\b(?=[^>]*\bclass=["'][^"']*\bnews-full__body\b[^"']*["'])[^>]*>/i.exec(html);
  assert.ok(opening, `${file}: .news-full__body opening tag not found`);
  const bodyStart = opening.index + opening[0].length;
  let depth = 1;
  const token = /<!--(?:[\s\S]*?)-->|<\/?div\b[^>]*>/gi;
  for (const match of html.slice(bodyStart).matchAll(token)) {
    if (match[0].startsWith('<!--')) continue;
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) {
      const bodyEnd = bodyStart + match.index;
      return { prefix: html.slice(0, bodyStart), bodyHtml: html.slice(bodyStart, bodyEnd), suffix: html.slice(bodyEnd) };
    }
  }
  assert.fail(`${file}: .news-full__body closing tag not found`);
}

function pieces(markup) {
  return markup.split(/(<!--(?:[\s\S]*?)-->|<![^>]*>|<[^>]*>)/g).filter(Boolean);
}

function tagShape(markup) {
  return [...markup.matchAll(/<\/?([a-z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/gi)]
    .map(([source, tag]) => {
      if (source.startsWith('</')) return `/${tag.toLowerCase()}`;
      const classes = source.match(/\bclass=["']([^"']*)["']/i)?.[1]
        ?.trim().split(/\s+/).filter(Boolean).sort().join('.') || '';
      return `${tag.toLowerCase()}${classes ? `.${classes}` : ''}`;
    })
    .join('|');
}

const originals = pages.map(file => {
  const html = fs.readFileSync(path.join(directory, file), 'utf8');
  const parts = extractBody(html, file);
  const list = /<ul\b[^>]*>[\s\S]*?<\/ul>/i.exec(parts.suffix);
  assert.ok(list, `${file}: related links list not found in shell suffix`);
  const relatedLinkCount = (list[0].match(/<li[\s>]/gi) || []).length;
  return { file, html, ...parts, relatedLinksHtml: list[0], relatedLinkCount, suffixWithoutLinks: parts.suffix.replace(list[0], '{{relatedLinksHtml}}') };
});
const cn = originals[0];
for (const region of ['prefix', 'suffixWithoutLinks']) {
  for (const original of originals.slice(1)) {
    assert.equal(tagShape(cn[region]), tagShape(original[region]), `${region}: shared shell tag/class structure differs for ${original.file}`);
  }
}

const values = originals.map(() => new Map());
function attributeMap(tag) {
  return new Map([...tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(match => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]));
}

function activeElements(parts, endIndex) {
  const stack = [];
  for (const part of parts.slice(0, endIndex)) {
    if (!part.startsWith('<') || part.startsWith('<!--') || part.startsWith('<!')) continue;
    const close = /^<\//.test(part);
    const tag = /^<\/?([\w:-]+)/.exec(part)?.[1]?.toLowerCase();
    if (!tag) continue;
    if (close) {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].tag === tag) {
          stack.length = index;
          break;
        }
      }
    } else if (!/\/\s*>$/.test(part) && !['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(tag)) {
      stack.push({ tag, attrs: attributeMap(part) });
    }
  }
  return stack;
}

function semanticField(region, parts, index, alternatives) {
  const part = parts[index];
  const tagName = /^<\s*([\w:-]+)/.exec(part)?.[1]?.toLowerCase();
  if (tagName) {
    const maps = [part, ...alternatives.map(items => items[index])].map(attributeMap);
    const names = new Set(maps.flatMap(attrs => [...attrs.keys()]));
    const changed = [...names].filter(name => new Set(maps.map(attrs => attrs.get(name) ?? '(missing)')).size > 1);
    if (changed.length) {
      const attrs = maps[0];
      const valueName = changed.join('_');
      const slug = value => (value || 'default').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      if (tagName === 'meta') return `seo_meta_${slug(attrs.get('property') || attrs.get('name') || attrs.get('itemprop'))}_${valueName}`;
      if (tagName === 'link') return `seo_link_${slug(attrs.get('rel'))}_${slug(attrs.get('hreflang'))}_${valueName}`;
      if (tagName === 'source') return `hero_source_${slug(attrs.get('media'))}_${valueName}`;
      if (tagName === 'img') return `hero_image_${valueName}`;
      if (tagName === 'html') return `document_${valueName}`;
      if (valueName === 'aria-label' && attrs.get('class')?.split(/\s+/).includes('news-full__meta')) return 'article_metadata_region_label';
      if (valueName === 'aria-label' && activeElements(parts, index).some(element => element.attrs.get('class')?.split(/\s+/).includes('news-full__info'))) return 'article_related_region_label';
      if (valueName === 'aria-label' && attrs.get('role') === 'region') return 'article_tail_region_label';
      const classes = slug(attrs.get('class'));
      return `element_${classes || tagName}_${valueName}`;
    }
  }

  if (/^\s*$/.test(part)) return `formatting_${region}_text_${index}`;
  const active = activeElements(parts, index);
  const element = active.at(-1);
  const classNames = new Set(active.flatMap(item => item.attrs.get('class')?.split(/\s+/) || []));
  if (element?.tag === 'title') return 'document_title_text';
  if (classNames.has('hero__page-title')) return 'article_title_text';
  if (classNames.has('ifde-page__intro')) return 'article_excerpt_text';
  if (classNames.has('news-full__date')) return 'article_date_text';
  if (classNames.has('news-full__author')) return 'article_source_text';
  if (classNames.has('tagged-as__label')) return 'related_links_heading_text';
  if (active.findLast(item => item.attrs.get('role') === 'region' && item.attrs.has('aria-label'))) return 'article_tail_region_label_text';
  return `content_${region}_${element?.tag || 'text'}_${index}`;
}

function makeSharedRegion(region) {
  const templateParts = pieces(cn[region]);
  const otherParts = originals.slice(1).map(original => pieces(original[region]));
  for (const other of otherParts) assert.equal(templateParts.length, other.length, `${region}: shell token count differs`);
  const template = templateParts.map((part, index) => {
    const alternatives = otherParts.map(other => other[index]);
    if (alternatives.every(value => value === part)) return part;
    const key = semanticField(region, templateParts, index, otherParts);
    const slotValues = [part, ...otherParts.map(other => other[index])];
    slotValues.forEach((value, page) => {
      if (values[page].has(key)) assert.equal(values[page].get(key), value, `semantic field collision: ${key} in ${originals[page].file}`);
      values[page].set(key, value);
    });
    return `{{${key}}}`;
  }).join('');
  return template;
}

const prefixTemplate = makeSharedRegion('prefix');
const suffixTemplate = makeSharedRegion('suffixWithoutLinks');
const unclassifiedFields = [...values[0].keys()].filter(key => key.startsWith('content_') || key.startsWith('element_'));
assert.deepEqual(unclassifiedFields, [], 'shared template contains unclassified content fields');
function render(index) {
  const substitutions = new Map(values[index]);
  substitutions.set('bodyHtml', originals[index].bodyHtml);
  substitutions.set('relatedLinksHtml', originals[index].relatedLinksHtml);
  const rendered = `${prefixTemplate}{{bodyHtml}}${suffixTemplate}`
    .replace(/\{\{([\w-]+)\}\}/g, (_, key) => {
      assert.ok(substitutions.has(key), `unresolved template slot: ${key}`);
      return substitutions.get(key);
    });
  return rendered.replaceAll('{{relatedLinksHtml}}', originals[index].relatedLinksHtml);
}

const rebuilt = originals.map((_, index) => render(index));
const hashes = rebuilt.map(html => crypto.createHash('sha256').update(html).digest('hex'));
for (let index = 0; index < originals.length; index += 1) {
  const originalHash = crypto.createHash('sha256').update(originals[index].html).digest('hex');
  if (hashes[index] !== originalHash) {
    const mismatch = [...rebuilt[index]].findIndex((character, position) => character !== originals[index].html[position]);
    assert.fail(`${originals[index].file}: shared-template render changed source bytes at ${mismatch}; rebuilt=${JSON.stringify(rebuilt[index].slice(mismatch - 60, mismatch + 100))}; original=${JSON.stringify(originals[index].html.slice(mismatch - 60, mismatch + 100))}`);
  }
}

process.stdout.write(`${JSON.stringify({
  pages,
  oneSharedBilingualShell: true,
  prefixSlots: [...values[0].keys()].filter(key => {
    const marker = `{{${key}}}`;
    return prefixTemplate.includes(marker);
  }).length,
  suffixSlots: [...values[0].keys()].filter(key => suffixTemplate.includes(`{{${key}}}`)).length,
  namedTemplateFields: [...values[0].keys()],
  formattingOnlySlots: [...values[0].keys()].filter(key => key.startsWith('formatting_')).length,
  opaqueBodySlots: originals.length,
  relatedLinksPerPage: originals.map(({ file, relatedLinkCount }) => ({ file, count: relatedLinkCount })),
  exactByteRoundTrips: rebuilt.length,
  failures: 0,
}, null, 2)}\n`);
