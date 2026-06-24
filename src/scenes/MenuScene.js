import SoundManager from '../audio/SoundManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = 390;
    const H = 844;

    this.W = W;
    this.H = H;

    // Fondo
    this.add.rectangle(W / 2, H / 2, W, H, 0x0f0c22);

    // Estrellas de fondo
    this.createStars(W, H);

    // Partículas flotantes de fondo
    this.createBgParticles(W, H);

    // Esferas decorativas (tweens, sin física)
    this.createDecorativeSpheres(W, H);

    // Logo ORBIA con glow
    const title = this.add.text(W / 2, 220, 'ORBIA', {
      fontFamily: 'Arial',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#3498db',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: '#3498db', blur: 20, fill: true }
    }).setOrigin(0.5).setDepth(5);

    // Pulso suave en el título
    this.tweens.add({
      targets: title,
      scaleX: 1.04, scaleY: 1.04,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtítulo
    this.add.text(W / 2, 300, 'Conecta las esferas', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#aaaacc',
      alpha: 0.85
    }).setOrigin(0.5).setDepth(5);

    // Botones de modo
    const maxLevel    = parseInt(localStorage.getItem('orbia_maxLevel') || '0');
    const hasProgress = maxLevel > 1;

    let btnY = hasProgress ? 400 : 420;

    if (hasProgress) {
      this.createButton(W / 2, btnY, `▶ CONTINUAR (Nv. ${maxLevel})`, 0xf39c12, () => this.startGame(maxLevel, 'classic'));
      btnY += 72;
    }

    this.createButton(W / 2, btnY,        'CLÁSICO',    0x2ecc71, () => this.startGame(1, 'classic'));
    this.createButton(W / 2, btnY + 72,   'SECUENCIA',  0x9b59b6, () => this.startGame(1, 'sequence'));
    this.createButton(W / 2, btnY + 144,  'CAOS',        0xe74c3c, () => this.startGame(1, 'evade'));
    this.createButton(W / 2, btnY + 218,  'CÓMO JUGAR', 0x3498db, () => this.showInstructions());

    // Botón mute — esquina superior derecha
    const sfx = new SoundManager();
    const muteTxt = this.add.text(W - 14, 14, sfx.muted ? '🔇' : '🔊', {
      fontFamily: 'Arial',
      fontSize: '26px'
    }).setOrigin(1, 0).setDepth(10).setInteractive({ cursor: 'pointer' });

    muteTxt.on('pointerdown', () => {
      const nowMuted = sfx.toggleMute();
      muteTxt.setText(nowMuted ? '🔇' : '🔊');
    });

    // Versión
    this.add.text(W / 2, H - 20, 'v1.0.0', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#555577'
    }).setOrigin(0.5).setDepth(5);

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  createBgParticles(W, H) {
    for (let i = 0; i < 22; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const size = Phaser.Math.FloatBetween(1.5, 3.5);
      const alpha = Phaser.Math.FloatBetween(0.05, 0.16);
      const p = this.add.graphics().setDepth(2);
      p.fillStyle(0x4466ff, 1);
      const pts = [];
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2;
        pts.push({ x: Math.cos(a) * size, y: Math.sin(a) * size });
      }
      p.fillPoints(pts, true);
      p.setPosition(x, y);
      p.setAlpha(alpha);

      this.tweens.add({
        targets: p,
        y: y - Phaser.Math.Between(40, 100),
        alpha: { from: alpha, to: 0 },
        duration: Phaser.Math.Between(5000, 10000),
        delay: Phaser.Math.Between(0, 6000),
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => {
          p.setPosition(Phaser.Math.Between(0, W), H + 10);
          p.setAlpha(alpha);
        }
      });
    }
  }

  createStars(W, H) {
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const r = Math.random() < 0.25 ? 2 : 1;
      const alpha = Phaser.Math.FloatBetween(0.2, 0.8);
      const g = this.add.graphics().setDepth(1);
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(x, y, r);
      this.tweens.add({
        targets: g,
        alpha: { from: alpha, to: alpha * 0.15 },
        duration: Phaser.Math.Between(900, 2200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }
  }

  createDecorativeSpheres(W, H) {
    const specs = [
      { x: 60,       y: 400, color: 0xe74c3c, num: '3', duration: 2800 },
      { x: W - 55,   y: 340, color: 0x9b59b6, num: '5', duration: 3400 },
      { x: W / 2,    y: 680, color: 0x1abc9c, num: '1', duration: 3100 }
    ];

    for (const s of specs) {
      const g = this.add.graphics().setDepth(3);
      g.fillStyle(s.color, 0.6);
      g.fillCircle(s.x, s.y, 32);
      g.lineStyle(2, 0xffffff, 0.4);
      g.strokeCircle(s.x, s.y, 32);

      this.add.text(s.x, s.y, s.num, {
        fontFamily: 'Arial',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
        alpha: 0.5
      }).setOrigin(0.5).setDepth(4);

      // Movimiento flotante con tween
      this.tweens.add({
        targets: g,
        y: s.y + Phaser.Math.Between(25, 45),
        duration: s.duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1000)
      });
    }
  }

  createButton(x, y, label, color, onClick) {
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(color, 1);
    g.fillRoundedRect(x - 145, y - 28, 290, 56, 14);

    const txt = this.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(6);

    const zone = this.add.zone(x, y, 290, 56).setInteractive({ cursor: 'pointer' }).setDepth(7);
    zone.on('pointerover', () => { g.setAlpha(0.82); txt.setAlpha(0.82); });
    zone.on('pointerout',  () => { g.setAlpha(1);    txt.setAlpha(1); });
    zone.on('pointerdown', onClick);
  }

  showInstructions() {
    const W = this.W;
    const H = this.H;

    // Overlay oscuro
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78).setDepth(20).setInteractive();

    const panel = this.add.graphics().setDepth(21);
    panel.fillStyle(0x1e1e3a, 1);
    panel.fillRoundedRect(20, 140, W - 40, 500, 16);

    this.add.text(W / 2, 180, 'Cómo jugar', {
      fontFamily: 'Arial',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(22);

    const steps = [
      { icon: '●', title: 'Las esferas rebotan solas', color: '#3498db' },
      { icon: '◎', title: 'Toca para desviarlas',     color: '#f39c12' },
      { icon: '✦', title: 'Haz chocar el mismo número', color: '#2ecc71' }
    ];

    steps.forEach((step, i) => {
      const y = 260 + i * 100;
      this.add.text(50, y, step.icon, {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: step.color
      }).setOrigin(0.5).setDepth(22);

      this.add.text(75, y, step.title, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        wordWrap: { width: 260 }
      }).setOrigin(0, 0.5).setDepth(22);
    });

    this.add.text(W / 2, 565, '¡Mismo color = puntos dobles!', {
      fontFamily: 'Arial',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#f1c40f'
    }).setOrigin(0.5).setDepth(22);

    // Botón Entendido
    const btnG = this.add.graphics().setDepth(22);
    btnG.fillStyle(0x2ecc71, 1);
    btnG.fillRoundedRect(W / 2 - 90, 600, 180, 48, 12);

    const btnTxt = this.add.text(W / 2, 624, 'Entendido', {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(23);

    const btnZone = this.add.zone(W / 2, 624, 180, 48).setInteractive({ cursor: 'pointer' }).setDepth(24);
    btnZone.on('pointerdown', () => {
      [overlay, panel, btnG, btnTxt, btnZone].forEach(o => o.destroy());
      // Destruir también los textos del overlay
      this.children.list
        .filter(c => c.depth >= 21 && c.depth <= 23)
        .forEach(c => c.destroy());
    });
  }

  startGame(level, mode = 'classic') {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { level, mode });
    });
  }
}
