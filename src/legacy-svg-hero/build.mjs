// Builds index.html: draws the hero scene as SVG and injects it into src/template.html.
// Run from the project root:  node src/build.mjs
// Map paths in src/map.json are Natural Earth 10m countries (world-atlas), projected
// orthographically around Singapore by src/map-gen.mjs (needs d3-geo, topojson-client, world-atlas).
import fs from 'fs';

const root = new URL('..', import.meta.url).pathname;
const map = JSON.parse(fs.readFileSync(root + 'src/map.json', 'utf8'));

// Earth geometry, in viewBox units (0 0 1600 900): a very large circle, so the horizon
// reads as a gently curved line across the whole width, topping out at y=540.
const CX = 800, R = 4200, TOP = 540, CY = TOP + R;
const INK = '#16182A';

// Small seeded random so the starfield is identical on every build.
let seed = 20261006;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const f = (n) => Math.round(n * 10) / 10;

// Things standing on the horizon are drawn upright at its top centre, scaled by OS, then
// rotated about the earth's centre so they land at horizontal position x.
const OS = 0.85;
const degAt = (x) => f2(Math.asin((x - CX) / R) * 180 / Math.PI);
function f2(n) { return Math.round(n * 100) / 100; }
const rimAt = (x, h) => { const a = Math.asin((x - CX) / R), rad = R + h * OS; return [f(CX + rad * Math.sin(a)), f(CY - rad * Math.cos(a))]; };
const onRim = (x, inner) => `<g transform="rotate(${degAt(x)} ${CX} ${CY})"><g transform="translate(${CX} ${TOP}) scale(${OS}) translate(${-CX} ${-TOP})">${inner}</g></g>`;

// ---------- sky ----------
function sky() {
  let dots = '';
  for (let i = 0; i < 260; i++) {
    const x = f(-400 + rand() * 2400), y = f(-900 + rand() * 1780);
    dots += `<circle cx="${x}" cy="${y}" r="${f(0.6 + rand() * 1.3)}" opacity="${f(0.35 + rand() * 0.6)}"/>`;
  }
  // [x, y, size, colour, twinkles]
  const sparks = [
    [96, 66, 12, '#fff', 1], [470, 50, 9, '#fff', 0], [690, 88, 11, '#C9B6FF', 1], [860, 40, 8, '#fff', 0],
    [990, 84, 26, '#FFD45C', 1], [1022, 120, 13, '#FFD45C', 0], [960, 132, 9, '#FFD45C', 1],
    [1500, 74, 11, '#fff', 1], [1550, 300, 9, '#C9B6FF', 0], [1470, 410, 12, '#fff', 1],
    [1540, 560, 8, '#fff', 0], [1580, 760, 12, '#C9B6FF', 1], [1180, 300, 10, '#fff', 0],
    [60, 300, 10, '#C9B6FF', 0], [40, 520, 12, '#fff', 1], [120, 840, 9, '#fff', 0],
    [960, 140, 8, '#C9B6FF', 0],
    [1380, 330, 7, '#FFD45C', 0],
    // extra sky for tall phone screens
    [420, -160, 11, '#fff', 1], [1100, -260, 12, '#C9B6FF', 0], [700, -420, 10, '#fff', 1],
    [1240, -620, 9, '#FFD45C', 0], [380, -560, 12, '#fff', 0], [900, -760, 9, '#fff', 1],
  ];
  let sp = '';
  for (const [x, y, s, c, tw] of sparks) {
    const k = f(s / 10);
    const d = f(rand() * 4);
    sp += `<g transform="translate(${x} ${y}) scale(${k})"><use href="#spark" fill="${c}" ${tw ? `class="twinkle" style="animation-delay:-${d}s"` : ''}/></g>`;
  }
  return `
  <rect x="-1200" y="-1400" width="4000" height="2600" fill="#12142A"/>
  <ellipse cx="300" cy="200" rx="520" ry="300" fill="url(#nebulaA)"/>
  <ellipse cx="1300" cy="380" rx="560" ry="340" fill="url(#nebulaB)"/>
  <ellipse cx="760" cy="-300" rx="600" ry="360" fill="url(#nebulaA)"/>
  <g fill="#fff">${dots}</g>
  <g class="sparks">${sp}</g>`;
}

