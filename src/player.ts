import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/Addons.js';
import { blocks } from './blocks';

import type { World } from './world';

const CENTER_SCREEN: THREE.Vector2 = new THREE.Vector2();

export class Player {
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
    selectionHelper: THREE.Mesh;
    activeBlockId: number = blocks.grass.id;

    constructor(scene: THREE.Scene) {
        this.position.set(32, 16, 32);
        scene.add(this.camera);
        scene.add(this.cameraHelper);

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));

        this.boundsHelper = new THREE.Mesh(
            new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
            new THREE.MeshBasicMaterial({ wireframe: true })
        );
        scene.add(this.boundsHelper);

        const selectionMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.3,
            color: 0xffffaa,
        });
        const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
        this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
        scene.add(this.selectionHelper);
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
                    this.selectedCoords.add(intersection.normal);
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

    onKeyDown(e: KeyboardEvent) {
        if (!this.controls.isLocked) {
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
            case 'KeyR':
                this.position.set(32, 16, 32);
                this.velocity.set(0, 0, 0);
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
                this.activeBlockId = Number(e.code.replace('Digit', ''));
                console.log(`Active block: ${e.key}`);
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