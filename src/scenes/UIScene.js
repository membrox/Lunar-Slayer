import { SaveSystem } from '../utils/SaveSystem.js';
import { EquipmentManager, RARITIES } from '../utils/EquipmentManager.js';
import { SummonManager, SUMMON_CONFIG } from '../utils/SummonManager.js';

const UI_ROW_START_Y = 732;
const UI_ROW_GAP = 81;

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

        // Debug text
        this.debugText = this.add.text(w / 2, 85, '', { fontSize: '10px', fill: '#00ff00' }).setOrigin(0.5).setAlpha(0);
        const classIndex = this.stats.classIndex ?? 0;

        // ── Top Bar (Currencies) ──────────────────────────────────────────────
        const bannerH = 100;
        this.hudBanner = this.add.image(w / 2, 50, 'hud_banner').setOrigin(0.5).setDisplaySize(Math.min(w * 0.95, 1000), bannerH);
        
        // Currencies - Positioned to align with icons in the 'Banner oben2.png' asset
        // Estimated offsets based on the 1000px banner width
        const bx = w / 2;
        const by = 50;
        
        // Gold
        this.goldText = this.add.text(bx - 36, by + 13, `${Math.floor(this.stats.gold)}`, {
            fontSize: '18px', fill: '#FFD700', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0, 0.5);
        
        // Gems
        this.gemsText = this.add.text(bx + 109, by + 13, `${this.stats.gems || 0}`, {
            fontSize: '18px', fill: '#00ffff', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0, 0.5);

        // Emeralds
        this.emeraldsText = this.add.text(bx + 252, by + 13, `${this.stats.emeralds || 0}`, {
            fontSize: '18px', fill: '#00ff00', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0, 0.5);

        // ── Stage Header ──────────────────────────────────────────────────────
        const headerY = 140;
        // Stage Header Background (Procedural)
        const headerGfx = this.add.graphics();
        headerGfx.fillStyle(0x1a1a2e, 0.6);
        headerGfx.fillRoundedRect(w / 2 - 150, headerY - 30, 300, 80, 10);
        headerGfx.lineStyle(2, 0x444466);
        headerGfx.strokeRoundedRect(w / 2 - 150, headerY - 30, 300, 80, 10);
        
        // Stage Arrows
        const leftArrow = this.add.text(w / 2 - 130, headerY, '◀', { fontSize: '24px', fill: '#FFD700' }).setOrigin(0.5).setInteractive();
        const rightArrow = this.add.text(w / 2 + 130, headerY, '▶', { fontSize: '24px', fill: '#FFD700' }).setOrigin(0.5).setInteractive();

        this.stageText = this.add.text(w / 2, headerY - 5, `STAGE ${data.stage || 1}`, {
            fontSize: '22px', fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        this.stageText.on('pointerdown', () => this.showStageSelector());
        leftArrow.on('pointerdown', () => this.showStageSelector());
        rightArrow.on('pointerdown', () => this.showStageSelector());

        // Boss Progress Bar
        this.add.rectangle(w / 2, headerY + 30, 300, 10, 0x330000).setOrigin(0.5);
        this.bossProgressBar = this.add.rectangle(w / 2 - 150, headerY + 30, 0, 10, 0xaa0000).setOrigin(0, 0.5);
        this.add.text(w / 2 + 170, headerY + 30, '👹', { fontSize: '20px' }).setOrigin(0.5);

        // ── Unified UI Dashboard (Rahmen5reihen) ───────────────────────────────────
        const dashboardY = 878; 
        this.add.image(w / 2, dashboardY, 'main_dashboard').setOrigin(0.5).setDisplaySize(w, 640);
        
        // Bottom Banner - Centered in the 1198-1280 gap
        this.add.image(w / 2, 1239, 'hud_bottom')
            .setOrigin(0.5)
            .setScale(w / 1376) 
            .setDepth(-1);

        // ── Top Bar (Skills & Auto) ──────────────────────────────────────────
        const skillY = 622; // Slightly lowered for better visual centering
        const autoX = w / 7 * 0.5;
        const autoY = skillY;

        this.autoToggleBtn = this.add.circle(autoX, autoY, 35, 0x442200, 0.01).setInteractive();
        
        // Procedural Auto Icon (Circular Arrow) - Positioned in the first slot
        const autoIconGfx = this.add.graphics();
        autoIconGfx.lineStyle(4, 0xffffff);
        autoIconGfx.arc(autoX, autoY, 24, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(280));
        autoIconGfx.strokePath();
        autoIconGfx.fillStyle(0xffffff);
        autoIconGfx.fillTriangle(autoX + 24, autoY, autoX + 16, autoY - 10, autoX + 32, autoY - 10);

        // SURGICAL: No "AUTO" text as requested for "perfectly clean" look

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
        const skillStartX = w / 7 * 1.5;
        const skillGap = w / 7;

        skillData.forEach((sk, i) => {
            const bx = skillStartX + i * skillGap;
            const by = autoY;
            const bg = this.add.rectangle(bx, by, sW, sW, 0x111122, 0.01).setOrigin(0.5).setInteractive();
            
            if (sk.sprite) {
                const sprite = this.add.sprite(bx, by, sk.sprite, sk.frame).setOrigin(0.5);
                const scale = (sW - 20) / Math.max(sprite.width, sprite.height);
                sprite.setScale(scale);
            } else {
                this.add.text(bx, by, sk.icon, { fontSize: '28px' }).setOrigin(0.5);
            }
            
            // CD Overlay
            const cdOverlay = this.add.rectangle(bx, by + sW / 2, sW - 4, 0, 0x000000, 0.8).setOrigin(0.5, 1);
            const cdText = this.add.text(bx, by, '', { fontSize: '22px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setAlpha(0);
            
            this.skillBars.push({ overlay: cdOverlay, text: cdText });
            this.skillButtons.push(bg);
            bg.on('pointerdown', () => this.triggerSkill(i));
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
            delay: 10000, // Every 10 seconds
            loop: true,
            callback: () => {
                this.saveBaseStats();
            }
        });

        // ── Upgrade Rows (Expanded to 5) ────────────────────
        this.upgrades = [
            { id: 'damage', name: 'Damage', baseCost: 3, increment: 2, scale: 1.15, icon: 'icon_damage' },
            { id: 'hp', name: 'HP', baseCost: 3, increment: 20, scale: 1.15, icon: 'icon_hp' },
            { id: 'hpRegen', name: 'HP Regen', baseCost: 9, increment: 1, scale: 1.2, icon: 'icon_regen' },
            { id: 'crit', name: 'Crit Rate', baseCost: 150, increment: 0.1, scale: 1.3, suffix: '%', icon: 'icon_crit_rate' },
            { id: 'critDamage', name: 'Crit Damage', baseCost: 300, increment: 0.1, scale: 1.4, suffix: 'x', icon: 'icon_crit_dmg' }
        ];

        this.upgrades.forEach((upg, i) => {
            this.createUpgradeRow(upg, w / 2, UI_ROW_START_Y + i * UI_ROW_GAP);
        });

        // ── Bottom Nav ────────────────────────────────────────────────────────
        const navY = h - 60;
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
            const btn = this.add.container(ix, navY);
            
            // Transparent nav boxes for premium floating look
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
                } else {
                    // Other tabs...
                }
            });

            // Highlight selected (Skill by default maybe)
            if (i === 2) icon.setTint(0xffaa00);
        });

        // Initial update
        if (this.stats) {
            this.updateStats(this.stats, data.stage, 0, 20);
        }
    }

    createUpgradeRow(upg, x, y) {
        const level = this.stats[upg.id + 'Level'] || 1;

        if (upg.icon) {
            const icon = this.add.image(x - 295, y, upg.icon).setOrigin(0.5);
            const iconScale = 64 / Math.max(icon.width, icon.height);
            icon.setScale(iconScale);
        }

        const labelX = x - 205;
        const title = this.add.text(labelX, y - 4, `${upg.name} Lv.${level}`, {
            fontSize: '18px', fill: '#E0E0FF', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0, 0.5);

        let currentVal = upg.id === 'damage' ? this.stats.attack : (upg.id === 'hp' ? this.stats.maxHp : (this.stats[upg.id] || 0));
        if (upg.id === 'critDamage') {
            const upgLevel = this.stats.critDamageLevel || 1;
            currentVal = 1.5 + (upgLevel - 1) * 0.1;
        } else if (upg.id === 'crit') {
            const upgLevel = this.stats.critLevel || 1;
            currentVal = 5.0 + (upgLevel - 1) * 1.0;
        }

        let nextVal = currentVal + upg.increment;
        const suffix = upg.suffix || '';
        const valText = this.add.text(labelX, y + 22, `${currentVal.toFixed(1)}${suffix} -> ${nextVal.toFixed(1)}${suffix}`, {
            fontSize: '15px', fill: '#B0B0CC', fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        const costX = x + 268;
        const buyBtn = this.add.rectangle(costX - 60, y, 130, 60, 0x000000, 0.01).setInteractive().setOrigin(0.5);

        const cost = Math.floor(upg.baseCost * Math.pow(upg.scale, level - 1));
        const costText = this.add.text(costX - 40, y + 10, `${cost}`, {
            fontSize: '20px', fill: '#FFD700', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5, 0.5);

        this.upgradeUI[upg.id] = { title, valText, costText, buyBtn, costX };

        buyBtn.on('pointerdown', () => this.buyUpgrade(upg.id));
        buyBtn.on('pointerover', () => { costText.setScale(1.1); });
        buyBtn.on('pointerout', () => { costText.setScale(1.0); });
    }

    buyUpgrade(id) {
        const stats = this.stats;
        const upg = this.upgrades.find(u => u.id === id);
        const levelKey = id + 'Level';
        const level = stats[levelKey] || 1;
        const cost = Math.floor(upg.baseCost * Math.pow(upg.scale, level - 1));

        if (stats.gold >= cost) {
            stats.gold -= cost;
            
            const game = this.scene.get('GameScene');
            if (game && game.buyBaseUpgrade) {
                // Sync gold to baseStats before upgrading
                if (game.baseStats) game.baseStats.gold = stats.gold;
                game.buyBaseUpgrade(id, upg.increment);
            }

            const ui = this.upgradeUI[id];
            this.tweens.add({ targets: ui.buyBtn, scaleX: 1.05, scaleY: 1.05, duration: 80, yoyo: true });
        } else {
            this.cameras.main.shake(100, 0.005);
        }
    }

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
        // Redesign Header Boss bar visibility or resets here if needed
        if (!visible) {
            this.bossProgressBar.width = 0;
        }
    }

    updateBossStatus(hp, maxHp) {
        if (!this.bossProgressBar) return;
        const pct = Math.max(0, hp / maxHp);
        this.bossProgressBar.width = 300 * pct;
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

    showStageSelector() {
        if (this.isModalOpen) return;
        this.isModalOpen = true;

        const w = this.scale.width;
        const h = this.scale.height;
        const maxStage = this.stats.maxStage || 1;
        let selectedStage = this.stats.stage || 1;

        // Overlay
        const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75).setInteractive();
        
        // Panel
        const panelW = 600;
        const panelH = 400;
        const panel = this.add.container(w / 2, h / 2);
        
        const bg = this.add.rectangle(0, 0, panelW, panelH, 0x1a1a2e).setStrokeStyle(4, 0x444466);
        const title = this.add.text(0, -150, 'Wähle eine Stage', {
            fontSize: '32px', fill: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        const currentStageText = this.add.text(0, -60, `Stage ${selectedStage}`, {
            fontSize: '48px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Slider
        const sliderW = 450;
        const sliderY = 40;
        const sliderTrack = this.add.rectangle(0, sliderY, sliderW, 10, 0x333344).setOrigin(0.5);
        const sliderThumb = this.add.circle(0, sliderY, 20, 0xcc8800).setStrokeStyle(3, 0xffffff).setInteractive({ draggable: true });

        // Update thumb position based on selected stage
        const updateThumb = (s) => {
            const pct = maxStage > 1 ? (s - 1) / (maxStage - 1) : 0.5;
            sliderThumb.x = (pct - 0.5) * sliderW;
            currentStageText.setText(`Stage ${s}`);
        };
        updateThumb(selectedStage);

        sliderThumb.on('drag', (pointer, dragX) => {
            dragX = Phaser.Math.Clamp(dragX, -sliderW / 2, sliderW / 2);
            sliderThumb.x = dragX;
            
            const pct = (dragX + sliderW / 2) / sliderW;
            const s = Math.round(pct * (maxStage - 1)) + 1;
            if (s !== selectedStage) {
                selectedStage = s;
                currentStageText.setText(`Stage ${s}`);
            }
        });

        // OK Button
        const okBtn = this.add.rectangle(-100, 140, 160, 60, 0x228833).setInteractive().setOrigin(0.5);
        const okText = this.add.text(-100, 140, 'OK', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        
        // Close Button (Cancel)
        const cancelBtn = this.add.rectangle(100, 140, 160, 60, 0xcc3333).setInteractive().setOrigin(0.5);
        const cancelText = this.add.text(100, 140, 'X', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        panel.add([bg, title, currentStageText, sliderTrack, sliderThumb, okBtn, okText, cancelBtn, cancelText]);

        const closeModal = () => {
            overlay.destroy();
            panel.destroy();
            this.isModalOpen = false;
        };

        okBtn.on('pointerdown', () => {
            const game = this.scene.get('GameScene');
            if (game && game.jumpToStage) {
                game.jumpToStage(selectedStage);
            }
            closeModal();
        });

        cancelBtn.on('pointerdown', closeModal);
        overlay.on('pointerdown', closeModal);
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
            this.bossProgressBar.width = 300 * pct;
        }

        // Upgrades
        if (this.upgrades && this.upgradeUI) {
            this.upgrades.forEach((upg, i) => {
                const y = UI_ROW_START_Y + i * UI_ROW_GAP;
                const ui = this.upgradeUI[upg.id];
                if (!ui || !ui.title || !ui.title.active) return;
                const upgLevel = Number(stats[upg.id + 'Level']) || 1;
                const cost = Math.floor(upg.baseCost * Math.pow(upg.scale, upgLevel - 1));
                const suffix = upg.suffix || '';
                
                ui.title.setText(`${upg.name} Lv.${upgLevel}`);
                
                let currentVal = upg.id === 'damage' ? Number(stats.attack) : (upg.id === 'hp' ? Number(stats.maxHp) : (Number(stats[upg.id]) || 0));
                
                // Special mapping for critical stats in UIScene
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
            
            // Safety check for game state objects
            const boss = game.boss;
            const enemyList = game.enemyList || [];

            const bossAlive = boss && boss.active && boss.getData && boss.getData('alive') && (boss.x - px) > -50 && (boss.x - px) < 550;
            const listAlive = enemyList.some(e => e && e.active && e.getData && e.getData('alive') && (e.x - px) > -50 && (e.x - px) < 550);
            hasEnemy = !!(bossAlive || listAlive);

            for (let i = 0; i < 6; i++) {
                // Update Cooldown Timers
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
                    
                    // Trigger AUTO
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

    showEquipmentMenu() {
        if (this.isEquipmentOpen) return;
        this.isEquipmentOpen = true;

        const w = this.scale.width;
        const h = this.scale.height;

        const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setInteractive();
        const panel = this.add.container(w / 2, h / 2);

        const bg = this.add.rectangle(0, 0, 720, 900, 0x1a1a2e).setStrokeStyle(4, 0x444466);
        const title = this.add.text(0, -420, 'EQUIPMENT', { fontSize: '32px', fill: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5);
        const closeBtn = this.add.text(330, -420, '✕', { fontSize: '28px', fill: '#ff4444' }).setOrigin(0.5).setInteractive();

        panel.add([bg, title, closeBtn]);

        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            this.isEquipmentOpen = false;
        });

        // Current filter
        this.currentEquipTab = this.currentEquipTab || 'weapon';
        this.selectedInventoryId = this.selectedInventoryId || 'wpn_01';

        // ── Top Detail Panel ──────────────────────────────────────────────────
        this.renderDetailPanel(panel);

        // ── Tabs ──────────────────────────────────────────────────────────────
        const tabs = [
            { id: 'weapon', name: 'Weapon' },
            { id: 'shield', name: 'Shield' },
            { id: 'necklace', name: 'Necklace' }
        ];

        tabs.forEach((tab, i) => {
            const tx = -200 + i * 200;
            const ty = 380;
            const btn = this.add.rectangle(tx, ty, 180, 50, this.currentEquipTab === tab.id ? 0x444466 : 0x222233).setInteractive();
            const txt = this.add.text(tx, ty, tab.name, { fontSize: '18px', fill: '#fff' }).setOrigin(0.5);
            btn.on('pointerdown', () => {
                this.currentEquipTab = tab.id;
                this.refreshEquipmentMenu(panel);
            });
            panel.add([btn, txt]);
        });

        // ── Bottom Action Buttons ─────────────────────────────────────────────
        const summonBtn = this.add.rectangle(-180, 320, 250, 60, 0xd35400).setInteractive();
        this.add.text(-180, 320, 'Summon', { fontSize: '22px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        panel.add(summonBtn);
        summonBtn.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            this.isEquipmentOpen = false;
            this.showSummonMenu();
        });

        const enhanceAllBtn = this.add.rectangle(180, 320, 250, 60, 0x27ae60).setInteractive();
        const enhanceAllTxt = this.add.text(180, 320, 'Enhance All', { fontSize: '22px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        panel.add([enhanceAllBtn, enhanceAllTxt]);
        enhanceAllBtn.on('pointerdown', () => {
            if (this.equipment.enhanceAll()) {
                this.refreshEquipmentMenu(panel);
                this.syncGameSceneStats();
            }
        });

        // ── Grid System ───────────────────────────────────────────────────────
        this.renderInventoryGrid(panel);
    }

    renderDetailPanel(panel) {
        const id = this.selectedInventoryId;
        const invItem = this.equipment.inventory[id];
        const dbItem = this.equipment.getItemById(id);
        if (!invItem || !dbItem) return;

        const detailBg = this.add.rectangle(0, -250, 680, 280, 0x111122).setStrokeStyle(2, 0x444466);
        panel.add(detailBg);

        // Big Icon
        const rarity = RARITIES[dbItem.rarity];
        const iconBg = this.add.rectangle(-250, -250, 140, 140, 0x000000, 0.5).setStrokeStyle(3, rarity.color);
        const icon = this.add.text(-250, -260, dbItem.icon, { fontSize: '80px' }).setOrigin(0.5);
        
        const lvlLabel = this.add.text(-310, -195, `Lv.${invItem.level}`, { fontSize: '20px', fill: '#fff', fontStyle: 'bold' });
        
        // Equipped marker
        if (this.equipment.isEquipped(id)) {
            const eFlag = this.add.text(-195, -310, 'E', { fontSize: '24px', fill: '#f00', fontStyle: 'bold', backgroundColor: '#fff', padding: 2 });
            panel.add(eFlag);
        }

        // Stats
        const name = this.add.text(-160, -320, dbItem.name, { fontSize: '28px', fill: '#fff', fontStyle: 'bold' });
        const rarityName = this.add.text(320, -320, rarity.name, { fontSize: '18px', fill: rarity.colorStr }).setOrigin(1, 0);

        const posEffect = this.add.text(-160, -280, 'Possession Effect:', { fontSize: '14px', fill: '#fa0' });
        let posStr = '';
        Object.keys(dbItem.baseStats).forEach(k => {
            posStr += `${k}: +${(dbItem.baseStats[k] * 0.01 * invItem.level).toFixed(1)}  `;
        });
        const posVal = this.add.text(-160, -260, posStr, { fontSize: '18px', fill: '#2ecc71' });

        const eqEffect = this.add.text(-160, -220, 'Equipped Effect:', { fontSize: '14px', fill: '#fa0' });
        let eqStr = '';
        const mult = 1 + (invItem.level - 1) * 0.2;
        Object.keys(dbItem.baseStats).forEach(k => {
            eqStr += `${k}: +${(dbItem.baseStats[k] * mult).toFixed(1)}  `;
        });
        const eqVal = this.add.text(-160, -200, eqStr, { fontSize: '18px', fill: '#2ecc71' });

        // Action Buttons
        const equipBtn = this.add.rectangle(-50, -150, 180, 50, 0x2980b9).setInteractive();
        const equipTxt = this.add.text(-50, -150, this.equipment.isEquipped(id) ? 'Unequip' : 'Equip', { fontSize: '18px', fill: '#fff' }).setOrigin(0.5);
        equipBtn.on('pointerdown', () => {
            if (this.equipment.isEquipped(id)) {
                // Find slot
                const slot = Object.keys(this.equipment.equipped).find(k => this.equipment.equipped[k] && this.equipment.equipped[k].id === id);
                this.equipment.unequip(slot);
            } else {
                let targetSlot = dbItem.type;
                if (dbItem.type === 'ring') targetSlot = this.equipment.equipped.ring1 ? 'ring2' : 'ring1';
                this.equipment.equip(id, targetSlot);
            }
            this.refreshEquipmentMenu(panel);
            this.syncGameSceneStats();
        });

        const enhanceBtn = this.add.rectangle(150, -150, 180, 50, 0x27ae60).setInteractive();
        const enhanceTxt = this.add.text(150, -150, 'Enhance', { fontSize: '18px', fill: '#fff' }).setOrigin(0.5);
        enhanceBtn.on('pointerdown', () => {
            if (this.equipment.enhanceItem(id)) {
                this.refreshEquipmentMenu(panel);
                this.syncGameSceneStats();
            }
        });

        // Enhance Progress (Detail)
        const cost = invItem.level * rarity.enhanceCost;
        const barW = 120;
        const xpBg = this.add.rectangle(-250, -165, barW, 14, 0x000000).setOrigin(0.5);
        const ratio = Math.min(1, invItem.count / cost);
        const xpFill = this.add.rectangle(-250 - barW / 2, -165, barW * ratio, 14, 0x3498db).setOrigin(0, 0.5);
        const xpText = this.add.text(-250, -150, `Need ${cost} total`, { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);

        panel.add([iconBg, icon, lvlLabel, name, rarityName, posEffect, posVal, eqEffect, eqVal, equipBtn, equipTxt, enhanceBtn, enhanceTxt, xpBg, xpFill, xpText]);
    }

    renderInventoryGrid(panel) {
        const gridStartX = -260;
        const gridStartY = -50;
        const spacing = 130;
        const cols = 5;

        const filtered = Object.values(this.equipment.inventory).filter(invItem => {
            const db = this.equipment.getItemById(invItem.id);
            if (this.currentEquipTab === 'weapon') return db.type === 'weapon';
            if (this.currentEquipTab === 'shield') return db.type === 'armor'; // Mapping armor to shield for UI
            if (this.currentEquipTab === 'necklace') return db.type === 'accessory' || db.type === 'ring';
            return false;
        });

        filtered.forEach((invItem, i) => {
            const db = this.equipment.getItemById(invItem.id);
            const r = i % cols;
            const c = Math.floor(i / cols);
            const x = gridStartX + r * spacing;
            const y = gridStartY + c * spacing;

            const rarity = RARITIES[db.rarity];
            const slot = this.add.rectangle(x, y, 120, 120, 0x222233).setStrokeStyle(3, this.selectedInventoryId === db.id ? 0xffffff : rarity.color).setInteractive();
            const icon = this.add.text(x, y - 10, db.icon, { fontSize: '50px' }).setOrigin(0.5);
            
            const lvl = this.add.text(x - 50, y + 40, `Lv.${invItem.level}`, { fontSize: '14px', fill: '#fff' });
            
            // Enhance Progress Bar
            const cost = invItem.level * rarity.enhanceCost;
            const barW = 110;
            const pBg = this.add.rectangle(x, y + 55, barW, 10, 0x000000);
            const ratio = Math.min(1, invItem.count / cost);
            const pFill = this.add.rectangle(x - barW / 2, y + 55, barW * ratio, 10, 0x3498db).setOrigin(0, 0.5);
            const pText = this.add.text(x, y + 55, `${invItem.count}/${cost}`, { fontSize: '10px', fill: '#fff' }).setOrigin(0.5);

            if (this.equipment.isEquipped(db.id)) {
                const eColor = this.add.text(x + 40, y - 50, 'E', { fontSize: '16px', fill: '#f00', backgroundColor: '#fff', padding: 2 });
                panel.add(eColor);
            }

            slot.on('pointerdown', () => {
                this.selectedInventoryId = db.id;
                this.refreshEquipmentMenu(panel);
            });

            panel.add([slot, icon, lvl, pBg, pFill, pText]);
        });
    }

    refreshEquipmentMenu(panel) {
        if (!panel) return;
        
        // Find the overlay (it's the rectangle added before the panel)
        // Since we are inside UIScene, we can just look for children
        const overlay = this.children.list.find(c => c.type === 'Rectangle' && c.width === this.scale.width && c.fillAlpha === 0.85);
        if (overlay) overlay.destroy();
        if (panel) panel.destroy();
        
        this.isEquipmentOpen = false;
        this.showEquipmentMenu();
    }

    showItemTooltip(item, pointer) {
        if (this.tooltip) this.tooltip.destroy();
        
        const rarityInfo = RARITIES[item.rarity];
        const w = 240;
        const h = 200;
        
        // Offset tooltip to not be under finger/mouse
        const tx = Math.min(pointer.x + 20, this.scale.width - w - 20);
        const ty = Math.min(pointer.y + 20, this.scale.height - h - 20);
        
        const container = this.add.container(tx, ty);
        
        const bg = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.95).setStrokeStyle(2, rarityInfo.color);
        const name = this.add.text(10, 10, item.name, { fontSize: '18px', fill: rarityInfo.colorStr, fontStyle: 'bold' });
        const rarityText = this.add.text(10, 35, rarityInfo.name, { fontSize: '12px', fill: rarityInfo.colorStr });
        const line = this.add.rectangle(w/2, 55, w - 20, 1, 0x444444);
        
        let statsStr = '';
        Object.keys(item.stats).forEach(k => {
            let val = item.stats[k];
            let sign = val > 0 ? '+' : '';
            statsStr += `${k.toUpperCase()}: ${sign}${val}\n`;
        });
        const stats = this.add.text(10, 65, statsStr, { fontSize: '14px', fill: '#ffffff', lineSpacing: 5 });
        
        const flavor = this.add.text(10, h - 45, item.flavor, { fontSize: '11px', fill: '#aaa', fontStyle: 'italic', wordWrap: { width: w - 20 } });
        
        container.add([bg, name, rarityText, line, stats, flavor]);
        container.setDepth(2000);
        this.tooltip = container;
    }

    hideItemTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
    }

    syncGameSceneStats() {
        const game = this.scene.get('GameScene');
        if (game && game.applyEquipmentStats) {
            game.applyEquipmentStats();
        }
    }

    showSummonMenu() {
        if (this.isSummonOpen) return;
        this.isSummonOpen = true;

        const w = this.scale.width;
        const h = this.scale.height;

        const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setInteractive();
        const panel = this.add.container(w / 2, h / 2);

        const bg = this.add.rectangle(0, 0, 700, 520, 0x1a1a2e).setStrokeStyle(4, 0x554488);
        const title = this.add.text(0, -230, 'SUMMONING', { fontSize: '36px', fill: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5);

        const closeBtn = this.add.text(320, -230, '✕', { fontSize: '28px', fill: '#ff4444' }).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            this.isSummonOpen = false;
        });

        panel.add([bg, title, closeBtn]);

        const categories = [
            { id: 'weapon', name: 'Waffen', icon: '⚔️' },
            { id: 'shield', name: 'Schilde', icon: '🛡️' },
            { id: 'necklace', name: 'Halsketten', icon: '📿' },
            { id: 'skill', name: 'Skills', icon: '📖' }
        ];

        categories.forEach((cat, i) => {
            this.createSummonCard(panel, cat, 0, -140 + i * 105);
        });
    }

    createSummonCard(panel, cat, x, y) {
        const cardW = 640;
        const cardH = 95;
        const data = this.summonManager.banners[cat.id];

        const cardBg = this.add.rectangle(x, y, cardW, cardH, 0x25253a).setStrokeStyle(1, 0x444466).setOrigin(0.5);
        const icon = this.add.text(x - cardW / 2 + 40, y, cat.icon, { fontSize: '32px' }).setOrigin(0.5);
        const nameText = this.add.text(x - cardW / 2 + 80, y - 15, `${cat.name} Lv.${data.level}`, { fontSize: '18px', fill: '#fff', fontStyle: 'bold' });

        // XP Bar
        const barW = 200;
        const barH = 10;
        const xpRatio = data.xp / SUMMON_CONFIG.XP_TO_LEVEL;
        const barX = x - cardW / 2 + 80;
        const barY = y + 15;
        const xpBg = this.add.rectangle(barX + barW / 2, barY, barW, barH, 0x000000).setOrigin(0.5);
        const xpFill = this.add.rectangle(barX, barY - barH / 2, barW * xpRatio, barH, 0xaa44ff).setOrigin(0, 0);
        const xpText = this.add.text(barX + barW + 10, barY, `${data.xp}/${SUMMON_CONFIG.XP_TO_LEVEL}`, { fontSize: '12px', fill: '#aaa' }).setOrigin(0, 0.5);

        panel.add([cardBg, icon, nameText, xpBg, xpFill, xpText]);

        // Buttons
        const createBtn = (bx, label, cost, amount) => {
            const btn = this.add.rectangle(bx, y, 100, 60, 0x442266).setStrokeStyle(2, 0xaa44ff).setInteractive();
            const txt = this.add.text(bx, y - 10, label, { fontSize: '16px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
            const cst = this.add.text(bx, y + 12, `💎 ${cost}`, { fontSize: '12px', fill: '#00ffff' }).setOrigin(0.5);
            
            btn.on('pointerdown', () => this.executeSummon(cat.id, amount));
            btn.on('pointerover', () => btn.setFillStyle(0x553377));
            btn.on('pointerout', () => btn.setFillStyle(0x442266));

            panel.add([btn, txt, cst]);
        };

        createBtn(x + 100, 'x10', SUMMON_CONFIG.COST_X10, 10);
        createBtn(x + 220, 'x30', SUMMON_CONFIG.COST_X30, 30);
    }

    executeSummon(category, amount) {
        const currentGems = Number(this.stats.gems) || 0;
        const cost = amount === 10 ? SUMMON_CONFIG.COST_X10 : SUMMON_CONFIG.COST_X30;

        if (currentGems < cost) {
            this.cameras.main.shake(100, 0.005);
            return;
        }

        const pullRes = this.summonManager.pull(category, amount, currentGems);
        if (pullRes.success) {
            this.stats.gems -= pullRes.cost;
            this.updateStats(this.stats);
            this.saveBaseStats();

            // Add to inventory (Using the new addItem method)
            pullRes.items.forEach(item => {
                this.equipment.addItem(item);
            });
            this.equipment.save();

            this.showSummonResults(pullRes.items);
        }
    }

    showSummonResults(items) {
        const w = this.scale.width;
        const h = this.scale.height;
        const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.95).setInteractive().setDepth(3000);
        const container = this.add.container(w / 2, h / 2).setDepth(3001);

        const title = this.add.text(0, -250, 'SUMMON RESULTS', { fontSize: '32px', fill: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5);
        const okBtn = this.add.rectangle(0, 260, 150, 50, 0x228833).setInteractive().setStrokeStyle(2, 0xffffff);
        const okText = this.add.text(0, 260, 'OK', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);

        container.add([title, okBtn, okText]);

        const cols = items.length === 10 ? 5 : 6;
        const spacing = 95;
        const startX = -((Math.min(items.length, cols) - 1) * spacing) / 2;
        const startY = items.length > 20 ? -180 : -100;

        items.forEach((item, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const ix = startX + col * spacing;
            const iy = startY + row * spacing;

            const rarityInfo = RARITIES[item.rarity];
            const itemBg = this.add.rectangle(ix, iy, 75, 75, 0x222233).setStrokeStyle(2, rarityInfo.color).setScale(0);
            const icon = this.add.text(ix, iy, item.icon, { fontSize: '32px' }).setOrigin(0.5).setScale(0);

            container.add([itemBg, icon]);

            this.tweens.add({
                targets: [itemBg, icon],
                scale: 1,
                duration: 300,
                delay: i * 50,
                ease: 'Back.Out'
            });
        });

        okBtn.on('pointerdown', () => {
            overlay.destroy();
            container.destroy();
            this.isSummonOpen = false;
            this.showSummonMenu(); 
        });
    }

    saveBaseStats() {
        if (!this.stats) return;
        const game = this.scene.get('GameScene');
        if (game && game.baseStats) {
            // Sync current volatile state like gold/gems to baseStats before saving
            game.baseStats.gold = Math.floor(this.stats.gold);
            game.baseStats.gems = this.stats.gems;
            game.baseStats.emeralds = this.stats.emeralds;
            game.baseStats.stage = game.currentStage;
            SaveSystem.save(game.baseStats);
        }
    }
}