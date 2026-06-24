import SoundManager from '../audio/SoundManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = 390, H = 844;
    this.W = W; this.H = H;
    this.bounceSpheres = [];

    // Fondo oscuro simple — sin nebulosas ni franjas
    this.add.rectangle(W / 2, H / 2, W, H, 0x090716).setDepth(0);
    this.createStars(W, H);
    this.createBgParticles(W, H);
    this.createBouncingSpheres(W, H);

    // Logo
    const title = this.add.text(W / 2, 168, 'ORBIA', {
      fontFamily: 'Arial',
      fontSize: '76px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#3498db',
      strokeThickness: 7,
      shadow: { offsetX: 0, offsetY: 0, color: '#3498db', blur: 28, fill: true }
    }).setOrigin(0.5).setDepth(5);

    this.tweens.add({
      targets: title,
      scaleX: 1.045, scaleY: 1.045,
      duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.add.text(W / 2, 258, 'Conecta las esferas', {
      fontFamily: 'Arial', fontSize: '19px', color: '#7788bb'
    }).setOrigin(0.5).setDepth(5);

    // Layout 2-2-1
    const maxLevel    = parseInt(localStorage.getItem('orbia_maxLevel') || '0');
    const hasProgress = maxLevel > 1;

    if (hasProgress) {
      // Fila 1: CONTINUAR  |  CLÁSICO
      this.createSphereButton(98,  375, `▶ Nv.${maxLevel}\nCONTINUAR`, 0xf39c12, 54, () => this.startGame(maxLevel, 'classic'));
      this.createSphereButton(292, 375, 'CLÁSICO',    0x2ecc71, 62, () => this.startGame(1, 'classic'));
      // Fila 2: SECUENCIA  |  MATCH
      this.createSphereButton(98,  515, 'SECUENCIA',  0x9b59b6, 62, () => this.startGame(1, 'sequence'));
      this.createSphereButton(292, 515, 'MATCH',       0xe05a2b, 62, () => this.startGame(1, 'evade'));
      // Fila 3: CÓMO JUGAR (centrado)
      this.createSphereButton(195, 645, 'CÓMO\nJUGAR', 0x2980b9, 50, () => this.showInstructions());
    } else {
      // Fila 1: CLÁSICO  |  SECUENCIA
      this.createSphereButton(98,  435, 'CLÁSICO',    0x2ecc71, 62, () => this.startGame(1, 'classic'));
      this.createSphereButton(292, 435, 'SECUENCIA',  0x9b59b6, 62, () => this.startGame(1, 'sequence'));
      // Fila 2: MATCH (centrado)
      this.createSphereButton(195, 570, 'MATCH',       0xe05a2b, 62, () => this.startGame(1, 'evade'));
      // Fila 3: CÓMO JUGAR (centrado)
      this.createSphereButton(195, 698, 'CÓMO\nJUGAR', 0x2980b9, 50, () => this.showInstructions());
    }

    // Mute
    const sfx = new SoundManager();
    const muteTxt = this.add.text(W - 14, 14, sfx.muted ? '🔇' : '🔊', {
      fontFamily: 'Arial', fontSize: '26px'
    }).setOrigin(1, 0).setDepth(10).setInteractive({ cursor: 'pointer' });
    muteTxt.on('pointerdown', () => muteTxt.setText(sfx.toggleMute() ? '🔇' : '🔊'));

    this.add.text(W / 2, H - 18, 'v1.0.0', {
      fontFamily: 'Arial', fontSize: '13px', color: '#383860'
    }).setOrigin(0.5).setDepth(5);

    this.cameras.main.fadeIn(450, 0, 0, 0);
  }

  // ── Fondo ─────────────────────────────────────────────────────────────────

  createStars(W, H) {
    for (let i = 0; i < 75; i++) {
      const x     = Phaser.Math.Between(0, W);
      const y     = Phaser.Math.Between(0, H);
      const r     = Math.random() < 0.12 ? 2.2 : Math.random() < 0.35 ? 1.4 : 0.9;
      const alpha = Phaser.Math.FloatBetween(0.2, 0.85);
      const g     = this.add.graphics().setDepth(2);
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(x, y, r);
      if (r >= 2) {
        g.fillStyle(0xffffff, alpha * 0.35);
        g.fillRect(x - 5, y - 0.4, 10, 0.8);
        g.fillRect(x - 0.4, y - 5, 0.8, 10);
      }
      this.tweens.add({
        targets: g,
        alpha: { from: alpha, to: alpha * 0.1 },
        duration: Phaser.Math.Between(900, 2800),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2500)
      });
    }
  }

  createBgParticles(W, H) {
    for (let i = 0; i < 16; i++) {
      const x     = Phaser.Math.Between(0, W);
      const y     = Phaser.Math.Between(0, H);
      const size  = Phaser.Math.FloatBetween(1.2, 2.8);
      const alpha = Phaser.Math.FloatBetween(0.04, 0.11);
      const color = Phaser.Math.RND.pick([0x4466ff, 0x8833ff, 0x0099dd]);
      const p     = this.add.graphics().setDepth(2);
      const pts   = [];
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2;
        pts.push({ x: Math.cos(a) * size, y: Math.sin(a) * size });
      }
      p.fillStyle(color, 1);
      p.fillPoints(pts, true);
      p.setPosition(x, y).setAlpha(alpha);
      this.tweens.add({
        targets: p,
        y: y - Phaser.Math.Between(60, 140),
        alpha: { from: alpha, to: 0 },
        duration: Phaser.Math.Between(5000, 11000),
        delay: Phaser.Math.Between(0, 7000),
        repeat: -1, ease: 'Linear',
        onRepeat: () => p.setPosition(Phaser.Math.Between(0, W), this.H + 10).setAlpha(alpha)
      });
    }
  }

  // ── Esferas rebotantes de fondo ────────────────────────────────────────────

  createBouncingSpheres(W, H) {
    const BG = 0x1a1830;
    const specs = [
      { x: 80,       y: 180,     vx:  0.42, vy:  0.30, r: 34, color: BG, num: '3' },
      { x: W - 70,   y: 260,     vx: -0.35, vy:  0.46, r: 28, color: BG, num: '5' },
      { x: 155,      y: H - 200, vx:  0.50, vy: -0.36, r: 38, color: BG, num: '1' },
      { x: W - 90,   y: H - 160, vx: -0.38, vy: -0.28, r: 26, color: BG, num: '4' },
      { x: 55,       y: H / 2,   vx:  0.32, vy: -0.44, r: 30, color: BG, num: '2' },
    ];

    for (const s of specs) {
      const gfx = this.add.graphics().setDepth(3);
      const txt = this.add.text(s.x, s.y, s.num, {
        fontFamily: 'Arial',
        fontSize: `${Math.round(s.r * 0.68)}px`,
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5).setDepth(4).setAlpha(0.09);

      this.drawBounceSphere(gfx, s.x, s.y, s.r);
      this.bounceSpheres.push({ ...s, gfx, txt });
    }
  }

  drawBounceSphere(gfx, x, y, r) {
    gfx.clear();
    gfx.lineStyle(1.2, 0xffffff, 0.12);
    gfx.strokeCircle(x, y, r);
  }

  update() {
    if (!this.bounceSpheres?.length) return;
    for (const s of this.bounceSpheres) {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x - s.r < 0)        { s.x = s.r;          s.vx =  Math.abs(s.vx); }
      if (s.x + s.r > this.W)   { s.x = this.W - s.r; s.vx = -Math.abs(s.vx); }
      if (s.y - s.r < 0)        { s.y = s.r;          s.vy =  Math.abs(s.vy); }
      if (s.y + s.r > this.H)   { s.y = this.H - s.r; s.vy = -Math.abs(s.vy); }
      this.drawBounceSphere(s.gfx, s.x, s.y, s.r);
      s.txt.setPosition(s.x, s.y);
    }
  }

  // ── Botón esfera ──────────────────────────────────────────────────────────

  createSphereButton(x, y, label, color, r, onClick) {
    const g = this.add.graphics().setDepth(5);

    const draw = (scale) => {
      g.clear();
      const cr = r * scale;
      g.fillStyle(color, 0.06);  g.fillCircle(x, y, cr + 20);
      g.fillStyle(color, 0.22);  g.fillCircle(x, y, cr + 8);
      g.fillStyle(color, 1);     g.fillCircle(x, y, cr);
      g.lineStyle(2, 0xffffff, 0.28); g.strokeCircle(x, y, cr);
    };

    draw(1);

    // Nombre dentro — ajuste de fuente según longitud
    const lines   = label.split('\n');
    const maxLen  = Math.max(...lines.map(l => l.length));
    const fSize   = maxLen <= 5 ? 17 : maxLen <= 8 ? 15 : 13;
    const lineH   = lines.length > 1 ? fSize + 3 : 0;
    const textY   = y - (lines.length > 1 ? lineH / 2 : 0);

    const txt = this.add.text(x, textY, label, {
      fontFamily: 'Arial',
      fontSize:   `${fSize}px`,
      fontStyle:  'bold',
      color:      '#ffffff',
      align:      'center',
      lineSpacing: 3,
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 5, fill: true }
    }).setOrigin(0.5, 0.5).setDepth(6);

    const hitR  = r + 20;
    const zone  = this.add.zone(x, y, hitR * 2, hitR * 2)
      .setInteractive({ cursor: 'pointer' }).setDepth(7);

    const targets = [txt];

    zone.on('pointerover', () => {
      draw(1.1);
      this.tweens.add({ targets, scaleX: 1.08, scaleY: 1.08, duration: 90, ease: 'Power1' });
    });
    zone.on('pointerout', () => {
      draw(1);
      this.tweens.add({ targets, scaleX: 1, scaleY: 1, duration: 110, ease: 'Power1' });
    });
    zone.on('pointerdown', () => {
      draw(0.93);
      this.tweens.add({
        targets, scaleX: 0.9, scaleY: 0.9, duration: 70, yoyo: true, ease: 'Power1',
        onComplete: () => { if (txt.active) { txt.setScale(1); draw(1); } }
      });
      onClick();
    });

    // Pulso idle suave
    this.tweens.add({
      targets: txt,
      scaleX: 1.05, scaleY: 1.05,
      duration: Phaser.Math.Between(1700, 2400),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 1000)
    });
  }

  // ── Cómo jugar ────────────────────────────────────────────────────────────

  showInstructions() {
    const W = this.W, H = this.H;
    const toDestroy = [];
    const reg = (o) => { toDestroy.push(o); return o; };
    const closeAll = () => toDestroy.forEach(o => o?.active !== false && o.destroy());

    reg(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.86).setDepth(20).setInteractive());

    const panel = reg(this.add.graphics().setDepth(21));
    panel.fillStyle(0x10102a, 1);
    panel.fillRoundedRect(18, 112, W - 36, 598, 18);
    panel.lineStyle(1.5, 0x334488, 0.5);
    panel.strokeRoundedRect(18, 112, W - 36, 598, 18);

    reg(this.add.text(W / 2, 150, 'CÓMO JUGAR', {
      fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
      shadow: { offsetX: 0, offsetY: 0, color: '#3498db', blur: 14, fill: true }
    }).setOrigin(0.5).setDepth(22));

    const modes = [
      {
        label: 'CLÁSICO', color: '#2ecc71',
        lines: [
          { icon: '●', text: 'Las esferas rebotan libremente' },
          { icon: '↗', text: 'Toca la pantalla para crear un deflector' },
          { icon: '💥', text: 'Haz chocar dos esferas del mismo número' },
          { icon: '🎯', text: 'Alcanza el puntaje meta para avanzar' },
          { icon: '✦',  text: 'Mismo color = ¡puntos dobles!' },
        ]
      },
      {
        label: 'SECUENCIA', color: '#9b59b6',
        lines: [
          { icon: '●', text: 'Esferas numeradas del 1 al 5' },
          { icon: '↗', text: 'Usa el deflector para hacer chocar pares' },
          { icon: '📋', text: 'Conéctalas en orden: 1 → 2 → 3 → 4 → 5' },
          { icon: '⚠️',  text: 'Match fuera de orden = pierdes una vida' },
          { icon: '❤️', text: 'Tienes 3 vidas por nivel' },
        ]
      },
      {
        label: 'MATCH', color: '#e05a2b',
        lines: [
          { icon: '🔀', text: 'Los números en las esferas cambian solos' },
          { icon: '👆', text: 'Toca una esfera para seleccionarla' },
          { icon: '≋',  text: 'Toca otra del mismo número: ¡MATCH!' },
          { icon: '⚡', text: 'Cada rato ocurre un SWAP aleatorio' },
          { icon: '🏆', text: 'Encadena combos: x2, x3, hasta x5' },
        ]
      }
    ];

    let activeTab = 0;
    const contentItems = [];
    const tabGfxArr   = [];

    const tabW = 98, tabH = 36, tabY = 190;
    const tabStartX = W / 2 - ((modes.length - 1) * tabW) / 2;

    const renderContent = (idx) => {
      contentItems.forEach(o => o?.active !== false && o.destroy());
      contentItems.length = 0;

      let lineY = 250;
      for (const line of modes[idx].lines) {
        const ic = this.add.text(46, lineY, line.icon, { fontSize: '19px' }).setOrigin(0.5).setDepth(22);
        const bd = this.add.text(68, lineY, line.text, {
          fontFamily: 'Arial', fontSize: '15px', color: '#dde0ff', wordWrap: { width: 265 }
        }).setOrigin(0, 0.5).setDepth(22);
        contentItems.push(ic, bd);
        toDestroy.push(ic, bd);
        lineY += bd.height > 22 ? 60 : 52;
      }

      const tips = [
        '¡Mismo color = puntos dobles!',
        '¡No rompas la secuencia o pierdes vida!',
        '¡Combos x5 = máxima bonificación!'
      ];
      const tip = this.add.text(W / 2, 578, tips[idx], {
        fontFamily: 'Arial', fontSize: '14px', fontStyle: 'italic',
        color: modes[idx].color, wordWrap: { width: 310 }
      }).setOrigin(0.5).setDepth(22);
      contentItems.push(tip);
      toDestroy.push(tip);
    };

    const drawTabs = () => {
      tabGfxArr.forEach(g => g.clear());
      modes.forEach((m, i) => {
        const tx  = tabStartX + i * tabW;
        const col = Phaser.Display.Color.HexStringToColor(m.color).color;
        const g   = tabGfxArr[i];
        g.fillStyle(i === activeTab ? col : 0x222244, 1);
        g.fillRoundedRect(tx - tabW / 2, tabY - tabH / 2, tabW, tabH, { tl: 8, tr: 8, bl: 0, br: 0 });
        if (i === activeTab) {
          g.lineStyle(1, col, 0.8);
          g.strokeRoundedRect(tx - tabW / 2, tabY - tabH / 2, tabW, tabH, { tl: 8, tr: 8, bl: 0, br: 0 });
        }
      });
    };

    modes.forEach((m, i) => {
      const tx = tabStartX + i * tabW;
      const g  = reg(this.add.graphics().setDepth(22));
      tabGfxArr.push(g);
      reg(this.add.text(tx, tabY, m.label, {
        fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5).setDepth(23));
      reg(this.add.zone(tx, tabY, tabW, tabH).setInteractive({ cursor: 'pointer' }).setDepth(24))
        .on('pointerdown', () => { activeTab = i; drawTabs(); renderContent(i); });
    });

    drawTabs();
    renderContent(0);

    // Botón cerrar
    const cg = reg(this.add.graphics().setDepth(22));
    cg.fillStyle(0x27ae60, 1);
    cg.fillRoundedRect(W / 2 - 82, 618, 164, 46, 23);
    cg.lineStyle(1.5, 0xffffff, 0.18);
    cg.strokeRoundedRect(W / 2 - 82, 618, 164, 46, 23);

    reg(this.add.text(W / 2, 641, '✓  Entendido', {
      fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5).setDepth(23));

    reg(this.add.zone(W / 2, 641, 164, 46).setInteractive({ cursor: 'pointer' }).setDepth(24))
      .on('pointerdown', closeAll);
  }

  startGame(level, mode = 'classic') {
    this.cameras.main.fadeOut(320, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { level, mode });
    });
  }
}
