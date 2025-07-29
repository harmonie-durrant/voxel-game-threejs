import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import { World } from './world';
import { createUI } from './ui';

const stats = new Stats();
stats.showPanel(0);
document.body.append(stats.dom);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Camera setup
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight);
camera.position.set(70, 32, 70);

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(32, 8, 32);

// Scene setup
const scene = new THREE.Scene();
const world = new World();
world.generate();
scene.add(world);

function setupLights() {
  const sun = new THREE.DirectionalLight();
  sun.position.set(50, 50, 50);
  sun.castShadow = true;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 50;
  scene.add(sun);

  const sunHelper = new THREE.CameraHelper(sun.shadow.camera);
  scene.add(sunHelper);

  const ambient = new THREE.AmbientLight();
  ambient.intensity = 0.1;
  scene.add(ambient);
}

// Render loop
function animate() {
  stats.begin();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  stats.end();
}

setupLights();
createUI(world);
animate();