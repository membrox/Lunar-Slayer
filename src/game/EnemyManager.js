import { drawEnemyOnGraphics } from '../utils/DrawHelpers.js';

// Enemy type pools per stage tier
export const ENEMY_POOLS = [
    ['slime', 'bat'],
    ['slime', 'skeleton', 'bat'],
    ['skeleton', 'orc', 'bat'],
    ['orc', 'skeleton'],
    ['orc', 'skeleton'],
];

/**
 * Tries to spawn enemies up to the max simultaneous limit.
 * @param {Phaser.Scene} scene - The GameScene instance
 */
export function spawnEnemiesIfNeeded(scene) {
    if (scene.stageComplete || scene.gameOver || scene.bossSpawned) return;
    while (
        scene.activeEnemies < scene.maxSimultaneousEnemies &&
        scene.spawnedEnemyCount < scene.totalEnemies
    ) {
        spawnEnemy(scene);
    }
}

/**
 * Spawns a single enemy.
 * @param {Phaser.Scene} scene - The GameScene instance
 */
export function spawnEnemy(scene) {
    const h = scene.scale.height;
    const w = scene.scale.width;
    scene.spawnedEnemyCount++;
    scene.activeEnemies++;

    // Pick type
    const pool = ENEMY_POOLS[Math.min(scene.currentStage - 1, ENEMY_POOLS.length - 1)];
    const type = pool[Math.floor(Math.random() * pool.length)];
    const isBig = Math.random() > 0.55;

    const sizeMap = { slime: 44, skeleton: 50, bat: 36, orc: 56 };
    const size = sizeMap[type] || 44;
    const adjSize = isBig ? size * 1.25 : size;
    const baseHp = { slime: 28, skeleton: 38, bat: 22, orc: 55 }[type] || 30;
    const baseAtk = { slime: 5, skeleton: 8, bat: 6, orc: 12 }[type] || 5;

    const hp = Math.floor(baseHp * (isBig ? 1.5 : 1) * scene.enemyHpScale);
    const spawnX = w + 400 + Phaser.Math.Between(0, 150);
    const groundY = scene.groundY - (adjSize / 2);

    const container = scene.add.container(spawnX, groundY);

    const gfx = scene.add.graphics();
    drawEnemyOnGraphics(gfx, 0, 0, type, null);
    container.add(gfx);

    // HP bar (above enemy)
    const barW = adjSize * 1.1;
    const barBg = scene.add.rectangle(0, -adjSize / 2 - 14, barW, 7, 0x550000);
    const barFill = scene.add.rectangle(-barW / 2, -adjSize / 2 - 14, barW, 7, 0xff3333).setOrigin(0, 0.5);
    container.add([barBg, barFill]);

    // Physics rect (invisible)
    const physRect = scene.add.rectangle(spawnX, groundY, adjSize * 0.8, adjSize * 0.9, 0x000000, 0);
    scene.physics.add.existing(physRect);
    physRect.body.setCollideWorldBounds(false);

    const enemyBaseSpeed = 75; 
    physRect.body.setVelocityX(-enemyBaseSpeed);
    physRect.body.setAllowGravity(false);
    physRect.body.setImmovable(false);
    container.setData('baseSpeed', enemyBaseSpeed);
    scene.physics.add.collider(physRect, scene.platforms);

    container.setData('physRect', physRect);
    container.setData('gfx', gfx);
    container.setData('barFill', barFill);
    container.setData('hp', hp);
    container.setData('maxHp', hp);
    container.setData('alive', true);
    container.setData('goldValue', Phaser.Math.Between(isBig ? 6 : 2, isBig ? 18 : 8));
    container.setData('attack', Math.floor(baseAtk * (isBig ? 1.3 : 1) * scene.enemyAtkScale));
    container.setData('attackSpeed', 1200 + Phaser.Math.Between(-200, 200));
    container.setData('attackTimer', 0);
    container.setData('size', adjSize);
    container.setData('type', type);
    container.setData('isBoss', false);
    container.setData('barW', barW);

    scene.enemyList.push(container);

    // Entrance shrink-in
    container.setScale(0);
    scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.Out' });
}

/**
 * Spawns the stage boss.
 * @param {Phaser.Scene} scene - The GameScene instance
 */
export function spawnBoss(scene) {
    if (scene.bossSpawned) return;
    const h = scene.scale.height;
    const w = scene.scale.width;
    scene.bossSpawned = true;

    const s = scene.currentStage;
    const size = 90;
    const hp = Math.floor(300 * scene.enemyHpScale);
    const bossColors = [0xff1111, 0x880088, 0xff6600, 0x0066ff, 0xff0066];
    const col = bossColors[(s - 1) % bossColors.length];

    // Flash + zoom
    scene.cameras.main.flash(600, 200, 0, 0);
    scene.cameras.main.zoomTo(1.1, 600);
    scene.time.delayedCall(1500, () => scene.cameras.main.zoomTo(1, 600));

    const txt = scene.add.text(w / 2, h * 0.3, `⚠ BOSS ERSCHEINT ⚠\nStage ${s}`, {
        fontSize: '38px', fill: '#ff0000', fontFamily: 'Arial',
        fontStyle: 'bold', stroke: '#000', strokeThickness: 6,
        align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);
    scene.tweens.add({ targets: txt, alpha: 0, duration: 400, delay: 1800, onComplete: () => txt.destroy() });

    const container = scene.add.container(w + 600, scene.groundY - size / 2);
    const gfx = scene.add.graphics();
    drawEnemyOnGraphics(gfx, 0, 0, 'boss', col);
    container.add(gfx);

    const physRect = scene.add.rectangle(w + 600, scene.groundY - size / 2, size * 0.75, size * 0.95, 0x000000, 0);
    scene.physics.add.existing(physRect);
    physRect.body.setCollideWorldBounds(false);
    physRect.body.setVelocityX(-45);
    physRect.body.setAllowGravity(false);
    scene.physics.add.collider(physRect, scene.platforms);

    container.setData('baseSpeed', 45);
    container.setData('physRect', physRect);
    container.setData('gfx', gfx);
    container.setData('hp', hp);
    container.setData('maxHp', hp);
    container.setData('alive', true);
    container.setData('goldValue', Phaser.Math.Between(40, 80));
    container.setData('attack', Math.floor(22 * scene.enemyAtkScale));
    container.setData('attackSpeed', 1800);
    container.setData('attackTimer', 0);
    container.setData('size', size);
    container.setData('type', 'boss');
    container.setData('isBoss', true);
    container.setData('col', col);

    // Notify UIScene to reset boss health
    const ui = scene.scene.get('UIScene');
    if (ui && ui.showBossHP) ui.showBossHP(true);

    container.setScale(0);
    scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.Out' });

    scene.boss = container;
    scene.enemyList.push(container);
}

/**
 * Slows an enemy for a duration.
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Container} container
 * @param {number} duration
 */
export function slowEnemy(scene, container, duration) {
    const physRect = container.getData('physRect');
    if (!physRect || !physRect.body) return;
    const origVx = physRect.body.velocity.x || 0;
    physRect.body.setVelocityX(origVx * 0.35);
    container.setTint(0x88ccff);
    scene.time.delayedCall(duration, () => {
        if (container.active && physRect.active) {
            physRect.body.setVelocityX(origVx);
            container.clearTint();
        }
    });
}
