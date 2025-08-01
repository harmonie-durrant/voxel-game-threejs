import { Game } from "./game/game";

const mainMenuController = new AbortController();
const mainMenuSignal = mainMenuController.signal;

var game: Game | null = null;

game;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start_game')?.addEventListener('click', () => {
    mainMenuController.abort();
    game = new Game();
  });
  document.getElementById('load_game')?.addEventListener('click', () => {
    mainMenuController.abort();
    game = new Game(true);
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