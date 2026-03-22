import { ITEM_DATABASE } from './EquipmentManager.js';

export const SUMMON_CONFIG = {
    COST_X10: 1000,
    COST_X30: 3000,
    PULL_PROGRESS: 10,
    PROGRESS_TO_LEVEL: 500, // Progress needed per level (e.g., Level 1 -> 2 needs 500 Progress)
};

export const BANNER_WEIGHTS = {
    // Level 1: Uncommon 100%
    1: { UNCOMMON: 1000, NORMAL: 0, MAGIC: 0, RARE: 0, EPIC: 0, LEGENDARY: 0, MYTH: 0 },
    // Level 3: Uncommon 70%, Normal 25%, Magic 5%
    3: { UNCOMMON: 700, NORMAL: 250, MAGIC: 50, RARE: 0, EPIC: 0, LEGENDARY: 0, MYTH: 0 },
    // Level 5: Uncommon 50%, Normal 30%, Magic 15%, Rare 5%
    5: { UNCOMMON: 500, NORMAL: 300, MAGIC: 150, RARE: 50, EPIC: 0, LEGENDARY: 0, MYTH: 0 },
    // Level 7: Uncommon 30%, Normal 35%, Magic 20%, Rare 10%, Epic 5%
    7: { UNCOMMON: 300, NORMAL: 350, MAGIC: 200, RARE: 100, EPIC: 50, LEGENDARY: 0, MYTH: 0 },
    // Level 10: Uncommon 20%, Normal 30%, Magic 25%, Rare 15%, Epic 7%, Legendary 3%
    10: { UNCOMMON: 200, NORMAL: 300, MAGIC: 250, RARE: 150, EPIC: 70, LEGENDARY: 30, MYTH: 0 }
};

export class SummonManager {
    constructor() {
        this.banners = {
            weapon: { level: 1, progress: 0 },
            shield: { level: 1, progress: 0 },
            necklace: { level: 1, progress: 0 },
            skill: { level: 1, progress: 0 }
        };
        this.load();
    }

    load() {
        const saved = localStorage.getItem('lunar_slayer_summon_v2');
        if (saved) {
            this.banners = JSON.parse(saved);
        }
    }

    save() {
        localStorage.setItem('lunar_slayer_summon_v2', JSON.stringify(this.banners));
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

        const out = {};
        Object.keys(lowW).forEach(rarity => {
            out[rarity] = Math.floor(lowW[rarity] + (highW[rarity] - lowW[rarity]) * ratio);
        });
        return out;
    }

    pull(category, amount, currentGems) {
        const cost = amount === 10 ? SUMMON_CONFIG.COST_X10 : SUMMON_CONFIG.COST_X30;
        if (currentGems < cost) return { success: false, reason: 'Nicht genügend Gems!' };

        const banner = this.banners[category];
        let weights = this.getInterpolatedWeights(banner.level);

        // Apply Batch Bonus (10 in a row or 30 in a row)
        if (amount === 10 || amount === 30) {
            const mult = amount === 10 ? 1.5 : 3.0;
            weights = JSON.parse(JSON.stringify(weights));
            // Boost all except lowest (UNCOMMON)
            Object.keys(weights).forEach(k => {
                if (k !== 'UNCOMMON' && weights[k] > 0) {
                    weights[k] = Math.floor(weights[k] * mult);
                }
            });
        }

        const results = [];
        for (let i = 0; i < amount; i++) {
            results.push(this.rollItem(category, weights));
        }

        // Increase progress
        banner.progress += amount * SUMMON_CONFIG.PULL_PROGRESS;
        while (banner.progress >= SUMMON_CONFIG.PROGRESS_TO_LEVEL && banner.level < 10) {
            banner.progress -= SUMMON_CONFIG.PROGRESS_TO_LEVEL;
            banner.level++;
        }

        this.save();
        return { success: true, items: results, cost: cost };
    }

    rollItem(category, weights) {
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let roll = Math.random() * total;

        let rarity = 'UNCOMMON';
        let acc = 0;
        // Search from highest to lowest
        const orderedRarities = ['MYTH', 'LEGENDARY', 'EPIC', 'RARE', 'MAGIC', 'NORMAL', 'UNCOMMON'];
        for (const r of orderedRarities) {
            acc += (weights[r] || 0);
            if (roll < acc) {
                rarity = r;
                break;
            }
        }

        // Filter ITEM_DATABASE for matching type and rarity
        // If no mythic exists, fallback to epic, etc.
        let pool = ITEM_DATABASE.filter(item => item.rarity === rarity);
        if (pool.length === 0) pool = ITEM_DATABASE.filter(item => item.rarity === 'EPIC');
        if (pool.length === 0) pool = ITEM_DATABASE; // Universal fallback

        const item = pool[Math.floor(Math.random() * pool.length)];
        return JSON.parse(JSON.stringify(item));
    }
}
