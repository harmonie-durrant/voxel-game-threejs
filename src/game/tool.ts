import * as THREE from "three";

export class Tool extends THREE.Group {

    isAnimating: boolean = false;

    animationAmplitude: number = 0.5;
    animationDurration: number = 0.4;
    animationStartTime: number = 0;
    animationSpeed: number = 0.025;

    animation: number | undefined = undefined;

    toolMesh: THREE.Mesh | undefined = undefined;

    constructor() {
        super();
    }

    get animationTime() {
        return performance.now() - this.animationStartTime;
    }

    startAnimation() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.animationStartTime = performance.now();

        clearInterval(this.animation);

        this.animation = setTimeout(() => {
            this.isAnimating = false;
            this.toolMesh!.rotation.y = 0;
        }, this.animationDurration * 1000);
    }

    update() {
        if (this.isAnimating && this.toolMesh) {
            this.toolMesh.rotation.y = this.animationAmplitude * Math.sin(this.animationTime * this.animationSpeed);
        }
    }

    setMesh(mesh: THREE.Mesh) {
        this.clear();

        this.toolMesh = mesh;
        this.add(this.toolMesh);
        this.toolMesh.receiveShadow = true;
        this.toolMesh.castShadow = true;

        this.position.set(0.6, -0.3, -0.5);
        this.scale.set(0.5, 0.5, 0.5);
        this.rotation.z = Math.PI / 2;
        this.rotation.y = Math.PI + 0.2;
    }
}