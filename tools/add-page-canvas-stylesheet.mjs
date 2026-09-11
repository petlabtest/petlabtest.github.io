import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stylesheet = path.join(websiteRoot, "assets/css/page-canvas.css");
const version = "20260911-1";

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (
      entry.name === ".git" ||
      entry.name === "assets" ||
      (directory === websiteRoot && entry.name === "components")
    ) continue;

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectHtmlFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(entryPath);
    }
  }

  return files;
}

const htmlFiles = await collectHtmlFiles(websiteRoot);
let updated = 0;

for (const htmlFile of htmlFiles) {
  const source = await readFile(htmlFile, "utf8");
  if (source.includes("page-canvas.css")) continue;

  const headClose = source.search(/<\/head\s*>/i);
  if (headClose === -1) {
    throw new Error(`Missing </head> in ${path.relative(websiteRoot, htmlFile)}`);
  }

  const href = path.relative(path.dirname(htmlFile), stylesheet).split(path.sep).join("/");
  const link = `  <link rel="stylesheet" href="${href}?v=${version}">\n`;
  const output = source.slice(0, headClose) + link + source.slice(headClose);
  await writeFile(htmlFile, output);
  updated += 1;
}

console.log(`Updated ${updated} of ${htmlFiles.length} HTML files.`);
