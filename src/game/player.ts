import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/Addons.js';
import { blocks } from './blocks';
import { Tool } from './tool';
import { Container, emptyItem } from './container';
import { World } from './world';
import type { Game } from './game';
import { WorkbenchUI } from './crafting/workbenchUI';

const CENTER_SCREEN: THREE.Vector2 = new THREE.Vector2();

export class Player {
    game: Game;

    radius: number = 0.5;
    height: number = 1.75;

    jumpSpeed: number = 10;
    onGround: boolean = false;

    maxSpeed: number = 10;
    input: THREE.Vector3 = new THREE.Vector3();
    velocity: THREE.Vector3 = new THREE.Vector3();

    #worldVelocity: THREE.Vector3 = new THREE.Vector3();

    camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
    cameraHelper: THREE.CameraHelper = new THREE.CameraHelper(this.camera);
    controls: PointerLockControls = new PointerLockControls(this.camera, document.body);

    boundsHelper: THREE.Mesh;

    raycaser: THREE.Raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 5);
    selectedCoords: THREE.Vector3 | null = null;
    selectedCoordsPlace: THREE.Vector3 | null = null;
    selectionHelper: THREE.Mesh;
    activeBlockId: number = blocks.empty.id;

    tool: Tool = new Tool();

    world: World

    inventory: Container = new Container(36);
    uiShown: boolean = false;
    inventoryAbortController: AbortController = new AbortController();

    constructor(scene: THREE.Scene, world: World, game: Game, loadFromSave: boolean = false) {
        this.game = game;
        if (loadFromSave)
            this.loadInventoryFromSave();
        this.activeBlockId = this.inventory.getItemAt(this.getHotbarActiveSlot()).blockId;
        this.updateToolVisibility();

        this.world = world;
        this.world.definePlayer(this);
        this.position.set(0, 1, 0);

        if (!loadFromSave)
            this.world.respawnPlayer();
        else
            this.world.respawnPlayer(
                JSON.parse(localStorage.getItem('player_position') || '{}'),
                JSON.parse(localStorage.getItem('player_rotation') || '{}')
            );
        this.camera.layers.enable(1);
        scene.add(this.camera);
        this.cameraHelper.visible = false;
        scene.add(this.cameraHelper);

        this.camera.add(this.tool);

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));

        this.boundsHelper = new THREE.Mesh(
            new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
            new THREE.MeshBasicMaterial({ wireframe: true })
        );
        
        this.boundsHelper.visible = false;
        scene.add(this.boundsHelper);

        const selectionMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.3,
            color: 0xffffaa,
        });
        const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
        this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
        scene.add(this.selectionHelper);

        this.raycaser.layers.set(0);
    }

    get worldVelocity(): THREE.Vector3 {
        this.#worldVelocity.copy(this.velocity);
        this.#worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
        return this.#worldVelocity;
    }

    get position(): THREE.Vector3 {
        return this.camera.position;
    }

    update(world : World) {
        this.updateRaycaster(world);
        this.tool.update();
        if (Math.random() < 0.005) {
            this.updateHotbarDisplay();
        }
    }

    updateRaycaster(world : World) {
        this.raycaser.setFromCamera(CENTER_SCREEN, this.camera);
        const intersections = this.raycaser.intersectObject(world, true);

        if (intersections.length > 0) {
            const intersection = intersections[0];

            const chunk = intersection.object.parent;
            if (!(chunk instanceof THREE.Group)) {
                return;
            }
            
            const blockMatrix = new THREE.Matrix4();
            if (
                intersection.object instanceof THREE.InstancedMesh &&
                intersection.instanceId !== undefined
            ) {
                intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);
                this.selectedCoords = chunk.position.clone();
                this.selectedCoords.applyMatrix4(blockMatrix);
                if (this.activeBlockId !== blocks.empty.id && intersection.normal) {
                    this.selectedCoordsPlace = this.selectedCoords.clone();
                    this.selectedCoordsPlace.add(intersection.normal);
                }
            } else {
                this.selectedCoords = intersection.point.clone().floor();
            }

            this.selectionHelper.position.copy(this.selectedCoords);
            this.selectionHelper.visible = true;
        } else {
            this.selectedCoords = null;
            this.selectionHelper.visible = false;
        }
    }

    applyWorldDeltaVelocity(delta: THREE.Vector3) {
        delta.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
        this.velocity.add(delta);
    }

    applyInputs(dt: number) {
        if (!this.controls.isLocked) return;

        this.velocity.x = this.input.x;
        this.velocity.z = this.input.z;
        this.controls.moveRight(this.velocity.x * dt);
        this.controls.moveForward(this.velocity.z * dt);
        this.position.y += this.velocity.y * dt;
        document.getElementById("player-position")!.innerText = this.toString();
    }

    updateBoundsHelper() {
        this.boundsHelper.position.copy(this.position);
        this.boundsHelper.position.y -= this.height / 2;
    }

    closeInventory() {
        const inventoryElement = document.getElementById('inventory');
        if (!inventoryElement) return;
        inventoryElement.classList.add('hidden');
        this.controls.lock();
        this.uiShown = false;
        this.inventoryAbortController.abort();
        const dragged = document.getElementById('dragged-item')!;
        if (dragged.style.display === 'block') {
            dragged.style.display = 'none';
            dragged.innerHTML = ''; // Clear the dragged item
        }
        if (this.inventory.grabbedItem.blockId !== -1) {
            const addedToInventory = this.inventory.addItem(this.inventory.grabbedItem);
            if (!addedToInventory) {
                //TODO: Drop item on the ground if inventory is empty
                console.warn('Inventory is full, item not added:', this.inventory.grabbedItem);
            }
            this.inventory.grabbedItem = emptyItem;
        }
    }

    toggleInventory() {
        const inventoryElement = document.getElementById('inventory');
        if (inventoryElement) {
            if (inventoryElement.classList.contains('hidden')) {
                inventoryElement.classList.remove('hidden');
                this.controls.unlock();
                this.uiShown = true;
                this.updateInventoryDisplay();
            } else {
                inventoryElement.classList.add('hidden');
                this.controls.lock();
                this.uiShown = false;
                this.inventoryAbortController.abort(); // Clear any ongoing inventory updates
            }
        }
    }

    getHotbarActiveSlot(): number {
        const hotbarElements = document.querySelectorAll('.toolbar-icon');
        for (let i = 0; i < hotbarElements.length; i++) {
            if (hotbarElements[i].classList.contains('selected')) {
                return i;
            }
        }
        return 0; // Default to the first slot if none is selected
    }

    useItem() {
        // decrement the item amount in the inventory item selected by hotbar
        const selectedIndex = this.getHotbarActiveSlot();
        const item = this.inventory.getItemAt(selectedIndex);
        if (item.blockId === -1 || item.blockId === blocks.empty.id) return;
        if (item.amount > 1) {
            item.amount--;
            this.updateHotbarDisplay();
        } else {
            this.inventory.removeItem(selectedIndex);
            this.updateHotbarDisplay();
        }
    }

    updateInventoryDisplay() {
        this.inventoryAbortController.abort();
        this.inventoryAbortController = new AbortController();
        if (!this.uiShown) return;
        const inventoryGrid = document.getElementById('inventory-grid');
        if (inventoryGrid) {
            inventoryGrid.innerHTML = ''; // Clear previous items
            var index = 0;
            for (const item of this.inventory.items) {
                // create inventory item elements
                const itemElement = document.createElement('div');
                itemElement.classList.add('inventory-item');
                itemElement.setAttribute('data-id', index.toString());
                if (item.blockId != -1 && item.texture) {
                    const itemImage = document.createElement('img');
                    itemImage.src = item.texture;
                    itemImage.alt = Object.values(blocks).find(b => b.id === item.blockId)?.name || '';
                    itemElement.appendChild(itemImage);
                    const itemCount = document.createElement('span');
                    itemCount.innerText = item.amount.toString();
                    itemElement.appendChild(itemCount);
                }
                inventoryGrid.appendChild(itemElement);
                itemElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const index = Number(itemElement.getAttribute('data-id'));
                    const item = this.inventory.items[index];
                    if (item.blockId !== -1 && this.inventory.grabbedItem.blockId === -1) {
                        this.inventory.grabbedItem = item;
                        this.inventory.removeItem(index);
                        this.updateGrabbedItemDisplay();
                    } else if (this.inventory.grabbedItem.blockId !== -1) {
                        const added = this.inventory.addItem(this.inventory.grabbedItem, index);
                        if (added) {
                            this.inventory.grabbedItem = emptyItem;
                            this.updateGrabbedItemDisplay();
                        } else {
                            console.warn('Inventory is full, item not added:', this.inventory.grabbedItem);
                        }
                    }
                    this.updateInventoryDisplay();
                });
                index++;
            }
            document.addEventListener('mousemove', (e) => {
                if (!this.uiShown || this.inventory.grabbedItem.blockId === -1) return;
                const dragged = document.getElementById('dragged-item');
                if (!dragged) return;
                if (dragged.style.display === 'block') {
                    dragged.style.left = `${e.clientX + 5}px`;
                    dragged.style.top = `${e.clientY + 5}px`;
                }
            }, { signal: this.inventoryAbortController.signal });
        }
        document.getElementById('close-inventory')!.addEventListener(
            'click',
            this.closeInventory.bind(this),
            { signal: this.inventoryAbortController.signal }
        );
    }

    updateToolVisibility() {
        if (this.activeBlockId === -1) {
            this.activeBlockId = blocks.empty.id;
            this.tool.visible = true;
        } else {
            this.tool.visible = false;
        }
    }

    loadInventoryFromSave() {
        const savedInventory = JSON.parse(localStorage.getItem('player_inventory') || '[]');
        this.inventory.loadItemsFromSave(savedInventory);
        this.updateHotbarDisplay();
        this.activeBlockId = this.inventory.getItemAt(this.getHotbarActiveSlot()).blockId;
        this.updateToolVisibility();
    }

    updateHotbarDisplay() {
        for (let i = 0; i < 9; i++) {
            const hotbarElement = document.getElementById(`toolbar-${i + 1}`);
            if (!hotbarElement) continue;
            const item = this.inventory.getItemAt(i);
            if (item.blockId !== -1 && item.texture) {
                hotbarElement.innerHTML = `
                <img src="${item.texture}" alt="${Object.values(blocks).find(b => b.id === item.blockId)?.name || ''}" style="width: 64px; height: 64px; object-fit: cover;">
                <span style="position: absolute; bottom: 0; right: 0; color: #fff;">${item.amount}</span>
                `; // Clear previous content
            } else {
                hotbarElement.innerHTML = '';
            }
        }

    }

    updateGrabbedItemDisplay() {
        const isEmpty = this.inventory.grabbedItem.blockId === -1;
        const dragged = document.getElementById('dragged-item')!;
        dragged.innerHTML = '';
        dragged.style.display = 'block';

        dragged.innerHTML = '';
        if (isEmpty) {
            dragged.style.display = 'none';
            return;
        }
        dragged.style.display = 'block';

        const img = document.createElement('img');
        img.src = this.inventory.grabbedItem.texture;
        img.style.width = '32px';
        img.style.height = '32px';
        dragged.appendChild(img);

        const span = document.createElement('span');
        span.innerText = this.inventory.grabbedItem.amount.toString();
        span.style.position = 'absolute';
        span.style.bottom = '0';
        span.style.right = '0';
        span.style.color = '#fff';
        dragged.appendChild(span);
    }

    onMouseDown(e: MouseEvent) {
        if (this.game.cameraMode !== 'first-person') return;
        if (!this.controls.isLocked && !this.uiShown) {
            e.preventDefault();
            e.stopPropagation();
            this.controls.lock();
        }
    }

    selectHotBarSlot(slotIndex: number) {
        if (slotIndex < 0 || slotIndex > 9) return;
        const hotbarItem = this.inventory.getItemAt(slotIndex - 1);
        if (!hotbarItem) return;

        // Remove old selection
        for (let i = 0; i < 10; i++) {
            document.getElementById(`toolbar-${i}`)?.classList.remove('selected');
        }
        document.getElementById(`toolbar-${slotIndex}`)?.classList.add('selected');
        this.activeBlockId = hotbarItem.blockId === -1 ? blocks.empty.id : hotbarItem.blockId;
        this.updateToolVisibility();
    }

    dropItem(amount: number) {
        const selectedIndex = this.getHotbarActiveSlot();
        const item = this.inventory.getItemAt(selectedIndex);
        if (item.blockId === -1 || item.blockId === blocks.empty.id) return;
        if (amount <= 0 || amount > item.amount)
            amount = item.amount;
        if (amount <= 0) return;
        const droppedItem = { ...item, amount: amount };
        this.inventory.items[selectedIndex].amount -= amount;
        if (this.inventory.items[selectedIndex].amount <= 0) {
            this.inventory.removeItem(selectedIndex);
        }
        this.updateHotbarDisplay();
        this.world.dropItem(droppedItem, this.position.clone().sub(new THREE.Vector3(0, 1, 0)), this.camera.rotation);
    }

    onKeyDown(e: KeyboardEvent) {
        if (!this.controls.isLocked && !this.uiShown) {
            this.controls.lock();
        }
        switch (e.code) {
            case 'KeyW':
                this.input.z = this.maxSpeed;
                break;
            case 'KeyS':
                this.input.z = -this.maxSpeed;
                break;
            case 'KeyA':
                this.input.x = -this.maxSpeed;
                break;
            case 'KeyD':
                this.input.x = this.maxSpeed;
                break;
            case 'KeyQ':
                this.dropItem(1);
                break;
            case 'KeyR':
                this.world.respawnPlayer();
                break;
            case 'KeyE':
                this.toggleInventory();
                break;
            case 'KeyV':
                WorkbenchUI.openUI(this, 'crafting');
                break;
            case 'Space':
                if (this.onGround) {
                    this.velocity.y += this.jumpSpeed;
                }
                break;
            case 'Digit0':
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
            case 'Digit6':
            case 'Digit7':
            case 'Digit8':
            case 'Digit9':
                const hotbarIndex = Number(e.code.replace('Digit', ''));
                if (hotbarIndex < 0 || hotbarIndex > 9) return;
                this.selectHotBarSlot(hotbarIndex);
                break;
            default:
                break;
        }
    }

    onKeyUp(e: KeyboardEvent) {
        switch (e.code) {
            case 'KeyW':
            case 'KeyS':
                this.input.z = 0;
                break;
            case 'KeyA':
            case 'KeyD':
                this.input.x = 0;
                break;
            default:
                break;
        }
    }

    toString() {
        return `X: ${this.position.x.toFixed(2)} Y: ${this.position.y.toFixed(2)} Z:${this.position.z.toFixed(2)}`;
    }
}