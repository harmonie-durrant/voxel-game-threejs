import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import { createUI } from './ui';
import { Player } from './player';
import { Physics } from './physics';
import { World } from './world';
import { ModelLoader } from './modelLoader';
import { blocks } from './blocks';

export class Game {
    stats: Stats | null = null;

    renderer: THREE.WebGLRenderer | null = null;

    scene: THREE.Scene | null = null;
    world: World | null = null;
    player: Player | null = null;
    physics: Physics | null = null;
    modelLoader: ModelLoader | null = null;

    orbitCamera: THREE.PerspectiveCamera | null = null;
    controls: OrbitControls | null = null;

    sun: THREE.DirectionalLight | null = null;
    sunHelper: THREE.CameraHelper | null = null;
    previousTime: number = performance.now();

    cameraMode: String = 'first-person';

    constructor(loadFromSave: boolean = false) {
        const gameContainer = document.getElementById('game_ui_container');
        if (!gameContainer) {
            console.error('Game container not found');
            return;
        }
        this.stats = new Stats();
        this.stats.showPanel(0);
        gameContainer.append(this.stats.dom);

        this.renderer = new THREE.WebGLRenderer({
          powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x80a0e0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        gameContainer.appendChild(this.renderer.domElement);
        gameContainer.classList.remove('hidden');
        const mainMenuContainer = document.getElementById('main_menu_container');
        if (mainMenuContainer) {
            mainMenuContainer.classList.add('hidden');
        }

        this.orbitCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight);
        this.orbitCamera.position.set(70, 32, 70);
        this.orbitCamera.layers.enable(1);

        // OrbitControls setup
        this.controls = new OrbitControls(this.orbitCamera, this.renderer.domElement);
        this.controls.target.set(32, 8, 32);

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x80a0e0, 25, 70);
        this.world = new World();
        this.world.generate(true);
        this.scene.add(this.world);

        this.player = new Player(this.scene);
        this.physics = new Physics(this.scene);
        
        this.modelLoader = new ModelLoader();
        this.modelLoader.loadModels((models) => {
          if (models.pickaxe) {
            // Find the first Mesh in the Group and pass it to setMesh
            const mesh = models.pickaxe.getObjectByProperty('type', 'Mesh') as THREE.Mesh;
            if (mesh) {
              this.player?.tool.setMesh(mesh);
            }
          }
        });
        
        this.sun = new THREE.DirectionalLight();
        this.sunHelper = new THREE.CameraHelper(this.sun.shadow.camera);

        this.setupLights();
        createUI(this.scene, this.world, this.player, this.sunHelper, this.physics);
        this.animate();
        this.addEventListeners();

        if (loadFromSave) {
            this.world?.load();
        }
        this.player.controls.lock();
    }

    setupLights() {
        if (!this.sun || !this.sunHelper || !this.scene) return;
        this.sun.position.set(50, 50, 50);
        this.sun.castShadow = true;
        this.sun.shadow.camera.left = -50;
        this.sun.shadow.camera.right = 50;
        this.sun.shadow.camera.top = 50;
        this.sun.shadow.camera.bottom = -50;
        this.sun.shadow.camera.near = 0.1;
        this.sun.shadow.camera.far = 200;
        this.sun.shadow.bias = -0.001;
        this.sun.shadow.mapSize = new THREE.Vector2(1024, 1024);
        this.scene.add(this.sun);
        this.scene.add(this.sun.target);
        this.sunHelper.visible = false;
        this.scene.add(this.sunHelper);

        const ambient = new THREE.AmbientLight();
        ambient.intensity = 0.1;
        this.scene.add(ambient);
    }

    animate() {
        let currentTime = performance.now();
        let dt = (currentTime - this.previousTime) / 1000;
        this.previousTime = currentTime;
        this.stats?.begin();

        requestAnimationFrame(this.animate.bind(this));

        if (this.player?.controls.isLocked) {
            if (this.world) {
                this.player?.update(this.world);
                this.physics?.update(dt, this.player, this.world);
                this.world?.update(this.player);
            }

            if (this.sun && this.player) {
                this.sun.position.copy(this.player.position);
                this.sun.position.add(new THREE.Vector3(50, 50, 50));
                this.sun.target.position.copy(this.player.position);
            }
        }

        if (this.scene && this.renderer && this.orbitCamera) {
            const camera = (this.cameraMode === 'orbit') ? this.orbitCamera : this.player?.camera;
            if (camera) {
                this.renderer?.render(this.scene, camera);
            }
        }
        this.stats?.end();
        this.previousTime = currentTime;
    }

    onMouseDown(event: MouseEvent) {
        if (!this.player || !this.world) return;
        if (!this.player.controls.isLocked || !this.player.selectedCoords) return;
        event.preventDefault();
        if (this.player.activeBlockId === blocks.empty.id) {
            this.player.tool.startAnimation();
            this.world.removeBlock(this.player.selectedCoords.x, this.player.selectedCoords.y, this.player.selectedCoords.z);
        } else {
            this.world.addBlock(this.player.selectedCoords.x, this.player.selectedCoords.y, this.player.selectedCoords.z, this.player.activeBlockId);
        }
    }

    onWindowResize() {
        if (this.orbitCamera) {
            this.orbitCamera.aspect = window.innerWidth / window.innerHeight;
            this.orbitCamera.updateProjectionMatrix();
        }

        if (this.player) {
            this.player.camera.aspect = window.innerWidth / window.innerHeight;
            this.player.camera.updateProjectionMatrix();
        }

        this.renderer?.setSize(window.innerWidth, window.innerHeight);
    }

    onKeyDown(event: KeyboardEvent) {
        if (!this.player) return;
        if (event.key === 'c') {
            this.cameraMode = (this.cameraMode === 'first-person') ? 'orbit' : 'first-person';
            if (this.cameraMode === 'orbit') {
                this.player.controls.unlock();
                this.orbitCamera?.position.copy(this.player.position);
                this.orbitCamera?.position.add(new THREE.Vector3(10, 0, 10));
                this.orbitCamera?.lookAt(this.player.position);
                this.orbitCamera?.updateProjectionMatrix();
                this.controls?.update();
            } else {
                this.player.controls.lock();
            }
        }
        //TODO: Add more key bindings for debugging and other features
    }

    addEventListeners() {
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
    }
}