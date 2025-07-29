import GUI from 'lil-gui';
import { World } from './world';

export function createUI(world : World) {
    const gui = new GUI();

    gui.add(world.size, "width", 8, 128, 1).name("width");
    gui.add(world.size, "height", 8, 64, 1).name("height");
    gui.onChange(() => {
        world.generate();
    })
}