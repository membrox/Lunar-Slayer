import { slowEnemy, spawnEnemiesIfNeeded, spawnBoss } from './EnemyManager.js';
import { triggerStageComplete } from './StageManager.js';

/**
 * Casts a skill by index.
 * @param {Phaser.Scene} scene - The GameScene instance
 * @param {number} index - Skill index (0-3)
 * @returns {boolean} Whether the skill was cast successfully
 */
export function castSkill(scene, index) {
    const skills = [
        { cost: 25, dmgMult: 2.5, range: 320, name: 'fire' },
        { cost: 30, dmgMult: 2.0, range: 260, name: 'ice', slow: true },
        { cost: 20, dmgMult: 1.8, range: 420, name: 'lightning' },
        { cost: 40, heal: true, name: 'heal' },
    ];
    const skill = skills[index];
    if (!skill || scene.playerStats.mana < skill.cost) return false;
    scene.playerStats.mana -= skill.cost;

    const px = scene.playerPhysics.x;
    const py = scene.playerPhysics.y;

    if (skill.heal) {
        const amount = Math.floor(scene.playerStats.maxHp * 0.3);
        scene.playerStats.hp = Math.min(scene.playerStats.maxHp, scene.playerStats.hp + amount);
        showDamageNumber(scene, px, py - 70, `+${amount} HP`, '#00ff88', 24);
        spawnHealEffect(scene, px, py);
        scene.cameras.main.flash(200, 0, 200, 80);
        return true;
    }

    spawnSkillEffect(scene, skill.name, px, py, skill.range, (e) => {
        const dmg = Math.floor(scene.playerStats.attack * skill.dmgMult);
        dealDamage(scene, e, dmg, skill.slow);
    });
    const flashColors = [[255, 80, 0], [0, 80, 255], [220, 220, 0], [0, 255, 100]];
    const fc = flashColors[index];
    scene.cameras.main.flash(120, fc[0], fc[1], fc[2]);
    return true;
}

function spawnSkillEffect(scene, name, px, py, range, hitCallback) {
    if (name === 'fire') {
        const fb = scene.add.graphics();
        fb.fillStyle(0xff4400);
        fb.fillCircle(0, 0, 16);
        fb.fillStyle(0xffaa00);
        fb.fillCircle(0, 0, 10);
        fb.fillStyle(0xffffff);
        fb.fillCircle(0, 0, 4);
        fb.x = px + 30; fb.y = py;
        let traveled = 0;
        const fired = new Set();
        scene.tweens.add({
            targets: fb, x: px + range, duration: 500, ease: 'Linear',
            onUpdate: () => {
                traveled = fb.x - px;
                scene.enemyList.forEach(e => {
                    if (!e || !e.active || !e.getData || !e.getData('alive') || fired.has(e)) return;
                    const d = Phaser.Math.Distance.Between(fb.x, py, e.x, e.y);
                    if (d < 50) { fired.add(e); hitCallback(e); }
                });
            },
            onComplete: () => {
                spawnExplosion(scene, fb.x, py, 0xff4400);
                fb.destroy();
            }
        });
    } else if (name === 'ice') {
        const g = scene.add.graphics();
        g.lineStyle(6, 0x88ddff, 1);
        g.strokeCircle(0, 0, 10);
        g.x = px; g.y = py;
        
        const iceSprite = scene.add.sprite(px, py, 'skill_sheet', 0).setScale(0).setAlpha(0.8);
        
        scene.tweens.add({
            targets: g, scaleX: range / 10, scaleY: range / 10, alpha: 0,
            duration: 600, ease: 'Cubic.Out',
            onComplete: () => g.destroy()
        });
        scene.tweens.add({
            targets: iceSprite, scale: 2, alpha: 0,
            duration: 500, ease: 'Back.Out',
            onComplete: () => iceSprite.destroy()
        });
        scene.enemyList.forEach(e => {
            if (!e || !e.active || !e.getData || !e.getData('alive')) return;
            const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
            if (d < range) { hitCallback(e); slowEnemy(scene, e, 1200); }
        });
    } else if (name === 'lightning') {
        const targets = scene.enemyList.filter(e => e && e.active && e.getData && e.getData('alive'));
        targets.forEach(e => {
            const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
            if (d > range) return;
            hitCallback(e);
            
            const bolt = scene.add.graphics();
            bolt.lineStyle(4, 0xFFFF00, 1);
            const ey = e.y - e.getData('size') / 2;
            
            const lSprite = scene.add.sprite(e.x, ey, 'skill_sheet', 1).setScale(1.5).setAlpha(1);
            scene.tweens.add({ targets: lSprite, alpha: 0, scale: 2, duration: 250, onComplete: () => lSprite.destroy() });

            bolt.beginPath();
            let lx = e.x + Phaser.Math.Between(-20, 20);
            bolt.moveTo(lx, 0);
            for (let seg = 1; seg <= 5; seg++) {
                lx += Phaser.Math.Between(-25, 25);
                bolt.lineTo(lx, (ey / 5) * seg);
            }
            bolt.strokePath();
            bolt.lineStyle(2, 0xffffff, 0.8);
            bolt.strokePath();
            scene.tweens.add({ targets: bolt, alpha: 0, duration: 300, onComplete: () => bolt.destroy() });
            scene.cameras.main.shake(80, 0.004);
        });
    }
}

