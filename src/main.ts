import { WorldCreation } from "./menu/worldCreation";
import { Toast } from "./toast";

const mainMenuController = new AbortController();
const mainMenuSignal = mainMenuController.signal;

var worldcreation: WorldCreation = new WorldCreation();
worldcreation;

export const toast = new Toast();
toast;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start_game')?.addEventListener('click', () => {
    worldcreation.openWorldCreationMenu();
    mainMenuController.abort();
  });
  document.getElementById('load_game')?.addEventListener('click', () => {
    worldcreation.startGameFromSave();
    mainMenuController.abort();
  });
  // Controls popup logic
  const controlsPopup = document.getElementById('controls_popup');
  document.getElementById('show_controls')?.addEventListener('click', () => {
    controlsPopup?.classList.remove('hidden');
  });
  document.getElementById('close_controls')?.addEventListener('click', () => {
    controlsPopup?.classList.add('hidden');
  });
}, { signal: mainMenuSignal });