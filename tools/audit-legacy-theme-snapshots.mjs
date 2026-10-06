import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'assets', 'css');
const excluded = new Set(['.git', 'components', 'Replicate']);

function walk(directory, extension) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excluded.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(file, extension));
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === extension) files.push(file);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function localStylesheet(htmlFile, tag) {
  if (!/\brel=["'][^"']*\bstylesheet\b[^"']*["']/i.test(tag)) return null;
  const href = /\bhref=["']([^"']+)["']/i.exec(tag)?.[1];
  if (!href || /^(?:[a-z]+:|\/\/|#)/i.test(href)) return null;
  const clean = decodeURIComponent(href.replace(/[?#].*$/, '').replaceAll('&amp;', '&'));
  return path.resolve(path.dirname(htmlFile), clean);
}

function signature(css) {
  const normalized = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/url\(\s*(?:"[^"]*"|'[^']*'|[^)]*)\s*\)/gi, 'url(__URL__)')
    .replace(/\s+/g, ' ')
    .trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function resourceFootprint(file) {
  const css = fs.readFileSync(file, 'utf8');
  const urls = [...css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)]
    .map(match => (match[1] ?? match[2] ?? match[3] ?? '').trim());
  const uniqueUrls = [...new Set(urls)];
  const localUrls = uniqueUrls.filter(uri => uri && !/^(?:[a-z]+:|\/\/|#)/i.test(uri));
  const resolved = localUrls.map(uri => {
    const clean = decodeURIComponent(uri.replace(/[?#].*$/, ''));
    const target = clean.startsWith('/')
      ? path.resolve(root, clean.slice(1))
      : path.resolve(path.dirname(file), clean);
    return { uri, target, exists: fs.existsSync(target) };
  });
  const foundTargets = new Set(resolved.filter(item => item.exists).map(item => item.target));
  const missingTargets = new Set(resolved.filter(item => !item.exists).map(item => item.target));
  return {
    urlReferences: urls.length,
    uniqueUrls: uniqueUrls.length,
    uniqueLocalUrls: localUrls.length,
    uniqueLocalTargetsFound: foundTargets.size,
    uniqueLocalTargetsMissing: missingTargets.size,
    foundLocalTargets: [...foundTargets].map(target => relative(target)),
    unresolvedLocalUrls: resolved.filter(item => !item.exists).map(item => item.uri),
  };
}

const htmlFiles = walk(root, '.html');
const largeCss = walk(assets, '.css')
  .filter(file => fs.statSync(file).size >= 550_000 && fs.statSync(file).size <= 650_000);
const cssByPath = new Map(largeCss.map(file => [path.resolve(file), {
  file,
  bytes: fs.statSync(file).size,
  pages: [],
}]));
const pageStyleLinks = new Map();
const pageInlineResourceStyles = new Map();

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const links = [];
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\brel=["'][^"']*\bstylesheet\b[^"']*["']/i.test(tag)) continue;
    const rawHref = /\bhref=["']([^"']+)["']/i.exec(tag)?.[1] ?? '';
    const href = localStylesheet(htmlFile, tag);
    const record = href && cssByPath.get(href);
    links.push({ href: rawHref, resolved: href ? relative(href) : null, position: match.index });
    if (record) record.pages.push(relative(htmlFile));
  }
  pageStyleLinks.set(relative(htmlFile), links);
  const inlineStyles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .filter(match => /@font-face|url\s*\(/i.test(match[1]))
    .map(match => ({
      position: match.index,
      fontFaces: [...match[1].matchAll(/@font-face\s*\{([^}]*)\}/gi)].map(([, body]) => ({
        family: /font-family\s*:\s*([^;]+)/i.exec(body)?.[1]?.trim() ?? null,
        sources: [...body.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)]
          .map(url => (url[1] ?? url[2] ?? url[3] ?? '').trim()),
      })),
      otherUrls: [...match[1].matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)]
        .map(url => (url[1] ?? url[2] ?? url[3] ?? '').trim()),
    }));
  pageInlineResourceStyles.set(relative(htmlFile), inlineStyles);
}

const clusters = new Map();
for (const record of cssByPath.values()) {
  const key = signature(fs.readFileSync(record.file, 'utf8'));
  const cluster = clusters.get(key) || [];
  cluster.push(record);
  clusters.set(key, cluster);
}

const result = [...clusters.entries()].map(([hash, records]) => {
  const pageLoadCounts = new Map();
  for (const record of records) {
    for (const page of new Set(record.pages)) pageLoadCounts.set(page, (pageLoadCounts.get(page) || 0) + 1);
  }
  const multiLoadHistogram = {};
  for (const count of pageLoadCounts.values()) multiLoadHistogram[count] = (multiLoadHistogram[count] || 0) + 1;
  return {
    signature: hash.slice(0, 12),
    files: records.length,
    referencedFiles: records.filter(record => record.pages.length).length,
    unreferencedFiles: records.filter(record => !record.pages.length).map(record => relative(record.file)),
    pages: pageLoadCounts.size,
    multiLoadHistogram,
    paths: records.map(record => ({
      path: relative(record.file),
      bytes: record.bytes,
      pages: new Set(record.pages).size,
      resources: resourceFootprint(record.file),
    })),
  };
}).sort((a, b) => b.files - a.files || a.signature.localeCompare(b.signature));

const primaryCluster = [...clusters.values()].sort((a, b) => b.length - a.length)[0] || [];
const primaryPaths = new Set(primaryCluster.map(record => relative(record.file)));
const multipleSnapshotPages = [...pageStyleLinks.entries()].flatMap(([page, links]) => {
  const indices = links.flatMap((link, index) => primaryPaths.has(link.resolved) ? [index] : []);
  if (indices.length < 2) return [];
  return [{
    page,
    snapshotLoads: indices.map(index => ({ index, path: links[index].resolved })),
    cssBetweenSnapshotLoads: indices.slice(1).map((index, position) => links
      .slice(indices[position] + 1, index)
      .map(link => link.resolved ?? link.href)),
    inlineResourceStylesAfterLastSnapshot: (pageInlineResourceStyles.get(page) || [])
      .filter(style => style.position > links[indices.at(-1)].position)
      .map(({ fontFaces, otherUrls }) => ({ fontFaces, urls: otherUrls })),
  }];
});

process.stdout.write(`${JSON.stringify({ htmlFiles: htmlFiles.length, largeStylesheets: largeCss.length, clusters: result, multipleSnapshotPages }, null, 2)}\n`);
