import assert from 'node:assert/strict';
import fs from 'node:fs';

const profiles = [
  'About/About-LinWan-cn.html', 'About/About-LinWan-en.html',
  'About/About-Nicola-cn.html', 'About/About-Nicola-en.html',
  'About/About-PengXiao-cn.html', 'About/About-PengXiao-en.html',
  'About/About-QingguoXie-cn.html', 'About/About-QingguoXie-en.html',
  'About/About-Ruizheng-cn.html', 'About/About-Ruizheng-en.html',
];
const css = fs.readFileSync('assets/css/about/team-detail-layout.css', 'utf8');
const typeCss = fs.readFileSync('assets/css/about/team-page-standard.css', 'utf8');
const pengCss = fs.readFileSync('assets/css/about/pengxiao-layout.css', 'utf8');
const xieCss = fs.readFileSync('assets/css/about/qingguoxie-layout.css', 'utf8');
assert.match(css, /body\.team-profile-page \.team-detail-backdrop\s*\{\s*background:\s*url\("\.\.\/\.\.\/pic\/root\/media\/07-bg-81ac28d2\.jpg"\) center \/ cover;/,
  'shared profile layout owns the common backdrop image');
assert.match(css, /body\.team-profile-page \.team-detail-photo\s*\{[^}]*background-repeat:\s*no-repeat;[^}]*background-size:\s*cover;[^}]*background-position:\s*center;/s,
  'shared profile layout owns photo crop behavior');
const portraitVariants = {
  'team-profile--lin-wan': '../../pic/About/People/4-1.jpg',
  'team-profile--nicola': '../../pic/About/People/3-1.jpg',
  'team-profile--nicola-cn': '../../pic/root/media/1-2.jpg',
  'team-profile--peng-xiao': '../../pic/root/media/08-2-6a3706b1.jpg',
  'team-profile--qingguo-xie': '../../pic/root/media/08-1-2289e8d5.jpg',
  'team-profile--rui-zheng': '../../pic/root/media/team-4.jpg',
};
for (const [variant, asset] of Object.entries(portraitVariants)) {
  assert.match(css, new RegExp(`body\\.${variant} \\.team-detail-photo\\s*\\{\\s*background-image:\\s*url\\("${asset.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}"\\);\\s*\\}`),
    `${variant}: shared profile CSS owns its portrait asset`);
  assert(fs.existsSync(`assets/css/about/${asset}`), `${variant}: portrait asset resolves from the shared stylesheet`);
}
assert.match(css, /body\.team-profile-page #base-path\s*\{\s*display:\s*none;\s*\}/,
  'shared profile layout owns the legacy hidden base-path helper');
assert.match(css, /body\.team-profile-page \.team-detail-desc h3\.team-detail-highlight\s*\{\s*font-size:\s*1\.9rem;\s*\}/,
  'shared profile layer owns the one-off semantic highlight heading size');
assert.match(css, /body:is\(\.team-profile--peng-xiao, \.team-profile--qingguo-xie\) \.team-detail-info h1\.page-title\s*\{[^}]*font-family:\s*"Poppins", Arial, sans-serif;/s,
  'shared profile layout owns the two-page Poppins type variant');
assert.match(css, /@media \(min-width: 700px\)\s*\{[^}]*body:is\(\.team-profile--peng-xiao, \.team-profile--qingguo-xie\) \.team-detail-info h1\.page-title\s*\{[^}]*font-size:\s*45px;/s,
  'shared profile layout owns the Poppins tablet title breakpoint');
assert.match(css, /@media \(min-width: 1025px\)\s*\{[^}]*body:is\(\.team-profile--peng-xiao, \.team-profile--qingguo-xie\) \.team-detail-info h1\.page-title\s*\{[^}]*font-size:\s*65px;/s,
  'shared profile layout owns the Poppins desktop title breakpoint');
assert.match(css, /body\.team-profile--qingguo-xie \.team-detail-info>ul[^}]*line-height:\s*1\.5;/,
  'shared profile layout retains Xie metadata line-height variation');

assert.match(css, /body\.team-profile-page \.team-detail-top\s*\{[^}]*margin:\s*170px 0 0\s*!important;[^}]*padding:\s*0 90px 36px\s*!important;/s,
  'shared profile layout owns the section margin and padding');
assert.match(css, /body:is\(\.team-profile--peng-xiao, \.team-profile--qingguo-xie\) \.team-detail-tab-btns \.tab-btn\s*\{\s*margin:\s*0;\s*\}/,
  'shared profile layout owns the tab-button margin for the two matching variants');
