import { soundController, toast } from "../../main";
import { blocks } from "../blocks";
import type { Player } from "../player";
import { getSmeltingRecipes } from "./smeltingRecipes";
import type { SmeltingRecipe } from "./smeltingRecipes";

export class FurnaceUI {
    static furnaceController: AbortController = new AbortController();

    static isSmeltable(recipe: SmeltingRecipe, player: Player): boolean {
        // Check if the player has the required materials
        for (const material of recipe.neededMaterials) {
            if (!player.inventory.hasItem(material.blockId, material.amount)) {
                return false;
            }
        }
        return true;
    }

    static smeltRecipe(recipe: SmeltingRecipe, player: Player) {
        // Check if the recipe is smeltable
        if (!FurnaceUI.isSmeltable(recipe, player)) {
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

        const itemToAdd = {
            blockId: recipe.results[0].blockId,
            texture: block?.icon || '/textures/unknown.png',
            type: block?.placeable ? 'placeable' : 'item',
            amount: recipe.results[0].amount
        };

        // Add the crafted item to the player's inventory
        player.inventory.addItem(itemToAdd);

        player.updateHotbarDisplay();

        toast.addNotification({
            type: 'advancement',
            message: `Smelted ${recipe.name}!`,
            showFor: 1000
        });
        soundController.playSound('sounds/smelting.mp3');
        FurnaceUI.openUI(player, true);
    }

    static openUI(player: Player, isRefresh: boolean = false) {
        if (player.uiShown) {
            FurnaceUI.closeUI(player);
            if (!isRefresh)
                return;
        }
        FurnaceUI.furnaceController.abort();
        FurnaceUI.furnaceController = new AbortController();
        const uiContainer = document.getElementById('ui-container');
        if (!uiContainer) {
            console.error('UI container not found');
            return;
        }
        uiContainer.classList.remove('hidden');
        fetch('ui/furnace.html')
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
                const recipeList = document.getElementById('smelting-list');
                if (!recipeList) {
                    toast.addNotification({
                        type: 'error',
                        message: 'Smelting list not found in UI.',
                        showFor: 5000
                    });
                    return;
                }
                const recipes = getSmeltingRecipes();
                Object.values(recipes).forEach(recipe => {
                    const missingItems = !FurnaceUI.isSmeltable(recipe, player);
                    const recipeElement = document.createElement('div');
                    recipeElement.classList.add('smelting-recipe');
                    recipeElement.innerHTML = `
                        <div class="smelting-items">
                            ${recipe.neededMaterials.map(item => {
                                // Get block from blockId
                                const block = Object.values(blocks).find(b => b.id === item.blockId);
                                if (!block) {
                                    return '';
                                }
                                const isMissing = !player.inventory.hasItem(item.blockId, item.amount);
                                return `
                                    <div class="smelting-item ${missingItems && isMissing ? 'missing' : ''}">
                                        <img src="${block?.icon}" alt="${block?.name}">
                                        <span class="smelting-item-count">${isMissing ? player.inventory.getItemCount(item.blockId) + " / " + item.amount : item.amount}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <span class="smelting-arrow">→</span>
                        <div class="smelting-items">
                            ${recipe.results.map(result => {
                                const block = Object.values(blocks).find(b => b.id === result.blockId);
                                if (!block) {
                                    return '';
                                }
                                return `
                                    <div class="smelting-item ${missingItems ? 'missing' : ''}">
                                        <img src="${block?.icon}" alt="${block?.name}">
                                        <span class="smelting-item-count">${result.amount}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <button class="smelting-button ${missingItems ? 'smelting-button-disabled' : ''}" data-recipe="${recipe.name}">Smelt</button>
                    `;
                    recipeList.appendChild(recipeElement);
                })
                player.controls.unlock();
                const smeltingButtons = document.querySelectorAll('.smelting-button');
                smeltingButtons.forEach(button => {
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
                        FurnaceUI.smeltRecipe(recipe, player);
                    });
                });
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                uiContainer.innerHTML = '<p>Error loading content.</p>';
            });
        const closeButton = document.getElementById('close-smelting-ui');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                FurnaceUI.closeUI(player);
            }, { signal: FurnaceUI.furnaceController.signal });
        }
    }

    static closeUI(player: Player) {
        FurnaceUI.furnaceController.abort();
        FurnaceUI.furnaceController = new AbortController();
        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.innerHTML = '';
            uiContainer.classList.add('hidden');
        }
        player.controls.lock();
        player.uiShown = false;
    }
}