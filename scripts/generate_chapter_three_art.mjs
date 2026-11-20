import { mkdirSync, writeFileSync } from 'node:fs';
import { CHAPTER_STAGES } from '../src/levels/chapterData.js';

const out = new URL('../assets/environment/chapter-three/', import.meta.url);
mkdirSync(out, { recursive: true });
const looks = [
  { sky: '#101f30', horizon: '#31566a', mist: '#79b6c5', land: '#12212a', lip: '#aad7de', light: '#d8eef0', name: 'MOONBREAK REEF' },
  { sky: '#0b2028', horizon: '#276b73', mist: '#6bcdc0', land: '#122b32', lip: '#84cbbf', light: '#bdf7e4', name: 'GLASS TIDE' },
  { sky: '#211a19', horizon: '#886448', mist: '#d6a975', land: '#30261f', lip: '#d8b38a', light: '#ffddaa', name: 'ASH ORCHARD' },
  { sky: '#16172f', horizon: '#514a83', mist: '#a9a4df', land: '#25253b', lip: '#bcaedf', light: '#e7dbff', name: 'HOLLOW OBSERVATORY' },
  { sky: '#160f16', horizon: '#714652', mist: '#d4a489', land: '#28212a', lip: '#d8b989', light: '#ffe3a8', name: 'BLACK LENS' },
];

function distantCliffs(index, look) {
  let shapes = '';
  for (let i = 0; i < 19; i++) {
    const x = i * 240 - 110;
    const y = 540 + ((i * 91 + index * 57) % 165);
    shapes += `<path d="M${x-200} 900 L${x-90} ${y+65} L${x+10} ${y-65} L${x+75} ${y+20} L${x+210} 900Z" fill="${look.land}" opacity="${.25 + (i % 3) * .08}"/>`;
    shapes += `<path d="M${x+10} ${y-64} l-47 111 44 -39 -24 112 M${x+10} ${y-64} l42 90 -19 75" fill="none" stroke="${look.lip}" stroke-width="2" opacity=".12"/>`;
  }
  return shapes;
}

function skyTexture(index, look) {
  let texture = '';
  for (let i = 0; i < 22; i++) {
    const x = (i * 479 + index * 113) % 4220 - 50;
    const y = 72 + (i * 127 + index * 59) % 445;
    const width = 170 + i % 4 * 105;
    texture += `<path d="M${x-width} ${y+22} Q${x-80} ${y-45} ${x+width} ${y+7} Q${x+80} ${y-4} ${x-width} ${y+22}Z" fill="${look.mist}" opacity="${i%3===0?.045:.025}"/>`;
    if (i % 3 === 0) texture += `<path d="M${x-width} ${y+35} Q${x} ${y+5} ${x+width+90} ${y+30}" fill="none" stroke="${look.light}" stroke-width="2" opacity=".07"/>`;
  }
  for (let i = 0; i < 85; i++) {
    const x = (i * 397 + index * 71) % 4096;
    const y = 36 + (i * 163 + index * 89) % 510;
    texture += `<circle cx="${x}" cy="${y}" r="${i%4===0?2.4:.9}" fill="${look.light}" opacity="${i%5===0?.36:.13}"/>`;
  }
  return texture;
}

function reef(look) {
  let structures = `<circle cx="760" cy="205" r="144" fill="url(#moon)" opacity=".9"/><circle cx="760" cy="205" r="158" fill="none" stroke="${look.light}" stroke-width="3" opacity=".24"/>`;
  for (let i = 0; i < 12; i++) {
    const x = i * 370 + 70, base = 750 - i % 3 * 22;
    structures += `<path d="M${x} ${base} L${x+55} ${base-250} L${x+100} ${base-230} L${x+135} ${base}Z" fill="#0b1721" stroke="#5f8792" stroke-width="3" opacity=".85"/>
      <path d="M${x+56} ${base-240} L${x+84} ${base-410} L${x+98} ${base-228}" fill="#15242e" stroke="#6f9ba4" stroke-width="2" opacity=".7"/>`;
  }
  for (let i = 0; i < 38; i++) {
    const x = i * 117, y = 670 + (i * 47 % 80);
    structures += `<path d="M${x} ${y} q70 -14 140 0" fill="none" stroke="#a7dce6" stroke-width="${i%3+1}" opacity=".25"/>`;
  }
  return structures;
}

