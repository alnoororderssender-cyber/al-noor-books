import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/placeholders');
const NAVY = '#0B1F3A', NAVY2 = '#17365D';
const wrap = (inner, w = 600, h = 600) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Placeholder illustration">${inner}</svg>\n`;
const shadow = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${Math.round(rx * 0.07)}" fill="${NAVY}" opacity=".12"/>`;
const write = (name, svg) => fs.writeFileSync(`${out}/${name}.svg`, svg);

function rings(x, y0, n, gap, r = 7) {
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${x}" cy="${y0 + i * gap}" r="${r}" fill="none" stroke="#2b2b2b" stroke-width="4"/>`;
  return s;
}
function notebook({ color, label = 'NOTEBOOK', spiral = true, w = 270, h = 390 }) {
  const x = 165, y = 95;
  return wrap(
    shadow(300, y + h + 18, w / 2 + 30) +
    `<rect x="${x + w - 2}" y="${y + 6}" width="12" height="${h - 12}" rx="3" fill="#F3EEE3"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${color}"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2"/>` +
    `<rect x="${x + 14}" y="${y + 14}" width="${w - 28}" height="${h - 28}" rx="6" fill="none" stroke="#fff" stroke-opacity=".18"/>` +
    `<text x="${x + w / 2 + 10}" y="${y + 105}" font-family="Georgia,serif" font-size="20" letter-spacing="4" text-anchor="middle" fill="#fff" fill-opacity=".85">${label}</text>` +
    (spiral ? rings(x - 2, y + 28, Math.floor((h - 40) / 30), 30) : ''),
  );
}
function pens({ colors = ['#1d4ed8', '#0f172a', '#dc2626', '#16a34a', '#7c3aed'], title = 'GEL PENS' }) {
  let pensSvg = '';
  colors.forEach((c, i) => {
    const x = 205 + i * 46;
    pensSvg += `<rect x="${x}" y="190" width="24" height="270" rx="10" fill="${c}"/><rect x="${x}" y="190" width="24" height="70" rx="10" fill="#fff" fill-opacity=".22"/><rect x="${x + 8}" y="140" width="8" height="60" rx="3" fill="#94a3b8"/>`;
  });
  return wrap(
    shadow(300, 500, 170) +
    `<rect x="170" y="95" width="260" height="390" rx="12" fill="#fff" stroke="#cbd5e1" stroke-width="3"/>` +
    `<rect x="170" y="95" width="260" height="60" rx="12" fill="${NAVY}"/>` +
    `<text x="300" y="133" font-family="Arial,sans-serif" font-weight="700" font-size="22" letter-spacing="3" text-anchor="middle" fill="#fff">${title}</text>` +
    pensSvg,
  );
}
function sticky() {
  const cols = ['#fde047', '#f9a8d4', '#86efac', '#93c5fd', '#fdba74'];
  let s = shadow(300, 500, 190);
  cols.forEach((c, i) => (s += `<rect x="${200 - i * 6}" y="${370 - i * 34}" width="200" height="120" rx="6" fill="${c}" stroke="#000" stroke-opacity=".06"/>`));
  s += `<rect x="170" y="150" width="240" height="240" rx="6" fill="#fde047" transform="rotate(-4 300 270)" stroke="#000" stroke-opacity=".07"/>`;
  s += `<rect x="190" y="185" width="170" height="10" rx="5" fill="#000" opacity=".1" transform="rotate(-4 300 270)"/><rect x="190" y="215" width="130" height="10" rx="5" fill="#000" opacity=".1" transform="rotate(-4 300 270)"/>`;
  return wrap(s);
}
function register() {
  return wrap(
    shadow(300, 505, 170) +
    `<rect x="170" y="95" width="270" height="400" rx="8" fill="${NAVY}"/>` +
    `<rect x="170" y="95" width="26" height="400" rx="8" fill="#000" opacity=".25"/>` +
    `<rect x="230" y="190" width="170" height="70" rx="4" fill="#fff" fill-opacity=".92"/>` +
    `<text x="315" y="234" font-family="Georgia,serif" font-size="24" letter-spacing="5" text-anchor="middle" fill="${NAVY}">REGISTER</text>`,
  );
}
function drawing() {
  return wrap(
    shadow(300, 505, 170) +
    `<rect x="165" y="95" width="270" height="400" rx="8" fill="#fef9c3"/>` +
    `<rect x="180" y="145" width="240" height="220" fill="#7dd3fc"/>` +
    `<circle cx="385" cy="185" r="22" fill="#fde047"/>` +
    `<path d="M180 365 Q260 270 340 330 T420 300 V365Z" fill="#4ade80"/>` +
    `<rect x="255" y="285" width="60" height="50" fill="#f97316"/><path d="M247 285 L285 250 L323 285Z" fill="#b91c1c"/>` +
    `<text x="300" y="128" font-family="Georgia,serif" font-weight="700" font-size="26" text-anchor="middle" fill="${NAVY}">Drawing Book</text>` +
    `<text x="300" y="440" font-family="Arial,sans-serif" font-size="16" letter-spacing="3" text-anchor="middle" fill="${NAVY2}">A4 · 40 SHEETS</text>`,
  );
}
function books() {
  const spines = [['#0B1F3A', 380, 60], ['#7f1d1d', 330, 52], ['#166534', 420, 58]];
  let s = shadow(300, 505, 200);
  let x = 170;
  spines.forEach(([c, h, w]) => { s += `<rect x="${x}" y="${500 - h}" width="${w}" height="${h}" rx="4" fill="${c}"/><rect x="${x + 8}" y="${500 - h + 40}" width="${w - 16}" height="8" fill="#fff" opacity=".7"/>`; x += w + 6; });
  s += `<rect x="360" y="470" width="150" height="30" rx="3" fill="#1d4ed8"/><rect x="368" y="440" width="140" height="30" rx="3" fill="#a16207"/><rect x="356" y="410" width="150" height="30" rx="3" fill="#0f766e"/>`;
  return wrap(s);
}
function backpack() {
  return wrap(
    shadow(300, 520, 150) +
    `<rect x="215" y="150" width="170" height="360" rx="60" fill="${NAVY}"/>` +
    `<path d="M255 150 Q300 95 345 150" fill="none" stroke="${NAVY2}" stroke-width="16" stroke-linecap="round"/>` +
    `<rect x="240" y="330" width="120" height="130" rx="18" fill="${NAVY2}"/>` +
    `<rect x="255" y="245" width="90" height="12" rx="6" fill="#fff" opacity=".25"/><rect x="290" y="330" width="20" height="30" rx="4" fill="#94a3b8"/>`,
  );
}
function palette() {
  const dots = [['#ef4444', 250, 260], ['#f59e0b', 320, 230], ['#22c55e', 385, 265], ['#3b82f6', 265, 335], ['#a855f7', 345, 345]];
  return wrap(
    shadow(300, 500, 190) +
    `<path d="M300 160 C420 160 490 240 480 330 C470 410 400 430 360 400 C330 380 300 420 260 430 C190 440 120 380 120 300 C120 220 190 160 300 160Z" fill="#f3e5c9" stroke="#d6c4a0" stroke-width="3"/>` +
    dots.map(([c, x, y]) => `<circle cx="${x}" cy="${y}" r="28" fill="${c}"/>`).join('') +
    `<rect x="400" y="120" width="14" height="230" rx="6" fill="#b45309" transform="rotate(25 407 235)"/><path d="M425 110 l22 -22" stroke="#111" stroke-width="10" stroke-linecap="round"/>`,
  );
}
function binder() {
  return wrap(
    shadow(300, 510, 170) +
    `<rect x="200" y="100" width="200" height="400" rx="10" fill="${NAVY2}"/><rect x="200" y="100" width="34" height="400" rx="10" fill="${NAVY}"/>` +
    `<rect x="255" y="210" width="120" height="90" rx="4" fill="#fff"/><rect x="270" y="235" width="90" height="8" fill="#94a3b8"/><rect x="270" y="255" width="60" height="8" fill="#94a3b8"/>` +
    `<circle cx="217" cy="180" r="10" fill="#cbd5e1"/><circle cx="217" cy="420" r="10" fill="#cbd5e1"/>`,
  );
}
function writing() {
  return wrap(
    shadow(300, 500, 190) +
    `<rect x="150" y="150" width="300" height="340" rx="8" fill="${NAVY2}"/><rect x="150" y="150" width="300" height="340" rx="8" fill="none" stroke="#fff" stroke-opacity=".15"/>` +
    rings(148, 175, 10, 32) +
    `<g transform="rotate(38 300 300)"><rect x="285" y="90" width="26" height="330" rx="12" fill="#0f172a"/><rect x="285" y="90" width="26" height="60" rx="12" fill="#c9a227"/><path d="M285 420 L298 470 L311 420Z" fill="#94a3b8"/></g>`,
  );
}
function pencilCase() {
  return wrap(
    shadow(300, 440, 200) +
    `<rect x="110" y="270" width="380" height="150" rx="70" fill="${NAVY}"/><rect x="110" y="270" width="380" height="150" rx="70" fill="none" stroke="#fff" stroke-opacity=".15" stroke-width="3"/>` +
    `<path d="M150 345 H450" stroke="#94a3b8" stroke-width="6" stroke-dasharray="14 10"/><rect x="280" y="330" width="40" height="30" rx="6" fill="#cbd5e1"/>`,
  );
}

