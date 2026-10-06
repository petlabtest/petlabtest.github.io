import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/js/transfer-process.js'), 'utf8');

function run({ reduced = false, hasObserver = true, readyState = 'loading', stepCount = 4 } = {}) {
  const steps = Array.from({ length: stepCount }, () => ({
    classes: new Set(),
    classList: { add(value) { this.step.classes.add(value); }, step: null },
    style: {},
  }));
  steps.forEach(step => { step.classList.step = step; });
  const rootClasses = new Set();
  const documentListeners = new Map();
  let observerCallback;
  let observerOptions;
  const observed = [];
  const unobserved = [];
  const document = {
    readyState,
    documentElement: { classList: { add: value => rootClasses.add(value) } },
    querySelectorAll: () => steps,
    addEventListener: (name, callback, options) => documentListeners.set(name, { callback, options }),
  };
  const window = { matchMedia: () => ({ matches: reduced }) };
  function IntersectionObserver(callback, options) {
    observerCallback = callback;
    observerOptions = options;
    this.observe = step => observed.push(step);
    this.unobserve = step => unobserved.push(step);
  }
  if (hasObserver) window.IntersectionObserver = IntersectionObserver;
  vm.runInNewContext(source, { document, window, IntersectionObserver });
  return {
    documentListeners, getObserverCallback: () => observerCallback,
    getObserverOptions: () => observerOptions, observed,
    rootClasses, steps, unobserved,
  };
}

function finishLoading(result) {
  result.documentListeners.get('DOMContentLoaded')?.callback();
  return result;
}

const deferred = run();
assert.equal(deferred.rootClasses.has('js-transfer-process'), false);
assert.equal(deferred.observed.length, 0);
const ready = deferred.documentListeners.get('DOMContentLoaded');
assert.equal(ready.options.once, true);
ready.callback();
assert(deferred.rootClasses.has('js-transfer-process'));
assert.equal(deferred.getObserverOptions().threshold, 0.14);
assert.equal(deferred.getObserverOptions().rootMargin, '0px 0px -8% 0px');
assert.deepEqual(deferred.steps.map(step => step.style.transitionDelay), ['0ms', '70ms', '140ms', '210ms']);
assert.deepEqual(deferred.observed, deferred.steps);
deferred.getObserverCallback()([
  { isIntersecting: false, target: deferred.steps[0] },
  { isIntersecting: true, target: deferred.steps[1] },
]);
assert.equal(deferred.steps[0].classes.has('is-visible'), false);
assert.equal(deferred.steps[1].classes.has('is-visible'), true);
assert.deepEqual(deferred.unobserved, [deferred.steps[1]]);

const reduced = finishLoading(run({ reduced: true }));
assert(reduced.steps.every(step => step.classes.has('is-visible')));
assert.equal(reduced.rootClasses.has('js-transfer-process'), false);
assert.equal(reduced.observed.length, 0);

const fallback = finishLoading(run({ hasObserver: false }));
assert(fallback.steps.every(step => step.classes.has('is-visible')));
assert.equal(fallback.rootClasses.has('js-transfer-process'), false);

const immediate = run({ readyState: 'complete' });
assert(immediate.rootClasses.has('js-transfer-process'));
assert.equal(immediate.observed.length, 4);

const empty = finishLoading(run({ stepCount: 0 }));
assert.equal(empty.rootClasses.has('js-transfer-process'), false);
assert.equal(empty.observed.length, 0);

process.stdout.write('PASS: DOM ready gate, stagger, observer reveal, reduced-motion and observer fallbacks, complete document and empty content.\n');
