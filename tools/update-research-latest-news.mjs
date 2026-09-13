import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const researchRoot = path.join(websiteRoot, "Research");
const stylesheetHref = "../assets/css/research-latest-news.css?v=20260911-3";

const assignments = {
  "Research-Core": ["News-index1", "News-index2", "News-page19"],
  "Research-Initiatives": ["News-page1", "News-page4", "News-page57"],
  "Research-Tech-Crystals": ["News-page9", "News-page12", "News-page76"],
  "Research-Tech-Chips": ["News-page2", "News-index1", "News-page25"],
  "Research-Tech-Detectors": ["News-page11", "News-page46", "News-page75"],
  "Research-Tech-Imaging": ["News-page8", "News-page10", "News-page3"],
  "Research-Tech-Instruments": ["News-page3", "News-page18", "News-page20"],
  "Research-Tech-PnI": ["News-page10", "News-index1", "News-page8"],
  "Research-Medical": ["News-page3", "News-page14", "News-page5"],
  "Research-Medical-Page1": ["News-page47", "News-page50", "News-page64"],
  "Research-Medical-Page2": ["News-page14", "News-page3", "News-page8"],
  "Research-Medical-Page3": ["News-page3", "News-page5", "News-page22"],
  "Research-Medical-Page4": ["News-page5", "News-page8", "News-page60"],
  "Research-Medical-Page5": ["News-page14", "News-page10", "News-page5"],
  "Research-Medical-Page6": ["News-page47", "News-page8", "News-page60"],
  "Research-Medical-Page7": ["News-page60", "News-page8", "News-page2"],
  "Research-Nuclear": ["News-index2", "News-page61", "News-page75"],
  "Research-Nuclear-Page1": ["News-index2", "News-page75", "News-page76"],
  "Research-Nuclear-Page2": ["News-index2", "News-page66", "News-page80"],
  "Research-Nuclear-Page3": ["News-page61", "News-page11", "News-page46"],
  "Research-Nuclear-Page4": ["News-page61", "News-page30", "News-page80"],
  "Research-Nuclear-Page5": ["News-index2", "News-page2", "News-page20"],
  "Research-Pharmaceutical": ["News-page60", "News-page8", "News-page14"],
  "Research-Pharmaceutical-Page1": ["News-page60", "News-page8", "News-page18"],
  "Research-Pharmaceutical-Page2": ["News-page60", "News-page8", "News-page10"],
  "Research-Pharmaceutical-Page3": ["News-page60", "News-page8", "News-page3"],
  "Research-Pharmaceutical-Page4": ["News-page60", "News-page1", "News-page48"],
  "Research-Pharmaceutical-Page5": ["News-page60", "News-page15", "News-page22"],
  "Research-Physics": ["News-index2", "News-page75", "News-page80"],
  "Research-Physics-Page1": ["News-index2", "News-page66", "News-page76"],
  "Research-Physics-Page2": ["News-index2", "News-page2", "News-page80"],
  "Research-Physics-Page3": ["News-index2", "News-page75", "News-page66"],
  "Research-Physics-Page4": ["News-index2", "News-page61", "News-page80"],
  "Research-Physics-Page5": ["News-index2", "News-page75", "News-page2"],
};

function cleanText(value) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function requireMatch(source, pattern, label) {
  const match = source.match(pattern);
  if (!match) throw new Error(`Could not extract ${label}`);
  return match[1].trim();
}