// ---------- reusable art ----------
const sparkPath = 'M0,-10 C1.6,-1.6 1.6,-1.6 10,0 C1.6,1.6 1.6,1.6 0,10 C-1.6,1.6 -1.6,1.6 -10,0 C-1.6,-1.6 -1.6,-1.6 0,-10 Z';

const cloudPath = 'M-60,0 C-74,0 -76,-22 -56,-25 C-58,-46 -30,-52 -19,-37 C-13,-60 23,-62 27,-37 C41,-50 66,-39 57,-20 C74,-18 74,0 58,0 Z';
const cloud = (tf) => `<g transform="${tf}"><path d="${cloudPath}" fill="#F6F4EE"/><path d="M-34,-14 q10,-9 20,0 M14,-22 q9,-8 18,0" fill="none" stroke="#C9C6BC" stroke-width="2"/></g>`;

function palm() {
  const leaves = [
    'M14,-112 C-10,-130 -40,-122 -54,-98 C-36,-112 -14,-114 14,-112 Z',
    'M14,-112 C40,-134 70,-126 82,-100 C62,-116 40,-116 14,-112 Z',
    'M14,-112 C2,-150 30,-170 54,-160 C34,-150 22,-136 14,-112 Z',
    'M14,-112 C8,-150 -22,-164 -42,-150 C-20,-146 0,-136 14,-112 Z',
    'M14,-112 C-8,-104 -20,-84 -18,-62 C-8,-84 2,-100 14,-112 Z',
    'M14,-112 C36,-102 48,-84 46,-62 C36,-84 26,-100 14,-112 Z',
  ];
  return `<g id="palm">
    <path d="M-6,0 C-3,-40 1,-80 9,-112 L19,-110 C11,-78 7,-40 6,0 Z" fill="#B97A45"/>
    <path d="M-4,-20 l9,1 M-2,-44 l9,1 M1,-68 l9,1 M5,-90 l9,1" stroke="${INK}" stroke-width="1.6" fill="none"/>
    <g fill="#3FA35A">${leaves.map((d) => `<path d="${d}"/>`).join('')}</g>
    <circle cx="9" cy="-106" r="5.5" fill="#7A4E2A"/><circle cx="19" cy="-104" r="5.5" fill="#7A4E2A"/>
  </g>`;
}

// ---------- globe ----------
function waves() {
  return map.waves.map(([x, y]) => `<path d="M${x},${y} q5,-5 10,0 t10,0 t10,0 t10,0 M${x + 8},${y + 12} q5,-5 10,0 t10,0 t10,0"/>`).join('');
}

function earth() {
  const [sx, sy] = map.sgc;
  return `
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#ocean)"/>
  <g clip-path="url(#globeClip)">
    <g stroke="#E6F7FF" stroke-width="2" fill="none" stroke-linecap="round" opacity=".75">${waves()}</g>
    <g stroke="${INK}" stroke-width="2.2" stroke-linejoin="round">
      <path d="${map.other}" fill="#B5D98C"/>
      <path d="${map.id}" fill="url(#landId)"/>
      <path d="${map.my}" fill="#8CCB5C"/>
    </g>
  </g>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${INK}" stroke-width="3.2"/>
  <!-- Singapore, drawn 1.8x so it reads as the focal point -->
  <path d="${map.sg}" transform="translate(${sx} ${sy}) scale(1.8) translate(${-sx} ${-sy})" fill="#FF6B5E" stroke="${INK}" stroke-width="1.4"/>
  <g transform="translate(${sx + 2} ${sy - 4})">
    <path d="M-12,0 L-12,-16 L12,-16 L12,0 Z" fill="#F6F4EE" stroke="${INK}" stroke-width="2"/>
    <path d="M-16,-14 L0,-28 L16,-14 Z" fill="#FF6B5E" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="-4" y="-9" width="7" height="9" fill="#5B8BD9" stroke="${INK}" stroke-width="1.6"/>
  </g>
  <text x="${sx + 24}" y="${sy - 20}" class="doodle-label" fill="#F6F4EE" stroke="${INK}" stroke-width="5" paint-order="stroke">home</text>`;
}

