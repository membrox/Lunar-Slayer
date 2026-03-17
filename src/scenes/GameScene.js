import { drawPlayerOnGraphics, drawSwordOnGraphics, drawEnemyOnGraphics } from '../utils/DrawHelpers.js';
import { SaveSystem } from '../utils/SaveSystem.js';

// Enemy type pools per stage tier
const ENEMY_POOLS = [
    ['slime', 'bat'],
    ['slime', 'skeleton', 'bat'],
    ['skeleton', 'orc', 'bat'],
    ['orc', 'skeleton'],
    ['orc', 'skeleton'],
];

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.currentStage = data.stage || 1;
        this.playerStats = data.playerStats || {
            hp: 100, maxHp: 100,
            mana: 100, maxMana: 100,
            xp: 0, level: 1,
            attack: 15, defense: 3,
            speed: 200, gold: 0,
            autoAttackSpeed: 800,
            className: 'Krieger',
            classIndex: 0,
            damageLevel: 1,
            hpLevel: 1,
            hpRegenLevel: 1,
            critLevel: 1,
            gems: 0,
            emeralds: 0
        };
        this.playerStats.hp = this.playerStats.maxHp;
        this.playerStats.mana = this.playerStats.maxMana;
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        this.gameOver = false;
        this.stageComplete = false;
        this.enemiesKilled = 0;
        this.totalEnemies = 20;
        this.bossSpawned = false;
        this.boss = null;
        this.enemyList = [];
        this.autoAttackTimer = 0;
        this.maxSimultaneousEnemies = Math.min(3, 1 + Math.floor(this.currentStage / 2));
        this.activeEnemies = 0;
        this.spawnedEnemyCount = 0;
        this.worldScroll = 0; // Cumulative world distance
        this.isWalking = false;

        // Stage scaling
        const s = this.currentStage;
        this.enemyHpScale = 1 + (s - 1) * 0.4;
        this.enemyAtkScale = 1 + (s - 1) * 0.3;

        this.groundY = 522; // Aligned with the path in a 580px high window

        // Ensure animations are created BEFORE sprites use them
        if (!this.anims.exists('mage_idle')) {
            this.anims.create({
                key: 'mage_idle',
                frames: this.anims.generateFrameNumbers('mage_sheet_2', { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });
        }
        if (!this.anims.exists('mage_attack')) {
            this.anims.create({
                key: 'mage_attack',
                frames: this.anims.generateFrameNumbers('mage_sheet_1', { start: 0, end: 7 }),
                frameRate: 15,
                repeat: 0
            });
        }

        this.buildWorld();
        this.spawnEnemiesIfNeeded();

        // Camera - Action area focus (Screen Y = World Y)
        this.cameras.main.setBounds(0, 0, w * 10, h);
        this.cameras.main.setScroll(0, 0); 
        this.cameras.main.fadeIn(600, 0, 0, 0);

        // Mana regen
        this.time.addEvent({
            delay: 800, loop: true,
            callback: () => {
                if (this.playerStats.mana < this.playerStats.maxMana)
                    this.playerStats.mana = Math.min(this.playerStats.maxMana, this.playerStats.mana + 8);
            }
        });

        // Launch UI
        this.scene.launch('UIScene', {
            playerStats: this.playerStats,
            stage: this.currentStage,
            onSkill: (i) => this.castSkill(i)
        });

        // Keyboard skills - route through UIScene for cooldown check
        this.input.keyboard.on('keydown-ONE', () => {
            const ui = this.scene.get('UIScene');
            if (ui && ui.triggerSkill) ui.triggerSkill(0);
        });
        this.input.keyboard.on('keydown-TWO', () => {
            const ui = this.scene.get('UIScene');
            if (ui && ui.triggerSkill) ui.triggerSkill(1);
        });
        this.input.keyboard.on('keydown-THREE', () => {
            const ui = this.scene.get('UIScene');
            if (ui && ui.triggerSkill) ui.triggerSkill(2);
        });
        this.input.keyboard.on('keydown-FOUR', () => {
            const ui = this.scene.get('UIScene');
            if (ui && ui.triggerSkill) ui.triggerSkill(3);
        });

        // Mage Animations
        this.spawnEnemiesIfNeeded();
    }

    // ─── World ────────────────────────────────────────────────────────────────

    buildWorld() {
        const w = this.scale.width;
        const h = this.scale.height;
        const classIndex = this.playerStats.classIndex ?? 0;
        const bgAsset = this.textures.get('game_bg').getSourceImage();

        // ── New Visual Background (TileSprite for scrolling) ──────────────────
        // Scaling to fit the battle window height (approx 580px)
        const battleH = 580;
        const visualScale = battleH / bgAsset.height;
        
        // Position at 290 (center of 580)
        this.bg = this.add.tileSprite(w / 2, 290, w / visualScale, bgAsset.height, 'game_bg').setScrollFactor(0);
        this.bg.setScale(visualScale).setAlpha(1);

        // ── Physics ground ────────────────────────────────────────────────────
        this.physics.world.gravity.y = 800;
        this.platforms = this.physics.add.staticGroup();
        const groundPhys = this.add.rectangle(w / 2, this.groundY + 20, w * 10, 40, 0x000000, 0); 
        this.physics.add.existing(groundPhys, true);
        this.platforms.add(groundPhys);

        // Prepare Parallax Layers
        this.parallaxLayers = [
            { gfx: this.add.graphics().setScrollFactor(0), speed: 0.05, type: 'stars' },
            { gfx: this.add.graphics().setScrollFactor(0), speed: 0.1, type: 'mtnFar' },
            { gfx: this.add.graphics().setScrollFactor(0), speed: 0.25, type: 'mtnNear' },
            { gfx: this.add.graphics().setScrollFactor(0), speed: 0.45, type: 'treesBack' },
            { gfx: this.add.graphics().setScrollFactor(0), speed: 0.75, type: 'treesFront' },
            { gfx: this.add.graphics().setScrollFactor(0), speed: 1.0, type: 'ground' }
        ];

        this.initParallax();

        // ── Player ────────────────────────────────────────────────────────────
        // Container so graphics + physics body move together
        const px = w / 2;
        const py = this.groundY - 34;

        this.playerContainer = this.add.container(px, py);
        
        if (classIndex === 1) {
            this.playerSprite = this.add.sprite(0, 0, 'mage_sheet_2').setScale(0.4).setOrigin(0.5, 0.5);
            this.playerSprite.play('mage_idle');
            this.playerContainer.add(this.playerSprite);
            this.playerGfx = this.add.graphics().setVisible(false);
            this.weaponGfx = this.add.graphics().setVisible(false);
        } else {
            this.playerGfx = this.add.graphics();
            drawPlayerOnGraphics(this.playerGfx, 0, 0, classIndex);
            this.weaponGfx = this.add.graphics();
            drawSwordOnGraphics(this.weaponGfx, 30, 0, classIndex);
            this.playerContainer.add([this.playerGfx, this.weaponGfx]);
        }

        // Physics on invisible rectangle
        this.playerPhysics = this.add.rectangle(px, py, 36, 68, 0x000000, 0);
        this.physics.add.existing(this.playerPhysics);
        this.playerPhysics.body.setCollideWorldBounds(true);
        this.playerPhysics.body.setImmovable(true);
        this.playerPhysics.body.setAllowGravity(false);
        this.playerPhysics.y = this.groundY - 34;
        this.physics.add.collider(this.playerPhysics, this.platforms);

        this.playerContainer.setDepth(100);

        // Camera Follow
        this.cameras.main.startFollow(this.playerPhysics, true, 0.1, 0, -200, 0); 

        // Stage label
        const stageLabel = this.add.text(w / 2, h / 2, `STAGE ${this.currentStage}`, {
            fontSize: '52px', fill: '#FFD700', fontFamily: 'Arial',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 7, alpha: 0
        }).setOrigin(0.5).setScrollFactor(0);
        this.tweens.add({
            targets: stageLabel, alpha: { from: 0, to: 1 }, scaleX: { from: 0.5, to: 1 }, scaleY: { from: 0.5, to: 1 },
            duration: 500, ease: 'Back.Out',
            onComplete: () => this.tweens.add({
                targets: stageLabel, alpha: 0, duration: 600, delay: 800,
                onComplete: () => stageLabel.destroy()
            })
        });
    }

    initParallax() {
        // Disabled to use the full background image instead
        this.parallaxLayers.forEach(layer => layer.gfx.clear());
    }

    drawMountainsLoop(gfx, totalW, h, yFactor, count, maxH, minH) {
        const step = 200;
        const baseY = h * yFactor;
        for (let x = 0; x < totalW; x += step) {
            const x1 = x;
            const x2 = x + step;
            const peakX = (x1 + x2) / 2 + Phaser.Math.Between(-30, 30);
            const peakH = minH + Phaser.Math.Between(0, maxH - minH);
            gfx.fillTriangle(x1, baseY, peakX, baseY - peakH, x2, baseY);
        }
        gfx.fillRect(0, baseY, totalW, h - baseY);
    }

    updateParallax(scrollSpeed) {
        const w = this.scale.width;
        this.parallaxLayers.forEach(layer => {
            layer.gfx.x -= scrollSpeed * layer.speed;
            if (layer.gfx.x <= -w) {
                layer.gfx.x = 0;
            }
        });
    }

    // ─── Enemy Spawning ───────────────────────────────────────────────────────

    spawnEnemiesIfNeeded() {
        if (this.stageComplete || this.gameOver || this.bossSpawned) return;
        while (
            this.activeEnemies < this.maxSimultaneousEnemies &&
            this.spawnedEnemyCount < this.totalEnemies
        ) {
            this.spawnEnemy();
        }
    }

    spawnEnemy() {
        const h = this.scale.height;
        const w = this.scale.width;
        this.spawnedEnemyCount++;
        this.activeEnemies++;

        // Pick type
        const pool = ENEMY_POOLS[Math.min(this.currentStage - 1, ENEMY_POOLS.length - 1)];
        const type = pool[Math.floor(Math.random() * pool.length)];
        const isBig = Math.random() > 0.55;

        const sizeMap = { slime: 44, skeleton: 50, bat: 36, orc: 56 };
        const size = sizeMap[type] || 44;
        const adjSize = isBig ? size * 1.25 : size;
        const baseHp = { slime: 28, skeleton: 38, bat: 22, orc: 55 }[type] || 30;
        const baseAtk = { slime: 5, skeleton: 8, bat: 6, orc: 12 }[type] || 5;

        const hp = Math.floor(baseHp * (isBig ? 1.5 : 1) * this.enemyHpScale);
        const spawnX = w + 400 + Phaser.Math.Between(0, 150);
        const groundY = this.groundY - (adjSize / 2);

        const container = this.add.container(spawnX, groundY);

        const gfx = this.add.graphics();
        drawEnemyOnGraphics(gfx, 0, 0, type, null);
        container.add(gfx);

        // HP bar (above enemy)
        const barW = adjSize * 1.1;
        const barBg = this.add.rectangle(0, -adjSize / 2 - 14, barW, 7, 0x550000);
        const barFill = this.add.rectangle(-barW / 2, -adjSize / 2 - 14, barW, 7, 0xff3333).setOrigin(0, 0.5);
        container.add([barBg, barFill]);

        // Physics rect (invisible)
        const physRect = this.add.rectangle(spawnX, groundY, adjSize * 0.8, adjSize * 0.9, 0x000000, 0);
        this.physics.add.existing(physRect);
        physRect.body.setCollideWorldBounds(false);

        const enemyBaseSpeed = 75; 
        physRect.body.setVelocityX(-enemyBaseSpeed);
        physRect.body.setAllowGravity(false);
        physRect.body.setImmovable(false);
        container.setData('baseSpeed', enemyBaseSpeed);
        this.physics.add.collider(physRect, this.platforms);

        container.setData('physRect', physRect);
        container.setData('gfx', gfx);
        container.setData('barFill', barFill);
        container.setData('hp', hp);
        container.setData('maxHp', hp);
        container.setData('alive', true);
        container.setData('xpValue', Math.floor((isBig ? 28 : 14) * this.enemyHpScale));
        container.setData('goldValue', Phaser.Math.Between(isBig ? 6 : 2, isBig ? 18 : 8));
        container.setData('attack', Math.floor(baseAtk * (isBig ? 1.3 : 1) * this.enemyAtkScale));
        container.setData('attackSpeed', 1200 + Phaser.Math.Between(-200, 200));
        container.setData('attackTimer', 0);
        container.setData('size', adjSize);
        container.setData('type', type);
        container.setData('isBoss', false);
        container.setData('barW', barW);

        this.enemyList.push(container);

        // Entrance shrink-in
        container.setScale(0);
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.Out' });
    }

    spawnBoss() {
        if (this.bossSpawned) return;
        const h = this.scale.height;
        const w = this.scale.width;
        this.bossSpawned = true;

        const s = this.currentStage;
        const size = 90;
        const hp = Math.floor(300 * this.enemyHpScale);
        const bossColors = [0xff1111, 0x880088, 0xff6600, 0x0066ff, 0xff0066];
        const col = bossColors[(s - 1) % bossColors.length];

        // Flash + zoom
        this.cameras.main.flash(600, 200, 0, 0);
        this.cameras.main.zoomTo(1.1, 600);
        this.time.delayedCall(1500, () => this.cameras.main.zoomTo(1, 600));

        const txt = this.add.text(w / 2, h * 0.3, `⚠ BOSS ERSCHEINT ⚠\nStage ${s}`, {
            fontSize: '38px', fill: '#ff0000', fontFamily: 'Arial',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0);
        this.tweens.add({ targets: txt, alpha: 0, duration: 400, delay: 1800, onComplete: () => txt.destroy() });

        const container = this.add.container(w + 600, this.groundY - size / 2);
        const gfx = this.add.graphics();
        drawEnemyOnGraphics(gfx, 0, 0, 'boss', col);
        container.add(gfx);

        const physRect = this.add.rectangle(w + 600, this.groundY - size / 2, size * 0.75, size * 0.95, 0x000000, 0);
        this.physics.add.existing(physRect);
        physRect.body.setCollideWorldBounds(false);
        physRect.body.setVelocityX(-45);
        physRect.body.setAllowGravity(false);
        this.physics.add.collider(physRect, this.platforms);

        container.setData('baseSpeed', 45);
        container.setData('physRect', physRect);
        container.setData('gfx', gfx);
        container.setData('hp', hp);
        container.setData('maxHp', hp);
        container.setData('alive', true);
        container.setData('xpValue', Math.floor(150 * this.enemyHpScale));
        container.setData('goldValue', Phaser.Math.Between(40, 80));
        container.setData('attack', Math.floor(22 * this.enemyAtkScale));
        container.setData('attackSpeed', 1800);
        container.setData('attackTimer', 0);
        container.setData('size', size);
        container.setData('type', 'boss');
        container.setData('isBoss', true);
        container.setData('col', col);

        // Notify UIScene to reset boss health
        const ui = this.scene.get('UIScene');
        if (ui && ui.showBossHP) ui.showBossHP(true);

        container.setScale(0);
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.Out' });

        this.boss = container;
        this.enemyList.push(container);
    }

    // ─── Skills ───────────────────────────────────────────────────────────────

    castSkill(index) {
        const classIndex = this.playerStats.classIndex ?? 0;
        // Warrior, Mage, Ranger each get slightly different skill names but same indices
        const skills = [
            { cost: 25, dmgMult: 2.5, range: 320, name: 'fire' },
            { cost: 30, dmgMult: 2.0, range: 260, name: 'ice', slow: true },
            { cost: 20, dmgMult: 1.8, range: 420, name: 'lightning' },
            { cost: 40, heal: true, name: 'heal' },
        ];
        const skill = skills[index];
        if (!skill || this.playerStats.mana < skill.cost) return false;
        this.playerStats.mana -= skill.cost;

        const px = this.playerPhysics.x;
        const py = this.playerPhysics.y;

        if (skill.heal) {
            const amount = Math.floor(this.playerStats.maxHp * 0.3);
            this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + amount);
            this.showDamageNumber(px, py - 70, `+${amount} HP`, '#00ff88', 24);
            this.spawnHealEffect(px, py);
            this.cameras.main.flash(200, 0, 200, 80);
            return true;
        }

        // Spawn skill visual then hit enemies
        this.spawnSkillEffect(skill.name, px, py, skill.range, (e) => {
            const dmg = Math.floor(this.playerStats.attack * skill.dmgMult);
            this.dealDamage(e, dmg, skill.slow);
        });
        const flashColors = [[255, 80, 0], [0, 80, 255], [220, 220, 0], [0, 255, 100]];
        const fc = flashColors[index];
        this.cameras.main.flash(120, fc[0], fc[1], fc[2]);
        return true;
    }

    spawnSkillEffect(name, px, py, range, hitCallback) {
        if (name === 'fire') {
            // Fireball projectile
            const fb = this.add.graphics();
            fb.fillStyle(0xff4400);
            fb.fillCircle(0, 0, 16);
            fb.fillStyle(0xffaa00);
            fb.fillCircle(0, 0, 10);
            fb.fillStyle(0xffffff);
            fb.fillCircle(0, 0, 4);
            fb.x = px + 30; fb.y = py;
            let traveled = 0;
            const fired = new Set();
            this.tweens.add({
                targets: fb, x: px + range, duration: 500, ease: 'Linear',
                onUpdate: () => {
                    traveled = fb.x - px;
                    this.enemyList.forEach(e => {
                        if (!e || !e.active || !e.getData || !e.getData('alive') || fired.has(e)) return;
                        const d = Phaser.Math.Distance.Between(fb.x, py, e.x, e.y);
                        if (d < 50) { fired.add(e); hitCallback(e); }
                    });
                },
                onComplete: () => {
                    this.spawnExplosion(fb.x, py, 0xff4400);
                    fb.destroy();
                }
            });
        } else if (name === 'ice') {
            // Ice burst wave ring
            const g = this.add.graphics();
            g.lineStyle(6, 0x88ddff, 1);
            g.strokeCircle(0, 0, 10);
            g.x = px; g.y = py;
            this.tweens.add({
                targets: g, scaleX: range / 10, scaleY: range / 10, alpha: 0,
                duration: 600, ease: 'Cubic.Out',
                onComplete: () => g.destroy()
            });
            // Hit immediately on cast
            this.enemyList.forEach(e => {
                if (!e || !e.active || !e.getData || !e.getData('alive')) return;
                const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
                if (d < range) { hitCallback(e); this.slowEnemy(e, 1200); }
            });
        } else if (name === 'lightning') {
            // Lightning bolt lines down from sky
            const targets = this.enemyList.filter(e => e && e.active && e.getData && e.getData('alive'));
            targets.forEach(e => {
                const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
                if (d > range) return;
                hitCallback(e);
                const bolt = this.add.graphics();
                bolt.lineStyle(4, 0xFFFF00, 1);
                const ey = e.y - e.getData('size') / 2;
                bolt.beginPath();
                // Zigzag from top to enemy
                let lx = e.x + Phaser.Math.Between(-20, 20);
                bolt.moveTo(lx, 0);
                for (let seg = 1; seg <= 5; seg++) {
                    lx += Phaser.Math.Between(-25, 25);
                    bolt.lineTo(lx, (ey / 5) * seg);
                }
                bolt.strokePath();
                bolt.lineStyle(2, 0xffffff, 0.8);
                bolt.strokePath();
                this.tweens.add({ targets: bolt, alpha: 0, duration: 300, onComplete: () => bolt.destroy() });
                this.cameras.main.shake(80, 0.004);
            });
        }
    }

    slowEnemy(container, duration) {
        const physRect = container.getData('physRect');
        if (!physRect || !physRect.body) return;
        const origVx = physRect.body.velocity.x || 0;
        physRect.body.setVelocityX(origVx * 0.35);
        container.setTint(0x88ccff);
        this.time.delayedCall(duration, () => {
            if (container.active && physRect.active) {
                physRect.body.setVelocityX(origVx);
                container.clearTint();
            }
        });
    }

    spawnHealEffect(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const dot = this.add.circle(x, y, 5, 0x00ff88);
            this.tweens.add({
                targets: dot,
                x: x + Math.cos(angle) * 60,
                y: y + Math.sin(angle) * 60,
                alpha: 0, scaleX: 0, scaleY: 0,
                duration: 600, ease: 'Cubic.Out',
                onComplete: () => dot.destroy()
            });
        }
    }

    spawnExplosion(x, y, color) {
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Phaser.Math.Between(40, 120);
            const p = this.add.circle(x, y, Phaser.Math.Between(3, 8), color);
            this.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0, scaleX: 0, scaleY: 0,
                duration: Phaser.Math.Between(300, 600),
                onComplete: () => p.destroy()
            });
        }
    }

    // ─── Combat ───────────────────────────────────────────────────────────────

    dealDamage(container, dmg, isSlow = false) {
        if (!container || !container.active || (container.getData && !container.getData('alive'))) return;

        // Critical hit (20% chance, 2x damage)
        const isCrit = Math.random() < 0.20;
        const finalDmg = Math.floor(isCrit ? dmg * 2 : dmg);

        const currentHp = container.getData('hp') || 0;
        const newHp = Math.max(0, currentHp - finalDmg);
        
        if (isNaN(newHp)) return; // Guard against corruption
        
        container.setData('hp', newHp);
        const maxHp = container.getData('maxHp') || 100;

        // Damage number
        const dmgColor = isCrit ? '#ff0000' : '#ffffff';
        const prefix = isCrit ? '💥 ' : '';
        this.showDamageNumber(container.x, container.y - (container.getData('size') || 40) / 2 - 20,
            prefix + Math.floor(finalDmg), dmgColor, isCrit ? 26 : 18);

        // Update HP bar
        if (container.getData('isBoss')) {
            const ui = this.scene.get('UIScene');
            if (ui && ui.updateBossStatus) {
                ui.updateBossStatus(newHp, maxHp);
            }
        } else {
            const barFill = container.getData('barFill');
            if (barFill && barFill.active) {
                const pct = Math.max(0, newHp / maxHp);
                barFill.width = Math.max(0, (container.getData('barW') || 40) * pct);
            }
        }

        // Flash enemy
        const gfx = container.getData('gfx');
        if (gfx && gfx.active) {
            gfx.setAlpha(0.5);
            this.time.delayedCall(80, () => {
                if (gfx && gfx.active) gfx.setAlpha(1);
            });
        }

        if (newHp <= 0) this.killEnemy(container);
    }

    killEnemy(container) {
        container.setData('alive', false);
        const xp = container.getData('xpValue');
        const gold = container.getData('goldValue');
        const isBoss = container.getData('isBoss');
        this.playerStats.xp += xp;
        this.playerStats.gold += gold;

        const ex = container.x;
        const ey = container.y;

        this.showDamageNumber(ex, ey - 50, `+${gold}G`, '#FFD700', 18);
        this.showDamageNumber(ex + 20, ey - 72, `+${xp}XP`, '#00ff88', 16);

        // Death explosion
        this.spawnExplosion(ex, ey, 0xff6600);

        // Gold orb
        const orb = this.add.circle(ex, ey - 20, 9, 0xFFD700);
        this.physics.add.existing(orb);
        orb.body.setVelocity(Phaser.Math.Between(-70, 70), -200);
        this.physics.add.collider(orb, this.platforms);
        this.time.delayedCall(350, () => {
            this.tweens.add({
                targets: orb, x: this.playerPhysics.x, y: this.playerPhysics.y - 20,
                duration: 350, ease: 'Cubic.In', onComplete: () => orb.destroy()
            });
        });

        // Level up heal
        const xpNeeded = this.playerStats.level * 100;
        if (this.playerStats.xp >= xpNeeded) {
            this.playerStats.xp -= xpNeeded;
            this.playerStats.level++;
            this.playerStats.maxHp += 15;
            this.playerStats.hp = this.playerStats.maxHp; // Fully heal on level up
            this.playerStats.attack += 4;
            this.playerStats.autoAttackSpeed = Math.max(250, this.playerStats.autoAttackSpeed - 25);
            this.showDamageNumber(this.playerPhysics.x, this.playerPhysics.y - 100, '⬆ LEVEL UP!', '#ffaa00', 24);
            this.cameras.main.flash(350, 255, 160, 0);
        }

        // Cleanup physRect
        const physRect = container.getData('physRect');
        if (physRect) physRect.destroy();

        // Cleanup boss UI
        if (isBoss) {
            const ui = this.scene.get('UIScene');
            if (ui && ui.showBossHP) ui.showBossHP(false);
        }

        // Shrink-out tween then destroy
        this.tweens.add({
            targets: container, scaleX: 0, scaleY: 0, alpha: 0, duration: 250,
            ease: 'Back.In', onComplete: () => container.destroy()
        });

        this.enemyList = this.enemyList.filter(x => x !== container);

        if (isBoss) {
            this.triggerStageComplete();
        } else {
            this.activeEnemies = Math.max(0, this.activeEnemies - 1);
            this.enemiesKilled++;

            if (this.spawnedEnemyCount >= this.totalEnemies && this.activeEnemies === 0) {
                this.time.delayedCall(600, () => this.spawnBoss());
            } else {
                this.time.delayedCall(400, () => this.spawnEnemiesIfNeeded());
            }
        }
    }

    triggerStageComplete() {
        if (this.stageComplete) return;
        this.stageComplete = true;
        this.playerPhysics.body.setVelocityX(0);
        this.cameras.main.flash(700, 255, 220, 0);

        this.showDamageNumber(this.playerPhysics.x, this.playerPhysics.y - 80, 'STAGE GESCHAFFT!', '#FFD700', 32);
        
        // Stage Reward: 1000 Gems
        this.playerStats.gems += 1000;
        this.playerStats.stage = this.currentStage + 1; // Prepare next stage for save
        SaveSystem.save(this.playerStats);

        this.time.delayedCall(300, () => {
            this.showDamageNumber(this.playerPhysics.x, this.playerPhysics.y - 130, '+1000 💎', '#00ffff', 28);
        });

        // Instant Progression after short visual beat
        this.time.delayedCall(1200, () => {
            this.scene.stop('UIScene');
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene', { 
                    stage: this.playerStats.stage, 
                    playerStats: this.playerStats 
                });
            });
        });
    }

    // ─── Floating Text ────────────────────────────────────────────────────────

    showDamageNumber(x, y, text, color, size = 18) {
        const t = this.add.text(x, y, String(text), {
            fontSize: `${size}px`, fill: color, fontFamily: 'Arial',
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({
            targets: t, y: y - 60, alpha: 0, duration: 1100,
            ease: 'Cubic.Out', onComplete: () => t.destroy()
        });
    }

    // ─── Update Loop ──────────────────────────────────────────────────────────

    update(time, delta) {
        if (this.gameOver || this.stageComplete) return;

        // Update scrolling background
        if (this.bg && this.isWalking) {
            // Increased speed factor for better "running" feel
            this.bg.tilePositionX += (this.playerStats.speed * delta / 1000) * 0.8;
        }

        // Ensure enemies continue to spawn
        this.spawnEnemiesIfNeeded();

        const px = this.playerPhysics.x;
        const py = this.playerPhysics.y;

        // Sync player container position with physics rect
        this.playerContainer.setPosition(px, py);

        // Find nearest alive enemy using physics positions
        let nearest = null;
        let nearestDist = 99999;
        this.enemyList.forEach(e => {
            if (!e.getData('alive') || !e.active) return;
            const pr = e.getData('physRect');
            if (pr && pr.active) {
                const d = Math.abs(px - pr.x);
                if (d < nearestDist) {
                    nearestDist = d;
                    nearest = e;
                }
            }
        });

        // Engagement distance - increased to prevent visual overlap
        const playerReach = (nearest && nearest.getData('isBoss')) ? 265 : 235;
        const enemyReach = (nearest && nearest.getData('isBoss')) ? 215 : 190;

        if (nearest && nearestDist < playerReach) {
            if (this.isWalking) {
                // Just entered range - guarantee first strike
                this.autoAttackTimer = 0;
            }
            this.isWalking = false;
            this.playerPhysics.body.setVelocityX(0);

            // Player Auto attack
            this.autoAttackTimer -= delta;
            if (this.autoAttackTimer <= 0) {
                const baseDmg = this.playerStats.attack + Phaser.Math.Between(-2, 5);
                this.dealDamage(nearest, baseDmg);
                this.autoAttackTimer = this.playerStats.autoAttackSpeed;

                // Weapon swing animation
                this.tweens.add({
                    targets: this.weaponGfx,
                    angle: { from: -30, to: 30 },
                    duration: 120, yoyo: true, ease: 'Sine.InOut'
                });
            }

            // Enemy attacks ONLY IF close enough
            if (nearest.getData('alive') && nearestDist < enemyReach) {
                let timer = nearest.getData('attackTimer') || 0;
                timer -= delta;
                if (timer <= 0) {
                    const dmg = Math.floor(nearest.getData('attack') || 1);
                    this.playerStats.hp = Math.floor(Math.max(0, this.playerStats.hp - dmg));
                    
                    if (isNaN(this.playerStats.hp)) this.playerStats.hp = 1;
                    
                    // Enemy lunge animation
                    this.tweens.add({
                        targets: nearest,
                        x: nearest.x - 30,
                        duration: 100,
                        yoyo: true,
                        ease: 'Back.Out'
                    });

                    this.cameras.main.shake(100, 0.004);
                    this.showDamageNumber(px, py - 40, `-${Math.floor(dmg)}`, '#ff3333', 20);

                    timer = nearest.getData('attackSpeed') || 1200;

                    if (this.playerStats.hp <= 0) {
                        this.triggerStageReset();
                    }
                }
                nearest.setData('attackTimer', timer);
            }
        } else {
            this.isWalking = true;
        }

        // Apply scrolling logic via velocities
        this.enemyList.forEach(e => {
            const pr = e.getData('physRect');
            if (pr && pr.active && e.getData('alive')) {
                const baseSpeed = e.getData('baseSpeed') || 75;
                const isBoss = e.getData('isBoss');
                const reach = isBoss ? 215 : 190;
                const dist = Math.abs(px - pr.x);

                // Stop enemy's own movement if in range, but still move with world if player is walking
                const enemySelfSpeed = (dist > reach) ? baseSpeed : 0;
                const targetVx = this.isWalking ? -(enemySelfSpeed + this.playerStats.speed) : -enemySelfSpeed;
                pr.body.setVelocityX(targetVx);
            }
        });

        if (this.isWalking) {
            const scrollSpeed = this.playerStats.speed * (delta / 1000);
            this.worldScroll += scrollSpeed;
            this.updateParallax(scrollSpeed);
        }

        // Sync enemy containers to their physRect
        this.enemyList.forEach(e => {
            if (!e.getData('alive') || !e.active) return;
            const pr = e.getData('physRect');
            if (pr && pr.active) {
                e.setPosition(pr.x, pr.y);
            }
        });

        // Update UI
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.updateStats) {
            uiScene.updateStats(this.playerStats, this.currentStage, this.enemiesKilled, this.totalEnemies);
        }
    }

    triggerStageReset() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.playerPhysics.body.setVelocityX(0);
        this.cameras.main.shake(600, 0.015);
        this.cameras.main.flash(500, 255, 0, 0);

        // Death particles
        this.spawnExplosion(this.playerPhysics.x, this.playerPhysics.y, 0xff0000);

        // Notify UI of death (optional, just for visual parity)
        this.showDamageNumber(this.playerPhysics.x, this.playerPhysics.y - 60, 'Stage Reset...', '#ffff00', 30);

        // Automatic Restart after short delay
        this.time.delayedCall(1200, () => {
            this.scene.stop('UIScene');
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // Keep XP, Level, Gold - stats are updated in updateStats call before
                this.scene.start('GameScene', {
                    stage: this.currentStage,
                    playerStats: this.playerStats
                });
            });
        });
    }
}