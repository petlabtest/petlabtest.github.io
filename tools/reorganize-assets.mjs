import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = path.join(root, 'assets');
const apply = process.argv.includes('--apply');
const textExtensions = new Set(['.html', '.css', '.js', '.mjs', '.json', '.webmanifest', '.svg', '.md']);
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.webp', '.avif']);
const videoExtensions = new Set(['.mp4', '.webm', '.mov', '.m4v']);
const fontExtensions = new Set(['.woff', '.woff2', '.ttf', '.otf', '.eot']);
const dataExtensions = new Set(['.json', '.webmanifest', '.bin']);

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

function posix(value) { return value.split(path.sep).join('/'); }
function assetRelative(file) { return posix(path.relative(assetsRoot, file)); }
function siteRelative(file) { return posix(path.relative(root, file)); }
function hashFile(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function withoutTypeDirectory(relative, type) {
  const parts = relative.split('/');
  if (parts[0] === type) return relative;
  const file = parts.pop();
  const filtered = parts.filter(part => part.toLowerCase() !== type);
  return [type, ...filtered, file].join('/');
}

function preferredDestination(relative) {
  const extension = path.extname(relative).toLowerCase();
  if (extension === '.css') return withoutTypeDirectory(relative, 'css');
  if (extension === '.js') return withoutTypeDirectory(relative, 'js');
  if (imageExtensions.has(extension)) {
    if (relative.startsWith('pic/') || relative.startsWith('favicons/')) return relative;
    return `pic/${relative}`;
  }
  if (videoExtensions.has(extension)) return relative.startsWith('video/') ? relative : `video/${relative}`;
  if (fontExtensions.has(extension)) return relative.startsWith('fonts/') ? relative : `fonts/${relative}`;
  if (dataExtensions.has(extension)) return relative.startsWith('data/') ? relative : `data/${relative}`;
  return relative.startsWith('misc/') ? relative : `misc/${relative}`;
}

const allFiles = walk(root);
const assetFiles = allFiles.filter(file => file.startsWith(`${assetsRoot}${path.sep}`));
const removableMetadata = assetFiles.filter(file => path.basename(file) === '.DS_Store' || file.endsWith('.bak'));
const candidates = assetFiles.filter(file => !removableMetadata.includes(file));
const textFiles = allFiles.filter(file => textExtensions.has(path.extname(file).toLowerCase()));
const textCache = new Map();
for (const file of textFiles) {
  try { textCache.set(file, fs.readFileSync(file, 'utf8')); } catch {}
}

const literalReferenceCounts = new Map();
for (const file of candidates) {
  const needle = `assets/${assetRelative(file)}`;
  let count = 0;
  for (const content of textCache.values()) {
    let index = 0;
    while ((index = content.indexOf(needle, index)) >= 0) { count += 1; index += needle.length; }
  }
  literalReferenceCounts.set(file, count);
}

function alreadyCategorized(file) {
  const rel = assetRelative(file);
  const ext = path.extname(rel).toLowerCase();
  if (ext === '.css') return rel.startsWith('css/');
  if (ext === '.js') return rel.startsWith('js/');
  if (imageExtensions.has(ext)) return rel.startsWith('pic/') || rel.startsWith('favicons/');
  if (videoExtensions.has(ext)) return rel.startsWith('video/');
  if (fontExtensions.has(ext)) return rel.startsWith('fonts/');
  if (dataExtensions.has(ext)) return rel.startsWith('data/');
  return rel.startsWith('misc/');
}

function canonicalScore(file) {
  const rel = assetRelative(file);
  let score = (literalReferenceCounts.get(file) || 0) * 1000;
  if (alreadyCategorized(file)) score += 100;
  if (/\b(?:backup|copy|test|old)\b/i.test(rel)) score -= 20;
  score -= rel.length / 1000;
  return score;
}

const groups = new Map();
for (const file of candidates) {
  const hash = hashFile(file);
  if (!groups.has(hash)) groups.set(hash, []);
  groups.get(hash).push(file);
}

const destinationHashes = new Map();
const mapping = new Map();
const canonicalFiles = new Set();
const duplicateFiles = new Set();

function reserveDestination(preferred, hash) {
  let candidate = preferred;
  let suffix = 1;
  while (destinationHashes.has(candidate) && destinationHashes.get(candidate) !== hash) {
    const extension = path.extname(preferred);
    const stem = preferred.slice(0, -extension.length);
    candidate = `${stem}--${hash.slice(0, 8)}${suffix > 1 ? `-${suffix}` : ''}${extension}`;
    suffix += 1;
  }
  destinationHashes.set(candidate, hash);
  return candidate;
}

for (const [hash, group] of groups) {
  const ordered = [...group].sort((a, b) => canonicalScore(b) - canonicalScore(a) || assetRelative(a).localeCompare(assetRelative(b)));
  const canonical = ordered[0];
  const destination = reserveDestination(preferredDestination(assetRelative(canonical)), hash);
  canonicalFiles.add(canonical);
  for (const file of ordered) {
    mapping.set(file, path.join(assetsRoot, ...destination.split('/')));
    if (file !== canonical) duplicateFiles.add(file);
  }
}

const oldByRelative = new Map(candidates.map(file => [assetRelative(file), file]));
const directReplacement = new Map();
for (const [oldFile, newFile] of mapping) directReplacement.set(`assets/${assetRelative(oldFile)}`, `assets/${assetRelative(newFile)}`);
const directReplacementLower = new Map([...directReplacement].map(([from, to]) => [from.toLowerCase(), to]));
const directPattern = new RegExp([...directReplacement.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|'), 'gi');

function splitSuffix(uri) {
  const match = uri.match(/^([^?#]*)([?#].*)?$/s);
  return { pathname: match?.[1] || uri, suffix: match?.[2] || '' };
}

function resolveOldAsset(fromFile, uriPath) {
  if (!uriPath || /^(?:data:|https?:|mailto:|tel:|javascript:|#|\/\/)/i.test(uriPath)) return null;
  const attempts = [];
  if (uriPath.startsWith('/Website/')) attempts.push(path.join(root, uriPath.slice('/Website/'.length)));
  else if (uriPath.startsWith('/')) attempts.push(path.join(root, uriPath.slice(1)));
  else {
    attempts.push(path.resolve(path.dirname(fromFile), uriPath));
    const marker = uriPath.indexOf('assets/');
    if (marker >= 0) attempts.push(path.join(root, uriPath.slice(marker)));
  }
  return attempts.find(candidate => mapping.has(path.resolve(candidate))) || null;
}

function rewriteUri(raw, oldTextFile, newTextFile) {
  const leading = raw.match(/^\s*/)?.[0] || '';
  const trailing = raw.match(/\s*$/)?.[0] || '';
  const trimmed = raw.trim();
  const { pathname: uriPath, suffix } = splitSuffix(trimmed);
  const oldTarget = resolveOldAsset(oldTextFile, uriPath);
  if (!oldTarget) return raw.replace(directPattern, match => directReplacementLower.get(match.toLowerCase()));
  const newTarget = mapping.get(path.resolve(oldTarget));
  const oldRel = assetRelative(path.resolve(oldTarget));
  const newRel = assetRelative(newTarget);
  let rewritten;
  const marker = uriPath.indexOf('assets/');
  if (marker >= 0) rewritten = `${uriPath.slice(0, marker)}assets/${newRel}`;
  else if (uriPath.startsWith('/Website/')) rewritten = `/Website/assets/${newRel}`;
  else {
    rewritten = posix(path.relative(path.dirname(newTextFile), newTarget));
    if (!rewritten.startsWith('.') && uriPath.startsWith('./')) rewritten = `./${rewritten}`;
  }
  if (oldRel === newRel && oldTextFile === newTextFile) return raw;
  return `${leading}${rewritten}${suffix}${trailing}`;
}

function rewriteContent(content, oldTextFile, newTextFile) {
  let updated = content.replace(/\b(src|href|poster|data-src|data-background|srcset)(\s*=\s*)(["'])(.*?)\3/gis, (whole, attr, equals, quote, value) => {
    const rewritten = attr.toLowerCase() === 'srcset'
      ? value.split(',').map(entry => {
          const match = entry.match(/^(\s*)(.*?)(\s+\d+(?:\.\d+)?[wx])?(\s*)$/i);
          return `${match[1]}${rewriteUri(match[2], oldTextFile, newTextFile)}${match[3] || ''}${match[4]}`;
        }).join(',')
      : rewriteUri(value, oldTextFile, newTextFile);
    return `${attr}${equals}${quote}${rewritten}${quote}`;
  });
  updated = updated.replace(/url\(\s*(["']?)(.*?)\1\s*\)/gs, (whole, quote, value) => `url(${quote}${rewriteUri(value, oldTextFile, newTextFile)}${quote})`);
  updated = updated.replace(directPattern, match => directReplacementLower.get(match.toLowerCase()));
  return updated;
}

const rewrites = [];
for (const [oldTextFile, content] of textCache) {
  const newTextFile = mapping.get(oldTextFile) || oldTextFile;
  const updated = rewriteContent(content, oldTextFile, newTextFile);
  if (updated !== content) rewrites.push({ file: oldTextFile, content: updated });
}

const moves = [...canonicalFiles].map(file => ({ from: file, to: mapping.get(file) })).filter(move => move.from !== move.to);
const duplicateBytes = [...duplicateFiles].reduce((sum, file) => sum + fs.statSync(file).size, 0);
const metadataBytes = removableMetadata.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const report = {
  mode: apply ? 'apply' : 'dry-run',
  assetsBefore: assetFiles.length,
  canonicalAssets: canonicalFiles.size,
  duplicateFilesRemoved: duplicateFiles.size,
  duplicateBytesRemoved: duplicateBytes,
  metadataFilesRemoved: removableMetadata.length,
  metadataBytesRemoved: metadataBytes,
  filesMoved: moves.length,
  textFilesRewritten: rewrites.length,
  destinationTopLevels: [...new Set([...mapping.values()].map(file => assetRelative(file).split('/')[0]))].sort(),
};

if (apply) {
  for (const rewrite of rewrites) fs.writeFileSync(rewrite.file, rewrite.content);
  const stageRoot = fs.mkdtempSync('/private/tmp/dpetlab-assets-stage-');
  const staged = new Map();
  let stageIndex = 0;
  for (const file of candidates) {
    const stageFile = path.join(stageRoot, `${String(stageIndex).padStart(5, '0')}-${path.basename(file)}`);
    stageIndex += 1;
    fs.renameSync(file, stageFile);
    staged.set(file, stageFile);
  }
  for (const canonical of canonicalFiles) {
    const destination = mapping.get(canonical);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite ${siteRelative(destination)}`);
    fs.renameSync(staged.get(canonical), destination);
  }
  for (const duplicate of duplicateFiles) {
    const stageFile = staged.get(duplicate);
    if (stageFile && fs.existsSync(stageFile)) fs.unlinkSync(stageFile);
  }
  fs.rmdirSync(stageRoot);
  for (const file of removableMetadata) if (fs.existsSync(file)) fs.unlinkSync(file);
  const directories = walkDirectories(assetsRoot).sort((a, b) => b.length - a.length);
  for (const directory of directories) {
    if (directory !== assetsRoot && fs.existsSync(directory) && fs.readdirSync(directory).length === 0) fs.rmdirSync(directory);
  }
  fs.writeFileSync('/private/tmp/dpetlab-asset-path-map.json', JSON.stringify(Object.fromEntries([...mapping].map(([from, to]) => [siteRelative(from), siteRelative(to)])), null, 2));
}

function walkDirectories(directory) {
  const directories = [directory];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) directories.push(...walkDirectories(path.join(directory, entry.name)));
  }
  return directories;
}

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