function spawnHealEffect(scene, x, y) {
    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const heart = scene.add.sprite(x, y, 'skill_sheet', 2).setScale(0.5);
        scene.tweens.add({
            targets: heart,
            x: x + Math.cos(angle) * 80,
            y: y + Math.sin(angle) * 80,
            alpha: 0, scaleX: 0, scaleY: 0,
            duration: 800, ease: 'Cubic.Out',
            onComplete: () => heart.destroy()
        });
    }
}

/**
 * Spawns an explosion particle effect.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} color
 */
export function spawnExplosion(scene, x, y, color) {
    for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(40, 120);
        const p = scene.add.circle(x, y, Phaser.Math.Between(3, 8), color);
        scene.tweens.add({
            targets: p,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0, scaleX: 0, scaleY: 0,
            duration: Phaser.Math.Between(300, 600),
            onComplete: () => p.destroy()
        });
    }
}

/**
 * Deals damage to an enemy container.
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Container} container
 * @param {number} dmg
 * @param {boolean} isSlow
 */
export function dealDamage(scene, container, dmg, isSlow = false) {
    if (!container || !container.active || (container.getData && !container.getData('alive'))) return;

    const critRate = 0.05 + (scene.playerStats.critLevel - 1) * 0.01;
    const critMult = 1.5 + (scene.playerStats.critDamageLevel - 1) * 0.1;
    
    const isCrit = Math.random() < critRate;
    const finalDmg = Math.floor(isCrit ? dmg * critMult : dmg);

    const currentHp = container.getData('hp') || 0;
    const newHp = Math.max(0, currentHp - finalDmg);
    
    if (isNaN(newHp)) return;
    
    container.setData('hp', newHp);
    const maxHp = container.getData('maxHp') || 100;

    const dmgColor = isCrit ? '#ff0000' : '#ffffff';
    const prefix = isCrit ? '💥 ' : '';
    showDamageNumber(scene, container.x, container.y - (container.getData('size') || 40) / 2 - 20,
        prefix + Math.floor(finalDmg), dmgColor, isCrit ? 26 : 18);

    if (container.getData('isBoss')) {
        const ui = scene.scene.get('UIScene');
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

    const gfx = container.getData('gfx');
    if (gfx && gfx.active) {
        gfx.setAlpha(0.5);
        scene.time.delayedCall(80, () => {
            if (gfx && gfx.active) gfx.setAlpha(1);
        });
    }

    if (newHp <= 0) killEnemy(scene, container);
}

/**
 * Kills an enemy and handles rewards/progression.
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Container} container
 */
export function killEnemy(scene, container) {
    container.setData('alive', false);
    const gold = container.getData('goldValue');
    const isBoss = container.getData('isBoss');
    scene.playerStats.gold += gold;
    
    const ex = container.x;
    const ey = container.y;

    showDamageNumber(scene, ex, ey - 50, `+${gold}G`, '#FFD700', 18);

    spawnExplosion(scene, ex, ey, 0xff6600);

    const physRect = container.getData('physRect');
    if (physRect) physRect.destroy();

    if (isBoss) {
        const ui = scene.scene.get('UIScene');
        if (ui && ui.showBossHP) ui.showBossHP(false);
    }

    scene.tweens.add({
        targets: container, scaleX: 0, scaleY: 0, alpha: 0, duration: 250,
        ease: 'Back.In', onComplete: () => container.destroy()
    });

    scene.enemyList = scene.enemyList.filter(x => x !== container);

    if (isBoss) {
        triggerStageComplete(scene);
    } else {
        scene.activeEnemies = Math.max(0, scene.activeEnemies - 1);
        scene.enemiesKilled++;

        if (scene.spawnedEnemyCount >= scene.totalEnemies && scene.activeEnemies === 0) {
            scene.time.delayedCall(600, () => spawnBoss(scene));
        } else {
            scene.time.delayedCall(400, () => spawnEnemiesIfNeeded(scene));
        }
    }
}

/**
 * Shows a floating damage number.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} text
 * @param {string} color
 * @param {number} size
 */
export function showDamageNumber(scene, x, y, text, color, size = 18) {
    const t = scene.add.text(x, y, String(text), {
        fontSize: `${size}px`, fill: color, fontFamily: 'Arial',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);
    scene.tweens.add({
        targets: t, y: y - 60, alpha: 0, duration: 1100,
        ease: 'Cubic.Out', onComplete: () => t.destroy()
    });
}
