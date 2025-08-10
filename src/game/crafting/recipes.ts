import { blocks } from "../blocks";

export type Recipe = {
    icon: string,
    name: string,
    neededMaterials: {
        blockId: number,
        amount: number
    }[],
    results: {
        blockId: number,
        amount: number
    }[],
    needsWorkbench: boolean
}

type Recipes = {
    [key: string]: Recipe
};

export function getRecipes(): Recipes {
    return {
        workbench: {
            icon: '/textures/workbench.png',
            name: 'Workbench',
            neededMaterials: [
                { blockId: blocks.planks.id, amount: 4 },
            ],
            results: [
                {
                    blockId: blocks.workbench.id,
                    amount: 1
                }
            ],
            needsWorkbench: false
        },
        planks: {
            icon: '/textures/planks.png',
            name: 'Planks',
            neededMaterials: [
                { blockId: blocks.tree.id, amount: 1 }
            ],
            results: [
                {
                    blockId: blocks.planks.id,
                    amount: 4
                }
            ],
            needsWorkbench: false
        },
        sticks: {
            icon: '/textures/stick.png',
            name: 'Sticks',
            neededMaterials: [
                { blockId: blocks.planks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.sticks.id,
                    amount: 4
                }
            ],
            needsWorkbench: false
        },
        woodenPickaxe: {
            icon: '/textures/wooden_pickaxe.png',
            name: 'Wooden Pickaxe',
            neededMaterials: [
                { blockId: blocks.planks.id, amount: 3 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.woodenPickaxe.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        stonePickaxe: {
            icon: '/textures/stone_pickaxe.png',
            name: 'Stone Pickaxe',
            neededMaterials: [
                { blockId: blocks.cobblestone.id, amount: 3 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.stonePickaxe.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        ironPickaxe: {
            icon: '/textures/iron_pickaxe.png',
            name: 'Iron Pickaxe',
            neededMaterials: [
                { blockId: blocks.ironIngot.id, amount: 3 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.ironPickaxe.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        diamondPickaxe: {
            icon: '/textures/diamond_pickaxe.png',
            name: 'Diamond Pickaxe',
            neededMaterials: [
                { blockId: blocks.ironOre.id, amount: 3 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.diamondPickaxe.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        woodenAxe: {
            icon: '/textures/wooden_axe.png',
            name: 'Wooden Axe',
            neededMaterials: [
                { blockId: blocks.planks.id, amount: 3 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.woodenAxe.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        stoneAxe: {
            icon: '/textures/stone_axe.png',
            name: 'Stone Axe',
            neededMaterials: [
                { blockId: blocks.cobblestone.id, amount: 3 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.stoneAxe.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        ironAxe: {
            icon: '/textures/iron_axe.png',
            name: 'Iron Axe',
            neededMaterials: [
                { blockId: blocks.ironIngot.id, amount: 3 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.ironAxe.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        diamondAxe: {
            icon: '/textures/diamond_axe.png',
            name: 'Diamond Axe',
            neededMaterials: [
                { blockId: blocks.ironOre.id, amount: 3 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.diamondAxe.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        furnace: {
            icon: '/textures/blocks/furnace_side.png',
            name: "Furnace",
            neededMaterials: [
                { blockId: blocks.cobblestone.id, amount: 8 }
            ],
            results: [
                {
                    blockId: blocks.furnace.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        woodenShovel: {
            icon: '/textures/wooden_shovel.png',
            name: 'Wooden Shovel',
            neededMaterials: [
                { blockId: blocks.planks.id, amount: 1 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.woodenShovel.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        stoneShovel: {
            icon: '/textures/stone_shovel.png',
            name: 'Stone Shovel',
            neededMaterials: [
                { blockId: blocks.cobblestone.id, amount: 1 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.stoneShovel.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        ironShovel: {
            icon: '/textures/iron_shovel.png',
            name: 'Iron Shovel',
            neededMaterials: [
                { blockId: blocks.ironIngot.id, amount: 1 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.ironShovel.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        diamondShovel: {
            icon: '/textures/diamond_shovel.png',
            name: 'Diamond Shovel',
            neededMaterials: [
                { blockId: blocks.ironOre.id, amount: 1 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.diamondShovel.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        woodenHoe: {
            icon: '/textures/wooden_hoe.png',
            name: 'Wooden hoe',
            neededMaterials: [
                { blockId: blocks.planks.id, amount: 2 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.woodenHoe.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        stoneHoe: {
            icon: '/textures/stone_hoe.png',
            name: 'Stone hoe',
            neededMaterials: [
                { blockId: blocks.cobblestone.id, amount: 2 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.stoneHoe.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        ironHoe: {
            icon: '/textures/iron_hoe.png',
            name: 'Iron hoe',
            neededMaterials: [
                { blockId: blocks.ironIngot.id, amount: 2 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.ironHoe.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        },
        diamondHoe: {
            icon: '/textures/diamond_hoe.png',
            name: 'Diamond hoe',
            neededMaterials: [
                { blockId: blocks.ironOre.id, amount: 2 },
                { blockId: blocks.sticks.id, amount: 2 }
            ],
            results: [
                {
                    blockId: blocks.diamondHoe.id,
                    amount: 1
                }
            ],
            needsWorkbench: true
        }
    };
};