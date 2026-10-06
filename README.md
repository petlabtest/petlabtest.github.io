# Digital PET Laboratory website

This is a dependency-free static website. Shared navigation lives in `components/header.html` and `components/footer.html`; page styles and interactions live in `assets/`.

Run a local server from this directory, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Typography audit

The shared font resources and cross-page typography contract are loaded through
`assets/css/page-canvas.css`. Run the baseline audit after changing fonts or
page styles:

```sh
node tools/audit-typography.mjs
```

The audit fails when a content page misses the shared entry point, a required
local font is absent, the contract is incomplete, or an HTML or CSS file
references a remote font source. Legacy archived font bundles have been
replaced by local Poppins, Noto Sans SC and compatible aliases in the shared
contract.

The Chinese Regular and Bold faces are served as full Unicode WOFF2 fonts.
Both preserve the source fonts' glyph coverage; together they reduced the
served font payload from 21.11 MB of TTF to 8.49 MB.
