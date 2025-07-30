import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import { createUI } from './ui';
import { Player } from './player';
import { Physics } from './physics';
import { World } from './world';

const stats = new Stats();
stats.showPanel(0);
document.body.append(stats.dom);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Camera setup
const orbitCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight);
orbitCamera.position.set(70, 32, 70);

// OrbitControls setup
const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(32, 8, 32);

// Scene setup
const scene = new THREE.Scene();
const world = new World();
world.generate();
scene.add(world);
const player = new Player(scene);
const physics = new Physics(scene);


function setupLights() {
  const sun = new THREE.DirectionalLight();
  sun.position.set(50, 50, 50);
  sun.castShadow = true;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 100;
  sun.shadow.bias = -0.001;
  sun.shadow.mapSize = new THREE.Vector2(1024, 1024);
  scene.add(sun);

  const sunHelper = new THREE.CameraHelper(sun.shadow.camera);
  scene.add(sunHelper);

  const ambient = new THREE.AmbientLight();
  ambient.intensity = 0.1;
  scene.add(ambient);
}

// Render loop
let previousTime = performance.now();
function animate() {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000;

  previousTime = currentTime;
  stats.begin();
  requestAnimationFrame(animate);
  physics.update(dt, player, world);
  world.update(player);
  renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera);
  stats.end();

  previousTime = currentTime;
}

setupLights();
createUI(world, player);
animate();

window.addEventListener('resize', () => {
  // Resize camera aspect ratio and renderer size to the new window size
  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();

  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});