// ---------- things on the rim ----------
function skyline() { // generic CBD towers, left of Marina Bay Sands
  const b = [[728, 118, 42], [774, 150, 38], [816, 96, 42]];
  return b.map(([x, h, w]) => `<rect x="${x}" y="${TOP + 4 - h}" width="${w}" height="${h}" fill="#F4A26B"/>
    <rect x="${x + 6}" y="${TOP + 10 - h}" width="${w - 12}" height="${h - 18}" fill="url(#win)" stroke="none"/>`).join('');
}

function mbs() {
  const base = TOP + 4, top = TOP - 128;
  const tower = (x) => `<path d="M${x},${base} L${x + 2},${top} L${x + 30},${top} L${x + 28},${base - 66} C${x + 28},${base - 34} ${x + 34},${base - 14} ${x + 40},${base} Z" fill="#EAD7B9"/>
    <path d="M${x + 4},${top + 8} L${x + 26},${top + 8}" stroke="none"/>
    <rect x="${x + 5}" y="${top + 8}" width="20" height="${base - top - 26}" fill="url(#floors)" stroke="none"/>`;
  let trees = '';
  for (let x = 734; x <= 862; x += 14) trees += `<circle cx="${x}" cy="${top - 13}" r="5" fill="#4DAA5B" stroke-width="1.6"/>`;
  return `${tower(736)}${tower(780)}${tower(824)}
    ${trees}
    <path d="M722,${top - 10} L884,${top - 10} C892,${top - 10} 892,${top} 884,${top} L728,${top} C718,${top} 716,${top - 10} 722,${top - 10} Z" fill="#D5DCE4"/>`;
}

function scallop(cx, cy, r, n, b) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) { d += `M${f(x)},${f(y)}`; continue; }
    const m = ((i - 0.5) / n) * Math.PI * 2;
    d += ` Q${f(cx + Math.cos(m) * (r + b))},${f(cy + Math.sin(m) * (r + b))} ${f(x)},${f(y)}`;
  }
  return d + ' Z';
}

function merlion() {
  const s = 1.35, ox = CX, oy = TOP + 2;
  return `<g transform="translate(${ox} ${oy}) scale(${s}) translate(${-ox} ${-oy})">
    <path d="M776,${TOP + 3} C752,${TOP - 40} 724,${TOP - 74} 704,${TOP - 76}" fill="none" stroke="none"/>
    <rect x="770" y="${TOP - 34}" width="62" height="9" rx="2" fill="#CFC6B6"/>
    <path d="M774,${TOP + 4} L777,${TOP - 25} L825,${TOP - 25} L828,${TOP + 4} Z" fill="#BDB3A2"/>
    <path d="M808,${TOP - 34} C834,${TOP - 42} 840,${TOP - 62} 832,${TOP - 78} C846,${TOP - 76} 852,${TOP - 92} 844,${TOP - 102} C838,${TOP - 90} 828,${TOP - 88} 820,${TOP - 82} C826,${TOP - 66} 818,${TOP - 50} 798,${TOP - 44} Z" fill="#F4F1E8"/>
    <path d="M786,${TOP - 34} C780,${TOP - 54} 784,${TOP - 70} 796,${TOP - 80} L812,${TOP - 76} C822,${TOP - 62} 818,${TOP - 46} 810,${TOP - 34} Z" fill="#F4F1E8"/>
    <path d="M792,${TOP - 48} q4,-4 8,0 M798,${TOP - 60} q4,-4 8,0 M790,${TOP - 62} q3,-3 6,0" fill="none" stroke-width="1.5"/>
    <path d="${scallop(796, TOP - 96, 19, 12, 6)}" fill="#E7DFCB"/>
    <circle cx="792" cy="${TOP - 95}" r="13" fill="#F4F1E8"/>
    <circle cx="787" cy="${TOP - 99}" r="2.2" fill="${INK}" stroke="none"/>
    <path d="M781,${TOP - 90} q-5,2 -2,6" fill="none" stroke-width="2"/>
    <path d="M778,${TOP - 88} C756,${TOP - 98} 736,${TOP - 92} 724,${TOP - 66}" fill="none" stroke="#7FCDF0" stroke-width="6" stroke-linecap="round"/>
    <path d="M778,${TOP - 88} C758,${TOP - 96} 742,${TOP - 90} 731,${TOP - 70}" fill="none" stroke="#D6F2FF" stroke-width="2" stroke-linecap="round"/>
    <circle cx="718" cy="${TOP - 56}" r="2.5" fill="#7FCDF0" stroke="none"/><circle cx="728" cy="${TOP - 50}" r="2" fill="#7FCDF0" stroke="none"/>
  </g>`;
}

