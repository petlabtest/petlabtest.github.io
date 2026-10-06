import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'News/List');

function extractBody(html, file) {
  const opening = /<div\b(?=[^>]*\bclass=["'][^"']*\bnews-full__body\b[^"']*["'])[^>]*>/i.exec(html);
  assert.ok(opening, `${file}: .news-full__body opening tag not found`);
  const openEnd = opening.index + opening[0].length;
  let depth = 1;
  const divToken = /<!--(?:[\s\S]*?)-->|<\/?div\b[^>]*>/gi;

  for (const match of html.slice(openEnd).matchAll(divToken)) {
    const token = match[0];
    if (token.startsWith('<!--')) continue;
    if (/^<\//.test(token)) depth -= 1;
    else if (!/\/\s*>$/.test(token)) depth += 1;
    if (depth === 0) {
      const closeStart = openEnd + match.index;
      return {
        prefix: html.slice(0, openEnd),
        bodyHtml: html.slice(openEnd, closeStart),
        suffix: html.slice(closeStart),
      };
    }
  }
  assert.fail(`${file}: .news-full__body closing tag not found`);
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

const files = fs.readdirSync(directory)
  .filter(file => file.endsWith('.html'))
  .sort();
const results = files.map(file => {
  const original = fs.readFileSync(path.join(directory, file), 'utf8');
  const parts = extractBody(original, file);
  const rebuilt = parts.prefix + parts.bodyHtml + parts.suffix;
  const originalHash = crypto.createHash('sha256').update(original).digest('hex');
  const rebuiltHash = crypto.createHash('sha256').update(rebuilt).digest('hex');
  assert.equal(rebuiltHash, originalHash, `${file}: round-trip changed source bytes`);
  return {
    file,
    language: file.endsWith('-cn.html') ? 'cn' : 'en',
    originalBytes: Buffer.byteLength(original),
    bodyBytes: Buffer.byteLength(parts.bodyHtml),
    prefixShape: structureSignature(parts.prefix),
    suffixShape: structureSignature(parts.suffix),
    prefix: parts.prefix,
    suffix: parts.suffix,
  };
});

const pairOne = ['News-page1-cn.html', 'News-page1-en.html'];
for (const file of pairOne) assert.ok(results.some(result => result.file === file), `${file}: representative bilingual sample missing`);

function shapeGroups(language, key) {
  const grouped = new Map();
  for (const result of results.filter(row => row.language === language)) {
    const signature = result[key];
    const group = grouped.get(signature) || { count: 0, examples: [] };
    group.count += 1;
    if (group.examples.length < 3) group.examples.push(result.file);
    grouped.set(signature, group);
  }
  return [...grouped].map(([signature, value]) => ({ signature, ...value }))
    .sort((a, b) => b.count - a.count);
}

function familyVariation(language, key) {
  const groups = shapeGroups(language, key);
  const family = results.filter(row => row.language === language && row[key] === groups[0].signature);
  const markupKey = key === 'prefixShape' ? 'prefix' : 'suffix';
  const tokenized = family.map(row => ({
    file: row.file,
    tags: [...row[markupKey].matchAll(/<!--(?:[\s\S]*?)-->|<![^>]*>|<[^>]+>/g)].map(match => match[0]),
    text: row[markupKey].split(/<!--(?:[\s\S]*?)-->|<![^>]*>|<[^>]+>/g).map(value => value.replace(/\s+/g, ' ').trim()),
  }));
  const tagCount = tokenized[0].tags.length;
  assert.ok(tokenized.every(row => row.tags.length === tagCount), `${language} ${key}: tag alignment failed`);
  const attributeSlots = new Map();
  for (let index = 0; index < tagCount; index += 1) {
    const attributeMaps = tokenized.map(row => new Map([...row.tags[index].matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
      .map(match => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]])));
    const names = new Set(attributeMaps.flatMap(attrs => [...attrs.keys()]));
    for (const name of names) {
      const values = new Set(attributeMaps.map(attrs => attrs.get(name) ?? '(missing)'));
      if (values.size > 1) attributeSlots.set(`${index}:${name}`, {
        index,
        tag: tokenized[0].tags[index].match(/^<\s*([\w:-]+)/)?.[1] || 'declaration',
        name,
        values: [...values].slice(0, 3),
      });
    }
  }
  let variableTextSlots = 0;
  const examples = [];
  for (let index = 0; index < tokenized[0].text.length; index += 1) {
    const values = new Set(tokenized.map(row => row.text[index]));
    if (values.size > 1) {
      variableTextSlots += 1;
      if (examples.length < 5) examples.push({ slot: index, samples: tokenized.slice(0, 2).map(row => ({ file: row.file, text: row.text[index].slice(0, 100) })) });
    }
  }
  const attributes = {};
  for (const { name } of attributeSlots.values()) attributes[name] = (attributes[name] || 0) + 1;
  return {
    pages: family.length,
    files: family.map(row => row.file),
    alignedTagPositions: tagCount,
    variableAttributePositions: attributeSlots.size,
    variableAttributeNames: attributes,
    variableAttributeSlots: [...attributeSlots.values()],
    variableTextSlots,
    textSlotExamples: examples,
  };
}

function suffixBreakdown(language) {
  const prefixFamily = shapeGroups(language, 'prefixShape')[0].signature;
  const groups = new Map();
  for (const row of results.filter(item => item.language === language && item.prefixShape === prefixFamily)) {
    const group = groups.get(row.suffixShape) || [];
    group.push(row.file);
    groups.set(row.suffixShape, group);
  }
  return [...groups.values()].sort((a, b) => b.length - a.length)
    .map(files => ({ count: files.length, files }));
}

process.stdout.write(`${JSON.stringify({
  pages: results.length,
  exactByteRoundTrips: results.length,
  representativePair: pairOne,
  totalSourceBytes: results.reduce((sum, result) => sum + result.originalBytes, 0),
  totalBodySlotBytes: results.reduce((sum, result) => sum + result.bodyBytes, 0),
  structureFamilies: Object.fromEntries(['cn', 'en'].map(language => [language, {
    prefix: (() => {
      const groups = shapeGroups(language, 'prefixShape');
      return { count: groups.length, largestGroups: groups.slice(0, 5).map(({ count, examples }) => ({ count, examples })) };
    })(),
    suffix: (() => {
      const groups = shapeGroups(language, 'suffixShape');
      return { count: groups.length, largestGroups: groups.slice(0, 5).map(({ count, examples }) => ({ count, examples })) };
    })(),
  }])),
  largestFamilyVariation: Object.fromEntries(['cn', 'en'].map(language => [language, {
    prefix: familyVariation(language, 'prefixShape'),
    suffix: familyVariation(language, 'suffixShape'),
    suffixBreakdownWithinPrefixFamily: suffixBreakdown(language),
  }])),
  failures: 0,
}, null, 2)}\n`);
