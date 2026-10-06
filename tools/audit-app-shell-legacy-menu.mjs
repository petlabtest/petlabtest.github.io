import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appShellVersion = homepage.match(/assets\/js\/app-shell\.js\?v=([^"']+)/)?.[1];
if (!appShellVersion) throw new Error('Could not determine the current AppShell version from index.html');
const failures = { appShellOrder: [], headerHost: [], legacyMenuPresent: [], cacheVersion: [] };

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ['.git', 'components', 'Replicate'].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(file));
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.html') files.push(file);
  }
  return files;
}

const pages = walk(root);
const legacyMenuPages = pages.filter(file => {
  const html = fs.readFileSync(file, 'utf8');
  const legacyIndex = html.indexOf('assets/js/root/002.js');
  if (legacyIndex < 0) return false;
  const appShellIndex = html.indexOf('assets/js/app-shell.js');
  const page = path.relative(root, file).split(path.sep).join('/');
  if (appShellIndex < 0 || appShellIndex > legacyIndex) failures.appShellOrder.push(page);
  if (!/id=["']petlab-header["']|data-component=["']header["']/.test(html)) failures.headerHost.push(page);
  if (html.includes('button--menu')) failures.legacyMenuPresent.push(page);
  if (!html.includes(`app-shell.js?v=${appShellVersion}`)) failures.cacheVersion.push(page);
  return true;
});

const source = fs.readFileSync(path.join(root, 'assets/js/app-shell.js'), 'utf8');
const guardPresent = source.includes("function isolateLegacyPrimaryMenu()")
  && source.includes("document.querySelector('.button--menu')")
  && source.includes('behavior.attach = function () {};')
  && source.includes('isolateLegacyPrimaryMenu();');

const report = {
  pagesWithLegacyBundle: legacyMenuPages.length,
  appShellVersion,
  guardPresent,
  checks: {
    appShellBeforeLegacyBundle: failures.appShellOrder.length === 0,
    appShellHeaderHost: failures.headerHost.length === 0,
    noLightDomLegacyMenu: failures.legacyMenuPresent.length === 0,
    cacheVersionUpdated: failures.cacheVersion.length === 0,
  },
  failures,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!guardPresent || Object.values(failures).some(items => items.length)) process.exitCode = 1;
