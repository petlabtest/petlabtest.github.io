import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/js/editorial-section-motion.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets/css/editorial-section-motion.css'), 'utf8');
const siteStyles = fs.readFileSync(path.join(root, 'assets/css/site.css'), 'utf8');

function run({ reduced = false, hasObserver = true, legacyListener = false, height = 800 } = {}) {
  const classes = new Set();
  const sectionClasses = [new Set(), new Set()];
  const observed = [];
  const instances = [];
  const windowListeners = new Map();
  const documentListeners = new Map();
  let onFocus;
  let preferenceChange;
  let currentHeight = height;
  const sections = sectionClasses.map((sectionClass, index) => ({
    classList: { add: value => sectionClass.add(value) },
    getAttribute: name => name === 'data-editorial-threshold' ? (index === 0 ? '0.74' : '0.42') : null,
    querySelectorAll: () => [{ getAttribute: () => null, style: { setProperty() {} } }, { getAttribute: () => null, style: { setProperty() {} } }],
  }));
  const preference = { matches: reduced };
  if (legacyListener) preference.addListener = callback => { preferenceChange = callback; };
  else preference.addEventListener = (_, callback) => { preferenceChange = callback; };
  function IntersectionObserver(callback, options) {
    const instance = {
      callback,
      options,
      observe: section => observed.push(section),
      unobserve: () => {},
      disconnect: () => { instance.disconnected = true; },
    };
    instances.push(instance);
    return instance;
  }
  const window = {
    get innerHeight() { return currentHeight; },
    matchMedia: () => preference,
    addEventListener: (name, callback) => windowListeners.set(name, callback),
    removeEventListener: name => windowListeners.delete(name),
    ...(hasObserver ? { IntersectionObserver } : {}),
  };
  vm.runInNewContext(source, {
    document: {
      documentElement: { classList: { add: value => classes.add(value), remove: value => classes.delete(value) } },
      querySelectorAll: () => sections,
      addEventListener: (name, callback) => documentListeners.set(name, callback),
    },
    window,
    IntersectionObserver,
  });
  onFocus = documentListeners.get('focusin');
  return {
    classes,
    disconnected: () => instances.every(instance => instance.disconnected),
    focus: target => onFocus({ target }),
    instances,
    observed,
    preference,
    preferenceChange,
    resize: () => windowListeners.get('resize')?.(),
    setHeight: value => { currentHeight = value; },
    sectionClasses,
    sections,
  };
}

const observed = run();
assert(observed.classes.has('editorial-motion-ready'));
assert.equal(observed.observed.length, 2);
assert.equal(observed.instances.length, 2, 'custom entrance thresholds should get separate observers');
assert(observed.instances.some(instance => instance.options.rootMargin === '0px 0px -208px 0px'));
assert(observed.instances.some(instance => instance.options.rootMargin === '0px 0px -464px 0px'));
observed.instances[0].callback([{ isIntersecting: true, target: observed.observed[0] }]);
assert(observed.sectionClasses[0].has('is-editorial-visible'));
assert(!observed.sectionClasses[1].has('is-editorial-visible'));

const keyboardFocus = run();
keyboardFocus.focus({ closest: () => keyboardFocus.sections[1] });
assert(keyboardFocus.sectionClasses[1].has('is-editorial-visible'), 'keyboard focus must reveal a not-yet-intersecting section');

const initiallyReduced = run({ reduced: true });
assert(!initiallyReduced.classes.has('editorial-motion-ready'));
assert(initiallyReduced.sectionClasses.every(classes => classes.has('is-editorial-visible')));

const changedToReduced = run();
changedToReduced.preferenceChange({ matches: true });
assert(!changedToReduced.classes.has('editorial-motion-ready'));
assert(changedToReduced.sectionClasses.every(classes => classes.has('is-editorial-visible')));
assert(changedToReduced.disconnected());

const resized = run();
resized.setHeight(1000);
resized.resize();
assert(resized.instances.slice(0, 2).every(instance => instance.disconnected), 'resize should rebuild observers against the new viewport height');
assert(resized.instances.some(instance => instance.options.rootMargin === '0px 0px -260px 0px'));
assert(resized.instances.some(instance => instance.options.rootMargin === '0px 0px -580px 0px'));

const legacyReduced = run({ legacyListener: true });
legacyReduced.preferenceChange({ matches: true });
assert(legacyReduced.sectionClasses.every(classes => classes.has('is-editorial-visible')));
assert(run({ hasObserver: false }).sectionClasses.every(classes => classes.has('is-editorial-visible')));
assert.match(styles, /html\.editorial-motion-ready \[data-editorial-target\][\s\S]*opacity: 0/);
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*opacity: 1[\s\S]*transition: none/);
assert.equal((styles.match(/opacity:\s*0/g) ?? []).length, 1, 'only the observer-ready rule may hide editorial content');
assert(styles.includes('[data-editorial-target][data-editorial-effect="fade-right"]'));
assert(styles.includes('[data-editorial-target][data-editorial-effect="card-fade"]'));
assert(source.includes("getAttribute('data-editorial-delay')"));

for (const file of ['index-cn.html', 'index.html', 'About/About-about-cn.html', 'About/About-about-en.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert(html.includes('editorial-section-motion.css') && html.includes('editorial-section-motion.js'), `${file} should load the shared motion contract`);
  const sectionCount = (html.match(/data-editorial-section\b/g) ?? []).length;
  const targetCount = (html.match(/data-editorial-target\b/g) ?? []).length;
  if (file.startsWith('About/')) {
    assert.equal(sectionCount, 5, `${file} should animate all five About editorial sections`);
    assert.equal(targetCount, 5, `${file} should animate one content container per About section`);
    assert.equal((html.match(/class="about-content editorial-section__content"/g) ?? []).length, 5, `${file} should use the shared editorial content wrapper in each About section`);
    assert.equal((html.match(/class="about-copy editorial-section__copy"/g) ?? []).length, 5, `${file} should use the shared editorial copy wrapper in each About section`);
  } else {
    assert.equal(sectionCount, 1, `${file} should animate the mission panel`);
    assert.equal(targetCount, 4, `${file} should animate the mission eyebrow, heading, copy, and CTA`);
    assert.equal((html.match(/class="editorial-section__content"/g) ?? []).length, 1, `${file} mission should use one editorial content wrapper`);
    assert.equal((html.match(/class="editorial-section__copy"/g) ?? []).length, 1, `${file} mission should use one editorial copy wrapper`);
    assert.match(html, /<section class="home-fullwidth__panel"[\s\S]*?<div class="editorial-section__content">\s*<div class="editorial-section__copy">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/, `${file} mission should preserve section > content > copy nesting`);
    assert(html.includes('site.css?v=20260928-editorial-cascade5'), `${file} should bypass cached styles after homepage CSS changes`);
    assert.match(html, /home-fullwidth__panel[^>]*data-editorial-threshold="0\.74"/);
    for (const delay of ['620', '820', '1060', '1320']) {
      assert(html.includes(`data-editorial-delay="${delay}"`), `${file} should preserve the ${delay}ms entrance delay`);
    }
  }
}
assert(siteStyles.includes('.home-fullwidth__panel .editorial-section__copy > p:not(.home-fullwidth__eyebrow)'), 'mission body copy selector should target the normalized editorial copy wrapper');

process.stdout.write('PASS: shared editorial motion observes home/About sections and fails open for reduced motion or missing IntersectionObserver.\n');