const nb = (color, label) => notebook({ color, label });
write('notebook-green', nb('#14532d'));
write('notebook-blue', nb('#1d4ed8'));
write('notebook-pink', nb('#f9a8d4'));
write('notebook-charcoal', nb('#374151'));
write('notebook-open', wrap(shadow(300, 470, 210) + `<path d="M90 140 H295 V450 H90Z" fill="#fff" stroke="#cbd5e1" stroke-width="3"/><path d="M305 140 H510 V450 H305Z" fill="#fff" stroke="#cbd5e1" stroke-width="3"/>` + Array.from({ length: 11 }, (_, i) => `<path d="M110 ${180 + i * 24} H280 M325 ${180 + i * 24} H490" stroke="#bfdbfe" stroke-width="2"/>`).join('') + rings(300, 165, 10, 30, 6)));
write('pens-blue', pens({}));
write('pens-ball', pens({ colors: ['#1e3a8a', '#1e3a8a', '#1e3a8a', '#1e3a8a', '#1e3a8a'], title: 'BALL PEN' }));
write('sticky-notes', sticky());
write('register', register());
write('drawing-book', drawing());
write('books', books());
write('backpack', backpack());
write('art-craft', palette());
write('binder', binder());
write('writing', writing());
write('pencil-case', pencilCase());