function forest() {
  // A rainforest hill: overlapping tree crowns over a mound, palms poking out.
  const crowns = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, x = 640 + 320 * t, top = TOP + 6 - 104 * Math.sin(Math.PI * t);
    crowns.push(`<circle cx="${f(x)}" cy="${f(top + 14)}" r="${f(24 + rand() * 12)}" fill="${i % 2 ? '#2E7D46' : '#3A9150'}"/>`);
  }
  const front = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8, x = 660 + 280 * t, top = TOP + 6 - 60 * Math.sin(Math.PI * t);
    front.push(`<circle cx="${f(x)}" cy="${f(top + 26)}" r="${f(20 + rand() * 10)}" fill="#4FAE5E"/>`);
  }
  return `<path d="M630,${TOP + 10} C650,${TOP - 60} 720,${TOP - 96} 800,${TOP - 98} C880,${TOP - 96} 950,${TOP - 60} 970,${TOP + 10} Z" fill="#2E7D46"/>
    <use href="#palm" transform="translate(720 ${TOP - 56}) scale(.9)"/>
    <use href="#palm" transform="translate(860 ${TOP - 66}) scale(1.05) scale(-1 1)"/>
    ${crowns.join('')}${front.join('')}
    <path d="M700,${TOP - 10} q8,-10 16,0 M770,${TOP - 30} q8,-10 16,0 M860,${TOP - 14} q8,-10 16,0" fill="none" stroke="#9DD69A" stroke-width="2"/>`;
}

function alienAndUfo() {
  return `
  <g class="ufo">
    <path class="beam" d="M${CX - 20},${TOP - 146} L${CX + 20},${TOP - 146} L${CX + 52},${TOP + 2} L${CX - 52},${TOP + 2} Z" fill="url(#beam)" stroke="none"/>
    <g transform="translate(${CX} ${TOP - 156})">
      <path d="M-26,-2 C-26,-36 26,-36 26,-2 Z" fill="#A9DDF3"/>
      <path d="M-14,-18 q6,-10 16,-10" fill="none" stroke="#F4F1E8" stroke-width="3" stroke-linecap="round"/>
      <ellipse rx="60" ry="14" fill="#A3A7BA"/>
      <path d="M-58,3 C-30,14 30,14 58,3" fill="none"/>
      <g fill="#FFD45C" stroke-width="1.4"><circle cx="-38" cy="3" r="4"/><circle cx="-13" cy="6" r="4"/><circle cx="13" cy="6" r="4"/><circle cx="38" cy="3" r="4"/></g>
    </g>
  </g>
  <g transform="translate(${CX} ${TOP + 3})">
    <path d="M-5,0 L-6,-12 M5,0 L6,-12" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path d="M-11,-10 C-13,-24 -10,-32 0,-34 C10,-32 13,-24 11,-10 Z" fill="#7EE07A"/>
    <path d="M10,-26 C18,-30 20,-40 24,-46" fill="none" stroke-width="3" stroke-linecap="round" class="wave-arm"/>
    <path d="M-8,-52 L-12,-66 M8,-52 L12,-66" fill="none" stroke-width="2"/>
    <circle cx="-12" cy="-67" r="3" fill="#FFD45C"/><circle cx="12" cy="-67" r="3" fill="#FFD45C"/>
    <ellipse cy="-46" rx="16" ry="14" fill="#7EE07A"/>
    <ellipse cx="-6" cy="-46" rx="4" ry="6.5" fill="${INK}" stroke="none" transform="rotate(-18 -6 -46)"/>
    <ellipse cx="6" cy="-46" rx="4" ry="6.5" fill="${INK}" stroke="none" transform="rotate(18 6 -46)"/>
  </g>`;
}

