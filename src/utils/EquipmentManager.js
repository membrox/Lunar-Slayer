import { SaveSystem } from './SaveSystem.js';

export const RARITIES = {
    COMMON: { name: 'Normal', color: 0x9e9e9e, colorStr: '#9e9e9e', enhanceCost: 2 },
    UNCOMMON: { name: 'Uncommon', color: 0x4caf50, colorStr: '#4caf50', enhanceCost: 3 },
    RARE: { name: 'Rare', color: 0x2196f3, colorStr: '#2196f3', enhanceCost: 5 },
    EPIC: { name: 'Epic', color: 0x9c27b0, colorStr: '#9c27b0', enhanceCost: 10 },
    MYTHIC: { name: 'Mythic', color: 0xff4444, colorStr: '#ff4444', enhanceCost: 20 },
    LEGENDARY: { name: 'Legendary', color: 0xff9800, colorStr: '#ff9800', enhanceCost: 50 }
};

export const ITEM_DATABASE = [
    { id: 'wpn_01', name: 'Holzstab', type: 'weapon', rarity: 'COMMON', baseStats: { attack: 5 }, flavor: 'Ein einfacher Stock.', icon: '🪄' },
    { id: 'wpn_02', name: 'Mondstab', type: 'weapon', rarity: 'RARE', baseStats: { attack: 15, mana: 20 }, flavor: 'Kanalisiert Mondlicht.', icon: '🌙' },
    { id: 'arm_01', name: 'Leinenrobe', type: 'armor', rarity: 'COMMON', baseStats: { hp: 20, defense: 2 }, flavor: 'Einfacher Stoff.', icon: '🧥' },
    { id: 'arm_02', name: 'Magierrobe', type: 'armor', rarity: 'UNCOMMON', baseStats: { hp: 50, defense: 5 }, flavor: 'Verstärkte Robe.', icon: '👘' },
    { id: 'ring_01', name: 'Glücksring', type: 'ring', rarity: 'UNCOMMON', baseStats: { crit: 0.05 }, flavor: 'Fühlt sich gut an.', icon: '💍' },
    { id: 'amu_01', name: 'Lebensamulett', type: 'accessory', rarity: 'RARE', baseStats: { hp: 100, hpRegen: 2 }, flavor: 'Pulsierende Energie.', icon: '📿' },
    { id: 'wpn_03', name: 'Excalibur', type: 'weapon', rarity: 'LEGENDARY', baseStats: { attack: 50, crit: 0.1 }, flavor: 'Das legendäre Schwert.', icon: '🗡️' },
    { id: 'shd_01', name: 'Holzschild', type: 'armor', rarity: 'COMMON', baseStats: { defense: 5 }, flavor: 'Splittert leicht.', icon: '🛡️' },
    { id: 'shd_02', name: 'Ritterschild', type: 'armor', rarity: 'RARE', baseStats: { defense: 20, hp: 50 }, flavor: 'Stabile Verteidigung.', icon: '🛡️' },
    { id: 'rng_02', name: 'Manaring', type: 'ring', rarity: 'UNCOMMON', baseStats: { mana: 30 }, flavor: 'Leuchtet schwach.', icon: '💍' },
    { id: 'amu_02', name: 'Goldkette', type: 'accessory', rarity: 'EPIC', baseStats: { attack: 10, crit: 0.05 }, flavor: 'Sehr wertvoll.', icon: '🔱' }
];

export class EquipmentManager {
    constructor() {
        // inventory is now an object: { itemId: { id, level, count } }
        this.inventory = {};
        this.equipped = {
            weapon: null,
            helmet: null,
            armor: null,
            ring1: null,
            ring2: null,
            accessory: null
        };
        this.load();
        
        // Ensure all database items exist in inventory at least with count 0
        ITEM_DATABASE.forEach(dbItem => {
            if (!this.inventory[dbItem.id]) {
                this.inventory[dbItem.id] = {
                    id: dbItem.id,
                    level: 1,
                    count: 0
                };
            }
        });

        // Add starter items if completely new
        if (Object.values(this.inventory).every(v => v.count === 0) && Object.values(this.equipped).every(v => v === null)) {
            this.addItemById('wpn_01');
            this.addItemById('arm_01');
        }
    }

