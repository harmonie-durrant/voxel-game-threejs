import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

type Models = {
    pickaxe: THREE.Group | undefined;
};

export class ModelLoader {
    loader: GLTFLoader = new GLTFLoader();

    models: Models = {
        pickaxe: undefined
    };

    loadModels(onLoad: (models : Models) => void) {
        this.loader.load(
            "/models/pickaxe.glb",
            (model) => {
                const mesh = model.scene;
                this.models.pickaxe = mesh;
                onLoad(this.models);
            }
        );
    };
}