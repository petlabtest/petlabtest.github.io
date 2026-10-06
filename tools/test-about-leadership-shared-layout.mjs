import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const basePath = 'assets/css/about/leadership-layout.css';
const cnPath = 'assets/css/about/leadership-cn-overrides.css';
const base = fs.readFileSync(path.join(root, basePath), 'utf8');
const cn = fs.readFileSync(path.join(root, cnPath), 'utf8');
const teamIntro = fs.readFileSync(path.join(root, 'assets/css/about/research-team-archive/team-intro.css'), 'utf8');
assert(base.includes('.industry-list .industry-item-info-dark') && base.includes('.industry-list h2'), 'shared leadership rules should remain');
assert(!/\.about-hero-wrap\s*\{|\.about-hero-wrap::after\s*\{|\.about-hero-inner\s*\{|\.about-hero-title\s*\{|@media\s*\(max-width:\s*1100px\)/.test(base), 'shared hero geometry and page-title typography should not remain in leadership layout');
assert(base.includes('.industry-list>.industry-item .industry-item-info p') && base.includes('font-size: 0.9rem !important'), 'English biography typography should remain in base');
assert.match(base, /\.team-card \.team-card-credential\s*\{\s*margin-top:\s*0;\s*font-size:\s*1rem;\s*text-align:\s*center;/, 'credential line typography should have a shared owner');
assert(cn.includes('left: 6rem !important') && cn.includes('font-size: clamp(17px, 1.05vw, 19px) !important'), 'Chinese image and biography overrides should remain');
assert(cn.includes('.team-card p.detailed-intro'), 'Chinese detailed-intro sizing should remain scoped');
assert.match(teamIntro, /\.detailed-intro\s*\{[^}]*font-size:\s*0\.75rem;/s, 'existing team-intro layer should own the base detailed-intro size');
assert.match(base, /\.industry-item-info\s*>\s*\.leadership-card-more\s*\{[^}]*position:\s*absolute;[^}]*bottom:\s*3rem;[^}]*color:\s*inherit;[^}]*text-decoration:\s*none;/s, 'shared leadership layer should own more-link decoration and vertical position');
assert.match(base, /\.industry-item:not\(\.industry-item-alt\)\s+\.leadership-card-more\s*\{\s*right:\s*6rem;/, 'standard leadership cards should retain the right-side link position');
assert.match(base, /\.industry-item-alt\s+\.leadership-card-more\s*\{\s*left:\s*38rem;/, 'alternate leadership cards should retain the left-side link position');
assert.match(base, /\.leadership-card-image\s*\{[^}]*width:\s*42rem;[^}]*height:\s*35rem;[^}]*background-size:\s*cover;[^}]*background-repeat:\s*no-repeat;[^}]*background-position:\s*center;/s, 'shared leadership layer should own image size and crop behavior');
assert.match(base, /\.industry-item-info\.leadership-card-info\s*\{[^}]*position:\s*absolute;[^}]*left:\s*6rem;[^}]*top:\s*8rem;[^}]*width:\s*86rem;[^}]*height:\s*27rem;/s, 'shared leadership layer should own the common profile-panel geometry');
assert.match(base, /\.industry-item-info-blue\.leadership-card-info\s*\{\s*padding:\s*2\.5rem 3rem 4\.5rem 48rem;/, 'blue panels should share their common padding');
assert.match(base, /\.industry-item-info-dark\.leadership-card-info\s*\{\s*padding:\s*2\.5rem 46rem 4\.5rem 4rem;/, 'dark panels should share their common padding');
assert.match(base, /\.leadership-card-info--wide-copy-gutter\s*\{\s*padding-right:\s*4rem;/, 'Nicola panel should retain its distinct right padding');
assert.match(base, /body\.page-about-leadership:lang\(en\)[^{]*\.industry-item:not\(\.industry-item-alt\)[^{]*\{\s*left:\s*8rem;/, 'English standard-card image offset should remain 8rem');
assert.match(base, /\.industry-item-alt \.leadership-card-image\s*\{\s*left:\s*50rem;/, 'alternate-card image offset should remain 50rem');
const leadershipImageSources = {
  qingguo: '../../pic/root/media/08-1-2289e8d5.jpg',
  peng: '../../pic/root/media/08-2-6a3706b1.jpg',
  nicola: '../../pic/About/People/3-1.jpg',
  lin: '../../pic/About/People/4-1.jpg',
};
for (const [person, source] of Object.entries(leadershipImageSources)) {
  assert(base.includes(`.leadership-card-image--${person}`) && base.includes(`url("${source}")`), `${person}: preserve the existing card image source`);
  assert(fs.existsSync(path.resolve(root, 'assets/css/about', source)), `${person}: CSS-relative image path should exist`);
}
assert.match(teamIntro, /\.industry-item-info-dark\s*\{\s*background:\s*var\(--theme-color2\);\s*\}/, 'existing shared theme layer should own dark card backgrounds');
assert.match(teamIntro, /\.industry-item-info-blue\s*\{\s*background:\s*var\(--theme-color1\);\s*\}/, 'existing shared theme layer should own blue card backgrounds');
assert.match(teamIntro, /\.industry-item-info\s*\{[^}]*color:\s*#fff;/s, 'existing shared panel layer should own the base text color');
assert.match(base, /\.industry-list \.industry-item-info-dark\s*\{\s*background:\s*#E2E2E2 !important;\s*color:\s*#000 !important;/, 'existing late dark-card override should retain ownership');
const fonts = [...base.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match => match[1]).filter(source => /\.woff2?$/.test(source));
assert.equal(fonts.length, 3, 'three local Poppins font weights should remain');
for (const font of fonts) assert(fs.existsSync(path.resolve(root, 'assets/css/about', font)), `font should exist: ${font}`);

for (const language of ['cn', 'en']) {
  const file = `About/About-leadership-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const teamIntro = html.indexOf('../assets/css/about/research-team-archive/team-intro.css');
  const baseLink = html.indexOf(`../${basePath}?v=20261006-component4`);
  const chapterBase = html.indexOf('../assets/css/about/about-chapter-navigation-base.css?v=20261006-base2');
  const navigationMotion = html.indexOf('../assets/css/about/about-chapter-navigation-motion.css?v=20261006-motion1');
  const hero = html.indexOf('../assets/css/about/leadership-title-hero.css');
  const sharedHero = html.indexOf('../assets/css/about/about-title-hero-shared.css?v=20261003-2');
  const archive = html.indexOf('../assets/css/archive-consistency.css');
  assert(teamIntro < baseLink && baseLink < chapterBase && chapterBase < navigationMotion && navigationMotion < sharedHero && sharedHero < hero && hero < archive, `${file}: preserve the ordered layout, shared chapter component/motion, hero geometry, and title layer`);
  const shellCss = '../assets/css/app-shell.css?v=20260926-1';
  assert.equal(html.split(shellCss).length - 1, 1, `${file}: retain AppShell CSS once`);
  assert(html.indexOf(shellCss) < html.indexOf('</head>'), `${file}: AppShell CSS should load in the document head`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: do not reintroduce inline compatibility CSS`);
  assert.equal((html.match(/\sstyle\s*=/gi) || []).length, 0, `${file}: all static inline style attributes should remain externalized`);
  assert.equal((html.match(/<p class="detailed-intro" style="font-size: 0\.75rem;">/g) || []).length, 0, `${file}: rely on the existing shared base detailed-intro size`);
  assert.equal((html.match(/<p class="team-card-credential" style=/g) || []).length, 0, `${file}: credential line styles should stay in shared CSS`);
  assert.equal((html.match(/<p class="team-card-credential">/g) || []).length, 3, `${file}: preserve the three credential lines`);
  assert.equal((html.match(/class="leadership-card-more"/g) || []).length, 4, `${file}: preserve four semantically marked more links`);
  assert.equal((html.match(/<a href="\.\/About-(?:QingguoXie|PengXiao|Nicola|LinWan)-${language}\.html" style=/g) || []).length, 0, `${file}: more links should not regain inline styles`);
  assert.equal((html.match(/class="industry-item-img leadership-card-image leadership-card-image--(?:qingguo|peng|nicola|lin)"/g) || []).length, 4, `${file}: preserve four semantically marked leadership images`);
  const leadershipImages = [...html.matchAll(/<div class="industry-item-img leadership-card-image leadership-card-image--(qingguo|peng|nicola|lin)"><\/div>/g)];
  assert.equal(leadershipImages.length, 4, `${file}: keep all four background-image definitions`);
  assert.deepEqual(leadershipImages.map(([, person]) => person), ['qingguo', 'peng', 'nicola', 'lin'], `${file}: preserve the four image identities and order`);
  const leadershipPanels = [...html.matchAll(/<div\s+class="industry-item-info industry-item-info-(?:blue|dark) leadership-card-info(?: leadership-card-info--wide-copy-gutter)?">/g)];
  assert.equal(leadershipPanels.length, 4, `${file}: preserve all four semantically marked profile panels`);
  assert.equal((html.match(/class="industry-item-info industry-item-info-blue leadership-card-info leadership-card-info--wide-copy-gutter"/g) || []).length, 1, `${file}: keep the unique Nicola copy gutter variant explicit`);
  assert.equal((html.match(/class="industry-item-info industry-item-info-(?:blue|dark) leadership-card-info(?: leadership-card-info--wide-copy-gutter)?"[^>]*style=/g) || []).length, 0, `${file}: panel geometry, themes, and padding should not return inline`);
  const override = html.indexOf(`../${cnPath}?v=20260929-shared2`);
  if (language === 'cn') assert(baseLink < override && override < hero, `${file}: Chinese typography/layout overrides should follow the base`);
  else assert.equal(override, -1, `${file}: Chinese overrides should not load in English`);
}

process.stdout.write('PASS: Leadership layout is shared, Chinese typography remains isolated, and late AppShell CSS stays in place.\n');
