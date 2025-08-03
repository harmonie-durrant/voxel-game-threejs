import * as THREE from 'three';
import { WorldChunk } from './worldChunk';
import { WorldSaveData } from './worldSaveData';

import type { Player } from './player';
import type { ItemData } from './container';
import { blocks, type blocksType } from './blocks';

type terrainParams = {
  scale : number,
  magnitude : number,
  offset : number,
  dirtlayer : number,
  waterLevel : number
};

export type paramsType = {
  seed : number,
  terrain : terrainParams
  trees : {
    trunk: {
      minHeight: number,
      maxHeight: number
    },
    canopy: {
      minRadius: number,
      maxRadius: number,
      density: number
    },
    frequency: number
  },
  clouds: {
    scale: number,
    density: number,
  }
};

export type chunkSize = {
  width : number,
  height : number
}

export class World extends THREE.Group {

  loading : boolean = true;

  asyncLoading : boolean = true;

  seed: number = 0;
  chunkSize: chunkSize = { width: 16, height: 32 };
  renderDistance = 2;

  params : paramsType = {
    seed: 0,
    terrain: {
      scale: 60,
      magnitude: 10,
      offset: 4,
      dirtlayer: 1,
      waterLevel: 5
    },
    trees: {
      trunk: {
        minHeight: 4,
        maxHeight: 7,
      },
      canopy: {
        minRadius: 2,
        maxRadius: 4,
        density: 0.9
      },
      frequency: 0.0055
    },
    clouds: {
      scale: 30,
      density: 0.25
    }
  };

  chunk: WorldChunk | null;

  saveData: WorldSaveData = new WorldSaveData();

  player: Player | null = null;

