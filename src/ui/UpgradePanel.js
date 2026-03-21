/**
 * Upgrade definitions and row creation/buy logic.
 */

export const UPGRADE_DEFS = [
    { id: 'damage', name: 'Damage', baseCost: 3, increment: 2, scale: 1.15, icon: 'icon_damage' },
    { id: 'hp', name: 'HP', baseCost: 3, increment: 20, scale: 1.15, icon: 'icon_hp' },
    { id: 'hpRegen', name: 'HP Regen', baseCost: 9, increment: 1, scale: 1.2, icon: 'icon_regen' },
    { id: 'crit', name: 'Crit Rate', baseCost: 150, increment: 0.1, scale: 1.3, suffix: '%', icon: 'icon_crit_rate' },
    { id: 'critDamage', name: 'Crit Damage', baseCost: 300, increment: 0.1, scale: 1.4, suffix: 'x', icon: 'icon_crit_dmg' }
];

/**
 * Creates a single upgrade row in the dashboard.
 * @param {Phaser.Scene} scene - The UIScene instance
 * @param {object} upg - Upgrade definition from UPGRADE_DEFS
 * @param {number} x - Relative X position
 * @param {number} y - Relative Y position
 */
export function createUpgradeRow(scene, upg, x, y) {
    const w = scene.scale.width;
    const row = scene.add.container(x, y);
    scene.dashboardContainer.add(row);

    const level = scene.stats[upg.id + 'Level'] || 1;

    let iconImg = null;
    let iconScale = 1;
    if (upg.icon) {
        iconImg = scene.add.image(-295, 0, upg.icon).setOrigin(0.5);
        iconScale = 80 / Math.max(iconImg.width, iconImg.height);
        iconImg.setScale(iconScale);
        row.add(iconImg);
    }

    const labelX = -180;
    const title = scene.add.text(labelX, -14, `${upg.name} Lv.${level}`, {
        fontSize: '18px', fill: '#E0E0FF', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5, 0.5);
    row.add(title);

    let currentVal = upg.id === 'damage' ? scene.stats.attack : (upg.id === 'hp' ? scene.stats.maxHp : (scene.stats[upg.id] || 0));
    if (upg.id === 'critDamage') {
        const upgLevel = scene.stats.critDamageLevel || 1;
        currentVal = 1.5 + (upgLevel - 1) * 0.1;
    } else if (upg.id === 'crit') {
        const upgLevel = scene.stats.critLevel || 1;
        currentVal = 5.0 + (upgLevel - 1) * 1.0;
    }

    let nextVal = currentVal + upg.increment;
    const suffix = upg.suffix || '';
    const valText = scene.add.text(labelX, 14, `${currentVal.toFixed(1)}${suffix} -> ${nextVal.toFixed(1)}${suffix}`, {
        fontSize: '15px', fill: '#B0B0CC', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    row.add(valText);

    const costX = 270;
    const buyBtn = scene.add.rectangle(costX, 0, 140, 60, 0x000000, 0.01).setInteractive().setOrigin(0.5);

    const cost = Math.floor(upg.baseCost * Math.pow(upg.scale, level - 1));
    
    const costText = scene.add.text(costX, 0, `${cost}`, {
        fontSize: '18px', fill: '#FFD700', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5, 0.5);

    row.add([buyBtn, costText]);

    scene.upgradeUI[upg.id] = { title, valText, costText, buyBtn, costX };

    buyBtn.on('pointerdown', () => buyUpgrade(scene, upg.id));
    buyBtn.on('pointerover', () => { costText.setScale(1.1); });
    buyBtn.on('pointerout', () => { costText.setScale(1.0); });

    // Track upgrade elements for placement testbed
    const dashboardY = scene.dashboardY;
    if (iconImg) {
        scene.placementElements[`upg_icon_${upg.id}`] = {
            obj: iconImg, rowContainer: row,
            containerWorldX: w / 2, containerWorldY: dashboardY,
            rowRelX: x, rowRelY: y,
            innerDefaultX: -295, innerDefaultY: 0,
            type: 'upgrade'
        };
    }
    scene.placementElements[`upg_title_${upg.id}`] = {
        obj: title, rowContainer: row,
        containerWorldX: w / 2, containerWorldY: dashboardY,
        rowRelX: x, rowRelY: y,
        innerDefaultX: labelX, innerDefaultY: -14,
        type: 'upgrade'
    };
    scene.placementElements[`upg_val_${upg.id}`] = {
        obj: valText, rowContainer: row,
        containerWorldX: w / 2, containerWorldY: dashboardY,
        rowRelX: x, rowRelY: y,
        innerDefaultX: labelX, innerDefaultY: 14,
        type: 'upgrade'
    };
    scene.placementElements[`upg_cost_${upg.id}`] = {
        obj: costText, rowContainer: row,
        containerWorldX: w / 2, containerWorldY: dashboardY,
        rowRelX: x, rowRelY: y,
        innerDefaultX: costX, innerDefaultY: 0,
        type: 'upgrade'
    };
}

/**
 * Handles buying an upgrade.
 * @param {Phaser.Scene} scene - The UIScene instance
 * @param {string} id - Upgrade ID
 */
export function buyUpgrade(scene, id) {
    const stats = scene.stats;
    const upg = scene.upgrades.find(u => u.id === id);
    const levelKey = id + 'Level';
    const level = stats[levelKey] || 1;
    const cost = Math.floor(upg.baseCost * Math.pow(upg.scale, level - 1));

    if (stats.gold >= cost) {
        stats.gold -= cost;

        const game = scene.scene.get('GameScene');
        if (game && game.buyBaseUpgrade) {
            if (game.baseStats) game.baseStats.gold = stats.gold;
            game.buyBaseUpgrade(id, upg.increment);
        }

        const ui = scene.upgradeUI[id];
        scene.tweens.add({ targets: ui.buyBtn, scaleX: 1.05, scaleY: 1.05, duration: 80, yoyo: true });
    } else {
        scene.cameras.main.shake(100, 0.005);
    }
}
