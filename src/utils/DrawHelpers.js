/**
 * DrawHelpers – reusable functions to draw sprite-like graphics with Phaser Graphics API.
 * No external assets needed.
 */

/**
 * Draw a warrior player character at (x, y) into a Graphics object.
 */
export function drawPlayerOnGraphics(g, x, y, classIndex = 0) {
    const colors = [
        { body: 0x8B4513, armor: 0x555555, hair: 0x3a200a, weapon: 0xC0C0C0 }, // Warrior
        { body: 0x6040a0, armor: 0x2211aa, hair: 0x110033, weapon: 0x8844ff },  // Mage
        { body: 0x228833, armor: 0x44aa44, hair: 0x3a2510, weapon: 0x8B4513 },  // Ranger
    ];
    const c = colors[classIndex] || colors[0];

    // Legs
    g.fillStyle(0x2a2a6a);
    g.fillRect(x - 10, y + 16, 10, 22);
    g.fillRect(x + 1, y + 16, 10, 22);

    // Boots
    g.fillStyle(0x3a2510);
    g.fillRect(x - 12, y + 34, 13, 9);
    g.fillRect(x + 1, y + 34, 13, 9);

    // Body / Armor
    g.fillStyle(c.armor);
    g.fillRect(x - 14, y - 8, 28, 26);

    // Belt
    g.fillStyle(0x3a2510);
    g.fillRect(x - 14, y + 14, 28, 5);

    // Arm left
    g.fillStyle(c.body);
    g.fillRect(x - 22, y - 8, 9, 20);

    // Arm right
    g.fillRect(x + 14, y - 8, 9, 20);

    // Neck
    g.fillStyle(c.body);
    g.fillRect(x - 5, y - 18, 10, 12);

    // Head
    g.fillStyle(c.body);
    g.fillEllipse(x, y - 28, 32, 30);

    // Hair
    g.fillStyle(c.hair);
    g.fillRect(x - 14, y - 40, 28, 14);

    // Eyes
    g.fillStyle(0xffffff);
    g.fillCircle(x - 6, y - 28, 5);
    g.fillCircle(x + 6, y - 28, 5);
    g.fillStyle(0x111111);
    g.fillCircle(x - 5, y - 28, 3);
    g.fillCircle(x + 7, y - 28, 3);

    // Class-specific extras
    if (classIndex === 0) {
        g.fillStyle(0x888888);
        g.fillEllipse(x - 16, y - 6, 14, 10);
        g.fillEllipse(x + 16, y - 6, 14, 10);
    } else if (classIndex === 1) {
        g.fillStyle(0x6633cc);
        g.fillRect(x - 16, y + 10, 32, 10);
        g.fillStyle(0xaa44ff);
        g.fillCircle(x + 22, y - 12, 8);
        g.fillStyle(0xddaaff);
        g.fillCircle(x + 22, y - 14, 4);
        g.fillStyle(0x220066);
        g.fillTriangle(x, y - 62, x - 18, y - 38, x + 18, y - 38);
        g.fillStyle(0x440099);
        g.fillRect(x - 18, y - 40, 36, 6);
    } else if (classIndex === 2) {
        g.fillStyle(0x336622);
        g.fillEllipse(x, y - 42, 38, 22);
        g.fillRect(x - 16, y - 40, 32, 14);
        g.fillStyle(0x8B4513);
        g.fillRect(x + 16, y - 10, 8, 22);
    }
}

/**
 * Draw a warrior player character at (x, y) into a new Graphics object.
 */
export function drawPlayer(scene, x, y, classIndex = 0) {
    const g = scene.add.graphics();
    drawPlayerOnGraphics(g, x, y, classIndex);
    return g;
}

/**
 * Draw enemy sprite into a Phaser.GameObjects.Graphics at position (x, y).
 */
export function drawEnemy(scene, x, y, type = 'slime', colorOverride = null) {
    const g = scene.add.graphics();
    drawEnemyOnGraphics(g, x, y, type, colorOverride);
    return g;
}