function rimClouds() {
  const list = [[30, 1.1], [575, 0.85], [700, 0.7], [845, 0.95], [1165, 0.8], [1590, 1.1]];
  return list.map(([x, s]) => onRim(x, cloud(`translate(${CX} ${TOP + 10}) scale(${s})`))).join('');
}

// ---------- free-floating things ----------
function sheep() {
  // Stands on the rim, facing left toward the alien.
  const y = TOP + 3;
  const wool = scallop(CX + 4, y - 30, 22, 11, 7);
  return `<g transform="translate(${CX} ${y}) scale(1.7) translate(${-CX} ${-y})">
    <path d="M${CX - 10},${y} L${CX - 10},${y - 16} M${CX - 2},${y} L${CX - 2},${y - 16} M${CX + 10},${y} L${CX + 10},${y - 16} M${CX + 18},${y} L${CX + 18},${y - 16}" fill="none" stroke-width="3.4" stroke-linecap="round"/>
    <path d="${wool}" transform="translate(${CX + 4} ${y - 30}) scale(1 .78) translate(${-CX - 4} ${-(y - 30)})" fill="#F6F4EE"/>
    <path d="M${CX - 30},${y - 46} C${CX - 38},${y - 44} ${CX - 40},${y - 30} ${CX - 32},${y - 24} C${CX - 26},${y - 20} ${CX - 16},${y - 26} ${CX - 16},${y - 36} C${CX - 16},${y - 44} ${CX - 24},${y - 48} ${CX - 30},${y - 46} Z" fill="#45434F"/>
    <path d="M${CX - 18},${y - 42} c6,-2 10,2 9,6 c-4,0 -8,-2 -9,-6 Z" fill="#45434F"/>
    <path d="${scallop(CX - 24, y - 48, 6, 6, 3)}" fill="#F6F4EE" stroke-width="1.8"/>
    <circle cx="${CX - 30}" cy="${y - 36}" r="2.6" fill="#F6F4EE" stroke="none"/>
    <circle cx="${CX - 30.5}" cy="${y - 36}" r="1.2" fill="${INK}" stroke="none"/>
  </g>`;
}

