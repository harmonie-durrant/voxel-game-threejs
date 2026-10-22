import { soundController, toast } from "../../main";
import { blocks } from "../blocks";
import type { Player } from "../player";
import { getRecipes } from "./recipes";
import type { Recipe } from "./recipes";

export class WorkbenchUI {
    static workbenchController: AbortController = new AbortController();

    static isCraftable(
        recipe: Recipe,
        player: Player,
        mode: "workbench" | "crafting" = "workbench",
    ): boolean {
        // Check if the player has the required materials
        for (const material of recipe.neededMaterials) {
            if (!player.inventory.hasItem(material.blockId, material.amount)) {
                return false;
            }
        }
        return WorkbenchUI.isCorrectMode(recipe, mode);
    }

    static isCorrectMode(recipe: Recipe, mode: "workbench" | "crafting" = "workbench"): boolean {
        if (mode === "crafting" && recipe.needsWorkbench) {
            return false;
        }
        return true;
    }

    static craftRecipe(
        recipe: Recipe,
        player: Player,
        mode: "workbench" | "crafting" = "workbench",
    ) {
        // Check if the player is allowed to craft this recipe in the current mode
        if (!WorkbenchUI.isCorrectMode(recipe, mode)) {
            toast.addNotification({
                type: "error",
                message: `You need a workbench to craft ${recipe.name}.`,
                showFor: 5000,
            });
            return;
        }
        // Check if the recipe is craftable
        if (!WorkbenchUI.isCraftable(recipe, player, mode)) {
            toast.addNotification({
                type: "error",
                message: `You do not have enough items to craft ${recipe.name}.`,
                showFor: 5000,
            });
            return;
        }

        // Remove the required materials from the player's inventory
        for (const material of recipe.neededMaterials) {
            player.inventory.removeItemByBlockId(material.blockId, material.amount);
        }

        const block = Object.values(blocks).find((b) => b.id === recipe.results[0].blockId);

        // Add the crafted item to the player's inventory
        player.inventory.addItem(
            {
                blockId: recipe.results[0].blockId,
                texture: block?.icon || "/textures/unknown.png",
                type: block?.placeable ? "placeable" : "item",
                amount: recipe.results[0].amount,
            },
            -1,
            player,
        );
        player.updateHotbarDisplay();

        toast.addNotification({
            type: "advancement",
            message: `Crafted ${recipe.name}!`,
            showFor: 1000,
        });
        soundController.playSound("sounds/crafting.mp3");
        WorkbenchUI.openUI(player, mode, true);
    }

