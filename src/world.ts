import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/Addons.js';
import { RandomNumbers } from './random';
import { blocks, resources } from './blocks';

const geometry = new THREE.BoxGeometry();

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
  offset : number,
  dirtlayer : number
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
        offset: 0.2,
        dirtlayer: 3
      },
    }

    constructor(size : worldSize = { width: 128, height: 32 }) {
        super();
        this.size = size;
        this.data = [];
    }

    generate() {
      const rdm = new RandomNumbers(this.params.seed);
      this.initializeTerrain();
      this.generateResources(rdm);
      this.generateTerrain(rdm);
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

    generateResources(rdm : RandomNumbers) {
      const simplex = new SimplexNoise(rdm);

      resources.forEach(resource => {
        for (let x = 0; x < this.size.width; x++) {
          for (let y = 0; y < this.size.height; y++) {
            for (let z = 0; z < this.size.width; z++) {
              const value = simplex.noise3d(
                x / resource.scale.x,
                y / resource.scale.y,
                z / resource.scale.z
              );
              if (value > resource.scarcity) {
                this.setBlockId(x, y, z, resource.id);
              }
            }
          }
        }
      });
    }

    generateTerrain(rdm : RandomNumbers) {
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
            if (y < height && this.getBlock(x, y, z)?.id === blocks.empty.id) {
              this.setBlockId(x, y , z, blocks.dirt.id);
            } else if (y >= height - this.params.terrain.dirtlayer && y < height) {
              this.setBlockId(x, y, z, blocks.dirt.id);
            }else if (y === height) {
              this.setBlockId(x, y, z, blocks.grass.id);
            } else if (y > height) {
              this.setBlockId(x, y, z, blocks.empty.id);
            }
          }
        }
      }
    }

    generateMeshes() {
      this.clear();

      const maxCount = (this.size.width ** 2) * this.size.height;

      const meshes : { [key: number]: THREE.InstancedMesh } = {};
      Object.values(blocks)
        .filter(block => block.id !== blocks.empty.id)
        .forEach(block => {
          if (block && 'material' in block) {
            const mesh = new THREE.InstancedMesh(geometry, block.material, maxCount);
            mesh.name = block.name;
            mesh.count = 0;
            meshes[block.id] = mesh;
          }
        });

      const matrix = new THREE.Matrix4();
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const blockId = this.getBlock(x, y, z)?.id;
            if (!blockId || blockId === blocks.empty.id) continue;
            const mesh = meshes[blockId];
            if (!mesh) continue;
            const instanceId = mesh.count;
            
            if (blockId !== blocks.empty.id && !this.isBlockHidden(x, y, z)) {
              matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
              mesh.setMatrixAt(instanceId, matrix);
              this.setBlockInstanceId(x, y, z, instanceId);
              mesh.count++;
            }
          }
        }
      }
      this.add(...Object.values(meshes));
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

    isBlockHidden(x : number, y : number, z : number) {
      const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
      const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
      const left = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
      const right = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
      const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
      const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;

      if (
        up === blocks.empty.id || down === blocks.empty.id ||
        left === blocks.empty.id || right === blocks.empty.id ||
        forward === blocks.empty.id || back === blocks.empty.id
      ) {
        return false;
      }
      return true;
    }
}