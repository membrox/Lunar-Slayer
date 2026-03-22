import { EquipmentManager, RARITIES } from '../utils/EquipmentManager.js';

/**
 * Shows the equipment menu overlay.
 * @param {Phaser.Scene} scene - The UIScene instance
 */
export function showEquipmentMenu(scene) {
    if (scene.isEquipmentOpen) return;
    scene.isEquipmentOpen = true;

    const w = scene.scale.width;
    const h = scene.scale.height;

    const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setInteractive().setDepth(2000);
    const panel = scene.add.container(w / 2, h / 2).setDepth(2001);

    const bg = scene.add.rectangle(0, 0, 720, 900, 0x1a1a2e).setStrokeStyle(4, 0x444466);
    const title = scene.add.text(0, -360, 'EQUIPMENT', { fontSize: '32px', fill: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const closeBtn = scene.add.text(330, -355, '✕', { fontSize: '28px', fill: '#ff4444' }).setOrigin(0.5).setInteractive();

    // Show Enhancement Stones at the top right of the modal, next to close button
    const stonesVal = scene.stats.enhancementStones || 0;
    const stonesTxt = scene.add.text(280, -360, `🪨 ${stonesVal}`, { 
        fontSize: '20px', 
        fill: '#ecf0f1', 
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 2
    }).setOrigin(1, 0.5);
    panel.add([bg, title, closeBtn, stonesTxt]);

    closeBtn.on('pointerdown', () => {
        overlay.destroy();
        panel.destroy();
        scene.isEquipmentOpen = false;
    });

    // Current filter
    scene.currentEquipTab = scene.currentEquipTab || 'weapon';
    scene.selectedInventoryId = scene.selectedInventoryId || 'wpn_01';

    // ── Top Detail Panel ──────────────────────────────────────────────────
    renderDetailPanel(scene, panel);

    // ── Tabs ──────────────────────────────────────────────────────────────
    const tabs = [
        { id: 'weapon', name: 'Weapon' },
        { id: 'shield', name: 'Shield' },
        { id: 'necklace', name: 'Necklace' }
    ];

    tabs.forEach((tab, i) => {
        const tx = -200 + i * 200;
        const ty = 380;
        const btn = scene.add.rectangle(tx, ty, 180, 50, scene.currentEquipTab === tab.id ? 0x444466 : 0x222233).setInteractive();
        const txt = scene.add.text(tx, ty, tab.name, { fontSize: '18px', fill: '#fff' }).setOrigin(0.5);
        btn.on('pointerdown', () => {
            scene.currentEquipTab = tab.id;
            refreshEquipmentMenu(scene, panel);
        });
        panel.add([btn, txt]);
    });

    // ── Bottom Action Buttons ─────────────────────────────────────────────
    const btnW = 210;
    const btnY = 320;

    const summonBtn = scene.add.rectangle(-230, btnY, btnW, 60, 0xd35400).setInteractive();
    const summonTxt = scene.add.text(-230, btnY, 'Summon', { fontSize: '20px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    panel.add([summonBtn, summonTxt]);
    summonBtn.on('pointerdown', () => {
        overlay.destroy();
        panel.destroy();
        scene.isEquipmentOpen = false;
        scene.showSummonMenu();
    });

    const enhanceAllBtn = scene.add.rectangle(0, btnY, btnW, 60, 0x27ae60).setInteractive();
    const enhanceAllTxt = scene.add.text(0, btnY, 'Enhance All', { fontSize: '20px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    panel.add([enhanceAllBtn, enhanceAllTxt]);
    enhanceAllBtn.on('pointerdown', () => {
        const res = scene.equipment.stoneEnhanceAll(scene.stats.enhancementStones);
        if (res.changed) {
            scene.stats.enhancementStones -= res.totalSpent;
            refreshEquipmentMenu(scene, panel);
            syncGameSceneStats(scene);
        }
    });

    const mergeAllBtn = scene.add.rectangle(230, btnY, btnW, 60, 0x2980b9).setInteractive();
    const mergeAllTxt = scene.add.text(230, btnY, 'Alle Verschmelzen', { fontSize: '20px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    panel.add([mergeAllBtn, mergeAllTxt]);
    mergeAllBtn.on('pointerdown', () => {
        if (scene.equipment.mergeAll()) {
            refreshEquipmentMenu(scene, panel);
            syncGameSceneStats(scene);
        }
    });

    // ── Grid System ───────────────────────────────────────────────────────
    renderInventoryGrid(scene, panel);
}

function renderDetailPanel(scene, panel) {
    const id = scene.selectedInventoryId;
    const invItem = scene.equipment.inventory[id];
    const dbItem = scene.equipment.getItemById(id);
    if (!invItem || !dbItem) return;

    const detailBg = scene.add.rectangle(0, -250, 680, 280, 0x111122).setStrokeStyle(2, 0x444466);
    panel.add(detailBg);

    // Big Icon
    const rarity = RARITIES[dbItem.rarity];
    const iconBg = scene.add.rectangle(-250, -250, 140, 140, 0x000000, 0.5).setStrokeStyle(3, rarity.color);
    const icon = scene.add.text(-250, -260, dbItem.icon, { fontSize: '80px' }).setOrigin(0.5);

    const lvlLabel = scene.add.text(-310, -195, `Lv.${invItem.plusLevel || 0}`, { fontSize: '20px', fill: '#fff', fontStyle: 'bold' });

    // Equipped marker
    if (scene.equipment.isEquipped(id)) {
        const eFlag = scene.add.text(-195, -310, 'E', { fontSize: '24px', fill: '#f00', fontStyle: 'bold', backgroundColor: '#fff', padding: 2 });
        panel.add(eFlag);
    }

    // Stats
    const name = scene.add.text(-160, -320, dbItem.name, { fontSize: '28px', fill: '#fff', fontStyle: 'bold' });
    const rarityName = scene.add.text(320, -320, rarity.name, { fontSize: '18px', fill: rarity.colorStr }).setOrigin(1, 0);

    const posEffect = scene.add.text(-160, -280, 'Possession Effect:', { fontSize: '14px', fill: '#fa0' });
    let posStr = '';
    if (dbItem.type === 'weapon') {
        const basePos = (dbItem.baseStats.attack || 0);
        posStr = `Damage: +${(basePos * 1.0).toFixed(1)}%`;
    } else {
        Object.keys(dbItem.baseStats).forEach(k => {
            posStr += `${k}: +${(dbItem.baseStats[k] * 0.01 * invItem.level).toFixed(1)}  `;
        });
    }
    const posVal = scene.add.text(-160, -260, posStr, { fontSize: '18px', fill: '#2ecc71' });

    const eqEffect = scene.add.text(-160, -220, 'Equipped Effect:', { fontSize: '14px', fill: '#fa0' });
    let eqStr = '';
    if (dbItem.type === 'weapon') {
        const baseEq = (dbItem.baseStats.attack || 0); // Base from item
        const plusEq = (invItem.plusLevel || 0) * 5; // +5% per Gold level
        eqStr = `Damage: +${(baseEq * 10.0).toFixed(1)}% (+${plusEq}% Enhance)`;
    } else {
        const mult = 1 + (invItem.level - 1) * 0.2;
        Object.keys(dbItem.baseStats).forEach(k => {
            eqStr += `${k}: +${(dbItem.baseStats[k] * mult).toFixed(1)}  `;
        });
    }
    const eqVal = scene.add.text(-160, -200, eqStr, { fontSize: '18px', fill: '#2ecc71' });

    // Action Buttons
    const equipBtn = scene.add.rectangle(-50, -150, 180, 50, 0x2980b9).setInteractive();
    const equipTxt = scene.add.text(-50, -150, scene.equipment.isEquipped(id) ? 'Unequip' : 'Equip', { fontSize: '18px', fill: '#fff' }).setOrigin(0.5);
    equipBtn.on('pointerdown', () => {
        if (scene.equipment.isEquipped(id)) {
            const slot = Object.keys(scene.equipment.equipped).find(k => scene.equipment.equipped[k] && scene.equipment.equipped[k].id === id);
            scene.equipment.unequip(slot);
        } else {
            let targetSlot = dbItem.type;
            if (dbItem.type === 'ring') targetSlot = scene.equipment.equipped.ring1 ? 'ring2' : 'ring1';
            scene.equipment.equip(id, targetSlot);
        }
        refreshEquipmentMenu(scene, panel);
        syncGameSceneStats(scene);
    });

    // We removed individual Stone Enhancement from the Detail Panel as requested (1:1 Logic)
    // But we still need a button for Synthesis (Verschmelzen)
    const enhanceBtn = scene.add.rectangle(150, -150, 180, 50, 0x27ae60).setInteractive();
    const canMerge = invItem.count >= 100 && dbItem.nextId;
    const enhanceTxt = scene.add.text(150, -150, `Verschmelzen (100)`, { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);
    if (!canMerge) enhanceBtn.setAlpha(0.5);
    
    enhanceBtn.on('pointerdown', () => {
        if (canMerge) {
            if (scene.equipment.mergeItem(id)) {
                refreshEquipmentMenu(scene, panel);
                syncGameSceneStats(scene);
            }
        } else {
            // Optional: feedback why it failed
            console.log("Need 100 copies for Synthesis!");
        }
    });

    // Synthesis Progress (Detail)
    const mergeCost = 100;
    const barW = 120;
    const xpBg = scene.add.rectangle(-250, -165, barW, 14, 0x000000).setOrigin(0.5);
    const ratio = Math.min(1, invItem.count / mergeCost);
    const xpFill = scene.add.rectangle(-250 - barW / 2, -165, barW * ratio, 14, 0x3498db).setOrigin(0, 0.5);
    const xpText = scene.add.text(-250, -150, `${invItem.count}/100 total`, { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);

    panel.add([iconBg, icon, lvlLabel, name, rarityName, posEffect, posVal, eqEffect, eqVal, equipBtn, equipTxt, enhanceBtn, enhanceTxt, xpBg, xpFill, xpText]);
}

function renderInventoryGrid(scene, panel) {
    const gridStartX = -260;
    const gridStartY = -50;
    const spacing = 130;
    const cols = 5;

    const filtered = Object.values(scene.equipment.inventory).filter(invItem => {
        const db = scene.equipment.getItemById(invItem.id);
        if (!db) return false;
        if (scene.currentEquipTab === 'weapon') return db.type === 'weapon';
        if (scene.currentEquipTab === 'shield') return db.type === 'shield' || db.type === 'armor';
        if (scene.currentEquipTab === 'necklace') return db.type === 'accessory' || db.type === 'ring';
        return false;
    });

    filtered.forEach((invItem, i) => {
        const db = scene.equipment.getItemById(invItem.id);
        const r = i % cols;
        const c = Math.floor(i / cols);
        const x = gridStartX + r * spacing;
        const y = gridStartY + c * spacing;

        const rarity = RARITIES[db.rarity];
        const slot = scene.add.rectangle(x, y, 120, 120, 0x222233).setStrokeStyle(3, scene.selectedInventoryId === db.id ? 0xffffff : rarity.color).setInteractive();
        const icon = scene.add.text(x, y - 10, db.icon, { fontSize: '50px' }).setOrigin(0.5);

        const lvl = scene.add.text(x - 50, y + 40, `Lv.${invItem.plusLevel || 0}`, { fontSize: '14px', fill: '#fff' });
        // const plusTxt = scene.add.text(x + 20, y + 35, `+${invItem.plusLevel || 0}`, { fontSize: '18px', fill: '#2ecc71', fontStyle: 'bold' }); // Removing the extra badge to keep it clean as per "Lv.X" request

        // Enhance Progress Bar
        const cost = rarity.enhanceCost; // 100 total
        const barW = 110;
        const pBg = scene.add.rectangle(x, y + 55, barW, 10, 0x000000);
        const ratio = Math.min(1, invItem.count / cost);
        const pFill = scene.add.rectangle(x - barW / 2, y + 55, barW * ratio, 10, 0x3498db).setOrigin(0, 0.5);
        const pText = scene.add.text(x, y + 55, `${invItem.count}/${cost}`, { fontSize: '10px', fill: '#fff' }).setOrigin(0.5);

        if (scene.equipment.isEquipped(db.id)) {
            const eColor = scene.add.text(x + 40, y - 50, 'E', { fontSize: '16px', fill: '#f00', backgroundColor: '#fff', padding: 2 });
            panel.add(eColor);
        }

        slot.on('pointerdown', () => {
            scene.selectedInventoryId = db.id;
            refreshEquipmentMenu(scene, panel);
        });

        panel.add([slot, icon, lvl, pBg, pFill, pText]);
    });
}

function refreshEquipmentMenu(scene, panel) {
    if (!panel) return;

    const overlay = scene.children.list.find(c => c.type === 'Rectangle' && c.width === scene.scale.width && c.fillAlpha === 0.85);
    if (overlay) overlay.destroy();
    if (panel) panel.destroy();

    scene.isEquipmentOpen = false;
    showEquipmentMenu(scene);
}

/**
 * Shows an item tooltip near the pointer.
 * @param {Phaser.Scene} scene
 * @param {object} item
 * @param {Phaser.Input.Pointer} pointer
 */
export function showItemTooltip(scene, item, pointer) {
    if (scene.tooltip) scene.tooltip.destroy();

    const rarityInfo = RARITIES[item.rarity];
    const w = 240;
    const h = 200;

    const tx = Math.min(pointer.x + 20, scene.scale.width - w - 20);
    const ty = Math.min(pointer.y + 20, scene.scale.height - h - 20);

    const container = scene.add.container(tx, ty);

    const bg = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.95).setStrokeStyle(2, rarityInfo.color);
    const name = scene.add.text(10, 10, item.name, { fontSize: '18px', fill: rarityInfo.colorStr, fontStyle: 'bold' });
    const rarityText = scene.add.text(10, 35, rarityInfo.name, { fontSize: '12px', fill: rarityInfo.colorStr });
    const line = scene.add.rectangle(w / 2, 55, w - 20, 1, 0x444444);

    let statsStr = '';
    Object.keys(item.stats).forEach(k => {
        let val = item.stats[k];
        let sign = val > 0 ? '+' : '';
        statsStr += `${k.toUpperCase()}: ${sign}${val}\n`;
    });
    const stats = scene.add.text(10, 65, statsStr, { fontSize: '14px', fill: '#ffffff', lineSpacing: 5 });

    const flavor = scene.add.text(10, h - 45, item.flavor, { fontSize: '11px', fill: '#aaa', fontStyle: 'italic', wordWrap: { width: w - 20 } });

    container.add([bg, name, rarityText, line, stats, flavor]);
    container.setDepth(2000);
    scene.tooltip = container;
}

/**
 * Hides the item tooltip.
 * @param {Phaser.Scene} scene
 */
export function hideItemTooltip(scene) {
    if (scene.tooltip) {
        scene.tooltip.destroy();
        scene.tooltip = null;
    }
}

/**
 * Syncs equipment stats back to the GameScene.
 * @param {Phaser.Scene} scene
 */
export function syncGameSceneStats(scene) {
    const game = scene.scene.get('GameScene');
    if (game && game.playerStats) {
        scene.updateStats(game.playerStats, game.currentStage);
    }
    if (game && game.applyEquipmentStats) {
        game.applyEquipmentStats();
    }
}
