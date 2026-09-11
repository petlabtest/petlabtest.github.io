# PETLab Main Content Style Atlas

## Scope and method

This index surveys the main-content markup of the HTML pages under `Website/` (227 HTML files at the time of the survey). It groups recurring components by **visual and structural pattern**, not by repeated wording or a changed color alone.

Excluded from the catalogue:

- Header, footer, and global navigation.
- Repeated plain WYSIWYG text blocks with no distinct layout treatment.
- Alternate-language, backup, and source-archive copies when they do not introduce a new main-content structure.
- The generated `Research-Tech-Chips-application-options.html` comparison page, which is a working preview rather than a source pattern.

The interactive visual reference is [main-style-atlas.html](main-style-atlas.html). It is self-contained and uses only existing local assets from `Website/assets`.

## Pattern catalogue

| ID | Style | Structural signature | Best use | Representative source |
| --- | --- | --- | --- | --- |
| S01 | Immersive image hero | Full-width image, directional dark overlay, large bottom-aligned copy | Homepage, umbrella topic, campaign entry | `Index-template.html`, `p-home-carousel` |
| S02 | Sloped full-width statement | Branded background band with diagonal edge transition | Mission statement, sectional entry, CTA | `About/About-about-en.html`, `p-fullwidth` |
| S03 | Research-area hero | Lead heading with grouped research navigation or visual entry | Research overview and topic landing pages | `Research/Research-ov-en.html`, `p-rdhero` |
| S04 | Balanced split image/copy | Two equal or weighted columns, image beside structured copy | Facility, platform, method, or explanatory narrative | `Research/Research-ov-en.html`, `p-twoone` |
| S05 | Offset editorial image/copy | Image plane and offset copy panel overlap on alternating rows | Premium application stories or selected use cases | `Research/Research-Tech-Chips-en.html`, application implementation block |
| S06 | Four-up image overlay grid | Equal image tiles, tinted overlay, centered label | Browseable projects, strengths, applications | `Research/Research-Tech-Detectors-en.html`, `p-project-carousel` |
| S07 | Three-up news collection | Three equal cards with image, date, title, summary | Curated latest-news module | `Research/Research-Life-en.html`, `p-news3up` |
| S08 | Asymmetric masonry grid | Mixed image tile spans with caption overlays | Facilities, capabilities, visual storytelling | `Capabilities/Capabilities-ov-en.html`, `p-masonry-facility` |
| S09 | People profile grid | Portrait, name, role, lower accent or metadata field | Leadership, team, fellows, collaborators | People pages, `p-masonry-staff` |
| S10 | Publication reference cards | Text-forward cards with content-type label and action | Papers, reports, technical references | `Research/Research-Publication-en.html`, `p-masonry-pub` |
| S11 | Alternating progress timeline | Central year line, alternating left/right cards, visual milestones | R&amp;D history, development roadmap, lab milestones | `Research/Research-Tech-Chips-en.html`, `chip-progress-timeline` |
| S12 | Impact metric band | Large numerals and short labels in a high-contrast horizontal band | Institutional outcomes, annual impact, key figures | `People/People-page3-t.html`, `p-impact-interactive` |
| S13 | Filter-and-result tool | Left category/filter rail plus compact result list | Projects, publications, instruments, datasets | `Research/Research-Project-en.html`, `p-rdtool`, `p-filter` |
| S14 | Contact callout and form | Branded call-to-action panel paired with a restrained form | Inquiry, partnership, access, consultation | `Engage/Engage-ov-en.html`, `p-contact-box` |
| S15 | Laboratory image carousel | Image-first slides with compact supporting copy and CTA | Laboratory experiences, facilities, product-style showcases | Research pages, `p-lab-carousel` |
| S16 | Alert / announcement strip | Narrow high-contrast information bar, optional CTA | Time-sensitive update or operating notice | Reusable `p-alert` component across research pages |

## Consolidation rules

1. `p-fullwidth`, `p-home-fullwidth`, and plain color changes are represented by S02 when the main distinction is the sloped or full-width transition treatment.
2. `p-masonry`, `p-masonry-generic`, `p-masonry-facility`, `p-masonry-engage`, and related variants are represented by S08 unless their content model changes to people or publications, which use S09 and S10.
3. `p-project-list` is represented by S04 or S05 depending on whether the image and copy are adjacent or intentionally overlap. The exact color, image, and copy direction are configurable variants rather than new structures.
4. `p-project-carousel` is represented by S06 when carousel controls are removed or unnecessary. The visual identity is the image-overlay tile, while sliding behavior is an interaction choice.
5. `wysiwyg` is not indexed as its own style: it is a content container. Only WYSIWYG blocks that create a separate visual grammar, such as S02 or S04, are recorded through that grammar.

## Reuse notes

- Use the existing section class names and local component conventions whenever introducing a pattern into a page. The atlas is a decision reference, not a replacement CSS bundle.
- Keep page titles and body copy in the page's established typographic scale. The sample text in the atlas is illustrative.
- The most reusable patterns for new PETLab pages are S02, S04, S06, S07, S08, S11, and S14.
- The atlas intentionally retains the PETLab palette: deep blue / navy anchors, orange accents, white or mist content grounds, and image-driven focal areas.

## Files

- Visual reference: `Website/components/main-style-atlas.html`
- This documentation: `Website/components/main-style-atlas.md`
