import { mkdirSync, writeFileSync } from 'node:fs';
import { CHAPTER_STAGES } from '../src/levels/chapterData.js';

const themes = [
  ['#061622','#195c70','#89d8df','archive'], ['#19120e','#764b32','#f0af75','conduit'],
  ['#111526','#494b83','#aaa4f2','well'], ['#101718','#436b61','#c8d9ac','engine'],
  ['#081a22','#317b7c','#9eefe2','transmitter'], ['#0a1b2e','#365d8a','#c5e8fa','shore'],
  ['#1b1026','#853e79','#ecacdc','fracture'], ['#21100e','#92513e','#f1c89a','cathedral'],
  ['#11132c','#55579a','#b9c1ff','array'], ['#080d17','#815e54','#f5d7a2','threshold'],
];
const out = new URL('../assets/environment/deep-chapters/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const [index, stage] of CHAPTER_STAGES.slice(15).entries()) {
  const [sky, haze, light, motif] = themes[index];
  // Parallax layers (see src/effects/Parallax.js): sky, far, and ground.
  const layers = { sky: [], far: [], ground: [] };
  let pieces = layers.sky;
  const defs = (`<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset=".64" stop-color="${haze}"/><stop offset="1" stop-color="${sky}"/></linearGradient><radialGradient id="glow"><stop stop-color="${light}" stop-opacity=".52"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient><linearGradient id="rock" x2="0" y2="1"><stop stop-color="${haze}"/><stop offset=".08" stop-color="${sky}"/><stop offset="1" stop-color="#05080e"/></linearGradient></defs>`);
  pieces.push('<rect width="4096" height="900" fill="url(#sky)"/>');
  for (let i = 0; i < 28; i++) {
    const x = (i * 647 + index * 131) % 4096, y = 50 + (i * 173) % 460;
    pieces.push(`<ellipse cx="${x}" cy="${y}" rx="${150 + i % 5 * 40}" ry="${35 + i % 4 * 18}" fill="${light}" opacity=".025"/>`);
  }
  pieces = layers.far;
  for (let i = 0; i < 15; i++) {
    const x = 160 + i * 285, h = 220 + (i * 83 + index * 41) % 260;
    if (['archive','conduit','engine','cathedral','threshold'].includes(motif)) {
      pieces.push(`<path d="M${x-92} 770 V${h+100} Q${x} ${h-60} ${x+92} ${h+100} V770Z" fill="#050c13" stroke="${light}" stroke-opacity=".27" stroke-width="6"/>`);
      pieces.push(`<path d="M${x-57} 690 V${h+110} Q${x} ${h+30} ${x+57} ${h+110} V690" fill="none" stroke="${light}" stroke-opacity=".18" stroke-width="3"/>`);
    } else if (['well','fracture','array'].includes(motif)) {
      pieces.push(`<path d="M${x-85} 650 L${x-15} ${h} L${x+92} ${h+70} L${x+35} 670Z" fill="#090d20" stroke="${light}" stroke-opacity=".38" stroke-width="5"/>`);
      pieces.push(`<circle cx="${x}" cy="${h+115}" r="40" fill="url(#glow)"/>`);
    } else {
      pieces.push(`<path d="M${x-155} 730 L${x-25} ${h} L${x+35} ${h-80} L${x+150} 730Z" fill="#071923" stroke="${light}" stroke-opacity=".25" stroke-width="4"/>`);
    }
  }
  pieces = layers.ground;
  const featureX = 2900;
  pieces.push(`<circle cx="${featureX}" cy="280" r="300" fill="url(#glow)"/><circle cx="${featureX}" cy="280" r="${motif === 'threshold' ? 180 : 120}" fill="${sky}" stroke="${light}" stroke-width="12" opacity=".85"/>`);
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI * 2 / 9, x = featureX + Math.cos(a) * 235, y = 280 + Math.sin(a) * 235;
    pieces.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="5" fill="${light}" opacity=".65"/>`);
  }
  // Boss levels run on past the painted 4096 (the arena is drawn in code).
  const artWidth = stage.artWidth ?? stage.width;
  for (const [left, right, top] of stage.platforms.filter(([start]) => start < artWidth).map(([start, end, top]) => [start, Math.min(end, artWidth), top])) {
    pieces.push(`<path d="M${left} ${top} H${right} L${right-24} 900 H${left+20}Z" fill="url(#rock)" stroke="${light}" stroke-opacity=".45" stroke-width="5"/>`);
    for (let x = left + 45; x < right; x += 90) pieces.push(`<path d="M${x} ${top+12} l-12 94 18 -34" fill="none" stroke="${light}" stroke-opacity=".13" stroke-width="3"/>`);
  }
  for (let i = 0; i < 80; i++) {
    const x = (i * 379 + index * 77) % 4096, y = 75 + (i * 139) % 590;
    layers.sky.push(`<circle cx="${x}" cy="${y}" r="${i % 5 === 0 ? 2 : 1}" fill="${light}" opacity=".3"/>`);
  }
  for (const [layer, content] of Object.entries(layers)) {
    const name = layer === 'ground' ? stage.id : `${stage.id}-${layer}`;
    writeFileSync(new URL(`${name}.svg`, out), `<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="900" viewBox="0 0 4096 900">${defs}${content.join('')}</svg>`);
  }
}
