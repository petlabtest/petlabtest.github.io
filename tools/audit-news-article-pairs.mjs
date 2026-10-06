import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'News/List');
const expectedPrefixExceptions = new Set(['News-page8-cn.html']);
const expectedTailExceptions = new Set([
  'News-index1-cn.html',
  'News-index2-cn.html',
  'News-index3-cn.html',
  'News-index4-cn.html',
]);

function mainMarkup(file) {
  const html = fs.readFileSync(path.join(directory, file), 'utf8');
  return html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '';
}

function tagSignature(markup) {
  return [...markup.matchAll(/<\/?([a-z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/gi)]
    .map(([source, tag]) => {
      if (source.startsWith('</')) return `/${tag.toLowerCase()}`;
      const classes = source.match(/\bclass=["']([^"']*)["']/i)?.[1]
        ?.trim().split(/\s+/).filter(Boolean).sort().join('.') || '';
      const selfClosing = /\/>$/.test(source) ? '/' : '';
      return `${tag.toLowerCase()}${classes ? `.${classes}` : ''}${selfClosing}`;
    })
    .join('|');
}

const chinesePages = fs.readdirSync(directory)
  .filter(file => file.endsWith('-cn.html'))
  .sort();
const pairs = [];
const missingEnglish = [];

for (const chinese of chinesePages) {
  const english = chinese.replace(/-cn\.html$/, '-en.html');
  if (!fs.existsSync(path.join(directory, english))) {
    missingEnglish.push(chinese);
    continue;
  }

  const cnMain = mainMarkup(chinese);
  const enMain = mainMarkup(english);
  const cnBodyStart = cnMain.indexOf('news-full__body');
  const enBodyStart = enMain.indexOf('news-full__body');
  const cnInfoStart = cnMain.indexOf('news-full__info', cnBodyStart);
  const enInfoStart = enMain.indexOf('news-full__info', enBodyStart);

  pairs.push({
    chinese,
    english,
    prefixMatches: cnBodyStart >= 0 && enBodyStart >= 0
      && tagSignature(cnMain.slice(0, cnBodyStart)) === tagSignature(enMain.slice(0, enBodyStart)),
    relatedTailMatches: cnInfoStart >= 0 && enInfoStart >= 0
      && tagSignature(cnMain.slice(cnInfoStart)) === tagSignature(enMain.slice(enInfoStart)),
  });
}

const prefixExceptions = pairs.filter(pair => !pair.prefixMatches).map(pair => pair.chinese);
const tailExceptions = pairs.filter(pair => !pair.relatedTailMatches).map(pair => pair.chinese);
const report = {
  pairs: pairs.length,
  missingEnglish,
  sharedArticleShellPairs: pairs.filter(pair => pair.prefixMatches).length,
  sharedRelatedMetadataTailPairs: pairs.filter(pair => pair.relatedTailMatches).length,
  expectedPrefixExceptions: [...expectedPrefixExceptions],
  expectedTailExceptions: [...expectedTailExceptions],
  prefixExceptions,
  tailExceptions,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (missingEnglish.length
  || pairs.length !== 87
  || prefixExceptions.some(file => !expectedPrefixExceptions.has(file))
  || [...expectedPrefixExceptions].some(file => !prefixExceptions.includes(file))
  || tailExceptions.some(file => !expectedTailExceptions.has(file))
  || [...expectedTailExceptions].some(file => !tailExceptions.includes(file))) process.exitCode = 1;
