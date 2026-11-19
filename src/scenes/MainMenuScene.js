import Phaser from 'phaser';
import { logicalSize, renderScale, sharpenText } from '../rendering.js';

const entries = ['New Game', 'Settings', 'Collections', 'Credits'];
const gold = 0xd8af69;
const ivory = '#f5eddb';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  create() {
    try { this.settings = { rain: true, shake: true, ...JSON.parse(localStorage.getItem('wtld-settings') || '{}') }; }
    catch { this.settings = { rain: true, shake: true }; }
    this.selected = 0;
    this.panel = null;
    this.renderMenu();
    this.scale.on('resize', this.renderMenu, this);
    this.input.keyboard.on('keydown-UP', this.up, this);
    this.input.keyboard.on('keydown-DOWN', this.down, this);
    this.input.keyboard.on('keydown-ENTER', this.activate, this);
    this.input.keyboard.on('keydown-SPACE', this.activate, this);
    this.input.keyboard.on('keydown-ESC', this.closePanel, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.renderMenu, this);
      for (const [key, fn] of [['UP', this.up], ['DOWN', this.down], ['ENTER', this.activate], ['SPACE', this.activate], ['ESC', this.closePanel]])
        this.input.keyboard.off(`keydown-${key}`, fn, this);
    });
  }

  renderMenu() {
    this.children.removeAll();
    this.tweens.killAll();
    this.panel = null;
    this.cameras.main.setZoom(renderScale);
    const { width: w, height: h } = logicalSize(this);
    this.cameras.main.setScroll((1 - renderScale) * w / 2, (1 - renderScale) * h / 2);
    const s = Phaser.Math.Clamp(Math.min(w / 1280, h / 760), 0.62, 1.25);
    const x = Math.max(28, w * 0.065);
    this.drawBackdrop(w, h);
    const veil = this.add.graphics();
    veil.fillGradientStyle(0x041018, 0x041018, 0x041018, 0x041018, 0.98, 0.88, 0.1, 0.03).fillRect(0, 0, w, h);
    veil.fillStyle(0x041018, 0.5).fillRect(0, 0, Math.min(w * 0.47, 640), h);
    veil.lineStyle(2, gold, 0.8).lineBetween(x, h * 0.13, x + 112 * s, h * 0.13);
    this.add.text(x, h * 0.16, 'WHERE THE', { fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: `${Math.round(58 * s)}px`, color: ivory,
      shadow: { offsetY: 5, color: '#000000', blur: 12, fill: true } });
    this.add.text(x, h * 0.16 + 58 * s, 'LIGHT DIES', { fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: `${Math.round(70 * s)}px`, color: ivory,
      shadow: { offsetY: 5, color: '#000000', blur: 12, fill: true } });
    this.add.text(x + 3, h * 0.16 + 143 * s, 'A LIGHT LOST TO THE STORM', { fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(12 * s)}px`, letterSpacing: 3, color: '#d2b17a' });
    this.rows = entries.map((name, i) => {
      const y = h * 0.49 + i * 61 * s;
      const bg = this.add.rectangle(x + 175 * s, y + 18 * s, 350 * s, 46 * s, 0xb9ac79, 0).setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => this.select(i));
      bg.on('pointerup', () => { this.select(i); this.activate(); });
      const glyph = this.add.text(x + 4, y - 3 * s, '✦', { fontFamily: 'Georgia, serif', fontSize: `${Math.round(27 * s)}px`, color: '#f1c276' });
      const text = this.add.text(x + 42 * s, y, name, { fontFamily: 'Georgia, serif', fontSize: `${Math.round(24 * s)}px`, color: '#b1bfbd' });
      return { bg, glyph, text };
    });
    this.select(this.selected);
    this.add.text(x, h - 40, '↑ ↓ SELECT     ENTER CONFIRM', { fontFamily: 'Arial, sans-serif', fontSize: '11px', letterSpacing: 2, color: '#9eadae' });
    this.add.text(w - 28, h - 40, 'PROTOTYPE  •  SOLO', { fontFamily: 'Arial, sans-serif', fontSize: '11px', letterSpacing: 2, color: '#9eadae' }).setOrigin(1, 0);
    sharpenText(this);
  }

  drawBackdrop(w, h) {
    const g = this.add.graphics();
    g.fillGradientStyle(0x111e2d, 0x1b2c3b, 0x53636b, 0x2c4250, 1).fillRect(0, 0, w, h);
    g.fillStyle(0xdbe1dd, 0.2).fillCircle(w * 0.8, h * 0.22, h * 0.17);
    g.fillStyle(0xe5e7db, 0.5).fillCircle(w * 0.8, h * 0.22, h * 0.065);
    for (let i = 0; i < 8; i++) g.fillStyle(0x192e3c, 0.3 + i * 0.03).fillEllipse(w * i / 7, h * (0.23 + i % 3 * 0.09), w * 0.5, h * 0.16);
    g.fillStyle(0x0a1b26, 1).fillPoints([{ x: 0, y: h * 0.85 }, { x: w * 0.4, y: h * 0.7 }, { x: w * 0.58, y: h * 0.76 },
      { x: w * 0.78, y: h * 0.67 }, { x: w, y: h * 0.78 }, { x: w, y: h }, { x: 0, y: h }], true);
    const x = w * 0.8, top = h * 0.19, bottom = h * 0.72, t = h * 0.075;
    g.fillStyle(0x01080d, 0.7).fillEllipse(x + t * 0.36, bottom + t * 0.28, t * 4.8, t * 1.15);
    g.fillStyle(0x061018, 1).fillPoints([{ x: x - t * 1.2, y: bottom }, { x: x + t * 1.2, y: bottom }, { x: x + t * 0.65, y: top + t }, { x: x - t * 0.65, y: top + t }], true);
    g.fillStyle(0x475764, 0.8).fillPoints([{ x: x - t * 1.12, y: bottom }, { x: x - t * 0.61, y: top + t }, { x: x - t * 0.15, y: top + t }, { x: x - t * 0.2, y: bottom }], true);
    g.fillStyle(0x1c2d39, 0.95).fillPoints([{ x: x + t * 0.35, y: top + t }, { x: x + t * 0.65, y: top + t }, { x: x + t * 1.2, y: bottom }, { x: x + t * 0.43, y: bottom }], true);
    for (let i = 0; i < 6; i++) g.lineStyle(1, 0x9ca5a4, 0.18).lineBetween(x - t * (0.65 + i * 0.08), top + t * (1.3 + i), x + t * (0.65 + i * 0.08), top + t * (1.3 + i));
    for (let i = 0; i < 10; i++) {
      const by = top + t * (1.5 + i * 0.68);
      g.lineStyle(1, 0x87969a, 0.17).lineBetween(x - t * (0.55 + i * 0.065), by, x + t * (0.38 + i * 0.035), by);
      g.lineStyle(1, 0x87969a, 0.11).lineBetween(x - t * (0.12 + i % 2 * 0.25), by, x - t * (0.12 + i % 2 * 0.25), by + t * 0.54);
    }
    for (const windowY of [top + t * 2.7, top + t * 4.9]) {
      g.fillStyle(0x03080d, 1).fillRect(x + t * 0.08, windowY, t * 0.24, t * 0.48);
      g.fillStyle(0xf8c979, 0.28).fillRect(x + t * 0.12, windowY + t * 0.04, t * 0.16, t * 0.35);
      g.lineStyle(2, 0x9ba09b, 0.35).strokeRect(x + t * 0.08, windowY, t * 0.24, t * 0.48);
    }
    g.fillStyle(0x071018, 1).fillPoints([{ x: x - t * 1.08, y: top + t * 0.05 }, { x: x + t * 1.08, y: top + t * 0.05 }, { x: x + t * 0.82, y: top - t * 0.23 }, { x: x - t * 0.82, y: top - t * 0.23 }], true);
    g.fillStyle(0x102330, 1).fillRect(x - t * 0.9, top, t * 1.8, t * 0.72);
    g.lineStyle(2, 0xb8a77e, 0.68).strokeRect(x - t * 0.9, top, t * 1.8, t * 0.72);
    g.fillStyle(0x394c59, 0.9).fillPoints([{ x: x + t * 0.58, y: top }, { x: x + t * 0.9, y: top }, { x: x + t * 1.04, y: top + t * 0.72 }, { x: x + t * 0.58, y: top + t * 0.72 }], true);
    g.lineStyle(2, 0x8f9a96, 0.5).lineBetween(x - t * 1.1, top + t * 0.77, x + t * 1.08, top + t * 0.77);
    g.fillStyle(0xffd592, 0.24).fillCircle(x, top + t * 0.36, t * 1.9);
    g.fillStyle(0xffe3ab, 1).fillCircle(x, top + t * 0.36, t * 0.12);
    g.fillStyle(0x030a11, 1).fillRect(x - t * 0.3, bottom - t * 1.7, t * 0.6, t * 1.7);
    g.fillStyle(0x0b2635, 1).fillRect(0, h * 0.82, w, h * 0.18);
    for (let i = 0; i < 7; i++) { g.lineStyle(2, 0x83b1ba, 0.16); for (let j = 0; j < 12; j++) g.lineBetween(j * w / 12, h * (0.84 + i * 0.025), j * w / 12 + w * 0.07, h * (0.84 + i * 0.025) - 4); }
    const fog = this.add.rectangle(w * 0.79, h * 0.62, w * 0.52, h * 0.22, 0xd4e2dc, 0.07);
    this.tweens.add({ targets: fog, alpha: 0.16, duration: 3100, yoyo: true, repeat: -1 });
    if (this.settings.rain) {
      const rain = this.add.graphics().lineStyle(1, 0xd6e6e5, 0.16);
      for (let i = 0; i < 125; i++) rain.lineBetween((i * 173.3) % w, (i * 91.7) % h, (i * 173.3) % w - 11, (i * 91.7) % h + 26);
      this.tweens.add({ targets: rain, y: 28, alpha: 0.5, duration: 800, yoyo: true, repeat: -1 });
    }
  }

  select(index) {
    this.selected = Phaser.Math.Wrap(index, 0, entries.length);
    this.rows.forEach((row, i) => { row.glyph.setVisible(i === this.selected); row.bg.setFillStyle(0xd6c393, i === this.selected ? 0.16 : 0);
      row.text.setColor(i === this.selected ? ivory : '#b1bfbd'); });
  }
  up() { if (!this.panel) this.select(this.selected - 1); }
  down() { if (!this.panel) this.select(this.selected + 1); }
  activate() { if (this.panel) return; const name = entries[this.selected]; if (name === 'New Game') this.scene.start('PrototypeLevel'); else this.showPanel(name); }
  closePanel() { if (this.panel) { this.panel.destroy(true); this.panel = null; } }

  showPanel(name) {
    const { width: w, height: h } = logicalSize(this);
    const s = Phaser.Math.Clamp(Math.min(w / 1280, h / 760), 0.65, 1.1);
    const pw = Math.min(w - 32, 560 * s), ph = Math.min(h - 32, 370 * s), x = w / 2 - pw / 2 + 32 * s, y = h / 2 - ph / 2 + 94 * s;
    this.panel = this.add.container(0, 0).setDepth(10);
    this.panel.add(this.add.rectangle(w / 2, h / 2, w, h, 0x02070b, 0.75).setInteractive());
    this.panel.add(this.add.rectangle(w / 2, h / 2, pw, ph, 0x10232d, 0.99).setStrokeStyle(2, gold, 0.8));
    this.panel.add(this.add.text(x, h / 2 - ph / 2 + 25 * s, name.toUpperCase(), { fontFamily: 'Georgia, serif', fontSize: `${Math.round(31 * s)}px`, color: ivory }));
    this.panel.add(this.add.text(w / 2 + pw / 2 - 26 * s, h / 2 - ph / 2 + 25 * s, '✕', { fontSize: `${Math.round(22 * s)}px`, color: ivory }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerup', () => this.closePanel()));
    const style = { fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(17 * s)}px`, color: '#d8e1dc', lineSpacing: 12 };
    if (name === 'Settings') {
      for (const [i, key, label] of [[0, 'rain', 'Rain effects'], [1, 'shake', 'Screen shake']]) {
        const line = this.add.text(x, y + i * 62 * s, '', style).setInteractive({ useHandCursor: true });
        const refresh = () => line.setText(`${label}     ${this.settings[key] ? 'ON' : 'OFF'}`);
        refresh();
        line.on('pointerup', () => { this.settings[key] = !this.settings[key]; localStorage.setItem('wtld-settings', JSON.stringify(this.settings)); refresh(); });
        this.panel.add(line);
      }
      this.panel.add(this.add.text(x, y + 150 * s, 'Settings are saved in this browser.', { ...style, color: '#9eafb0' }));
    } else if (name === 'Collections') this.panel.add(this.add.text(x, y, 'Nothing discovered yet.\nExplore the island when the story arrives.', style));
    else this.panel.add(this.add.text(x, y, 'WHERE THE LIGHT DIES\n\nA three-person game project\nLucas  ·  Neel  ·  Axel\n\nPrototype in progress.', style));
    this.panel.add(this.add.text(w / 2, h / 2 + ph / 2 - 31 * s, 'ESC TO CLOSE', { fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(11 * s)}px`, color: '#9eafb0', letterSpacing: 2 }).setOrigin(0.5));
    sharpenText(this);
  }
}
