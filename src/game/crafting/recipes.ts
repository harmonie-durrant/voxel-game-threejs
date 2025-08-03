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
    };
};