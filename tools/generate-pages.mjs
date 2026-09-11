import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.resolve(root, '../Document/Content/v2_content_v3.md');
const source = fs.readFileSync(sourcePath, 'utf8').replace(/\r/g, '');

const slugMap = new Map([
  ['Home','index.html'],['About','about.html'],['Mission','mission.html'],['Impact','impact.html'],['History','history.html'],['Leadership','leadership.html'],['Partner','partners.html'],
  ['Research','research.html'],['kernel methods','kernel-methods.html'],['Key Initiatives','key-initiatives.html'],['Research Roadmap','research-roadmap.html'],['Scintillation Crystals','scintillation-crystals.html'],['Chips for Ultra-Weak Light Detection','ultra-weak-light-chips.html'],['Modularized Particle Detectors','particle-detectors.html'],['Plug-n-Image','plug-n-image.html'],['Novel Instruments and Systems','instruments-systems.html'],['Nuclear Science','nuclear-science.html'],['Life Science','life-science.html'],['Drug Development','drug-development.html'],['Innovative System Application Exploration','cutting-edge-applications.html'],['Collaboration','collaboration.html'],['Publication','publication.html'],
  ['Facility','facility.html'],['Platform','platform.html'],['Instrumentation','instrumentation.html'],['Access','access.html'],['Talent Development','talent-development.html'],['Educational Opportunities','education.html'],['Career opportunities','careers.html'],['Laboratory Life','laboratory-life.html'],['News & Events','news-events.html'],['Giving','giving.html'],['Contact','contact.html'],['Visit','visit.html'],
  ['News1','news-1.html'],['News2','news-2.html'],['News3','news-3.html'],['News4','news-4.html'],['News5','news-5.html'],['News6','news-6.html'],['News7','news-7.html'],['News8','news-8.html']
]);

const titleDisplay = new Map([
  ['kernel methods','Kernel Methods'],['Partner','Partners'],['Career opportunities','Career Opportunities'],['Innovative System Application Exploration','Cutting-Edge Applications']
]);

const heroFallback = new Map([
  ['Mission','assets/pic/archive-news/1.jpg'],['Impact','assets/pic/webarchive_research_achievements/images/team/team-achievements/bg.jpg'],['History','assets/pic/About/ov/about_ov_history.jpg'],['Leadership','assets/pic/Research/tech5/sys1.jpg'],['Partner','assets/pic/About/Partner/about-ov-partner.png'],
  ['kernel methods','assets/pic/Research/kernel/1.jpg'],['Key Initiatives','assets/pic/Research/tech5/sys1.jpg'],['Research Roadmap','assets/pic/Research/tech5/sys1.jpg'],['Scintillation Crystals','assets/pic/Research/tech1/1.jpg'],['Chips for Ultra-Weak Light Detection','assets/pic/Research/tech2/1.jpg'],['Modularized Particle Detectors','assets/pic/Research/tech3/1.jpg'],['Plug-n-Image','assets/pic/Research/tech4/1.jpg'],['Novel Instruments and Systems','assets/pic/Research/tech5/sys1.jpg'],['Nuclear Science','assets/pic/Research/sci3/hero.jpg'],['Life Science','assets/pic/Research/sci1/hero.gif'],['Drug Development','assets/pic/Research/sci2/hero.jpg'],['Innovative System Application Exploration','assets/pic/root/media/1.jpg'],['Collaboration','assets/pic/Research/Collaboration/hero.jpg'],['Publication','assets/pic/Research/publish/cover.png'],
  ['Facility','assets/pic/Infrastructure/facility/f1.jpg'],['Platform','assets/pic/Research/tech1/2.jpg'],['Instrumentation','assets/pic/main/hero2.jpg'],['Access','assets/pic/Infrastructure/ov/bg-stars.jpg'],['Talent Development','assets/pic/People/people_hero.jpg'],['Educational Opportunities','assets/pic/People/Philosophy/team.jpg'],['Career opportunities','assets/pic/Research/tech5/sys8.jpg'],['Laboratory Life','assets/pic/People/life/4.jpg'],['News & Events','assets/pic/news/events.png'],['Giving','assets/pic/giving/dona1.jpg'],['Contact','assets/pic/contact/2.jpg'],['Visit','assets/pic/contact/1.png']
]);

