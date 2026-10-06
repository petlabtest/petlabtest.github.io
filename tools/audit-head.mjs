import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(['.git', 'components', 'Replicate']);

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excluded.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(file));
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.html') files.push(file);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

const failures = {
  doctype: [], language: [], headMarkers: [], headVersion: [], title: [],
  description: [], canonical: [], appShellCss: [], appShellJs: [],
  appShellHeaderReservation: [], duplicateStylesheets: [], missingLocalStylesheets: [],
};
const pages = walk(root);
const versions = new Set();
const appShellCss = fs.readFileSync(path.join(root, 'assets/css/app-shell.css'), 'utf8');
const sharedSiteCss = fs.readFileSync(path.join(root, 'assets/css/site.css'), 'utf8');
const headerReservations = [
  /#petlab-header\s*\{\s*min-height:\s*130px;/,
  /@media\s*\(max-width:\s*1250px\)\s*and\s*\(min-width:\s*1101px\)\s*\{\s*#petlab-header\s*\{\s*min-height:\s*120px;/,
  /@media\s*\(max-width:\s*1100px\)\s*\{\s*#petlab-header\s*\{\s*min-height:\s*82px;/,
  /@media\s*\(max-width:\s*700px\)\s*\{\s*#petlab-header\s*\{\s*min-height:\s*74px;/,
];
const sharedHeaderHeights = [
  /@media\s*\(min-width:\s*1251px\)[\s\S]*?\.lbl-header\s+\.header-shell\s*\{\s*min-height:\s*130px;\s*height:\s*130px;/,
  /@media\s*\(max-width:\s*1250px\)\s*and\s*\(min-width:\s*1101px\)[\s\S]*?\.lbl-header\s+\.header-shell\s*\{\s*min-height:\s*120px;\s*height:\s*120px;/,
  /@media\s*\(max-width:\s*1100px\)[\s\S]*?\.lbl-header\s+\.header-shell\s*\{[^}]*min-height:\s*82px;\s*height:\s*82px;/,
  /@media\(max-width:700px\)\{\s*\.lbl-header \.header-shell\{[^}]*height:74px;min-height:74px\}/,
];
if (!headerReservations.every(pattern => pattern.test(appShellCss))
    || !sharedHeaderHeights.every(pattern => pattern.test(sharedSiteCss))) {
  failures.appShellHeaderReservation.push('assets/css/app-shell.css');
}

for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const head = (html.match(/<head\b[\s\S]*?<\/head>/i) || [''])[0];
  const page = relative(file);
  const record = key => failures[key].push(page);
  if (!/^\s*<!doctype html>/i.test(html)) record('doctype');
  if (!/<html\b[^>]*\blang\s*=/i.test(html)) record('language');
  if ((head.match(/PETLAB:HEAD:START/g) || []).length !== 1
      || (head.match(/PETLAB:HEAD:END/g) || []).length !== 1) record('headMarkers');
  if ((head.match(/name=["']petlab-head-version["']/gi) || []).length !== 1) record('headVersion');
  const version = (head.match(/name=["']petlab-head-version["'][^>]*content=["']([^"']+)/i) || [])[1];
  if (version) versions.add(version);
  if (!/<title\b[^>]*>\s*[^<]+\s*<\/title>/i.test(head)) record('title');
  if (!/<meta\b[^>]*name=["']description["'][^>]*content=["'][^"']+|<meta\b[^>]*content=["'][^"']+[^>]*name=["']description["']/i.test(head)) record('description');
  if ((head.match(/<link\b[^>]*rel=["']canonical["']/gi) || []).length !== 1) record('canonical');

  const markerStart = head.indexOf('<!-- PETLAB:HEAD:START -->');
  const markerEnd = head.indexOf('<!-- PETLAB:HEAD:END -->');
  const managedHead = markerStart >= 0 && markerEnd > markerStart
    ? head.slice(markerStart, markerEnd)
    : '';
  for (const [key, uri] of [
    ['appShellCss', 'assets/css/app-shell.css'],
    ['appShellJs', 'assets/js/app-shell.js'],
  ]) {
    const matches = [...head.matchAll(/<(?:link|script)\b[^>]*>/gi)]
      .map(match => match[0]).filter(tag => tag.includes(uri));
    if (matches.length !== 1 || !managedHead.includes(uri)) record(key);
  }

  const stylesheetUris = [];
  for (const match of head.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\brel=["']stylesheet["']/i.test(tag)) continue;
    const href = (tag.match(/\bhref=["']([^"']+)/i) || [])[1];
    if (!href) continue;
    const clean = href.split(/[?#]/, 1)[0];
    if (stylesheetUris.includes(clean)) record('duplicateStylesheets');
    stylesheetUris.push(clean);
    if (!/^(?:https?:)?\/\//i.test(clean) && !fs.existsSync(path.resolve(path.dirname(file), clean))) {
      failures.missingLocalStylesheets.push(`${page} -> ${href}`);
    }
  }
}

const report = {
  contentPages: pages.length,
  headVersions: [...versions].sort(),
  checks: {
    ...Object.fromEntries(Object.entries(failures).map(([key, values]) => [key, values.length === 0])),
    singleHeadVersion: versions.size === 1,
  },
  failures,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (Object.values(failures).some(values => values.length)) process.exitCode = 1;
