import { SaveSystem } from '../utils/SaveSystem.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.selectedClass = 0; // 0=Warrior, 1=Mage, 2=Ranger

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
        this.add.text(w / 2, 180, 'Wähle deinen Helden', {
            fontSize: '22px', fill: '#cccccc', fontFamily: 'Arial',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        // ── Dragon graphic (decorative) ─────────────────────────────────────────
        this.drawDragon(w / 2, 300, 0.7);

        // ── Class selector ──────────────────────────────────────────────────────
        const classes = [
            {
                name: 'Krieger',
                icon: '⚔️',
                color: 0xcc4400,
                stats: 'HP: ★★★  ATK: ★★  SPD: ★',
                desc: 'Hohe HP, starker Nahkampf',
                bonuses: { hp: 17, attack: 5, defense: 2, speed: -20 }
            },
            {
                name: 'Magier',
                icon: '🔮',
                color: 0x4400cc,
                stats: 'HP: ★  ATK: ★★★  SPD: ★★',
                desc: 'Mächtige Zauber, wenig HP',
                bonuses: { attack: 8, autoAttackSpeed: -150 }
            },
            {
                name: 'Waldläufer',
                icon: '🏹',
                color: 0x227722,
                stats: 'HP: ★★  ATK: ★★  SPD: ★★★',
                desc: 'Schnell, ausgeglichen',
                bonuses: { speed: 60, autoAttackSpeed: -150, attack: 3 }
            }
        ];

        this.classBgs = [];
        const startY = 460;
        classes.forEach((cls, i) => {
            const cx = w / 2;
            const cy = startY + i * 160;

            const bg = this.add.rectangle(cx, cy, 640, 140, 0x0d0d1f).setInteractive();
            bg.setStrokeStyle(3, 0x333366);
            this.classBgs.push(bg);

            // Class icon
            this.add.text(cx - 210, cy, cls.icon, { fontSize: '42px' }).setOrigin(0.5).setPadding(10);

            // Class name
            this.add.text(cx, cy - 25, cls.name, {
                fontSize: '28px', fill: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
                stroke: '#000', strokeThickness: 3
            }).setOrigin(0.5);

            // Stats
            this.add.text(cx, cy + 10, cls.stats, {
                fontSize: '16px', fill: '#aaaaff', fontFamily: 'Arial'
            }).setOrigin(0.5);

            // Desc
            this.add.text(cx, cy + 35, cls.desc, {
                fontSize: '14px', fill: '#888888', fontFamily: 'Arial'
            }).setOrigin(0.5);

            // Selection indicator (right side)
            cls.indicator = this.add.text(cx + 210, cy, '⭕', { fontSize: '32px' }).setOrigin(0.5).setPadding(5);

            // Click
            bg.on('pointerdown', () => this.selectClass(i, classes, cx, cy));
            bg.on('pointerover', () => {
                if (this.selectedClass !== i) bg.setFillStyle(0x1a1a3a);
            });
            bg.on('pointerout', () => {
                if (this.selectedClass !== i) bg.setFillStyle(0x0d0d1f);
            });
        });

        // Default select warrior
        this.selectClass(0, classes, w / 2, startY);

        // ── Start button ────────────────────────────────────────────────────────
        const startBg = this.add.rectangle(w / 2, h - 180, 520, 100, 0x226622).setInteractive();
        const startText = this.add.text(w / 2, h - 180, '▶  SPIEL STARTEN', {
            fontSize: '32px', fill: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        startBg.on('pointerover', () => {
            startBg.setFillStyle(0x338833);
            this.tweens.add({ targets: [startBg, startText], scaleX: 1.04, scaleY: 1.04, duration: 100 });
        });
        startBg.on('pointerout', () => {
            startBg.setFillStyle(0x226622);
            this.tweens.add({ targets: [startBg, startText], scaleX: 1, scaleY: 1, duration: 100 });
        });
        startBg.on('pointerdown', () => this.startGame(classes));

        // Pulse
        this.tweens.add({
            targets: [startBg, startText],
            alpha: 0.75, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Version
        this.add.text(w - 10, h - 10, 'v0.2', {
            fontSize: '11px', fill: '#444444', fontFamily: 'Arial'
        }).setOrigin(1);

        // ── Reset Button ────────────────────────────────────────────────────────
        const resetBtn = this.add.text(10, h - 10, '⚠️ RESET ALL PROGRESS', {
            fontSize: '12px', fill: '#662222', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0, 1).setInteractive();

        resetBtn.on('pointerover', () => resetBtn.setFill('#ff4444'));
        resetBtn.on('pointerout', () => resetBtn.setFill('#662222'));
        resetBtn.on('pointerdown', () => {
            if (confirm('Bist du sicher? Alle Fortschritte, Items und Summons werden gelöscht!')) {
                SaveSystem.clearAll();
                window.location.reload();
            }
        });
    }

    drawBackground(w, h) {
        // New Visual Background
        const bg = this.add.image(w / 2, h / 2, 'game_bg');
        const scale = Math.max(w / bg.width, h / bg.height);
        bg.setScale(scale).setAlpha(1);

        // Mountains silhouette
        const gfx = this.add.graphics();
        gfx.fillStyle(0x0d0d0d);
        gfx.fillTriangle(0, h * 0.72, 220, h * 0.38, 440, h * 0.72);
        gfx.fillTriangle(200, h * 0.72, 420, h * 0.44, 640, h * 0.72);
        gfx.fillTriangle(500, h * 0.72, 700, h * 0.40, 900, h * 0.72);
        gfx.fillTriangle(750, h * 0.72, 1000, h * 0.36, 1280, h * 0.72);

        // Ground
        gfx.fillStyle(0x0f1f0a);
        gfx.fillRect(0, h * 0.72, w, h * 0.28);
    }

    drawDragon(x, y, scale = 1) {
        // Draw a simple but cool dragon outline using graphics
        const g = this.add.graphics();
        g.fillStyle(0xff2200, 0.85);
        g.strokeStyle = 0xff6600;
        g.lineWidth = 3;

        // Body (ellipse approximation)
        g.fillEllipse(x, y, 140 * scale, 56 * scale);
        // Head
        g.fillEllipse(x + 84 * scale, y - 12 * scale, 56 * scale, 44 * scale);
        // Snout
        g.fillTriangle(
            x + 106 * scale, y - 6 * scale,
            x + 130 * scale, y - 2 * scale,
            x + 106 * scale, y + 10 * scale
        );
        // Wing 1
        g.fillStyle(0xcc1100, 0.7);
        g.fillTriangle(
            x - 20 * scale, y - 10 * scale,
            x - 80 * scale, y - 80 * scale,
            x + 30 * scale, y - 28 * scale
        );
        // Wing 2
        g.fillTriangle(
            x - 10 * scale, y - 8 * scale,
            x + 40 * scale, y - 70 * scale,
            x + 50 * scale, y - 22 * scale
        );
        // Tail
        g.fillStyle(0xff2200, 0.85);
        g.fillTriangle(
            x - 60 * scale, y + 6 * scale,
            x - 130 * scale, y + 40 * scale,
            x - 50 * scale, y + 22 * scale
        );
        // Eye
        g.fillStyle(0xffff00);
        g.fillCircle(x + 92 * scale, y - 18 * scale, 5 * scale);
        g.fillStyle(0x000000);
        g.fillCircle(x + 94 * scale, y - 18 * scale, 3 * scale);

        // Add glow/pulse
        this.tweens.add({
            targets: g, alpha: 0.7, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
    }

    selectClass(index, classes, cx, cy) {
        this.selectedClass = index;

        this.classBgs.forEach((bg, i) => {
            if (i === index) {
                bg.setStrokeStyle(5, 0xffaa00);
                bg.setFillStyle(0x151540);
                if (classes[i].indicator) classes[i].indicator.setText('🔘').setFill('#ffaa00');
            } else {
                bg.setStrokeStyle(2, 0x333366);
                bg.setFillStyle(0x0d0d1f);
                if (classes[i].indicator) classes[i].indicator.setText('⭕').setFill('#ffffff');
            }
        });
    }

    startGame(classes) {
        const savedData = SaveSystem.load();
        const cls = classes[this.selectedClass];
        
        // Initial defaults
        let baseStats = {
            hp: 100, maxHp: 100,
            attack: 15, defense: 3,
            speed: 200, gold: 0,
            autoAttackSpeed: 800,
            className: cls.name,
            classIndex: this.selectedClass,
            damageLevel: 1,
            hpLevel: 1,
            hpRegenLevel: 1,
            critLevel: 1,
            gems: 0,
            emeralds: 0,
            autoSkills: false,
            stage: 1,
            maxStage: 1
        };

        // If class matches saved class, use saved stats entirely
        if (savedData && savedData.classIndex === this.selectedClass) {
            baseStats = { ...baseStats, ...savedData };
        } else {
            // Apply class bonuses to fresh start
            Object.entries(cls.bonuses).forEach(([k, v]) => {
                if (baseStats[k] !== undefined) baseStats[k] += v;
                else baseStats[k] = v;
            });
            if (cls.bonuses.hp) baseStats.maxHp = baseStats.hp;
        }

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.on('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', { stage: baseStats.stage || 1, baseStats: baseStats });
        });
    }

    update() {
        // Twinkle stars
        this.stars.forEach(s => {
            s.alpha += s._speed * 0.02 * (Math.random() > 0.5 ? 1 : -1);
            s.alpha = Phaser.Math.Clamp(s.alpha, 0.05, 1);
        });
    }
}
