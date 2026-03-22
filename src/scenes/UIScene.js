import { SaveSystem } from '../utils/SaveSystem.js';
import { EquipmentManager, RARITIES } from '../utils/EquipmentManager.js';
import { SummonManager, SUMMON_CONFIG } from '../utils/SummonManager.js';
import { showEquipmentMenu, showItemTooltip, hideItemTooltip, syncGameSceneStats } from '../ui/EquipmentMenu.js';
import { showSummonMenu } from '../ui/SummonMenu.js';
import { UPGRADE_DEFS, createUpgradeRow, buyUpgrade } from '../ui/UpgradePanel.js';
import { showStageSelector } from '../ui/StageSelector.js';

const UI_ROW_START_Y = 732;
const UI_ROW_GAP = 98.5;

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create(data) {
        const w = this.scale.width;
        const h = this.scale.height;

        this.stats = data.playerStats;
        this.onSkill = data.onSkill;
        this.isAutoSkills = this.stats.autoSkills || false;
        this.globalCooldown = 0;
        this.skillCooldowns = [0, 0, 0, 0, 0, 0];
        this.skillMaxCooldowns = [5000, 5000, 5000, 5000, 5000, 5000];
        this.baseCosts = { damage: 3, hp: 3, hpRegen: 9, crit: 150 };
        this.upgradeUI = {};
        this.skillBars = [];
        this.skillButtons = [];
        this.equipment = new EquipmentManager();
        this.summonManager = new SummonManager();
        this.isEquipmentOpen = false;
        this.isSummonOpen = false;
        this.placementElements = {};

        // Debug text
        this.debugText = this.add.text(w / 2, 85, '', { fontSize: '10px', fill: '#00ff00' }).setOrigin(0.5).setAlpha(0);
        const classIndex = this.stats.classIndex ?? 0;

        // ── Top Bar (Currencies) ──────────────────────────────────────────────
        this.hudContainer = this.add.container(w / 2, 50);

        const bannerH = 100;
        this.hudBanner = this.add.image(0, 0, 'hud_banner').setOrigin(0.5).setDisplaySize(Math.min(w * 0.95, 1000), bannerH);

        // Gold
        this.goldText = this.add.text(2, 14, `${Math.floor(this.stats.gold)}`, {
            fontSize: '18px', fill: '#FFD700', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(1, 0.5);

        // Gems
        this.gemsText = this.add.text(149, 13, `${this.stats.gems || 0}`, {
            fontSize: '18px', fill: '#00ffff', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(1, 0.5);

        // Emeralds
        this.emeraldsText = this.add.text(285, 14, `${this.stats.emeralds || 0}`, {
            fontSize: '18px', fill: '#00ff00', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(1, 0.5);

        this.hudContainer.add([this.hudBanner, this.goldText, this.gemsText, this.emeraldsText]);
        
        // Register HUD elements in placement system
        this.placementElements['goldText'] = {
            obj: this.goldText,
            containerWorldX: w / 2, containerWorldY: 50,
            type: 'hud'
        };
        this.placementElements['gemsText'] = {
            obj: this.gemsText,
            containerWorldX: w / 2, containerWorldY: 50,
            type: 'hud'
        };
        this.placementElements['emeraldsText'] = {
            obj: this.emeraldsText,
            containerWorldX: w / 2, containerWorldY: 50,
            type: 'hud'
        };

        // ── Stage Header ──────────────────────────────────────────────────────
        const headerY = 180;
        this.headerContainer = this.add.container(w / 2, headerY);

        const stageHeader = this.add.image(0, 0, 'stage_header').setOrigin(0.5);
        const headerScale = 320 / stageHeader.width;
        stageHeader.setScale(headerScale);

        // Interactive Arrow Areas (Invisible)
        const leftArrow = this.add.rectangle(-358 * headerScale, 20 * headerScale, 70, 70, 0x000000, 0.01).setInteractive();
        const rightArrow = this.add.rectangle(358 * headerScale, 20 * headerScale, 70, 70, 0x000000, 0.01).setInteractive();

        this.stageText = this.add.text(0, -84 * headerScale, `STAGE ${data.stage || 1}`, {
            fontSize: '18px', fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setInteractive();

        this.stageText.on('pointerdown', () => showStageSelector(this));
        leftArrow.on('pointerdown', () => showStageSelector(this));
        rightArrow.on('pointerdown', () => showStageSelector(this));

        // Boss Progress Bar
        const barWidth = 830 * headerScale; 
        const barHeight = 44 * headerScale;
        const barY = 101 * headerScale;
        const barX = -442 * headerScale;

        const barBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x330000, 0.5).setOrigin(0, 0.5);
        this.bossProgressBar = this.add.rectangle(barX, barY, 0, barHeight, 0xaa0000).setOrigin(0, 0.5);
        this.maxBarWidth = barWidth;

        this.headerContainer.add([stageHeader, leftArrow, rightArrow, this.stageText, barBg, this.bossProgressBar]);

        // ── Unified UI Dashboard ───────────────────────────────────────────────
        const dashboardY = 878;
        this.dashboardY = dashboardY;
        this.dashboardContainer = this.add.container(w / 2, dashboardY);

        const mainDash = this.add.image(0, 0, 'main_dashboard').setOrigin(0.5).setDisplaySize(w, 640);

        const hudBottom = this.add.image(0, 361, 'hud_bottom')
            .setOrigin(0.5)
            .setScale(w / 1376)
            .setDepth(-1);

        this.dashboardContainer.add([mainDash, hudBottom]);

        // ── Top Bar (Skills & Auto) ──────────────────────────────────────────
        const relSkillY = -256;
        const autoX = -w / 2 + (w / 7 * 0.5);

        this.autoToggleBtn = this.add.circle(autoX, relSkillY, 35, 0x442200, 0.01).setInteractive();

        const autoIconGfx = this.add.graphics();
        autoIconGfx.lineStyle(4, 0xffffff);
        autoIconGfx.arc(0, 0, 18, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(310));
        autoIconGfx.strokePath();
        autoIconGfx.fillStyle(0xffffff);
        const arrowAngle = Phaser.Math.DegToRad(310);
        const arrowX = Math.cos(arrowAngle) * 18;
        const arrowY = Math.sin(arrowAngle) * 18;
        autoIconGfx.fillTriangle(
            arrowX, arrowY,
            arrowX - 10, arrowY + 2,
            arrowX - 3, arrowY + 10
        );
        autoIconGfx.setPosition(autoX, relSkillY);

        this.dashboardContainer.add([this.autoToggleBtn, autoIconGfx]);

        this.placementElements['skill_auto'] = {
            objs: [this.autoToggleBtn, autoIconGfx],
            containerWorldX: w / 2, containerWorldY: dashboardY
        };

        // ── 6 Skills ─────────────────────────────────────────────────────────
        const skillData = [
            { name: 'Feuer', icon: '🔥', color: 0xcc3300 },
            { name: 'Frost', sprite: 'skill_sheet', frame: 0, color: 0x004488 },
            { name: 'Blitz', sprite: 'skill_sheet', frame: 1, color: 0xaaaa00 },
            { name: 'Heilen', sprite: 'skill_sheet', frame: 2, color: 0x006633 },
            { name: 'Sterne', icon: '✨', color: 0x6600cc },
            { name: 'Schild', icon: '🛡️', color: 0x333333 }
        ];

        const sW = 84;
        const skillStartX = -w / 2 + (w / 7 * 1.5);
        const skillGap = w / 7;

        skillData.forEach((sk, i) => {
            const bx = skillStartX + i * skillGap;
            const by = relSkillY;
            const bg = this.add.rectangle(bx, by, sW, sW, 0x111122, 0.01).setOrigin(0.5).setInteractive();

            this.dashboardContainer.add(bg);

            let skillVisual;
            if (sk.sprite) {
                const sprite = this.add.sprite(bx, by, sk.sprite, sk.frame).setOrigin(0.5);
                const targetSize = sW - 30;
                sprite.setDisplaySize(targetSize, targetSize);
                this.dashboardContainer.add(sprite);
                skillVisual = sprite;
            } else {
                const txt = this.add.text(bx, by, sk.icon, { fontSize: '28px' }).setOrigin(0.5);
                this.dashboardContainer.add(txt);
                skillVisual = txt;
            }

            // CD Overlay
            const cdOverlay = this.add.rectangle(bx, by + sW / 2, sW - 4, 0, 0x000000, 0.8).setOrigin(0.5, 1);
            const cdText = this.add.text(bx, by, '', { fontSize: '22px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setAlpha(0);

            this.dashboardContainer.add([cdOverlay, cdText]);
            this.skillBars.push({ overlay: cdOverlay, text: cdText });
            this.skillButtons.push(bg);
            bg.on('pointerdown', () => this.triggerSkill(i));

            this.placementElements[`skill_${i}_${sk.name}`] = {
                objs: [bg, skillVisual, cdOverlay, cdText],
                containerWorldX: w / 2, containerWorldY: dashboardY,
                cdOverlayYOffset: sW / 2
            };
        });

        // Apply initial visual state if AUTO is active
        if (this.isAutoSkills) {
            this.updateAutoButton();
        }

        this.autoToggleBtn.on('pointerdown', () => {
            this.isAutoSkills = !this.isAutoSkills;
            this.stats.autoSkills = this.isAutoSkills;
            this.updateAutoButton();
        });

        // Periodic Auto-Save
        this.time.addEvent({
            delay: 10000, loop: true,
            callback: () => { this.saveBaseStats(); }
        });

        // ── Upgrade Rows ────────────────────────────────────────
        this.upgrades = UPGRADE_DEFS;

        this.upgrades.forEach((upg, i) => {
            const relY = (UI_ROW_START_Y + i * UI_ROW_GAP) - dashboardY;
            createUpgradeRow(this, upg, 0, relY);
        });

        // ── Bottom Nav ────────────────────────────────────────────────────────
        const relNavY = 342;
        const navItems = [
            { name: 'Equipment', icon: '⚔️' },
            { name: 'Costume', icon: '🐕' },
            { name: 'Skill', icon: '📖' },
            { name: 'Summon', icon: '✨' },
            { name: 'Adventure', icon: '🧭' },
            { name: 'Shop', icon: '💎' }
        ];

        navItems.forEach((item, i) => {
            const ix = (w / (navItems.length + 1)) * (i + 1);
            const relX = ix - w / 2;
            const btn = this.add.container(relX, relNavY);
            this.dashboardContainer.add(btn);

            const nbg = this.add.rectangle(0, 0, 80, 100, 0x000000, 0.01).setInteractive();
            const icon = this.add.text(0, -10, item.icon, { fontSize: '28px' }).setOrigin(0.5);
            const label = this.add.text(0, 25, item.name, { fontSize: '10px', fill: '#ffffff' }).setOrigin(0.5);

            btn.add([nbg, icon, label]);

            nbg.on('pointerdown', () => {
                if (item.name === 'Equipment') {
                    this.showEquipmentMenu();
                } else if (item.name === 'Summon') {
                    this.showSummonMenu();
                } else if (item.name === 'Shop') {
                    this.scene.stop('GameScene');
                    this.scene.start('ShopScene', { stage: this.stats.stage, playerStats: this.stats });
                }
            });

            if (i === 2) icon.setTint(0xffaa00);

            this.placementElements[`nav_icon_${i}_${item.name}`] = {
                obj: icon, btnContainer: btn,
                containerWorldX: w / 2, containerWorldY: dashboardY,
                btnRelX: relX, btnRelY: relNavY,
                innerDefaultX: 0, innerDefaultY: -10,
                type: 'nav'
            };
            this.placementElements[`nav_label_${i}_${item.name}`] = {
                obj: label, btnContainer: btn,
                containerWorldX: w / 2, containerWorldY: dashboardY,
                btnRelX: relX, btnRelY: relNavY,
                innerDefaultX: 0, innerDefaultY: 25,
                type: 'nav'
            };
        });

        // ── Apply saved placement config from testbed ─────────────────────────
        this.loadPlacementConfig();

        // Initial update
        if (this.stats) {
            this.updateStats(this.stats, data.stage, 0, 20);
        }
    }

    // ── Delegated methods ─────────────────────────────────────────────────────

    showEquipmentMenu() { showEquipmentMenu(this); }
    showSummonMenu() { showSummonMenu(this); }
    showStageSelector() { showStageSelector(this); }

    // ── Core methods (kept in UIScene) ────────────────────────────────────────

    triggerSkill(index) {
        if (this.globalCooldown > 0) return;
        if (this.skillCooldowns[index] > 0) return;

        let success = false;
        if (this.onSkill) {
            success = this.onSkill(index);
        }

        if (success !== false) {
            this.skillCooldowns[index] = this.skillMaxCooldowns[index];
            this.globalCooldown = 1000;
        }
    }

    showBossHP(visible) {
        if (!visible) {
            this.bossProgressBar.width = 0;
        }
    }

    updateBossStatus(hp, maxHp) {
        if (!this.bossProgressBar) return;
        const pct = Math.max(0, hp / maxHp);
        this.bossProgressBar.width = this.maxBarWidth * pct;
    }

    updateAutoButton() {
        if (!this.autoToggleBtn) return;
        if (this.isAutoSkills) {
            this.autoToggleBtn.setStrokeStyle(4, 0x00ffff, 1);
            this.autoToggleBtn.setFillStyle(0x00ffff, 0.3);
        } else {
            this.autoToggleBtn.setStrokeStyle(2, 0xcc8800, 0.5);
            this.autoToggleBtn.setFillStyle(0x442200, 0.01);
        }
    }

    updateStats(stats, stage, killed, total) {
        if (!stats) return;
        this.stats = stats;

        if (this.goldText && this.goldText.active) this.goldText.setText(`${Math.floor(Number(stats.gold) || 0)}`);
        if (this.gemsText && this.gemsText.active) this.gemsText.setText(`${Number(stats.gems) || 0}`);
        if (this.emeraldsText && this.emeraldsText.active) this.emeraldsText.setText(`${Number(stats.emeralds) || 0}`);

        const hp = Number(stats.hp) || 0;
        const maxHp = Number(stats.maxHp) || 100;
        const hpPct = Math.max(0, Math.min(1, hp / maxHp));
        if (this.hpBarFill && this.hpBarFill.active) this.hpBarFill.width = 160 * hpPct;
        if (this.hpText && this.hpText.active) this.hpText.setText(`HP: ${Math.floor(hp)}/${Math.floor(maxHp)}`);

        if (stage !== undefined && this.stageText && this.stageText.active) {
            this.stageText.setText(`STAGE ${stage}`);
        }

        if (killed !== undefined && total !== undefined && this.bossProgressBar && this.bossProgressBar.active) {
            const pct = Math.max(0, Math.min(1, killed / total));
            this.bossProgressBar.width = this.maxBarWidth * pct;
        }

        // Upgrades
        if (this.upgrades && this.upgradeUI) {
            this.upgrades.forEach((upg, i) => {
                const ui = this.upgradeUI[upg.id];
                if (!ui || !ui.title || !ui.title.active) return;
                const upgLevel = Number(stats[upg.id + 'Level']) || 1;
                const cost = Math.floor(upg.baseCost * Math.pow(upg.scale, upgLevel - 1));
                const suffix = upg.suffix || '';

                ui.title.setText(`${upg.name} Lv.${upgLevel}`);

                let currentVal = upg.id === 'damage' ? Number(stats.attack) : (upg.id === 'hp' ? Number(stats.maxHp) : (Number(stats[upg.id]) || 0));

                if (upg.id === 'critDamage') {
                    const upgLevel = Number(stats.critDamageLevel) || 1;
                    currentVal = 1.5 + (upgLevel - 1) * 0.1;
                } else if (upg.id === 'crit') {
                    const upgLevel = Number(stats.critLevel) || 1;
                    currentVal = 5.0 + (upgLevel - 1) * 1.0;
                }

                let nextVal = currentVal + upg.increment;
                if (ui.valText && ui.valText.active) ui.valText.setText(`${currentVal.toFixed(1)}${suffix} -> ${nextVal.toFixed(1)}${suffix}`);

                if (ui.costText && ui.costText.active) {
                    ui.costText.setText(`${cost}`);
                    ui.costText.setFill(Number(stats.gold) < cost ? '#ff4444' : '#FFD700');
                }
            });
        }
    }

    update(time, delta) {
        try {
            if (this.globalCooldown > 0) {
                this.globalCooldown = Math.max(0, this.globalCooldown - delta);
            }

            const game = this.scene.get('GameScene');
            if (!game || !game.scene.isActive()) return;

            const w = this.scale.width;

            // Auto Skill Trigger Logic
            let hasEnemy = false;
            const px = (game.playerPhysics && game.playerPhysics.active) ? game.playerPhysics.x : w / 2;

            const boss = game.boss;
            const enemyList = game.enemyList || [];

            const bossAlive = boss && boss.active && boss.getData && boss.getData('alive') && (boss.x - px) > -50 && (boss.x - px) < 550;
            const listAlive = enemyList.some(e => e && e.active && e.getData && e.getData('alive') && (e.x - px) > -50 && (e.x - px) < 550);
            hasEnemy = !!(bossAlive || listAlive);

            for (let i = 0; i < 6; i++) {
                if (this.skillCooldowns[i] > 0) {
                    this.skillCooldowns[i] = Math.max(0, this.skillCooldowns[i] - delta);
                }

                const bar = this.skillBars[i];
                if (!bar) continue;

                const cd = this.skillCooldowns[i];
                if (cd > 0) {
                    if (bar.overlay && bar.overlay.active) bar.overlay.height = 60 * (cd / (this.skillMaxCooldowns[i] || 5000));
                    if (bar.text && bar.text.active) bar.text.setText((cd / 1000).toFixed(1)).setAlpha(1);
                } else {
                    if (bar.overlay && bar.overlay.active) bar.overlay.height = 0;
                    if (bar.text && bar.text.active) bar.text.setAlpha(0);

                    if (this.isAutoSkills && hasEnemy && this.globalCooldown <= 0) {
                        if (i !== 3) {
                            this.triggerSkill(i);
                        } else if (i === 3 && this.stats && this.stats.hp < (this.stats.maxHp || 100) * 0.5) {
                            this.triggerSkill(i);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('UIScene Update Error:', err);
        }
    }

    saveBaseStats() {
        if (!this.stats) return;
        const game = this.scene.get('GameScene');
        if (game && game.baseStats) {
            game.baseStats.gold = Math.floor(this.stats.gold);
            game.baseStats.gems = this.stats.gems;
            game.baseStats.emeralds = this.stats.emeralds;
            game.baseStats.stage = game.currentStage;
            SaveSystem.save(game.baseStats);
        }
    }

    /**
     * Load placement config from localStorage (saved by UIPlacementTestScene)
     * and apply positions/scales to matching elements.
     */
    loadPlacementConfig() {
        const raw = localStorage.getItem('ui_placement_config');
        if (!raw) return;

        try {
            const data = JSON.parse(raw);
            const w = this.scale.width;
            const dashboardY = this.dashboardY;

            Object.keys(data).forEach(id => {
                const saved = data[id];
                const el = this.placementElements[id];
                if (!el) return;

                if (el.type === 'nav') {
                    const innerX = saved.x - el.containerWorldX - el.btnRelX;
                    const innerY = saved.y - el.containerWorldY - el.btnRelY;
                    el.obj.setPosition(innerX, innerY);
                    if (saved.scaleX !== undefined) el.obj.setScale(saved.scaleX, saved.scaleY);
                } else if (el.type === 'hud') {
                    const innerX = saved.x - el.containerWorldX;
                    const innerY = saved.y - el.containerWorldY;
                    el.obj.setPosition(innerX, innerY);
                    if (saved.scaleX !== undefined) el.obj.setScale(saved.scaleX, saved.scaleY);
                } else if (el.type === 'upgrade') {
                    const innerX = saved.x - el.containerWorldX - el.rowRelX;
                    const innerY = saved.y - el.containerWorldY - el.rowRelY;
                    el.obj.setPosition(innerX, innerY);
                    if (saved.scaleX !== undefined) el.obj.setScale(saved.scaleX, saved.scaleY);
                } else if (el.objs) {
                    const relX = saved.x - el.containerWorldX;
                    const relY = saved.y - el.containerWorldY;
                    el.objs.forEach(obj => {
                        if (obj && obj.setPosition) {
                            obj.setPosition(relX, relY);
                        }
                    });
                    if (el.cdOverlayYOffset !== undefined && el.objs.length >= 3) {
                        const cdOverlay = el.objs[2];
                        if (cdOverlay && cdOverlay.setPosition) {
                            cdOverlay.setPosition(relX, relY + el.cdOverlayYOffset);
                        }
                    }
                    if (saved.scaleX !== undefined && el.objs[1]) {
                        el.objs[1].setScale(saved.scaleX, saved.scaleY);
                    }
                }
            });

            console.log('UIScene: Applied placement config from testbed');
        } catch (e) {
            console.error('UIScene: Failed to load placement config:', e);
        }
    }
}