const rock = 'M-17,-4 C-16,-14 -4,-16 4,-13 C14,-14 19,-4 16,4 C17,12 6,15 -2,13 C-12,15 -19,6 -17,-4 Z';
function asteroids() {
  const one = (x, y, s, d) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="spin" style="animation-duration:${d}s">
    <path d="${rock}" fill="#8E8E98"/>
    <ellipse cx="-6" cy="-4" rx="4" ry="3" fill="#6E6E78" stroke-width="1.4"/><ellipse cx="7" cy="4" rx="3" ry="2.4" fill="#6E6E78" stroke-width="1.4"/><circle cx="4" cy="-8" r="1.8" fill="#6E6E78" stroke="none"/>
  </g></g>`;
  return one(1150, 92, 1.2, 40) + one(1176, 132, 0.8, 28) + one(1500, 420, 1.3, 50) + one(110, 300, 0.8, 36);
}

function rocket() {
  return `<g transform="translate(1290 250) rotate(38)"><g class="rocket">
    <path class="flame" d="M-11,40 Q0,84 11,40 Z" fill="#FFB547"/>
    <path class="flame" d="M-5,40 Q0,62 5,40 Z" fill="#FFE08A" stroke="none"/>
    <path d="M-16,12 L-32,42 L-14,36 Z M16,12 L32,42 L14,36 Z" fill="#E94B4B"/>
    <path d="M0,-54 C19,-38 21,-6 16,40 L-16,40 C-21,-6 -19,-38 0,-54 Z" fill="#F25C54"/>
    <path d="M0,-54 C8,-48 12,-40 13,-32 C4,-36 -4,-36 -13,-32 C-12,-40 -8,-48 0,-54 Z" fill="#F4F1E8"/>
    <circle cy="-6" r="9" fill="#8FD3F4"/>
    <path d="M-4,-10 q2,-3 6,-3" fill="none" stroke="#F4F1E8" stroke-width="2" stroke-linecap="round"/>
    <rect x="-16" y="36" width="32" height="6" rx="2" fill="#C7C2B8"/>
  </g></g>`;
}

// Invisible hover targets; one entry per thing that can be coloured in.
const targets = [
  ["rocket", "Rocket", 1290, 250, 64],
  ["ufo", "UFO", ...rimAt(975, 130), 104 * OS],
  ["sheep", "Sheep", ...rimAt(1060, 52), 66 * OS],
  ["skyline", "City skyline", ...rimAt(165, 70), 84 * OS],
  ["mbs", "Marina Bay Sands", ...rimAt(305, 100), 104 * OS],
  ["merlion", "Merlion", ...rimAt(462, 60), 72 * OS],
  ["forest", "Rainforest", ...rimAt(1350, 70), 150 * OS],
  ["home", "Home, Singapore", map.sgc[0], map.sgc[1] - 12, 40],
  ["asteroids", "Asteroids", 1160, 110, 44],
  ["asteroids", "Asteroids", 1500, 420, 36],
];

function scene() {
  return `<defs>
    <path id="spark" d="${sparkPath}"/>
    ${palm()}
    <radialGradient id="nebulaA"><stop offset="0" stop-color="#3B3170" stop-opacity=".45"/><stop offset="1" stop-color="#3B3170" stop-opacity="0"/></radialGradient>
    <radialGradient id="nebulaB"><stop offset="0" stop-color="#1F4E79" stop-opacity=".4"/><stop offset="1" stop-color="#1F4E79" stop-opacity="0"/></radialGradient>
    <linearGradient id="ocean" gradientUnits="userSpaceOnUse" x1="0" y1="${TOP}" x2="0" y2="900"><stop offset="0" stop-color="#6FCDE8"/><stop offset="1" stop-color="#2789BC"/></linearGradient>
    <linearGradient id="landId" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86CB55"/><stop offset="1" stop-color="#4E9A36"/></linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7A0" stop-opacity=".85"/><stop offset="1" stop-color="#FFE7A0" stop-opacity=".08"/></linearGradient>
    <pattern id="win" width="9" height="10" patternUnits="userSpaceOnUse"><rect x="1.5" y="2" width="5" height="5" fill="#C9683A" opacity=".75"/></pattern>
    <pattern id="floors" width="10" height="7" patternUnits="userSpaceOnUse"><path d="M0,3.5 H10" stroke="#B9A07E" stroke-width="1.4"/></pattern>
    <clipPath id="globeClip"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
    <filter id="rough" filterUnits="userSpaceOnUse" x="-40" y="240" width="1680" height="690"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter>
  </defs>
  ${sky()}
  <g stroke="${INK}" stroke-width="2.4" stroke-linejoin="round">
    ${asteroids()}
    ${rocket()}
    <g filter="url(#rough)">
      ${onRim(165, skyline())}
      ${onRim(305, mbs())}
      ${onRim(462, merlion())}
      ${onRim(1215, `<use href="#palm" transform="translate(${CX} ${TOP + 4}) scale(1.1)"/>`)}
      ${onRim(1350, forest())}
      ${onRim(1495, `<use href="#palm" transform="translate(${CX} ${TOP + 4}) scale(.95) scale(-1 1)"/>`)}
      ${earth()}
      ${rimClouds()}
    </g>
    ${onRim(1060, `<g filter="url(#rough)">${sheep()}</g>`)}
    ${onRim(975, alienAndUfo())}
  </g>`;
}

const hits = targets.map(([key, label, x, y, r]) =>
  `<circle data-key="${key}" data-label="${label}" cx="${x}" cy="${y}" r="${r}" tabindex="0" role="button" aria-label="Colour in: ${label}"/>`).join('');

const tpl = fs.readFileSync(root + 'src/template.html', 'utf8');
const out = tpl.replace('<!--SCENE-->', scene()).replace('<!--HITS-->', hits);
fs.writeFileSync(root + 'index.html', out);
console.log('index.html written,', Math.round(out.length / 1024), 'KB');
