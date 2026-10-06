import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const research = path.join(root, 'Research');

function normalized(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function externalScript(file) {
  const html = fs.readFileSync(path.join(research, file), 'utf8');
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(([, src]) => src);
}

const carouselSource = fs.readFileSync(path.join(root, 'assets/js/research/tech-project-carousel-static.js'), 'utf8');
const gridSource = fs.readFileSync(path.join(root, 'assets/js/research/tech-application-grid-static.js'), 'utf8');
const projectListSource = fs.readFileSync(path.join(root, 'assets/js/research/project-list-image-layout.js'), 'utf8');
const projectListCss = fs.readFileSync(path.join(root, 'assets/css/research/tech-project-list-layout.css'), 'utf8');
const featuredGridCss = fs.readFileSync(path.join(root, 'assets/css/research/tech-featured-strengths-grid.css'), 'utf8');
const carouselPages = ['Chips', 'Imaging', 'Instruments'].flatMap(topic => [`Research-Tech-${topic}-cn.html`, `Research-Tech-${topic}-en.html`]);
for (const file of carouselPages) {
  assert(externalScript(file).some(src => src.endsWith('/tech-project-carousel-static.js?v=20260928-tech-static1')), `${file} should load the shared carousel module`);
}
for (const topic of ['Chips', 'Imaging', 'Instruments']) {
  for (const language of ['cn', 'en']) {
    const file = `Research-Tech-${topic}-${language}.html`;
    const html = fs.readFileSync(path.join(research, file), 'utf8');
    const override = fs.readFileSync(path.join(root, `assets/css/research/tech-${topic.toLowerCase()}-overrides.css`), 'utf8');
    assert.match(override, /^@import url\("\.\/tech-featured-strengths-grid\.css\?v=20261003-staticgrid1"\);/,
      `${file} should import the shared Featured Strengths grid before local overrides`);
    const overrideVersion = ['Imaging', 'Instruments'].includes(topic) ? '20261003-carouselguard1' : topic === 'Chips' ? '20261006-carouselguard2' : '20261003-staticgrid1';
    assert.match(html, new RegExp(`tech-${topic.toLowerCase()}-overrides\\.css\\?v=${overrideVersion}`),
      `${file} should use the cache-busted page-family entry`);
    if (topic === 'Chips') {
      assert.match(override, /max-width:\s*1040px !important/,
        `${file} should retain the narrower Chips section width`);
      assert.match(override, /@import url\("\.\/tech-carousel-static-guard\.css\?v=20261006-carouselguard2"\);/,
        `${file} should import the shared runtime guard`);
      const guardImport = override.indexOf('tech-carousel-static-guard.css?v=20261006-carouselguard2');
      const desktopChipsGrid = override.indexOf('grid-template-columns: repeat(3, minmax(0, 1fr)) !important;');
      assert(desktopChipsGrid > guardImport,
        `${file} should keep its three-column grid as a later page-specific guard override`);
      assert.match(override, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\) !important;/,
        `${file} should retain its three-column desktop variant`);
      assert.match(override, /@media \(max-width: 1100px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\) !important;/,
        `${file} should retain its two-column tablet variant`);
      assert.match(override, /@media \(max-width: 699px\)[\s\S]*grid-template-columns:\s*1fr !important;/,
        `${file} should retain its one-column mobile variant`);
    }
  }
}
assert.match(featuredGridCss, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) minmax\(0, 1\.15fr\)/,
  'shared Featured Strengths grid retains the four-card desktop layout');
