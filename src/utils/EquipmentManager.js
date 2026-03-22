import { SaveSystem } from './SaveSystem.js';

export const RARITIES = {
    NORMAL: { name: 'Normal', color: 0x9e9e9e, colorStr: '#9e9e9e', enhanceCost: 100 },
    UNCOMMON: { name: 'Uncommon', color: 0x4caf50, colorStr: '#4caf50', enhanceCost: 100 },
    MAGIC: { name: 'Magic', color: 0x2196f3, colorStr: '#2196f3', enhanceCost: 100 },
    RARE: { name: 'Rare', color: 0x2196f3, colorStr: '#2196f3', enhanceCost: 100 },
    EPIC: { name: 'Epic', color: 0x9c27b0, colorStr: '#9c27b0', enhanceCost: 100 },
    LEGENDARY: { name: 'Legendary', color: 0xff9800, colorStr: '#ff9800', enhanceCost: 100 },
    MYTH: { name: 'Myth', color: 0xff00ff, colorStr: '#ff00ff', enhanceCost: 100 }
};

export const ITEM_DATABASE = [
    // Wood Series
    { id: 'wpn_01', name: 'Holzstab', type: 'weapon', rarity: 'UNCOMMON', nextId: 'wpn_02', baseStats: { attack: 1 }, flavor: 'Ein einfacher Stock.', icon: '🪄' },
    { id: 'wpn_02', name: 'Holzstab', type: 'weapon', rarity: 'NORMAL', nextId: 'wpn_03', baseStats: { attack: 5 }, flavor: 'Etwas stabiler.', icon: '🪄' },
    { id: 'wpn_03', name: 'Mondstab', type: 'weapon', rarity: 'MAGIC', nextId: 'wpn_04', baseStats: { attack: 20 }, flavor: 'Kanalisiert Mondlicht.', icon: '🌙' },
    { id: 'wpn_04', name: 'Sonnenstab', type: 'weapon', rarity: 'RARE', nextId: 'wpn_05', baseStats: { attack: 100 }, flavor: 'Brennt mit Solarenergie.', icon: '☀️' },
    { id: 'wpn_05', name: 'Sternenstab', type: 'weapon', rarity: 'EPIC', nextId: 'wpn_06', baseStats: { attack: 500 }, flavor: 'Aus Sternenstaub geformt.', icon: '✨' },
    { id: 'wpn_06', name: 'Excalibur', type: 'weapon', rarity: 'LEGENDARY', nextId: 'wpn_07', baseStats: { attack: 2000 }, flavor: 'Das legendäre Schwert.', icon: '🗡️' },
    { id: 'wpn_07', name: 'Mjölnir', type: 'weapon', rarity: 'MYTH', nextId: null, baseStats: { attack: 10000 }, flavor: 'Hammer der Götter.', icon: '🔨' },

    // Linen Series
    { id: 'arm_01', name: 'Leinenrobe', type: 'armor', rarity: 'UNCOMMON', nextId: 'arm_02', baseStats: { hp: 20, defense: 2 }, flavor: 'Einfacher Stoff.', icon: '🧥' },
    { id: 'arm_02', name: 'Magierrobe', type: 'armor', rarity: 'NORMAL', nextId: 'arm_03', baseStats: { hp: 100, defense: 10 }, flavor: 'Verstärkte Robe.', icon: '👘' },
    { id: 'arm_03', name: 'Geisterrobe', type: 'armor', rarity: 'MAGIC', nextId: 'arm_04', baseStats: { hp: 500, defense: 50 }, flavor: 'Leicht wie Luft.', icon: '🌬️' },
    { id: 'arm_04', name: 'Drachenrobe', type: 'armor', rarity: 'RARE', nextId: null, baseStats: { hp: 2000, defense: 200 }, flavor: 'Aus Drachenschuppen.', icon: '🐲' },

    // Ring Series
    { id: 'ring_01', name: 'Glücksring', type: 'ring', rarity: 'NORMAL', nextId: 'ring_02', baseStats: { crit: 0.05 }, flavor: 'Fühlt sich gut an.', icon: '💍' },
    { id: 'ring_02', name: 'Manaring', type: 'ring', rarity: 'MAGIC', nextId: null, baseStats: { mana: 30 }, flavor: 'Leuchtet schwach.', icon: '💍' },

    // Shield Series
    { id: 'shd_01', name: 'Holzschild', type: 'shield', rarity: 'UNCOMMON', nextId: 'shd_02', baseStats: { defense: 5 }, flavor: 'Splittert leicht.', icon: '🛡️' },
    { id: 'shd_02', name: 'Ritterschild', type: 'shield', rarity: 'MAGIC', nextId: null, baseStats: { defense: 20, hp: 50 }, flavor: 'Stabile Verteidigung.', icon: '🛡️' },

    // Amulet Series
    { id: 'amu_01', name: 'Lebensamulett', type: 'accessory', rarity: 'MAGIC', nextId: 'amu_02', baseStats: { hp: 100 }, flavor: 'Pulsierende Energie.', icon: '📿' },
    { id: 'amu_02', name: 'Goldkette', type: 'accessory', rarity: 'EPIC', nextId: null, baseStats: { attack: 10, crit: 0.05 }, flavor: 'Sehr wertvoll.', icon: '🔱' }
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
        // Also cleanup old items not in database
        Object.keys(this.inventory).forEach(id => {
            if (!this.getItemById(id)) {
                delete this.inventory[id];
            }
        });

        ITEM_DATABASE.forEach(dbItem => {
            if (!this.inventory[dbItem.id]) {
                this.inventory[dbItem.id] = {
                    id: dbItem.id,
                    level: 1,
                    plusLevel: 0,
                    count: 0
                };
            }
        });

        // Add starter items if completely new (no items owned)
        const totalItemsOwned = Object.values(this.inventory).reduce((sum, item) => sum + item.count, 0);
        if (totalItemsOwned === 0 && Object.values(this.equipped).every(v => v === null)) {
            console.log('Fresh start: Adding and equipping starter items');
            this.addItemById('wpn_01');
            this.addItemById('arm_01');
            this.equip('wpn_01', 'weapon');
            this.equip('arm_01', 'armor');
        }
    }

    load() {
        const saved = localStorage.getItem('lunar_slayer_equipment_v3');
        if (saved) {
            const data = JSON.parse(saved);
            this.inventory = data.inventory || {};
            this.equipped = data.equipped || this.equipped;
        }
    }

    save() {
        localStorage.setItem('lunar_slayer_equipment_v3', JSON.stringify({
            inventory: this.inventory,
            equipped: this.equipped
        }));
    }

    addItem(item) {
        if (!item || !item.id) return;
        this.addItemById(item.id);
    }

    addItemById(id, plusLevel = 0) {
        if (!this.inventory[id]) {
            this.inventory[id] = { id, level: 1, plusLevel: plusLevel, count: 0 };
        }
        this.inventory[id].count++;
        this.save();
    }

    // Synthesis (Verschmelzen): Consumes 100 copies to promote to next tier
    mergeItem(id) {
        const invItem = this.inventory[id];
        const dbItem = this.getItemById(id);
        if (!invItem || !dbItem || !dbItem.nextId) return false;

        if (invItem.count >= 100) {
            invItem.count -= 100;
            // Add next tier item, potentially preserving plusLevel (Gold Enhancement)
            this.addItemById(dbItem.nextId, invItem.plusLevel || 0);
            
            this.save();
            return true;
        }
        return false;
    }

    // Enhancement (Grüner Button): Uses Enhancement Stones (Verstärkungssteine)
    stoneEnhanceItem(id, currentStones) {
        const invItem = this.inventory[id];
        if (!invItem) return { success: false };

        const cost = ((invItem.plusLevel || 0) + 1) * 10; // Stone cost
        if (currentStones >= cost) {
            invItem.plusLevel = (invItem.plusLevel || 0) + 1;
            
            // Sync equipped item
            Object.keys(this.equipped).forEach(slot => {
                if (this.equipped[slot] && this.equipped[slot].id === id) {
                    this.equipped[slot].plusLevel = invItem.plusLevel;
                }
            });

            this.save();
            return { success: true, cost: cost };
        }
        return { success: false, reason: 'Nicht genügend Steine!' };
    }

    mergeAll() {
        let changed = false;
        let found = true;
        while (found) {
            found = false;
            Object.keys(this.inventory).forEach(id => {
                if (this.mergeItem(id)) {
                    changed = true;
                    found = true;
                }
            });
        }
        return changed;
    }

    stoneEnhanceAll(currentStones) {
        let totalSpent = 0;
        let changed = false;
        let foundAny = true;
        while (foundAny) {
            foundAny = false;
            Object.keys(this.equipped).forEach(slot => {
                const eq = this.equipped[slot];
                if (eq) {
                    const res = this.stoneEnhanceItem(eq.id, currentStones - totalSpent);
                    if (res.success) {
                        totalSpent += res.cost;
                        changed = true;
                        foundAny = true;
                    }
                }
            });
        }
        return { changed, totalSpent };
    }

    equip(id, slot) {
        const invItem = this.inventory[id];
        const dbItem = this.getItemById(id);
        if (!invItem || !dbItem) return false;

        // Type match (ring1/ring2 share 'ring')
        const typeMatch = (slot.startsWith('ring') && dbItem.type === 'ring') || 
                         (slot === 'armor' && (dbItem.type === 'armor' || dbItem.type === 'shield')) ||
                         (slot === dbItem.type);
        if (!typeMatch) return false;

        // Equip a "dynamic" instance of the item
        this.equipped[slot] = {
            id: id,
            level: invItem.level,
            plusLevel: invItem.plusLevel || 0
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

    // Possession & Equipped Multipliers
    getMultipliers() {
        const multipliers = { attack: 1.0, hp: 1.0, mana: 1.0, defense: 1.0, crit: 0, hpRegen: 0 };
        
        // 1. Possession Bonuses (1% per level per owned item type)
        Object.values(this.inventory).forEach(invItem => {
            if (invItem.count <= 0) return;
            const dbItem = this.getItemById(invItem.id);
            if (dbItem && dbItem.baseStats) {
                let levelMult = invItem.level;
                if (dbItem.type === 'weapon') {
                    multipliers.attack += 0.01 * levelMult;
                } else {
                    Object.keys(dbItem.baseStats).forEach(stat => {
                        const bonus = dbItem.baseStats[stat] * 0.001 * levelMult;
                        multipliers[stat] += bonus;
                    });
                }
            }
        });

        // 2. Equipped Multipliers (Weapon: 10% per level + Enhancement Bonus)
        Object.values(this.equipped).forEach(eq => {
            if (eq) {
                const dbItem = this.getItemById(eq.id);
                if (dbItem && dbItem.type === 'weapon') {
                    // Base equipped bonus (+10% per level)
                    multipliers.attack += 0.10 * eq.level;
                    // Enhancement bonus (+5% per plusLevel)
                    multipliers.attack += 0.05 * (eq.plusLevel || 0);
                }
            }
        });

        return multipliers;
    }

    // Equipped Effect: Flat Bonuses (for non-weapon stats)
    getEquippedFlatBonuses() {
        const flat = { attack: 0, hp: 0, mana: 0, defense: 0, crit: 0, hpRegen: 0 };
        
        Object.values(this.equipped).forEach(eq => {
            if (eq) {
                const dbItem = this.getItemById(eq.id);
                if (dbItem && dbItem.baseStats && dbItem.type !== 'weapon') {
                    const levelScale = 1 + (eq.level - 1) * 0.2;
                    Object.keys(dbItem.baseStats).forEach(stat => {
                        flat[stat] += dbItem.baseStats[stat] * levelScale;
                    });
                }
            }
        });
        return flat;
    }

    getAllBonuses() {
        return {
            flat: this.getEquippedFlatBonuses(),
            mult: this.getMultipliers()
        };
    }

    getItemById(id) {
        if (!id) return null;
        return ITEM_DATABASE.find(i => i.id === id) || null;
    }

    isEquipped(id) {
        return Object.values(this.equipped).some(eq => eq && eq.id === id);
    }
}
