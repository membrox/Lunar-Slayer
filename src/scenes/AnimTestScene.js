/**
 * AnimTestScene - Frame-by-frame animation testbed
 * 
 * Access via: http://localhost:5173/?testbed
 * 
 * Features:
 * - Displays each animation with a vertical center reference line
 * - Step forward/back through individual frames
 * - Auto-play toggle
 * - Shows current frame index
 * - Makes drift immediately visible
 */
export default class AnimTestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AnimTestScene' });
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.animations = [
            'male_idle', 'male_run', 'male_death',
            'female_idle', 'female_run', 'female_death'
        ];
        this.currentAnimIndex = 0;
        this.isAutoPlaying = false;

        // Dark background
        this.add.rectangle(w / 2, h / 2, w, h, 0x111122);

        // Center reference line (vertical)
        this.refLine = this.add.rectangle(w / 2, h / 2, 2, 300, 0xff0000, 0.8).setDepth(10);

        // Horizontal ground reference
        const groundY = h / 2 + 100;
        this.add.rectangle(w / 2, groundY, 300, 1, 0x666666, 0.5);

        // Sprite under test
        this.testSprite = this.add.sprite(w / 2, groundY, 'player_sheet')
            .setScale(2)
            .setOrigin(0.5, 1); // bottom-center anchor for ground alignment

        // Frame outline (shows the actual frame boundary)
        this.frameOutline = this.add.graphics().setDepth(5);

        // Info text
        this.infoText = this.add.text(w / 2, 40, '', {
            fontSize: '24px', fill: '#ffffff', fontFamily: 'Arial',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);

        this.frameText = this.add.text(w / 2, 80, '', {
            fontSize: '18px', fill: '#aaaaaa', fontFamily: 'Arial',
            stroke: '#000', strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);

        // Controls
        const btnY = h - 120;
        const btnStyle = { fontSize: '20px', fill: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 };

        // Prev Animation
        this.makeButton(80, btnY - 60, '◀ PREV ANIM', btnStyle, () => this.switchAnim(-1));
        // Next Animation
        this.makeButton(w - 80, btnY - 60, 'NEXT ANIM ▶', btnStyle, () => this.switchAnim(1));

        // Step Back
        this.makeButton(120, btnY, '◀ FRAME', btnStyle, () => this.stepFrame(-1));
        // Step Forward
        this.makeButton(w - 120, btnY, 'FRAME ▶', btnStyle, () => this.stepFrame(1));

        // Auto-play toggle
        this.autoPlayBtn = this.makeButton(w / 2, btnY, '▶ AUTO PLAY', btnStyle, () => this.toggleAutoPlay());

        // Start with first animation paused
        this.showAnimation(0);

        // Keyboard shortcuts
        this.input.keyboard.on('keydown-LEFT', () => this.stepFrame(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.stepFrame(1));
        this.input.keyboard.on('keydown-UP', () => this.switchAnim(-1));
        this.input.keyboard.on('keydown-DOWN', () => this.switchAnim(1));
        this.input.keyboard.on('keydown-SPACE', () => this.toggleAutoPlay());
    }

    makeButton(x, y, label, style, callback) {
        const bg = this.add.rectangle(x, y, 180, 44, 0x333366).setInteractive();
        bg.setStrokeStyle(2, 0x6666aa);
        const txt = this.add.text(x, y, label, style).setOrigin(0.5);
        
        bg.on('pointerover', () => bg.setFillStyle(0x444488));
        bg.on('pointerout', () => bg.setFillStyle(0x333366));
        bg.on('pointerdown', () => callback());
        
        return txt;
    }

    showAnimation(index) {
        this.currentAnimIndex = ((index % this.animations.length) + this.animations.length) % this.animations.length;
        const animKey = this.animations[this.currentAnimIndex];

        this.testSprite.play(animKey);
        
        if (!this.isAutoPlaying) {
            // Pause immediately and show first frame
            this.testSprite.anims.pause();
        }

        this.updateInfo();
    }

    switchAnim(direction) {
        this.showAnimation(this.currentAnimIndex + direction);
    }

    stepFrame(direction) {
        if (this.isAutoPlaying) {
            this.toggleAutoPlay();
        }

        const anim = this.testSprite.anims;
        if (!anim || !anim.currentAnim) return;

        const frames = anim.currentAnim.frames;
        const currentIdx = anim.currentFrame ? frames.indexOf(anim.currentFrame) : 0;
        let newIdx = currentIdx + direction;

        // Wrap around
        if (newIdx < 0) newIdx = frames.length - 1;
        if (newIdx >= frames.length) newIdx = 0;

        anim.setCurrentFrame(frames[newIdx]);
        anim.pause();

        this.updateInfo();
    }

    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        
        if (this.isAutoPlaying) {
            this.testSprite.anims.resume();
            this.autoPlayBtn.setText('⏸ PAUSE');
        } else {
            this.testSprite.anims.pause();
            this.autoPlayBtn.setText('▶ AUTO PLAY');
        }
    }

    updateInfo() {
        const animKey = this.animations[this.currentAnimIndex];
        const anim = this.testSprite.anims;
        const currentFrame = anim.currentFrame;
        const totalFrames = anim.currentAnim ? anim.currentAnim.frames.length : 0;
        const frameIdx = currentFrame ? anim.currentAnim.frames.indexOf(currentFrame) : 0;
        const textureFrame = currentFrame ? currentFrame.frame.name : '?';

        this.infoText.setText(`Animation: ${animKey}`);
        this.frameText.setText(`Frame ${frameIdx + 1}/${totalFrames} (texture idx: ${textureFrame})`);

        // Draw frame outline
        this.drawFrameOutline();
    }

    drawFrameOutline() {
        this.frameOutline.clear();
        
        const sprite = this.testSprite;
        const frame = sprite.anims.currentFrame?.frame;
        if (!frame) return;

        const scaleX = sprite.scaleX;
        const scaleY = sprite.scaleY;
        const drawW = frame.width * scaleX;
        const drawH = frame.height * scaleY;
        const ox = sprite.x - drawW * sprite.originX;
        const oy = sprite.y - drawH * sprite.originY;

        // Frame boundary (green dashed effect)
        this.frameOutline.lineStyle(2, 0x00ff00, 0.6);
        this.frameOutline.strokeRect(ox, oy, drawW, drawH);

        // Center crosshair
        const cx = sprite.x;
        const cy = sprite.y - drawH * (1 - sprite.originY);
        this.frameOutline.lineStyle(1, 0xffff00, 0.4);
        this.frameOutline.lineBetween(cx - 20, sprite.y, cx + 20, sprite.y);
    }

    update() {
        if (this.isAutoPlaying) {
            this.updateInfo();
        }
    }
}
