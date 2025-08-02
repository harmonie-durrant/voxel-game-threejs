import { Game } from "../game/game";


export class WorldCreation {
    game: Game | null = null;

    abortController: AbortController = new AbortController();

    constructor() {}

    startGameFromSave(): void {
        this.closeWorldCreationMenu();
        // If save exists 
        if (localStorage.getItem('world_data')) {
            this.game = new Game(true);
            return;
        }
        console.error('No saved game found');
        //TODO: show error toast message
    }

    openWorldCreationMenu(): void {
        const worldCreationPopup = document.getElementById('world-creation-popup');
        if (worldCreationPopup) {
            worldCreationPopup.classList.remove('hidden');
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
            }, { signal: this.abortController.signal });
        }
        document.getElementById('close-world-creation')?.addEventListener('click', () => {
            this.closeWorldCreationMenu();
        }, { signal: this.abortController.signal });
    }

    closeWorldCreationMenu(): void {
        const worldCreationMenu = document.getElementById('world-creation-popup');
        if (worldCreationMenu) {
            worldCreationMenu.classList.add('hidden');
            this.abortController.abort();
        }
    }

    start_game(seed: number): void {
        this.closeWorldCreationMenu();
        this.game = new Game(false, seed);
    }
}