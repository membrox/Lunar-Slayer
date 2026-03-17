import { ITEM_DATABASE } from './EquipmentManager.js';

export const SUMMON_CONFIG = {
    COST_X10: 1000,
    COST_X30: 3000,
    XP_PER_PULL: 10,
    XP_TO_LEVEL: 500, // XP needed per level (e.g., Level 1 -> 2 needs 500 XP)
};

export const BANNER_WEIGHTS = {
    // Level 1: Common 90%, Rare 9%, Epic 1%
    1: { COMMON: 900, RARE: 90, EPIC: 10, MYTHIC: 0 },
    // Level 5: Common 70%, Rare 20%, Epic 8%, Mythic 2%
    5: { COMMON: 700, RARE: 200, EPIC: 80, MYTHIC: 20 },
    // Level 10: Common 50%, Rare 30%, Epic 15%, Mythic 5%
    10: { COMMON: 500, RARE: 300, EPIC: 150, MYTHIC: 50 }
};

export class SummonManager {
    constructor() {
        this.banners = {
            weapon: { level: 1, xp: 0 },
            shield: { level: 1, xp: 0 },
            necklace: { level: 1, xp: 0 },
            skill: { level: 1, xp: 0 }
        };
        this.load();
    }

    load() {
        const saved = localStorage.getItem('lunar_slayer_summon');
        if (saved) {
            this.banners = JSON.parse(saved);
        }
    }

    save() {
        localStorage.setItem('lunar_slayer_summon', JSON.stringify(this.banners));
    }

    getInterpolatedWeights(level) {
        // Simple linear interpolation between defined levels (1, 5, 10)
        const levels = Object.keys(BANNER_WEIGHTS).map(Number).sort((a,b) => a-b);
        let lower = levels[0];
        let upper = levels[levels.length - 1];

        for (let i = 0; i < levels.length; i++) {
            if (level <= levels[i]) {
                upper = levels[i];
                lower = levels[Math.max(0, i - 1)];
                break;
            }
        }

        if (lower === upper) return BANNER_WEIGHTS[lower];

        const ratio = (level - lower) / (upper - lower);
        const lowW = BANNER_WEIGHTS[lower];
        const highW = BANNER_WEIGHTS[upper];

        return {
            COMMON: Math.floor(lowW.COMMON + (highW.COMMON - lowW.COMMON) * ratio),
            RARE: Math.floor(lowW.RARE + (highW.RARE - lowW.RARE) * ratio),
            EPIC: Math.floor(lowW.EPIC + (highW.EPIC - lowW.EPIC) * ratio),
            MYTHIC: Math.floor(lowW.MYTHIC + (highW.MYTHIC - lowW.MYTHIC) * ratio)
        };
    }

    pull(category, amount, currentGems) {
        const cost = amount === 10 ? SUMMON_CONFIG.COST_X10 : SUMMON_CONFIG.COST_X30;
        if (currentGems < cost) return { success: false, reason: 'Nicht genügend Gems!' };

        const banner = this.banners[category];
        const weights = this.getInterpolatedWeights(banner.level);
        const results = [];

        for (let i = 0; i < amount; i++) {
            results.push(this.rollItem(category, weights));
        }

        // Increase XP
        banner.xp += amount * SUMMON_CONFIG.XP_PER_PULL;
        while (banner.xp >= SUMMON_CONFIG.XP_TO_LEVEL && banner.level < 10) {
            banner.xp -= SUMMON_CONFIG.XP_TO_LEVEL;
            banner.level++;
        }

        this.save();
        return { success: true, items: results, cost: cost };
    }

    rollItem(category, weights) {
        const total = weights.COMMON + weights.RARE + weights.EPIC + weights.MYTHIC;
        let roll = Math.random() * total;
        let rarity = 'COMMON';

        if (roll < weights.MYTHIC) rarity = 'MYTHIC';
        else if (roll < weights.MYTHIC + weights.EPIC) rarity = 'EPIC';
        else if (roll < weights.MYTHIC + weights.EPIC + weights.RARE) rarity = 'RARE';
        else rarity = 'COMMON';

        // Filter ITEM_DATABASE for matching type and rarity
        // If no mythic exists, fallback to epic, etc.
        let pool = ITEM_DATABASE.filter(item => item.rarity === rarity);
        if (pool.length === 0) pool = ITEM_DATABASE.filter(item => item.rarity === 'EPIC');
        if (pool.length === 0) pool = ITEM_DATABASE; // Universal fallback

        const item = pool[Math.floor(Math.random() * pool.length)];
        return JSON.parse(JSON.stringify(item));
    }
}
