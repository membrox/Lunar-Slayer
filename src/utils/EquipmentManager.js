import { SaveSystem } from './SaveSystem.js';

export const RARITIES = {
    COMMON: { name: 'Common', color: 0x9e9e9e, colorStr: '#9e9e9e' },
    UNCOMMON: { name: 'Uncommon', color: 0x4caf50, colorStr: '#4caf50' },
    RARE: { name: 'Rare', color: 0x2196f3, colorStr: '#2196f3' },
    EPIC: { name: 'Epic', color: 0x9c27b0, colorStr: '#9c27b0' },
    LEGENDARY: { name: 'Legendary', color: 0xff9800, colorStr: '#ff9800' }
};

export const ITEM_DATABASE = [
    { id: 'wpn_01', name: 'Holzstab', type: 'weapon', rarity: 'COMMON', stats: { attack: 5 }, flavor: 'Ein einfacher Stock.', icon: '🪄' },
    { id: 'wpn_02', name: 'Mondstab', type: 'weapon', rarity: 'RARE', stats: { attack: 15, mana: 20 }, flavor: 'Kanalisiert Mondlicht.', icon: '🌙' },
    { id: 'arm_01', name: 'Leinenrobe', type: 'armor', rarity: 'COMMON', stats: { hp: 20, defense: 2 }, flavor: 'Einfacher Stoff.', icon: '🧥' },
    { id: 'arm_02', name: 'Magierrobe', type: 'armor', rarity: 'UNCOMMON', stats: { hp: 50, defense: 5 }, flavor: 'Verstärkte Robe.', icon: '👘' },
    { id: 'ring_01', name: 'Glücksring', type: 'ring', rarity: 'UNCOMMON', stats: { crit: 0.05 }, flavor: 'Fühlt sich gut an.', icon: '💍' },
    { id: 'amu_01', name: 'Lebensamulett', type: 'accessory', rarity: 'RARE', stats: { hp: 100, hpRegen: 2 }, flavor: 'Pulsierende Energie.', icon: '📿' },
    { id: 'wpn_03', name: 'Excalibur', type: 'weapon', rarity: 'LEGENDARY', stats: { attack: 50, crit: 0.1 }, flavor: 'Das legendäre Schwert.', icon: '🗡️' }
];

export class EquipmentManager {
    constructor() {
        this.inventory = [];
        this.equipped = {
            weapon: null,
            helmet: null,
            armor: null,
            ring1: null,
            ring2: null,
            accessory: null
        };
        this.load();
        
        // Add starter items if empty
        if (this.inventory.length === 0 && Object.values(this.equipped).every(v => v === null)) {
            this.inventory.push(ITEM_DATABASE[0]); // Holzstab
            this.inventory.push(ITEM_DATABASE[2]); // Leinenrobe
        }
    }

    load() {
        const saved = localStorage.getItem('lunar_slayer_equipment');
        if (saved) {
            const data = JSON.parse(saved);
            this.inventory = data.inventory || [];
            this.equipped = data.equipped || this.equipped;
        }
    }

    save() {
        localStorage.setItem('lunar_slayer_equipment', JSON.stringify({
            inventory: this.inventory,
            equipped: this.equipped
        }));
    }

    equip(itemIndex, slot) {
        const item = this.inventory[itemIndex];
        if (!item) return false;

        // Check if slot type matches item type
        // Note: ring1/ring2 share 'ring' type
        const typeMatch = (slot.startsWith('ring') && item.type === 'ring') || (slot === item.type);
        if (!typeMatch) return false;

        const oldEquipped = this.equipped[slot];
        
        // Remove from inventory
        this.inventory.splice(itemIndex, 1);
        
        // Equip
        this.equipped[slot] = item;
        
        // Return old item to inventory
        if (oldEquipped) {
            this.inventory.push(oldEquipped);
        }

        this.save();
        return true;
    }

    unequip(slot) {
        const item = this.equipped[slot];
        if (!item) return false;

        this.equipped[slot] = null;
        this.inventory.push(item);
        
        this.save();
        return true;
    }

    getBonusStats() {
        const total = {
            attack: 0, hp: 0, mana: 0, defense: 0, crit: 0, hpRegen: 0
        };

        Object.values(this.equipped).forEach(item => {
            if (item && item.stats) {
                Object.keys(item.stats).forEach(stat => {
                    total[stat] = (total[stat] || 0) + item.stats[stat];
                });
            }
        });

        return total;
    }

    getItemById(id) {
        return ITEM_DATABASE.find(i => i.id === id);
    }

    generateRandomItem() {
        const item = ITEM_DATABASE[Math.floor(Math.random() * ITEM_DATABASE.length)];
        // Clone item to avoid modifying DB
        return JSON.parse(JSON.stringify(item));
    }
}