export function drawEnemyOnGraphics(g, x, y, type = 'slime', colorOverride = null) {
    g.clear();

    if (type === 'slime') {
        const col = colorOverride ?? 0x2d6b6b;
        g.fillStyle(col);
        g.fillEllipse(x, y + 10, 48, 38);
        // Eyes
        g.fillStyle(0xffffff);
        g.fillCircle(x - 9, y + 2, 7);
        g.fillCircle(x + 9, y + 2, 7);
        g.fillStyle(0x000000);
        g.fillCircle(x - 7, y + 2, 4);
        g.fillCircle(x + 11, y + 2, 4);
        // Shine
        g.fillStyle(0xffffff, 0.35);
        g.fillEllipse(x - 10, y, 12, 8);
    } else if (type === 'skeleton') {
        const col = colorOverride ?? 0xc8c8c8;
        // Body
        g.fillStyle(col);
        g.fillRect(x - 10, y - 10, 20, 28);
        // Ribs
        g.fillStyle(0x999999);
        for (let i = 0; i < 3; i++) {
            g.fillRect(x - 9, y - 4 + i * 8, 18, 3);
        }
        // Legs
        g.fillStyle(col);
        g.fillRect(x - 10, y + 18, 8, 22);
        g.fillRect(x + 2, y + 18, 8, 22);
        // Head / skull
        g.fillEllipse(x, y - 28, 32, 30);
        // Eye sockets
        g.fillStyle(0x000000);
        g.fillCircle(x - 7, y - 30, 5);
        g.fillCircle(x + 7, y - 30, 5);
        // Jaw
        g.fillStyle(col);
        g.fillRect(x - 9, y - 16, 18, 6);
        g.fillStyle(0x000000);
        for (let i = 0; i < 4; i++) g.fillRect(x - 8 + i * 5, y - 14, 3, 4);
    } else if (type === 'bat') {
        const col = colorOverride ?? 0x551188;
        // Wings
        g.fillStyle(col, 0.9);
        g.fillTriangle(x - 12, y, x - 60, y - 30, x - 12, y - 24);
        g.fillTriangle(x + 12, y, x + 60, y - 30, x + 12, y - 24);
        // Body
        g.fillStyle(col);
        g.fillEllipse(x, y, 30, 22);
        // Eyes
        g.fillStyle(0xff0000);
        g.fillCircle(x - 6, y - 4, 4);
        g.fillCircle(x + 6, y - 4, 4);
        // Ears
        g.fillStyle(col);
        g.fillTriangle(x - 8, y - 10, x - 18, y - 30, x - 2, y - 12);
        g.fillTriangle(x + 8, y - 10, x + 18, y - 30, x + 2, y - 12);
        // Fangs
        g.fillStyle(0xffffff);
        g.fillTriangle(x - 4, y + 6, x - 7, y + 16, x + 1, y + 6);
        g.fillTriangle(x + 4, y + 6, x + 7, y + 16, x - 1, y + 6);
    } else if (type === 'orc') {
        const col = colorOverride ?? 0x3a7a2a;
        // Legs
        g.fillStyle(0x223311);
        g.fillRect(x - 13, y + 16, 12, 24);
        g.fillRect(x + 2, y + 16, 12, 24);
        // Body
        g.fillStyle(col);
        g.fillRect(x - 16, y - 10, 32, 28);
        // Arms - muscular
        g.fillEllipse(x - 24, y, 18, 30);
        g.fillEllipse(x + 24, y, 18, 30);
        // Head
        g.fillEllipse(x, y - 28, 38, 32);
        // Jaw / tusks
        g.fillStyle(0xffffff);
        g.fillTriangle(x - 8, y - 16, x - 12, y - 5, x - 4, y - 16);
        g.fillTriangle(x + 8, y - 16, x + 12, y - 5, x + 4, y - 16);
        // Eyes
        g.fillStyle(0xff4400);
        g.fillCircle(x - 8, y - 30, 5);
        g.fillCircle(x + 8, y - 30, 5);
        g.fillStyle(0x000000);
        g.fillCircle(x - 7, y - 30, 2);
        g.fillCircle(x + 9, y - 30, 2);
        // Horns
        g.fillStyle(0x8B4513);
        g.fillTriangle(x - 12, y - 40, x - 20, y - 62, x - 4, y - 42);
        g.fillTriangle(x + 12, y - 40, x + 20, y - 62, x + 4, y - 42);
    } else if (type === 'boss') {
        const col = colorOverride ?? 0xff0000;
        // Cape
        g.fillStyle(0x440000, 0.8);
        g.fillTriangle(x, y + 60, x - 50, y - 20, x + 50, y - 20);
        // Body
        g.fillStyle(col);
        g.fillRect(x - 22, y - 16, 44, 38);
        // Armor plates
        g.fillStyle(0x880000);
        g.fillRect(x - 20, y - 14, 40, 14);
        g.fillRect(x - 20, y + 4, 40, 8);
        // Arms
        g.fillStyle(col);
        g.fillEllipse(x - 30, y + 4, 22, 36);
        g.fillEllipse(x + 30, y + 4, 22, 36);
        // Head
        g.fillStyle(col);
        g.fillEllipse(x, y - 36, 50, 44);
        // Crown
        g.fillStyle(0xFFD700);
        g.fillRect(x - 22, y - 54, 44, 10);
        g.fillTriangle(x - 22, y - 54, x - 18, y - 70, x - 14, y - 54);
        g.fillTriangle(x - 2, y - 54, x + 2, y - 74, x + 6, y - 54);
        g.fillTriangle(x + 14, y - 54, x + 18, y - 70, x + 22, y - 54);
        // Eyes (glowing)
        g.fillStyle(0xffff00);
        g.fillCircle(x - 10, y - 38, 7);
        g.fillCircle(x + 10, y - 38, 7);
        g.fillStyle(0xff0000);
        g.fillCircle(x - 10, y - 38, 4);
        g.fillCircle(x + 10, y - 38, 4);
        // Horns
        g.fillStyle(0xcc0000);
        g.fillTriangle(x - 18, y - 54, x - 30, y - 86, x - 8, y - 56);
        g.fillTriangle(x + 18, y - 54, x + 30, y - 86, x + 8, y - 56);
    }
}

