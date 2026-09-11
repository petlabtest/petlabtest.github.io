import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const aboutRoot = path.join(websiteRoot, "About");
const stylesheet = "../assets/css/about-explore-nav.css?v=20260911-4";

const chapters = [
  {
    key: "about",
    image: "../assets/pic/root/media/2-3.jpg",
    cn: { title: "关于我们", alt: "关于我们" },
    en: { title: "About Us", alt: "About Us" },
  },
  {
    key: "mission",
    image: "../assets/pic/about/explore-nav/mission-v3.jpg",
    cn: { title: "使命愿景", alt: "使命愿景" },
    en: { title: "Our Mission", alt: "Our Mission" },
  },
  {
    key: "impact",
    image: "../assets/pic/about/explore-nav/impact-v2.jpg",
    cn: { title: "学术影响", alt: "学术影响" },
    en: { title: "Our Impact", alt: "Our Impact" },
  },
  {
    key: "history",
    image: "../assets/pic/about/explore-nav/history.jpg",
    cn: { title: "发展历程", alt: "发展历程" },
    en: { title: "Our History", alt: "Our History" },
  },
  {
    key: "leadership",
    image: "../assets/pic/about/explore-nav/leadership-v2.jpg",
    cn: { title: "领导团队", alt: "领导团队" },
    en: { title: "Leadership", alt: "Leadership" },
  },
];

function findMatchingDivEnd(source, start) {
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let match;

  while ((match = tags.exec(source))) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return tags.lastIndex;
  }

  throw new Error("Unbalanced About explore navigation container");
}

function renderNav(language, current) {
  const heading = language === "cn" ? "探索您感兴趣的内容" : "Explore What Interests You";
  const items = chapters.map((chapter) => {
    const state = chapter.key === current ? "ll-current-chapter" : "ll-ot";
    const copy = chapter[language];
    return `          <li class="${state}">
            <a href="About-${chapter.key}-${language}.html" class="ll-section-nav">
              <div class="ll-pub-bottom-nav-img">
                <img src="${chapter.image}" alt="${copy.alt}" loading="lazy">
              </div>
              <div class="ll-nav-text-side">
                <div class="ll-nav-title">${copy.title}</div>
              </div>
            </a>
          </li>`;
  }).join("\n");

  return `<div class="mitll-ll-pub-nav mitll-ll-pub-nav-chapters about-explore-section">
      <div class="mitll-ll-pub-nav-chapters-inner">
        <h3>${heading}</h3>
        <ul class="mitll-ll-pub-bottom-nav about-explore-nav">
${items}
        </ul>
      </div>
    </div>`;
}

let updated = 0;
for (const chapter of chapters) {
  for (const language of ["cn", "en"]) {
    const filePath = path.join(aboutRoot, `About-${chapter.key}-${language}.html`);
    let source = await readFile(filePath, "utf8");
    const heading = language === "cn" ? "探索您感兴趣的内容" : "Explore What Interests You";
    const headingAt = source.indexOf(heading);
    const navStart = source.lastIndexOf('<div class="mitll-ll-pub-nav mitll-ll-pub-nav-chapters', headingAt);
    if (headingAt === -1 || navStart === -1) throw new Error(`Missing explore navigation in ${filePath}`);
    const navEnd = findMatchingDivEnd(source, navStart);
    source = source.slice(0, navStart) + renderNav(language, chapter.key) + source.slice(navEnd);

    if (!source.includes("about-explore-nav.css")) {
      const link = `  <link rel="stylesheet" href="${stylesheet}">\n`;
      const canvasAt = source.indexOf('  <link rel="stylesheet" href="../assets/css/page-canvas.css');
      const insertAt = canvasAt === -1 ? source.search(/<\/head\s*>/i) : canvasAt;
      source = source.slice(0, insertAt) + link + source.slice(insertAt);
    } else {
      source = source.replace(
        /\.\.\/assets\/css\/about-explore-nav\.css\?v=[^"']+/,
        stylesheet,
      );
    }

    await writeFile(filePath, source);
    updated += 1;
  }
}

console.log(`Synchronized About explore navigation across ${updated} pages.`);
