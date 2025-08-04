import { blocks } from "../blocks";

export type SmeltingRecipe = {
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
    smeltTime: number
}

type SmeltingRecipes = {
    [key: string]: SmeltingRecipe
};

export function getSmeltingRecipes(): SmeltingRecipes {
    return {
        charcoal: {
            icon: '/textures/items/charcoal.png',
            name: 'Charcoal',
            neededMaterials: [
                { blockId: blocks.tree.id, amount: 1 }
            ],
            results: [
                {
                    blockId: blocks.charcoal.id,
                    amount: 1
                }
            ],
            smeltTime: 5
        },
        ironIngot: {
            icon: '/textures/items/iron_ingot.png',
            name: 'Iron Ingot',
            neededMaterials: [
                { blockId: blocks.ironOre.id, amount: 1 }
            ],
            results: [
                {
                    blockId: blocks.ironIngot.id,
                    amount: 1
                }
            ],
            smeltTime: 5
        },
    }
};