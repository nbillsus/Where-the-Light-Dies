import { mkdirSync, writeFileSync } from 'node:fs';
import { CHAPTER_STAGES } from '../src/levels/chapterData.js';

const out = new URL('../assets/environment/chapter-two/', import.meta.url);
mkdirSync(out, { recursive: true });
const themes = [
  { name: 'The descent', sky: '#130d19', haze: '#7b2236', stone: '#271b29', edge: '#bb696a', glow: '#fb7772', motif: 'arches' },
  { name: 'Ossuary works', sky: '#21160f', haze: '#8a6437', stone: '#35291e', edge: '#b69b6e', glow: '#f0ba68', motif: 'gears' },
  { name: 'Cold array', sky: '#081e25', haze: '#207c83', stone: '#143540', edge: '#72b9b8', glow: '#8ee7e0', motif: 'lenses' },
  { name: 'Bloodglass chamber', sky: '#151224', haze: '#674b96', stone: '#25233f', edge: '#aa92ce', glow: '#d2b3f6', motif: 'glass' },
  { name: 'Heart of the works', sky: '#17090f', haze: '#bd252f', stone: '#321922', edge: '#d47571', glow: '#ff8875', motif: 'heart' },
];

function detail(theme, index) {
  let result = '';
  for (let i = 0; i < 10; i++) {
    const x = i * 470 + 100;
    const height = 410 + (i * 79 % 160);
    if (theme.motif === 'arches' || theme.motif === 'heart') result += `<path d="M${x - 110} 770 V${height} Q${x} ${height - 175} ${x + 110} ${height} V770" fill="none" stroke="#090911" stroke-width="54" opacity=".75"/>
      <path d="M${x - 110} 770 V${height} Q${x} ${height - 175} ${x + 110} ${height} V770" fill="none" stroke="${theme.edge}" stroke-width="3" opacity=".38"/>`;
    if (theme.motif === 'gears') result += `<path d="M${x-95} 810 V${height-90} H${x+95} V810" fill="none" stroke="#151512" stroke-width="44"/><path d="M${x-92} ${height+15} H${x+92}" stroke="${theme.edge}" stroke-width="6" opacity=".5"/>`;
    if (theme.motif === 'lenses') result += `<path d="M${x} 0 V${height-100}" stroke="#0a222b" stroke-width="29"/><path d="M${x} 0 V${height-100}" stroke="${theme.edge}" stroke-width="4" opacity=".6"/>`;
    if (theme.motif === 'glass') result += `<path d="M${x-85} 780 L${x-65} ${height-150} L${x+80} ${height-110} L${x+100} 780Z" fill="#0d1021" stroke="${theme.edge}" stroke-width="9" opacity=".62"/>`;
    if (theme.motif === 'gears' || theme.motif === 'heart') result += `<circle cx="${x}" cy="${height + 80}" r="90" fill="none" stroke="#e47564" stroke-width="12" opacity=".17"/><circle cx="${x}" cy="${height + 80}" r="47" fill="#190c1b" stroke="#f4a07c" stroke-width="5" opacity=".48"/>`;
    if (theme.motif === 'lenses') result += `<ellipse cx="${x}" cy="${height + 55}" rx="91" ry="135" fill="url(#lens)" stroke="#d47e84" stroke-width="7" opacity=".52"/><circle cx="${x}" cy="${height + 55}" r="28" fill="#d83143" opacity=".43"/>`;
    if (theme.motif === 'glass') result += `<path d="M${x - 78} ${height - 35} l130 -25 43 275 -153 40Z" fill="url(#glass)" stroke="#d18091" stroke-width="5" opacity=".58"/>`;
    if (theme.motif === 'arches') result += `<path d="M${x - 34} ${height + 40} v220 m68 -220 v220" stroke="#f07969" stroke-width="7" opacity=".25"/><circle cx="${x}" cy="${height + 95}" r="27" fill="#a9233b" opacity=".5"/>`;
  }
  if (index === 4) result += `<circle cx="3650" cy="420" r="240" fill="url(#core)"/><circle cx="3650" cy="420" r="175" fill="none" stroke="#ffb080" stroke-width="22" opacity=".56"/><circle cx="3650" cy="420" r="95" fill="#a71335" stroke="#ffd49b" stroke-width="9" opacity=".72"/>`;
  return result;
}

function platformShapes(stage, theme) {
  return stage.platforms.map(([start, end, top], i) => `<path d="M${start} ${top} L${end} ${top} L${end - 25} 900 L${start + 18} 900Z" fill="${i % 2 ? '#11121b' : '#17151f'}" stroke="${theme.edge}" stroke-width="3"/>
    <path d="M${start} ${top} H${end}" stroke="${theme.edge}" stroke-width="9" opacity=".75"/>
    <path d="M${start} ${top + 14} H${end}" stroke="${theme.glow}" stroke-width="2" opacity=".42"/>
    ${Array.from({ length: Math.floor((end - start) / 75) }, (_, n) => `<path d="M${start + 35 + n * 75} ${top + 18} v${40 + (n % 3) * 20}" stroke="${theme.edge}" stroke-width="3" opacity=".45"/>`).join('')}`).join('');
}

