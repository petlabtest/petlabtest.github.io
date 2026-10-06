import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/js/home-motion.js'), 'utf8');
const motionCss = fs.readFileSync(path.join(root, 'assets/css/home-motion.css'), 'utf8');

const emittedEffects = new Set([...source.matchAll(/effect:\s*'([^']+)'/g)].map(([, effect]) => effect));
const styledEffects = new Set([...motionCss.matchAll(/\[data-home-effect="([^"]+)"\]/g)].map(([, effect]) => effect));
for (const effect of emittedEffects) assert(styledEffects.has(effect), `home motion effect ${effect} should have a stylesheet rule`);
for (const effect of styledEffects) assert(emittedEffects.has(effect), `home motion effect ${effect} should be produced by the page script`);
assert(source.includes("entry.effect || 'fade-up'") && motionCss.includes('[data-home-reveal] {'), 'the default fade-up effect should remain on the shared reveal base');

for (const file of ['index.html', 'index-cn.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal((html.match(/home-motion\.css\?v=20261003-effects1/g) || []).length, 1, `${file} should load the updated motion layer once`);
}

function run(initiallyReduced) {
  const classes = new Set();
  const attributes = new Set();
  const listeners = new Map();
  const timers = [];
  let onPreferenceChange;
  function makeElement() {
    const elementAttributes = new Set();
    return {
      classList: { add() {} },
      style: { setProperty() {} },
      setAttribute: name => elementAttributes.add(name),
      querySelector: () => null,
    };
  }
  const classList = {
    add: value => classes.add(value),
    contains: value => classes.has(value),
  };
  const mission = {
    classList,
    style: { setProperty() {} },
    setAttribute: name => attributes.add(name),
    hasAttribute: name => attributes.has(name),
    querySelector: () => makeElement(),
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ top: 1000 }),
  };
  const preference = {
    matches: initiallyReduced,
    addEventListener: (_, callback) => { onPreferenceChange = callback; },
  };
  const document = {
    body: { classList: { contains: name => name === 'home-motion', add: value => classes.add(value) } },
    querySelector: selector => selector === '.home-fullwidth__panel' ? mission : null,
    querySelectorAll: selector => selector === '[data-home-sequence]' && attributes.has('data-home-sequence') ? [mission] : [],
  };
  const window = {
    matchMedia: () => preference,
    innerHeight: 800,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
    requestAnimationFrame: () => 1,
    setTimeout: (callback, delay) => { timers.push({ callback, delay }); return timers.length; },
  };

  vm.runInNewContext(source, { document, window });
  return { classes, listeners, mission, onPreferenceChange, preference, timers };
}

const initialReduced = run(true);
assert(initialReduced.classes.has('home-motion-ready'));
assert(initialReduced.classes.has('is-home-visible'));
assert(initialReduced.classes.has('is-home-revealed'));
assert.equal(initialReduced.timers[0].delay, 2200);

const changedToReduced = run(false);
assert(!changedToReduced.classes.has('is-home-visible'));
assert(changedToReduced.listeners.has('scroll'));
changedToReduced.preference.matches = true;
changedToReduced.onPreferenceChange({ matches: true });
assert(changedToReduced.classes.has('is-home-visible'));
assert(changedToReduced.classes.has('is-home-revealed'));
assert.equal(changedToReduced.listeners.has('scroll'), false);
assert.equal(changedToReduced.listeners.has('resize'), false);

process.stdout.write('PASS: reduced motion reveals home content immediately and when enabled at runtime.\n');
