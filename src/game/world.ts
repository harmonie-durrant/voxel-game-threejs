import * as THREE from 'three';
import { WorldChunk } from './worldChunk';
import { WorldSaveData } from './worldSaveData';

import type { Player } from './player';

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

  constructor(seed : number = 0) {
    super()
    this.seed = seed;
    this.chunk = null;

    document.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'F1':
          this.save();
          break;
        case 'F2':
          this.load();
          break;
      }
    });
  }

  save() {
    localStorage.setItem('world_params', JSON.stringify(this.params));
    localStorage.setItem('world_data', JSON.stringify(this.saveData.data));
    document.getElementById('status')!.innerText = 'WORLD SAVED';
    setTimeout(() => {
      document.getElementById('status')!.innerText = '';
    }, 3000);
  }

  load(loadOnlyOrigin: boolean = false) {
    this.params = JSON.parse(localStorage.getItem('world_params') || JSON.stringify(this.params));
    this.saveData.data = JSON.parse(localStorage.getItem('world_data') || '{}');
    document.getElementById('status')!.innerText = 'WORLD LOADED';
    setTimeout(() => {
      document.getElementById('status')!.innerText = '';
    }, 3000);
    if (loadOnlyOrigin) {
      this.generateChunk(0, 0, true);
      return;
    }
    this.generate();
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
    const chunk = new WorldChunk(this.chunkSize, this.params, this.saveData);
    chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
    chunk.userData = { x, z };
    if (this.asyncLoading && !generateNow) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }
    this.add(chunk);
  }

  generate(clearCache : boolean = false) {
    if (clearCache)
      this.saveData.clear();
    this.disposeChunks();
    for (let x = -this.renderDistance; x < this.renderDistance; x++) {
      for (let z = -this.renderDistance; z < this.renderDistance; z++) {
        this.generateChunk(x, z);
      }
    }
  }

  getBlock(x : number, y : number, z : number) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (!chunk || !chunk.loaded) return null;
    return chunk.getBlock(coords.block.x, coords.block.y, coords.block.z);
  }

  getSpawnPoint(x : number, z : number) {
    // itterate x and z from 0 to 100, and find the first block that is not empty and is above the water level
    for (let px = x; px < x + 100; px++) {
      for (let pz = z; pz < z + 100; pz++) {
        const topMostBlock = this.getTopMostBlock(px, pz);
        if (topMostBlock.y >= this.params.terrain.waterLevel) {
          return new THREE.Vector3(px, topMostBlock.y, pz);
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

  removeBlock(x : number, y : number, z : number) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (!chunk) return;
    chunk.removeBlock(coords.block.x, coords.block.y, coords.block.z);
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
    console.log("STARTING Hiding block at", coords.block.x, coords.block.y, coords.block.z);
    if (!chunk || !chunk.isBlockHidden(coords.block.x, coords.block.y, coords.block.z)) return;
    console.log("APPLYING Hiding block at", coords.block.x, coords.block.y, coords.block.z);
    chunk.deleteBlockInstance(coords.block.x, coords.block.y, coords.block.z);
  }

  addBlock(x : number, y : number, z : number, id : number) {
     const coords = this.worldToChunkCoords(x, y, z);
      const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
      if (!chunk) return;
      chunk.addBlock(coords.block.x, coords.block.y, coords.block.z, id);

      this.hideBlock(x - 1, y, z);
      this.hideBlock(x + 1, y, z);
      this.hideBlock(x, y - 1, z);
      this.hideBlock(x, y + 1, z);
      this.hideBlock(x, y, z - 1);
      this.hideBlock(x, y, z + 1);
  }
}