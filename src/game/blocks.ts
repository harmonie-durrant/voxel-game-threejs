import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

function loadTexture(path : string) {
    const texture = textureLoader.load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
}

const textures = {
    grass: loadTexture('textures/grass.png'),
    grassSide: loadTexture('textures/grass_side.png'),
    dirt: loadTexture('textures/dirt.png'),
    stone: loadTexture('textures/stone.png'),
    coalOre: loadTexture('textures/coal_ore.png'),
    ironOre: loadTexture('textures/iron_ore.png'),
    leaves: loadTexture('textures/leaves.png'),
    treeSide: loadTexture('textures/tree_side.png'),
    treeTop: loadTexture('textures/tree_top.png'),
    sand: loadTexture('textures/sand.png')
};

export type blocksType = {
    [key: string]: {
        id: number;
        name: string;
        color?: number;
        material?: THREE.Material | THREE.Material[];
        icon?: string;
        scale?: { x: number, y: number, z: number };
        scarcity?: number;
        transparent?: boolean;
        itemsToDrop?: { blockId: number, count: number }[];
    }
}

export const blocks: blocksType = {
    empty: {
        id: 0,
        name: "empty",
    },
    grass: {
        id: 1,
        name: "grass",
        color: 0x559020, // Green
        material: [
            new THREE.MeshLambertMaterial({ map: textures.grassSide }),
            new THREE.MeshLambertMaterial({ map: textures.grassSide }),
            new THREE.MeshLambertMaterial({ map: textures.grass }),
            new THREE.MeshLambertMaterial({ map: textures.dirt }),
            new THREE.MeshLambertMaterial({ map: textures.grassSide }),
            new THREE.MeshLambertMaterial({ map: textures.grassSide }),
        ],
        icon: "/textures/grass.png",
        itemsToDrop: [
            { blockId: 1, count: 1 },
        ]
    },
    dirt: {
        id: 2,
        name: "dirt",
        color: 0x807020, // Brown
        material: new THREE.MeshLambertMaterial({ map: textures.dirt }),
        icon: "/textures/dirt.png",
        itemsToDrop: [
            { blockId: 2, count: 1 },
        ]
    },
    stone: {
        id: 3,
        name: "stone",
        color: 0x808080, // Gray
        material: new THREE.MeshLambertMaterial({ map: textures.stone }),
        scale: { x: 30, y: 30, z: 30 },
        scarcity: 0.5,
        icon: "/textures/stone.png",
        itemsToDrop: [
            { blockId: 3, count: 1 },
        ]
    },
    coalOre: {
        id: 4,
        name: "coal ore",
        color: 0x353535, // Dark Gray
        material: new THREE.MeshLambertMaterial({ map: textures.coalOre }),
        scale: { x: 20, y: 20, z: 20 },
        scarcity: 0.8,
        icon: "/textures/coal_ore.png",
        itemsToDrop: [
            { blockId: 4, count: 1 },
        ]
    },
    ironOre: {
        id: 5,
        name: "iron ore",
        color: 0xaaaaaa, // Dark Gray
        material: new THREE.MeshLambertMaterial({ map: textures.ironOre }),
        scale: { x: 60, y: 60, z: 60 },
        scarcity: 0.9,
        icon: "/textures/iron_ore.png",
        itemsToDrop: [
            { blockId: 5, count: 1 },
        ]
    },
    tree: {
        id: 6,
        name: "tree",
        color: 0x8B4513, // Saddle Brown
        material: [
            new THREE.MeshLambertMaterial({ map: textures.treeSide }),
            new THREE.MeshLambertMaterial({ map: textures.treeSide }),
            new THREE.MeshLambertMaterial({ map: textures.treeTop }),
            new THREE.MeshLambertMaterial({ map: textures.treeTop }),
            new THREE.MeshLambertMaterial({ map: textures.treeSide }),
            new THREE.MeshLambertMaterial({ map: textures.treeSide })
        ],
        icon: "/textures/tree_top.png",
        itemsToDrop: [
            { blockId: 6, count: 1 },
        ]
    },
    leaves: {
        id: 7,
        name: "leaves",
        color: 0x00ff00, // Green
        material: new THREE.MeshLambertMaterial({
            map: textures.leaves,
            transparent: true,
            side: THREE.DoubleSide
        }),
        transparent: true,
        icon: "/textures/leaves.png",
        itemsToDrop: []
    },
    sand: {
        id: 8,
        name: "sand",
        color: 0xEDC9AF, // Sandy Brown
        material: new THREE.MeshLambertMaterial({ map: textures.sand }),
        icon: "/textures/sand.png",
        itemsToDrop: [
            { blockId: 8, count: 1 },
        ]
    },
    cloud: {
        id: 9,
        name: "cloud",
        material: new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }),
    }
}

export const resources = [
    blocks.stone,
    blocks.coalOre,
    blocks.ironOre
]