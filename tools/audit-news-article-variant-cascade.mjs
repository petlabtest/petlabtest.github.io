import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excludedDirectories = new Set(['.git', 'components', 'Replicate']);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) return [];
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(file);
    return entry.isFile() && path.extname(entry.name).toLowerCase() === '.html' ? [file] : [];
  });
}

function classesIn(markup) {
  return new Set([...markup.matchAll(/\bclass=["']([^"']*)["']/gi)]
    .flatMap(([, value]) => value.trim().split(/\s+/).filter(Boolean)));
}

function figcaptionParents(markup) {
  const stack = [];
  const parents = [];
  const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const tokens = /<!--(?:[\s\S]*?)-->|<\/?[a-z][\w:-]*(?:\s[^<>]*?)?\s*\/?>/gi;
  for (const [token] of markup.matchAll(tokens)) {
    if (token.startsWith('<!--')) continue;
    const closing = /^<\//.test(token);
    const tag = /^<\/?([\w:-]+)/.exec(token)?.[1]?.toLowerCase();
    if (!tag) continue;
    if (closing) {
      const index = stack.findLastIndex(element => element.tag === tag);
      if (index !== -1) stack.length = index;
      continue;
    }
    if (tag === 'figcaption') {
      const figure = stack.findLast(element => element.tag === 'figure');
      parents.push(figure?.classes.has('paper-figure') ? 'paper-figure' : figure ? 'other-figure' : 'no-figure');
    }
    if (!voidElements.has(tag) && !/\/\s*>$/.test(token)) {
      stack.push({ tag, classes: classesIn(token) });
    }
  }
  return parents;
}

function ruleBody(css, selector) {
  const position = css.indexOf(selector);
  assert.notEqual(position, -1, `missing selector: ${selector}`);
  const open = css.indexOf('{', position + selector.length);
  const close = css.indexOf('}', open + 1);
  assert.ok(open !== -1 && close !== -1, `malformed rule: ${selector}`);
  return css.slice(open + 1, close).trim().split(/\s*;\s*/).filter(Boolean);
}

function classSpecificity(selector) {
  const scoped = selector.replace(/:where\([^)]*\)/g, '');
  return (scoped.match(/\.[\w-]+/g) || []).length;
}

