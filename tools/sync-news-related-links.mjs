import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsDir = path.join(siteRoot, 'News', 'List');

const translations = new Map([
  ['科学研究', 'Research'],
  ['科研合作', 'Research Collaboration'],
  ['新闻报道', 'News Coverage'],
  ['新仪器与新系统', 'Novel Instruments and Systems'],
  ['医学科学', 'Medical Science'],
  ['学术影响', 'Academic Impact'],
  ['多电压阈值技术', 'Multi-Voltage Threshold Technology'],
  ['合作伙伴', 'Partners'],
  ['重点专项', 'Key Initiatives'],
  ['学生教育', 'Education Opportunities'],
  ['粒子探测模块', 'Modularized Particle Detectors'],
  ['职业发展', 'Career Opportunities'],
  ['领导团队', 'Leadership'],
  ['极弱光探测芯片', 'Chips for Ultra-Weak Light Detection'],
  ['研究论文', 'Publications'],
  ["Nicola D'Ascenzo", "Nicola D'Ascenzo"],
  ['图像重建', 'Image Reconstruction'],
  ['研究项目', 'Research Projects'],
  ['研究小组', 'Research Groups'],
  ['发展理念', 'Development Philosophy'],
  ['发展历程', 'History'],
  ['PETLab生活', 'PETLab Life'],
  ['闪烁晶体', 'Scintillation Crystals'],
  ['Plug-n-Image', 'Plug-n-Image'],
  ['本科实践项目', 'Undergraduate Practice Program'],
  ['核科学', 'Nuclear Science'],
]);

const sectionPattern = /(<div class="tagged-as__label"[^>]*>)[\s\S]*?(<\/div>\s*<div class="tagged-as__tags"[^>]*>\s*)<ul>[\s\S]*?<\/ul>/;
const linkPattern = /<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

let changed = 0;
for (let page = 1; page <= 80; page += 1) {
  const cnFile = path.join(newsDir, `News-page${page}-cn.html`);
  const enFile = path.join(newsDir, `News-page${page}-en.html`);
  const cn = fs.readFileSync(cnFile, 'utf8');
  const en = fs.readFileSync(enFile, 'utf8');
  const cnSection = cn.match(sectionPattern)?.[0];
  const enSection = en.match(sectionPattern)?.[0];
  if (!cnSection || !enSection) throw new Error(`Missing Tags section in page ${page}`);

  const links = [...cnSection.matchAll(linkPattern)].map((match) => {
    const label = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const translated = translations.get(label);
    if (!translated) throw new Error(`Missing translation for "${label}" in page ${page}`);
    return { href: match[1].replace(/-cn\.html(?=([?#]|$))/, '-en.html'), label: translated };
  });

  const listIndent = enSection.match(/\n([ \t]*)<ul>/)?.[1] ?? '  ';
  const itemIndent = `${listIndent}  `;
  const list = [
    '<ul>',
    ...links.map(({ href, label }) => `${itemIndent}<li><a href="${href}">${label}</a></li>`),
    `${listIndent}</ul>`,
  ].join('\n');
  const replacement = enSection.replace(sectionPattern, `$1Tags$2${list}`);
  const updated = en.replace(enSection, replacement);
  if (updated !== en) {
    fs.writeFileSync(enFile, updated);
    changed += 1;
  }
}

process.stdout.write(`${JSON.stringify({ pairedPages: 80, changedEnglishPages: changed }, null, 2)}\n`);
