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

    params : paramsType;

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
      this.generateTrees();
      this.generateClouds(rdm);
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

          let height = Math.floor(scaledNoise);
          height = Math.max(0, Math.min(height, this.size.height - 1));

          for (let y = 0; y <= this.size.height; y++) {
            if (y <= this.params.terrain.waterLevel && y <= height) {
              this.setBlockId(x, y, z, blocks.sand.id);
            } else if (y === height) {
              this.setBlockId(x, y, z, blocks.grass.id);
            } else if (y < height && this.getBlock(x, y, z)?.id === blocks.empty.id) {
              this.setBlockId(x, y , z, blocks.dirt.id);
            } else if (y >= height - this.params.terrain.dirtlayer && y < height) {
              this.setBlockId(x, y, z, blocks.dirt.id);
            } else if (y > height) {
              this.setBlockId(x, y, z, blocks.empty.id);
            }
          }
        }
      }
    }

    generateTrees() {
      const rdm = new RandomNumbers(this.params.seed);
      // Position-based pseudo-random function for natural tree placement
      function pseudoRandom2D(x: number, z: number, seed: number) {
        let n = x * 374761393 + z * 668265263 + seed * 982451653;
        n = (n ^ (n >> 13)) * 1274126177;
        return ((n ^ (n >> 16)) >>> 0) / 4294967295;
      }
      const generateTreeTrunk = (x : number, z : number, rdm : RandomNumbers) => {
        const minH = this.params.trees.trunk.minHeight;
        const maxH = this.params.trees.trunk.maxHeight;
        const h = Math.round(minH + (maxH - minH) * rdm.random());

        // Find the topmost grass block at (x, z)
        let topGrassY: number | null = null;
        for (let y = this.size.height - 1; y >= 0; y--) {
          if (this.getBlock(x, y, z)?.id === blocks.grass.id) {
            topGrassY = y;
            break;
          }
        }
        if (topGrassY !== null) {
          for (let treeY = topGrassY + 1; treeY <= topGrassY + h; treeY++) {
            this.setBlockId(x, treeY, z, blocks.tree.id);
          }
          generateTreeCanopy(x, topGrassY + h, z, rdm);
        }
      }
      const generateTreeCanopy = (centerX : number, centerY : number, centerZ : number, rdm : RandomNumbers) => {
        const minR = this.params.trees.canopy.minRadius;
        const maxR = this.params.trees.canopy.maxRadius;
        const r = Math.round(minR + (maxR - minR) * rdm.random());

        for (let x = -r; x <= r; x++) {
          for (let y = -r; y <= r; y++) {
            for (let z = -r; z <= r; z++) {
              const randomNumber = rdm.random();
              if (x ** 2 + y ** 2 + z ** 2 > r ** 2) continue;
              const block = this.getBlock(centerX + x, centerY + y, centerZ + z);
              if (block?.id !== blocks.empty.id) continue;
              if (randomNumber < this.params.trees.canopy.density) {
                this.setBlockId(centerX + x, centerY + y, centerZ + z, blocks.leaves.id);
              }
            }
          }
        }
      }

      let offset = this.params.trees.canopy.maxRadius;
      for (let x = offset; x < this.size.width - offset; x++) {
        for (let z = offset; z < this.size.width - offset; z++) {
          // Use world position for randomness
          const worldX = x + this.position.x;
          const worldZ = z + this.position.z;
          if (pseudoRandom2D(worldX, worldZ, this.params.seed) < this.params.trees.frequency) {
            generateTreeTrunk(x, z, rdm);
          }
        }
      }
    }

    generateClouds(rdm : RandomNumbers) {
      const simplex = new SimplexNoise(rdm);
      for (let x = 0; x < this.size.width; x++) {
        for (let z = 0; z < this.size.width; z++) {
          const value = (simplex.noise(
            (this.position.x + x) / this.params.clouds.scale,
            (this.position.z + z) / this.params.clouds.scale
          ) + 1) * 0.5;
          if (value < this.params.clouds.density) {
            this.setBlockId(x, this.size.height - 1, z, blocks.cloud.id);
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

    generateWater() {
      const material = new THREE.MeshLambertMaterial({
        color: 0x9090e0,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const waterMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(),
        material
      );
      waterMesh.rotateX(-Math.PI / 2.0);
      waterMesh.position.set(
        this.size.width / 2,
        this.params.terrain.waterLevel + 0.35,
        this.size.width / 2
      );
      waterMesh.scale.set(
        this.size.width,
        this.size.width,
        1
      );
      waterMesh.layers.set(1);
      this.add(waterMesh);
    }

    generateMeshes() {
      this.clear();

      this.generateWater();

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

    getTopMostBlock(x : number, z : number) {
      for (let y = this.size.height - 1; y >= 0; y--) {
        const block = this.getBlock(x, y, z);
        if (block && block.id !== blocks.empty.id && block.id !== blocks.cloud.id) {
          return new THREE.Vector3(x, y, z);
        }
      }
      return new THREE.Vector3(x, 0, z);
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
      const up = this.getBlock(x, y + 1, z) ?? blocks.empty;
      const down = this.getBlock(x, y - 1, z) ?? blocks.empty;
      const left = this.getBlock(x + 1, y, z) ?? blocks.empty;
      const right = this.getBlock(x - 1, y, z) ?? blocks.empty;
      const forward = this.getBlock(x, y, z + 1) ?? blocks.empty;
      const back = this.getBlock(x, y, z - 1) ?? blocks.empty;

      const isOpaque = (block: any) => {
        const blockData = Object.values(blocks).find(b => b.id === block.id);
        if (!blockData) return true;
        return blockData?.id === blocks.empty.id || ('transparent' in blockData && (blockData as any).transparent === true);
      };

      if (
        isOpaque(up) || isOpaque(down) ||
        isOpaque(left) || isOpaque(right) ||
        isOpaque(forward) || isOpaque(back)
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