export default class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    init(data) {
        this.currentStage = data.stage;
        this.playerStats = data.playerStats;
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        const s = this.playerStats;

        this.cameras.main.fadeIn(400, 0, 0, 0);

        // ── Background ─────────────────────────────────────────────────────────
        this.add.rectangle(w / 2, h / 2, w, h, 0x070710);
        // Decorative grid lines
        const gfx = this.add.graphics();
        gfx.lineStyle(1, 0x1a1a3a, 0.4);
        for (let x = 0; x < w; x += 60) gfx.lineBetween(x, 0, x, h);
        for (let y = 0; y < h; y += 60) gfx.lineBetween(0, y, w, y);

        // Header
        this.add.rectangle(w / 2, 55, w, 110, 0x0d0d20);
        this.add.text(w / 2, 28, '🛒  SHOP', {
            fontSize: '36px', fill: '#FFD700', fontFamily: 'Arial',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5);

        this.goldText = this.add.text(w / 2, 66, `Gold: ${s.gold}G`, {
            fontSize: '20px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(w / 2, 90, `Stufe ${s.level}  •  ATK: ${s.attack}  •  HP: ${s.maxHp}  •  DEF: ${s.defense}`, {
            fontSize: '13px', fill: '#aaaaaa', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // ── Shop items ────────────────────────────────────────────────────────
        const items = [
            {
                name: '❤ HP Heilen',
                desc: 'Stellt 50% HP wieder her',
                cost: 20,
                color: 0x661111,
                hoverColor: 0x882222,
                action: () => { s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.5); }
            },
            {
                name: '⚔ Angriff +6',
                desc: `Aktuell: ${s.attack} ATK`,
                cost: 30,
                color: 0x663300,
                hoverColor: 0x884400,
                action: () => { s.attack += 6; }
            },
            {
                name: '🛡 Verteidigung +3',
                desc: `Aktuell: ${s.defense} DEF`,
                cost: 25,
                color: 0x224466,
                hoverColor: 0x336688,
                action: () => { s.defense += 3; }
            },
            {
                name: '❤ Max HP +25',
                desc: `Aktuell: ${s.maxHp} HP`,
                cost: 35,
                color: 0x442244,
                hoverColor: 0x663366,
                action: () => { s.maxHp += 25; s.hp += 25; }
            },
            {
                name: '🛡 Verteidigung +4',
                desc: `Aktuell: ${s.defense} DEF`,
                cost: 25,
                color: 0x224466,
                hoverColor: 0x336688,
                action: () => { s.defense += 4; }
            },
            {
                name: '⚡ Angriffstempo +12%',
                desc: 'Schnellerer Auto-Angriff',
                cost: 40,
                color: 0x334400,
                hoverColor: 0x446600,
                action: () => { s.autoAttackSpeed = Math.max(200, s.autoAttackSpeed * 0.88); }
            },
        ];

        const cols = 3;
        const cardW = 350;
        const cardH = 110;
        const padX = (w - cols * cardW - (cols - 1) * 20) / 2 + cardW / 2;
        const startY = 165;

        items.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = padX + col * (cardW + 20);
            const cy = startY + row * (cardH + 18);

            // Card shadow
            this.add.rectangle(cx + 3, cy + 3, cardW, cardH, 0x000000, 0.5);

            // Card background
            const card = this.add.rectangle(cx, cy, cardW, cardH, item.color).setInteractive();
            this.add.rectangle(cx, cy, cardW, cardH).setStrokeStyle(1, 0x334455);

            // Icon + Name
            this.add.text(cx - cardW / 2 + 18, cy - 32, item.name, {
                fontSize: '16px', fill: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
            });

            // Description
            this.add.text(cx - cardW / 2 + 18, cy - 8, item.desc, {
                fontSize: '12px', fill: '#aaaaaa', fontFamily: 'Arial'
            });

            // Divider
            const divGfx = this.add.graphics();
            divGfx.lineStyle(1, 0x334455);
            divGfx.lineBetween(cx - cardW / 2 + 10, cy + 10, cx + cardW / 2 - 10, cy + 10);

            // Cost
            const costTxt = this.add.text(cx + cardW / 2 - 18, cy + 28, `${item.cost}G`, {
                fontSize: '20px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(1, 0.5);

            // Buy hint
            const buyTxt = this.add.text(cx - cardW / 2 + 18, cy + 28, 'Kaufen ▶', {
                fontSize: '13px', fill: '#88cc88', fontFamily: 'Arial'
            }).setOrigin(0, 0.5);

            card.on('pointerover', () => card.setFillStyle(item.hoverColor));
            card.on('pointerout', () => card.setFillStyle(item.color));
            card.on('pointerdown', () => {
                if (s.gold >= item.cost) {
                    s.gold -= item.cost;
                    item.action();
                    this.goldText.setText(`Gold: ${s.gold}G`);
                    // Success feedback
                    costTxt.setStyle({ fill: '#00ff88' });
                    buyTxt.setText('✓ Gekauft!');
                    this.tweens.add({ targets: card, scaleX: 1.04, scaleY: 1.04, duration: 80, yoyo: true });
                    this.time.delayedCall(500, () => {
                        costTxt.setStyle({ fill: '#FFD700' });
                        buyTxt.setText('Kaufen ▶');
                    });
                } else {
                    // Not enough gold
                    costTxt.setStyle({ fill: '#ff4444' });
                    this.cameras.main.shake(120, 0.005);
                    this.time.delayedCall(400, () => costTxt.setStyle({ fill: '#FFD700' }));
                }
            });
        });

        // ── Continue button ────────────────────────────────────────────────────
        const cont = this.add.rectangle(w / 2, h - 42, 300, 60, 0x226622).setInteractive();
        const contLabel = this.add.text(w / 2, h - 42, `▶  Weiter zu Stage ${this.currentStage + 1}`, {
            fontSize: '20px', fill: '#fff', fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        // Pulse
        this.tweens.add({ targets: [cont, contLabel], alpha: 0.75, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        cont.on('pointerover', () => { cont.setFillStyle(0x338833); this.tweens.killTweensOf([cont, contLabel]); cont.setAlpha(1); contLabel.setAlpha(1); });
        cont.on('pointerout', () => this.tweens.add({ targets: [cont, contLabel], alpha: 0.75, duration: 700, yoyo: true, repeat: -1 }));
        cont.on('pointerdown', () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene', {
                    stage: this.currentStage + 1,
                    playerStats: this.playerStats
                });
            });
        });
    }
}