function tide(look) {
  let structures = `<path d="M0 560 Q900 510 1700 580 T4096 540 V900 H0Z" fill="#0d3b43" opacity=".36"/>`;
  for (let i = 0; i < 15; i++) {
    const x = i * 295 + 60, height = 260 + i % 4 * 60;
    structures += `<path d="M${x} 790 L${x+36} ${height} L${x+96} ${height-80} L${x+125} 790Z" fill="url(#glass)" stroke="#7ad4c5" stroke-width="5" opacity=".52"/>
      <path d="M${x+36} ${height} L${x+84} ${height+260} L${x+96} ${height-80}" fill="none" stroke="#c9fff0" stroke-width="3" opacity=".4"/>`;
  }
  for (let i = 0; i < 9; i++) {
    const x = i * 490 + 130;
    structures += `<ellipse cx="${x}" cy="710" rx="180" ry="24" fill="none" stroke="#9de9d7" stroke-width="3" opacity=".2"/>`;
  }
  return structures;
}

function orchard(look) {
  let structures = `<circle cx="2690" cy="210" r="200" fill="url(#sun)" opacity=".73"/>`;
  for (let i = 0; i < 13; i++) {
    const x = i * 355 + 15, crown = 210 + i % 4 * 44;
    structures += `<path d="M${x} 790 Q${x-35} 560 ${x+14} ${crown} M${x+7} 510 Q${x-130} 365 ${x-95} ${crown+25} M${x+12} 430 Q${x+115} 330 ${x+145} ${crown+15}" fill="none" stroke="#141011" stroke-width="24" opacity=".9"/>
      <path d="M${x+12} 430 Q${x+115} 330 ${x+145} ${crown+15}" fill="none" stroke="#9b7658" stroke-width="2" opacity=".45"/>`;
    for (let j = 0; j < 4; j++) structures += `<circle cx="${x + j*27 - 34}" cy="${crown + j*19}" r="4" fill="#e9b98a" opacity=".6"/>`;
  }
  return structures;
}

function observatory(look) {
  let structures = '';
  for (let i = 0; i < 7; i++) {
    const x = i * 610 + 260, y = 590 - i % 3 * 55;
    structures += `<path d="M${x-220} 780 V${y} Q${x-195} ${y-210} ${x} ${y-225} Q${x+195} ${y-210} ${x+220} ${y} V780Z" fill="#131529" stroke="#8e87bd" stroke-width="8" opacity=".82"/>
      <path d="M${x-130} ${y-110} Q${x} ${y-210} ${x+130} ${y-110}" fill="none" stroke="#e1d6ff" stroke-width="4" opacity=".45"/>
      <circle cx="${x}" cy="${y-115}" r="63" fill="url(#glass)" stroke="#b7ace1" stroke-width="9" opacity=".66"/>
      <path d="M${x} ${y-179} V${y-51} M${x-64} ${y-115} H${x+64}" stroke="#d4c8f1" stroke-width="3" opacity=".5"/>`;
  }
  for (let i = 0; i < 42; i++) structures += `<circle cx="${(i*283+95)%4096}" cy="${45+(i*113)%340}" r="${i%4+1}" fill="#e9dfff" opacity=".45"/>`;
  return structures;
}

