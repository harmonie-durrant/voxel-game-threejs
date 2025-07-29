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
document.body.appendChild(renderer.domElement);
renderer.setClearColor(0x80a0e0);

// Camera setup
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight);
camera.position.set(150, 32, 150);

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(64, 16, 64);

// Scene setup
const scene = new THREE.Scene();
const world = new World();
world.generate();
scene.add(world);

function setupLights() {
  const light1 = new THREE.DirectionalLight();
  light1.position.set(1, 1, 1);
  scene.add(light1);

  const light2 = new THREE.DirectionalLight();
  light2.position.set(-1, 1, -0.5);
  scene.add(light2);

  const ambiant = new THREE.AmbientLight();
  ambiant.intensity = 0.1;
  scene.add(ambiant);
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