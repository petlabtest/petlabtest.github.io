import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excludedDirectories = new Set(['.git', 'components', 'Replicate']);
const contractPath = path.join(root, 'assets/css/typography-contract.css');
const canvasPath = path.join(root, 'assets/css/page-canvas.css');
const aboutExplorePath = path.join(root, 'assets/css/about-explore-nav.css');
const teamStandardPath = path.join(root, 'assets/css/about/team-page-standard.css');
const newsOverviewStylesheet = 'assets/css/news/news-overview-typography.css';
const newsContentStylesheet = 'assets/css/news/news-content-typography.css';
const researchStylesheet = 'assets/css/research/research-typography.css';
const peopleStylesheet = 'assets/css/people/people-typography.css';
const engageStylesheet = 'assets/css/engage/engage-typography.css';
const capabilitiesStylesheet = 'assets/css/capabilities/capabilities-typography.css';
const givingStylesheet = 'assets/css/giving/giving-typography.css';
const homepageStylesheet = 'assets/css/home/home-typography.css';
const searchStylesheet = 'assets/css/search/search-typography.css';
const searchPages = ['search-cn.html', 'search.html'];
const newsOverviewPages = [
  'News/News-ov-cn.html',
  'News/News-ov-en.html',
];
const homepagePages = ['index-cn.html', 'index.html'];
const fontPaths = [
  path.join(root, 'assets/fonts/root/media/r024.woff2'),
  path.join(root, 'assets/fonts/root/media/r025.woff2'),
  path.join(root, 'assets/fonts/root/media/r026.woff2'),
  path.join(root, 'assets/fonts/root/media/r027.woff'),
  path.join(root, 'assets/fonts/noto-sans-sc/NotoSansSC-Regular.woff2'),
  path.join(root, 'assets/fonts/noto-sans-sc/NotoSansSC-Bold.woff2'),
];

function walk(directory, includeExcluded = false) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!includeExcluded && entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute, includeExcluded));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

const contentFiles = walk(root).filter(file => path.extname(file).toLowerCase() === '.html');
const aboutPages = contentFiles.filter(file => relative(file).startsWith('About/'));
const researchPages = contentFiles.filter(file => relative(file).startsWith('Research/'));
const peoplePages = contentFiles.filter(file => relative(file).startsWith('People/'));
const engagePages = contentFiles.filter(file => relative(file).startsWith('Engage/'));
const capabilitiesPages = contentFiles.filter(file => relative(file).startsWith('Capabilities/'));
const givingPages = contentFiles.filter(file => relative(file).startsWith('Giving/'));
const newsPages = contentFiles.filter(file => relative(file).startsWith('News/'));
const newsContentPages = newsPages.filter(file => !newsOverviewPages.includes(relative(file)));
const missingCanvas = [];
const directRemoteFontLinks = [];
const uncoveredAboutPages = [];
const uncoveredResearchPages = [];
const uncoveredPeoplePages = [];
const uncoveredEngagePages = [];
const uncoveredCapabilitiesPages = [];
const uncoveredGivingPages = [];
const uncoveredNewsContentPages = [];