  constructor(seed : number = 0) {
    super()
    this.loading = true;
    this.params.seed = seed;
    this.chunk = null;

    document.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'F1':
          e.preventDefault();
          e.stopPropagation();
          this.save();
          break;
        case 'F2':
          e.preventDefault();
          e.stopPropagation();
          this.load();
          break;
      }
    });
  }

  definePlayer(player: Player) {
    this.player = player;
  }

  respawnPlayer(position: { x: number; y: number; z: number } | null = null, rotation: { x: number; y: number; z: number } | null = null) {
    this.generateSpawnArea(0, 0, 50);
    if (!this.player) return;
    const spawnPoint = position || this.getSpawnPoint(0, 0);
    this.player.position.set(spawnPoint.x, spawnPoint.y + 3, spawnPoint.z);
    if (rotation) {
      this.player.camera.rotation.set(rotation.x, rotation.y, rotation.z);
    }
  }

  save() {
    localStorage.setItem('world_params', JSON.stringify(this.params));
    localStorage.setItem('world_data', JSON.stringify(this.saveData.data));
    localStorage.setItem('player_position', JSON.stringify({
      x: this.player?.position.x || 0,
      y: this.player?.position.y || 0,
      z: this.player?.position.z || 0
    }));
    localStorage.setItem('player_rotation', JSON.stringify({
      x: this.player?.camera.rotation.x || 0,
      y: this.player?.camera.rotation.y || 0,
      z: this.player?.camera.rotation.z || 0
    }));
    localStorage.setItem('player_inventory', JSON.stringify(this.player?.inventory.items || []));
    document.getElementById('status')!.innerText = 'WORLD SAVED';
    setTimeout(() => {
      document.getElementById('status')!.innerText = '';
    }, 3000);
  }

  load(loadOnlyOrigin: boolean = false): boolean {
    const params_tmp = JSON.parse(localStorage.getItem('world_params') || JSON.stringify(this.params));
    // Verify if the params are valid
    if (!params_tmp || !params_tmp.seed || !params_tmp.terrain || !params_tmp.terrain.scale || !params_tmp.terrain.magnitude || !params_tmp.terrain.offset || !params_tmp.terrain.dirtlayer || !params_tmp.terrain.waterLevel) {
      console.error('Invalid world parameters');
      return false;
    } else {
      this.params = params_tmp;
    }
    const data = JSON.parse(localStorage.getItem('world_data') || '{}');
    if (data) {
      this.saveData.data = data;
    } else {
      console.error('No world data found');
      return false;
    }
    this.player?.loadInventoryFromSave();
    const playerPosition = JSON.parse(localStorage.getItem('player_position') || '{}');
    const playerRotation = JSON.parse(localStorage.getItem('player_rotation') || '{}');
    if (!playerPosition || !playerRotation) {
      console.error('No player position or rotation found');
      return false;
    }
    document.getElementById('status')!.innerText = 'WORLD LOADED';
    setTimeout(() => {
      document.getElementById('status')!.innerText = '';
    }, 3000);
    this.generateSpawnArea(0, 0, 50);
    this.respawnPlayer(playerPosition, playerRotation);
    if (loadOnlyOrigin) {
      this.generateChunk(0, 0, true);
      return true;
    }
    this.generate(false, true);
    this.loading = false;
    return true;
  }

  update(player : Player) {
    const visibleChunks = this.getVisibleChunks(player);
    const chunksToAdd = this.getChunksToAdd(visibleChunks);
    this.removeUnusedChunks(visibleChunks);
    for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z);
    }
  }

  getVisibleChunks(player : Player): { x: number; z: number; }[] {
    const visibleChunks: { x: number; z: number; }[] = [];

    const coords = this.worldToChunkCoords(player.position.x, player.position.y, player.position.z);
    const chunkX = coords.chunk.x;
    const chunkZ = coords.chunk.z;

    for (let x = chunkX - this.renderDistance; x <= chunkX + this.renderDistance; x++) {
        for (let z = chunkZ - this.renderDistance; z <= chunkZ + this.renderDistance; z++) {
            visibleChunks.push({ x, z });
        }
    }

    return visibleChunks;
  }

  removeUnusedChunks(visibleChunks: { x: number, z: number }[]) {
    const chunksToRemove = this.children
      .filter((gameObj) => gameObj instanceof WorldChunk)
      .filter(chunk => {
        const { x, z } = chunk.userData;
        const chunkExists = visibleChunks
          .find(visibleChunk => (visibleChunk.x === x && visibleChunk.z === z));
        return !chunkExists;
      });

    for (const chunk of chunksToRemove) {
      chunk.disposeInstances();
      this.remove(chunk);
    }
  }

  getChunksToAdd(visibleChunks: { x: number, z: number }[]): { x: number, z: number }[] {
    return visibleChunks.filter(chunk => {
      const chunkExists = this.children
        .filter((gameObj) => gameObj instanceof WorldChunk)
        .map((gameObj) => gameObj.userData)
        .find(({x, z}) => (chunk.x === x && chunk.z === z));
      return !chunkExists;
    });
  }

  generateChunk(x : number, z : number, generateNow: boolean = false) {
    const chunk = new WorldChunk(this.chunkSize, this.params, this.saveData, this);
    chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
    chunk.userData = { x, z };
    if (this.asyncLoading && !generateNow) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }
    this.add(chunk);
  }

  generate(clearCache : boolean = false, generateNow: boolean = false, dispose: boolean = true) {
    if (clearCache)
      this.saveData.clear();
    if (dispose)
      this.disposeChunks();
    for (let x = -this.renderDistance; x < this.renderDistance; x++) {
      for (let z = -this.renderDistance; z < this.renderDistance; z++) {
        this.generateChunk(x, z, generateNow);
      }
    }
  }

  getBlock(x : number, y : number, z : number) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (!chunk || !chunk.loaded) return null;
    return chunk.getBlock(coords.block.x, coords.block.y, coords.block.z);
  }

  generateSpawnArea(x: number, z: number, radius: number = 50) {
    for (let px = x - radius; px < x + radius; px += this.chunkSize.width) {
      for (let pz = z - radius; pz < z + radius; pz += this.chunkSize.width) {
        const chunkCoords = this.worldToChunkCoords(px, 0, pz).chunk;
        if (!this.getChunk(chunkCoords.x, chunkCoords.z)) {
          this.generateChunk(chunkCoords.x, chunkCoords.z, true);
        }
      }
    }
    this.loading = false;
  }

  getSpawnPoint(x: number, z: number) {
    const maxRadius = 50;
    for (let r = 0; r <= maxRadius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          // Only check the edge of the current radius square
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          const px = x + dx;
          const pz = z + dz;
          const topMostBlock = this.getTopMostBlock(px, pz);
          if (topMostBlock.y >= this.params.terrain.waterLevel) {
            return new THREE.Vector3(px, topMostBlock.y, pz);
          }
        }
      }
    }
    return new THREE.Vector3(x, 0, z); // fallback if no block found
  }

  getTopMostBlock(x : number, z : number) {
    const coords = this.worldToChunkCoords(x, 0, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (!chunk || !chunk.loaded) return new THREE.Vector3(x, 0, z);
    return chunk.getTopMostBlock(coords.block.x, coords.block.z);
  }

  worldToChunkCoords(x : number, y : number, z : number) {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width)
    };

    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z
    };
    return {
      chunk: chunkCoords,
      block: blockCoords
    };
  }

  getChunk(chunkX : number, chunkZ : number) {
    return this.children.find((chunk) => {
      return chunk instanceof WorldChunk &&
        chunk.userData.x === chunkX &&
        chunk.userData.z === chunkZ;
    }) as WorldChunk | undefined;      
  }

  disposeChunks() {
    this.traverse((chunk) => {
      if (chunk instanceof WorldChunk) {
        chunk.disposeInstances();
      }
    });
    this.clear();
  }

  removeBlock(x : number, y : number, z : number, dropItems: boolean = false) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (!chunk) return;
    chunk.removeBlock(coords.block.x, coords.block.y, coords.block.z, dropItems, new THREE.Vector3(x, y - 1, z));
    this.revealBlock(x - 1, y, z);
    this.revealBlock(x + 1, y, z);
    this.revealBlock(x, y - 1, z);
    this.revealBlock(x, y + 1, z);
    this.revealBlock(x, y, z - 1);
    this.revealBlock(x, y, z + 1);
  }

  revealBlock(x : number, y : number, z : number) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (!chunk) return;
    chunk.addBlockInstance(coords.block.x, coords.block.y, coords.block.z);
  }

  hideBlock(x : number, y : number, z : number) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (!chunk || !chunk.isBlockHidden(coords.block.x, coords.block.y, coords.block.z)) return;
    chunk.deleteBlockInstance(coords.block.x, coords.block.y, coords.block.z);
  }

  addBlock(x : number, y : number, z : number, id : number): boolean {
     const coords = this.worldToChunkCoords(x, y, z);
      const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
      if (!chunk) return false;
      const added = chunk.addBlock(coords.block.x, coords.block.y, coords.block.z, id);
      if (!added) return false;

      this.hideBlock(x - 1, y, z);
      this.hideBlock(x + 1, y, z);
      this.hideBlock(x, y - 1, z);
      this.hideBlock(x, y + 1, z);
      this.hideBlock(x, y, z - 1);
      this.hideBlock(x, y, z + 1);
      return true;
  }

  createItemEntity(item: ItemData, position: THREE.Vector3, initialForceAngle: THREE.Euler | null = null): THREE.Object3D {
    const itemEntity = new THREE.Object3D();
    itemEntity.position.copy(position);
    itemEntity.userData.item = item;

    // Add a pickup delay (in seconds)
    itemEntity.userData.pickupDelay = 1; // 0.5 seconds before it can be picked up

    // Add a mesh to represent the item visually
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const blockData = Object.values(blocks).find(b => b.id === item.blockId) as blocksType | undefined;
    let material: THREE.Material;
    if (blockData && 'material' in blockData && blockData.material) {
      material = Array.isArray(blockData.material) ? blockData.material[0] : blockData.material;
    } else {
      material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    itemEntity.add(mesh);

    // Physics properties
    itemEntity.userData.velocity = new THREE.Vector3(0, 0, 0);
    itemEntity.userData.gravity = new THREE.Vector3(0, -9.8, 0);

    // Apply initial force if provided
    if (initialForceAngle) {
      // Use Euler angles to create a direction vector
      // reverse initial force angle

      const direction = new THREE.Vector3(0, 0, -1).applyEuler(initialForceAngle).normalize();
      itemEntity.userData.velocity.copy(direction.multiplyScalar(4));
    }

    // Mark as item entity for update
    itemEntity.userData.isItemEntity = true;

    return itemEntity;
  }

  dropItem(item: ItemData, origin: THREE.Vector3, initialForceAngle: THREE.Euler | null = null): void {
    if (!this.player) return;
    const itemPosition = origin.clone().add(new THREE.Vector3(0, 1, 0));
    const itemEntity = this.createItemEntity(item, itemPosition, initialForceAngle);
    this.add(itemEntity);
  }

  /**
   * Call this in your main game loop to update all item entities (gravity, ground collision)
   * @param delta Time since last update in seconds
   */
  updateItemEntities(delta: number) {
    for (const child of this.children) {
      if (child.userData && child.userData.isItemEntity) {
        // Apply gravity
        child.userData.velocity.addScaledVector(child.userData.gravity, delta);
        child.position.addScaledVector(child.userData.velocity, delta);

        // Simple ground collision (assume y=0 is ground)
        if (child.position.y < 0.125) {
          child.position.y = 0.125;
          child.userData.velocity.y = 0;
          // Add friction
          child.userData.velocity.x *= 0.7;
          child.userData.velocity.z *= 0.7;
        }
      }
    }
  }
}