function landmark(index) {
  if (index === 0) return `<path d="M2840 630 Q2920 260 3100 210 Q3280 300 3350 630Z" fill="#080910" stroke="#683648" stroke-width="12"/>
    <path d="M2960 620 Q2980 365 3100 310 Q3210 360 3235 620" fill="none" stroke="#b95154" stroke-width="10" opacity=".63"/>
    <path d="M3100 270 v260" stroke="#ff775f" stroke-width="7" opacity=".8"/>`;
  if (index === 1) return `<g transform="translate(3010 340)"><circle r="190" fill="#12100b" stroke="#927547" stroke-width="24" opacity=".86"/>
    <circle r="122" fill="none" stroke="#e9c485" stroke-width="8" opacity=".65"/><circle r="47" fill="#b78938" opacity=".72"/>
    ${Array.from({length:12},(_,i)=>`<path d="M${Math.cos(i*Math.PI/6)*175} ${Math.sin(i*Math.PI/6)*175} L${Math.cos(i*Math.PI/6)*228} ${Math.sin(i*Math.PI/6)*228}" stroke="#bb9865" stroke-width="16"/>`).join('')}</g>`;
  if (index === 2) return `<path d="M2700 0 L2700 590 M2840 0 L2840 590 M2980 0 L2980 590" stroke="#1b434d" stroke-width="42"/>
    <path d="M2700 280 L3540 530 M2840 400 L3650 240 M2980 550 L3890 340" stroke="#8ce7de" stroke-width="6" opacity=".76"/>
    <path d="M2700 280 L3540 530 M2840 400 L3650 240 M2980 550 L3890 340" stroke="#8ce7de" stroke-width="27" opacity=".09"/>`;
  if (index === 3) return `<g transform="translate(2940 390)"><path d="M-210 -240 L120 -260 L210 250 L-125 280Z" fill="url(#glass)" stroke="#b9a5e4" stroke-width="16"/>
    <path d="M-130 -100 Q0 -250 130 -90 Q90 100 0 190 Q-100 50 -130 -100Z" fill="#171329" stroke="#d4bef3" stroke-width="6" opacity=".75"/>
    <ellipse cy="-45" rx="80" ry="42" fill="#a491e9" opacity=".54"/><circle cy="-45" r="27" fill="#0c0b17"/></g>`;
  return `<path d="M3180 700 Q3130 270 3460 170 Q3760 245 3740 700Z" fill="#090912" stroke="#794052" stroke-width="12"/>
    <path d="M3300 650 Q3300 360 3460 300 Q3600 380 3620 650" fill="none" stroke="#f2856e" stroke-width="7" opacity=".55"/>`;
}

for (const [index, stage] of CHAPTER_STAGES.slice(5, 10).entries()) {
  const theme = themes[index];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4096 900" width="4096" height="900">
  <defs>
    <radialGradient id="haze"><stop stop-color="${theme.haze}" stop-opacity=".65"/><stop offset="1" stop-color="${theme.haze}" stop-opacity="0"/></radialGradient>
    <radialGradient id="core"><stop stop-color="#ffca95" stop-opacity=".7"/><stop offset=".35" stop-color="#a81036" stop-opacity=".5"/><stop offset="1" stop-color="#a81036" stop-opacity="0"/></radialGradient>
    <linearGradient id="glass"><stop stop-color="#e77d9a" stop-opacity=".13"/><stop offset=".5" stop-color="#f4baba" stop-opacity=".4"/><stop offset="1" stop-color="#4a2b5e" stop-opacity=".12"/></linearGradient>
    <radialGradient id="lens"><stop stop-color="#ed4358" stop-opacity=".58"/><stop offset="1" stop-color="#431c32" stop-opacity=".1"/></radialGradient>
    <pattern id="grain" width="89" height="71" patternUnits="userSpaceOnUse"><circle cx="12" cy="15" r="1.2" fill="#ffd4bf" opacity=".16"/><circle cx="68" cy="47" r="1.8" fill="#ffd4bf" opacity=".11"/></pattern>
  </defs>
  <rect width="4096" height="900" fill="${theme.sky}"/>
  <path d="M0 0 H4096 V400 Q3500 270 3000 390 T2000 350 T900 400 T0 300Z" fill="#090a12" opacity=".95"/>
  <ellipse cx="850" cy="480" rx="950" ry="510" fill="url(#haze)"/>
  <ellipse cx="2700" cy="370" rx="950" ry="490" fill="url(#haze)"/>
  <path d="M0 570 Q500 460 950 585 T1900 520 T2900 590 T4096 510 V900 H0Z" fill="${theme.stone}" opacity=".48"/>
  <path d="M0 660 Q470 590 980 690 T1900 630 T3000 680 T4096 610 V900 H0Z" fill="#11111c" opacity=".58"/>
  ${detail(theme, index)}
  ${landmark(index)}
  <g stroke="${theme.glow}" stroke-width="3" opacity=".4"><path d="M0 190 H4096 M0 206 H4096"/><path d="M0 240 H4096" stroke-dasharray="18 30"/></g>
  <g fill="${theme.glow}" opacity=".23">${Array.from({ length: 35 }, (_, i) => `<circle cx="${(i * 233 + index * 91) % 4096}" cy="${100 + i * 79 % 480}" r="${2 + i % 4}"/>`).join('')}</g>
  ${platformShapes(stage, theme)}
  <rect width="4096" height="900" fill="url(#grain)"/>
  <text x="3900" y="95" text-anchor="end" font-family="Georgia, serif" font-size="23" letter-spacing="8" fill="${theme.edge}" opacity=".34">${theme.name.toUpperCase()}</text>
</svg>`;
  writeFileSync(new URL(`${stage.id}.svg`, out), svg);
}
