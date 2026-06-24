import SoundManager from '../audio/SoundManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.level    = data?.level ?? 1;
    this.gameMode = data?.mode  ?? 'classic';
  }

  getLevelConfig(level) {
    if (level === 1) return { targetScore: 1000, sphereCount: 12, speed: 2 };
    if (level === 2) return { targetScore: 1500, sphereCount: 14, speed: 2.3 };
    if (level === 3) return { targetScore: 2000, sphereCount: 16, speed: 2.6 };
    return {
      targetScore:  1000 + (level - 1) * 500,
      sphereCount:  Math.min(12 + (level - 1) * 2, 20),
      speed:        Math.min(2 + (level - 1) * 0.3, 4)
    };
  }

  create() {
    const W = 390, H = 844, RADIUS = 35, WALL = 20;
    const cfg = this.getLevelConfig(this.level);

    this.W = W; this.H = H; this.RADIUS = RADIUS;
    this.BASE_SPEED   = cfg.speed;
    this.SPHERE_COUNT = cfg.sphereCount;
    this.deflector    = null;
    this.currentScore = 0;
    this.targetScore  = cfg.targetScore;
    this.spheresToRemove  = new Set();
    this.victoryTriggered = false;
    this.matchWindowOpen  = false;
    this.matchWindowTimer = null;
    this.paused = false;
    this.sound  = new SoundManager();

    this.COLORS = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c];

    this.createBgParticles(W, H);

    // Paredes
    const wallOpts = { isStatic: true, friction: 0, restitution: 1.0, label: 'wall' };
    this.matter.add.rectangle(W / 2, -WALL / 2,     W, WALL, wallOpts);
    this.matter.add.rectangle(W / 2, H + WALL / 2,  W, WALL, wallOpts);
    this.matter.add.rectangle(-WALL / 2,   H / 2, WALL, H,   wallOpts);
    this.matter.add.rectangle(W + WALL / 2, H / 2, WALL, H,   wallOpts);

    // Esferas iniciales
    const numbers = [];
    const pairCount = Math.ceil(this.SPHERE_COUNT / 2);
    for (let n = 1; n <= pairCount; n++) numbers.push(((n - 1) % 6) + 1, ((n - 1) % 6) + 1);
    Phaser.Utils.Array.Shuffle(numbers);
    this.spheres = [];
    for (let i = 0; i < this.SPHERE_COUNT; i++) this.spawnSphere(numbers[i]);

    // ── Panel UI superior ──────────────────────────────────────────────────
    const uiPanel = this.add.graphics().setDepth(19);
    uiPanel.fillStyle(0x08061a, 0.88);
    uiPanel.fillRect(0, 0, W, 78);
    uiPanel.lineStyle(1, 0x3344aa, 0.4);
    uiPanel.lineBetween(0, 78, W, 78);

    // Botón pausa
    this.add.text(14, 14, '⏸', {
      fontFamily: 'Arial', fontSize: '26px', color: '#ffffff', alpha: 0.7
    }).setDepth(22).setInteractive({ cursor: 'pointer' })
      .on('pointerdown', () => this.showPauseMenu());

    // Etiqueta de modo
    const modeLabels = { classic: `Nivel ${this.level}`, sequence: `SECUENCIA · Nv.${this.level}`, evade: `CAOS · Nv.${this.level}` };
    const modeColors = { classic: '#7788ff', sequence: '#f39c12', evade: '#e74c3c' };
    this.add.text(50, 12, modeLabels[this.gameMode], {
      fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold',
      color: modeColors[this.gameMode]
    }).setOrigin(0, 0).setDepth(20);

    if (this.gameMode === 'evade') {
      this.buildEvadeUI(W);
    } else {
      this.buildClassicUI(W);
    }

    if (this.gameMode === 'sequence') this.initSequenceMode();
    if (this.gameMode === 'evade')    this.initEvadeMode();

    // ── Colisiones ────────────────────────────────────────────────────────
    this.matter.world.on('collisionstart', (event) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;

        // Deflector → esfera
        const defl = (bodyA.label === 'deflector' && bodyB.label === 'sphere') ||
                     (bodyB.label === 'deflector' && bodyA.label === 'sphere');
        if (defl) {
          const sb = bodyA.label === 'sphere' ? bodyA : bodyB;
          const sp = this.spheres.find(s => s.body === sb);
          if (sp) {
            sp.recentlyDeflected = true;
            if (this.gameMode === 'evade') {
              // puntos por deflectar activamente en modo evita
              this.currentScore += 10;
              this.evadeScoreTxt?.setText(`${this.currentScore} pts`);
            }
          }
          continue;
        }

        // Pared → esfera
        if ((bodyA.label === 'wall' && bodyB.label === 'sphere') ||
            (bodyB.label === 'wall' && bodyA.label === 'sphere')) {
          this.sound.rebotePared();
          continue;
        }

        // Esfera → esfera
        if (bodyA.label === 'sphere' && bodyB.label === 'sphere') {
          this.handleSphereCollision(bodyA, bodyB);
        }
      }
    });

    // Input
    this.input.on('pointerdown', (pointer) => {
      if (this.paused) return;
      if (pointer.x < 50 && pointer.y < 50) return;
      if (this.gameMode === 'evade') {
        if (this.evadeGrace) return;
        this.handleEvadeTap(pointer.x, pointer.y);
        return;
      }
      this.createDeflector(pointer.x, pointer.y);
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  // ── UI builders ──────────────────────────────────────────────────────────

  buildClassicUI(W) {
    this.scoreTxt = this.add.text(W - 12, 12, 'Score: 0', {
      fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(1, 0).setDepth(20);

    const BAR_X = 12, BAR_Y = 52, BAR_W = W - 24, BAR_H = 10;
    const barBg = this.add.graphics().setDepth(20);
    barBg.fillStyle(0x1a1040, 1);
    barBg.fillRoundedRect(BAR_X, BAR_Y, BAR_W, BAR_H, 5);
    this.progressBar = this.add.graphics().setDepth(21);
    this.barConfig = { x: BAR_X, y: BAR_Y, w: BAR_W, h: BAR_H };
    this.add.text(W / 2, BAR_Y + BAR_H + 4, `Meta: ${this.targetScore} pts`, {
      fontFamily: 'Arial', fontSize: '11px', color: '#556688'
    }).setOrigin(0.5, 0).setDepth(20);
    this.updateProgressBar();
  }

  buildEvadeUI(W) {
    this.evadeTime = 90;

    this.timerTxt = this.add.text(W / 2, 10, '1:30', {
      fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold', color: '#ff6666'
    }).setOrigin(0.5, 0).setDepth(20);

    this.evadeScoreTxt = this.add.text(W - 12, 10, '0 pts', {
      fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(1, 0).setDepth(20);

    this.add.text(W / 2, 52, 'Toca dos iguales para unirlas', {
      fontFamily: 'Arial', fontSize: '12px', color: '#7788aa'
    }).setOrigin(0.5, 0).setDepth(20);
  }

  // ── Modo Secuencia ────────────────────────────────────────────────────────

  initSequenceMode() {
    this.sequence = [1, 2, 3, 4, 5, 6];
    Phaser.Utils.Array.Shuffle(this.sequence);
    this.seqIndex = 0;

    // Panel inferior para la secuencia
    const W = this.W, H = this.H;
    const panelH = 58;
    const bg = this.add.graphics().setDepth(19);
    bg.fillStyle(0x08061a, 0.88);
    bg.fillRect(0, H - panelH, W, panelH);
    bg.lineStyle(1, 0x3344aa, 0.4);
    bg.lineBetween(0, H - panelH, W, H - panelH);

    this.add.text(W / 2, H - panelH + 6, 'Orden:', {
      fontFamily: 'Arial', fontSize: '12px', color: '#556688'
    }).setOrigin(0.5, 0).setDepth(20);

    this.seqItems = [];
    const spacing = 52;
    const startX  = W / 2 - ((this.sequence.length - 1) / 2) * spacing;
    const itemY   = H - panelH + 26;

    for (let i = 0; i < this.sequence.length; i++) {
      const x = startX + i * spacing;
      const g = this.add.graphics().setDepth(20);
      const t = this.add.text(x, itemY, String(this.sequence[i]), {
        fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5).setDepth(21);
      this.seqItems.push({ g, t, x, y: itemY });
    }
    this.refreshSequenceUI();
  }

  refreshSequenceUI() {
    if (!this.seqItems) return;
    for (let i = 0; i < this.seqItems.length; i++) {
      const { g, t, x, y } = this.seqItems[i];
      g.clear();
      if (i < this.seqIndex) {
        // Completado
        g.fillStyle(0x2ecc71, 0.5);
        g.fillCircle(x, y, 16);
        t.setAlpha(0.35);
      } else if (i === this.seqIndex) {
        // Objetivo actual — pulsante
        g.fillStyle(0xf1c40f, 1);
        g.fillCircle(x, y, 20);
        t.setAlpha(1).setColor('#000000').setFontSize('22px');
      } else {
        // Pendiente
        g.fillStyle(0x1a1040, 0.9);
        g.fillCircle(x, y, 16);
        t.setAlpha(0.6).setColor('#aaaacc').setFontSize('20px');
      }
    }
  }

  // ── Modo Caos ─────────────────────────────────────────────────────────────

  initEvadeMode() {
    this.evadeGrace     = true;
    this.selectedSphere = null;
    this.evadeCombo     = 0;
    this.lastMatchTime  = 0;
    this.selectionGfx   = this.add.graphics().setDepth(5);

    const W = this.W, H = this.H;
    const countTxt = this.add.text(W / 2, H / 2, '3', {
      fontFamily: 'Arial', fontSize: '120px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000000', strokeThickness: 6, alpha: 0
    }).setOrigin(0.5).setDepth(80);

    const counts = ['3', '2', '1', '¡CAOS!'];
    const colors = ['#ffffff', '#f39c12', '#e74c3c', '#ff44ff'];

    counts.forEach((label, i) => {
      this.time.delayedCall(i * 900, () => {
        countTxt.setText(label).setColor(colors[i]).setAlpha(1).setScale(1);
        this.tweens.add({
          targets: countTxt, scaleX: 1.4, scaleY: 1.4, alpha: 0,
          duration: 750, ease: 'Power2',
          onComplete: () => {
            if (i === counts.length - 1) {
              countTxt.destroy();
              this.evadeGrace = false;
              this.startEvadeTimer();
              this.startChaosTick();
              this.startSphereSpawn();
            }
          }
        });
      });
    });
  }

  startChaosTick() {
    this.chaosTicker = this.time.addEvent({
      delay: 7000, loop: true,
      callback: this.chaosTick, callbackScope: this
    });
  }

  chaosTick() {
    if (this.victoryTriggered) return;
    const alive = this.spheres.filter(s => s.body);
    if (alive.length < 4) return;

    // Intercambiar números de dos esferas al azar
    const i1 = Phaser.Math.Between(0, alive.length - 1);
    let   i2 = Phaser.Math.Between(0, alive.length - 2);
    if (i2 >= i1) i2++;
    const sA = alive[i1], sB = alive[i2];

    const tmp  = sA.number;
    sA.number  = sB.number;
    sB.number  = tmp;
    sA.txt.setText(String(sA.number));
    sB.txt.setText(String(sB.number));

    // Flash blanco en las dos esferas que cambiaron
    for (const s of [sA, sB]) {
      const fx = this.add.graphics().setDepth(12).setPosition(s.body.position.x, s.body.position.y);
      fx.fillStyle(0xffffff, 0.55);
      fx.fillCircle(0, 0, this.RADIUS);
      this.tweens.add({ targets: fx, alpha: 0, duration: 350, onComplete: () => fx.destroy() });
      this.tweens.add({ targets: s.txt, scaleX: 1.7, scaleY: 1.7, duration: 120, yoyo: true, ease: 'Power2' });
    }

    // Si la selección actual fue afectada, deseleccionar
    if (this.selectedSphere === sA || this.selectedSphere === sB) {
      this.selectedSphere = null;
    }
  }

  startSphereSpawn() {
    this.sphereSpawnEvent = this.time.addEvent({
      delay: 10000, loop: true,
      callback: () => {
        if (this.victoryTriggered) return;
        if (this.spheres.length >= 18) return;
        // Elegir número que tenga conteo impar para crear una pareja
        const counts = {};
        for (const s of this.spheres) counts[s.number] = (counts[s.number] || 0) + 1;
        const odd = Object.entries(counts).filter(([, c]) => c % 2 === 1).map(([n]) => +n);
        const num = odd.length > 0
          ? odd[Phaser.Math.Between(0, odd.length - 1)]
          : Phaser.Math.Between(1, 6);
        this.spawnEdgePair(num);
      }
    });
  }

  handleEvadeTap(px, py) {
    if (this.victoryTriggered) return;
    const tapped = this.spheres.find(s => {
      if (!s.body) return false;
      const dx = s.body.position.x - px, dy = s.body.position.y - py;
      return Math.sqrt(dx * dx + dy * dy) <= this.RADIUS + 10;
    });

    if (!tapped) { this.selectedSphere = null; return; }

    if (!this.selectedSphere) {
      this.selectedSphere = tapped;
      this.sound.rebotePared();
      return;
    }
    if (this.selectedSphere === tapped) { this.selectedSphere = null; return; }

    if (this.selectedSphere.number === tapped.number) {
      this.evadeDirectMatch(this.selectedSphere, tapped);
      this.selectedSphere = null;
    } else {
      this.selectedSphere = tapped;
      this.sound.rebotePared();
    }
  }

  evadeDirectMatch(sA, sB) {
    if (this.spheresToRemove.has(sA) || this.spheresToRemove.has(sB)) return;
    const cx = (sA.body.position.x + sB.body.position.x) / 2;
    const cy = (sA.body.position.y + sB.body.position.y) / 2;

    const now = this.time.now;
    this.evadeCombo = (now - this.lastMatchTime < 6000) ? Math.min(this.evadeCombo + 1, 5) : 1;
    this.lastMatchTime = now;

    const points = 100 * this.evadeCombo;
    this.spheresToRemove.add(sA);
    this.spheresToRemove.add(sB);
    this.currentScore += points;
    this.evadeScoreTxt?.setText(`${this.currentScore} pts`);

    const label = this.evadeCombo > 1 ? `+${points} x${this.evadeCombo}` : `+${points}`;
    this.showFloatingScore(cx, cy, points, this.evadeCombo > 2 ? '#f1c40f' : '#2ecc71', label);
    this.evadeCombo > 1 ? this.sound.matchPerfecto() : this.sound.matchSimple();
    this.perfectMatchEffect(sA, sB, cx, cy);
    this.time.delayedCall(1800, () => this.spawnEdgePair(sA.number));
  }

  startEvadeTimer() {
    this.evadeTimer = this.time.addEvent({
      delay: 1000,
      repeat: 89,
      callback: () => {
        this.evadeTime--;
        const m = Math.floor(this.evadeTime / 60);
        const s = String(this.evadeTime % 60).padStart(2, '0');
        this.timerTxt?.setText(`${m}:${s}`);
        if (this.evadeTime <= 0) this.evadeVictory();
        if (this.evadeTime <= 10) this.timerTxt?.setColor('#ff2222');
      }
    });
  }

  loseLife() {
    this.lives--;
    const hearts = ['', '❤️', '❤️❤️', '❤️❤️❤️'][this.lives] ?? '';
    this.heartsTxt?.setText(hearts);

    // Flash rojo pantalla
    const flash = this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0xff0000, 0.3).setDepth(60);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

    this.sound.matchSimple();

    if (this.lives <= 0) { this.evadeGameOver(); return; }

    // Invencibilidad 2s para evitar perder varias vidas de golpe
    this.evadeInvincible = true;
    this.time.delayedCall(2000, () => { this.evadeInvincible = false; });
  }

  evadeVictory() {
    if (this.victoryTriggered) return;
    this.victoryTriggered = true;
    this.evadeTimer?.remove();
    this.chaosTicker?.remove();
    this.sphereSpawnEvent?.remove();
    this.selectionGfx?.destroy();
    this.matter.world.pause();
    if (this.deflector) this.destroyDeflector();
    this.sound.nivelCompletado();
    this.celebrationRain();
    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('VictoryScene', { score: this.currentScore, level: this.level, mode: this.gameMode });
      });
    });
  }

  evadeGameOver() {
    if (this.victoryTriggered) return;
    this.victoryTriggered = true;
    this.evadeTimer?.remove();
    this.chaosTicker?.remove();
    this.sphereSpawnEvent?.remove();
    this.selectionGfx?.destroy();
    this.matter.world.pause();
    if (this.deflector) this.destroyDeflector();

    const W = this.W, H = this.H;
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(70);
    this.add.text(W / 2, H / 2 - 80, 'GAME OVER', {
      fontFamily: 'Arial', fontSize: '48px', fontStyle: 'bold',
      color: '#e74c3c', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(71);
    this.add.text(W / 2, H / 2 - 10, `Score: ${this.currentScore}`, {
      fontFamily: 'Arial', fontSize: '28px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(71);

    this.makeOverlayBtn(W / 2, H / 2 + 70,  'Reintentar', 0xe74c3c, () => {
      this.scene.start('GameScene', { level: this.level, mode: this.gameMode });
    });
    this.makeOverlayBtn(W / 2, H / 2 + 140, 'Menú',       0x3498db, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });
  }

  // ── Colisiones ────────────────────────────────────────────────────────────

  handleSphereCollision(bodyA, bodyB) {
    const sA = this.spheres.find(s => s.body === bodyA);
    const sB = this.spheres.find(s => s.body === bodyB);
    if (!sA || !sB) return;
    if (this.spheresToRemove.has(sA) || this.spheresToRemove.has(sB)) return;
    if (sA.number !== sB.number) return;

    if (this.gameMode === 'evade') {
      this.handleEvadeCollision(sA, sB);
    } else if (this.gameMode === 'sequence') {
      this.handleSequenceCollision(sA, sB);
    } else {
      this.handleClassicCollision(sA, sB);
    }
  }

  handleClassicCollision(sA, sB) {
    if (!this.matchWindowOpen) return;
    if (!sA.recentlyDeflected && !sB.recentlyDeflected) return;

    const isPerfect = sA.color === sB.color;
    const points    = isPerfect ? 250 : 100;
    const cx = (sA.body.position.x + sB.body.position.x) / 2;
    const cy = (sA.body.position.y + sB.body.position.y) / 2;

    this.spheresToRemove.add(sA);
    this.spheresToRemove.add(sB);
    this.currentScore += points;
    this.scoreTxt?.setText(`Score: ${this.currentScore}`);
    this.updateProgressBar();
    this.checkVictory();
    this.showFloatingScore(cx, cy, points);
    isPerfect ? (this.sound.matchPerfecto(), this.perfectMatchEffect(sA, sB, cx, cy))
              : (this.sound.matchSimple(),   this.simpleMatchEffect(sA, sB));
    this.time.delayedCall(2000, () => this.spawnEdgePair(sA.number));
  }

  handleSequenceCollision(sA, sB) {
    if (!this.matchWindowOpen) return;
    if (!sA.recentlyDeflected && !sB.recentlyDeflected) return;
    if (sA.number !== this.sequence[this.seqIndex]) return; // must match current target

    const cx = (sA.body.position.x + sB.body.position.x) / 2;
    const cy = (sA.body.position.y + sB.body.position.y) / 2;

    this.spheresToRemove.add(sA);
    this.spheresToRemove.add(sB);

    const points = 200;
    this.currentScore += points;
    this.scoreTxt?.setText(`Score: ${this.currentScore}`);
    this.updateProgressBar();
    this.showFloatingScore(cx, cy, points, '#f39c12');
    this.sound.matchPerfecto();
    this.perfectMatchEffect(sA, sB, cx, cy);

    this.seqIndex++;
    if (this.seqIndex >= this.sequence.length) {
      // Secuencia completada = victoria
      this.checkVictory(true);
    } else {
      this.refreshSequenceUI();
      this.time.delayedCall(2000, () => this.spawnEdgePair(sA.number));
    }
  }

  handleEvadeCollision(sA, sB) {
    // En modo Caos las colisiones no puntúan — el jugador usa taps directos
  }

  // ── Progreso y victoria ───────────────────────────────────────────────────

  updateProgressBar() {
    if (!this.progressBar) return;
    const { x, y, w, h } = this.barConfig;
    const pct = Math.min(this.currentScore / this.targetScore, 1);
    this.progressBar.clear();
    if (pct <= 0) return;
    const r = Math.round(0x34 + (0x2e - 0x34) * pct);
    const g = Math.round(0x98 + (0xcc - 0x98) * pct);
    const b = Math.round(0xdb + (0x71 - 0xdb) * pct);
    this.progressBar.fillStyle((r << 16) | (g << 8) | b, 1);
    this.progressBar.fillRoundedRect(x, y, w * pct, h, 5);
  }

  checkVictory(force = false) {
    if (this.victoryTriggered) return;
    const reached = force || (this.currentScore >= this.targetScore);
    if (!reached) return;
    this.victoryTriggered = true;

    const nextLevel = this.level + 1;
    const maxLevel  = Math.max(nextLevel, parseInt(localStorage.getItem('orbia_maxLevel') || '1'));
    const maxScore  = Math.max(this.currentScore, parseInt(localStorage.getItem('orbia_maxScore') || '0'));
    localStorage.setItem('orbia_maxLevel', maxLevel);
    localStorage.setItem('orbia_maxScore', maxScore);

    this.sound.nivelCompletado();
    this.matter.world.pause();
    if (this.deflector) this.destroyDeflector();
    this.celebrationRain();

    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('VictoryScene', { score: this.currentScore, level: this.level, mode: this.gameMode });
      });
    });
  }

  celebrationRain() {
    const W = this.W, H = this.H;
    const COLORS = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xffffff, 0xff69b4, 0x00ffff];

    const flash = this.add.graphics().setDepth(60);
    flash.fillStyle(0xffffff, 0.35);
    flash.fillRect(0, 0, W, H);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

    for (let i = 0; i < 80; i++) {
      const x     = Phaser.Math.Between(5, W - 5);
      const color = COLORS[Phaser.Math.Between(0, COLORS.length - 1)];
      const shape = Phaser.Math.Between(0, 3);
      const p     = this.add.graphics().setDepth(55);
      p.fillStyle(color, 1);
      switch (shape) {
        case 0: { const w = Phaser.Math.Between(4,10), h = Phaser.Math.Between(8,20); p.fillRect(-w/2,-h/2,w,h); break; }
        case 1: p.fillCircle(0, 0, Phaser.Math.Between(4, 8)); break;
        case 2: { const s = Phaser.Math.Between(5,10); p.fillTriangle(-s,0,0,-s,s,0); p.fillTriangle(-s,0,0,s,s,0); break; }
        case 3: {
          const r1 = Phaser.Math.Between(5,9), r2 = r1*0.45, pts = [];
          for (let j=0;j<8;j++){const a=(j/8)*Math.PI*2-Math.PI/2,r=j%2===0?r1:r2;pts.push({x:Math.cos(a)*r,y:Math.sin(a)*r});}
          p.fillPoints(pts, true); break;
        }
      }
      p.setPosition(x, Phaser.Math.Between(-20, 0));
      this.tweens.add({
        targets: p,
        y: H + 30, x: x + Phaser.Math.Between(-70, 70),
        angle: Phaser.Math.Between(-540, 540),
        alpha: { from: 1, to: 0.2 },
        duration: Phaser.Math.Between(1200, 2800),
        delay: Phaser.Math.Between(0, 1200),
        ease: 'Cubic.easeIn',
        onComplete: () => p.destroy()
      });
    }
  }

  // ── Spawn ─────────────────────────────────────────────────────────────────

  spawnSphere(number, x, y) {
    const { W, H, RADIUS } = this;
    if (x === undefined) {
      const m = RADIUS + 10;
      x = Phaser.Math.Between(m, W - m);
      y = Phaser.Math.Between(m, H - m);
    }
    const color = this.COLORS[Phaser.Math.Between(0, this.COLORS.length - 1)];
    const body  = this.matter.add.circle(x, y, RADIUS, { restitution: 1.0, friction: 0, frictionAir: 0, label: 'sphere' });
    const a = Math.random() * Math.PI * 2;
    this.matter.body.setVelocity(body, { x: Math.cos(a) * this.BASE_SPEED, y: Math.sin(a) * this.BASE_SPEED });

    const glowGfx = this.add.graphics().setDepth(0);
    const gfx     = this.add.graphics().setDepth(1);
    this.drawSphere(gfx, 0, 0, RADIUS, color);
    const txt = this.add.text(x, y, String(number), {
      fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#00000055', strokeThickness: 2
    }).setOrigin(0.5).setDepth(2);

    const sphere = { body, gfx, glowGfx, txt, color, number, recentlyDeflected: false };
    this.spheres.push(sphere);
    return sphere;
  }

  spawnEdgePair(number) {
    const { W, H, RADIUS } = this;
    for (let i = 0; i < 2; i++) {
      const edge = Phaser.Math.Between(0, 3);
      let x, y;
      switch (edge) {
        case 0: x = Phaser.Math.Between(RADIUS+5, W-RADIUS-5); y = RADIUS+5;       break;
        case 1: x = Phaser.Math.Between(RADIUS+5, W-RADIUS-5); y = H-RADIUS-5;    break;
        case 2: x = RADIUS+5;     y = Phaser.Math.Between(RADIUS+5, H-RADIUS-5);  break;
        case 3: x = W-RADIUS-5;   y = Phaser.Math.Between(RADIUS+5, H-RADIUS-5);  break;
      }
      const sphere = this.spawnSphere(number, x, y);
      sphere.gfx.setScale(0).setAlpha(0);
      sphere.txt.setScale(0).setAlpha(0);
      this.tweens.add({ targets: [sphere.gfx, sphere.txt], scaleX:1, scaleY:1, alpha:1, duration:300, ease:'Back.easeOut' });
      this.sound.aparicionEsfera();
    }
  }

  // ── Efectos visuales ──────────────────────────────────────────────────────

  removeSphere(sphere) {
    if (!sphere.body) return;
    this.matter.world.remove(sphere.body);
    sphere.body = null;
    sphere.glowGfx.destroy();
    sphere.gfx.destroy();
    sphere.txt.destroy();
    const idx = this.spheres.indexOf(sphere);
    if (idx !== -1) this.spheres.splice(idx, 1);
    this.spheresToRemove.delete(sphere);
  }

  simpleMatchEffect(sA, sB) {
    for (const s of [sA, sB]) {
      s.gfx.clear();
      s.gfx.fillStyle(0xffffff, 1);
      s.gfx.fillCircle(0, 0, this.RADIUS);
      this.tweens.add({ targets: [s.gfx, s.txt], scaleX:0, scaleY:0, alpha:0, duration:250, delay:100, ease:'Power2', onComplete: () => this.removeSphere(s) });
    }
  }

  perfectMatchEffect(sA, sB, cx, cy) {
    const color = sA.color;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const p = this.add.graphics().setDepth(15);
      p.fillStyle(color, 1);
      p.fillCircle(0, 0, 5);
      p.setPosition(cx, cy);
      const dist = Phaser.Math.Between(50, 90);
      this.tweens.add({ targets: p, x: cx+Math.cos(angle)*dist, y: cy+Math.sin(angle)*dist, alpha:0, scaleX:0.2, scaleY:0.2, duration:600, ease:'Power2', onComplete: () => p.destroy() });
    }
    for (const s of [sA, sB]) {
      this.tweens.add({ targets: [s.gfx, s.txt], scaleX:0, scaleY:0, alpha:0, duration:400, ease:'Back.easeIn', onComplete: () => this.removeSphere(s) });
    }
  }

  showFloatingScore(x, y, points, color, label) {
    const text = label ?? `+${points}`;
    const col  = color ?? (points === 250 ? '#f1c40f' : '#ffffff');
    const txt  = this.add.text(x, y, text, {
      fontFamily: 'Arial', fontSize: '26px', fontStyle: 'bold',
      color: col, stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: txt, y: y-90, alpha:0, duration:1000, ease:'Power2', onComplete: () => txt.destroy() });
  }

  // ── Fondo ─────────────────────────────────────────────────────────────────

  createBgParticles(W, H) {
    for (let i = 0; i < 28; i++) {
      const x = Phaser.Math.Between(0, W), y = Phaser.Math.Between(80, H);
      const size = Phaser.Math.FloatBetween(1, 3), alpha = Phaser.Math.FloatBetween(0.04, 0.14);
      const p = this.add.graphics().setDepth(-1);
      p.fillStyle(0x6688ff, 1);
      const pts = [];
      for (let j = 0; j < 6; j++) { const a = (j/6)*Math.PI*2; pts.push({ x: Math.cos(a)*size, y: Math.sin(a)*size }); }
      p.fillPoints(pts, true);
      p.setPosition(x, y).setAlpha(alpha);
      this.tweens.add({
        targets: p, y: y - Phaser.Math.Between(30,80), x: x + Phaser.Math.Between(-20,20),
        alpha: { from: alpha, to: 0 },
        duration: Phaser.Math.Between(4000,8000), delay: Phaser.Math.Between(0,5000), ease: 'Linear',
        onComplete: () => {
          p.setPosition(Phaser.Math.Between(0,W), H+10).setAlpha(alpha);
          this.tweens.add({ targets: p, y: p.y - Phaser.Math.Between(60,120), alpha: { from: alpha, to: 0 }, duration: Phaser.Math.Between(4000,8000), repeat: -1, ease: 'Linear', onRepeat: () => { p.setPosition(Phaser.Math.Between(0,W), H+10).setAlpha(alpha); } });
        }
      });
    }
  }

  // ── Pausa ─────────────────────────────────────────────────────────────────

  showPauseMenu() {
    if (this.paused) return;
    this.paused = true;
    this.matter.world.pause();
    if (this.deflector) this.destroyDeflector();
    if (this.evadeTimer)       this.evadeTimer.paused       = true;
    if (this.chaosTicker)      this.chaosTicker.paused      = true;
    if (this.sphereSpawnEvent) this.sphereSpawnEvent.paused = true;

    const W = this.W, H = this.H;
    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.65).setDepth(40).setInteractive();
    const panel   = this.add.graphics().setDepth(41);
    panel.fillStyle(0x130e2e, 1);
    panel.fillRoundedRect(W/2-130, H/2-110, 260, 220, 16);
    this.add.text(W/2, H/2-70, 'PAUSA', { fontFamily:'Arial', fontSize:'32px', fontStyle:'bold', color:'#ffffff' }).setOrigin(0.5).setDepth(42);

    const cleanup = () => {
      this.children.list.filter(c => c.depth >= 40 && c.depth <= 44).forEach(c => c.destroy());
    };
    this.makeOverlayBtn(W/2, H/2,    'Continuar', 0x2ecc71, () => { cleanup(); this.paused=false; this.matter.world.resume(); if(this.evadeTimer) this.evadeTimer.paused=false; if(this.chaosTicker) this.chaosTicker.paused=false; if(this.sphereSpawnEvent) this.sphereSpawnEvent.paused=false; }, 41);
    this.makeOverlayBtn(W/2, H/2+65, 'Menú',      0x3498db, () => { cleanup(); this.paused=false; this.cameras.main.fadeOut(300,0,0,0); this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('MenuScene')); }, 41);
  }

  makeOverlayBtn(x, y, label, color, cb, depthBase = 70) {
    const g = this.add.graphics().setDepth(depthBase);
    g.fillStyle(color, 1);
    g.fillRoundedRect(x-100, y-22, 200, 44, 10);
    const t = this.add.text(x, y, label, { fontFamily:'Arial', fontSize:'20px', fontStyle:'bold', color:'#ffffff' }).setOrigin(0.5).setDepth(depthBase+1);
    const z = this.add.zone(x, y, 200, 44).setInteractive({ cursor:'pointer' }).setDepth(depthBase+2);
    z.on('pointerdown', cb);
  }

  // ── Deflector ─────────────────────────────────────────────────────────────

  createDeflector(x, y) {
    if (this.deflector) this.destroyDeflector();
    if (this.matchWindowTimer) this.matchWindowTimer.remove(false);
    for (const s of this.spheres) s.recentlyDeflected = false;
    this.matchWindowOpen = true;
    this.matchWindowTimer = this.time.delayedCall(1500, () => {
      this.matchWindowOpen = false;
      for (const s of this.spheres) s.recentlyDeflected = false;
    });

    const R = 20;
    const body = this.matter.add.circle(x, y, R, { isStatic:true, restitution:1.2, friction:0, label:'deflector' });
    const gfx  = this.add.graphics().setDepth(10).setPosition(x, y);
    this.drawDeflector(gfx, R);
    const ring = this.add.graphics().setDepth(9);

    for (let i = 0; i < 3; i++) {
      const wave = this.add.graphics().setDepth(8).setPosition(x, y);
      this.tweens.add({ targets: wave, alpha:{from:0.6,to:0}, duration:500, delay:i*150,
        onUpdate: tw => { wave.clear(); wave.lineStyle(2,0xffffff,0.6*(1-tw.progress)); wave.strokeCircle(0,0,R+tw.progress*40); },
        onComplete: () => wave.destroy()
      });
    }
    const pulseTween = this.tweens.add({ targets:{t:0}, t:1, duration:800, repeat:-1,
      onUpdate: tw => { ring.clear(); ring.setPosition(x,y); ring.lineStyle(2,0xffffff,0.5); ring.strokeCircle(0,0,R+6+Math.sin(tw.progress*Math.PI)*8); }
    });
    const timer = this.time.delayedCall(1200, () => {
      this.tweens.add({ targets:[gfx,ring], alpha:0, duration:300, onComplete: () => { pulseTween.stop(); this.destroyDeflector(); } });
    });
    this.deflector = { body, gfx, ring, pulseTween, timer };
  }

  destroyDeflector() {
    if (!this.deflector) return;
    const { body, gfx, ring, pulseTween, timer } = this.deflector;
    timer?.remove(false);
    pulseTween?.stop();
    if (body) this.matter.world.remove(body);
    if (gfx?.active)  gfx.destroy();
    if (ring?.active) ring.destroy();
    this.deflector = null;
  }

  // ── Dibujo ────────────────────────────────────────────────────────────────

  drawSphere(gfx, x, y, radius, fillColor) {
    gfx.clear();
    gfx.fillStyle(fillColor, 0.12); gfx.fillCircle(x, y, radius+10);
    gfx.fillStyle(fillColor, 0.07); gfx.fillCircle(x, y, radius+18);
    gfx.fillStyle(0x000000, 0.45);  gfx.fillCircle(x+5, y+6, radius-1);
    gfx.fillStyle(fillColor, 1);    gfx.fillCircle(x, y, radius);
    gfx.lineStyle(radius*0.55, 0x000000, 0.28); gfx.strokeCircle(x, y, radius-radius*0.28);
    gfx.lineStyle(2.5, 0xffffff, 0.55); gfx.strokeCircle(x, y, radius);
    gfx.fillStyle(0xffffff, 0.17); gfx.fillCircle(x-radius*0.16, y-radius*0.2,  radius*0.56);
    gfx.fillStyle(0xffffff, 0.92); gfx.fillCircle(x-radius*0.31, y-radius*0.37, radius*0.11);
    gfx.lineStyle(3, 0xaa88ff, 0.18); gfx.strokeCircle(x+radius*0.08, y+radius*0.08, radius*0.84);
  }

  drawDeflector(gfx, radius) {
    gfx.clear();
    gfx.fillStyle(0xffffff, 0.35); gfx.fillCircle(0, 0, radius);
    gfx.lineStyle(2, 0xffffff, 0.9); gfx.strokeCircle(0, 0, radius);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update() {
    const MIN = 1.5, MAX = 3.5;
    const t = this.time.now / 500;

    for (const sphere of this.spheres) {
      if (!sphere.body) continue;
      const { x, y } = sphere.body.position;
      sphere.gfx.setPosition(x, y);
      sphere.glowGfx.setPosition(x, y);
      sphere.txt.setPosition(x, y);

      if (sphere.recentlyDeflected) {
        const pulse = 0.35 + Math.sin(t) * 0.2;
        sphere.glowGfx.clear();
        sphere.glowGfx.lineStyle(5, sphere.color, pulse);
        sphere.glowGfx.strokeCircle(0, 0, this.RADIUS + 7);
        sphere.glowGfx.lineStyle(8, sphere.color, pulse * 0.35);
        sphere.glowGfx.strokeCircle(0, 0, this.RADIUS + 14);
      } else {
        sphere.glowGfx.clear();
      }

      const vx = sphere.body.velocity.x, vy = sphere.body.velocity.y;
      const speed = Math.sqrt(vx*vx + vy*vy);
      if (speed > 0 && speed < MIN) {
        const f = MIN/speed; this.matter.body.setVelocity(sphere.body, { x:vx*f, y:vy*f });
      } else if (speed === 0) {
        const a = Math.random()*Math.PI*2; this.matter.body.setVelocity(sphere.body, { x:Math.cos(a)*MIN, y:Math.sin(a)*MIN });
      } else if (speed > MAX) {
        const f = MAX/speed; this.matter.body.setVelocity(sphere.body, { x:vx*f, y:vy*f });
      }
    }

    // Anillo de selección en modo Caos
    if (this.selectionGfx) {
      this.selectionGfx.clear();
      if (this.selectedSphere?.body) {
        const { x, y } = this.selectedSphere.body.position;
        const pulse = 0.55 + Math.sin(t * 4) * 0.35;
        this.selectionGfx.lineStyle(3, 0xffffff, pulse);
        this.selectionGfx.strokeCircle(x, y, this.RADIUS + 11);
        this.selectionGfx.lineStyle(2, 0xffff44, pulse * 0.55);
        this.selectionGfx.strokeCircle(x, y, this.RADIUS + 19);
      }
    }
  }
}
