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
    grass: loadTexture('textures/blocks/grass_top.png'),
    grassSide: loadTexture('textures/blocks/grass_side.png'),
    dirt: loadTexture('textures/blocks/dirt.png'),
    stone: loadTexture('textures/blocks/stone.png'),
    coalOre: loadTexture('textures/blocks/coal_ore.png'),
    ironOre: loadTexture('textures/blocks/iron_ore.png'),
    leaves: loadTexture('textures/blocks/leaves.png'),
    treeSide: loadTexture('textures/blocks/oak_log_side.png'),
    treeTop: loadTexture('textures/blocks/oak_log_top.png'),
    sand: loadTexture('textures/blocks/sand.png'),
    oakPlanks: loadTexture('textures/blocks/oak_planks.png'),
    cobblestone: loadTexture('textures/blocks/cobblestone.png'),
    workbenchSide: loadTexture('textures/blocks/workbench_side.png'),
    workbenchTop: loadTexture('textures/blocks/workbench_top.png'),
};

export type blocksType = {
    [key: string]: {
        id: number;
        name: string;
        placeable: boolean;
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
        placeable: false,
    },
    grass: {
        id: 1,
        name: "grass",
        placeable: true,
        color: 0x559020, // Green
        material: [
            new THREE.MeshLambertMaterial({ map: textures.grassSide }),
            new THREE.MeshLambertMaterial({ map: textures.grassSide }),
            new THREE.MeshLambertMaterial({ map: textures.grass }),
            new THREE.MeshLambertMaterial({ map: textures.dirt }),
            new THREE.MeshLambertMaterial({ map: textures.grassSide }),
            new THREE.MeshLambertMaterial({ map: textures.grassSide }),
        ],
        icon: "/textures/blocks/grass_side.png",
        itemsToDrop: [
            { blockId: 1, count: 1 },
        ]
    },
    dirt: {
        id: 2,
        name: "dirt",
        placeable: true,
        color: 0x807020, // Brown
        material: new THREE.MeshLambertMaterial({ map: textures.dirt }),
        icon: "/textures/blocks/dirt.png",
        itemsToDrop: [
            { blockId: 2, count: 1 },
        ]
    },
    stone: {
        id: 3,
        name: "stone",
        placeable: true,
        color: 0x808080, // Gray
        material: new THREE.MeshLambertMaterial({ map: textures.stone }),
        scale: { x: 30, y: 30, z: 30 },
        scarcity: 0.5,
        icon: "/textures/blocks/stone.png",
        itemsToDrop: [
            { blockId: 14, count: 1 },
        ]
    },
    coalOre: {
        id: 4,
        name: "coal ore",
        placeable: true,
        color: 0x353535, // Dark Gray
        material: new THREE.MeshLambertMaterial({ map: textures.coalOre }),
        scale: { x: 20, y: 20, z: 20 },
        scarcity: 0.8,
        icon: "/textures/blocks/coal_ore.png",
        itemsToDrop: [
            { blockId: 4, count: 1 },
        ]
    },
    ironOre: {
        id: 5,
        name: "iron ore",
        placeable: true,
        color: 0xaaaaaa, // Dark Gray
        material: new THREE.MeshLambertMaterial({ map: textures.ironOre }),
        scale: { x: 60, y: 60, z: 60 },
        scarcity: 0.9,
        icon: "/textures/blocks/iron_ore.png",
        itemsToDrop: [
            { blockId: 5, count: 1 },
        ]
    },
    tree: {
        id: 6,
        name: "tree",
        placeable: true,
        color: 0x8B4513, // Saddle Brown
        material: [
            new THREE.MeshLambertMaterial({ map: textures.treeSide }),
            new THREE.MeshLambertMaterial({ map: textures.treeSide }),
            new THREE.MeshLambertMaterial({ map: textures.treeTop }),
            new THREE.MeshLambertMaterial({ map: textures.treeTop }),
            new THREE.MeshLambertMaterial({ map: textures.treeSide }),
            new THREE.MeshLambertMaterial({ map: textures.treeSide })
        ],
        icon: "/textures/blocks/oak_log_top.png",
        itemsToDrop: [
            { blockId: 6, count: 1 },
        ]
    },
    leaves: {
        id: 7,
        name: "leaves",
        placeable: true,
        color: 0x00ff00, // Green
        material: new THREE.MeshLambertMaterial({
            map: textures.leaves,
            transparent: true,
            side: THREE.DoubleSide
        }),
        transparent: true,
        icon: "/textures/blocks/leaves.png",
        itemsToDrop: []
    },
    sand: {
        id: 8,
        name: "sand",
        placeable: true,
        color: 0xEDC9AF, // Sandy Brown
        material: new THREE.MeshLambertMaterial({ map: textures.sand }),
        icon: "/textures/blocks/sand.png",
        itemsToDrop: [
            { blockId: 8, count: 1 },
        ]
    },
    cloud: {
        id: 9,
        name: "cloud",
        placeable: true,
        material: new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }),
    },
    planks: {
        id: 10,
        name: "planks",
        placeable: true,
        color: 0xD2B48C, // Tan
        material: new THREE.MeshLambertMaterial({ map: textures.oakPlanks }),
        icon: "/textures/blocks/oak_planks.png",
        itemsToDrop: [
            { blockId: 10, count: 1 },
        ]
    },
    sticks: {
        id: 11,
        name: "sticks",
        placeable: false,
        icon: "/textures/items/stick.png",
    },
    woodenPickaxe: {
        id: 12,
        name: "wooden pickaxe",
        placeable: false,
        icon: "/textures/items/wooden_pickaxe.png",
    },
    workbench: {
        id: 13,
        name: "workbench",
        placeable: true,
        color: 0x8B4513, // Saddle Brown
        material: [
            new THREE.MeshLambertMaterial({ map: textures.workbenchSide }),
            new THREE.MeshLambertMaterial({ map: textures.workbenchSide }),
            new THREE.MeshLambertMaterial({ map: textures.workbenchTop }),
            new THREE.MeshLambertMaterial({ map: textures.workbenchTop }),
            new THREE.MeshLambertMaterial({ map: textures.workbenchSide }),
            new THREE.MeshLambertMaterial({ map: textures.workbenchSide })
        ],
        icon: "/textures/blocks/workbench_side.png",
        itemsToDrop: [
            { blockId: 13, count: 1 },
        ]
    },
    cobblestone: {
        id: 14,
        name: "cobblestone",
        placeable: true,
        color: 0x808080, // Gray
        material: new THREE.MeshLambertMaterial({ map: textures.cobblestone }),
        icon: "/textures/blocks/cobblestone.png",
        itemsToDrop: [
            { blockId: 14, count: 1 },
        ]
    }
}

export const resources = [
    blocks.stone,
    blocks.coalOre,
    blocks.ironOre
]