import { SaveSystem } from '../utils/SaveSystem.js';
import { EquipmentManager } from '../utils/EquipmentManager.js';
import { spawnEnemiesIfNeeded, spawnBoss } from '../game/EnemyManager.js';
import { castSkill, dealDamage, showDamageNumber } from '../game/CombatManager.js';
import { triggerStageComplete, jumpToStage, triggerStageReset, buyBaseUpgrade, applyEquipmentStats } from '../game/StageManager.js';
import { drawEnemyOnGraphics } from '../utils/DrawHelpers.js';

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
        applyEquipmentStats(this, true);
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

        spawnEnemiesIfNeeded(this);
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
        
        const spriteKey = 'player_sheet';
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

    // ── Delegated methods ─────────────────────────────────────────────────────

    castSkill(i) { return castSkill(this, i); }
    jumpToStage(s) { jumpToStage(this, s); }
    triggerStageReset() { triggerStageReset(this); }
    buyBaseUpgrade(id, increment) { buyBaseUpgrade(this, id, increment); }
    applyEquipmentStats(isInitial = false) { applyEquipmentStats(this, isInitial); }

    // ── Update Loop ──────────────────────────────────────────────────────────

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
                spawnBoss(this);
            }

            const px = this.playerPhysics.x;
            const py = this.playerPhysics.y;

            // Find nearest alive enemy
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
                    dealDamage(this, nearest, baseDmg);
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
                        showDamageNumber(this, px, py - 40, `-${Math.floor(dmg)}`, '#ff3333', 20);
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