/**
 * Draw a sword weapon graphic into a Graphics object.
 */
export function drawSwordOnGraphics(g, x, y, classIndex = 0) {
    if (classIndex === 1) {
        // Staff
        g.fillStyle(0x8B6914);
        g.fillRect(x, y - 30, 5, 60);
        g.fillStyle(0xaa44ff);
        g.fillCircle(x + 2, y - 32, 10);
        g.fillStyle(0xddaaff);
        g.fillCircle(x + 2, y - 34, 5);
    } else if (classIndex === 2) {
        // Bow
        g.lineStyle(3, 0x8B4513);
        g.strokePoints([
            { x: x, y: y - 28 },
            { x: x - 10, y: y },
            { x: x, y: y + 28 }
        ], false);
        g.lineStyle(1, 0xccaa77);
        g.lineBetween(x, y - 28, x, y + 28);
    } else {
        // Sword
        g.fillStyle(0xC0C0C0);
        g.fillRect(x, y - 4, 34, 8);
        g.fillStyle(0x888888);
        g.fillTriangle(x + 34, y - 4, x + 46, y, x + 34, y + 4);
        g.fillStyle(0xaa8833);
        g.fillRect(x - 4, y - 6, 8, 12);
        g.fillStyle(0xC0C0C0);
        g.fillRect(x - 10, y - 2, 8, 4);
    }
}

/**
 * Draw a sword weapon graphic into a new Graphics object.
 */
export function drawSword(scene, x, y, classIndex = 0) {
    const g = scene.add.graphics();
    drawSwordOnGraphics(g, x, y, classIndex);
    return g;
}
