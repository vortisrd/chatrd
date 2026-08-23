const ALLOWED_SOUNDS = new Set([
    'alert-marimba-bubble',
    'beep-digital-short',
    'bubble-pop',
    'flight-announcement',
    'notification-bell-alert',
    'notification-digital-chime',
    'organic-pop',
    'pop-bottle-opening',
    'positive-notification-digital-beep',
    'retro-game',
    'ui-alert-synth-beep',
    'ui-ding'
]);

const audioCache = new Map();

async function chatrdPlaySound(soundName, volume = 1.0) {
    const SOUND_DIRECTORY = 'sounds/';

    if (typeof soundName !== 'string' || soundName.trim() === '') {
        console.warn('[ChatRD][Play Sound][Blocked] soundName inválido:', typeof soundName);
        return Promise.resolve(false);
    }

    const cleanName = soundName
        .split('/').pop().split('\\').pop()
        .replace(/\.mp3$/i, '');

    if (!ALLOWED_SOUNDS.has(cleanName)) {
        console.warn(`[ChatRD][Play Sound][Blocked] The sound "${cleanName}" is not allowed.`);
        return Promise.resolve(false);
    }

    const soundFile = `${SOUND_DIRECTORY}${cleanName}.mp3`;
    console.debug(`[ChatRD][Play Sound] Attempting to play "${soundFile}"...`);

    if (!audioCache.has(cleanName)) {
        audioCache.set(cleanName, new Audio(soundFile));
    }
    const cached = audioCache.get(cleanName);
    const audio = cached.cloneNode();

    const safeVolume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1.0;
    audio.volume = safeVolume;

    return audio.play()
        .then(() => true)
        .catch(err => {
            console.error(`[ChatRD][Play Sound][Blocked] Failed to play the sound "${cleanName}":`, err);
            return false;
        });
}