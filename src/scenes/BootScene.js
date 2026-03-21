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

        // Load Player Spritesheet
        this.load.spritesheet('player_sheet', '/Player.png', {
            frameWidth: 105,
            frameHeight: 192
        });

        this.load.image('game_bg', '/Background1.png');
        this.load.image('testzauber_raw', '/testzauber1.png');

        // Load Shield Assets
        this.load.image('shield_grau_raw', '/schilder grau.png');
        this.load.image('shield_gruen_raw', '/Schilder gruen.png');
        this.load.image('shield_blau_raw', '/Schilder Blau.png');
        this.load.image('shield_epic_raw', '/schilder epic.png');
        this.load.image('shield_myth_raw', '/schilder myth.png');
        this.load.image('shield_legendary_raw', '/Schilder Legendary.png');
        this.load.image('hud_banner', '/Banner obenv2.png');
        this.load.image('hud_bottom', '/Banner unten.png');
        this.load.image('main_dashboard', '/rahmen5reihen.png');

        // Load Upgrade Category Icons
        this.load.image('icon_damage', '/Sword_round.png');
        this.load.image('icon_hp', '/Vitality_round.png');
        this.load.image('icon_regen', '/HP_Regeneration_round.png');
        this.load.image('icon_crit_rate', '/Skull_Strike_round.png');
        this.load.image('icon_crit_dmg', '/Critical_Damage_round.png');
        this.load.image('stage_header', '/Stagesv2.png');
    }

    create() {
        // Define Animations
        // Male (Row 3, Indices 26-38)
        this.anims.create({
            key: 'male_idle',
            frames: this.anims.generateFrameNumbers('player_sheet', { start: 26, end: 29 }),
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: 'male_run',
            frames: this.anims.generateFrameNumbers('player_sheet', { start: 30, end: 35 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'male_death',
            frames: this.anims.generateFrameNumbers('player_sheet', { start: 36, end: 38 }),
            frameRate: 6,
            repeat: 0
        });

        // Female (Row 4, Indices 39-51)
        this.anims.create({
            key: 'female_idle',
            frames: this.anims.generateFrameNumbers('player_sheet', { start: 39, end: 42 }),
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: 'female_run',
            frames: this.anims.generateFrameNumbers('player_sheet', { start: 43, end: 48 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'female_death',
            frames: this.anims.generateFrameNumbers('player_sheet', { start: 49, end: 51 }),
            frameRate: 6,
            repeat: 0
        });
        
        // Process Skill Spritesheet (3 frames horizontal)
        this.makeSkillSheet('testzauber_raw', 'skill_sheet');

        // Process Shield Spritesheets (5 frames each, except Myth which has 1 or is handled similarly)
        this.makeShieldSheet('shield_grau_raw', 'shield_grau', 5);
        this.makeShieldSheet('shield_gruen_raw', 'shield_gruen', 5);
        this.makeShieldSheet('shield_blau_raw', 'shield_blau', 5);
        this.makeShieldSheet('shield_epic_raw', 'shield_epic', 5);
        this.makeShieldSheet('shield_myth_raw', 'shield_myth', 1);
        this.makeShieldSheet('shield_legendary_raw', 'shield_legendary', 5);

        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }

    makeShieldSheet(sourceKey, targetKey, frames) {
        const source = this.textures.get(sourceKey).getSourceImage();
        const frameW = Math.floor(source.width / frames);
        const frameH = source.height;

        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(source, 0, 0);

        this.textures.addSpriteSheet(targetKey, canvas, { frameWidth: frameW, frameHeight: frameH });
    }

    makeSkillSheet(sourceKey, targetKey) {
        const source = this.textures.get(sourceKey).getSourceImage();

        // testzauber1.png has Ice, Lightning, Heart in one row (3 frames)
        // Since the user cleaned the asset, we can use the full frame dimensions.
        const frameW = Math.floor(source.width / 3);
        const frameH = source.height;

        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(source, 0, 0);

        this.textures.addSpriteSheet(targetKey, canvas, { frameWidth: frameW, frameHeight: frameH });
    }
}