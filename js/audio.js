// js/audio.js
// Version: v1.1.1 - Audio System (BGM and SFX Management)

// Assumes constants, gameState, uiElements defined globally
console.log("Loading Audio Module...");

let currentBgm = null;
let currentBgmId = null;

const audioElements = {};

function initializeAudio() {
    console.log("Initializing Audio System...");
    const audioTags = document.querySelectorAll('audio');
    audioTags.forEach(el => {
        audioElements[el.id] = el;
    });

    const settings = gameState?.settings || {};
    const baseVol = settings.baseVolume ?? 0.5;
    const musicVol = settings.musicVolume ?? baseVol;
    const sfxVol = settings.sfxVolume ?? baseVol;

    setMusicVolume(musicVol);
    setSfxVolume(sfxVol);

    if (settings.musicEnabled) {
        determineAndPlayCurrentMusic();
    }
}

function playSfx(sfxName) {
    if (!gameState?.settings?.sfxEnabled) return;
    const elementId = sfxName.startsWith('sfx-') ? sfxName : `sfx-${sfxName}`;
    const el = audioElements[elementId] || document.getElementById(elementId);
    if (!el) {
        return;
    }

    try {
        el.volume = Math.min(1, Math.max(0, gameState.settings.sfxVolume ?? 0.5));
        el.currentTime = 0;
        const playPromise = el.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                // Audio autoplay might be blocked before first user gesture
            });
        }
    } catch (e) {
        console.warn(`Error playing SFX ${sfxName}:`, e);
    }
}

function playMusic(trackName, loop = true) {
    if (!gameState?.settings?.musicEnabled) return;
    const elementId = trackName.startsWith('bgm-') ? trackName : `bgm-${trackName}`;
    const el = audioElements[elementId] || document.getElementById(elementId);

    if (!el) {
        console.warn(`BGM track not found: ${trackName}`);
        return;
    }

    if (currentBgm === el && !el.paused) {
        return; // Already playing this track
    }

    stopMusic();

    try {
        currentBgm = el;
        currentBgmId = trackName;
        el.loop = loop;
        el.volume = Math.min(1, Math.max(0, gameState.settings.musicVolume ?? 0.5));
        el.currentTime = 0;
        const playPromise = el.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                // Autoplay policy restriction - wait for interaction
            });
        }
    } catch (e) {
        console.warn(`Error playing BGM ${trackName}:`, e);
    }
}

function stopMusic() {
    if (currentBgm) {
        try {
            currentBgm.pause();
            currentBgm.currentTime = 0;
        } catch (e) {}
        currentBgm = null;
        currentBgmId = null;
    }
}

function stopAllAudio() {
    stopMusic();
    Object.values(audioElements).forEach(el => {
        try {
            el.pause();
            el.currentTime = 0;
        } catch (e) {}
    });
}

function determineAndPlayCurrentMusic() {
    if (!gameState?.settings?.musicEnabled) {
        stopMusic();
        return;
    }

    if (gameState.currentGate) {
        if (gameState.currentGate.isRed) {
            playMusic('red-gate');
        } else if (gameState.currentGate.isAwakeningGate) {
            playMusic('awakening-trial');
        } else {
            playMusic('gate');
        }
    } else if (gameState.context?.monarchDomainActive) {
        playMusic('monarch-domain');
    } else if (gameState.settings?.nightMode) {
        playMusic('dream');
    } else {
        playMusic('main');
    }
}

function setMusicEnabled(enabled) {
    if (gameState?.settings) {
        gameState.settings.musicEnabled = !!enabled;
    }
    if (enabled) {
        determineAndPlayCurrentMusic();
    } else {
        stopMusic();
    }
}

function setSfxEnabled(enabled) {
    if (gameState?.settings) {
        gameState.settings.sfxEnabled = !!enabled;
    }
}

function setMusicVolume(volume) {
    const vol = Math.min(1, Math.max(0, volume));
    if (gameState?.settings) {
        gameState.settings.musicVolume = vol;
    }
    if (currentBgm) {
        currentBgm.volume = vol;
    }
}

function setSfxVolume(volume) {
    const vol = Math.min(1, Math.max(0, volume));
    if (gameState?.settings) {
        gameState.settings.sfxVolume = vol;
    }
}

function setVolume(volume) {
    setMusicVolume(volume);
    setSfxVolume(volume);
}

console.log("Audio Module Loaded OK.");