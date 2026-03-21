import { SaveSystem } from '../utils/SaveSystem.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.selectedGender = null; // 'male' or 'female'

        // ── Background ─────────────────────────────────────────────────────────
        this.drawBackground(w, h);

        // ── Animated stars ─────────────────────────────────────────────────────
        this.stars = [];
        for (let i = 0; i < 120; i++) {
            const s = this.add.circle(
                Phaser.Math.Between(0, w), Phaser.Math.Between(0, h * 0.75),
                Phaser.Math.Between(1, 2), 0xffffff,
                Phaser.Math.FloatBetween(0.2, 1)
            );
            s._speed = Phaser.Math.FloatBetween(0.1, 0.5);
            this.stars.push(s);
        }

        // ── Title ───────────────────────────────────────────────────────────────
        const titleShadow = this.add.text(w / 2 + 3, 124, '⚔ LUNAR SLAYER ⚔', {
            fontSize: '48px', fill: '#5a0000', fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.titleText = this.add.text(w / 2, 120, '⚔ LUNAR SLAYER ⚔', {
            fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ff6600',
            stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        // Title glow pulse
        this.tweens.add({
            targets: this.titleText,
            scaleX: 1.04, scaleY: 1.04,
            duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Subtitle
        this.add.text(w / 2, 190, 'Wähle dein Geschlecht', {
            fontSize: '22px', fill: '#cccccc', fontFamily: 'Arial',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        // ── Dragon graphic (decorative) ─────────────────────────────────────────
        this.drawDragon(w / 2, 330, 0.6);

        // ── Gender Selection ────────────────────────────────────────────────────
        const genders = [
            { id: 'male', name: 'Männlich', anim: 'male_idle', color: 0x3366ff },
            { id: 'female', name: 'Weiblich', anim: 'female_idle', color: 0xff33cc }
        ];

        this.genderCards = [];
        const startY = 480;
        const spacing = 120;

        genders.forEach((g, i) => {
            const cx = w / 2;
            const cy = startY + i * spacing;

            const bg = this.add.rectangle(cx, cy, 600, 100, 0x0d0d1f).setInteractive();
            bg.setStrokeStyle(3, 0x333366);
            this.genderCards.push(bg);

            // Sprite Preview
            const preview = this.add.sprite(cx - 240, cy, 'player_sheet_' + g.id).setScale(0.8);
            preview.play(g.anim);

            // Name
            this.add.text(cx, cy, g.name.toUpperCase(), {
                fontSize: '28px', fill: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
                stroke: '#000', strokeThickness: 3
            }).setOrigin(0.5);

            // Selection indicator
            g.indicator = this.add.text(cx + 240, cy, '⭕', { fontSize: '32px' }).setOrigin(0.5);

            // Click
            bg.on('pointerdown', () => this.selectGender(g.id, genders));
            bg.on('pointerover', () => {
                if (this.selectedGender !== g.id) bg.setFillStyle(0x1a1a3a);
            });
            bg.on('pointerout', () => {
                if (this.selectedGender !== g.id) bg.setFillStyle(0x0d0d1f);
            });
        });

        // ── Start button ────────────────────────────────────────────────────────
        this.startBg = this.add.rectangle(w / 2, h - 80, 520, 90, 0x333333).setInteractive();
        this.startText = this.add.text(w / 2, h - 80, '▶  SPIEL STARTEN', {
            fontSize: '32px', fill: '#666666', fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this.startBg.on('pointerover', () => {
            if (this.selectedGender) {
                this.startBg.setFillStyle(0x338833);
                this.tweens.add({ targets: [this.startBg, this.startText], scaleX: 1.04, scaleY: 1.04, duration: 100 });
            }
        });
        this.startBg.on('pointerout', () => {
            if (this.selectedGender) {
                this.startBg.setFillStyle(0x226622);
            }
            this.tweens.add({ targets: [this.startBg, this.startText], scaleX: 1, scaleY: 1, duration: 100 });
        });
        this.startBg.on('pointerdown', () => this.startGame());

        // Pulsing for active start button
        this.startPulse = this.tweens.add({
            targets: [this.startBg, this.startText],
            alpha: 0.75, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', paused: true
        });

        // ── Reset Button ────────────────────────────────────────────────────────
        const resetBtn = this.add.text(10, h - 10, '⚠️ RESET PROGRESS', {
            fontSize: '11px', fill: '#662222', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0, 1).setInteractive();

        resetBtn.on('pointerdown', () => {
            if (confirm('Bist du sicher? Alle Fortschritte werden gelöscht!')) {
                SaveSystem.clearAll();
                window.location.reload();
            }
        });
    }

    selectGender(genderId, genders) {
        this.selectedGender = genderId;

        this.genderCards.forEach((bg, i) => {
            const g = genders[i];
            if (g.id === genderId) {
                bg.setStrokeStyle(5, 0xffaa00);
                bg.setFillStyle(0x151540);
                g.indicator.setText('🔘').setFill('#ffaa00');
            } else {
                bg.setStrokeStyle(2, 0x333366);
                bg.setFillStyle(0x0d0d1f);
                g.indicator.setText('⭕').setFill('#ffffff');
            }
        });

        // Enable start button
        this.startBg.setFillStyle(0x226622);
        this.startText.setFill('#ffffff');
        this.startPulse.play();
    }

    startGame() {
        if (!this.selectedGender) return;
        
        let stats = SaveSystem.load() || SaveSystem.getDefaultStats();
        stats.selectedGender = this.selectedGender;

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.on('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', { stage: stats.stage || 1, baseStats: stats });
        });
    }

    update(time, delta) {
        this.stars.forEach(s => {
            s.y += s._speed;
            if (s.y > this.scale.height * 0.75) s.y = 0;
            s.alpha += s._speed * 0.02 * (Math.random() > 0.5 ? 1 : -1);
            s.alpha = Phaser.Math.Clamp(s.alpha, 0.05, 1);
        });
    }

    drawBackground(w, h) {
        const bg = this.add.image(w / 2, h / 2, 'game_bg');
        const scale = Math.max(w / bg.width, h / bg.height);
        bg.setScale(scale);

        const gfx = this.add.graphics();
        gfx.fillStyle(0x0d0d0d);
        gfx.fillTriangle(0, h * 0.72, 220, h * 0.38, 440, h * 0.72);
        gfx.fillTriangle(500, h * 0.72, 700, h * 0.40, 900, h * 0.72);
        gfx.fillStyle(0x0f1f0a);
        gfx.fillRect(0, h * 0.72, w, h * 0.28);
    }

    drawDragon(x, y, scale = 1) {
        const g = this.add.graphics();
        g.fillStyle(0xff2200, 0.85);
        g.fillEllipse(x, y, 140 * scale, 56 * scale);
        g.fillEllipse(x + 84 * scale, y - 12 * scale, 56 * scale, 44 * scale);
        this.tweens.add({
            targets: g, alpha: 0.7, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
    }
}
