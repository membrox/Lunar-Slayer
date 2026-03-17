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
        this.skillCooldowns = [0, 0, 0, 0];
        this.skillMaxCooldowns = [5000, 5000, 5000, 5000];
        this.skillBars = [];
        this.skillButtons = [];

        // Debug text
        this.debugText = this.add.text(w / 2, 85, '', { fontSize: '10px', fill: '#00ff00' }).setOrigin(0.5).setAlpha(0);
        const classIndex = this.stats.classIndex ?? 0;

        // ── Top Bar (Currencies) ──────────────────────────────────────────────
        // Dark translucent background
        this.add.rectangle(w / 2, 40, w, 80, 0x000000, 0.75).setOrigin(0.5);
        
        // Character Avatar & HP Bar
        const avatarBg = this.add.circle(50, 40, 32, 0x333333).setStrokeStyle(2, 0x888888);
        const classIcons = ['⚔️', '🔮', '🏹'];
        this.add.text(50, 40, classIcons[classIndex] || '⚔️', { fontSize: '26px' }).setOrigin(0.5).setPadding(5);

        // Player Health Bar
        const hpBarX = 95;
        const hpBarY = 40;
        const hpBarW = 160;
        this.add.rectangle(hpBarX, hpBarY, hpBarW, 16, 0x330000).setOrigin(0, 0.5);
        this.hpBarFill = this.add.rectangle(hpBarX, hpBarY, hpBarW, 16, 0xff3333).setOrigin(0, 0.5);
        this.hpText = this.add.text(hpBarX + hpBarW / 2, hpBarY, 'HP: 100/100', {
            fontSize: '11px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);


        // Gold
        this.goldText = this.add.text(w - 320, 40, `💰 ${Math.floor(this.stats.gold)}`, {
            fontSize: '18px', fill: '#FFD700', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(1, 0.5);
        
        // Gems
        this.gemsText = this.add.text(w - 170, 40, `💎 ${this.stats.gems || 0}`, {
            fontSize: '18px', fill: '#00ffff', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(1, 0.5);

        // Emeralds
        this.emeraldsText = this.add.text(w - 20, 40, `🟢 ${this.stats.emeralds || 0}`, {
            fontSize: '18px', fill: '#00ff00', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(1, 0.5);

        // ── Stage Header ──────────────────────────────────────────────────────
        const headerY = 140;
        // Stage Header Background (Procedural)
        const headerGfx = this.add.graphics();
        headerGfx.fillStyle(0x1a1a2e, 0.6);
        headerGfx.fillRoundedRect(w / 2 - 150, headerY - 30, 300, 80, 10);
        headerGfx.lineStyle(2, 0x444466);
        headerGfx.strokeRoundedRect(w / 2 - 150, headerY - 30, 300, 80, 10);
        
        // Stage Arrows
        this.add.text(w / 2 - 130, headerY, '◀', { fontSize: '24px', fill: '#FFD700' }).setOrigin(0.5).setInteractive();
        this.add.text(w / 2 + 130, headerY, '▶', { fontSize: '24px', fill: '#FFD700' }).setOrigin(0.5).setInteractive();

        this.stageText = this.add.text(w / 2, headerY - 5, `STAGE ${data.stage || 1}`, {
            fontSize: '22px', fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Boss Progress Bar
        this.add.rectangle(w / 2, headerY + 30, 300, 10, 0x330000).setOrigin(0.5);
        this.bossProgressBar = this.add.rectangle(w / 2 - 150, headerY + 30, 0, 10, 0xaa0000).setOrigin(0, 0.5);
        this.add.text(w / 2 + 170, headerY + 30, '👹', { fontSize: '20px' }).setOrigin(0.5);

        // ── Control Panel Background ──────────────────────────────────────────
        const panelTop = 580;
        const panelH = h - panelTop - 100;
        this.add.rectangle(w / 2, panelTop + panelH / 2, w, panelH, 0x11111a, 0.98).setOrigin(0.5).setStrokeStyle(3, 0x333344);

        // ── Skill Row ────────────────────────────────────────────────────────
        const skillY = panelTop + 50;
        const skillData = [
            { name: 'Feuer', icon: '🔥', color: 0xcc3300 },
            { name: 'Frost', icon: '❄️', color: 0x004488 },
            { name: 'Blitz', icon: '⚡', color: 0xaaaa00 },
            { name: 'Heilen', icon: '💚', color: 0x006633 },
        ];
        const sW = 80;
        const totalSW = skillData.length * (sW + 10) - 10;
        const startSX = w / 2 - totalSW / 2 + sW / 2;

        skillData.forEach((sk, i) => {
            const bx = startSX + i * (sW + 10);
            const bg = this.add.rectangle(bx, skillY, sW, sW, 0x111122).setOrigin(0.5).setStrokeStyle(2, 0x444466).setInteractive();
            this.add.rectangle(bx, skillY, sW - 8, sW - 8, sk.color).setOrigin(0.5).setAlpha(0.6);
            this.add.text(bx, skillY, sk.icon, { fontSize: '28px' }).setOrigin(0.5).setPadding(8);
            
            // CD Overlay
            const cdOverlay = this.add.rectangle(bx, skillY + sW / 2, sW - 4, 0, 0x000000, 0.8).setOrigin(0.5, 1);
            const cdText = this.add.text(bx, skillY, '', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0);
            
            this.skillBars.push({ overlay: cdOverlay, text: cdText });
            this.skillButtons.push(bg);
            bg.on('pointerdown', () => this.triggerSkill(i));
        });

        // ── Auto Button ───────────────────────────────────────────────────────
        const autoY = panelTop + 50; 
        const autoBg = this.add.circle(80, autoY, 35, 0x442200).setStrokeStyle(3, 0xcc8800).setInteractive();
        
        // Procedural Auto Icon (Circular Arrow)
        const autoIconGfx = this.add.graphics();
        autoIconGfx.lineStyle(3, 0xffffff);
        autoIconGfx.arc(80, autoY - 2, 12, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(280));
        autoIconGfx.strokePath();
        autoIconGfx.fillStyle(0xffffff);
        autoIconGfx.fillTriangle(92, autoY - 2, 86, autoY - 8, 98, autoY - 8);
        
        this.add.text(80, autoY + 18, 'AUTO', { fontSize: '10px', fill: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5);

        // Apply initial visual state if AUTO is active
        if (this.isAutoSkills) {
            autoBg.setStrokeStyle(5, 0x00ffff);
            autoBg.setFillStyle(0x004444);
        }

        autoBg.on('pointerdown', () => {
            this.isAutoSkills = !this.isAutoSkills;
            this.stats.autoSkills = this.isAutoSkills; // Persist in stats object
            
            if (this.isAutoSkills) {
                autoBg.setStrokeStyle(5, 0x00ffff);
                autoBg.setFillStyle(0x004444);
            } else {
                autoBg.setStrokeStyle(3, 0xcc8800);
                autoBg.setFillStyle(0x442200);
            }
        });

        // ── Upgrade List ──────────────────────────────────────────────────────
        const listTop = panelTop + 115; // Below skill row
        const listH = 400;
        this.add.rectangle(w / 2, listTop + listH / 2, w - 20, listH, 0x1a1a2a, 0.95).setOrigin(0.5).setStrokeStyle(2, 0x333344);

        this.upgrades = [
            { id: 'damage', name: 'Damage', icon: '⚔️', baseCost: 3, increment: 2, scale: 1.15 },
            { id: 'hp', name: 'HP', icon: '❤️', baseCost: 3, increment: 20, scale: 1.15 },
            { id: 'hpRegen', name: 'HP Regen', icon: '💪', baseCost: 9, increment: 1, scale: 1.2 },
            { id: 'crit', name: 'Crit Rate', icon: '⚡', baseCost: 150, increment: 0.1, scale: 1.3, suffix: '%' }
        ];
        this.upgradeUI = {};

        this.upgrades.forEach((upg, i) => {
            this.createUpgradeRow(upg, w / 2, listTop + 50 + i * 95);
        });

        // ── Bottom Nav ────────────────────────────────────────────────────────
        const navY = h - 60;
        const navItems = [
            { name: 'Equipment', icon: '⚔️' },
            { name: 'Costume', icon: '🐕' },
            { name: 'Skill', icon: '📖' },
            { name: 'Spirit', icon: '🐉' },
            { name: 'Adventure', icon: '🧭' },
            { name: 'Shop', icon: '💎' }
        ];

        navItems.forEach((item, i) => {
            const ix = (w / (navItems.length + 1)) * (i + 1);
            const btn = this.add.container(ix, navY);
            
            // Procedural nav bg
            const nbg = this.add.rectangle(0, 0, 80, 100, 0x1a1a2e, 0.5).setStrokeStyle(1, 0x444466);
            const icon = this.add.text(0, -10, item.icon, { fontSize: '28px' }).setOrigin(0.5);
            const label = this.add.text(0, 25, item.name, { fontSize: '10px', fill: '#ffffff' }).setOrigin(0.5);
            
            btn.add([nbg, icon, label]);
            // Highlight selected (Skill by default maybe)
            if (i === 2) icon.setTint(0xffaa00);
        });

        // XP Bar (Below upgrade list)
        this.xpBarBg = this.add.rectangle(w / 2, listTop + listH + 10, w - 40, 14, 0x000000, 0.8).setOrigin(0.5);
        this.xpBar = this.add.rectangle(w / 2 - (w - 40) / 2, listTop + listH + 10, 0, 10, 0xffaa00).setOrigin(0, 0.5);
        this.xpText = this.add.text(w / 2, listTop + listH + 10, '0 / 100 XP', { fontSize: '10px', fill: '#fff' }).setOrigin(0.5);

        // Initial update
        if (this.stats) {
            this.updateStats(this.stats, data.stage, 0, 20);
        }
    }

    createUpgradeRow(upg, x, y) {
        const rowW = 680;
        const rowH = 85;
        
        // Row Container
        const container = this.add.rectangle(x, y, rowW, rowH, 0x2a2a3a).setOrigin(0.5).setStrokeStyle(1, 0x444455);
        
        // Icon Box
        this.add.rectangle(x - rowW/2 + 45, y, 75, 75, 0x111111).setOrigin(0.5).setStrokeStyle(1, 0xcc8800);
        this.add.text(x - rowW/2 + 45, y, upg.icon, { fontSize: '24px' }).setOrigin(0.5).setPadding(10);
        
        // Info
        const level = this.stats[upg.id + 'Level'] || 1;
        const title = this.add.text(x - rowW/2 + 95, y - 18, `${upg.name} Lv.${level}`, {
            fontSize: '18px', fill: '#FFD700', fontStyle: 'bold'
        });
        
        let currentVal = upg.id === 'damage' ? this.stats.attack : (upg.id === 'hp' ? this.stats.maxHp : (this.stats[upg.id] || 0));
        let nextVal = currentVal + upg.increment;
        const suffix = upg.suffix || '';
        const valText = this.add.text(x - rowW/2 + 95, y + 12, `${currentVal}${suffix} -> ${nextVal}${suffix}`, {
            fontSize: '16px', fill: '#ffffff'
        });

        // Buy Button
        const btnX = x + rowW/2 - 85;
        const buyBtn = this.add.rectangle(btnX, y, 150, 60, 0xcc8800).setInteractive().setOrigin(0.5);
        const costText = this.add.text(btnX, y, `💰 10`, {
            fontSize: '18px', fill: '#000', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.upgradeUI[upg.id] = { title, valText, costText, buyBtn };

        buyBtn.on('pointerdown', () => this.buyUpgrade(upg.id));
        buyBtn.on('pointerover', () => buyBtn.setFillStyle(0xeeaa00));
        buyBtn.on('pointerout', () => buyBtn.setFillStyle(0xcc8800));
    }

    buyUpgrade(id) {
        const stats = this.stats;
        const upg = this.upgrades.find(u => u.id === id);
        const levelKey = id + 'Level';
        const level = stats[levelKey] || 1;
        const cost = Math.floor(upg.baseCost * Math.pow(upg.scale, level - 1));

        if (stats.gold >= cost) {
            stats.gold -= cost;
            stats[levelKey] = level + 1;
            
            // Apply stat increase
            if (id === 'damage') {
                stats.attack += upg.increment;
            } else if (id === 'hp') {
                stats.maxHp += upg.increment;
                stats.hp += upg.increment;
            } else {
                stats[id] = (stats[id] || 0) + upg.increment;
            }

            this.updateStats(stats);
            
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
        const pct = Math.max(0, hp / maxHp);
        this.bossProgressBar.width = 300 * pct;
    }

    updateStats(stats, stage, killed, total) {
        if (!stats) return;
        this.stats = stats;
        
        this.goldText.setText(`💰 ${Math.floor(stats.gold)}`);
        this.gemsText.setText(`💎 ${stats.gems || 0}`);
        this.emeraldsText.setText(`🟢 ${stats.emeralds || 0}`);

        const hpPct = Math.max(0, stats.hp / stats.maxHp);
        this.hpBarFill.width = 160 * hpPct;
        this.hpText.setText(`HP: ${Math.floor(stats.hp)}/${Math.floor(stats.maxHp)}`);

        if (stage !== undefined) this.stageText.setText(`STAGE ${stage}`);
        
        if (killed !== undefined && total !== undefined) {
            const pct = Math.max(0, killed / total);
            this.bossProgressBar.width = 300 * pct;
        }

        const xpNeeded = stats.level * 100;
        this.xpBar.width = (this.scale.width - 40) * (stats.xp / xpNeeded);
        this.xpText.setText(`${stats.xp} / ${xpNeeded} XP`);

        // Upgrades
        this.upgrades.forEach(upg => {
            const ui = this.upgradeUI[upg.id];
            const level = stats[upg.id + 'Level'] || 1;
            const cost = Math.floor(upg.baseCost * Math.pow(upg.scale, level - 1));
            const suffix = upg.suffix || '';
            
            ui.title.setText(`${upg.name} Lv.${level}`);
            
            let currentVal = upg.id === 'damage' ? stats.attack : (upg.id === 'hp' ? stats.maxHp : (stats[upg.id] || 0));
            let nextVal = currentVal + upg.increment;
            ui.valText.setText(`${currentVal.toFixed(1)}${suffix} -> ${nextVal.toFixed(1)}${suffix}`);
            ui.costText.setText(`💰 ${cost}`);
            
            if (stats.gold < cost) {
                ui.buyBtn.setAlpha(0.5);
                ui.costText.setFill('#ff0000');
            } else {
                ui.buyBtn.setAlpha(1);
                ui.costText.setFill('#000');
            }
        });
    }

    update(time, delta) {
        if (this.globalCooldown > 0) {
            this.globalCooldown = Math.max(0, this.globalCooldown - delta);
        }

        const game = this.scene.get('GameScene');
        if (!game) return;

        // Auto Skill Trigger Logic
        let hasEnemy = false;
        const px = game.playerPhysics.x;
        // Only target enemies in front of the player and within a tighter 550px range
        const bossAlive = game.boss && game.boss.active && game.boss.getData && game.boss.getData('alive') && (game.boss.x - px) > -50 && (game.boss.x - px) < 550;
        const listAlive = game.enemyList && game.enemyList.some(e => e && e.active && e.getData && e.getData('alive') && (e.x - px) > -50 && (e.x - px) < 550);
        hasEnemy = !!(bossAlive || listAlive);
        this.debugText.setText(`DET: B:${bossAlive ? 'Y' : 'N'} L:${listAlive ? 'Y' : 'N'} H:${hasEnemy ? 'Y' : 'N'}`).setAlpha(1);

        for (let i = 0; i < 4; i++) {
            // Update Cooldown Timers
            if (this.skillCooldowns[i] > 0) {
                this.skillCooldowns[i] = Math.max(0, this.skillCooldowns[i] - delta);
            }

            const bar = this.skillBars[i];
            if (!bar) continue;

            const cd = this.skillCooldowns[i];
            if (cd > 0) {
                bar.overlay.height = 76 * (cd / this.skillMaxCooldowns[i]);
                bar.text.setText((cd / 1000).toFixed(1)).setAlpha(1);
            } else {
                bar.overlay.height = 0;
                bar.text.setAlpha(0);
                
                // Trigger AUTO if possible - Enforce GCD check INSIDE the loop
                if (this.isAutoSkills && hasEnemy && this.globalCooldown <= 0) {
                    if (i < 3) {
                        this.triggerSkill(i);
                    } else if (i === 3 && this.stats.hp < this.stats.maxHp * 0.5) {
                        this.triggerSkill(i);
                    }
                }
            }
        }
    }
}