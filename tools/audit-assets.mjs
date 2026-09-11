import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = path.join(root, 'assets');
const runtimeTextExtensions = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.svg']);
const assetExtensions = new Set([
  '.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico',
  '.mp4', '.webm', '.mov', '.woff', '.woff2', '.ttf', '.otf',
  '.json', '.webmanifest', '.bin',
]);

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function cleanUri(value) {
  let uri = value.trim().replaceAll('&amp;', '&');
  if (!uri || /^(?:data:|https?:|mailto:|tel:|javascript:|#|\/\/)/i.test(uri)) return null;
  uri = uri.replace(/[?#].*$/, '').trim();
  try { uri = decodeURIComponent(uri); } catch {}
  return uri || null;
}

function candidateUris(content) {
  const found = new Set();
  const add = raw => {
    for (let part of raw.split(/\s*,\s*/)) {
      part = part.trim().replace(/\s+\d+(?:\.\d+)?[wx]$/i, '');
      const uri = cleanUri(part);
      if (uri) found.add(uri);
    }
  };

  for (const match of content.matchAll(/\b(?:src|href|poster|data-src|data-background|srcset)\s*=\s*(["'])(.*?)\1/gis)) add(match[2]);
  for (const match of content.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gs)) add(match[2]);
  for (const match of content.matchAll(/(["'`])([^"'`\n]+?)\1/g)) {
    const value = match[2].trim();
    if (value.includes('+') || value.includes('${') || value.includes('=>')) continue;
    const withoutQuery = value.replace(/[?#].*$/, '');
    if (value.includes('assets/') || assetExtensions.has(path.extname(withoutQuery).toLowerCase())) add(value);
  }
  return [...found];
}

function resolveReference(fromFile, uri) {
  const attempts = [];
  if (uri.startsWith('/Website/')) attempts.push(path.join(root, uri.slice('/Website/'.length)));
  else if (uri.startsWith('/')) attempts.push(path.join(root, uri.slice(1)));
  else {
    attempts.push(path.resolve(path.dirname(fromFile), uri));
    if (uri.startsWith('assets/')) attempts.push(path.join(root, uri));
    const marker = uri.indexOf('assets/');
    if (marker >= 0) attempts.push(path.join(root, uri.slice(marker)));
  }
  return attempts.find(candidate => fs.existsSync(candidate)) || attempts[0] || null;
}

const allFiles = walk(root);
const assetFiles = allFiles.filter(file => file.startsWith(`${assetsRoot}${path.sep}`));
const assetByKey = new Map(assetFiles.map(file => [path.resolve(file).toLowerCase(), file]));
const sourceRootExtensions = new Set(['.html', '.js', '.mjs', '.json', '.webmanifest']);
const roots = allFiles.filter(file => !file.startsWith(`${assetsRoot}${path.sep}`) && sourceRootExtensions.has(path.extname(file).toLowerCase()));
const used = new Set();
const missing = new Map();
const queue = [...roots];
const scanned = new Set();

while (queue.length) {
  const file = queue.shift();
  if (scanned.has(file) || !fs.existsSync(file)) continue;
  scanned.add(file);
  if (!runtimeTextExtensions.has(path.extname(file).toLowerCase())) continue;
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }
  for (const uri of candidateUris(content)) {
    const resolved = resolveReference(file, uri);
    if (!resolved) continue;
    const absolute = path.resolve(resolved);
    const actualAsset = assetByKey.get(absolute.toLowerCase());
    if (actualAsset) {
      if (!used.has(actualAsset)) {
        used.add(actualAsset);
        if (runtimeTextExtensions.has(path.extname(actualAsset).toLowerCase())) queue.push(actualAsset);
      }
    } else if ((uri.includes('assets/') || uri.startsWith('/Website/')) && assetExtensions.has(path.extname(uri).toLowerCase()) && !fs.existsSync(absolute)) {
      const key = `${relative(file)} -> ${uri}`;
      missing.set(key, { from: relative(file), uri });
    }
  }
}

const ignoredNames = new Set(['.DS_Store']);
const unreferenced = assetFiles.filter(file => !used.has(path.resolve(file)) && !ignoredNames.has(path.basename(file)));
const hashGroups = new Map();
for (const file of assetFiles.filter(file => !ignoredNames.has(path.basename(file)))) {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if (!hashGroups.has(hash)) hashGroups.set(hash, []);
  hashGroups.get(hash).push(file);
}
const duplicates = [...hashGroups.values()].filter(group => group.length > 1);
const duplicateBytes = duplicates.reduce((sum, group) => sum + fs.statSync(group[0]).size * (group.length - 1), 0);

function summarizeByTopLevel(files) {
  const summary = new Map();
  for (const file of files) {
    const rel = path.relative(assetsRoot, file).split(path.sep);
    const key = rel.length > 1 ? rel[0] : '(root)';
    const current = summary.get(key) || { files: 0, bytes: 0 };
    current.files += 1;
    current.bytes += fs.statSync(file).size;
    summary.set(key, current);
  }
  return Object.fromEntries([...summary].sort(([a], [b]) => a.localeCompare(b)));
}

const report = {
  htmlRoots: roots.length,
  totalAssets: assetFiles.length,
  referencedAssets: used.size,
  unreferencedAssets: unreferenced.length,
  unreferencedBytes: unreferenced.reduce((sum, file) => sum + fs.statSync(file).size, 0),
  duplicateGroups: duplicates.length,
  duplicateFiles: duplicates.reduce((sum, group) => sum + group.length, 0),
  duplicateReclaimableBytes: duplicateBytes,
  missingReferences: [...missing.values()],
  assetsByTopLevel: summarizeByTopLevel(assetFiles),
  unreferencedByTopLevel: summarizeByTopLevel(unreferenced),
  unreferencedFiles: unreferenced.map(relative).sort(),
  duplicateGroupsDetail: duplicates
    .sort((a, b) => fs.statSync(b[0]).size * (b.length - 1) - fs.statSync(a[0]).size * (a.length - 1))
    .map(group => ({ bytesEach: fs.statSync(group[0]).size, files: group.map(relative).sort() })),
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