    load() {
        const saved = localStorage.getItem('lunar_slayer_equipment_v2');
        if (saved) {
            const data = JSON.parse(saved);
            this.inventory = data.inventory || {};
            this.equipped = data.equipped || this.equipped;
        }
    }

    save() {
        localStorage.setItem('lunar_slayer_equipment_v2', JSON.stringify({
            inventory: this.inventory,
            equipped: this.equipped
        }));
    }

    addItem(item) {
        if (!item || !item.id) return;
        this.addItemById(item.id);
    }

    addItemById(id) {
        if (!this.inventory[id]) {
            this.inventory[id] = { id, level: 1, count: 0 };
        }
        this.inventory[id].count++;
        this.save();
    }

    enhanceItem(id) {
        const invItem = this.inventory[id];
        const dbItem = this.getItemById(id);
        if (!invItem || !dbItem) return false;

        const rarity = RARITIES[dbItem.rarity];
        const cost = invItem.level * rarity.enhanceCost;

        if (invItem.count > cost) {
            invItem.count -= cost;
            invItem.level++;
            
            // Update equipped item reference if it's the one we just enhanced
            Object.keys(this.equipped).forEach(slot => {
                if (this.equipped[slot] && this.equipped[slot].id === id) {
                    this.equipped[slot].level = invItem.level;
                }
            });

            this.save();
            return true;
        }
        return false;
    }

    enhanceAll() {
        let changed = false;
        Object.keys(this.inventory).forEach(id => {
            while (this.enhanceItem(id)) {
                changed = true;
            }
        });
        return changed;
    }

    equip(id, slot) {
        const invItem = this.inventory[id];
        const dbItem = this.getItemById(id);
        if (!invItem || !dbItem) return false;

        // Type match (ring1/ring2 share 'ring')
        const typeMatch = (slot.startsWith('ring') && dbItem.type === 'ring') || (slot === dbItem.type);
        if (!typeMatch) return false;

        // Equip a "dynamic" instance of the item
        this.equipped[slot] = {
            id: id,
            level: invItem.level
        };

        this.save();
        return true;
    }

    unequip(slot) {
        if (!this.equipped[slot]) return false;
        this.equipped[slot] = null;
        this.save();
        return true;
    }

    // Possession Effect: Total base stats * multiplier * levels
    // Multiplier is tiny: 0.1% per level per item
    getPossessionStats() {
        const total = { attack: 0, hp: 0, mana: 0, defense: 0, crit: 0, hpRegen: 0 };
        
        Object.values(this.inventory).forEach(invItem => {
            const dbItem = this.getItemById(invItem.id);
            if (dbItem && dbItem.baseStats) {
                // Possession effect = baseStat * 0.1 * level
                Object.keys(dbItem.baseStats).forEach(stat => {
                    const bonus = dbItem.baseStats[stat] * 0.01 * invItem.level;
                    total[stat] += bonus;
                });
            }
        });
        return total;
    }

    getEquippedStats() {
        const total = { attack: 0, hp: 0, mana: 0, defense: 0, crit: 0, hpRegen: 0 };
        
        Object.values(this.equipped).forEach(eq => {
            if (eq) {
                const dbItem = this.getItemById(eq.id);
                if (dbItem && dbItem.baseStats) {
                    // Equipped Effect = baseStat * multiplier * level
                    // Multiplier for equipped is much higher: 1.0 + (level-1)*0.5
                    const multiplier = 1 + (eq.level - 1) * 0.2;
                    Object.keys(dbItem.baseStats).forEach(stat => {
                        total[stat] += dbItem.baseStats[stat] * multiplier;
                    });
                }
            }
        });
        return total;
    }

    getBonusStats() {
        const p = this.getPossessionStats();
        const e = this.getEquippedStats();
        
        const total = {};
        const keys = new Set([...Object.keys(p), ...Object.keys(e)]);
        keys.forEach(k => {
            total[k] = (p[k] || 0) + (e[k] || 0);
        });
        return total;
    }

    getItemById(id) {
        return ITEM_DATABASE.find(i => i.id === id);
    }

    isEquipped(id) {
        return Object.values(this.equipped).some(eq => eq && eq.id === id);
    }
}
