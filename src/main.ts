import { WorldCreation } from "./menu/worldCreation";
import { SoundController } from "./soundController";
import { Toast } from "./toast";

export const soundController = new SoundController();

const mainMenuController = new AbortController();

export var worldcreation: WorldCreation = new WorldCreation();
worldcreation;

export const toast = new Toast();
toast;

document.addEventListener('click', (event) => {
    soundController.playSound('sounds/main_menu_music.mp3');
}, { once: true });

document.getElementById('start_game')?.addEventListener('click', () => {
  worldcreation.openWorldCreationMenu(mainMenuController);
}, { signal: mainMenuController.signal });
document.getElementById('load_game')?.addEventListener('click', () => {
  worldcreation.startGameFromSave(mainMenuController);
}, { signal: mainMenuController.signal });
// Controls popup logic
const controlsPopup = document.getElementById('controls_popup');
document.getElementById('show_controls')?.addEventListener('click', () => {
  soundController.playSound('sounds/ui_button_press.mp3');
  controlsPopup?.classList.remove('hidden');
}, { signal: mainMenuController.signal });
document.getElementById('close_controls')?.addEventListener('click', () => {
  soundController.playSound('sounds/ui_button_press.mp3');
  controlsPopup?.classList.add('hidden');
}, { signal: mainMenuController.signal });