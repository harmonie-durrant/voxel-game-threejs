import * as THREE from 'three';

export class WorldSaveData {
    data : { [key: string]: number } = {};

    constructor() {
        this.data = {};
    }

    clear() {
        this.data = {};
    }

    contains(chunPos : THREE.Vector2, blockPos : THREE.Vector3) {
        const key = this.getKey(chunPos, blockPos);
        return this.data.hasOwnProperty(key) && this.data[key] !== undefined;
    }

    get(chunPos : THREE.Vector2, blockPos : THREE.Vector3) {
        const key = this.getKey(chunPos, blockPos);
        const blockId = this.data[key];
        return blockId;
    }

    set(chunPos : THREE.Vector2, blockPos : THREE.Vector3, blockId : number) {
        const key = this.getKey(chunPos, blockPos);
        this.data[key] = blockId;
    }

    getKey(chunPos : THREE.Vector2, blockPos : THREE.Vector3) : string {
        return `(${chunPos.x},${chunPos.y})-(${blockPos.x},${blockPos.y},${blockPos.z})`;
    }
}