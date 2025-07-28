import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera setup
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight);
camera.position.set(2, 2, 2);
camera.lookAt(0, 0, 0);

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = true; // Avoid unused vrariable warning

// Scene setup
const scene = new THREE.Scene();
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({ color: 0x00d000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

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
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

setupLights();
animate();