function esc(value='') { return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function clean(value='') { return value.trim().replace(/；/g,';').replace(/\s+;/g,';').replace(/\s{2,}/g,' '); }
function asset(src) { return src.startsWith('pic/') ? `assets/${src}` : src.startsWith('media/') ? `assets/${src}` : src; }
function imageFrom(line) { const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/); return match ? { alt: clean(match[1]) || 'Digital PET Laboratory', src: asset(match[2].trim()) } : null; }
function assetExists(src) { return src && !src.endsWith('/') && fs.existsSync(path.join(root, src)); }
function anchor(text) { return clean(text).toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

function splitPages(markdown) {
  const pages = new Map(); let current = null;
  for (const line of markdown.split('\n')) {
    const match = line.match(/^# ([^#].*?)\s*$/);
    if (match) { current = match[1].trim(); pages.set(current, []); }
    else if (current) pages.get(current).push(line);
  }
  return pages;
}

function parsePage(lines) {
  const sections = []; let current = { title:'Overview', level:2, lines:[] };
  for (const raw of lines) {
    const heading = raw.match(/^\s*(#{2,4})\s+(.+?)\s*$/);
    if (heading && heading[1].length === 2) {
      if (current.lines.some(line => line.trim())) sections.push(current);
      current = { title:clean(heading[2]), level:2, lines:[] };
    } else current.lines.push(raw);
  }
  if (current.lines.some(line => line.trim())) sections.push(current);
  return sections;
}

function meaningful(line) {
  const text = clean(line);
  return text && !/^reference\d*\s*:/i.test(text) && text !== 'reference' && !/^content can be found in/i.test(text) && !/^parse this picture/i.test(text) && !/^\[(list|three times)\]$/i.test(text) && text !== '...' && text !== '-';
}

function inlineText(text) {
  return esc(clean(text)).replace(/\b(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noreferrer">$1</a>');
}

function renderLines(lines, pageName) {
  let html = ''; let list = null;
  const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
  for (let i=0;i<lines.length;i++) {
    const raw = lines[i]; const text = clean(raw);
    if (!meaningful(raw)) continue;
    const heading = raw.match(/^\s*(#{3,4})\s+(.+?)\s*$/);
    if (heading) { closeList(); const level = heading[1].length; html += `<h${level}>${inlineText(heading[2])}</h${level}>`; continue; }
    const img = imageFrom(raw);
    if (img) { closeList(); if (assetExists(img.src)) html += `<figure class="content-image"><img src="${esc(img.src)}" alt="${esc(img.alt)}" loading="lazy"><figcaption>${esc(img.alt)}</figcaption></figure>`; continue; }
    const link = text.match(/^link>(.+)$/i);
    if (link) { closeList(); html += `<a class="text-link" href="${relatedLink(link[1], pageName)}">${inlineText(link[1])} <span aria-hidden="true">→</span></a>`; continue; }
    const bullet = text.match(/^[-•]\s+(.+)/);
    const numbered = text.match(/^\d+[.)]\s+(.+)/);
    if (bullet || numbered) {
      const wanted = numbered ? 'ol' : 'ul';
      if (list !== wanted) { closeList(); list = wanted; html += `<${list}>`; }
      html += `<li>${inlineText((bullet || numbered)[1])}</li>`; continue;
    }
    closeList();
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(text)) html += `<p class="eyebrow">${esc(text)}</p>`;
    else html += `<p>${inlineText(text)}</p>`;
  }
  closeList(); return html || '<p class="content-empty">Additional information will be published here.</p>';
}

function relatedLink(label, pageName) {
  const normalized = clean(label).toLowerCase();
  for (const [title,file] of slugMap) if (normalized.includes(title.toLowerCase()) || title.toLowerCase().includes(normalized)) return file;
  const defaults = { 'more publication':'publication.html','more facilities':'facility.html','view leadership':'leadership.html','contact us':'contact.html','see opportunities':'careers.html','learn more':'research.html','read more':'news-events.html' };
  return defaults[normalized] || '#';
}

function extractHero(pageName, sections) {
  const heroIndex = sections.findIndex(section => /hero/i.test(section.title));
  const section = heroIndex >= 0 ? sections[heroIndex] : sections[0];
  let heroImage = null; const lede = [];
  if (section) {
    for (const line of section.lines) {
      const img = imageFrom(line); if (!heroImage && assetExists(img?.src)) { heroImage = img.src; continue; }
      if (meaningful(line) && !/^link>/i.test(clean(line)) && !/^\s*#{3,4}/.test(line)) lede.push(clean(line));
    }
  }
  if (!heroImage) heroImage = heroFallback.get(pageName) || 'assets/pic/main/hero2.jpg';
  const sentence = lede.find(text => text.length > 18 && !/^\d+[.)]/.test(text)) || lede[0] || defaultLede(pageName);
  if (heroIndex >= 0) sections.splice(heroIndex,1);
  else if (section) section.lines = section.lines.filter(line => imageFrom(line)?.src !== heroImage);
  return { image:heroImage, lede:sentence };
}

function defaultLede(pageName) {
  const display = titleDisplay.get(pageName) || pageName;
  return `Explore ${display.toLowerCase()} at the Digital PET Laboratory.`;
}

function pageTemplate({title, description, heroImage, content, sectionLinks='', bodyClass=''}) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#003c62"><title>${esc(title)} | Digital PET Laboratory</title><meta name="description" content="${esc(description.slice(0,155))}"><link rel="icon" href="assets/pic/main/PETLAB_LOGO_Pure.png"><link rel="stylesheet" href="assets/css/site.css?v=20260804-118"><script src="assets/js/site.js?v=20260804-118" defer></script></head>
<body class="${bodyClass}" id="top"><div data-component="header"></div><main id="main-content" role="main">${content}</main><div data-component="footer"></div></body></html>`;
}

function genericPage(pageName, rawLines) {
  const title = titleDisplay.get(pageName) || pageName;
  const sections = parsePage(rawLines); const hero = extractHero(pageName, sections);
  const validSections = sections.filter(section => section.lines.some(meaningful));
  const links = validSections.length > 1 ? `<nav class="section-index" aria-label="On this page"><div class="shell section-index__inner">${validSections.map(s => `<a href="#${anchor(s.title)}">${esc(s.title)}</a>`).join('')}</div></nav>` : '';
  const sectionHtml = validSections.map(section => `<section class="content-section" id="${anchor(section.title)}"><div class="shell section-heading"><h2>${esc(section.title)}</h2><div class="section-body">${renderLines(section.lines,pageName)}</div></div></section>`).join('');
  const content = `<section class="page-hero page-hero--compact"><img class="page-hero__media" src="${esc(hero.image)}" alt="" fetchpriority="high"><div class="shell page-hero__content"><div class="breadcrumb"><a href="index.html">Home</a> / ${esc(title)}</div><h1>${esc(title)}</h1><p class="page-hero__lede">${esc(hero.lede)}</p></div></section>${links}${sectionHtml}`;
  return pageTemplate({title,description:hero.lede,heroImage:hero.image,content,sectionLinks:links,bodyClass:`page-${anchor(title)}`});
}

function homePage() {
  const content = `<section class="page_header home-carousel" aria-label="Homepage featured carousel">
    <div class="home-carousel__slide">
      <article class="home-carousel__wrapper active"><div class="home-carousel__media"><video autoplay muted loop playsinline poster="assets/pic/main/hero1.jpg"><source src="assets/video/index/media/5.mp4" type="video/mp4"></video></div><div class="home-carousel__copy"><p class="home-carousel__super-title">R &amp; D</p><h1 class="home-carousel__title">All-Digital PET, A Reinvention</h1><div class="home-carousel__cta"><a class="cta--button" href="kernel-methods.html">Explore the technology</a></div></div></article>
      <article class="home-carousel__wrapper"><div class="home-carousel__media"><img src="assets/pic/main/hero2.jpg" alt="PETLab researchers collaborating"></div><div class="home-carousel__copy"><p class="home-carousel__super-title">News</p><h1 class="home-carousel__title">Collaborating Wide-Range</h1><div class="home-carousel__cta"><a class="cta--button" href="collaboration.html">Work with us</a></div></div></article>
      <article class="home-carousel__wrapper"><div class="home-carousel__media"><img src="assets/pic/home/hero3.jpg" alt="PETLab researchers advancing innovation"></div><div class="home-carousel__copy"><p class="home-carousel__super-title">People</p><h1 class="home-carousel__title">How Our Elites Advance Innovation</h1><div class="home-carousel__cta"><a class="cta--button" href="talent-development.html">Meet our community</a></div></div></article>
      <article class="home-carousel__wrapper"><div class="home-carousel__media"><img src="assets/pic/home/hero3.jpg" alt="Digital PET research in practice"></div><div class="home-carousel__copy"><p class="home-carousel__super-title">Impact</p><h1 class="home-carousel__title">Impact to the World</h1><div class="home-carousel__cta"><a class="cta--button" href="impact.html">See our impact</a></div></div></article>
    </div>
    <div class="caption" aria-label="Carousel controls"><button class="carousel-arrow prev" type="button" aria-label="Previous story"></button><div class="dots" role="tablist" aria-label="Select featured story"></div><button class="carousel-arrow next" type="button" aria-label="Next story"></button></div>
  </section>
  <div class="page_content">
  <section class="paragraph paragraph--type-p-home-news paragraph--view-mode-full newshome--106 js-animate home-news" aria-labelledby="recent-news-title">
    <div class="home-news__inner">
      <section class="home-fullwidth__panel" aria-labelledby="home-mission-title"><p class="home-fullwidth__eyebrow">Our mission</p><h2 id="home-mission-title">Pioneering the uncharted.</h2><p>Dedicated to unraveling the origins of the universe, life, and consciousness, we advance scientific progress and safeguard human well-being through bold intellectual endeavor.</p><a class="home-fullwidth__cta cta--button" href="mission.html">Explore our mission</a></section>
      <div class="home-news__heading"><h2 class="p-home-news__header" id="recent-news-title">Recent News</h2></div>
      <div class="Topic-news-home">
        <article class="home-news__lead"><div class="home-news__lead-media"><a class="home-news__image-link" href="news-5.html" aria-label="Read Online Monitoring Proton Therapy's Camera System Upgraded"><img src="assets/pic/root/media/1.jpg" alt="Online proton therapy monitoring system"></a></div><div class="home-news__lead-copy"><p class="home-news__date"><span class="home-news__date-label">Sep 29</span> · Innovative Systems</p><h3><a class="home-news__title-link" href="news-5.html"><span>Online Monitoring Proton Therapy's “Camera System” Upgraded!</span><span class="home-news__read-cue" aria-hidden="true"><i></i><span>Read</span></span></a></h3><p>Proton Beam PET, a flagship innovation of the Digital PET 2.0 system, represents a key frontier being pursued by the research team.</p></div></article>
        <div class="home-news__list">
          <article class="home-news__item"><span class="home-news__list-date">Jul 22</span><div class="home-news__story"><span>Technological Development</span><h3><a class="home-news__title-link" href="news-6.html"><span>Equipping the “Photon Hunter” with “Magic Chips”: The New Generation of Standard CMOS Process Silicon Photomultipliers Is Here!</span><span class="home-news__read-cue" aria-hidden="true"><i></i><span>Read</span></span></a></h3></div></article>
          <article class="home-news__item"><span class="home-news__list-date">May 19</span><div class="home-news__story"><span>Innovative Systems</span><h3><a class="home-news__title-link" href="news-7.html"><span>All-Digital PET Welcomes New Flagship with 135-cm Axial Length, Enabling Single-Bed Whole-Body Scanning</span><span class="home-news__read-cue" aria-hidden="true"><i></i><span>Read</span></span></a></h3></div></article>
        </div>
        <div class="home-news__footer"><a class="home-news__more cta--button" href="news-events.html">Read More</a></div>
      </div>
    </div>
  </section>
  <section class="home-impact" aria-labelledby="home-impact-title">
    <div class="group-content">
      <figure class="group-content__media"><img src="assets/pic/main/main_mvt.jpg" alt="Multi-Voltage Threshold research technology"></figure>
      <div class="group-content__body"><h2 id="home-impact-title">Research for Core National Strategic Demands</h2><p>Since our founding in 2001, the Digital PET Laboratory has centered its research on national strategic priorities, key industrial bottlenecks, and major public health challenges. By building a full-chain innovation system covering basic research, technological innovation, clinical translation and industrial application, the Laboratory advances high-level sci-tech self-reliance and serves national strategic development.</p><a class="group-content__cta cta--button" href="impact.html">Our impact</a></div>
    </div>
  </section>
  <section class="research-cards" aria-labelledby="research-section-title">
    <div class="shell">
      <div class="research-cards__head"><p class="eyebrow">Research</p><h2 id="research-section-title">From photons to a clearer picture of life.</h2><p>The Digital PET Laboratory is implementing a foundational technology initiative to advance all digital PET innovation, facilitate the transition from General paradigm to application-specific systems and precision diagnosis and treatment, and continually expand the clinical and research frontiers of PET.</p></div>
      <div class="research-card-grid">
        <a class="research-card" href="research.html"><div class="research-card__media"><img src="assets/pic/main/hero2.jpg" alt="Digital PET research and development"></div><div class="research-card__content"><p class="eyebrow">Research &amp; Development</p><h3>Research &amp; Development</h3><p>The Digital PET Laboratory focuses on exploratory science and on key technologies including high-sensitivity detection, ultrahigh temporal resolution, and dynamic quantitative imaging. These advances substantially improve weak-signal detection and quantitative accuracy, providing a technological foundation for precision molecular imaging.</p><span class="research-card__link">Explore more <span aria-hidden="true">&#8594;</span></span></div></a>
        <a class="research-card" href="infrastructure.html"><div class="research-card__media"><img src="assets/pic/root/media/capabilities1.png" alt="Digital PET research capabilities"></div><div class="research-card__content"><p class="eyebrow">Capabilities</p><h3>Capabilities</h3><p>The Digital PET Laboratory is developing internationally leading research infrastructure to foster collaboration across the all digital PET ecosystem of academia, research, and industry. The infrastructure supports a standardized, rigorous, and traceable research system and enables continued exploration of scalable all digital PET applications.</p><span class="research-card__link">Explore more <span aria-hidden="true">&#8594;</span></span></div></a>
        <a class="research-card" href="leadership.html"><div class="research-card__media"><img src="assets/pic/Research/tech5/sys1.jpg" alt="Digital PET research teams"></div><div class="research-card__content"><p class="eyebrow">Teams</p><h3>Teams</h3><p>The Digital PET Laboratory brings together researchers in hardware, software, and applications to develop, test, and operate all digital PET systems and to explore application scenarios that capitalize on their performance advantages for both current and emerging needs.</p><span class="research-card__link">Explore more <span aria-hidden="true">&#8594;</span></span></div></a>
      </div>
    </div>
  </section>
  <section class="home-programs" aria-label="Laboratory initiatives and opportunities">
    <section class="home-programs__initiative" aria-labelledby="home-key-initiatives-title">
      <div class="shell home-programs__initiative-inner">
        <div class="home-programs__initiative-copy"><h2 id="home-key-initiatives-title">Key initiatives</h2><p>Guided by its mission and working with the broader research community, the Laboratory is advancing several core initiatives that integrate expertise and resources across disciplines. One such initiative applies the Laboratory's systems and technologies to proton-therapy monitoring.</p><a class="cta--button" href="key-initiatives.html">Proton therapy monitoring</a></div><img class="home-programs__initiative-accent" src="assets/pic/main/plug.png" alt="" aria-hidden="true">
      </div>
    </section>
    <section class="home-programs__collaboration" aria-labelledby="home-collaboration-title">
      <div class="shell home-programs__collaboration-inner">
        <div class="home-programs__collaboration-head" data-collab-reveal><h2 id="home-collaboration-title">Access our technology</h2><p>We offer opportunities to license, sponsor, and contribute to our research and development.</p></div>
        <div class="home-programs__collaboration-links">
          <a href="access.html" data-collab-reveal><strong>Available technologies</strong><span>Transferring our technology to the U.S. government and industry is key to our mission. We have technology available to license, open for collaboration, and accessible open-source.</span><span class="home-fullwidth__cta cta--button home-programs__collaboration-cta">Explore our catalog</span></a>
          <a href="collaboration.html" data-collab-reveal><strong>R&amp;D partners</strong><span>We work with government, industry, academia, and not-for-profits to develop technologies that meet national security needs.</span><span class="home-fullwidth__cta cta--button home-programs__collaboration-cta">Partner with us</span></a>
        </div>
      </div>
    </section>
    <section class="home-programs__engage home-engage-fullwidth" aria-labelledby="home-engage-title">
      <div class="group-content group-content--team">
        <figure class="group-content__media"><img src="assets/pic/Research/tech5/sys8.jpg" alt="Digital PET Laboratory team and research community"></figure>
        <div class="group-content__body">
          <h2 id="home-engage-title">Join Our Team</h2>
          <p>Solving the nation’s most difficult problems takes the combined talents and diverse views of many.</p>
          <h3>Careers</h3>
          <p>Our R&amp;D relies on creative, talented people who enjoy a challenge. If this describes you, visit our careers section to discover how you might join our team.</p>
          <a class="group-content__cta cta--button" href="careers.html">See opportunities</a>
          <h3>Laboratory Culture</h3>
          <p>Fostering a culture of belonging where everyone can contribute and thrive is vital to our mission.</p>
          <a class="group-content__cta cta--button" href="laboratory-life.html">Learn more</a>
        </div>
      </div>
    </section>
    <section class="home-programs__events home-events-fullwidth" aria-labelledby="home-events-title">
      <div class="group-content group-content--events">
        <figure class="group-content__media"><img src="assets/pic/main/events-main.png" alt="International academic exchange and events"></figure>
        <div class="group-content__body">
          <h2 id="home-events-title">Broaden global vision.</h2>
          <p>Our internationally engaged academic team offers opportunities to attend conferences, undertake academic exchanges, and broaden perspectives worldwide. Undergraduate and graduate students also have opportunities to compete for top awards in international academic and invention competitions.</p>
          <a class="group-content__cta cta--button" href="news-events.html">Learn more</a>
        </div>
      </div>
    </section>
  </section>


  </div>`;
  return pageTemplate({title:'Home',description:'Digital PET Laboratory — the origin of all-digital PET.',content,bodyClass:'home'});
}

const pages = splitPages(source);
for (const [pageName,file] of slugMap) {
  if (pageName === 'Home') fs.writeFileSync(path.join(root,file),homePage());
  else if (pages.has(pageName)) fs.writeFileSync(path.join(root,file),genericPage(pageName,pages.get(pageName)));
}

const infrastructure = `<section class="page-hero page-hero--compact"><img class="page-hero__media" src="assets/pic/Infrastructure/ov/bg-stars.jpg" alt=""><div class="shell page-hero__content"><div class="breadcrumb"><a href="index.html">Home</a> / Infrastructure</div><h1>Infrastructure</h1><p class="page-hero__lede">World-class facilities, platforms, instruments, and services built for collaborative discovery.</p></div></section><section class="content-section"><div class="shell"><div class="card-grid"><a class="topic-card" href="facility.html"><img src="assets/pic/Infrastructure/facility/f1.jpg" alt="Advance Biomedical Image Facility"><h3>Facility</h3></a><a class="topic-card" href="platform.html"><img src="assets/pic/Research/tech1/2.jpg" alt="Molecular imaging platform"><h3>Platform</h3></a><a class="topic-card" href="instrumentation.html"><img src="assets/pic/main/hero2.jpg" alt="Scientific instruments"><h3>Instrumentation</h3></a><a class="topic-card" href="access.html"><img src="assets/pic/Infrastructure/ov/content4.png" alt="Open research access"><h3>Access</h3></a></div></div></section>`;
fs.writeFileSync(path.join(root,'infrastructure.html'),pageTemplate({title:'Infrastructure',description:'Explore PETLab facilities, platforms, instrumentation, and open access.',content:infrastructure,bodyClass:'page-infrastructure'}));

console.log(`Generated ${slugMap.size + 1} HTML pages in ${root}`);
