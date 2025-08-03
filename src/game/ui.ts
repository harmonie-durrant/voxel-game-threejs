import * as THREE from 'three';
import GUI from 'lil-gui';
import { World } from './world';
import { resources } from './blocks';
import { Physics } from './physics';
import { Player } from './player';

function createSceneFolder(gui : GUI, scene : THREE.Scene, sunHelper: THREE.CameraHelper, physics: Physics) {
  const sceneFolder = gui.addFolder("Scene");
  sceneFolder.close();
  if (scene.fog && (scene.fog instanceof THREE.Fog || scene.fog instanceof THREE.FogExp2)) {
    sceneFolder.add((scene.fog as THREE.Fog), "near", 1, 200, 1).name("Fog Near").onChange((value: number) => {
      (scene.fog as THREE.Fog).near = value;
    });
    sceneFolder.add((scene.fog as THREE.Fog), "far", 1, 200, 1).name("Fog Far").onChange((value: number) => {
      (scene.fog as THREE.Fog).far = value;
    });
  }
  sceneFolder.add(sunHelper, "visible").name("Show Sun Helper");
  sceneFolder.add(physics.helpers, "visible").name("Show Physics Helpers");
}

function createPlayerFolder(gui : GUI, player : Player) {
  const playerFolder = gui.addFolder("Player");
  playerFolder.close();
  playerFolder.add(player, "maxSpeed", 1, 20).name("Speed");
  playerFolder.add(player.cameraHelper, "visible").name("Show Camera Helper");
  playerFolder.add(player.boundsHelper, "visible").name("Show Bounds Helper");
}

function createWorldFolder(gui : GUI, world : World, player : Player) {
  const worldFolder = gui.addFolder("World");
  worldFolder.close();
  worldFolder.add(world, "renderDistance", 0, 16, 1).name("Render Distance")
  worldFolder.add(world, "asyncLoading").name("Async chunk loading")

  worldFolder.onChange(() => {
    world.loading = true;
    world.update(player);
    world.loading = false;
  });

  const terrainFolder = worldFolder.addFolder("Terrain");
  terrainFolder.close();
  terrainFolder.add(world.params, "seed", 1, 10000).name("Seed");
  terrainFolder.add(world.params.terrain, "scale", 10, 100).name("Scale");
  terrainFolder.add(world.params.terrain, "magnitude", 0, 32, 1).name("Magnitude");
  terrainFolder.add(world.params.terrain, "offset", 0, 32, 1).name("Offset");
  terrainFolder.add(world.params.terrain, "dirtlayer", 0, 10, 1).name("Dirt Layer");
  terrainFolder.add(world.params.terrain, "waterLevel", 0, 32, 1).name("Water Level");

  terrainFolder.onChange(() => {
    world.generate(true);
  });

  const treesFolder = worldFolder.addFolder("Trees");
  treesFolder.close();
  treesFolder.add(world.params.trees.trunk, "minHeight", 1, 10, 1).name("Trunk Min Height");
  treesFolder.add(world.params.trees.trunk, "maxHeight", 2, 14, 1).name("Trunk Max Height");
  treesFolder.add(world.params.trees.canopy, "minRadius", 1, 10, 1).name("Canopy Min Radius");
  treesFolder.add(world.params.trees.canopy, "maxRadius", 2, 14, 1).name("Canopy Max Radius");
  treesFolder.add(world.params.trees.canopy, "density", 0, 1).name("Canopy Density");
  treesFolder.add(world.params.trees, "frequency", 0, 0.1).name("Tree Frequency");

  treesFolder.onChange(() => {
    world.generate(true);
  });

  const cloudsFolder = worldFolder.addFolder("Clouds");
  cloudsFolder.close();
  cloudsFolder.add(world.params.clouds, "scale", 0, 100).name("Cloud Scale");
  cloudsFolder.add(world.params.clouds, "density", 0, 1).name("Cloud Density");

  cloudsFolder.onChange(() => {
    world.generate(true);
  });
}

function createResourcesFolder(gui : GUI, world: World) {
  const resourcesFolder = gui.addFolder("Resources");
  resourcesFolder.close();
  resources.forEach(resource => {
    const resourceFolder = resourcesFolder.addFolder(resource.name);
    resourceFolder.close();
    resourceFolder.add(resource, "scarcity", 0, 1).name("Scarcity");

    const scaleFolder = resourceFolder.addFolder("Scale");
    scaleFolder.close();
    if (resource.scale) {
      scaleFolder.add(resource.scale, "x", 10, 100).name("X Scale");
      scaleFolder.add(resource.scale, "y", 10, 100).name("Y Scale");
      scaleFolder.add(resource.scale, "z", 10, 100).name("Z Scale");
    }
  });

  resourcesFolder.onChange(() => {
    world.generate(true);
  });
}

export function createUI(scene : THREE.Scene, world : World, player : Player, sunHelper: THREE.CameraHelper, physics: Physics) {
  const gui = new GUI();
  gui.title("Dev menu");

  createSceneFolder(gui, scene, sunHelper, physics);
  createPlayerFolder(gui, player);
  createWorldFolder(gui, world, player);
  createResourcesFolder(gui, world);
}