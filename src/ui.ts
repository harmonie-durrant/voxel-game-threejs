import GUI from 'lil-gui';
import { World } from './world';
import { blocks } from './blocks';

export function createUI(world : World) {
    const gui = new GUI();

    gui.add(world.size, "width", 8, 128, 1).name("width");
    gui.add(world.size, "height", 8, 64, 1).name("height");

    const terrainFolder = gui.addFolder("Terrain");
    terrainFolder.add(world.params, "seed", 1, 10000).name("Seed");
    terrainFolder.add(world.params.terrain, "scale", 10, 100).name("Scale");
    terrainFolder.add(world.params.terrain, "magnitude", 0, 1).name("Magnitude");
    terrainFolder.add(world.params.terrain, "offset", 0, 1).name("Offset");
    terrainFolder.add(world.params.terrain, "dirtlayer", 0, 10, 1).name("Dirt Layer");

    const resourcesFolder = gui.addFolder("Resources");
    resourcesFolder.add(blocks.stone, "scarcity", 0, 1).name("Stone Scarcity");

    const scaleFolder = resourcesFolder.addFolder("Scale");
    scaleFolder.add(blocks.stone.scale, "x", 10, 100).name("X Scale");
    scaleFolder.add(blocks.stone.scale, "y", 10, 100).name("Y Scale");
    scaleFolder.add(blocks.stone.scale, "z", 10, 100).name("Z Scale");

    gui.onChange(() => {
        world.generate();
    })
}