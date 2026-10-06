# Feryanto, UX designer portfolio

Static site: `index.html`, `style.css`, `main.js`, `assets/`. No build step; edit `index.html` directly.

## Hero
- Two illustrated scenes, each as a greyscale image with a colour image on top:
  `assets/hero-globe-{grey,colour}.webp` (round globe) and `assets/hero-flat-{grey,colour}.webp` (flat horizon).
  Source PNGs are in `Documents/Claude Code/Resources_img` (Hero_2/2a = globe, Hero_1/1a = flat).
- Hover targets are the `.spot` buttons in `index.html`. `--x`, `--y` and `--r` are percentages of the
  1983x793 artwork (x and r as % of width, y as % of height). Same `data-key` in both scenes = one object.
- Scroll story (Chrome/Edge/Safari 26+): the stage pins, the globe zooms toward Singapore and dissolves into the flat
  horizon, then dims into the page. Browsers without scroll timelines, or with reduced motion, show the globe only.
- Swapping in sharper art: export the same four images at about 4000x1600 and re-run the WebP conversion
  (any converter works; keep the file names).

## Old SVG hero
`src/legacy-svg-hero/` holds the earlier hand-coded SVG hero (`build.mjs` + `template.html`). It is not used.

## Preview
`npx http-server . -p 8790` and open http://localhost:8790

## Placeholders to replace
Project covers, titles and copy (#work), photo stack + bio + experience (#about), LinkedIn and resume links (#contact).
