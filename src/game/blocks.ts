import * as THREE from 'three';
import type { Player } from './player';
import type { World } from './world';
import { WorkbenchUI } from './crafting/workbenchUI';
import { FurnaceUI } from './smelting/furnaceUI';

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
    furnaceSide: loadTexture('textures/blocks/furnace_side.png'),
    furnaceTop: loadTexture('textures/blocks/furnace_top.png'),
    furnaceFront: loadTexture('textures/blocks/furnace_front.png'),
};

type ToolType = 'pickaxe' | 'axe' | 'shovel' | 'hoe' | 'none';

export type blocksType = {
    [key: string]: {
        id: number;
        name: string;
        placeable: boolean;
        hardness?: number;
        requiredToolTier?: number;
        requiredToolType?: ToolType;
        color?: number;
        material?: THREE.Material | THREE.Material[];
        icon?: string;
        scale?: { x: number, y: number, z: number };
        scarcity?: number;
        transparent?: boolean;
        itemsToDrop?: { blockId: number, count: number }[];
        onInteract?: (player: Player, world: World) => void;
        speedMultiplier?: number;
        toolType?: ToolType;
        toolTier?: number;
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
        hardness: 0.5,
        requiredToolTier: 0,
        requiredToolType: 'shovel',
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
        hardness: 0.5,
        requiredToolTier: 0,
        requiredToolType: 'shovel',
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
        hardness: 1.5,
        requiredToolTier: 1,
        requiredToolType: 'pickaxe',
        material: new THREE.MeshLambertMaterial({ map: textures.stone }),
        scale: { x: 30, y: 30, z: 30 },
        scarcity: 0.05,
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
        hardness: 1.5,
        requiredToolTier: 1,
        requiredToolType: 'pickaxe',
        material: new THREE.MeshLambertMaterial({ map: textures.coalOre }),
        scale: { x: 20, y: 20, z: 20 },
        scarcity: 0.8,
        icon: "/textures/blocks/coal_ore.png",
        itemsToDrop: [
            { blockId: 25, count: 1 },
        ]
    },
    ironOre: {
        id: 5,
        name: "iron ore",
        placeable: true,
        color: 0xaaaaaa, // Dark Gray
        hardness: 1.5,
        requiredToolTier: 2,
        requiredToolType: 'pickaxe',
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
        hardness: 2,
        requiredToolTier: 0,
        requiredToolType: 'axe',
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
        hardness: 0.2,
        requiredToolTier: 0,
        requiredToolType: 'hoe',
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
        hardness: 0.5,
        requiredToolTier: 0,
        requiredToolType: 'shovel',
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
        hardness: 2,
        requiredToolTier: 0,
        requiredToolType: 'axe',
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
        speedMultiplier: 1.15,
        toolType: 'pickaxe',
        toolTier: 1
    },
    workbench: {
        id: 13,
        name: "workbench",
        placeable: true,
        color: 0x8B4513, // Saddle Brown
        hardness: 2,
        requiredToolTier: 0,
        requiredToolType: 'axe',
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
        ],
        onInteract: (player: Player, world: World) => {
            world;
            player.controls.unlock();
            WorkbenchUI.openUI(player);
        }
    },
    cobblestone: {
        id: 14,
        name: "cobblestone",
        placeable: true,
        color: 0x808080, // Gray
        hardness: 1.5,
        requiredToolTier: 1,
        requiredToolType: 'pickaxe',
        material: new THREE.MeshLambertMaterial({ map: textures.cobblestone }),
        icon: "/textures/blocks/cobblestone.png",
        itemsToDrop: [
            { blockId: 14, count: 1 },
        ]
    },
    stonePickaxe: {
        id: 15,
        name: "stone pickaxe",
        placeable: false,
        icon: "/textures/items/stone_pickaxe.png",
        speedMultiplier: 1.4,
        toolType: 'pickaxe',
        toolTier: 2
    },
    ironPickaxe: {
        id: 16,
        name: "iron pickaxe",
        placeable: false,
        icon: "/textures/items/iron_pickaxe.png",
        speedMultiplier: 1.7,
        toolType: 'pickaxe',
        toolTier: 3
    },
    diamondPickaxe: {
        id: 17,
        name: "diamond pickaxe",
        placeable: false,
        icon: "/textures/items/diamond_pickaxe.png",
        speedMultiplier: 2,
        toolType: 'pickaxe',
        toolTier: 4
    },
    woodenAxe: {
        id: 18,
        name: "wooden axe",
        placeable: false,
        icon: "/textures/items/wooden_axe.png",
        speedMultiplier: 1.15,
        toolType: 'axe',
        toolTier: 1
    },
    stoneAxe: {
        id: 19,
        name: "stone axe",
        placeable: false,
        icon: "/textures/items/stone_axe.png",
        speedMultiplier: 1.4,
        toolType: 'axe',
        toolTier: 2
    },
    ironAxe: {
        id: 20,
        name: "iron axe",
        placeable: false,
        icon: "/textures/items/iron_axe.png",
        speedMultiplier: 1.7,
        toolType: 'axe',
        toolTier: 3
    },
    diamondAxe: {
        id: 21,
        name: "diamond axe",
        placeable: false,
        icon: "/textures/items/diamond_axe.png",
        speedMultiplier: 2,
        toolType: 'axe',
        toolTier: 4
    },
    furnace: {
        id: 22,
        name: "furnace",
        placeable: true,
        color: 0x808080, // Gray
        hardness: 3,
        requiredToolTier: 0,
        requiredToolType: 'pickaxe',
        material: [
            new THREE.MeshLambertMaterial({ map: textures.furnaceSide }),
            new THREE.MeshLambertMaterial({ map: textures.furnaceSide }),
            new THREE.MeshLambertMaterial({ map: textures.furnaceTop }),
            new THREE.MeshLambertMaterial({ map: textures.furnaceTop }),
            new THREE.MeshLambertMaterial({ map: textures.furnaceSide }),
            new THREE.MeshLambertMaterial({ map: textures.furnaceSide }),
        ],
        icon: "/textures/blocks/furnace_side.png",
        itemsToDrop: [
            { blockId: 22, count: 1 },
        ],
        onInteract: (player: Player, world: World) => {
            world;
            player.controls.unlock();
            FurnaceUI.openUI(player);
        }
    },
    charcoal: {
        id: 23,
        name: "charcoal",
        placeable: false,
        icon: "/textures/items/charcoal.png",
    },
    ironIngot: {
        id: 24,
        name: "iron ingot",
        placeable: false,
        icon: "/textures/items/iron_ingot.png",
    },
    coal: {
        id: 25,
        name: "coal",
        placeable: false,
        icon: "/textures/items/coal.png",
    }
}

export const resources = [
    blocks.stone,
    blocks.coalOre,
    blocks.ironOre
]

export const interactableBlocks = [
    blocks.workbench,
    blocks.furnace
];

export const fuel = [
    blocks.coal,
    blocks.charcoal
]