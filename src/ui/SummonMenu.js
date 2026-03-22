import { RARITIES } from '../utils/EquipmentManager.js';
import { SUMMON_CONFIG } from '../utils/SummonManager.js';

/**
 * Shows the summon menu overlay.
 * @param {Phaser.Scene} scene - The UIScene instance
 */
export function showSummonMenu(scene) {
    if (scene.isSummonOpen) return;
    scene.isSummonOpen = true;

    const w = scene.scale.width;
    const h = scene.scale.height;

    const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setInteractive().setDepth(2000);
    const panel = scene.add.container(w / 2, h / 2).setDepth(2001);

    const bg = scene.add.rectangle(0, 0, 700, 520, 0x1a1a2e).setStrokeStyle(4, 0x554488);
    const title = scene.add.text(0, -230, 'SUMMONING', { fontSize: '36px', fill: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5);

    const closeBtn = scene.add.text(320, -230, '✕', { fontSize: '28px', fill: '#ff4444' }).setOrigin(0.5).setInteractive();
    closeBtn.on('pointerdown', () => closeSummonMenu(scene));

    scene.summonMenuOverlay = overlay;
    scene.summonMenuPanel = panel;

    panel.add([bg, title, closeBtn]);

    const categories = [
        { id: 'weapon', name: 'Waffen', icon: '⚔️' },
        { id: 'shield', name: 'Schilde', icon: '🛡️' },
        { id: 'necklace', name: 'Halsketten', icon: '📿' },
        { id: 'skill', name: 'Skills', icon: '📖' }
    ];

    categories.forEach((cat, i) => {
        createSummonCard(scene, panel, cat, 0, -140 + i * 105);
    });
}

function createSummonCard(scene, panel, cat, x, y) {
    const cardW = 640;
    const cardH = 95;
    const data = scene.summonManager.banners[cat.id];

    const cardBg = scene.add.rectangle(x, y, cardW, cardH, 0x25253a).setStrokeStyle(1, 0x444466).setOrigin(0.5);
    const icon = scene.add.text(x - cardW / 2 + 40, y, cat.icon, { fontSize: '32px' }).setOrigin(0.5);
    const nameText = scene.add.text(x - cardW / 2 + 80, y - 15, `${cat.name} Lv.${data.level}`, { fontSize: '18px', fill: '#fff', fontStyle: 'bold' });

    // XP Bar
    const barW = 200;
    const barH = 10;
    const reqXP = scene.summonManager.getRequiredXP(data.level);
    const isMax = data.level >= 20;
    const xpRatio = isMax ? 1 : Math.min(1, data.progress / reqXP);
    
    const barX = x - cardW / 2 + 80;
    const barY = y + 15;
    const xpBg = scene.add.rectangle(barX + barW / 2, barY, barW, barH, 0x000000).setOrigin(0.5);
    const xpFill = scene.add.rectangle(barX, barY - barH / 2, barW * xpRatio, barH, 0xaa44ff).setOrigin(0, 0);
    
    const xpLabel = isMax ? "MAX" : `${data.progress}/${reqXP}`;
    const xpText = scene.add.text(barX + barW + 10, barY, xpLabel, { fontSize: '12px', fill: isMax ? '#f1c40f' : '#aaa', fontStyle: isMax ? 'bold' : 'normal' }).setOrigin(0, 0.5);

    panel.add([cardBg, icon, nameText, xpBg, xpFill, xpText]);

    // Buttons
    const createBtn = (bx, label, cost, amount) => {
        const btn = scene.add.rectangle(bx, y, 100, 60, 0x442266).setStrokeStyle(2, 0xaa44ff).setInteractive();
        const txt = scene.add.text(bx, y - 10, label, { fontSize: '16px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        const cst = scene.add.text(bx, y + 12, `💎 ${cost}`, { fontSize: '12px', fill: '#00ffff' }).setOrigin(0.5);

        btn.on('pointerdown', () => executeSummon(scene, cat.id, amount));
        btn.on('pointerover', () => btn.setFillStyle(0x553377));
        btn.on('pointerout', () => btn.setFillStyle(0x442266));

        panel.add([btn, txt, cst]);
    };

    createBtn(x + 100, 'x10', SUMMON_CONFIG.COST_X10, 10);
    createBtn(x + 220, 'x30', SUMMON_CONFIG.COST_X30, 30);
}

function executeSummon(scene, category, amount) {
    if (scene.isSummoningLock) return; // Prevent spamming/double clicks
    
    const currentGems = Number(scene.stats.gems) || 0;
    const cost = amount === 10 ? SUMMON_CONFIG.COST_X10 : SUMMON_CONFIG.COST_X30;

    if (currentGems < cost) {
        scene.cameras.main.shake(100, 0.005);
        return;
    }

    // Lock buttons for 0.2s
    scene.isSummoningLock = true;
    scene.time.delayedCall(200, () => {
        scene.isSummoningLock = false;
    });

    const pullRes = scene.summonManager.pull(category, amount, currentGems);
    if (pullRes.success) {
        scene.stats.gems -= pullRes.cost;
        scene.updateStats(scene.stats);
        scene.saveBaseStats();

        // Add to inventory
        pullRes.items.forEach(item => {
            scene.equipment.addItem(item);
        });
        scene.equipment.save();

        closeSummonMenu(scene);
        showSummonResults(scene, pullRes.items);
    }
}

function showSummonResults(scene, items) {
    const w = scene.scale.width;
    const h = scene.scale.height;
    const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.95).setInteractive().setDepth(3000);
    const container = scene.add.container(w / 2, h / 2).setDepth(3001);

    const title = scene.add.text(0, -250, 'SUMMON RESULTS', { fontSize: '32px', fill: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5);
    const okBtn = scene.add.rectangle(0, 260, 150, 50, 0x228833).setInteractive().setStrokeStyle(2, 0xffffff);
    const okText = scene.add.text(0, 260, 'OK', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);

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
        const itemBg = scene.add.rectangle(ix, iy, 75, 75, 0x222233).setStrokeStyle(2, rarityInfo.color).setScale(0);
        
        let icon;
        let targetScale = 1;
        if (item.texture) {
            icon = scene.add.sprite(ix, iy, item.texture, item.frame).setOrigin(0.5).setScale(0);
            // Based on 1024px height, scale to ~60px
            targetScale = 60 / 1024;
        } else {
            icon = scene.add.text(ix, iy, item.icon, { fontSize: '32px' }).setOrigin(0.5).setScale(0);
        }

        container.add([itemBg, icon]);

        scene.tweens.add({
            targets: itemBg,
            scale: 1,
            duration: 300,
            delay: i * 50,
            ease: 'Back.Out'
        });

        scene.tweens.add({
            targets: icon,
            scale: targetScale,
            duration: 300,
            delay: i * 50,
            ease: 'Back.Out'
        });
    });

    okBtn.on('pointerdown', () => {
        overlay.destroy();
        container.destroy();
        showSummonMenu(scene);
    });
}

/**
 * Ensures the summon menu is closed and references are cleared.
 */
export function closeSummonMenu(scene) {
    if (scene.summonMenuOverlay) {
        scene.summonMenuOverlay.destroy();
        scene.summonMenuOverlay = null;
    }
    if (scene.summonMenuPanel) {
        scene.summonMenuPanel.destroy();
        scene.summonMenuPanel = null;
    }
    scene.isSummonOpen = false;
}
