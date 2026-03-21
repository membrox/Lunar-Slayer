import { drawEnemyOnGraphics } from '../utils/DrawHelpers.js';
import { SaveSystem } from '../utils/SaveSystem.js';
import { EquipmentManager } from '../utils/EquipmentManager.js';

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
        if (!data) data = {};
        this.currentStage = Number(data.stage) || 1;
        
        const s = data.baseStats || SaveSystem.load();
        
        this.baseStats = {
            hp: Number(s.hp) || 120,
            maxHp: Number(s.maxHp) || 120,
            mana: Number(s.mana) || 100,
            maxMana: Number(s.maxMana) || 100,
            attack: Number(s.attack) || 15,
            defense: Number(s.defense) || 3,
            speed: Number(s.speed) || 200,
            gold: Math.floor(Number(s.gold) || 0),
            autoAttackSpeed: Number(s.autoAttackSpeed) || 800,
            selectedGender: s.selectedGender || 'male',
            damageLevel: Number(s.damageLevel) || 1,
            hpLevel: Number(s.hpLevel) || 1,
            hpRegenLevel: Number(s.hpRegenLevel) || 1,
            critLevel: Number(s.critLevel) || 1,
            critDamageLevel: Number(s.critDamageLevel) || 1,
            gems: Number(s.gems) || 0,
            emeralds: Number(s.emeralds) || 0,
            autoSkills: !!s.autoSkills,
            stage: Number(s.stage) || this.currentStage,
            maxStage: Number(s.maxStage) || Math.max(Number(s.stage) || 1, this.currentStage)
        };

        this.playerStats = JSON.parse(JSON.stringify(this.baseStats));
        this.equipment = new EquipmentManager();
        this.applyEquipmentStats(true);
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
        this.worldScroll = 0;
        this.isWalking = false;

        const s = this.currentStage;
        this.enemyHpScale = 1 + (s - 1) * 0.4;
        this.enemyAtkScale = 1 + (s - 1) * 0.3;

        this.groundY = 522;

        this.buildWorld();

        this.cameras.main.setBounds(0, 0, w * 10, h);
        this.cameras.main.setScroll(0, 0); 
        this.cameras.main.fadeIn(600, 0, 0, 0);

        this.time.addEvent({
            delay: 800, loop: true,
            callback: () => {
                if (this.playerStats.mana < this.playerStats.maxMana)
                    this.playerStats.mana = Math.min(this.playerStats.maxMana, this.playerStats.mana + 8);
            }
        });

        this.scene.launch('UIScene', {
            playerStats: this.playerStats,
            stage: this.currentStage,
            onSkill: (i) => this.castSkill(i)
        });

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

        this.spawnEnemiesIfNeeded();
    }

    buildWorld() {
        const w = this.scale.width;
        const h = this.scale.height;
        const gender = this.playerStats.selectedGender || 'male';
        const bgAsset = this.textures.get('game_bg') ? this.textures.get('game_bg').getSourceImage() : null;

        const battleH = 580;
        let visualScale = 1;
        if (bgAsset && bgAsset.height) {
            visualScale = battleH / bgAsset.height;
            this.bg = this.add.tileSprite(w / 2, 290, w / visualScale, bgAsset.height, 'game_bg').setScrollFactor(0);
        } else {
            this.bg = this.add.tileSprite(w / 2, 290, w, battleH, 'game_bg').setScrollFactor(0);
        }
        this.bg.setScale(visualScale).setAlpha(1);

        this.physics.world.gravity.y = 800;
        this.platforms = this.physics.add.staticGroup();
        const groundPhys = this.add.rectangle(w / 2, this.groundY + 20, w * 10, 40, 0x000000, 0); 
        this.physics.add.existing(groundPhys, true);
        this.platforms.add(groundPhys);

        this.parallaxLayers = [];

        const px = w / 2;
        const py = this.groundY - 34;

        this.playerContainer = this.add.container(px, py);
        
        // New Player Sprite logic
        const spriteKey = gender === 'female' ? 'player_sheet_female' : 'player_sheet_male';
        this.playerSprite = this.add.sprite(0, -26, spriteKey).setScale(0.85).setOrigin(0.5, 0.5);
        this.playerSprite.play(`${gender}_idle`);
        this.playerContainer.add(this.playerSprite);

        this.playerHpBar = this.add.graphics();
        this.playerContainer.add(this.playerHpBar);
        this.playerHpBar.setPosition(0, 45); 

        this.updateEquipmentVisuals();

        this.playerPhysics = this.add.rectangle(px, py, 36, 68, 0x000000, 0);
        this.physics.add.existing(this.playerPhysics);
        this.playerPhysics.body.setCollideWorldBounds(true);
        this.playerPhysics.body.setImmovable(true);
        this.playerPhysics.body.setAllowGravity(false);
        this.playerPhysics.y = this.groundY - 34;
        this.physics.add.collider(this.playerPhysics, this.platforms);

        this.playerContainer.setDepth(100);
        this.cameras.main.startFollow(this.playerPhysics, true, 0.1, 0, -200, 0); 

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
            // Ice burst wave ring + Ice Sprite
            const g = this.add.graphics();
            g.lineStyle(6, 0x88ddff, 1);
            g.strokeCircle(0, 0, 10);
            g.x = px; g.y = py;
            
            // Scaled Ice sprite in middle
            const iceSprite = this.add.sprite(px, py, 'skill_sheet', 0).setScale(0).setAlpha(0.8);
            
            this.tweens.add({
                targets: g, scaleX: range / 10, scaleY: range / 10, alpha: 0,
                duration: 600, ease: 'Cubic.Out',
                onComplete: () => g.destroy()
            });
            this.tweens.add({
                targets: iceSprite, scale: 2, alpha: 0,
                duration: 500, ease: 'Back.Out',
                onComplete: () => iceSprite.destroy()
            });
            // Hit immediately on cast
            this.enemyList.forEach(e => {
                if (!e || !e.active || !e.getData || !e.getData('alive')) return;
                const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
                if (d < range) { hitCallback(e); this.slowEnemy(e, 1200); }
            });
        } else if (name === 'lightning') {
            // Lightning bolt lines down from sky + Lightning Sprite
            const targets = this.enemyList.filter(e => e && e.active && e.getData && e.getData('alive'));
            targets.forEach(e => {
                const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
                if (d > range) return;
                hitCallback(e);
                
                const bolt = this.add.graphics();
                bolt.lineStyle(4, 0xFFFF00, 1);
                const ey = e.y - e.getData('size') / 2;
                
                // Lightning sprite at impact
                const lSprite = this.add.sprite(e.x, ey, 'skill_sheet', 1).setScale(1.5).setAlpha(1);
                this.tweens.add({ targets: lSprite, alpha: 0, scale: 2, duration: 250, onComplete: () => lSprite.destroy() });

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
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const heart = this.add.sprite(x, y, 'skill_sheet', 2).setScale(0.5);
            this.tweens.add({
                targets: heart,
                x: x + Math.cos(angle) * 80,
                y: y + Math.sin(angle) * 80,
                alpha: 0, scaleX: 0, scaleY: 0,
                duration: 800, ease: 'Cubic.Out',
                onComplete: () => heart.destroy()
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

        // Dynamic Critical hit logic
        const critRate = 0.05 + (this.playerStats.critLevel - 1) * 0.01; // Starts 5%, +1% per level
        const critMult = 1.5 + (this.playerStats.critDamageLevel - 1) * 0.1; // Starts 1.5x, +0.1x per level
        
        const isCrit = Math.random() < critRate;
        const finalDmg = Math.floor(isCrit ? dmg * critMult : dmg);

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
        const gold = container.getData('goldValue');
        const isBoss = container.getData('isBoss');
        this.playerStats.gold += gold;
        
        const ex = container.x;
        const ey = container.y;

        this.showDamageNumber(ex, ey - 50, `+${gold}G`, '#FFD700', 18);

        // Death explosion
        this.spawnExplosion(ex, ey, 0xff6600);

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
        this.baseStats.gems += 1000;
        this.baseStats.stage = this.currentStage + 1;
        this.baseStats.maxStage = Math.max(this.baseStats.maxStage || 1, this.baseStats.stage);
        this.baseStats.gold = Math.floor(this.playerStats.gold);
        
        // Base stats are saved (Clean)
        SaveSystem.save(this.baseStats);

        this.time.delayedCall(300, () => {
            this.showDamageNumber(this.playerPhysics.x, this.playerPhysics.y - 130, '+1000 💎', '#00ffff', 28);
        });

        // Instant Progression after short visual beat
        this.time.delayedCall(1200, () => {
            this.scene.stop('UIScene');
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene', { 
                    stage: this.baseStats.stage, 
                    baseStats: this.baseStats 
                });
            });
        });
    }

    jumpToStage(s) {
        if (this.stageComplete) return;
        this.baseStats.stage = s;
        this.baseStats.maxStage = Math.max(this.baseStats.maxStage || 1, s);
        this.baseStats.gold = Math.floor(this.playerStats.gold);
        
        SaveSystem.save(this.baseStats);

        this.scene.stop('UIScene');
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', { 
                stage: s, 
                baseStats: this.baseStats 
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
        if (this.gameOver) return;

        try {
            // HP Regen
            if (this.playerStats.hp < this.playerStats.maxHp) {
                const regen = (this.playerStats.hpRegen || 0) * (delta / 1000);
                this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + regen);
            }

            // Stage completion check
            if (this.enemiesKilled >= this.totalEnemies && !this.bossSpawned) {
                this.spawnBoss();
            }

            const px = this.playerPhysics.x;
            const py = this.playerPhysics.y;

            // Simple "AI" - find nearest alive enemy
            const aliveEnemies = this.enemyList.filter(e => e.getData('alive'));
            let nearest = null;
            let nearestDist = 9999;

            aliveEnemies.forEach(e => {
                const dist = Math.abs(e.x - px);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = e;
                }
            });

            const playerReach = 180;
            const enemyReach = 150;

            if (nearest && nearestDist < playerReach) {
                // Stop to fight
                if (this.isWalking) {
                    this.isWalking = false;
                    if (this.playerPhysics.body) this.playerPhysics.body.setVelocityX(0);
                    if (this.playerSprite && this.playerSprite.active) {
                        this.playerSprite.play(`${this.playerStats.selectedGender}_idle`, true);
                    }
                }

                // Player Auto attack
                this.autoAttackTimer -= delta;
                if (this.autoAttackTimer <= 0) {
                    const baseDmg = this.playerStats.attack + Phaser.Math.Between(-2, 5);
                    this.dealDamage(nearest, baseDmg);
                    this.autoAttackTimer = this.playerStats.autoAttackSpeed;
                }

                // Enemy attacks
                if (nearest.getData('alive') && nearestDist < enemyReach) {
                    let timer = nearest.getData('attackTimer') || 0;
                    timer -= delta;
                    if (timer <= 0) {
                        const dmg = Math.floor(nearest.getData('attack') || 1);
                        this.playerStats.hp = Math.floor(Math.max(0, this.playerStats.hp - dmg));
                        if (isNaN(this.playerStats.hp)) this.playerStats.hp = 1;
                        
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
                // Nothing in reach, walk forward
                if (!this.isWalking) {
                    this.isWalking = true;
                    if (this.playerSprite && this.playerSprite.active) {
                        this.playerSprite.play(`${this.playerStats.selectedGender}_run`, true);
                    }
                }
                if (this.playerPhysics.body) {
                    this.playerPhysics.body.setVelocityX(this.playerStats.speed);
                }
            }

            // Sync parallax/scrolling
            if (this.isWalking && this.bg) {
                this.bg.tilePositionX += (this.playerStats.speed * delta / 1000) * 0.8;
            }

            // Sync enemy containers to physics
            this.enemyList.forEach(e => {
                if (!e || !e.getData || !e.getData('alive')) return;
                const pr = e.getData('physRect');
                if (pr && pr.active) {
                    e.setPosition(pr.x, pr.y);
                    const baseSpeed = e.getData('baseSpeed') || 75;
                    const reach = e.getData('isBoss') ? 215 : 190;
                    const dist = Math.abs(px - pr.x);
                    const enemySelfSpeed = (dist > reach) ? baseSpeed : 0;
                    const targetVx = this.isWalking ? -(enemySelfSpeed + this.playerStats.speed) : -enemySelfSpeed;
                    if (pr.body) pr.body.setVelocityX(targetVx);
                }
            });

            // Sync player container to physics
            this.playerContainer.setPosition(this.playerPhysics.x, this.playerPhysics.y);

            // Update UI
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.scene.isActive()) {
                uiScene.updateStats(this.playerStats, this.currentStage, this.enemiesKilled, this.totalEnemies);
            }

            // Update Player Mini HP Bar
            if (this.playerHpBar) {
                const barW = 60;
                const ratio = Math.max(0, this.playerStats.hp / this.playerStats.maxHp);
                this.playerHpBar.clear();
                this.playerHpBar.fillStyle(0x000000, 0.5);
                this.playerHpBar.fillRect(-barW / 2, 0, barW, 6);
                this.playerHpBar.fillStyle(0x00ff00, 1);
                this.playerHpBar.fillRect(-barW / 2, 0, barW * ratio, 6);
            }

        } catch (err) {
            console.error('Update Loop Error:', err);
        }
    }

    triggerStageReset() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.isWalking = false;
        if (this.playerPhysics.body) this.playerPhysics.body.setVelocityX(0);

        // Play Death Animation
        if (this.playerSprite && this.playerSprite.active) {
            this.playerSprite.play(`${this.playerStats.selectedGender}_death`, true);
        }

        this.cameras.main.shake(600, 0.015);
        this.cameras.main.flash(500, 255, 0, 0);

        this.time.delayedCall(1500, () => {
            this.scene.stop('UIScene');
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene', {
                    stage: this.currentStage,
                    baseStats: this.baseStats
                });
            });
        });
    }

    buyBaseUpgrade(id, increment) {
        if (!this.baseStats) return;
        
        if (id === 'damage') {
            this.baseStats.attack += increment;
            this.baseStats.damageLevel = (this.baseStats.damageLevel || 1) + 1;
        } else if (id === 'hp') {
            this.baseStats.maxHp += increment;
            this.baseStats.hp += increment;
            this.baseStats.hpLevel = (this.baseStats.hpLevel || 1) + 1;
        } else if (id === 'hpRegen') {
            this.baseStats.hpRegen = (this.baseStats.hpRegen || 0) + increment;
            this.baseStats.hpRegenLevel = (this.baseStats.hpRegenLevel || 1) + 1;
        } else if (id === 'crit') {
            this.baseStats.crit = (this.baseStats.crit || 0.05) + increment;
            this.baseStats.critLevel = (this.baseStats.critLevel || 1) + 1;
        } else if (id === 'critDamage') {
            this.baseStats.critDamageLevel = (this.baseStats.critDamageLevel || 1) + 1;
        }

        // Increment gold is usually handled in UIScene, but we sync it here
        this.baseStats.gold = this.playerStats.gold;

        // Always apply equipment on top of NEW base
        this.applyEquipmentStats();
        
        // Save base stats
        SaveSystem.save(this.baseStats);
    }

    applyEquipmentStats(isInitial = false) {
        if (!this.equipment || !this.baseStats) return;
        
        const bonuses = this.equipment.getAllBonuses();
        const flat = bonuses.flat;
        const mult = bonuses.mult;
        
        // Calculate new playerStats: (Base + Flat) * Multiplier
        this.playerStats.attack = (this.baseStats.attack + (flat.attack || 0)) * (mult.attack || 1);
        this.playerStats.maxHp = (this.baseStats.maxHp + (flat.hp || 0)) * (mult.hp || 1);
        this.playerStats.maxMana = (this.baseStats.maxMana + (flat.mana || 0)) * (mult.mana || 1);
        this.playerStats.defense = (this.baseStats.defense + (flat.defense || 0)) * (mult.defense || 1);
        
        // Crit and HP Regen are often additive in these games
        this.playerStats.hpRegen = (this.baseStats.hpRegen || 0) + (flat.hpRegen || 0) + (mult.hpRegen || 0);
        this.playerStats.crit = (this.baseStats.crit || 0.05) + (flat.crit || 0) + (mult.crit || 0);
        
        // Clamp current hp/mana
        if (isInitial) {
            this.playerStats.hp = this.playerStats.maxHp;
            this.playerStats.mana = this.playerStats.maxMana;
        } else {
            this.playerStats.hp = Math.min(this.playerStats.hp, this.playerStats.maxHp);
            this.playerStats.mana = Math.min(this.playerStats.mana, this.playerStats.maxMana);
        }
        
        // Sync meta-stats
        this.playerStats.damageLevel = this.baseStats.damageLevel;
        this.playerStats.hpLevel = this.baseStats.hpLevel;
        this.playerStats.hpRegenLevel = this.baseStats.hpRegenLevel;
        this.playerStats.critLevel = this.baseStats.critLevel;
        this.playerStats.critDamageLevel = this.baseStats.critDamageLevel;
        this.playerStats.gold = this.baseStats.gold;
        
        this.updateEquipmentVisuals();
        
        // Refresh UI
        const ui = this.scene.get('UIScene');
        if (ui && ui.updateStats) {
            ui.updateStats(this.playerStats, this.currentStage, this.enemiesKilled, this.totalEnemies);
        }
    }

    updateEquipmentVisuals() {
        if (!this.equipment || !this.playerContainer) return;
        const eq = this.equipment.equipped;
        if (eq.weapon) {
            if (!this.weaponSpriteLayer) {
                this.weaponSpriteLayer = this.add.text(30, -50, eq.weapon.icon, { fontSize: '32px' }).setOrigin(0.5);
                this.playerContainer.add(this.weaponSpriteLayer);
            }
            this.weaponSpriteLayer.setText(eq.weapon.icon).setVisible(true);
            if (this.weaponGfx) this.weaponGfx.setVisible(false);
        } else if (this.weaponGfx) {
            if (this.weaponSpriteLayer) this.weaponSpriteLayer.setVisible(false);
            this.weaponGfx.setVisible(true);
        }
    }
}