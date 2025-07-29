import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/Addons.js';
import { RandomNumbers } from './random';
import { blocks } from './blocks';

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial();

type worldSize = {
  width : number,
  height : number
}

type worldData = {
  id : number,
  instanceId : number |  null
};

type terrainParams = {
  scale : number,
  magnitude : number,
  offset : number
};

type paramsType = {
  seed : number,
  terrain : terrainParams
};

export class World extends THREE.Group {

    data : worldData[][][] = [];
    size : worldSize = { width: 32, height: 16 };

    params : paramsType = {
      seed: 0,
      terrain: {
        scale: 30,
        magnitude: 0.5,
        offset: 0.2
      }
    }

    constructor(size : worldSize = { width: 32, height: 16 }) {
        super();
        this.size = size;
        this.data = [];
    }

    generate() {
      this.initializeTerrain();
      this.generateTerrain();
      this.generateMeshes();
    }
    
    initializeTerrain() {
      this.data = [];
      for (let x = 0; x < this.size.width; x++) {
        const col : worldData[][] = [];
        for (let y = 0; y < this.size.height; y++) {
          const row : worldData[] = [];
          for (let z = 0; z < this.size.width; z++) {
            row.push({
              id: blocks.empty.id,
              instanceId: null
            });
          }
          col.push(row);
        }
        this.data.push(col);
      }
    }

    generateTerrain() {
      const rdm = new RandomNumbers(this.params.seed);
      const simplex = new SimplexNoise(rdm);
      for (let x = 0; x < this.size.width; x++) {
        for (let z = 0; z < this.size.width; z++) {
          const value = simplex.noise(
            x / this.params.terrain.scale,
            z / this.params.terrain.scale
          );

          const scaledNoise = this.params.terrain.offset +
            this.params.terrain.magnitude * value;

          let height = Math.floor(this.size.height * scaledNoise);
          height = Math.max(0, Math.min(height, this.size.height - 1));

          for (let y = 0; y <= this.size.height; y++) {
            if (y <= height) {
              this.setBlockId(x, y , z, y == height ? blocks.grass.id : blocks.dirt.id );
            } else {
              this.setBlockId(x, y, z, blocks.empty.id);
            }
          }
        }
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
            const blockType = Object.values(blocks).find(x => x.id === blockId);
            const instanceId = mesh.count;
            if (blockId == 0) continue;

            matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
            mesh.setMatrixAt(instanceId, matrix);
            if (blockType && 'color' in blockType)
              mesh.setColorAt(instanceId, new THREE.Color(blockType.color));
            this.setBlockInstanceId(x, y, z, instanceId);
            mesh.count++;
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