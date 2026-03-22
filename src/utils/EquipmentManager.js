import { SaveSystem } from './SaveSystem.js';

export const RARITIES = {
    UNCOMMON: { name: 'Uncommon', color: 0x9e9e9e, colorStr: '#9e9e9e', enhanceCost: 100 },
    NORMAL: { name: 'Normal', color: 0x4caf50, colorStr: '#4caf50', enhanceCost: 100 },
    MAGIC: { name: 'Magic', color: 0xf1c40f, colorStr: '#f1c40f', enhanceCost: 100 },
    RARE: { name: 'Rare', color: 0x3498db, colorStr: '#3498db', enhanceCost: 100 },
    EPIC: { name: 'Epic', color: 0x9c27b0, colorStr: '#9c27b0', enhanceCost: 100 },
    LEGENDARY: { name: 'Legendary', color: 0xff9800, colorStr: '#ff9800', enhanceCost: 100 },
    MYTH: { name: 'Myth', color: 0xff00ff, colorStr: '#ff00ff', enhanceCost: 100 }
};

export const ITEM_DATABASE = [
    // --- WEAPONS (35 Items) ---
    // UNCOMMON (weapon_uncommon)
    { id: 'wpn_u1', name: 'Rostiges Schwert', type: 'weapon', rarity: 'UNCOMMON', nextId: 'wpn_u2', baseStats: { attack: 2 }, texture: 'weapon_uncommon', frame: 0 },
    { id: 'wpn_u2', name: 'Grobes Beil', type: 'weapon', rarity: 'UNCOMMON', nextId: 'wpn_u3', baseStats: { attack: 4 }, texture: 'weapon_uncommon', frame: 1 },
    { id: 'wpn_u3', name: 'Abgenutzter Stab', type: 'weapon', rarity: 'UNCOMMON', nextId: 'wpn_u4', baseStats: { attack: 6 }, texture: 'weapon_uncommon', frame: 2 },
    { id: 'wpn_u4', name: 'Einfacher Dolch', type: 'weapon', rarity: 'UNCOMMON', nextId: 'wpn_u5', baseStats: { attack: 8 }, texture: 'weapon_uncommon', frame: 3 },
    { id: 'wpn_u5', name: 'Holzhammer', type: 'weapon', rarity: 'UNCOMMON', nextId: 'wpn_n1', baseStats: { attack: 10 }, texture: 'weapon_uncommon', frame: 4 },

    // NORMAL (weapon_normal)
    { id: 'wpn_n1', name: 'Eisenschwert', type: 'weapon', rarity: 'NORMAL', nextId: 'wpn_n2', baseStats: { attack: 25 }, texture: 'weapon_normal', frame: 0 },
    { id: 'wpn_n2', name: 'Kriegsaxt', type: 'weapon', rarity: 'NORMAL', nextId: 'wpn_n3', baseStats: { attack: 35 }, texture: 'weapon_normal', frame: 1 },
    { id: 'wpn_n3', name: 'Lehrlingsstab', type: 'weapon', rarity: 'NORMAL', nextId: 'wpn_n4', baseStats: { attack: 45 }, texture: 'weapon_normal', frame: 2 },
    { id: 'wpn_n4', name: 'Jagdmesser', type: 'weapon', rarity: 'NORMAL', nextId: 'wpn_n5', baseStats: { attack: 55 }, texture: 'weapon_normal', frame: 3 },
    { id: 'wpn_n5', name: 'Steinhammer', type: 'weapon', rarity: 'NORMAL', nextId: 'wpn_m1', baseStats: { attack: 75 }, texture: 'weapon_normal', frame: 4 },

    // MAGIC (weapon_magic)
    { id: 'wpn_m1', name: 'Runenklinge', type: 'weapon', rarity: 'MAGIC', nextId: 'wpn_m2', baseStats: { attack: 150 }, texture: 'weapon_magic', frame: 0 },
    { id: 'wpn_m2', name: 'Frostaxt', type: 'weapon', rarity: 'MAGIC', nextId: 'wpn_m3', baseStats: { attack: 200 }, texture: 'weapon_magic', frame: 1 },
    { id: 'wpn_m3', name: 'Magierfokus', type: 'weapon', rarity: 'MAGIC', nextId: 'wpn_m4', baseStats: { attack: 250 }, texture: 'weapon_magic', frame: 2 },
    { id: 'wpn_m4', name: 'Schattenklinge', type: 'weapon', rarity: 'MAGIC', nextId: 'wpn_m5', baseStats: { attack: 300 }, texture: 'weapon_magic', frame: 3 },
    { id: 'wpn_m5', name: 'Donnerhammer', type: 'weapon', rarity: 'MAGIC', nextId: 'wpn_r1', baseStats: { attack: 450 }, texture: 'weapon_magic', frame: 4 },

    // RARE (weapon_rare)
    { id: 'wpn_r1', name: 'Himmelsspalter', type: 'weapon', rarity: 'RARE', nextId: 'wpn_r2', baseStats: { attack: 1000 }, texture: 'weapon_rare', frame: 0 },
    { id: 'wpn_r2', name: 'Phönixbeil', type: 'weapon', rarity: 'RARE', nextId: 'wpn_r3', baseStats: { attack: 1500 }, texture: 'weapon_rare', frame: 1 },
    { id: 'wpn_r3', name: 'Arkaner Stab', type: 'weapon', rarity: 'RARE', nextId: 'wpn_r4', baseStats: { attack: 2000 }, texture: 'weapon_rare', frame: 2 },
    { id: 'wpn_r4', name: 'Drachenzahn', type: 'weapon', rarity: 'RARE', nextId: 'wpn_r5', baseStats: { attack: 2500 }, texture: 'weapon_rare', frame: 3 },
    { id: 'wpn_r5', name: 'Titanenhammer', type: 'weapon', rarity: 'RARE', nextId: 'wpn_e1', baseStats: { attack: 3500 }, texture: 'weapon_rare', frame: 4 },

    // EPIC (weapon_epic)
    { id: 'wpn_e1', name: 'Dämonentöter', type: 'weapon', rarity: 'EPIC', nextId: 'wpn_e2', baseStats: { attack: 10000 }, texture: 'weapon_epic', frame: 0 },
    { id: 'wpn_e2', name: 'Vortexaxt', type: 'weapon', rarity: 'EPIC', nextId: 'wpn_e3', baseStats: { attack: 15000 }, texture: 'weapon_epic', frame: 1 },
    { id: 'wpn_e3', name: 'Sternenzorn', type: 'weapon', rarity: 'EPIC', nextId: 'wpn_e4', baseStats: { attack: 20000 }, texture: 'weapon_epic', frame: 2 },
    { id: 'wpn_e4', name: 'Leerenklinge', type: 'weapon', rarity: 'EPIC', nextId: 'wpn_e5', baseStats: { attack: 25000 }, texture: 'weapon_epic', frame: 3 },
    { id: 'wpn_e5', name: 'Götterdämmerung', type: 'weapon', rarity: 'EPIC', nextId: 'wpn_l1', baseStats: { attack: 35000 }, texture: 'weapon_epic', frame: 4 },

    // LEGENDARY (weapon_legendary_a/b)
    { id: 'wpn_l1', name: 'Excalibur', type: 'weapon', rarity: 'LEGENDARY', nextId: 'wpn_l2', baseStats: { attack: 100000 }, texture: 'weapon_legendary_a', frame: 0 },
    { id: 'wpn_l2', name: 'Ragnarök', type: 'weapon', rarity: 'LEGENDARY', nextId: 'wpn_l3', baseStats: { attack: 150000 }, texture: 'weapon_legendary_a', frame: 1 },
    { id: 'wpn_l3', name: 'Yggdrasil-Zweig', type: 'weapon', rarity: 'LEGENDARY', nextId: 'wpn_l4', baseStats: { attack: 200000 }, texture: 'weapon_legendary_a', frame: 2 },
    { id: 'wpn_l4', name: 'Drachentöter', type: 'weapon', rarity: 'LEGENDARY', nextId: 'wpn_l5', baseStats: { attack: 250000 }, texture: 'weapon_legendary_b', frame: 0 },
    { id: 'wpn_l5', name: 'Mjölnir', type: 'weapon', rarity: 'LEGENDARY', nextId: 'wpn_y1', baseStats: { attack: 350000 }, texture: 'weapon_legendary_b', frame: 1 },

    // MYTH (weapon_myth)
    { id: 'wpn_y1', name: 'Lunarklinge', type: 'weapon', rarity: 'MYTH', nextId: 'wpn_y2', baseStats: { attack: 1000000 }, texture: 'weapon_myth', frame: 0 },
    { id: 'wpn_y2', name: 'Ewiger Zorn', type: 'weapon', rarity: 'MYTH', nextId: 'wpn_y3', baseStats: { attack: 1500000 }, texture: 'weapon_myth', frame: 1 },
    { id: 'wpn_y3', name: 'Kosmischer Stab', type: 'weapon', rarity: 'MYTH', nextId: 'wpn_y4', baseStats: { attack: 2000000 }, texture: 'weapon_myth', frame: 2 },
    { id: 'wpn_y4', name: 'Sternenlicht', type: 'weapon', rarity: 'MYTH', nextId: 'wpn_y5', baseStats: { attack: 2500000 }, texture: 'weapon_myth', frame: 3 },
    { id: 'wpn_y5', name: 'Weltuntergang', type: 'weapon', rarity: 'MYTH', nextId: null, baseStats: { attack: 5000000 }, texture: 'weapon_myth', frame: 4 },

    // --- OTHER ITEMS ---
    { id: 'arm_01', name: 'Leinenrobe', type: 'armor', rarity: 'UNCOMMON', nextId: 'arm_02', baseStats: { hp: 20, defense: 2 }, flavor: 'Einfacher Stoff.', icon: '🧥' },
    { id: 'shd_01', name: 'Holzschild', type: 'shield', rarity: 'UNCOMMON', nextId: 'shd_02', baseStats: { defense: 5 }, flavor: 'Splittert leicht.', icon: '🛡️' }
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
            this.addItemById('wpn_u1');
            this.addItemById('arm_01');
            this.equip('wpn_u1', 'weapon');
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
