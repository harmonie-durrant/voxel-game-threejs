import GUI from 'lil-gui';
import { World } from './world';
import { resources } from './blocks';
import type { Player } from './player';

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

  worldFolder.onChange(() => {
    world.generate();
  });
}

function createResourcesFolder(gui : GUI, world : World) {
  const resourcesFolder = gui.addFolder("Resources");
  resources.forEach(resource => {
    const resourceFolder = resourcesFolder.addFolder(resource.name);
    resourceFolder.add(resource, "scarcity", 0, 1).name("Scarcity");

    const scaleFolder = resourceFolder.addFolder("Scale");
    scaleFolder.add(resource.scale, "x", 10, 100).name("X Scale");
    scaleFolder.add(resource.scale, "y", 10, 100).name("Y Scale");
    scaleFolder.add(resource.scale, "z", 10, 100).name("Z Scale");
  });

  resourcesFolder.onChange(() => {
    world.generate();
  });
}

export function createUI(world : World, player : Player) {
  const gui = new GUI();
  gui.title("Dev menu");

  createPlayerFolder(gui, player);
  createWorldFolder(gui, world);
  createResourcesFolder(gui, world);
}