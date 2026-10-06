import assert from 'node:assert/strict';
import fs from 'node:fs';

const href = '../assets/css/about/about-chapter-navigation-motion.css?v=20261006-motion1';
const baseHref = '../assets/css/about/about-chapter-navigation-base.css?v=20261006-base2';
const motion = fs.readFileSync('assets/css/about/about-chapter-navigation-motion.css', 'utf8');
const component = fs.readFileSync('assets/css/about/about-chapter-navigation-base.css', 'utf8');
const families = [
  ['mission', 'about-mission-layout.css?v=20261006-component4', 'about-mission-main'],
  ['history', 'history-layout.css?v=20261006-component4', 'history-main'],
  ['leadership', 'leadership-layout.css?v=20261006-component4', 'industry-main'],
];

for (const [family, layoutHref, rootClass] of families) {
  const layout = fs.readFileSync(`assets/css/about/${layoutHref.split('?')[0]}`, 'utf8');
  assert.doesNotMatch(layout, /transition:\s*(?:opacity \.8s ease|transform 1\.25s ease)|transform:\s*scale\(1\.15\)|padding-bottom:\s*15px/, `${family}: chapter card motion should have one shared owner`);
  assert.doesNotMatch(layout, /\.ll-section-nav\s*\{[^}]*position:\s*relative/,
    `${family}: shared link structure should not be duplicated in the local layout`);
  assert.doesNotMatch(layout, /\.ll-nav-text-side\s*\{[^}]*position:\s*absolute/,
    `${family}: shared title positioning should not be duplicated in the local layout`);
  assert.doesNotMatch(layout, /\.ll-nav-title\s*\{[^}]*font-size:\s*38px/,
    `${family}: shared title typography should not be duplicated in the local layout`);
  assert.doesNotMatch(layout, /\.dpet-ll-pub-nav-chapters h3\s*\{[^}]*font-size:\s*30px/,
    `${family}: shared chapter heading typography should not be duplicated in the local layout`);
  assert.doesNotMatch(layout, /\.dpet-ll-pub-bottom-nav\s*\{[^}]*display:\s*flex/,
    `${family}: shared card-list layout should not be duplicated in the local layout`);
  for (const language of ['cn', 'en']) {
    const file = `About/About-${family}-${language}.html`;
    const html = fs.readFileSync(file, 'utf8');
    const layoutIndex = html.indexOf(`../assets/css/about/${layoutHref}`);
    const baseIndex = html.indexOf(baseHref);
    const motionIndex = html.indexOf(href);
    const heroIndex = html.indexOf('about-title-hero-shared.css');
    const archiveIndex = html.indexOf('archive-consistency.css');
    assert(html.includes(`class="${rootClass}`) || (rootClass === 'about-mission-main' && html.includes('id="main"')), `${file}: page DOM should provide the scoped chapter-navigation root`);
    assert(html.includes('dpet-ll-pub-nav-chapters'), `${file}: page should contain the shared chapter navigation`);
    assert(layoutIndex >= 0 && layoutIndex < baseIndex && baseIndex < motionIndex && motionIndex < heroIndex && heroIndex < archiveIndex, `${file}: shared component base and motion follow local geometry and precede title/archive layers`);
    assert.equal(html.split(href).length - 1, 1, `${file}: load shared chapter motion once`);
  }
}

for (const value of ['font-size: 30px', 'display: flex', 'flex-basis: calc(50% - 5px)', 'flex-basis: calc(20% - 8px)', 'position: relative', 'background: #008eff', 'aspect-ratio: 1 / 1', 'object-fit: cover', 'font-size: 38px', 'font-weight: 700']) {
  assert(component.includes(value), `shared chapter-card base should own ${value}`);
}

for (const value of ['opacity .8s ease', 'transform 1.25s ease', 'opacity: 0', 'transform: scale(1.15)', 'padding-bottom: 15px']) {
  assert.equal(motion.split(value).length - 1, 1, `shared motion should define ${value} once`);
}

process.stdout.write('PASS: About Mission, History, and Leadership chapter cards share one hover-motion contract across six pages.\n');
