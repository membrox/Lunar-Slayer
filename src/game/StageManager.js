import { SaveSystem } from '../utils/SaveSystem.js';
import { showDamageNumber } from './CombatManager.js';

/**
 * Handles stage completion: rewards, save, and transition.
 * @param {Phaser.Scene} scene - The GameScene instance
 */
export function triggerStageComplete(scene) {
    if (scene.stageComplete) return;
    scene.stageComplete = true;
    scene.playerPhysics.body.setVelocityX(0);
    scene.cameras.main.flash(700, 255, 220, 0);

    showDamageNumber(scene, scene.playerPhysics.x, scene.playerPhysics.y - 80, 'STAGE GESCHAFFT!', '#FFD700', 32);
    
    // Stage Reward: 1000 Gems
    scene.baseStats.gems += 1000;
    scene.baseStats.stage = scene.currentStage + 1;
    scene.baseStats.maxStage = Math.max(scene.baseStats.maxStage || 1, scene.baseStats.stage);
    scene.baseStats.gold = Math.floor(scene.playerStats.gold);
    
    SaveSystem.save(scene.baseStats);

    scene.time.delayedCall(300, () => {
        showDamageNumber(scene, scene.playerPhysics.x, scene.playerPhysics.y - 130, '+1000 💎', '#00ffff', 28);
    });

    scene.time.delayedCall(1200, () => {
        scene.scene.stop('UIScene');
        scene.cameras.main.fadeOut(400, 0, 0, 0);
        scene.cameras.main.once('camerafadeoutcomplete', () => {
            scene.scene.start('GameScene', { 
                stage: scene.baseStats.stage, 
                baseStats: scene.baseStats 
            });
        });
    });
}

/**
 * Jumps to a specified stage.
 * @param {Phaser.Scene} scene - The GameScene instance
 * @param {number} s - Stage number
 */
export function jumpToStage(scene, s) {
    if (scene.stageComplete) return;
    scene.baseStats.stage = s;
    scene.baseStats.maxStage = Math.max(scene.baseStats.maxStage || 1, s);
    scene.baseStats.gold = Math.floor(scene.playerStats.gold);
    
    SaveSystem.save(scene.baseStats);

    scene.scene.stop('UIScene');
    scene.cameras.main.fadeOut(400, 0, 0, 0);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
        scene.scene.start('GameScene', { 
            stage: s, 
            baseStats: scene.baseStats 
        });
    });
}

/**
 * Triggers a stage reset (player death).
 * @param {Phaser.Scene} scene - The GameScene instance
 */
export function triggerStageReset(scene) {
    if (scene.gameOver) return;
    scene.gameOver = true;
    scene.isWalking = false;
    if (scene.playerPhysics.body) scene.playerPhysics.body.setVelocityX(0);

    if (scene.playerSprite && scene.playerSprite.active) {
        scene.playerSprite.play(`${scene.playerStats.selectedGender}_death`, true);
    }

    scene.cameras.main.shake(600, 0.015);
    scene.cameras.main.flash(500, 255, 0, 0);

    scene.time.delayedCall(1500, () => {
        scene.scene.stop('UIScene');
        scene.cameras.main.fadeOut(400, 0, 0, 0);
        scene.cameras.main.once('camerafadeoutcomplete', () => {
            scene.scene.start('GameScene', {
                stage: scene.currentStage,
                baseStats: scene.baseStats
            });
        });
    });
}

/**
 * Buys a base stat upgrade.
 * @param {Phaser.Scene} scene - The GameScene instance
 * @param {string} id - Upgrade ID
 * @param {number} increment - Upgrade increment value
 */
export function buyBaseUpgrade(scene, id, increment) {
    if (!scene.baseStats) return;
    
    if (id === 'damage') {
        scene.baseStats.attack += increment;
        scene.baseStats.damageLevel = (scene.baseStats.damageLevel || 1) + 1;
    } else if (id === 'hp') {
        scene.baseStats.maxHp += increment;
        scene.baseStats.hp += increment;
        scene.baseStats.hpLevel = (scene.baseStats.hpLevel || 1) + 1;
    } else if (id === 'hpRegen') {
        scene.baseStats.hpRegen = (scene.baseStats.hpRegen || 0) + increment;
        scene.baseStats.hpRegenLevel = (scene.baseStats.hpRegenLevel || 1) + 1;
    } else if (id === 'crit') {
        scene.baseStats.crit = (scene.baseStats.crit || 0.05) + increment;
        scene.baseStats.critLevel = (scene.baseStats.critLevel || 1) + 1;
    } else if (id === 'critDamage') {
        scene.baseStats.critDamageLevel = (scene.baseStats.critDamageLevel || 1) + 1;
    }

    scene.baseStats.gold = scene.playerStats.gold;

    applyEquipmentStats(scene);
    
    SaveSystem.save(scene.baseStats);
}

/**
 * Applies equipment bonuses on top of base stats.
 * @param {Phaser.Scene} scene - The GameScene instance
 * @param {boolean} isInitial - Whether this is the initial application
 */
export function applyEquipmentStats(scene, isInitial = false) {
    if (!scene.equipment || !scene.baseStats) return;
    
    const bonuses = scene.equipment.getAllBonuses();
    const flat = bonuses.flat;
    const mult = bonuses.mult;
    
    scene.playerStats.attack = (scene.baseStats.attack + (flat.attack || 0)) * (mult.attack || 1);
    scene.playerStats.maxHp = (scene.baseStats.maxHp + (flat.hp || 0)) * (mult.hp || 1);
    scene.playerStats.maxMana = (scene.baseStats.maxMana + (flat.mana || 0)) * (mult.mana || 1);
    scene.playerStats.defense = (scene.baseStats.defense + (flat.defense || 0)) * (mult.defense || 1);
    
    scene.playerStats.hpRegen = (scene.baseStats.hpRegen || 0) + (flat.hpRegen || 0) + (mult.hpRegen || 0);
    scene.playerStats.crit = (scene.baseStats.crit || 0.05) + (flat.crit || 0) + (mult.crit || 0);
    
    if (isInitial) {
        scene.playerStats.hp = scene.playerStats.maxHp;
        scene.playerStats.mana = scene.playerStats.maxMana;
    } else {
        scene.playerStats.hp = Math.min(scene.playerStats.hp, scene.playerStats.maxHp);
        scene.playerStats.mana = Math.min(scene.playerStats.mana, scene.playerStats.maxMana);
    }
    
    scene.playerStats.damageLevel = scene.baseStats.damageLevel;
    scene.playerStats.hpLevel = scene.baseStats.hpLevel;
    scene.playerStats.hpRegenLevel = scene.baseStats.hpRegenLevel;
    scene.playerStats.critLevel = scene.baseStats.critLevel;
    scene.playerStats.critDamageLevel = scene.baseStats.critDamageLevel;
    scene.playerStats.gold = scene.baseStats.gold;
    
    scene.updateEquipmentVisuals();
    
    const ui = scene.scene.get('UIScene');
    if (ui && ui.updateStats) {
        ui.updateStats(scene.playerStats, scene.currentStage, scene.enemiesKilled, scene.totalEnemies);
    }
}
