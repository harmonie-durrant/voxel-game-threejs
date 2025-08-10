export class SoundController {
    sounds: { [key: string]: HTMLAudioElement } = {};

    globalVolume: number = 1.0;

    constructor() {
        this.loadSounds();
    }

    private loadSounds() {
        const soundFiles = [
            'sounds/main_menu_music.mp3',
            'sounds/ui_button_press.mp3',
            'sounds/game_music.mp3',
            'sounds/crafting.mp3',
            'sounds/smelting.mp3',
            'sounds/block_breaking.mp3',
            'sounds/item_drop.mp3',
            'sounds/player_jump.mp3'
        ];

        soundFiles.forEach((file) => {
            const audio = new Audio(file);
            audio.load();
            this.sounds[file] = audio;
        });
    }

    playSound(sound: string) {
        const audio = this.sounds[sound];
        if (audio) {
            audio.currentTime = 0;
            audio.play();
            console.log(`Playing sound: ${sound}`);
        }
        else {
            console.warn(`Sound not found: ${sound}`);
        }
    }

    stopAllSounds() {
        Object.values(this.sounds).forEach((audio) => {
            audio.pause();
            audio.currentTime = 0;
        });
    }
}