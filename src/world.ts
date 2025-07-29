import * as THREE from 'three';

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({ color: 0x00d000 });

type worldSize = {
  width : number,
  height : number
}

export class World extends THREE.Group {
    size : worldSize;

    constructor(size : worldSize = { width: 32, height: 16 }) {
        super();
        this.size = size;
    }

    generate() {
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const block = new THREE.Mesh(geometry, material);
            block.position.set(x, y, z);
            this.add(block);
          }
        }
      }
    }
}