function withoutYear(date, language) {
  const isoDate = date.match(/^\s*\d{4}-(\d{2})-(\d{2})\s*$/);
  if (isoDate) {
    const month = Number(isoDate[1]);
    const day = Number(isoDate[2]);
    if (language === "cn") return `${month}月${day}日`;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${monthNames[month - 1]} ${day}`;
  }

  if (language === "cn") {
    return date
      .replace(/^\s*\d{4}年\s*/, "")
      .replace(/^0(?=\d月)/, "")
      .replace(/月0(?=\d日)/, "月");
  }

  return date
    .replace(/,\s*\d{4}\s*$/, "")
    .replace(/\s+\d{4}\s*$/, "");
}

function extractNewsCatalog(source, language) {
  const catalog = new Map();
  const sections = source.split(/<div class="views-row" data-news-index="[^"]+">/).slice(1);

  for (const section of sections) {
    const href = section.match(/<h2[\s\S]*?<a\s+href="List\/(News-(?:index|page)\d+)-(?:cn|en)\.html"[^>]*>/);
    if (!href) continue;

    const key = href[1];
    const titleHtml = requireMatch(
      section,
      /<h2[\s\S]*?<a\s+href="[^"]+"[^>]*>([\s\S]*?)<span><\/span><\/a>/,
      `${key} title`,
    ).replace(/\s+/g, " ").trim();

    catalog.set(key, {
      href: `../News/List/${key}-${language}.html`,
      image: requireMatch(section, /<img[^>]+src="([^"]+)"/, `${key} image`),
      titleHtml,
      titleText: cleanText(titleHtml),
      date: requireMatch(
        section,
        /field--name-field-news-date[^>]*>[\s\n]*([^<]+)<\/div>/,
        `${key} date`,
      ),
      source: requireMatch(section, /<div class="news-source">([\s\S]*?)<\/div>/, `${key} source`),
      summary: requireMatch(
        section,
        /field--name-dpet-news-featured-summary[\s\S]*?<p>([\s\S]*?)<\/p>/,
        `${key} summary`,
      ).trim(),
    });
  }

  return catalog;
}

function findMatchingDivEnd(source, start) {
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let match;

  while ((match = tags.exec(source))) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return tags.lastIndex;
  }

  throw new Error("Unbalanced Latest News container");
}

function renderCard(item, language) {
  const hreflang = language === "cn" ? "zh-CN" : "en";
  const alt = item.titleText.replaceAll('"', "&quot;");

  return `                            <div class="views-row">
                              <div class="node node--type-news node--view-mode-_-up">
                                <div class="field field--name-field-news-er-image field--type-entity-reference field--label-hidden field__item">
                                  <article class="media media--type-image media--view-mode-news-3-up">
                                    <div class="field field--name-field-image field--type-image field--label-hidden field__item">
                                      <a href="${item.href}" hreflang="${hreflang}">
                                        <img loading="lazy" src="${item.image}" width="320" height="320" alt="${alt}" typeof="foaf:Image" class="image-style-news-3-up">
                                      </a>
                                    </div>
                                  </article>
                                </div>
                                <div class="field field--name-node-title field--type-ds field--label-hidden field__item">
                                  <h3 class="link--animated" data-once="append-span">
                                    <a href="${item.href}" hreflang="${hreflang}">${item.titleHtml}<span></span></a><span></span>
                                  </h3>
                                </div>
                                <div class="group-info">
                                  <div class="field field--name-field-news-date field--type-datetime field--label-hidden field__item">${withoutYear(item.date, language)}</div>
                                  <div class="news-source">${item.source}</div>
                                </div>
                                <div class="field field--name-dpet-news-featured-summary field--type-ds field--label-hidden field__item">
                                  <p>${item.summary}</p>
                                </div>
                              </div>
                            </div>`;
}

function renderSection(items, language) {
  const heading = language === "cn" ? "最新新闻" : "Latest News";
  const cta = language === "cn" ? "更多新闻" : "More News";
  const overview = language === "cn" ? "../News/News-list-cn.html" : "../News/News-list-en.html";

  return `<div class="paragraph paragraph--type-p-news3up paragraph--view-mode-full research-latest-news js-animate">
                    <h2 class="p-news3up__header">${heading}</h2>
                    <div class="p-news3up__content">
                      <div class="views-element-container">
                        <div class="view view-news-blocks view-id-news_blocks view-display-id-3up_rdgroup">
                          <div class="view-content">
${items.map((item) => renderCard(item, language)).join("\n\n")}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="slider-wrapper"><div class="slider-content"></div></div>
                    <div class="p-news3up__cta"><a href="${overview}" class="cta--button">${cta}</a></div>
                  </div>`;
}

const catalogs = {};
for (const language of ["cn", "en"]) {
  const listPath = path.join(websiteRoot, "News", `News-list-${language}.html`);
  catalogs[language] = extractNewsCatalog(await readFile(listPath, "utf8"), language);
}

let updated = 0;
async function updatePage(fileName, language, newsKeys) {
  const filePath = path.join(researchRoot, fileName);
  let source = await readFile(filePath, "utf8");
  const heading = language === "cn" ? "最新新闻" : "Latest News";
  const headingAt = source.indexOf(`<h2 class="p-news3up__header">${heading}</h2>`);
  const sectionStart = source.lastIndexOf('<div class="paragraph paragraph--type-p-news3up', headingAt);
  if (headingAt === -1 || sectionStart === -1) throw new Error(`Missing Latest News section in ${filePath}`);
  const sectionEnd = findMatchingDivEnd(source, sectionStart);
  const items = newsKeys.map((key) => {
    const item = catalogs[language].get(key);
    if (!item) throw new Error(`Missing ${language} catalog entry ${key}`);
    return item;
  });

  source = source.slice(0, sectionStart) + renderSection(items, language) + source.slice(sectionEnd);
  if (!source.includes("research-latest-news.css")) {
    const link = `  <link rel="stylesheet" href="${stylesheetHref}">\n`;
    const canvasLink = source.indexOf("  <link rel=\"stylesheet\" href=\"../assets/css/page-canvas.css");
    const insertAt = canvasLink === -1 ? source.search(/<\/head\s*>/i) : canvasLink;
    source = source.slice(0, insertAt) + link + source.slice(insertAt);
  } else {
    source = source.replace(
      /\.\.\/assets\/css\/research-latest-news\.css\?v=[^"']+/,
      stylesheetHref,
    );
  }

  await writeFile(filePath, source);
  updated += 1;
}

for (const [baseName, newsKeys] of Object.entries(assignments)) {
  for (const language of ["cn", "en"]) {
    await updatePage(`${baseName}-${language}.html`, language, newsKeys);
  }
}

await updatePage(
  "Research-physics-template.html",
  "en",
  ["News-index2", "News-page75", "News-page80"],
);

console.log(`Updated ${updated} Research pages with topic-specific Latest News cards.`);