for (const file of contentFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (!/page-canvas\.css(?:[?"'])/i.test(content)) missingCanvas.push(relative(file));
  if (/<(?:link|style)\b[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com|font\.im)/is.test(content)) {
    directRemoteFontLinks.push(relative(file));
  }
  if (relative(file).startsWith('About/')
      && !/(?:about-explore-nav|team-page-standard)\.css(?:[?"'])/i.test(content)) {
    uncoveredAboutPages.push(relative(file));
  }
  if (relative(file).startsWith('Research/')
      && !/research\/research-typography\.css(?:[?"'])/i.test(content)) {
    uncoveredResearchPages.push(relative(file));
  }
  if (relative(file).startsWith('People/')
      && !/people\/people-typography\.css(?:[?"'])/i.test(content)) {
    uncoveredPeoplePages.push(relative(file));
  }
  if (relative(file).startsWith('Engage/')
      && !/engage\/engage-typography\.css(?:[?"'])/i.test(content)) {
    uncoveredEngagePages.push(relative(file));
  }
  if (relative(file).startsWith('Capabilities/')
      && !/capabilities\/capabilities-typography\.css(?:[?"'])/i.test(content)) {
    uncoveredCapabilitiesPages.push(relative(file));
  }
  if (relative(file).startsWith('Giving/')
      && !/giving\/giving-typography\.css(?:[?"'])/i.test(content)) {
    uncoveredGivingPages.push(relative(file));
  }
  if (relative(file).startsWith('News/')
      && !newsOverviewPages.includes(relative(file))
      && !/news\/news-content-typography\.css(?:[?"'])/i.test(content)) {
    uncoveredNewsContentPages.push(relative(file));
  }
}

const cssFiles = walk(path.join(root, 'assets/css'), true)
  .filter(file => path.extname(file).toLowerCase() === '.css');
const legacyRemoteCss = cssFiles.filter(file =>
  /(?:fonts\.googleapis\.com|fonts\.gstatic\.com|font\.im)/i.test(fs.readFileSync(file, 'utf8'))
).map(relative).sort();

const contract = fs.existsSync(contractPath) ? fs.readFileSync(contractPath, 'utf8') : '';
const canvas = fs.existsSync(canvasPath) ? fs.readFileSync(canvasPath, 'utf8') : '';
const aboutExplore = fs.existsSync(aboutExplorePath) ? fs.readFileSync(aboutExplorePath, 'utf8') : '';
const teamStandard = fs.existsSync(teamStandardPath) ? fs.readFileSync(teamStandardPath, 'utf8') : '';
const contractChecks = {
  importedByCanvas: /@import\s+url\(["']\.\/typography-contract\.css["']\)/.test(canvas),
  regularFace: /NotoSansSC-Regular\.woff2/.test(contract) && /font-weight:\s*100 500/.test(contract),
  boldFace: /NotoSansSC-Bold\.woff2/.test(contract) && /font-weight:\s*600 900/.test(contract),
  sharedStack: /--font-family-sans:/.test(contract),
  chineseDefault: /html:lang\(zh\) body/.test(contract),
  localPoppins: /font-family:\s*"Poppins Local"/.test(contract)
    && /r024\.woff2/.test(contract)
    && /r025\.woff2/.test(contract)
    && /r026\.woff2/.test(contract),
  localLegacyAliases: /font-family:\s*"Noto Sans SC"/.test(contract)
    && /font-family:\s*"Roboto Condensed"/.test(contract)
    && /font-family:\s*"Cardo"/.test(contract),
};
const familyContractChecks = {
  aboutExploreImportsTypography: /@import\s+url\(["']\.\/about\/about-typography\.css(?:\?[^"']*)?["']\)/.test(aboutExplore),
  teamProfilesImportTypography: /@import\s+url\(["']\.\/about-typography\.css(?:\?[^"']*)?["']\)/.test(teamStandard),
  allAboutPagesCovered: uncoveredAboutPages.length === 0,
  newsOverviewPagesLoadTypography: newsOverviewPages.every(file => {
    const absolute = path.join(root, file);
    return fs.existsSync(absolute)
      && /news\/news-overview-typography\.css(?:[?"'])/i.test(fs.readFileSync(absolute, 'utf8'));
  }),
  newsOverviewStylesheetExists: fs.existsSync(path.join(root, newsOverviewStylesheet)),
  allNewsContentPagesCovered: uncoveredNewsContentPages.length === 0,
  newsContentStylesheetExists: fs.existsSync(path.join(root, newsContentStylesheet)),
  allResearchPagesCovered: uncoveredResearchPages.length === 0,
  researchStylesheetExists: fs.existsSync(path.join(root, researchStylesheet)),
  allPeoplePagesCovered: uncoveredPeoplePages.length === 0,
  peopleStylesheetExists: fs.existsSync(path.join(root, peopleStylesheet)),
  allEngagePagesCovered: uncoveredEngagePages.length === 0,
  engageStylesheetExists: fs.existsSync(path.join(root, engageStylesheet)),
  allCapabilitiesPagesCovered: uncoveredCapabilitiesPages.length === 0,
  capabilitiesStylesheetExists: fs.existsSync(path.join(root, capabilitiesStylesheet)),
  allGivingPagesCovered: uncoveredGivingPages.length === 0,
  givingStylesheetExists: fs.existsSync(path.join(root, givingStylesheet)),
  homepagePagesLoadTypography: homepagePages.every(file => {
    const absolute = path.join(root, file);
    return fs.existsSync(absolute)
      && /home\/home-typography\.css(?:[?"'])/i.test(fs.readFileSync(absolute, 'utf8'));
  }),
  homepageStylesheetExists: fs.existsSync(path.join(root, homepageStylesheet)),
  searchPagesLoadTypography: searchPages.every(file => {
    const absolute = path.join(root, file);
    return fs.existsSync(absolute)
      && /search\/search-typography\.css(?:[?"'])/i.test(fs.readFileSync(absolute, 'utf8'));
  }),
  searchStylesheetExists: fs.existsSync(path.join(root, searchStylesheet)),
  homepageHasNoInlineFontFaces: homepagePages.every(file => {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    return !/<style[^>]*>[\s\S]*?@font-face[\s\S]*?<\/style>/i.test(content);
  }),
};
const fonts = fontPaths.map(file => ({
  file: relative(file),
  exists: fs.existsSync(file),
  bytes: fs.existsSync(file) ? fs.statSync(file).size : 0,
}));

const report = {
  contentPages: contentFiles.length,
  aboutPages: aboutPages.length,
  researchPages: researchPages.length,
  peoplePages: peoplePages.length,
  engagePages: engagePages.length,
  capabilitiesPages: capabilitiesPages.length,
  givingPages: givingPages.length,
  newsPages: newsPages.length,
  newsContentPages: newsContentPages.length,
  pagesMissingSharedCanvas: missingCanvas,
  directRemoteFontLinks,
  legacyCssFilesWithRemoteFontSources: legacyRemoteCss,
  contractChecks,
  familyContractChecks,
  uncoveredAboutPages,
  uncoveredResearchPages,
  uncoveredPeoplePages,
  uncoveredEngagePages,
  uncoveredCapabilitiesPages,
  uncoveredGivingPages,
  uncoveredNewsContentPages,
  newsOverviewPages,
  homepagePages,
  fonts,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

const failed = missingCanvas.length > 0
  || directRemoteFontLinks.length > 0
  || legacyRemoteCss.length > 0
  || Object.values(contractChecks).some(value => !value)
  || Object.values(familyContractChecks).some(value => !value)
  || fonts.some(font => !font.exists || (font.file.includes('noto-sans-sc') ? font.bytes < 1_000_000 : font.bytes < 5_000));

if (failed) process.exitCode = 1;