const pages = walk(root).sort().flatMap(file => {
  const html = fs.readFileSync(file, 'utf8');
  const main = /<main\b([^>]*)>([\s\S]*?)<\/main>/i.exec(html);
  if (!main) return [];
  const type = /\barticle-page--(feature|science)\b/.exec(main[1])?.[1];
  if (!type) return [];
  const links = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)]
    .map(([tag]) => /\bhref=["']([^"']+)/i.exec(tag)?.[1]?.split(/[?#]/, 1)[0] || '');
  const bodyStart = main[2].search(/<div\b(?=[^>]*\bclass=["'][^"']*\bnews-full__body\b)[^>]*>/i);
  assert.notEqual(bodyStart, -1, `${path.relative(root, file)}: article body missing`);
  return [{
    file: path.relative(root, file).split(path.sep).join('/'),
    type,
    links,
    classes: classesIn(main[2]),
    main: main[2],
    figcaptionParents: figcaptionParents(main[2]),
  }];
});

const feature = pages.filter(page => page.type === 'feature');
const science = pages.filter(page => page.type === 'science');
assert.equal(feature.length, 14, 'feature ArticlePage count changed');
assert.equal(science.length, 10, 'science ArticlePage count changed');
for (const page of feature) {
  const kepu = page.links.findIndex(href => href.endsWith('/news/kepu-article.css'));
  const featureCss = page.links.findIndex(href => href.endsWith('/news/index-feature.css'));
  assert.ok(kepu !== -1 && featureCss > kepu, `${page.file}: feature stylesheet order changed`);
}
for (const page of science) {
  assert.ok(page.links.some(href => href.endsWith('/news/kepu-article.css')), `${page.file}: kepu stylesheet missing`);
  assert.ok(!page.links.some(href => href.endsWith('/news/index-feature.css')), `${page.file}: feature stylesheet unexpectedly loaded`);
}

const countPages = (cohort, className) => cohort.filter(page => page.classes.has(className)).length;
const countElements = (cohort, tagName) => cohort.filter(page => new RegExp(`<${tagName}\\b`, 'i').test(page.main)).length;
const featureCss = fs.readFileSync(path.join(root, 'assets/css/news/index-feature.css'), 'utf8');
const kepuCss = fs.readFileSync(path.join(root, 'assets/css/news/kepu-article.css'), 'utf8');
const articleCss = fs.readFileSync(path.join(root, 'assets/css/news/article-page.css'), 'utf8');
const featureCaptionRule = ruleBody(featureCss, '.feature-article figcaption');
const kepuCaptionSelector = ':where(.article-page) .news-full__body .paper-figure figcaption';
assert.equal(countPages(feature, 'science-note'), 8, 'feature science-note coverage changed');
assert.equal(countPages(science, 'science-note'), 10, 'science science-note coverage changed');
assert.equal(countPages(feature, 'paper-figure'), 14, 'feature paper-figure coverage changed');
assert.equal(countPages(science, 'paper-figure'), 10, 'science paper-figure coverage changed');
assert.equal(countPages(feature, 'application-list'), 0, 'feature application-list coverage changed');
assert.equal(countPages(science, 'application-list'), 8, 'science application-list coverage changed');
assert.doesNotMatch(featureCss, /\.feature-article\s+\.application-list/, 'feature stylesheet should not own the science-only application-list component');
assert.match(kepuCss, /:where\(\.article-page\) \.news-full__body \.application-list\s*\{/, 'shared science layer must own application-list styling');
assert.equal(countPages(feature, 'paper-figure--floated'), 0, 'feature floated figure coverage changed');
assert.equal(countPages(science, 'paper-figure--floated'), 10, 'science floated figure coverage changed');
const featureCaptionParents = feature.flatMap(page => page.figcaptionParents);
assert.ok(featureCaptionParents.length > 0, 'no feature figcaptions found');
assert.ok(featureCaptionParents.every(parent => parent === 'paper-figure'), 'feature figcaption exists outside .paper-figure; reassess feature caption rule before removing it');
assert.deepEqual(featureCaptionRule, ['font-style: normal'], 'feature figcaption should retain only declarations not supplied by the higher-specificity shared caption rule');
assert.ok(classSpecificity(kepuCaptionSelector) > classSpecificity('.feature-article figcaption'), 'shared paper-figure caption selector must remain more specific than feature generic caption selector');
for (const page of [...feature, ...science]) {
  assert.ok(page.links.some(href => href.endsWith('/news/article-page.css')), `${page.file}: shared ArticlePage stylesheet missing`);
}
const summary = {
  featurePages: feature.length,
  sciencePages: science.length,
  featureAfterKepuOnAllFeaturePages: true,
  componentPages: {
    scienceNote: { feature: countPages(feature, 'science-note'), science: countPages(science, 'science-note') },
    paperFigure: { feature: countPages(feature, 'paper-figure'), science: countPages(science, 'paper-figure') },
    floatedPaperFigure: { feature: countPages(feature, 'paper-figure--floated'), science: countPages(science, 'paper-figure--floated') },
    figcaption: { feature: countElements(feature, 'figcaption'), science: countElements(science, 'figcaption') },
    featureFigcaptionParents: Object.fromEntries([...new Set(featureCaptionParents)].map(parent => [parent, featureCaptionParents.filter(value => value === parent).length])),
    applicationList: { feature: countPages(feature, 'application-list'), science: countPages(science, 'application-list') },
  },
  competingRules: {
    scienceNote: {
      kepu: ruleBody(kepuCss, ':where(.article-page) .news-full__body .science-note'),
      feature: ruleBody(featureCss, '.feature-article .science-note'),
    },
    paperFigure: {
      kepu: ruleBody(kepuCss, ':where(.article-page) .news-full__body .paper-figure'),
      feature: ruleBody(featureCss, '.feature-article .paper-figure'),
    },
    floatedPaperFigure: {
      sharedArticlePage: ruleBody(articleCss, '.article-page .node--type-news.node--view-mode-full .news-full__body .paper-figure--floated'),
    },
    figcaption: {
      kepu: ruleBody(kepuCss, ':where(.article-page) .news-full__body .paper-figure figcaption'),
      feature: featureCaptionRule,
      classSpecificity: {
        kepu: classSpecificity(kepuCaptionSelector),
        feature: classSpecificity('.feature-article figcaption'),
      },
    },
    applicationList: {
      kepu: ruleBody(kepuCss, ':where(.article-page) .news-full__body .application-list'),
      feature: [],
    },
  },
  limitations: 'Static selector and declaration inventory only; not computed-style or visual verification.',
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
