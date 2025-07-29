import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/Addons.js';

export class Player {
    maxSpeed: number = 10;
    input: THREE.Vector3 = new THREE.Vector3();
    velocity: THREE.Vector3 = new THREE.Vector3();

    camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
    controls: PointerLockControls = new PointerLockControls(this.camera, document.body);

    constructor(scene: THREE.Scene) {
        this.position.set(32, 16, 32);
        scene.add(this.camera);

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    get position(): THREE.Vector3 {
        return this.camera.position;
    }

    applyInputs(dt: number) {
        if (!this.controls.isLocked) return;

        this.velocity.x = this.input.x;
        this.velocity.z = this.input.z;
        this.controls.moveRight(this.velocity.x * dt);
        this.controls.moveForward(this.velocity.z * dt);
        document.getElementById("player-position")!.innerText = this.toString();
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