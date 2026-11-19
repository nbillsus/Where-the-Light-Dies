import Phaser from 'phaser';
import lighthouseUrl from '../../assets/environment/menu_lighthouse.png?url';
import { logicalSize, renderScale, sharpenText } from '../rendering.js';

const entries = ['New Game', 'Settings', 'Collections', 'Credits'];
const gold = 0xd8af69;
const ivory = '#f5eddb';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  preload() { this.load.image('menu-lighthouse', lighthouseUrl); }

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
    veil.fillGradientStyle(0x030812, 0x030812, 0x030812, 0x030812, 0.69, 0.05, 0.78, 0.17).fillRect(0, 0, w, h);
    veil.fillStyle(0x030812, 0.13).fillRect(0, 0, Math.min(w * 0.45, 600), h);
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
    const image = this.add.image(w / 2, h / 2, 'menu-lighthouse');
    const coverScale = Math.max(w / image.width, h / image.height);
    image.setDisplaySize(image.width * coverScale, image.height * coverScale);
    if (this.settings.rain) {
      const rain = this.add.graphics().lineStyle(1, 0xd6e6e5, 0.1);
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
