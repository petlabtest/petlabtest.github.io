import assert from 'node:assert/strict';
import fs from 'node:fs';

const href = '../assets/css/about/impact-page-layout.css?v=20260930-shared7';
const css = fs.readFileSync('assets/css/about/impact-page-layout.css', 'utf8');
assert.match(css, /body\.page-impact>#main-content>\.ll-pub-section\.ll-background-light-blue \.ll-image-w-title \.ll-text-side p\s*\{\s*min-height:\s*4rem;\s*font-size:\s*1\.25rem;/);
assert.match(css, /body\.page-impact>#main-content>\.ll-pub-section\.ll-background-light-blue \.ll-num-title h3\s*\{\s*font-size:\s*56px;/);
assert.match(css, /@media\s*\(max-width:\s*549px\)[\s\S]*?\.page-impact>#main-content>\.ll-pub-section\.ll-background-light-blue \.ll-num-text h3\s*\{\s*font-size:\s*32px !important;/, 'narrow title override remains 32px');

let total = 0;
const summaries = {
  cn: ['中国科学院和中国工程院院士评选', '生物医学工程领域最高奖', '医学研究与临床转化突破', '中央电视台、科技部', '数字 PET 领域第一个'],
  en: ['Academician selection of the', 'The highest award in biomedical', 'Breakthroughs in traditional', 'Annual selection by China', 'The first in the field of'],
};
for (const language of ['cn', 'en']) {
  const file = `About/About-impact-${language}.html`;
  const html = fs.readFileSync(file, 'utf8');
  assert(summaries[language].every((summary) => html.includes(summary)), `${file}: retain five localized award-card summaries`);
  assert.equal((html.match(/<p style="font-size: 1\.25rem; min-height: 4rem;">/g) || []).length, 0, `${file}: repeated summary declarations are externalized`);
  const heading = language === 'cn' ? '<h1 class="about-hero-title">社会影响</h1>' : '<h1 class="about-hero-title">Social Impact</h1>';
  assert(html.includes(heading), `${file}: preserve the language-specific shared Hero title`);
  assert(!html.includes(`${heading.slice(0, 3)} style=`), `${file}: impact title should not carry inline presentation`);
  assert.equal(html.split(href).length - 1, 1, `${file}: shared owner loads exactly once`);
  total += summaries[language].length;
}

assert.equal(total, 10, 'all ten bilingual summaries are covered');
process.stdout.write('PASS: 10 About Impact bilingual summaries inherit their font size and minimum height from the shared page layer.\n');
