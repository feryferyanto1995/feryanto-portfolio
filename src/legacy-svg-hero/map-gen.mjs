import * as d3 from 'd3-geo';
import * as topo from 'topojson-client';
import fs from 'fs';
// Flat-horizon framing: Singapore at (800, 720); horizon arc top at y=540.
const [scale, minA] = [+process.argv[2] || 5200, +process.argv[3] || 6];
const w = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-10m.json'));
const fc = topo.feature(w, w.objects.countries);
const proj = d3.geoOrthographic().scale(scale).translate([800, 720]).rotate([-103.82, -1.35]).clipAngle(90).precision(0.2);
const path = d3.geoPath(proj).digits(1);
const groups = { sg: ['702'], my: ['458'], id: ['360'] };
const out = { sg: [], my: [], id: [], other: [] };
const kept = [];
for (const f of fc.features) {
  const key = Object.keys(groups).find((k) => groups[k].includes(f.id)) || 'other';
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys) {
    const g = { type: 'Polygon', coordinates: p };
    const b = path.bounds(g);
    if (!isFinite(b[0][0]) || b[1][1] < 480 || b[0][1] > 960 || b[1][0] < -200 || b[0][0] > 1800) continue;
    if (key !== "sg" && path.area(g) < minA) continue;
    if (path.area(g) > 5e6) continue; // inverted rings (e.g. Maldives) would cover the whole view
    out[key].push(path(g)); kept.push(p.map((ring) => ring.map((c) => proj(c))));
  }
}
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const inLand = (x, y) => kept.some((rings) => inRing(x, y, rings[0]) && !rings.slice(1).some((h) => inRing(x, y, h)));
// Sea spots for little wave marks: grid points that are not on (or right next to) land.
const waves = [];
let s = 11; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let y = 600; y <= 880; y += 70) for (let x = 40; x <= 1560; x += 120) {
  const px = x + (r() - .5) * 70, py = y + (r() - .5) * 30;
  const near = [[0, 0], [-40, 0], [40, 0], [0, -22], [0, 22]].some(([dx, dy]) => inLand(px + dx, py + dy));
  if (!near) waves.push([Math.round(px), Math.round(py)]);
}
const sg = proj([103.82, 1.35]);
console.error('SG', sg, 'KL', proj([101.7, 3.14]), 'Batam', proj([104.03, 1.08]), 'Kuching', proj([110.33, 1.55]));
for (const k in out) console.error(k, out[k].length, out[k].join('').length);
console.error('waves', waves.length);
fs.writeFileSync('map2.json', JSON.stringify({ ...Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join('')])), waves, sgc: sg.map((v) => Math.round(v * 10) / 10) }));
