import { Game } from "../game/game";
import { soundController, toast } from "../main";

export class WorldCreation {
    game: Game | null = null;

    abortController: AbortController = new AbortController();

    constructor() {}

    startGameFromSave(mainMenuController: AbortController): void {
        try {
            this.game = new Game(true);
            this.closeWorldCreationMenu();
            mainMenuController.abort();
        } catch (error) {
            console.error("Failed to load game from save:", error);
            toast.addNotification({
                type: "error",
                message:
                    "Failed to load game from save.\nPlease check your save file or save a game first.",
                showFor: 5000,
            });
        }
    }

    openWorldCreationMenu(mainMenuController: AbortController): void {
        soundController.playSound("sounds/ui_button_press.mp3");
        const worldCreationPopup = document.getElementById("world-creation-popup");
        if (worldCreationPopup) {
            worldCreationPopup.classList.replace("hidden", "flex");
        }
        document.getElementById("create-world")?.addEventListener(
            "click",
            () => {
                soundController.playSound("sounds/ui_button_press.mp3");
                const seedInput = document.getElementById("world-seed") as HTMLInputElement;
                const isSeedEmpty = !seedInput || !seedInput.value?.trim();
                let seed = isSeedEmpty ? Math.random() * 1000000 : parseInt(seedInput.value, 10);
                this.start_game(seed);
                this.abortController.abort();
                mainMenuController.abort();
            },
            { signal: this.abortController.signal },
        );
        document.getElementById("close-world-creation")?.addEventListener(
            "click",
            () => {
                this.closeWorldCreationMenu();
            },
            { signal: this.abortController.signal },
        );
    }

    closeWorldCreationMenu(): void {
        soundController.playSound("sounds/ui_button_press.mp3");
        const worldCreationMenu = document.getElementById("world-creation-popup");
        if (worldCreationMenu) {
            worldCreationMenu.classList.replace("flex", "hidden");
            this.abortController.abort();
            this.abortController = new AbortController();
        }
    }

    start_game(seed: number): void {
        this.game = new Game(false, seed);
        this.closeWorldCreationMenu();
    }
}
