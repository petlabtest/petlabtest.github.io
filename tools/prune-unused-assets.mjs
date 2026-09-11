import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = path.join(root, 'assets');
const reportFile = process.argv[2];
const apply = process.argv.includes('--apply');
if (!reportFile) throw new Error('Usage: node tools/prune-unused-assets.mjs <audit-report.json> [--apply]');

const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
const targets = report.unreferencedFiles.map(relative => path.resolve(root, relative));
for (const target of targets) {
  if (!target.startsWith(`${assetsRoot}${path.sep}`)) throw new Error(`Unsafe target outside assets: ${target}`);
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) throw new Error(`Missing target: ${target}`);
}
const bytes = targets.reduce((sum, target) => sum + fs.statSync(target).size, 0);

if (apply) {
  for (const target of targets) fs.unlinkSync(target);
  for (const directory of walkDirectories(assetsRoot).sort((a, b) => b.length - a.length)) {
    if (directory !== assetsRoot && fs.existsSync(directory) && fs.readdirSync(directory).length === 0) fs.rmdirSync(directory);
  }
}

function walkDirectories(directory) {
  const directories = [directory];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) directories.push(...walkDirectories(path.join(directory, entry.name)));
  }
  return directories;
}

process.stdout.write(`${JSON.stringify({ mode: apply ? 'apply' : 'dry-run', files: targets.length, bytes }, null, 2)}\n`);
