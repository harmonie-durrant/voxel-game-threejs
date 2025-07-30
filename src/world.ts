import * as THREE from 'three';
import { WorldChunk } from './worldChunk';
import type { Player } from './player';

type terrainParams = {
  scale : number,
  magnitude : number,
  offset : number,
  dirtlayer : number
};

export type paramsType = {
  seed : number,
  terrain : terrainParams
};

export type chunkSize = {
  width : number,
  height : number
}

export class World extends THREE.Group {

    seed: number = 0;
    chunkSize: chunkSize = { width: 8, height: 32 };
    renderDistance = 1;

    params : paramsType = {
      seed: 0,
      terrain: {
        scale: 30,
        magnitude: 0.5,
        offset: 0.2,
        dirtlayer: 3
      },
    };

    chunk: WorldChunk | null;

    constructor(seed : number = 0) {
        super()
        this.seed = seed;
        this.chunk = null;
    }

    update(player : Player) {
      const visibleChunks = this.getVisibleChunks(player);
      const chunksToAdd = this.getChunksToAdd(visibleChunks);
      this.removeUnusedChunks(visibleChunks);
      for (const chunk of chunksToAdd) {
        this.generateChunk(chunk.x, chunk.z)
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

    generateChunk(x : number, z : number) {
      const chunk = new WorldChunk(this.chunkSize, this.params);
      chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
      chunk.userData = { x, z };
      chunk.generate();
      this.add(chunk);
    }

    generate() {
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
      if (!chunk) return null;
      return chunk.getBlock(coords.block.x, coords.block.y, coords.block.z);
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
}