assert.equal((pengCss.match(/\.team-detail-tab-btns \.tab-btn\s*\{\s*margin:\s*0;/g) || []).length, 0,
  'Peng Xiao responsive layers should not repeat the shared zero-margin reset');
assert.equal((xieCss.match(/\.team-detail-tab-btns \.tab-btn\s*\{\s*margin:\s*0;/g) || []).length, 0,
  'Qingguo Xie responsive layers should not repeat the shared zero-margin reset');
for (const [name, variantCss] of [['Peng Xiao', pengCss], ['Qingguo Xie', xieCss]]) {
  assert.doesNotMatch(variantCss, /\.team-detail-info h1\.page-title\s*\{/,
    `${name} variant should not repeat shared Poppins heading typography`);
  assert.doesNotMatch(variantCss, /\.team-detail-info \.lab-full__body\s*\{/,
    `${name} variant should not repeat shared Poppins biography typography`);
  assert.doesNotMatch(variantCss, /\.team-detail-main>\.paragraph--type-p-fullwidth:last-child\s*\{/,
    `${name} variant should not repeat the shared CTA shell`);
  assert.doesNotMatch(variantCss, /\.team-detail-info\s*\{\s*top:\s*1\.5rem;/,
    `${name} variant should not retain the ineffective mobile info offset`);
  assert.doesNotMatch(variantCss, /\.team-detail-info \.lab-full__body p\s*\{\s*margin:\s*0 0 1\.2em;/,
    `${name} variant should not repeat shared biography paragraph spacing`);
  assert.doesNotMatch(variantCss, /\.team-detail-info\s*\{\s*position:\s*relative;\s*top:\s*2\.5rem;/,
    `${name} variant should not repeat the shared default info offset`);
  assert.doesNotMatch(variantCss, /\.team-detail-desc-full p\s*\{\s*margin:\s*0 0 1\.2em;/,
    `${name} variant should not repeat shared description paragraph spacing`);
  assert.doesNotMatch(variantCss, /\.team-detail-main>\.paragraph--type-p-fullwidth:last-child \.p-fullwidth__content\s*\{[^}]*padding:\s*230px 30px 80px;/s,
    `${name} variant should not repeat shared full-width content baseline`);
  assert.doesNotMatch(variantCss, /\.team-detail-main>\.paragraph--type-p-fullwidth:last-child \.p-fullwidth__header\s*\{[^}]*font-size:\s*37px;/s,
    `${name} variant should not repeat shared full-width heading baseline`);
  assert.doesNotMatch(variantCss, /\.team-detail-main>\.paragraph--type-p-fullwidth:last-child \.p-fullwidth__body\s*\{[^}]*margin-bottom:\s*18px;/s,
    `${name} variant should not repeat shared full-width body baseline`);
  assert.doesNotMatch(variantCss, /\.team-detail-main>\.paragraph--type-p-fullwidth:last-child \.p-fullwidth__cta\s*\{\s*margin-bottom:\s*20px;/,
    `${name} variant should not repeat shared full-width CTA spacing`);
  assert.doesNotMatch(variantCss, /\.team-detail-main>\.paragraph--type-p-fullwidth:last-child \.cta--button \.last-word\s*\{\s*display:\s*inline-block;\s*white-space:\s*nowrap;/,
    `${name} variant should not repeat shared CTA word wrapping`);
  assert.doesNotMatch(variantCss, /\.team-detail-main>\.paragraph--type-p-fullwidth:last-child \.cta--button:hover\s*\{\s*padding-left:\s*36px;\s*padding-right:\s*0;/,
    `${name} variant should not repeat shared CTA hover movement`);
}
assert.match(typeCss, /\.team-detail-main>\.paragraph--type-p-fullwidth:last-child \.p-fullwidth__content\{[^}]*padding:230px 30px 80px/s,
  'shared profile type layer owns full-width content baseline');
assert.match(typeCss, /\.team-detail-main>\.paragraph--type-p-fullwidth:last-child \.cta--button:hover\{padding-left:36px;padding-right:0\}/,
  'shared profile type layer owns CTA hover movement');
assert.match(typeCss, /\.team-detail-info h1\.page-title\s*\{[^}]*font-size:/s, 'shared profile type layer owns title size');
assert.match(typeCss, /\.team-detail-info \.lab-full__body p\s*\{\s*margin:\s*0 0 1\.2em;?/,
  'shared profile type layer owns biography paragraph spacing');
assert.match(typeCss, /\.team-detail-info\s*\{\s*position:\s*relative;\s*top:\s*2\.5rem;?/,
  'shared profile type layer owns the default info offset');
assert.match(typeCss, /\.team-detail-desc-full p\s*\{\s*margin:\s*0 0 1\.2em;?/,
  'shared profile type layer owns description paragraph spacing');
assert.match(typeCss, /\.team-detail-tabs \.team-detail-tab-btns \.tab-btn\s*\{[^}]*margin:\s*0;/s,
  'shared profile type layer owns the tab-button zero margin');
assert.equal((typeCss.match(/(?:^|\})\.team-detail-tab-btns \.tab-btn\s*\{\s*margin:\s*0;/g) || []).length, 0,
  'shared profile type layer does not repeat standalone tab margin resets');
assert.match(typeCss, /\.team-detail-info \.lab-full__body\s*\{[^}]*font-size:/s, 'shared profile type layer owns biography size');
assert.match(typeCss, /\.team-detail-info>ul,\.team-detail-info>ul>li\s*\{[^}]*font-size:/s, 'shared profile type layer owns metadata list size');
for (const file of profiles) {
  const html = fs.readFileSync(file, 'utf8');
  const sharedType = '../assets/css/about/team-page-standard.css?v=20261003-tabmargin1';
  const sharedLayout = '../assets/css/about/team-detail-layout.css?v=20261006-profile3';
  const archiveLayer = '../assets/css/archive-consistency.css';
  const expectedVariant = file.includes('PengXiao')
    ? '../assets/css/about/pengxiao-layout.css?v=20261006-shared5'
    : file.includes('QingguoXie')
      ? '../assets/css/about/qingguoxie-layout.css?v=20261006-shared5'
      : null;
  assert.equal(html.split(sharedType).length - 1, 1, `${file}: load the common profile type layer once`);
  assert.equal(html.split(sharedLayout).length - 1, 1, `${file}: load the shared profile geometry layer once`);
  assert(html.indexOf(sharedType) < html.indexOf(archiveLayer), `${file}: common type layer retains its cascade position`);
  assert(html.indexOf('../assets/css/page-canvas.css') < html.indexOf(sharedLayout), `${file}: geometry layer follows the page canvas`);
  if (expectedVariant) {
    assert.equal(html.split(expectedVariant).length - 1, 1, `${file}: preserve its documented responsive/CTA variant`);
    assert(html.indexOf(expectedVariant) < html.indexOf(archiveLayer), `${file}: variant remains before archive consistency`);
  } else {
    assert(!html.includes('pengxiao-layout.css') && !html.includes('qingguoxie-layout.css'), `${file}: do not acquire another profile's variant`);
  }
  assert.match(html, /<section class="team-detail-top">/, `${file}: shared section markup remains`);
  assert.doesNotMatch(html, /<section class="team-detail-top"[^>]*\sstyle=/, `${file}: no overridden inline spacing remains`);
  assert.equal((html.match(/<div class="team-detail-backdrop"><\/div>/g) || []).length, 1, `${file}: shared backdrop has an explicit semantic class`);
  assert.doesNotMatch(html, /07-bg-81ac28d2|team-detail-backdrop[^>]*style=/, `${file}: backdrop asset and geometry are not duplicated inline`);
  assert.match(html, /<div class="team-detail-photo"><\/div>/, `${file}: shared portrait frame remains present`);
  const portraitVariant = file.includes('LinWan') ? 'team-profile--lin-wan'
    : file.includes('Nicola') ? (file.endsWith('-cn.html') ? 'team-profile--nicola-cn' : 'team-profile--nicola')
      : file.includes('PengXiao') ? 'team-profile--peng-xiao'
        : file.includes('QingguoXie') ? 'team-profile--qingguo-xie' : 'team-profile--rui-zheng';
  assert.match(html, new RegExp(`<body class="team-profile-page ${portraitVariant}">`), `${file}: explicit portrait variant selects the correct shared asset`);
  assert.doesNotMatch(html, /class="team-detail-photo"[^>]*\sstyle=/, `${file}: portrait content has no inline style`);
  const info = html.match(/<div class="team-detail-info"([^>]*)>/);
  assert(info, `${file}: profile information content remains present`);
  assert.equal(info[1], '', `${file}: profile info container carries no redundant inline font or spacing`);
  if (file.endsWith('About-LinWan-cn.html')) {
    assert.equal((html.match(/class="team-detail-highlight"/g) || []).length, 1, `${file}: preserve the semantic highlight heading`);
    assert.doesNotMatch(html, /<h3[^>]*style=/, `${file}: highlight heading size should not be inline`);
  } else {
    assert(!html.includes('team-detail-highlight'), `${file}: keep the unique Chinese content style scoped`);
  }
  const legacyBasePath = html.match(/<a([^>]*)\bid="base-path"([^>]*)><\/a>/);
  if (file.includes('LinWan-cn') || file.includes('Ruizheng-')) {
    assert(legacyBasePath, `${file}: preserve the legacy base-path anchor`);
    assert.doesNotMatch(legacyBasePath[0], /\sstyle\s*=/, `${file}: shared CSS owns base-path visibility`);
  } else {
    assert.equal(legacyBasePath, null, `${file}: do not add the legacy base-path helper unnecessarily`);
  }
}

process.stdout.write(`PASS: ${profiles.length} bilingual researcher profiles rely on the shared team-detail layout for section spacing.\n`);