    static openUI(
        player: Player,
        mode: "workbench" | "crafting" = "workbench",
        isRefresh: boolean = false,
    ) {
        if (player.uiShown && !isRefresh) {
            WorkbenchUI.closeUI(player);
            return;
        }
        WorkbenchUI.workbenchController.abort();
        WorkbenchUI.workbenchController = new AbortController();
        const signal = WorkbenchUI.workbenchController.signal;
        const uiContainer = document.getElementById("ui-container");
        if (!uiContainer) {
            console.error("UI container not found");
            return;
        }
        uiContainer.classList.remove("hidden");
        // Mark the UI as open before unlocking so the pause menu knows the unlock is intentional
        player.uiShown = true;
        player.controls.unlock();
        fetch("ui/workbench.html")
            .then((response) => {
                if (!response.ok) {
                    return null;
                }
                return response.text();
            })
            .then((htmlContent) => {
                // The UI may have been closed or reopened while loading
                if (!htmlContent || signal.aborted) {
                    return;
                }
                uiContainer.innerHTML = htmlContent;
                document.getElementById("close-crafting-ui")?.addEventListener(
                    "click",
                    () => {
                        WorkbenchUI.closeUI(player);
                    },
                    { signal },
                );
                const recipeList = document.getElementById("crafting-list");
                if (!recipeList) {
                    toast.addNotification({
                        type: "error",
                        message: "Crafting list not found in UI.",
                        showFor: 5000,
                    });
                    return;
                }
                const recipes = getRecipes();
                Object.values(recipes).forEach((recipe) => {
                    const missingWorkbench = !WorkbenchUI.isCorrectMode(recipe, mode);
                    const missingItems = !WorkbenchUI.isCraftable(recipe, player, mode);
                    const recipeElement = document.createElement("div");
                    recipeElement.className =
                        "flex items-center gap-4 py-3 px-5 bg-ui-recipe rounded-lg";
                    recipeElement.innerHTML = `
                        <div class="flex gap-2">
                            ${recipe.neededMaterials
                                .map((item) => {
                                    // Get block from blockId
                                    const block = Object.values(blocks).find(
                                        (b) => b.id === item.blockId,
                                    );
                                    if (!block) {
                                        return "";
                                    }
                                    const isMissing = !player.inventory.hasItem(
                                        item.blockId,
                                        item.amount,
                                    );
                                    return `
                                    <div class="relative w-16 h-16 flex items-center justify-center border-2 border-ui-light rounded-sm ${missingWorkbench ? "bg-ui-missing opacity-80" : missingItems && isMissing ? "bg-ui-missing opacity-80 font-bold" : "bg-ui-dark"}">
                                        <img class="w-3/4 h-3/4 object-contain" src="${block?.icon}" alt="${block?.name}">
                                        <span class="absolute bottom-1 right-1 px-1 bg-black/50 rounded-sm text-[1.2em] text-shadow-soft ${missingWorkbench ? "text-[gray]" : missingItems && isMissing ? "text-[red]" : "text-white"}">${isMissing ? item.amount : item.amount}</span>
                                    </div>
                                `;
                                })
                                .join("")}
                        </div>
                        <span class="mx-3 text-[2em] text-white select-none">→</span>
                        <div class="flex gap-2">
                            ${recipe.results
                                .map((result) => {
                                    const block = Object.values(blocks).find(
                                        (b) => b.id === result.blockId,
                                    );
                                    if (!block) {
                                        return "";
                                    }
                                    return `
                                    <div class="relative w-16 h-16 flex items-center justify-center border-2 border-ui-light rounded-sm ${missingWorkbench ? "bg-ui-missing opacity-80" : missingItems ? "bg-ui-missing opacity-80 font-bold" : "bg-ui-dark"}">
                                        <img class="w-3/4 h-3/4 object-contain" src="${block?.icon}" alt="${block?.name}">
                                        <span class="absolute bottom-1 right-1 px-1 bg-black/50 rounded-sm text-[1.2em] text-shadow-soft ${missingWorkbench ? "text-[gray]" : missingItems ? "text-[red]" : "text-white"}">${result.amount}</span>
                                    </div>
                                `;
                                })
                                .join("")}
                        </div>
                        <button class="ml-auto py-2.5 px-5 border-none rounded-sm text-white text-[1.2em] transition-colors duration-300 ease-[ease] ${missingWorkbench || missingItems ? "bg-[#ccc] cursor-not-allowed" : "bg-[#4CAF50] hover:bg-[#45a049] cursor-pointer"}" data-recipe="${recipe.name}">Craft</button>
                    `;
                    recipeList.appendChild(recipeElement);
                });
                const craftingButtons = recipeList.querySelectorAll("button[data-recipe]");
                craftingButtons.forEach((button) => {
                    button.addEventListener("click", (event) => {
                        const recipeName = (event.currentTarget as HTMLButtonElement).dataset
                            .recipe;
                        if (!recipeName) {
                            toast.addNotification({
                                type: "error",
                                message: `Recipe not found.`,
                                showFor: 5000,
                            });
                            return;
                        }
                        const recipe = Object.values(recipes).find((r) => r.name === recipeName);
                        if (!recipe) {
                            toast.addNotification({
                                type: "error",
                                message: `Recipe ${recipeName} not found.`,
                                showFor: 5000,
                            });
                            return;
                        }
                        WorkbenchUI.craftRecipe(recipe, player, mode);
                    });
                });
            })
            .catch((error) => {
                console.error("There was a problem with the fetch operation:", error);
                uiContainer.innerHTML =
                    '<p class="m-0 mb-[25px] text-[0.8em] text-shadow-soft">Error loading content.</p>';
            });
    }

    static closeUI(player: Player) {
        WorkbenchUI.workbenchController.abort();
        WorkbenchUI.workbenchController = new AbortController();
        const uiContainer = document.getElementById("ui-container");
        if (uiContainer) {
            uiContainer.innerHTML = "";
            uiContainer.classList.add("hidden");
        }
        player.controls.lock();
        player.uiShown = false;
    }
}
