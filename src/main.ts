import { WorldCreation } from "./menu/worldCreation";
import { SoundController } from "./soundController";
import { Toast } from "./toast";

export const soundController = new SoundController();

export var worldcreation: WorldCreation = new WorldCreation();
worldcreation;

export const toast = new Toast();
toast;

document.addEventListener(
    "click",
    () => {
        soundController.playSound("sounds/main_menu_music.mp3");
    },
    { once: true },
);

export function openMainMenu() {
    const mainMenuController = new AbortController();
    document.getElementById("main_menu_container")?.classList.remove("hidden");

    document.getElementById("start_game")?.addEventListener(
        "click",
        () => {
            worldcreation.openWorldCreationMenu(mainMenuController);
        },
        { signal: mainMenuController.signal },
    );
    document.getElementById("load_game")?.addEventListener(
        "click",
        () => {
            worldcreation.startGameFromSave(mainMenuController);
        },
        { signal: mainMenuController.signal },
    );

    // Controls popup logic
    const controlsPopup = document.getElementById("controls_popup");
    document.getElementById("show_controls")?.addEventListener(
        "click",
        () => {
            soundController.playSound("sounds/ui_button_press.mp3");
            controlsPopup?.classList.replace("hidden", "flex");
        },
        { signal: mainMenuController.signal },
    );
    document.getElementById("close_controls")?.addEventListener(
        "click",
        () => {
            soundController.playSound("sounds/ui_button_press.mp3");
            controlsPopup?.classList.replace("flex", "hidden");
        },
        { signal: mainMenuController.signal },
    );
}

openMainMenu();
