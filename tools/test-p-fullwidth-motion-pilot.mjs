import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/js/p-fullwidth-motion-pilot.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets/css/p-fullwidth-motion-pilot.css'), 'utf8');
const representativePage = fs.readFileSync(path.join(root, 'Research/Research-Project-cn.html'), 'utf8');

const observerSetup = source.indexOf('panels.forEach(function (panel) { observer.observe(panel); });');
const readyGate = source.indexOf("root.classList.add('p-fullwidth-motion-ready');");
assert(observerSetup >= 0 && readyGate > observerSetup, 'ready gate must only be enabled after observer setup');
assert.match(styles, /html\.p-fullwidth-motion-ready \.paragraph--type-p-fullwidth\.js-animate \.p-fullwidth__content\s*\{[^}]*opacity:\s*0/s);
assert.match(styles, /html\.p-fullwidth-motion-ready \.paragraph--type-p-fullwidth\.is-p-fullwidth-motion-visible \.p-fullwidth__content\s*\{[^}]*opacity:\s*1/s);
assert(!/class=["'][^"']*p-fullwidth-motion-ready/.test(representativePage), 'HTML must remain visible by default before JavaScript initializes');
assert(representativePage.indexOf('p-fullwidth-motion-pilot.css') < representativePage.indexOf('p-fullwidth-motion-pilot.js'), 'pilot CSS must load before its deferred script');

function run({ reduced = false, hasObserver = true, top = 1000, legacyMediaListener = false } = {}) {
  const windowListeners = new Map();
  const documentListeners = new Map();
  const rootClasses = new Set();
  let observerCallback;
  let disconnected = false;
  let preferenceChange;
  let panelTop = top;
  const panelClasses = new Set(['js-animate']);
  const panel = {
    classList: { add: value => panelClasses.add(value) },
    getBoundingClientRect: () => ({ top: panelTop }),
  };
  const preference = { matches: reduced };
  if (legacyMediaListener) {
    preference.addListener = callback => { preferenceChange = callback; };
  } else {
    preference.addEventListener = (_, callback) => { preferenceChange = callback; };
  }
  function IntersectionObserver(callback) {
    observerCallback = callback;
    this.observe = () => {};
    this.unobserve = () => {};
    this.disconnect = () => { disconnected = true; };
  }
  const document = {
    documentElement: {
      classList: {
        add: value => rootClasses.add(value),
        remove: value => rootClasses.delete(value),
      },
    },
    querySelectorAll: () => [panel],
    addEventListener: (name, callback) => documentListeners.set(name, callback),
    removeEventListener: name => documentListeners.delete(name),
  };
  const window = {
    innerHeight: 768,
    matchMedia: () => preference,
    addEventListener: (name, callback) => windowListeners.set(name, callback),
    removeEventListener: name => windowListeners.delete(name),
  };
  if (hasObserver) window.IntersectionObserver = IntersectionObserver;

  vm.runInNewContext(source, { document, window, IntersectionObserver });
  return {
    documentListeners,
    disconnected: () => disconnected,
    panel,
    panelClasses,
    preferenceChange,
    rootClasses,
    observerCallback,
    scrollTo: value => {
      panelTop = value;
      documentListeners.get('scroll')?.();
    },
  };
}

const observed = run();
assert(observed.rootClasses.has('p-fullwidth-motion-ready'));
observed.observerCallback([{ isIntersecting: true, target: observed.panel }]);
assert(observed.panelClasses.has('is-p-fullwidth-motion-visible'));

const jumpedPast = run();
jumpedPast.scrollTo(-300);
assert(jumpedPast.panelClasses.has('is-p-fullwidth-motion-visible'));

const changedToReduced = run();
changedToReduced.preferenceChange({ matches: true });
assert(changedToReduced.panelClasses.has('is-p-fullwidth-motion-visible'));
assert(!changedToReduced.rootClasses.has('p-fullwidth-motion-ready'));
assert(changedToReduced.disconnected());
assert.equal(changedToReduced.documentListeners.has('scroll'), false);

const legacyChangedToReduced = run({ legacyMediaListener: true });
assert.equal(typeof legacyChangedToReduced.preferenceChange, 'function');
legacyChangedToReduced.preferenceChange({ matches: true });
assert(legacyChangedToReduced.panelClasses.has('is-p-fullwidth-motion-visible'));
assert(!legacyChangedToReduced.rootClasses.has('p-fullwidth-motion-ready'));
assert(legacyChangedToReduced.disconnected());

assert(!run({ reduced: true }).rootClasses.has('p-fullwidth-motion-ready'));
assert(!run({ hasObserver: false }).rootClasses.has('p-fullwidth-motion-ready'));

process.stdout.write('PASS: fail-open CSS/HTML order, observer-ready gate, intersection, skipped-section scroll, modern/legacy reduced-motion listeners, initial reduce and observer fallback.\n');
