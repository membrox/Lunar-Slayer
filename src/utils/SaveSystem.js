export class SaveSystem {
    static SAVE_KEY = 'lunar_slayer_save';

    static getDefaultStats() {
        return {
            hp: 100, maxHp: 100,
            mana: 100, maxMana: 100,
            xp: 0, level: 1,
            attack: 15, defense: 3,
            speed: 200, gold: 0,
            autoAttackSpeed: 800,
            className: 'Mage',
            classIndex: 1,
            damageLevel: 1,
            hpLevel: 1,
            hpRegenLevel: 1,
            critLevel: 1,
            gems: 0,
            emeralds: 0,
            stage: 1,
            maxStage: 1
        };
    }

    static save(data) {
        try {
            const json = JSON.stringify(data);
            localStorage.setItem(this.SAVE_KEY, json);
            // console.log('Game Saved');
        } catch (e) {
            console.error('Failed to save game:', e);
        }
    }

    static load() {
        try {
            const saved = localStorage.getItem(this.SAVE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...this.getDefaultStats(), ...parsed };
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
        return this.getDefaultStats();
    }

    static clear() {
        localStorage.removeItem(this.SAVE_KEY);
    }
}
