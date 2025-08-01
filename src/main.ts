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
}, { signal: mainMenuSignal });