assert.match(featuredGridCss, /@media \(max-width: 1100px\)[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
  'shared Featured Strengths grid retains the two-column tablet layout');
assert.match(featuredGridCss, /@media \(max-width: 699px\)[\s\S]*grid-template-columns: 1fr/,
  'shared Featured Strengths grid retains the one-column mobile layout');
for (const file of ['Research-Tech-Detectors-cn.html', 'Research-Tech-Detectors-en.html']) {
  assert(externalScript(file).some(src => src.endsWith('/tech-application-grid-static.js?v=20260928-tech-static1')), `${file} should load the shared application-grid module`);
}

const projectListPages = fs.readdirSync(research).filter(file => /^Research-Tech-.+-(?:cn|en)\.html$/.test(file));
assert.equal(projectListPages.length, 12, 'expected the shared project-list layout to cover all 12 technology pages');
const projectListClasses = new Set();
for (const file of projectListPages) {
  const html = fs.readFileSync(path.join(research, file), 'utf8');
  assert.match(html, /tech-project-list-layout\.css(?:\?[^"']*)?["']/i, `${file} should load the shared project-list layout`);
  assert.match(html, /project-list-image-layout\.js(?:\?[^"']*)?["']/i, `${file} should load its dynamic image-orientation owner`);
  for (const [, value] of html.matchAll(/\bclass=["']([^"']+)["']/g)) value.split(/\s+/).forEach(name => projectListClasses.add(name));
}
const projectListSelectors = new Set([...projectListCss.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(([, name]) => name));
assert.deepEqual([...projectListSelectors].filter(name => !projectListClasses.has(name)), ['project-list__image--stacked'], 'only the script-owned stacked-image modifier may be absent from static HTML');
assert(projectListSource.includes("classList.toggle('project-list__image--stacked'"), 'the image layout script must remain the owner of the stacked-image modifier');

function classList(initial = []) {
  const values = new Set(initial);
  return {
    values,
    add(...names) { names.forEach(name => values.add(name)); },
    contains(name) { return values.has(name); },
    remove(...names) { names.forEach(name => values.delete(name)); },
  };
}

function runCarousel({ hasBlock = true, width = 1440 } = {}) {
  const intervals = new Map();
  const listeners = new Map();
  const cleared = [];
  let nextTimer = 0;
  const slides = Array.from({ length: 4 }, (_, index) => ({
    attrs: new Set(['aria-hidden', 'data-slick-index']),
    classList: classList(['slick-slide']),
    style: {},
    removeAttribute(name) { this.attrs.delete(name); },
  }));
  const titles = [20, 100].map(top => ({
    style: { setProperty(name, value, priority) { this[name] = { value, priority }; } },
    getBoundingClientRect: () => ({ top }),
  }));
  const rows = titles.map((title, index) => ({
    classList: classList(),
    querySelector: selector => selector === '.project-carousel__title' ? title : null,
    index,
  }));
  rows.push(rows[0], rows[1]);
  const images = [];
  const controls = [{ removed: false, remove() { this.removed = true; } }];
  const containers = [{ style: {} }, { style: {} }];
  const view = {
    classList: classList(['slick-initialized', 'slick-slider', 'slick-dotted']),
    style: {},
    querySelectorAll: selector => selector === '.slick-slide' ? slides : [],
  };
  const block = {
    querySelector: selector => selector === '.view-content' ? view : null,
    querySelectorAll(selector) {
      if (selector === '.views-row') return rows;
      if (selector === 'img') return images;
      if (selector === '.slick-arrow, .slick-dots') return controls;
      if (selector === '.slick-list, .slick-track') return containers;
      return [];
    },
  };
  const document = { querySelector: () => hasBlock ? block : null };
  const window = {
    matchMedia: () => ({ matches: width <= 1100 }),
    addEventListener(name, callback) { listeners.set(name, callback); },
    setInterval(callback, delay) { assert.equal(delay, 100); intervals.set(++nextTimer, callback); return nextTimer; },
    clearInterval(id) { cleared.push(id); intervals.delete(id); },
  };
  vm.runInNewContext(carouselSource, { document, window });
  return { view, slides, controls, containers, titles, listeners, intervals, cleared, tick() { for (const callback of intervals.values()) callback(); } };
}

const noCarousel = runCarousel({ hasBlock: false });
assert.equal(noCarousel.intervals.size, 0);
assert.equal(noCarousel.listeners.size, 0);

const carousel = runCarousel();
assert.equal(carousel.view.style.display, 'grid');
assert.equal(carousel.view.style.gridTemplateColumns, 'repeat(3, minmax(0, 1fr)) minmax(0, 1.15fr)');
assert.equal(carousel.view.classList.contains('slick-initialized'), false);
assert(carousel.controls[0].removed);
assert.equal(carousel.containers[0].style.display, 'contents');
assert.equal(carousel.slides[0].attrs.has('aria-hidden'), false);
assert.deepEqual(carousel.titles[1].style.top, { value: '-80px', priority: 'important' });
carousel.view.classList.add('slick-initialized', 'slick-slider');
carousel.tick();
assert.equal(carousel.view.classList.contains('slick-initialized'), false);
for (let i = 0; i < 20; i++) carousel.tick();
assert.equal(carousel.intervals.size, 0);
assert.deepEqual(carousel.cleared, [1]);

const mobileCarousel = runCarousel({ width: 390 });
assert.deepEqual(mobileCarousel.titles[1].style.top, { value: '0px', priority: 'important' });

function runApplicationGrid({ hasBlock = true, initialized = true, throwOnUnslick = false } = {}) {
  const listeners = new Map();
  const timers = [];
  let unslickCalls = 0;
  const view = {
    classList: classList(['slick-initialized', 'slick-slider', 'slick-dotted']),
    attrs: new Set(['style']),
    removeAttribute(name) { this.attrs.delete(name); },
    remove() { this.removed = true; },
  };
  const wrappers = ['slick-list', 'slick-track'].map(() => ({
    classList: classList(['slick-slider', 'slick-initialized', 'slick-dotted']),
    attrs: new Set(['style']),
    removeAttribute(name) { this.attrs.delete(name); },
  }));
  const items = [{
    classList: classList(['slick-slide', 'slick-current', 'slick-active']),
    attrs: new Set(['style', 'aria-hidden', 'tabindex']),
    removeAttribute(name) { this.attrs.delete(name); },
  }];
  const disposable = [{ remove() { this.removed = true; } }, { remove() { this.removed = true; } }];
  const block = {
    querySelector: selector => selector === '.application-grid' ? view : null,
    querySelectorAll(selector) {
      if (selector === '.slick-arrow, .slick-dots, .slick-cloned') return disposable;
      if (selector === '.slick-list, .slick-track') return wrappers;
      if (selector === '.lab-carousel.views-row') return items;
      return [];
    },
  };
  function jquery(element) {
    return {
      hasClass(name) { return initialized && element.classList.contains(name); },
      slick(command) {
        assert.equal(command, 'unslick');
        unslickCalls++;
        if (throwOnUnslick) throw new Error('fixture unslick failure');
      },
    };
  }
  jquery.fn = { slick() {} };
  const document = { querySelector: () => hasBlock ? block : null };
  const window = {
    jQuery: jquery,
    addEventListener(name, callback, options) { listeners.set(name, { callback, options }); },
    setTimeout(callback, delay) { timers.push({ callback, delay }); },
  };
  const warnings = [];
  vm.runInNewContext(gridSource, { document, window, console: { warn: (...args) => warnings.push(args) } });
  return { view, wrappers, items, disposable, listeners, timers, warnings, get unslickCalls() { return unslickCalls; } };
}

const missingGrid = runApplicationGrid({ hasBlock: false });
assert.equal(missingGrid.timers.length, 1);
missingGrid.timers[0].callback();
assert.equal(missingGrid.unslickCalls, 0);

const grid = runApplicationGrid();
assert.equal(grid.unslickCalls, 1);
assert.equal(grid.view.attrs.has('style'), false);
assert.equal(grid.view.classList.contains('slick-initialized'), false);
assert(grid.disposable.every(element => element.removed));
assert.equal(grid.wrappers.every(element => !element.attrs.has('style')), true);
assert.equal(grid.items[0].classList.contains('slick-slide'), false);
assert.equal(grid.items[0].attrs.size, 0);
assert.equal(grid.listeners.get('load').options.once, true);
assert.equal(grid.timers[0].delay, 350);
grid.view.classList.add('slick-initialized');
grid.listeners.get('load').callback();
grid.view.classList.add('slick-initialized');
grid.timers[0].callback();
assert.equal(grid.unslickCalls, 3);

const uninitializedGrid = runApplicationGrid({ initialized: false });
assert.equal(uninitializedGrid.unslickCalls, 0);
assert.equal(uninitializedGrid.view.attrs.has('style'), false);

const failedUnslick = runApplicationGrid({ throwOnUnslick: true });
assert.equal(failedUnslick.warnings.length, 1);
assert(failedUnslick.disposable.every(element => element.removed));

process.stdout.write(`PASS: shared-script identity, missing targets, desktop/mobile title geometry, Slick cleanup/retries, and 12-page project-list CSS ownership (${projectListSelectors.size - 1} static classes plus one script-generated modifier).\n`);
