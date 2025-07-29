import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera setup
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight);
camera.position.set(16, 8, 16);

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(8, 0, 8);

// Scene setup
const scene = new THREE.Scene();

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

// World "generation"
function setupWorld(size: number) {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshLambertMaterial({ color: 0x00d000 });
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(x, 0, z);
      scene.add(cube);
    }
  }
}

// Render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Start functions
setupWorld(16);
setupLights();
animate();