function blackLens(look) {
  let structures = `<circle cx="3150" cy="335" r="290" fill="#090b12" stroke="#b48e72" stroke-width="34" opacity=".9"/>
    <circle cx="3150" cy="335" r="235" fill="url(#lens)" stroke="#f3d495" stroke-width="12" opacity=".8"/>
    <circle cx="3150" cy="335" r="112" fill="#080d16" stroke="#d6b88a" stroke-width="12"/>
    <circle cx="3150" cy="335" r="36" fill="#f9d38f" opacity=".68"/>`;
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6, cx = 3150 + Math.cos(a) * 270, cy = 335 + Math.sin(a) * 270;
    structures += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="13" fill="#f2d49d" opacity=".7"/>`;
  }
  for (let i = 0; i < 11; i++) {
    const x = i * 405 + 20;
    structures += `<path d="M${x} 780 V${290+i%3*55} Q${x+70} ${245+i%3*55} ${x+140} ${290+i%3*55} V780" fill="none" stroke="#0c0c14" stroke-width="45" opacity=".86"/>
      <path d="M${x} ${310+i%3*55} Q${x+70} ${265+i%3*55} ${x+140} ${310+i%3*55}" fill="none" stroke="#b4977b" stroke-width="3" opacity=".45"/>`;
  }
  return structures;
}

function platforms(stage, look) {
  return stage.platforms.map(([left, right, top], i) => `<path d="M${left} ${top} H${right} L${right-15} 900 H${left+20}Z" fill="${look.land}" stroke="#080b11" stroke-width="7"/>
    <path d="M${left} ${top} H${right}" stroke="${look.lip}" stroke-width="8" opacity=".83"/>
    <path d="M${left+7} ${top+18} H${right-7}" stroke="${look.light}" stroke-width="2" opacity=".36"/>
    ${Array.from({length:Math.floor((right-left)/68)},(_,j)=>`<path d="M${left+30+j*68} ${top+13} l${j%2?7:-6} ${35+j%3*17}" stroke="${look.lip}" stroke-width="2" opacity=".35"/>`).join('')}
    ${Array.from({length:Math.floor((right-left)/100)},(_,j)=>`<path d="M${left+50+j*100} ${top+45+j%3*24} q27 -11 65 -2" fill="none" stroke="${look.light}" stroke-width="1.5" opacity=".14"/>`).join('')}
    <path d="M${left+16} ${top+95} Q${(left+right)/2} ${top+62} ${right-16} ${top+103}" fill="none" stroke="${look.lip}" stroke-width="2" opacity=".16"/>`).join('');
}

const motifs = [reef, tide, orchard, observatory, blackLens];
for (const [index, stage] of CHAPTER_STAGES.slice(10).entries()) {
  const look = looks[index];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4096 900" width="4096" height="900">
    <defs>
      <linearGradient id="sky" x2="0" y2="1"><stop stop-color="${look.sky}"/><stop offset=".66" stop-color="${look.horizon}"/><stop offset="1" stop-color="${look.sky}"/></linearGradient>
      <radialGradient id="moon"><stop stop-color="#fffef1"/><stop offset=".6" stop-color="#c9e2ed"/><stop offset="1" stop-color="#7ea8c2" stop-opacity=".2"/></radialGradient>
      <radialGradient id="sun"><stop stop-color="#fff4c8"/><stop offset=".5" stop-color="#ebaa72" stop-opacity=".8"/><stop offset="1" stop-color="#b36c55" stop-opacity="0"/></radialGradient>
      <linearGradient id="glass" x2="1" y2="1"><stop stop-color="${look.sky}"/><stop offset=".48" stop-color="${look.horizon}"/><stop offset="1" stop-color="${look.light}" stop-opacity=".35"/></linearGradient>
      <radialGradient id="lens"><stop stop-color="#e7c79a" stop-opacity=".85"/><stop offset=".45" stop-color="#664f66"/><stop offset=".78" stop-color="#222337"/><stop offset="1" stop-color="#090c16"/></radialGradient>
      <linearGradient id="fog" x2="0" y2="1"><stop stop-color="${look.mist}" stop-opacity="0"/><stop offset="1" stop-color="${look.mist}" stop-opacity=".38"/></linearGradient>
    </defs>
    <rect width="4096" height="900" fill="url(#sky)"/>
    ${skyTexture(index, look)}
    <path d="M0 550 Q900 450 1900 565 T4096 510 V900 H0Z" fill="url(#fog)"/>
    ${distantCliffs(index, look)}
    ${motifs[index](look)}
    <path d="M0 730 Q1100 650 2200 730 T4096 700 V900 H0Z" fill="url(#fog)" opacity=".6"/>
    ${platforms(stage, look)}
    <text x="3890" y="92" text-anchor="end" font-family="Georgia,serif" font-size="25" letter-spacing="8" fill="${look.light}" opacity=".4">${look.name}</text>
  </svg>`;
  writeFileSync(new URL(`${stage.id}.svg`, out), svg);
}
