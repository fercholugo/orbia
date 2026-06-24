export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  init(data) {
    this.score    = data.score || 0;
    this.level    = data.level || 1;
    this.gameMode = data.mode  || 'classic';
  }

  create() {
    const W = 390;
    const H = 844;

    // Fondo
    this.add.rectangle(W / 2, H / 2, W, H, 0x0f0c22);

    // Estrellas de fondo
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const r = Math.random() < 0.3 ? 2 : 1;
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      const star = this.add.graphics();
      star.fillStyle(0xffffff, alpha);
      star.fillCircle(x, y, r);

      // Parpadeo suave
      this.tweens.add({
        targets: star,
        alpha: { from: alpha, to: alpha * 0.2 },
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1500)
      });
    }

    // Título
    this.add.text(W / 2, 280, '¡Nivel', {
      fontFamily: 'Arial',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(W / 2, 345, 'Completado!', {
      fontFamily: 'Arial',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Nivel completado
    this.add.text(W / 2, 420, `Nivel ${this.level}`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      alpha: 0.8
    }).setOrigin(0.5);

    // Score
    this.add.text(W / 2, 470, `Score: ${this.score}`, {
      fontFamily: 'Arial',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#2ecc71'
    }).setOrigin(0.5);

    // Botón Siguiente Nivel
    this.createButton(W / 2, 570, 'SIGUIENTE NIVEL', 0x2ecc71, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { level: this.level + 1, mode: this.gameMode });
      });
    });

    // Botón Menú
    this.createButton(W / 2, 660, 'MENÚ', 0x3498db, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    // Lluvia de partículas de celebración
    this.spawnCelebration(W, H);

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  createButton(x, y, label, color, onClick) {
    const btn = this.add.graphics();
    btn.fillStyle(color, 1);
    btn.fillRoundedRect(x - 140, y - 28, 280, 56, 12);

    const txt = this.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1);

    // Área interactiva
    const zone = this.add.zone(x, y, 280, 56).setInteractive({ cursor: 'pointer' });
    zone.on('pointerover', () => { btn.setAlpha(0.8); txt.setAlpha(0.8); });
    zone.on('pointerout',  () => { btn.setAlpha(1);   txt.setAlpha(1); });
    zone.on('pointerdown', onClick);
  }

  spawnCelebration(W, H) {
    const COLORS = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xffffff, 0xff69b4, 0x00ffff];

    for (let i = 0; i < 90; i++) {
      const x = Phaser.Math.Between(5, W - 5);
      const color = COLORS[Phaser.Math.Between(0, COLORS.length - 1)];
      const shape = Phaser.Math.Between(0, 3);
      const p = this.add.graphics().setDepth(30);
      p.fillStyle(color, 1);

      switch (shape) {
        case 0: {
          const w = Phaser.Math.Between(4, 10), h = Phaser.Math.Between(8, 20);
          p.fillRect(-w / 2, -h / 2, w, h);
          break;
        }
        case 1:
          p.fillCircle(0, 0, Phaser.Math.Between(4, 8));
          break;
        case 2: {
          const s = Phaser.Math.Between(5, 10);
          p.fillTriangle(-s, 0, 0, -s, s, 0);
          p.fillTriangle(-s, 0, 0, s, s, 0);
          break;
        }
        case 3: {
          const r1 = Phaser.Math.Between(5, 9), r2 = r1 * 0.45;
          const pts = [];
          for (let j = 0; j < 8; j++) {
            const a = (j / 8) * Math.PI * 2 - Math.PI / 2;
            pts.push({ x: Math.cos(a) * (j % 2 === 0 ? r1 : r2), y: Math.sin(a) * (j % 2 === 0 ? r1 : r2) });
          }
          p.fillPoints(pts, true);
          break;
        }
      }

      p.setPosition(x, Phaser.Math.Between(-30, 0));

      this.tweens.add({
        targets: p,
        y: H + 30,
        x: x + Phaser.Math.Between(-80, 80),
        angle: Phaser.Math.Between(-540, 540),
        alpha: { from: 1, to: 0.1 },
        duration: Phaser.Math.Between(1400, 3200),
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Cubic.easeIn',
        onComplete: () => p.destroy()
      });
    }
  }
}
