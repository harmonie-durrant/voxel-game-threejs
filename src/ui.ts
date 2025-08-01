import * as THREE from 'three';
import GUI from 'lil-gui';
import { World } from './world';
import { resources } from './blocks';
import type { Player } from './player';

function createSceneFolder(gui : GUI, scene : THREE.Scene, sunHelper: THREE.CameraHelper) {
  const sceneFolder = gui.addFolder("Scene");
  if (scene.fog && (scene.fog instanceof THREE.Fog || scene.fog instanceof THREE.FogExp2)) {
    sceneFolder.add((scene.fog as THREE.Fog), "near", 1, 200, 1).name("Fog Near").onChange((value: number) => {
      (scene.fog as THREE.Fog).near = value;
    });
    sceneFolder.add((scene.fog as THREE.Fog), "far", 1, 200, 1).name("Fog Far").onChange((value: number) => {
      (scene.fog as THREE.Fog).far = value;
    });
  }
  sceneFolder.add(sunHelper, "visible").name("Show Sun Helper");
}

function createPlayerFolder(gui : GUI, player : Player) {
  const playerFolder = gui.addFolder("Player");
  playerFolder.add(player, "maxSpeed", 1, 20).name("Speed");
  playerFolder.add(player.cameraHelper, "visible").name("Show Camera Helper");
  playerFolder.add(player.boundsHelper, "visible").name("Show Bounds Helper");
}

function createWorldFolder(gui : GUI, world : World) {
  const worldFolder = gui.addFolder("World");
  worldFolder.add(world, "renderDistance", 0, 16, 1).name("Render Distance")
  worldFolder.add(world, "asyncLoading").name("Async chunk loading")

  const terrainFolder = worldFolder.addFolder("Terrain");
  terrainFolder.add(world.params, "seed", 1, 10000).name("Seed");
  terrainFolder.add(world.params.terrain, "scale", 10, 100).name("Scale");
  terrainFolder.add(world.params.terrain, "magnitude", 0, 1).name("Magnitude");
  terrainFolder.add(world.params.terrain, "offset", 0, 1).name("Offset");
  terrainFolder.add(world.params.terrain, "dirtlayer", 0, 10, 1).name("Dirt Layer");

  const treesFolder = worldFolder.addFolder("Trees");
  treesFolder.add(world.params.trees.trunk, "minHeight", 1, 10, 1).name("Trunk Min Height");
  treesFolder.add(world.params.trees.trunk, "maxHeight", 2, 14, 1).name("Trunk Max Height");
  treesFolder.add(world.params.trees.canopy, "minRadius", 1, 10, 1).name("Canopy Min Radius");
  treesFolder.add(world.params.trees.canopy, "maxRadius", 2, 14, 1).name("Canopy Max Radius");
  treesFolder.add(world.params.trees.canopy, "density", 0, 1).name("Canopy Density");
  treesFolder.add(world.params.trees, "frequency", 0, 0.1).name("Tree Frequency");

  const cloudsFolder = worldFolder.addFolder("Clouds");
  cloudsFolder.add(world.params.clouds, "scale", 0, 100).name("Cloud Scale");
  cloudsFolder.add(world.params.clouds, "density", 0, 1).name("Cloud Density");
}

function createResourcesFolder(gui : GUI) {
  const resourcesFolder = gui.addFolder("Resources");
  resources.forEach(resource => {
    const resourceFolder = resourcesFolder.addFolder(resource.name);
    resourceFolder.add(resource, "scarcity", 0, 1).name("Scarcity");

    const scaleFolder = resourceFolder.addFolder("Scale");
    scaleFolder.add(resource.scale, "x", 10, 100).name("X Scale");
    scaleFolder.add(resource.scale, "y", 10, 100).name("Y Scale");
    scaleFolder.add(resource.scale, "z", 10, 100).name("Z Scale");
  });
}

export function createUI(scene : THREE.Scene, world : World, player : Player, sunHelper: THREE.CameraHelper) {
  const gui = new GUI();
  gui.title("Dev menu");

  createSceneFolder(gui, scene, sunHelper);
  createPlayerFolder(gui, player);
  createWorldFolder(gui, world);
  createResourcesFolder(gui);

  gui.onChange(() => {
    world.generate();
  });
}