import { Game } from "../game/game";
import { toast } from "../main";


export class WorldCreation {
    game: Game | null = null;

    abortController: AbortController = new AbortController();

    constructor() {}

    startGameFromSave(mainMenuController: AbortController): void {
        try {
            this.game = new Game(true);
            this.closeWorldCreationMenu();
        } catch (error) {
            console.error('Failed to load game from save:', error);
            toast.addNotification({
                type: 'error',
                message: 'Failed to load game from save.\nPlease check your save file or save a game first.',
                showFor: 5000
            });
        }
        mainMenuController.abort();
    }

    openWorldCreationMenu(mainMenuController: AbortController): void {
        const worldCreationPopup = document.getElementById('world-creation-popup');
        if (worldCreationPopup) {
            worldCreationPopup.classList.remove('hidden');
        }
        document.getElementById('create-world')?.addEventListener('click', () => {
            const seedInput = document.getElementById('world-seed') as HTMLInputElement;
            if (!seedInput || !seedInput.value || seedInput.value.trim() === '') {
                this.start_game(Math.random() * 1000000); // Generate a random seed if input is not found
                this.abortController.abort();
                return;
            }
            const seed = parseInt(seedInput.value, 10);
            this.start_game(seed);
            this.abortController.abort();
            mainMenuController.abort();
        }, { signal: this.abortController.signal });
        document.getElementById('close-world-creation')?.addEventListener('click', () => {
            this.closeWorldCreationMenu();
        }, { signal: this.abortController.signal });
    }

    closeWorldCreationMenu(): void {
        const worldCreationMenu = document.getElementById('world-creation-popup');
        if (worldCreationMenu) {
            worldCreationMenu.classList.add('hidden');
            this.abortController.abort();
            this.abortController = new AbortController();
        }
    }

    start_game(seed: number): void {
        this.game = new Game(false, seed);
        this.closeWorldCreationMenu();
    }
}