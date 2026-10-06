import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/js/app-shell.js'), 'utf8');

function runGuard({ hasHeader = true, hasLegacyMenu = false } = {}) {
  let readyCallback;
  let fetchCalls = 0;
  const headerHost = { setAttribute() {}, classList: { add() {} } };
  const behavior = { attach() {} };
  const originalAttach = behavior.attach;
  const document = {
    currentScript: { src: 'http://localhost/Research/example.html' },
    readyState: 'loading',
    documentElement: { lang: 'en' },
    addEventListener(name, callback) { if (name === 'DOMContentLoaded') readyCallback = callback; },
    querySelector(selector) {
      if (selector === '.button--menu') return hasLegacyMenu ? {} : null;
      if (selector.includes('#petlab-header')) return hasHeader ? headerHost : null;
      return null;
    },
  };
  const window = { Drupal: { behaviors: { menuPrimary: behavior } } };
  vm.runInNewContext(source, {
    document,
    window,
    location: { pathname: '/Research/example.html', href: 'http://localhost/Research/example.html' },
    fetch() { fetchCalls++; return new Promise(() => {}); },
    URL,
  });
  readyCallback();
  return { behavior, originalAttach, fetchCalls };
}

const appShellPage = runGuard();
assert.notEqual(appShellPage.behavior.attach, appShellPage.originalAttach, 'AppShell page without a Light DOM legacy menu should isolate the obsolete behavior');
assert.equal(appShellPage.fetchCalls, 3, 'AppShell should load site CSS, shared header CSS, and the localized header CSS after installing the guard');

const legacyMenuPage = runGuard({ hasLegacyMenu: true });
assert.equal(legacyMenuPage.behavior.attach, legacyMenuPage.originalAttach, 'a real Light DOM legacy menu must retain its Drupal behavior');

const nonAppShellPage = runGuard({ hasHeader: false });
assert.equal(nonAppShellPage.behavior.attach, nonAppShellPage.originalAttach, 'pages without an AppShell header must retain their Drupal behavior');

process.stdout.write('PASS: AppShell without a legacy menu isolates only the obsolete attach; real legacy menus and non-AppShell pages retain their original behavior.\n');
