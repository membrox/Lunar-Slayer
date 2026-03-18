export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, 0x000000);

        // Stars
        for (let i = 0; i < 80; i++) {
            this.add.circle(
                Phaser.Math.Between(0, w), Phaser.Math.Between(0, h),
                Phaser.Math.Between(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.9)
            );
        }

        // Title
        this.add.text(w / 2, h / 2 - 80, '⚔ LUNAR SLAYER ⚔', {
            fontSize: '52px', fill: '#ff6600', fontFamily: 'Arial',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(w / 2, h / 2 - 28, 'Ein Sidescroller RPG', {
            fontSize: '18px', fill: '#cccccc', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Loading bar frame
        this.add.rectangle(w / 2, h / 2 + 50, 404, 24, 0x333333);
        const bar = this.add.rectangle(w / 2 - 200, h / 2 + 50, 0, 20, 0xff6600).setOrigin(0, 0.5);

        this.loadingText = this.add.text(w / 2, h / 2 + 50, 'Lade...', {
            fontSize: '12px', fill: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            bar.width = 400 * value;
            this.loadingText.setText(`${Math.floor(value * 100)}%`);
        });

        // Load Mage Sprites as raw images with leading slashes for Vite
        this.load.image('mage_raw_1', '/mage_sheet_1.png');
        this.load.image('mage_raw_2', '/mage_sheet_2.png');
        this.load.image('game_bg', '/background1.png');
        this.load.image('testzauber_raw', '/testzauber.png');
    }

    create() {
        // Process transparency for Mage Sprites
        this.makeTransparent('mage_raw_1', 'mage_sheet_1', 192, 256);
        this.makeTransparent('mage_raw_2', 'mage_sheet_2', 256, 256);
        
        // Process Skill Spritesheet (3 frames horizontal)
        this.makeSkillSheet('testzauber_raw', 'skill_sheet');

        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }

    makeTransparent(sourceKey, targetKey, frameW, frameH) {
        const source = this.textures.get(sourceKey).getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(source, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            // Treat almost-black or very dark grey (grid) as transparent
            if (r < 30 && g < 30 && b < 30) {
                data[i+3] = 0;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        this.textures.addSpriteSheet(targetKey, canvas, { frameWidth: frameW, frameHeight: frameH });
    }

    makeSkillSheet(sourceKey, targetKey) {
        const source = this.textures.get(sourceKey).getSourceImage();
        
        // testzauber.png has Ice, Lightning, Heart in one row (3 frames)
        const frameW = Math.floor(source.width / 3);
        const frameH = source.height;

        // 80% width is safe for heart edges. 
        // 60% height is the intended "sweet spot" to hide dots without cutting the heart too much.
        const cropW = Math.floor(frameW * 0.80);
        const cropH = Math.floor(frameH * 0.60);

        const canvas = document.createElement('canvas');
        canvas.width = cropW * 3;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < 3; i++) {
            const srcX = i * frameW + (frameW - cropW) / 2;
            const srcY = (frameH - cropH) / 2;
            const destX = i * cropW;
            const destY = 0;
            ctx.drawImage(source, srcX, srcY, cropW, cropH, destX, destY, cropW, cropH);
        }

        this.textures.addSpriteSheet(targetKey, canvas, { frameWidth: cropW, frameHeight: cropH });
    }
}