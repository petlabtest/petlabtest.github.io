import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapFile = process.argv[2];
if (!mapFile) throw new Error('Usage: node tools/rewrite-asset-references.mjs <asset-path-map.json>');

const mapping = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
const replacements = new Map(Object.entries(mapping).map(([from, to]) => [from.toLowerCase(), to]));
const pattern = new RegExp(
  Object.keys(mapping)
    .sort((a, b) => b.length - a.length)
    .map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
  'gi',
);
const textExtensions = new Set(['.html', '.css', '.js', '.mjs', '.json', '.webmanifest', '.svg', '.md']);

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

let changed = 0;
let replacementsMade = 0;
for (const file of walk(root)) {
  if (path.resolve(file) === path.resolve(mapFile)) continue;
  if (!textExtensions.has(path.extname(file).toLowerCase())) continue;
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }
  const updated = content.replace(pattern, match => {
    replacementsMade += 1;
    return replacements.get(match.toLowerCase());
  });
  if (updated !== content) {
    fs.writeFileSync(file, updated);
    changed += 1;
  }
}

process.stdout.write(`${JSON.stringify({ changedFiles: changed, replacements: replacementsMade }, null, 2)}\n`);
