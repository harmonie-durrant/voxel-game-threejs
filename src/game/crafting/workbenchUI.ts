import { soundController, toast } from "../../main";
import { blocks } from "../blocks";
import type { Player } from "../player";
import { getRecipes } from "./recipes";
import type { Recipe } from "./recipes";

export class WorkbenchUI {
    static workbenchController: AbortController = new AbortController();

    static isCraftable(recipe: Recipe, player: Player, mode: 'workbench' | 'crafting' = 'workbench'): boolean {
        // Check if the player has the required materials
        for (const material of recipe.neededMaterials) {
            if (!player.inventory.hasItem(material.blockId, material.amount)) {
                return false;
            }
        }
        return WorkbenchUI.isCorrectMode(recipe, mode);
    }

    static isCorrectMode(recipe: Recipe, mode: 'workbench' | 'crafting' = 'workbench'): boolean {
        if (mode === 'crafting' && recipe.needsWorkbench) {
            return false;
        }
        return true;
    }

    static craftRecipe(recipe: Recipe, player: Player, mode: 'workbench' | 'crafting' = 'workbench') {
        // Check if the player is allowed to craft this recipe in the current mode
        if (!WorkbenchUI.isCorrectMode(recipe, mode)) {
            toast.addNotification({
                type: 'error',
                message: `You need a workbench to craft ${recipe.name}.`,
                showFor: 5000
            });
            return;
        }
        // Check if the recipe is craftable
        if (!WorkbenchUI.isCraftable(recipe, player, mode)) {
            toast.addNotification({
                type: 'error',
                message: `You do not have enough items to craft ${recipe.name}.`,
                showFor: 5000
            });
            return;
        }

        // Remove the required materials from the player's inventory
        for (const material of recipe.neededMaterials) {
            player.inventory.removeItemByBlockId(material.blockId, material.amount);
        }

        const block = Object.values(blocks).find(b => b.id === recipe.results[0].blockId);

        // Add the crafted item to the player's inventory
        player.inventory.addItem({
            blockId: recipe.results[0].blockId,
            texture: block?.icon || '/textures/unknown.png',
            type: block?.placeable ? 'placeable' : 'item',
            amount: recipe.results[0].amount
        }, -1, player);
        player.updateHotbarDisplay();

        toast.addNotification({
            type: 'advancement',
            message: `Crafted ${recipe.name}!`,
            showFor: 1000
        });
        soundController.playSound('sounds/crafting.mp3');
        WorkbenchUI.openUI(player, mode, true);
    }

    static openUI(player: Player, mode: 'workbench' | 'crafting' = 'workbench', isRefresh: boolean = false) {
        if (player.uiShown) {
            WorkbenchUI.closeUI(player);
            if (!isRefresh)
                return;
        }
        WorkbenchUI.workbenchController.abort();
        WorkbenchUI.workbenchController = new AbortController();
        const uiContainer = document.getElementById('ui-container');
        if (!uiContainer) {
            console.error('UI container not found');
            return;
        }
        uiContainer.classList.remove('hidden');
        fetch('ui/workbench.html')
            .then(response => {
                if (!response.ok) {
                    return null;
                }
                return response.text();
            })
            .then(htmlContent => {
                if (!htmlContent) {
                    return;
                }
                uiContainer.innerHTML = htmlContent;
                player.uiShown = true;
                const recipeList = document.getElementById('crafting-list');
                if (!recipeList) {
                    toast.addNotification({
                        type: 'error',
                        message: 'Crafting list not found in UI.',
                        showFor: 5000
                    });
                    return;
                }
                const recipes = getRecipes();
                Object.values(recipes).forEach(recipe => {
                    const missingWorkbench = !WorkbenchUI.isCorrectMode(recipe, mode);
                    const missingItems = !WorkbenchUI.isCraftable(recipe, player, mode);
                    const recipeElement = document.createElement('div');
                    recipeElement.classList.add('crafting-recipe');
                    recipeElement.innerHTML = `
                        <div class="crafting-items">
                            ${recipe.neededMaterials.map(item => {
                                // Get block from blockId
                                const block = Object.values(blocks).find(b => b.id === item.blockId);
                                if (!block) {
                                    return '';
                                }
                                const isMissing = !player.inventory.hasItem(item.blockId, item.amount);
                                return `
                                    <div class="crafting-item ${missingWorkbench ? 'missing-workbench' : ''} ${!missingWorkbench && missingItems && isMissing ? 'missing' : ''}">
                                        <img src="${block?.icon}" alt="${block?.name}">
                                        <span class="crafting-item-count">${isMissing ? item.amount : item.amount}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <span class="crafting-arrow">→</span>
                        <div class="crafting-items">
                            ${recipe.results.map(result => {
                                const block = Object.values(blocks).find(b => b.id === result.blockId);
                                if (!block) {
                                    return '';
                                }
                                return `
                                    <div class="crafting-item ${missingWorkbench ? 'missing-workbench' : ''} ${(!missingWorkbench && missingItems) ? 'missing' : ''}">
                                        <img src="${block?.icon}" alt="${block?.name}">
                                        <span class="crafting-item-count">${result.amount}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <button class="crafting-button ${(missingWorkbench || missingItems) ? 'crafting-button-disabled' : ''}" data-recipe="${recipe.name}">Craft</button>
                    `;
                    recipeList.appendChild(recipeElement);
                })
                player.controls.unlock();
                const craftingButtons = document.querySelectorAll('.crafting-button');
                craftingButtons.forEach(button => {
                    button.addEventListener('click', (event) => {
                        const recipeName = (event.currentTarget as HTMLButtonElement).dataset.recipe;
                        if (!recipeName) {
                            toast.addNotification({
                                type: 'error',
                                message: `Recipe not found.`,
                                showFor: 5000
                            });
                            return;
                        }
                        const recipe = Object.values(recipes).find(r => r.name === recipeName);
                        if (!recipe) {
                            toast.addNotification({
                                type: 'error',
                                message: `Recipe ${recipeName} not found.`,
                                showFor: 5000
                            });
                            return;
                        }
                        WorkbenchUI.craftRecipe(recipe, player, mode);
                    });
                });
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                uiContainer.innerHTML = '<p>Error loading content.</p>';
            });
        const closeButton = document.getElementById('close-crafting-ui');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                WorkbenchUI.closeUI(player);
            }, { signal: WorkbenchUI.workbenchController.signal });
        }
    }

    static closeUI(player: Player) {
        WorkbenchUI.workbenchController.abort();
        WorkbenchUI.workbenchController = new AbortController();
        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.innerHTML = '';
            uiContainer.classList.add('hidden');
        }
        player.controls.lock();
        player.uiShown = false;
    }
}