import { mkdirSync, writeFileSync } from 'node:fs';
import { CHAPTER_STAGES } from '../src/levels/chapterData.js';

const outDir = new URL('../assets/environment/parkour/', import.meta.url);
mkdirSync(outDir, { recursive: true });

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function grain(rand, color, count = 560) {
  return Array.from({ length: count }, () => {
    const x = Math.round(rand() * 4096);
    const y = Math.round(rand() * 890);
    const radius = (rand() * 1.8 + 0.4).toFixed(1);
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="${(rand() * 0.15 + 0.03).toFixed(2)}"/>`;
  }).join('');
}

function coast(rand) {
  let result = `<rect width="4096" height="900" fill="url(#coastSky)"/>
    <ellipse cx="820" cy="190" rx="740" ry="380" fill="url(#coastMoon)"/>
    <path d="M0 410 Q700 290 1280 410 T2600 360 T4096 430 V900 H0Z" fill="#253755" opacity=".8"/>
    <path d="M0 575 Q430 460 880 545 T1840 505 T2770 570 T4096 495 V900 H0Z" fill="#172844"/>
    <path d="M0 785 Q400 730 800 790 T1600 778 T2430 800 T3320 765 T4096 795 V900 H0Z" fill="#0b2034"/>
    <path d="M0 795 Q190 780 375 800 T750 800 T1120 795 T1510 805 T1900 795 T2280 800 T2650 790 T3090 805 T3510 800 T4096 798" fill="none" stroke="#82d0e1" stroke-width="7" opacity=".3"/>`;
  for (let x = 70; x < 4200; x += 150 + rand() * 110) {
    const y = 560 + rand() * 150;
    result += `<path d="M${x} ${y + 120} l${70 + rand() * 85} ${-130 - rand() * 130} l${-20 - rand() * 25} ${140 + rand() * 100}Z" fill="#0b1729" opacity="${(0.38 + rand() * .3).toFixed(2)}"/>`;
  }
  for (const x of [980, 1880, 3050, 3800]) {
    result += `<path d="M${x} 740 v-210 h17 v210 m-26 -180 h70" stroke="#090f1c" stroke-width="18" fill="none"/>
      <path d="M${x + 5} 540 l-60 -26 m66 22 l65 -35" stroke="#b5d5de" stroke-width="3" opacity=".3"/>`;
  }
  result += `<path d="M2540 605 Q2660 480 2800 600" stroke="#a7e5ef" stroke-width="8" opacity=".14" fill="none"/>
    ${grain(rand, '#d7e9f0', 650)}`;
  return result;
}

function facility(rand) {
  let result = `<rect width="4096" height="900" fill="url(#facilitySky)"/>
    <path d="M0 0 H4096 V260 Q3600 200 3100 250 T2100 210 T1030 250 T0 225Z" fill="#080d1b"/>
    <path d="M0 790 H4096 V900 H0Z" fill="#0a1120"/>`;
  for (let x = 0; x < 4300; x += 515) {
    result += `<path d="M${x + 50} 800 V235 h390 V800" fill="none" stroke="#111b31" stroke-width="62"/>
      <path d="M${x + 50} 800 V235 h390 V800" fill="none" stroke="#57969f" stroke-width="7" opacity=".28"/>
      <path d="M${x + 90} 340 h310 M${x + 90} 430 h310" stroke="#76bdc1" stroke-width="3" opacity=".14"/>
      <rect x="${x + 175}" y="290" width="132" height="190" rx="11" fill="#07151f" stroke="#7b849c" stroke-width="5" opacity=".55"/>
      <path d="M${x + 242} 325 v120 M${x + 196} 385 h93" stroke="#7bd9dd" stroke-width="4" opacity=".25"/>`;
  }
  for (let x = 340; x < 4400; x += 780) {
    result += `<circle cx="${x}" cy="390" r="138" fill="url(#facilityGlow)"/>
      <circle cx="${x}" cy="390" r="96" fill="none" stroke="#6394a1" stroke-width="17" opacity=".45"/>
      <circle cx="${x}" cy="390" r="65" fill="#101d32" stroke="#a07aa9" stroke-width="6" opacity=".65"/>`;
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      const cx = (x + Math.cos(a) * 117).toFixed(1);
      const cy = (390 + Math.sin(a) * 117).toFixed(1);
      result += `<circle cx="${cx}" cy="${cy}" r="5" fill="#b5d5d3" opacity=".36"/>`;
    }
  }
  for (const x of [740, 1740, 2800, 3700]) {
    result += `<path d="M${x} 0 V180 q0 70 65 70 h70" fill="none" stroke="#162c3b" stroke-width="35"/>
      <path d="M${x} 0 V180 q0 70 65 70 h70" fill="none" stroke="#83c6bf" stroke-width="3" opacity=".4"/>
      <path d="M${x - 70} 60 l190 540 h-420Z" fill="url(#facilityShaft)" opacity=".22"/>`;
  }
  result += `<path d="M0 170 H4096 M0 185 H4096" stroke="#81748b" stroke-width="6" opacity=".16"/>
    ${grain(rand, '#b9e8e5', 590)}`;
  return result;
}

function tree(x, base, size, color, rand) {
  const sway = (rand() - 0.5) * 50 * size;
  const top = base - (220 + rand() * 160) * size;
  const width = (15 + rand() * 18) * size;
  let branches = '';
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const y = top + (base - top) * (0.25 + i * 0.15);
    const reach = (74 + rand() * 65) * size * side;
    branches += `<path d="M ${x + sway * (1 - i * 0.13)} ${y} Q ${x + reach * 0.5} ${y - 35 * size} ${x + reach} ${y - (70 + rand() * 40) * size}" fill="none" stroke="${color}" stroke-width="${Math.max(2, (10 - i * 1.3) * size)}" stroke-linecap="round"/>`;
    branches += `<path d="M ${x + reach * 0.65} ${y - 42 * size} l ${30 * size * side} ${-42 * size}" fill="none" stroke="${color}" stroke-width="${Math.max(1.5, 4 * size)}" stroke-linecap="round"/>`;
  }
  return `<path d="M ${x - width} ${base} Q ${x - 14 * size} ${base - 70 * size} ${x + sway} ${top} Q ${x + width * 0.5} ${base - 110 * size} ${x + width} ${base} Z" fill="${color}"/>${branches}`;
}

function forest(rand) {
  let result = `<rect width="4096" height="900" fill="url(#forestSky)"/>
    <ellipse cx="1080" cy="490" rx="950" ry="590" fill="url(#amberHaze)"/>
    <ellipse cx="3330" cy="420" rx="760" ry="520" fill="url(#amberHaze)" opacity=".7"/>
    <ellipse cx="2450" cy="490" rx="620" ry="370" fill="url(#violetHaze)" opacity=".6"/>
    <path d="M0 590 Q400 515 760 600 T1480 565 T2250 610 T3010 550 T4096 610 L4096 900 H0Z" fill="#4c382d" opacity=".48"/>
    <path d="M0 680 Q430 590 850 670 T1750 630 T2620 675 T3400 620 T4096 670 L4096 900 H0Z" fill="#251f1d" opacity=".58"/>
    <g opacity=".47">`;
  for (let x = 60; x < 4200; x += 150 + rand() * 115) result += tree(x, 690 + rand() * 35, 0.38 + rand() * 0.45, '#1b1b1d', rand);
  result += `</g><g opacity=".82">`;
  for (let x = 160; x < 4200; x += 390 + rand() * 260) result += tree(x, 735 + rand() * 35, 0.75 + rand() * 0.55, '#101316', rand);
  result += `</g><path d="M0 640 Q600 575 1200 620 T2500 625 T4096 600" fill="none" stroke="#dac197" stroke-width="36" opacity=".06" filter="url(#soft)"/>
    <path d="M0 710 Q560 680 1200 708 T2500 695 T4096 690" fill="none" stroke="#f1d8a8" stroke-width="42" opacity=".07" filter="url(#soft)"/>
    <g opacity=".52"><path d="M1880 605 l28 -145 22 145 m-58 -80 h116 M1940 605 l18 -95 25 95" stroke="#17191b" stroke-width="13" fill="none"/><path d="M1902 459 l19 -40 19 40Z" fill="#17191b"/></g>
    ${grain(rand, '#ffe9b7', 460)}`;
  return result;
}

function cavern(rand) {
  let result = `<rect width="4096" height="900" fill="url(#caveSky)"/>
    <ellipse cx="850" cy="530" rx="950" ry="390" fill="url(#tealHaze)"/>
    <ellipse cx="3000" cy="570" rx="1200" ry="390" fill="url(#tealHaze)" opacity=".75"/>
    <path d="M0 0 H4096 V310 Q3700 220 3390 310 T2700 300 T2070 250 T1300 280 T600 250 T0 330 Z" fill="#071315"/>
    <path d="M0 900 V445 Q420 330 760 450 T1500 410 T2270 430 T3090 390 T4096 445 V900Z" fill="#0b282b" opacity=".55"/>`;
  for (let x = 0; x < 4100; x += 85 + rand() * 105) {
    const h = 70 + rand() * 150;
    result += `<path d="M${x} 0 l${30 + rand() * 70} 0 l${-15 - rand() * 25} ${h}Z" fill="#071315" opacity="${(0.45 + rand() * 0.4).toFixed(2)}"/>`;
  }
  for (let x = 80; x < 4100; x += 165 + rand() * 160) {
    const y = 280 + rand() * 220;
    result += `<path d="M${x} ${y + 165} l${-80 - rand() * 80} ${120 + rand() * 90} l${125 + rand() * 100} ${-155 - rand() * 120}Z" fill="#17383a" opacity=".48"/>`;
  }
  for (const x of [500, 1700, 2900, 3650]) {
    result += `<path d="M${x - 220} 0 h300 l-520 790 h-380Z" fill="url(#lightShaft)" opacity=".5"/>
      <path d="M${x + 20} 0 h140 l-165 790 h-230Z" fill="url(#lightShaft)" opacity=".23"/>`;
  }
  for (const x of [1120, 2250, 3320]) {
    result += `<path d="M${x} 0 Q${x - 80} 220 ${x + 65} 540" fill="none" stroke="#03090b" stroke-width="8" opacity=".78"/>`;
    for (let y = 25; y < 500; y += 25) result += `<ellipse cx="${x + Math.sin(y * 0.015) * 24}" cy="${y}" rx="8" ry="13" fill="none" stroke="#020607" stroke-width="4" opacity=".8"/>`;
  }
  result += `<path d="M0 850 Q500 825 900 850 T1750 848 T2600 853 T3400 845 T4096 850 V900 H0Z" fill="#10383e" opacity=".8"/>
    <path d="M0 860 Q300 847 600 861 T1400 862 T2400 859 T3300 864 T4096 858" fill="none" stroke="#8cc9c8" stroke-width="3" opacity=".3"/>
    ${grain(rand, '#a5eee5', 620)}`;
  return result;
}

function vault(rand) {
  let result = `<rect width="4096" height="900" fill="url(#vaultSky)"/>
    <ellipse cx="1100" cy="440" rx="720" ry="520" fill="url(#goldHaze)" opacity=".72"/>
    <ellipse cx="3090" cy="460" rx="900" ry="560" fill="url(#goldHaze)" opacity=".55"/>`;
  for (let x = -180; x < 4300; x += 620) {
    result += `<path d="M${x} 800 V285 Q${x + 270} -45 ${x + 540} 285 V800" fill="none" stroke="#160f12" stroke-width="100"/>
      <path d="M${x + 14} 800 V300 Q${x + 270} 25 ${x + 526} 300 V800" fill="none" stroke="#544034" stroke-width="14" opacity=".65"/>
      <path d="M${x + 74} 780 V332 Q${x + 270} 105 ${x + 466} 332 V780" fill="none" stroke="#85694f" stroke-width="5" opacity=".26"/>
      <path d="M${x + 7} 365 h72 m${x + 455} 0 h72" stroke="#a88757" stroke-width="12" opacity=".4"/>`;
  }
  for (const x of [1080, 2390, 3520]) {
    result += `<circle cx="${x}" cy="405" r="175" fill="#101823" stroke="#6e603e" stroke-width="27"/>
      <circle cx="${x}" cy="405" r="145" fill="url(#lensGlow)" stroke="#9e8152" stroke-width="9"/>
      <circle cx="${x}" cy="405" r="87" fill="none" stroke="#7d9da8" stroke-width="4" opacity=".7"/>
      <path d="M${x - 135} 405 h270 M${x} 270 v270" stroke="#a1b8bb" stroke-width="5" opacity=".33"/>`;
    for (let a = 0; a < 8; a++) {
      const angle = a * Math.PI / 4;
      result += `<circle cx="${(x + Math.cos(angle) * 160).toFixed(1)}" cy="${(405 + Math.sin(angle) * 160).toFixed(1)}" r="7" fill="#d7b26d" opacity=".73"/>`;
    }
  }
  for (const [x1, y1, x2, y2] of [[280, 345, 1280, 600], [1310, 605, 2060, 220], [2100, 230, 3060, 560], [3090, 560, 3940, 285]]) {
    result += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#f9d889" stroke-width="18" opacity=".11" filter="url(#soft)"/>
      <path d="M${x1} ${y1} L${x2} ${y2}" stroke="#e8c875" stroke-width="3" opacity=".68" stroke-dasharray="3 8"/>`;
  }
  for (const x of [380, 1540, 2800, 3900]) {
    result += `<circle cx="${x}" cy="430" r="130" fill="url(#torchGlow)"/>
      <path d="M${x} 455 v130" stroke="#453524" stroke-width="13"/><path d="M${x - 15} 459 h30 l-8 35 h-14Z" fill="#6f4b28"/>
      <path d="M${x} 460 Q${x - 35} 422 ${x} 384 Q${x + 27} 425 ${x} 460Z" fill="#ffb341"/>
      <path d="M${x} 447 Q${x - 12} 423 ${x} 404 Q${x + 12} 426 ${x} 447Z" fill="#fff1a1"/>`;
  }
  result += `<path d="M0 0 H4096 V165 Q3300 90 2600 165 T1300 145 T0 175Z" fill="#09090e" opacity=".9"/>
    ${grain(rand, '#ffd496', 500)}`;
  return result;
}

function platformArt(stage, rand) {
  const coastStage = stage.id === 'storm-coast';
  const facilityStage = stage.id === 'abandoned-facility';
  const forestStage = stage.id === 'thornwood';
  const caveStage = stage.id === 'drowned-cavern';
  const topColor = coastStage ? '#7dbbc9' : facilityStage ? '#83c7c8' : forestStage ? '#b59a6d' : caveStage ? '#a5c8c0' : '#baa477';
  const face = coastStage ? 'url(#coastFace)' : facilityStage ? 'url(#facilityFace)' : forestStage ? 'url(#forestFace)' : caveStage ? 'url(#caveFace)' : 'url(#vaultFace)';
  let result = '';
  for (const [index, [start, end, top]] of stage.platforms.entries()) {
    const left = start === 0 ? 0 : start + 14;
    const right = end === stage.width ? end : end - 10;
    result += `<path d="M${start} ${top + 11} L${end} ${top + 11} L${right} ${top + 55} L${right - 23} ${top + 114} L${right + 5} 900 H${left - 6} L${left + 13} ${top + 122} L${left - 12} ${top + 55}Z" fill="${face}"/>
      <path d="M${start} ${top + 10} L${end} ${top + 10} L${end - 13} ${top + 34} L${start + 11} ${top + 34}Z" fill="${topColor}" opacity=".32"/>
      <path d="M${start} ${top} L${end} ${top}" stroke="${topColor}" stroke-width="8" opacity=".85"/>
      <path d="M${start} ${top + 25} L${end} ${top + 25}" stroke="#02080b" stroke-width="10" opacity=".72"/>`;
    for (let y = top + 61; y < 910; y += 58 + rand() * 25) {
      let course = '';
      for (let x = start + 14 + rand() * 30; x < end - 20; x += 65 + rand() * 70) {
        const width = Math.min(end - x - 16, 42 + rand() * 76);
        if (width < 12) break;
        course += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l${width.toFixed(1)} ${(-4 + rand() * 8).toFixed(1)} m${(-width * (0.1 + rand() * 0.7)).toFixed(1)} 0 l${(-5 + rand() * 10).toFixed(1)} ${20 + rand() * 28}" fill="none" stroke="${topColor}" stroke-width="${(1 + rand() * 1.7).toFixed(1)}" opacity="${caveStage ? '.16' : '.13'}"/>`;
      }
      result += course;
    }
    for (let x = start + 36; x < end - 20; x += 76 + rand() * 60) {
      const y = top + 48 + rand() * 35;
      const length = 90 + rand() * 140;
      result += `<path d="M${x} ${y} l${-24 - rand() * 25} ${length * 0.42} l${25 + rand() * 35} ${length * 0.58} l${45 + rand() * 45} ${-length * 0.45}Z" fill="${coastStage ? '#5d9fb1' : facilityStage ? '#628f9f' : caveStage ? '#719b9b' : forestStage ? '#8e6f4e' : '#967858'}" opacity="${(0.045 + rand() * 0.07).toFixed(2)}"/>`;
    }
    for (let x = start + 26; x < end - 20; x += 53 + rand() * 43) {
      const crack = top + 8 + rand() * 6;
      result += `<path d="M${x} ${crack} l${7 + rand() * 13} ${8 + rand() * 8} l${-5 + rand() * 7} ${10 + rand() * 20}" fill="none" stroke="${topColor}" stroke-width="${(1 + rand() * 1.5).toFixed(1)}" opacity=".22"/>`;
      if (forestStage) result += `<path d="M${x + 8} ${top} l${-6 - rand() * 9} ${-12 - rand() * 15} m${7} ${13} l${10 + rand() * 8} ${-17 - rand() * 16}" stroke="#0b1111" stroke-width="3" opacity=".9"/>`;
    }
    if (caveStage && index % 2 === 0) {
      const x = start + Math.min(145, (end - start) * 0.42);
      result += `<circle cx="${x}" cy="${top - 88}" r="125" fill="url(#torchGlow)"/>
        <path d="M${x} ${top - 8} v-61" stroke="#23363a" stroke-width="13"/>
        <path d="M${x - 14} ${top - 80} h28 l-8 24 h-12Z" fill="#725037"/>
        <path d="M${x} ${top - 70} Q${x - 31} ${top - 112} ${x - 3} ${top - 133} Q${x + 26} ${top - 104} ${x} ${top - 70}Z" fill="#ffaf4e"/>
        <path d="M${x} ${top - 80} Q${x - 11} ${top - 106} ${x} ${top - 117} Q${x + 12} ${top - 97} ${x} ${top - 80}Z" fill="#fff1ad"/>`;
    } else if (forestStage && index % 2 === 1) {
      const x = start + 85;
      result += `<circle cx="${x}" cy="${top - 95}" r="88" fill="url(#torchGlow)" opacity=".42"/>
        <path d="M${x} ${top} v-72" stroke="#171818" stroke-width="8"/>
        <path d="M${x - 13} ${top - 78} h26 v15 h-26Z" fill="#ad8953"/>
        <circle cx="${x}" cy="${top - 73}" r="8" fill="#fce5a1"/>`;
    } else if (coastStage && index % 2 === 1) {
      const x = start + 70;
      result += `<path d="M${x} ${top} v-82 m-9 0 h18" stroke="#172836" stroke-width="12"/>
        <circle cx="${x}" cy="${top - 87}" r="12" fill="#cceaf0" opacity=".7"/>`;
    } else if (facilityStage && index % 2 === 0) {
      const x = start + 105;
      result += `<rect x="${x - 29}" y="${top - 73}" width="58" height="73" rx="6" fill="#152630" stroke="#5c91a5" stroke-width="4"/>
        <circle cx="${x}" cy="${top - 44}" r="11" fill="#74d8da" opacity=".7"/>`;
    } else if (!coastStage && !facilityStage && !forestStage && !caveStage && index % 2 === 0) {
      const x = start + 105;
      result += `<path d="M${x - 23} ${top} v-82 l23 -24 l23 24 v82" fill="#262225" stroke="#9a8058" stroke-width="4"/>
        <circle cx="${x}" cy="${top - 79}" r="16" fill="#f7d085" opacity=".6"/>`;
    }
  }
  const endPlatform = stage.platforms.at(-1);
  const exitX = stage.width - 74;
  const exitY = endPlatform[2];
  result += `<ellipse cx="${exitX}" cy="${exitY - 62}" rx="95" ry="135" fill="url(#exitGlow)"/>
    <path d="M${exitX - 43} ${exitY} V${exitY - 125} Q${exitX} ${exitY - 177} ${exitX + 43} ${exitY - 125} V${exitY}" fill="#050a0c" stroke="${topColor}" stroke-width="7"/>
    <path d="M${exitX - 25} ${exitY - 5} V${exitY - 112} Q${exitX} ${exitY - 147} ${exitX + 25} ${exitY - 112} V${exitY - 5}" fill="url(#doorLight)" opacity=".85"/>`;
  return result;
}

function defs() {
  return `<defs>
    <linearGradient id="coastSky" x2="0" y2="1"><stop stop-color="#070d22"/><stop offset=".52" stop-color="#254d73"/><stop offset=".82" stop-color="#407f94"/><stop offset="1" stop-color="#071321"/></linearGradient>
    <radialGradient id="coastMoon"><stop stop-color="#bdd9e6" stop-opacity=".68"/><stop offset=".47" stop-color="#788bb8" stop-opacity=".24"/><stop offset="1" stop-color="#20355c" stop-opacity="0"/></radialGradient>
    <linearGradient id="coastBeam"><stop stop-color="#fff4c5" stop-opacity=".74"/><stop offset="1" stop-color="#c8f1e9" stop-opacity="0"/></linearGradient>
    <linearGradient id="facilitySky" x2="0" y2="1"><stop stop-color="#0b0b20"/><stop offset=".48" stop-color="#27374d"/><stop offset=".85" stop-color="#233f4a"/><stop offset="1" stop-color="#090d19"/></linearGradient>
    <radialGradient id="facilityGlow"><stop stop-color="#59d0c7" stop-opacity=".36"/><stop offset="1" stop-color="#513c78" stop-opacity="0"/></radialGradient>
    <linearGradient id="facilityShaft"><stop stop-color="#b7f2e9" stop-opacity=".6"/><stop offset="1" stop-color="#b7f2e9" stop-opacity="0"/></linearGradient>
    <linearGradient id="forestSky" x2="0" y2="1"><stop stop-color="#090d16"/><stop offset=".55" stop-color="#4b3a32"/><stop offset=".78" stop-color="#a0774c"/><stop offset="1" stop-color="#211a18"/></linearGradient>
    <radialGradient id="amberHaze"><stop stop-color="#efd1a2" stop-opacity=".77"/><stop offset=".45" stop-color="#ba8456" stop-opacity=".38"/><stop offset="1" stop-color="#37251f" stop-opacity="0"/></radialGradient>
    <radialGradient id="violetHaze"><stop stop-color="#af78c7" stop-opacity=".32"/><stop offset="1" stop-color="#702d85" stop-opacity="0"/></radialGradient>
    <linearGradient id="caveSky" x2="0" y2="1"><stop stop-color="#061113"/><stop offset=".45" stop-color="#15383b"/><stop offset=".82" stop-color="#2b6b6d"/><stop offset="1" stop-color="#071b20"/></linearGradient>
    <radialGradient id="tealHaze"><stop stop-color="#a8d8d1" stop-opacity=".55"/><stop offset="1" stop-color="#2d7b7d" stop-opacity="0"/></radialGradient>
    <linearGradient id="lightShaft" x2=".35" y2="1"><stop stop-color="#ecfff3" stop-opacity=".7"/><stop offset="1" stop-color="#7fd1c6" stop-opacity="0"/></linearGradient>
    <linearGradient id="vaultSky" x2="0" y2="1"><stop stop-color="#09090e"/><stop offset=".53" stop-color="#342821"/><stop offset="1" stop-color="#100d10"/></linearGradient>
    <radialGradient id="goldHaze"><stop stop-color="#ad7543" stop-opacity=".5"/><stop offset="1" stop-color="#5c3625" stop-opacity="0"/></radialGradient>
    <radialGradient id="lensGlow"><stop stop-color="#a9dfe0" stop-opacity=".9"/><stop offset=".4" stop-color="#446b7d" stop-opacity=".67"/><stop offset="1" stop-color="#0d1824"/></radialGradient>
    <radialGradient id="torchGlow"><stop stop-color="#ffad3e" stop-opacity=".45"/><stop offset="1" stop-color="#ffad3e" stop-opacity="0"/></radialGradient>
    <radialGradient id="exitGlow"><stop stop-color="#dfd4a2" stop-opacity=".4"/><stop offset="1" stop-color="#dfd4a2" stop-opacity="0"/></radialGradient>
    <linearGradient id="forestFace" x2=".4" y2="1"><stop stop-color="#302922"/><stop offset=".3" stop-color="#171719"/><stop offset="1" stop-color="#090b10"/></linearGradient>
    <linearGradient id="coastFace" x2=".4" y2="1"><stop stop-color="#294251"/><stop offset=".3" stop-color="#142432"/><stop offset="1" stop-color="#070f1d"/></linearGradient>
    <linearGradient id="facilityFace" x2=".4" y2="1"><stop stop-color="#385359"/><stop offset=".3" stop-color="#172c34"/><stop offset="1" stop-color="#080f1d"/></linearGradient>
    <linearGradient id="caveFace" x2=".3" y2="1"><stop stop-color="#31565a"/><stop offset=".26" stop-color="#123034"/><stop offset="1" stop-color="#06171b"/></linearGradient>
    <linearGradient id="vaultFace" x2=".2" y2="1"><stop stop-color="#453629"/><stop offset=".32" stop-color="#201a1b"/><stop offset="1" stop-color="#0a0b11"/></linearGradient>
    <linearGradient id="doorLight" x2="0" y2="1"><stop stop-color="#e6ddb3"/><stop offset="1" stop-color="#6f8f8e" stop-opacity=".15"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="22"/></filter>
  </defs>`;
}

for (const stage of CHAPTER_STAGES.slice(0, 5)) {
  const artWidth = stage.artWidth ?? stage.width;
  const artStage = { ...stage, width: artWidth,
    platforms: stage.platforms.filter(([start]) => start < artWidth).map(([start, end, top]) => [start, Math.min(end, artWidth), top]) };
  const rand = random([...stage.id].reduce((value, char) => value * 31 + char.charCodeAt(0), 1729));
  const scene = stage.id === 'storm-coast' ? coast(rand)
    : stage.id === 'abandoned-facility' ? facility(rand)
      : stage.id === 'thornwood' ? forest(rand) : stage.id === 'drowned-cavern' ? cavern(rand) : vault(rand);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${artWidth}" height="${stage.height}" viewBox="0 0 ${artWidth} ${stage.height}">${defs()}${scene}${platformArt(artStage, rand)}</svg>`;
  const path = new URL(`${stage.id}.svg`, outDir);
  writeFileSync(path, svg);
  console.log(path.pathname);
}
