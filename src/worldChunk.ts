import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/Addons.js';
import { RandomNumbers } from './random';
import { blocks, resources } from './blocks';
import { WorldSaveData } from './worldSaveData';

import type { paramsType, chunkSize } from './world';

const geometry = new THREE.BoxGeometry();

type worldData = {
  id : number,
  instanceId : number |  null
};

export class WorldChunk extends THREE.Group {

    data : worldData[][][] = [];
    size : chunkSize;

    loaded: boolean = false;

    params : paramsType = {
      seed: 0,
      terrain: {
        scale: 30,
        magnitude: 0.5,
        offset: 0.2,
        dirtlayer: 3
      },
    }

    saveData: WorldSaveData;

    constructor(size : chunkSize, params : paramsType, saveData: WorldSaveData) {
        super();
        this.loaded = false;
        this.size = size;
        this.data = [];
        this.params = params;
        this.saveData = saveData;
    }

    generate() {
      const rdm = new RandomNumbers(this.params.seed);
      this.initializeTerrain();
      this.generateResources(rdm);
      this.generateTerrain(rdm);
      this.loadPlayerChanges();
      this.generateMeshes();
      this.loaded = true;
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
                (this.position.x + x) / resource.scale.x,
                (this.position.y + y) / resource.scale.y,
                (this.position.z + z) / resource.scale.z
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
            (this.position.x + x) / this.params.terrain.scale,
            (this.position.z + z) / this.params.terrain.scale
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

    loadPlayerChanges() {
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            if (this.saveData.contains(
              new THREE.Vector2(this.position.x, this.position.z),
              new THREE.Vector3(x, y, z)
            )) {
              const blockId = this.saveData.get(
                new THREE.Vector2(this.position.x, this.position.z),
                new THREE.Vector3(x, y, z)
              );
              this.setBlockId(x, y, z, blockId);
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
            mesh.name = String(block.id);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
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
              matrix.setPosition(x, y, z);
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

    removeBlock(x : number, y : number, z : number) {
      const block = this.getBlock(x, y, z);
      if (!block || block.id === blocks.empty.id) return;
      this.deleteBlockInstance(x, y, z);
      this.setBlockId(x, y, z, blocks.empty.id);
      this.saveData.set(
        new THREE.Vector2(this.position.x, this.position.z),
        new THREE.Vector3(x, y, z),
        blocks.empty.id
      );
    }

    deleteBlockInstance(x : number, y : number, z : number) {
      const block = this.getBlock(x, y, z);
      if (!block || block.instanceId === null) return;
      const mesh = this.children.find((instanceMesh) => instanceMesh.name == String(block.id));
      if (!mesh || !(mesh instanceof THREE.InstancedMesh)) return;

      // Swap with last instance and decrease count to no longer render it
      const instanceId = block.instanceId;
      const lastIndex = mesh.count - 1;
      const lastMatrix = new THREE.Matrix4();
      if (instanceId !== lastIndex) {
        mesh.getMatrixAt(lastIndex, lastMatrix);
        const v = new THREE.Vector3();
        v.setFromMatrixPosition(lastMatrix);
        this.setBlockInstanceId(Math.round(v.x), Math.round(v.y), Math.round(v.z), instanceId);
        mesh.setMatrixAt(instanceId, lastMatrix);
      }
      mesh.count--;

      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();

      this.setBlockInstanceId(x, y, z, null);
    }

    addBlockInstance(x : number, y : number, z : number) {
      const block = this.getBlock(x, y, z);
      if (!block || block.id === blocks.empty.id || block.instanceId !== null) return;
      const mesh = this.children.find((instanceMesh) => instanceMesh.name == String(block.id));
      if (!mesh || !(mesh instanceof THREE.InstancedMesh)) return;
      const instanceId = mesh.count++;
      this.setBlockInstanceId(x, y, z, instanceId);

      const matrix = new THREE.Matrix4();
      matrix.setPosition(x, y, z);
      mesh.setMatrixAt(instanceId, matrix);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }

    addBlock(x : number, y : number, z : number, id : number) {
      if (this.getBlock(x, y, z)?.id !== blocks.empty.id) return;
      this.setBlockId(x, y, z, id);
      this.addBlockInstance(x, y, z);
      this.saveData.set(
        new THREE.Vector2(this.position.x, this.position.z),
        new THREE.Vector3(x, y, z),
        id
      );
    }

    setBlockId(x : number, y : number, z : number, id : number) {
      if (this.inBounds(x, y, z)) {
        this.data[x][y][z].id = id;
      }
    }

    setBlockInstanceId(x : number, y : number, z : number, instanceId : number | null) {
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

    disposeInstances() {
      this.traverse((gameObj) => {
        if (gameObj instanceof THREE.InstancedMesh) {
          gameObj.dispose();
        }
      })
      this.clear();
    }
}