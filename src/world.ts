import * as THREE from 'three';
import { instance } from 'three/tsl';

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({ color: 0x00d000 });

type worldSize = {
  width : number,
  height : number
}

type worldData = {
  id : number,
  instanceId : number |  null
};

export class World extends THREE.Group {

    data : worldData[][][] = [];
    size : worldSize = { width: 32, height: 16 };

    threshold: number = 0.7;

    constructor(size : worldSize = { width: 32, height: 16 }) {
        super();
        this.size = size;
        this.data = [];
    }

    generate() {
      this.generateTerrain();
      this.generateMeshes();
    }
    
    generateTerrain() {
      this.data = [];
      for (let x = 0; x < this.size.width; x++) {
        const col : worldData[][] = [];
        for (let y = 0; y < this.size.height; y++) {
          const row : worldData[] = [];
          for (let z = 0; z < this.size.width; z++) {
            row.push({
              id: Math.random() > this.threshold ? 1 : 0,
              instanceId: null
            });
          }
          col.push(row);
        }
        this.data.push(col);
      }
    }

    generateMeshes() {
      this.clear();

      const maxCount = (this.size.width ** 2) * this.size.height;
      const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
      mesh.count = 0;

      const matrix = new THREE.Matrix4();
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const blockId = this.getBlock(x, y, z)?.id;
            const instanceId = mesh.count;

            if (blockId != 0) {
              matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
              mesh.setMatrixAt(instanceId, matrix);
              this.setBlockInstanceId(x, y, z, instanceId);
              mesh.count++;
            }
          }
        }
      }
      this.add(mesh);
    }

    getBlock(x : number, y : number, z : number) {
      if (this.inBounds(x, y, z)) {
        return this.data[x][y][z];
      }
      return null;
    }

    setBlockId(x : number, y : number, z : number, id : number) {
      if (this.inBounds(x, y, z)) {
        this.data[x][y][z].id = id;
      }
    }

    setBlockInstanceId(x : number, y : number, z : number, instanceId : number) {
      if (this.inBounds(x, y, z)) {
        this.data[x][y][z].instanceId = instanceId;
      }
    }

    inBounds(x : number, y : number, z : number) {
      if (
        x >= 0 && x < this.size.width &&
        y >= 0 && y < this.size.height &&
        z >= 0 && z < this.size.width
      ) {
        return true;
      }
      return false;
    }
}