/**
 * UIPlacementTestScene - Visual testbed for positioning UI elements
 * 
 * Access via: http://localhost:5173/?uitestbed
 * 
 * Features:
 * - Renders the actual dashboard background (main_dashboard, hud_bottom)
 * - All bottom-nav icons & labels are draggable
 * - All upgrade-row icons & texts are draggable
 * - Per-element horizontal + vertical scaling via scroll wheel or buttons
 * - Save button persists positions/scales to localStorage
 * - Load restores saved layout on startup
 * - Reset clears saved data
 * - Info panel shows real-time x, y, scaleX, scaleY of selected element
 */
export default class UIPlacementTestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIPlacementTestScene' });
    }

    create() {
        const w = this.scale.width;   // 720
        const h = this.scale.height;  // 1280

        this.placedElements = [];   // { id, obj, defaultX, defaultY, defaultSX, defaultSY }
        this.selectedElement = null;
        this.controlUI = [];        // UI elements for the control panel (non-draggable)

        // ── Background ───────────────────────────────────────────────────────
        this.add.rectangle(w / 2, h / 2, w, h, 0x111122);

        // Dashboard (same as UIScene)
        const dashboardY = 878;
        this.dashContainer = this.add.container(w / 2, dashboardY);

        const mainDash = this.add.image(0, 0, 'main_dashboard')
            .setOrigin(0.5)
            .setDisplaySize(w, 640);

        const hudBottom = this.add.image(0, 361, 'hud_bottom')
            .setOrigin(0.5)
            .setScale(w / 1376)
            .setDepth(-1);

        this.dashContainer.add([mainDash, hudBottom]);

        // ── Skill Row (Auto + 6 Skills) ──────────────────────────────────────
        const relSkillY = -256;   // same as UIScene
        const sW = 84;
        const skillStartX = -w / 2 + (w / 7 * 1.5);
        const skillGap = w / 7;

        // Auto toggle icon (circular arrow)
        const autoX = -w / 2 + (w / 7 * 0.5);
        const autoIcon = this.add.text(0, 0, '↻', {
            fontSize: '32px', fill: '#ffffff'
        }).setOrigin(0.5);
        const autoWorldX = w / 2 + autoX;
        const autoWorldY = dashboardY + relSkillY;
        autoIcon.setPosition(autoWorldX, autoWorldY);
        this.registerElement('skill_auto', autoIcon, autoWorldX, autoWorldY);

        // 6 Skills
        const skillData = [
            { name: 'Feuer', icon: '🔥', sprite: null },
            { name: 'Frost', sprite: 'skill_sheet', frame: 0 },
            { name: 'Blitz', sprite: 'skill_sheet', frame: 1 },
            { name: 'Heilen', sprite: 'skill_sheet', frame: 2 },
            { name: 'Sterne', icon: '✨', sprite: null },
            { name: 'Schild', icon: '🛡️', sprite: null }
        ];

        skillData.forEach((sk, i) => {
            const bx = skillStartX + i * skillGap;
            const skillWorldX = w / 2 + bx;
            const skillWorldY = dashboardY + relSkillY;

            let obj;
            if (sk.sprite) {
                obj = this.add.sprite(0, 0, sk.sprite, sk.frame).setOrigin(0.5);
                const targetSize = sW - 30;
                obj.setDisplaySize(targetSize, targetSize);
            } else {
                obj = this.add.text(0, 0, sk.icon, { fontSize: '28px' }).setOrigin(0.5);
            }
            obj.setPosition(skillWorldX, skillWorldY);

            this.registerElement(`skill_${i}_${sk.name}`, obj, skillWorldX, skillWorldY,
                obj.scaleX, obj.scaleY);
        });

        // ── Bottom Nav Items ─────────────────────────────────────────────────
        const relNavY = 342;
        const navItems = [
            { name: 'Equipment', icon: '⚔️' },
            { name: 'Costume', icon: '🐕' },
            { name: 'Skill', icon: '📖' },
            { name: 'Summon', icon: '✨' },
            { name: 'Adventure', icon: '🧭' },
            { name: 'Shop', icon: '💎' }
        ];

        navItems.forEach((item, i) => {
            const ix = (w / (navItems.length + 1)) * (i + 1);
            const relX = ix - w / 2;

            // Icon
            const iconObj = this.add.text(0, 0, item.icon, { fontSize: '28px' })
                .setOrigin(0.5);
            const iconWorldX = w / 2 + relX;
            const iconWorldY = dashboardY + relNavY - 10;
            iconObj.setPosition(iconWorldX, iconWorldY);

            this.registerElement(`nav_icon_${i}_${item.name}`, iconObj, iconWorldX, iconWorldY);

            // Label
            const labelObj = this.add.text(0, 0, item.name, {
                fontSize: '10px', fill: '#ffffff'
            }).setOrigin(0.5);
            const labelWorldX = iconWorldX;
            const labelWorldY = dashboardY + relNavY + 25;
            labelObj.setPosition(labelWorldX, labelWorldY);

            this.registerElement(`nav_label_${i}_${item.name}`, labelObj, labelWorldX, labelWorldY);
        });

        // ── Upgrade Row Icons & Texts ────────────────────────────────────────
        const UI_ROW_START_Y = 732;
        const UI_ROW_GAP = 98.5;
        const upgrades = [
            { id: 'damage', name: 'Damage', icon: 'icon_damage' },
            { id: 'hp', name: 'HP', icon: 'icon_hp' },
            { id: 'hpRegen', name: 'HP Regen', icon: 'icon_regen' },
            { id: 'crit', name: 'Crit Rate', icon: 'icon_crit_rate' },
            { id: 'critDamage', name: 'Crit Damage', icon: 'icon_crit_dmg' }
        ];

        upgrades.forEach((upg, i) => {
            const rowRelY = (UI_ROW_START_Y + i * UI_ROW_GAP) - dashboardY;

            // Icon (image)
            const iconImg = this.add.image(0, 0, upg.icon).setOrigin(0.5);
            const iconScale = 80 / Math.max(iconImg.width, iconImg.height);
            iconImg.setScale(iconScale);
            const iconWorldX = w / 2 - 295;
            const iconWorldY = dashboardY + rowRelY;
            iconImg.setPosition(iconWorldX, iconWorldY);

            this.registerElement(`upg_icon_${upg.id}`, iconImg, iconWorldX, iconWorldY, iconScale, iconScale);

            // Title text
            const titleText = this.add.text(0, 0, `${upg.name} Lv.1`, {
                fontSize: '18px', fill: '#E0E0FF', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5, 0.5);
            const titleWorldX = w / 2 - 180;
            const titleWorldY = dashboardY + rowRelY - 14;
            titleText.setPosition(titleWorldX, titleWorldY);

            this.registerElement(`upg_title_${upg.id}`, titleText, titleWorldX, titleWorldY);

            // Value text
            const valText = this.add.text(0, 0, `20.1 -> 22.1`, {
                fontSize: '15px', fill: '#B0B0CC', fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);
            const valWorldX = w / 2 - 180;
            const valWorldY = dashboardY + rowRelY + 14;
            valText.setPosition(valWorldX, valWorldY);

            this.registerElement(`upg_val_${upg.id}`, valText, valWorldX, valWorldY);

            // Cost text
            const costText = this.add.text(0, 0, `3`, {
                fontSize: '18px', fill: '#FFD700', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5, 0.5);
            const costWorldX = w / 2 + 270;
            const costWorldY = dashboardY + rowRelY;
            costText.setPosition(costWorldX, costWorldY);

            this.registerElement(`upg_cost_${upg.id}`, costText, costWorldX, costWorldY);
        });

        // ── Load saved positions ─────────────────────────────────────────────
        this.loadPositions();

        // ── Control Panel (top, non-draggable) ───────────────────────────────
        this.buildControlPanel();

        // ── Input: scroll wheel for scaling ──────────────────────────────────
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (!this.selectedElement) return;
            const el = this.selectedElement;
            const step = deltaY > 0 ? -0.02 : 0.02;

            if (pointer.event.shiftKey) {
                // Vertical scale
                el.obj.scaleY = Math.max(0.05, el.obj.scaleY + step);
            } else {
                // Horizontal scale
                el.obj.scaleX = Math.max(0.05, el.obj.scaleX + step);
            }
            this.updateInfoPanel();
        });

        // Click background to deselect
        this.input.on('pointerdown', (pointer) => {
            // Check if we clicked on a placed element
            const clickedAny = this.placedElements.some(el => {
                const bounds = el.obj.getBounds();
                return bounds.contains(pointer.x, pointer.y);
            });
            if (!clickedAny) {
                this.deselectAll();
            }
        });
    }

    registerElement(id, obj, defaultX, defaultY, defaultSX, defaultSY) {
        defaultSX = defaultSX ?? obj.scaleX;
        defaultSY = defaultSY ?? obj.scaleY;

        obj.setInteractive({ draggable: true });
        obj.setDepth(10);

        const el = { id, obj, defaultX, defaultY, defaultSX, defaultSY };
        this.placedElements.push(el);

        obj.on('pointerdown', () => {
            this.selectElement(el);
        });

        obj.on('drag', (pointer, dragX, dragY) => {
            obj.setPosition(dragX, dragY);
            this.updateInfoPanel();
        });
    }

    selectElement(el) {
        this.deselectAll();
        this.selectedElement = el;
        el.obj.setTint(0x00ffff);
        this.updateInfoPanel();
    }

    deselectAll() {
        if (this.selectedElement) {
            this.selectedElement.obj.clearTint();
        }
        this.selectedElement = null;
        this.updateInfoPanel();
    }

    // ── Control Panel ────────────────────────────────────────────────────────
    buildControlPanel() {
        const w = this.scale.width;
        const panelY = 30;

        // Semi-transparent background for panel (taller to fit input row)
        const panelBg = this.add.rectangle(w / 2, panelY + 70, w, 180, 0x000000, 0.85)
            .setDepth(100).setOrigin(0.5);
        this.controlUI.push(panelBg);

        // Info (element name)
        this.infoText = this.add.text(w / 2, panelY, 'Click an element to select', {
            fontSize: '14px', fill: '#ffffff', fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5).setDepth(101);
        this.controlUI.push(this.infoText);

        // ── Editable Input Fields (HTML DOM overlay) ─────────────────────────
        this.buildInputFields();

        // Scale buttons row
        const btnStyle = { fontSize: '13px', fill: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold' };
        const btnY = panelY + 60;

        this.makeControlBtn(60, btnY, 'ScaleX -', btnStyle, () => this.adjustScale('x', -0.05));
        this.makeControlBtn(160, btnY, 'ScaleX +', btnStyle, () => this.adjustScale('x', 0.05));
        this.makeControlBtn(280, btnY, 'ScaleY -', btnStyle, () => this.adjustScale('y', -0.05));
        this.makeControlBtn(380, btnY, 'ScaleY +', btnStyle, () => this.adjustScale('y', 0.05));
        this.makeControlBtn(510, btnY, 'Scale Both -', btnStyle, () => {
            this.adjustScale('x', -0.05);
            this.adjustScale('y', -0.05);
        });
        this.makeControlBtn(640, btnY, 'Scale Both +', btnStyle, () => {
            this.adjustScale('x', 0.05);
            this.adjustScale('y', 0.05);
        });

        // Save / Reset / Export row
        const actionY = panelY + 100;
        this.makeControlBtn(120, actionY, '💾 SAVE', { ...btnStyle, fill: '#00ff00' }, () => this.savePositions());
        this.makeControlBtn(300, actionY, '🔄 RESET', { ...btnStyle, fill: '#ff6600' }, () => this.resetPositions());
        this.makeControlBtn(500, actionY, '📋 COPY JSON', { ...btnStyle, fill: '#00ccff' }, () => this.exportJSON());

        // Element list (scrollable via Up/Down keys)
        this.input.keyboard.on('keydown-TAB', (e) => {
            e.preventDefault();
            this.cycleSelection(1);
        });
        this.input.keyboard.on('keydown-ESC', () => {
            this.deselectAll();
        });
        // Arrow keys for fine positioning (only when no input is focused)
        this.input.keyboard.on('keydown-LEFT', () => {
            if (!this.isInputFocused()) this.nudge(-1, 0);
        });
        this.input.keyboard.on('keydown-RIGHT', () => {
            if (!this.isInputFocused()) this.nudge(1, 0);
        });
        this.input.keyboard.on('keydown-UP', () => {
            if (!this.isInputFocused()) this.nudge(0, -1);
        });
        this.input.keyboard.on('keydown-DOWN', () => {
            if (!this.isInputFocused()) this.nudge(0, 1);
        });
    }

    /**
     * Creates HTML input fields overlaid on top of the canvas for editing
     * x, y, scaleX, scaleY values directly.
     */
    buildInputFields() {
        const canvas = this.game.canvas;
        const canvasRect = canvas.getBoundingClientRect();

        // Container div for all inputs
        this.inputContainer = document.createElement('div');
        this.inputContainer.id = 'ui-placement-inputs';
        this.inputContainer.style.cssText = `
            position: absolute;
            top: ${canvasRect.top + 20}px;
            left: ${canvasRect.left}px;
            width: ${canvasRect.width}px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            pointer-events: none;
            z-index: 1000;
            font-family: Arial, sans-serif;
            font-size: 12px;
        `;

        const inputStyle = `
            width: 60px;
            padding: 3px 6px;
            background: #222244;
            border: 1px solid #6666aa;
            border-radius: 3px;
            color: #ffffff;
            font-family: monospace;
            font-size: 13px;
            text-align: center;
            pointer-events: auto;
            outline: none;
        `;

        const labelStyle = `color: #aaaacc; font-size: 12px; pointer-events: none;`;

        const fields = [
            { id: 'x', label: 'X:', width: '65px' },
            { id: 'y', label: 'Y:', width: '65px' },
            { id: 'scaleX', label: 'ScaleX:', width: '65px' },
            { id: 'scaleY', label: 'ScaleY:', width: '65px' }
        ];

        this.domInputs = {};

        fields.forEach(f => {
            const lbl = document.createElement('span');
            lbl.textContent = f.label;
            lbl.style.cssText = labelStyle;
            this.inputContainer.appendChild(lbl);

            const inp = document.createElement('input');
            inp.type = 'text';
            inp.style.cssText = inputStyle;
            inp.style.width = f.width;
            inp.disabled = true;
            inp.placeholder = '-';

            // Apply value on Enter
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.applyInputValue(f.id, inp.value);
                    inp.blur();
                }
            });

            // Focus style
            inp.addEventListener('focus', () => {
                inp.style.borderColor = '#00ffff';
                inp.select();
            });
            inp.addEventListener('blur', () => {
                inp.style.borderColor = '#6666aa';
            });

            this.inputContainer.appendChild(inp);
            this.domInputs[f.id] = inp;
        });

        // Add to DOM
        canvas.parentElement.style.position = 'relative';
        canvas.parentElement.appendChild(this.inputContainer);

        // Reposition on resize
        this.scale.on('resize', () => {
            const rect = this.game.canvas.getBoundingClientRect();
            this.inputContainer.style.top = `${rect.top + 20}px`;
            this.inputContainer.style.left = `${rect.left}px`;
            this.inputContainer.style.width = `${rect.width}px`;
        });

        // Cleanup on scene shutdown
        this.events.on('shutdown', () => this.destroyInputFields());
        this.events.on('destroy', () => this.destroyInputFields());
    }

    destroyInputFields() {
        if (this.inputContainer && this.inputContainer.parentElement) {
            this.inputContainer.parentElement.removeChild(this.inputContainer);
        }
    }

    isInputFocused() {
        if (!this.domInputs) return false;
        return Object.values(this.domInputs).some(inp => document.activeElement === inp);
    }

    applyInputValue(field, rawValue) {
        if (!this.selectedElement) return;
        const val = parseFloat(rawValue);
        if (isNaN(val)) return;

        const o = this.selectedElement.obj;
        switch (field) {
            case 'x': o.x = Math.round(val); break;
            case 'y': o.y = Math.round(val); break;
            case 'scaleX': o.scaleX = Math.max(0.05, val); break;
            case 'scaleY': o.scaleY = Math.max(0.05, val); break;
        }
        this.updateInfoPanel();
    }

    makeControlBtn(x, y, label, style, callback) {
        const bg = this.add.rectangle(x, y, label.length * 9 + 20, 28, 0x333366)
            .setInteractive().setDepth(101).setOrigin(0.5);
        bg.setStrokeStyle(1, 0x6666aa);
        const txt = this.add.text(x, y, label, style).setOrigin(0.5).setDepth(102);

        bg.on('pointerover', () => bg.setFillStyle(0x444488));
        bg.on('pointerout', () => bg.setFillStyle(0x333366));
        bg.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            callback();
        });

        this.controlUI.push(bg, txt);
    }

    adjustScale(axis, delta) {
        if (!this.selectedElement) return;
        const el = this.selectedElement;
        if (axis === 'x') {
            el.obj.scaleX = Math.max(0.05, el.obj.scaleX + delta);
        } else {
            el.obj.scaleY = Math.max(0.05, el.obj.scaleY + delta);
        }
        this.updateInfoPanel();
    }

    nudge(dx, dy) {
        if (!this.selectedElement) return;
        this.selectedElement.obj.x += dx;
        this.selectedElement.obj.y += dy;
        this.updateInfoPanel();
    }

    cycleSelection(dir) {
        if (this.placedElements.length === 0) return;
        let idx = -1;
        if (this.selectedElement) {
            idx = this.placedElements.indexOf(this.selectedElement);
        }
        idx = ((idx + dir) + this.placedElements.length) % this.placedElements.length;
        this.selectElement(this.placedElements[idx]);
    }

    updateInfoPanel() {
        if (!this.infoText) return;
        if (!this.selectedElement) {
            this.infoText.setText('Click an element to select | TAB=cycle | Arrows=nudge | Scroll=scale');
            // Disable and clear inputs
            if (this.domInputs) {
                Object.values(this.domInputs).forEach(inp => {
                    inp.value = '';
                    inp.disabled = true;
                    inp.placeholder = '-';
                });
            }
            return;
        }
        const el = this.selectedElement;
        const o = el.obj;
        this.infoText.setText(`${el.id}`);

        // Update input fields with current values
        if (this.domInputs) {
            this.domInputs.x.value = Math.round(o.x);
            this.domInputs.y.value = Math.round(o.y);
            this.domInputs.scaleX.value = o.scaleX.toFixed(2);
            this.domInputs.scaleY.value = o.scaleY.toFixed(2);
            Object.values(this.domInputs).forEach(inp => {
                inp.disabled = false;
            });
        }
    }

    // ── Save / Load / Reset ──────────────────────────────────────────────────
    savePositions() {
        const data = {};
        this.placedElements.forEach(el => {
            data[el.id] = {
                x: Math.round(el.obj.x),
                y: Math.round(el.obj.y),
                scaleX: parseFloat(el.obj.scaleX.toFixed(3)),
                scaleY: parseFloat(el.obj.scaleY.toFixed(3))
            };
        });
        localStorage.setItem('ui_placement_config', JSON.stringify(data));
        console.log('UI Placement saved:', data);

        // Flash feedback
        if (this.infoText) {
            this.infoText.setText('✅ SAVED!');
            this.time.delayedCall(1500, () => this.updateInfoPanel());
        }
    }

    loadPositions() {
        const raw = localStorage.getItem('ui_placement_config');
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            this.placedElements.forEach(el => {
                if (data[el.id]) {
                    const d = data[el.id];
                    el.obj.setPosition(d.x, d.y);
                    el.obj.setScale(d.scaleX, d.scaleY);
                }
            });
            console.log('UI Placement loaded:', data);
        } catch (e) {
            console.error('Failed to load UI placement config:', e);
        }
    }

    resetPositions() {
        localStorage.removeItem('ui_placement_config');
        this.placedElements.forEach(el => {
            el.obj.setPosition(el.defaultX, el.defaultY);
            el.obj.setScale(el.defaultSX, el.defaultSY);
        });
        if (this.infoText) {
            this.infoText.setText('🔄 RESET to defaults!');
            this.time.delayedCall(1500, () => this.updateInfoPanel());
        }
    }

    exportJSON() {
        const data = {};
        this.placedElements.forEach(el => {
            data[el.id] = {
                x: Math.round(el.obj.x),
                y: Math.round(el.obj.y),
                scaleX: parseFloat(el.obj.scaleX.toFixed(3)),
                scaleY: parseFloat(el.obj.scaleY.toFixed(3))
            };
        });
        const json = JSON.stringify(data, null, 2);

        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(json).then(() => {
                if (this.infoText) {
                    this.infoText.setText('📋 JSON copied to clipboard!');
                    this.time.delayedCall(1500, () => this.updateInfoPanel());
                }
            });
        }
        console.log('UI Placement JSON:\n', json);
    }
}
