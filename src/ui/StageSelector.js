/**
 * Stage selector modal dialog.
 */

/**
 * Shows the stage selection modal.
 * @param {Phaser.Scene} scene - The UIScene instance
 */
export function showStageSelector(scene) {
    if (scene.isModalOpen) return;
    scene.isModalOpen = true;

    const w = scene.scale.width;
    const h = scene.scale.height;
    const maxStage = scene.stats.maxStage || 1;
    let selectedStage = scene.stats.stage || 1;

    // Overlay
    const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75).setInteractive();

    // Panel
    const panelW = 600;
    const panelH = 400;
    const panel = scene.add.container(w / 2, h / 2);

    const bg = scene.add.rectangle(0, 0, panelW, panelH, 0x1a1a2e).setStrokeStyle(4, 0x444466);
    const title = scene.add.text(0, -150, 'Wähle eine Stage', {
        fontSize: '32px', fill: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    const currentStageText = scene.add.text(0, -60, `Stage ${selectedStage}`, {
        fontSize: '48px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Slider
    const sliderW = 450;
    const sliderY = 40;
    const sliderTrack = scene.add.rectangle(0, sliderY, sliderW, 10, 0x333344).setOrigin(0.5);
    const sliderThumb = scene.add.circle(0, sliderY, 20, 0xcc8800).setStrokeStyle(3, 0xffffff).setInteractive({ draggable: true });

    // Update thumb position based on selected stage
    const updateThumb = (s) => {
        const pct = maxStage > 1 ? (s - 1) / (maxStage - 1) : 0.5;
        sliderThumb.x = (pct - 0.5) * sliderW;
        currentStageText.setText(`Stage ${s}`);
    };
    updateThumb(selectedStage);

    sliderThumb.on('drag', (pointer, dragX) => {
        dragX = Phaser.Math.Clamp(dragX, -sliderW / 2, sliderW / 2);
        sliderThumb.x = dragX;

        const pct = (dragX + sliderW / 2) / sliderW;
        const s = Math.round(pct * (maxStage - 1)) + 1;
        if (s !== selectedStage) {
            selectedStage = s;
            currentStageText.setText(`Stage ${s}`);
        }
    });

    // OK Button
    const okBtn = scene.add.rectangle(-100, 140, 160, 60, 0x228833).setInteractive().setOrigin(0.5);
    const okText = scene.add.text(-100, 140, 'OK', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

    // Close Button (Cancel)
    const cancelBtn = scene.add.rectangle(100, 140, 160, 60, 0xcc3333).setInteractive().setOrigin(0.5);
    const cancelText = scene.add.text(100, 140, 'X', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

    panel.add([bg, title, currentStageText, sliderTrack, sliderThumb, okBtn, okText, cancelBtn, cancelText]);

    const closeModal = () => {
        overlay.destroy();
        panel.destroy();
        scene.isModalOpen = false;
    };

    okBtn.on('pointerdown', () => {
        const game = scene.scene.get('GameScene');
        if (game && game.jumpToStage) {
            game.jumpToStage(selectedStage);
        }
        closeModal();
    });

    cancelBtn.on('pointerdown', closeModal);
    overlay.on('pointerdown', closeModal);
}