// Hero (desk scene)
write('hero', wrap(
  `<rect width="1200" height="760" fill="#F3F6FA"/><rect y="600" width="1200" height="160" fill="#E6ECF4"/>` +
  `<rect x="140" y="470" width="360" height="50" rx="4" fill="#0B1F3A"/><rect x="170" y="425" width="340" height="48" rx="4" fill="#7f1d1d"/><rect x="150" y="380" width="350" height="46" rx="4" fill="#166534"/>` +
  `<rect x="560" y="330" width="250" height="300" rx="10" fill="#17365D"/>` + rings(556, 360, 8, 32) + `<text x="690" y="440" font-family="Georgia,serif" font-size="22" letter-spacing="5" text-anchor="middle" fill="#fff" fill-opacity=".8">NOTES</text>` +
  `<rect x="850" y="380" width="120" height="250" rx="12" fill="#fff" stroke="#cbd5e1" stroke-width="3"/><g>${['#1d4ed8', '#dc2626', '#16a34a', '#f59e0b', '#0f172a'].map((c, i) => `<rect x="${868 + i * 18}" y="${250 + (i % 2) * 20}" width="10" height="200" rx="4" fill="${c}"/>`).join('')}</g>` +
  `<rect x="1000" y="470" width="130" height="130" rx="8" fill="#fde047"/><rect x="1015" y="440" width="130" height="130" rx="8" fill="#f9a8d4" transform="rotate(6 1080 505)"/><rect x="620" y="140" width="220" height="150" rx="10" fill="#0B1F3A" opacity=".08"/>` +
  `<ellipse cx="640" cy="640" rx="480" ry="18" fill="#0B1F3A" opacity=".08"/>`,
  1200, 760));
write('banner', wrap(
  `<rect width="900" height="300" fill="#EAF0F8"/><rect y="230" width="900" height="70" fill="#DCE6F2"/>` +
  `<rect x="330" y="190" width="300" height="34" rx="3" fill="#F8FAFC" stroke="#94a3b8"/><rect x="310" y="222" width="320" height="34" rx="3" fill="#17365D"/>` +
  `<rect x="640" y="130" width="90" height="126" rx="10" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>${['#1d4ed8', '#dc2626', '#16a34a', '#f59e0b'].map((c, i) => `<rect x="${655 + i * 16}" y="${70 + (i % 2) * 14}" width="9" height="90" rx="4" fill="${c}"/>`).join('')}` +
  `<rect x="740" y="190" width="120" height="66" rx="3" fill="#0B1F3A"/><rect x="750" y="150" width="110" height="42" rx="3" fill="#1d4ed8"/>`,
  900, 300));
// Store interior
let shelves = `<rect width="1000" height="620" fill="#e7edf5"/>`;
const palette2 = ['#0B1F3A', '#7f1d1d', '#166534', '#b45309', '#1d4ed8', '#7c3aed', '#0f766e', '#be123c', '#f59e0b', '#475569'];
for (let r = 0; r < 4; r++) {
  const y = 40 + r * 120;
  shelves += `<rect x="30" y="${y + 92}" width="940" height="10" fill="#8b6b4a"/>`;
  let x = 40, i = r * 3;
  while (x < 950) {
    const w = 14 + ((i * 7) % 16), h = 60 + ((i * 13) % 32);
    shelves += `<rect x="${x}" y="${y + 92 - h}" width="${w}" height="${h}" fill="${palette2[i % palette2.length]}"/>`;
    x += w + 2; i++;
  }
}
shelves += `<rect x="330" y="470" width="340" height="120" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/><text x="500" y="540" font-family="Georgia,serif" font-size="26" letter-spacing="3" text-anchor="middle" fill="#0B1F3A">AL NOOR BOOKS</text>`;
write('store', wrap(shelves, 1000, 620));
console.log(fs.readdirSync(out).join(' '));
