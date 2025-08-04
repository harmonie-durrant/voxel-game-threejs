import { WorldCreation } from "./menu/worldCreation";
import { Toast } from "./toast";

const mainMenuController = new AbortController();

var worldcreation: WorldCreation = new WorldCreation();
worldcreation;

export const toast = new Toast();
toast;

document.getElementById('start_game')?.addEventListener('click', () => {
  worldcreation.openWorldCreationMenu();
  mainMenuController.abort();
}, { signal: mainMenuController.signal });
document.getElementById('load_game')?.addEventListener('click', () => {
  worldcreation.startGameFromSave();
  mainMenuController.abort();
}, { signal: mainMenuController.signal });
// Controls popup logic
const controlsPopup = document.getElementById('controls_popup');
document.getElementById('show_controls')?.addEventListener('click', () => {
  controlsPopup?.classList.remove('hidden');
}, { signal: mainMenuController.signal });
document.getElementById('close_controls')?.addEventListener('click', () => {
  controlsPopup?.classList.add('hidden');
}, { signal: mainMenuController.signal });