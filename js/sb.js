/* ----------------------- */
/* STREAMER.BOT CONNECTION */
/* ----------------------- */

let speakerBotClient = null;

const streamerBotStatus = {};
const streamerBotServerAddress      = getURLParam("streamerBotServerAddress", "127.0.0.1");
const streamerBotServerPort         = getURLParam("streamerBotServerPort", "8080");
const showSpeakerbot                = getURLParam("showSpeakerbot", true);
const speakerBotServerAddress       = getURLParam("speakerBotServerAddress", "127.0.0.1");
const speakerBotServerPort          = getURLParam("speakerBotServerPort", "7580");
const speakerBotChatRead            = getURLParam("speakerBotChatRead", false);
const speakerBotEventRead           = getURLParam("speakerBotEventRead", false);
const speakerBotVoiceAlias          = getURLParam("speakerBotVoiceAlias", "Maria");
const speakerBotChatTemplate        = getURLParam("speakerBotChatTemplate", "{user} said {message}");

function getSpeakerBotInstance() {
    if (!speakerBotClient && showSpeakerbot) {
        speakerBotClient = new SpeakerBotClient({
            host: speakerBotServerAddress,
            port: speakerBotServerPort,
            voiceAlias: speakerBotVoiceAlias,
            onConnect: () => {
                notifySuccess({
                    title: 'ChatRD 🤝 Speaker.bot',
                    text: ''
                });
            },
        });
    }
    return speakerBotClient;
}

let streamerBotClientActive = null;

function streamerBotConnect() {
    // 🔎 Se já existe um cliente, encerra a tentativa anterior
    if (streamerBotClientActive) {
        try {
            console.debug("[ChatRD][Settings] Closing previous Streamer.bot connection...");
            streamerBotClientActive.disconnect?.(); // usa se existir na lib
            streamerBotClientActive = null;
            streamerBotStatus.connected = false;
        } catch (err) {
            console.error("[ChatRD][Settings] Error closing previous client:", err);
        }
    }

    streamerBotClientActive = new StreamerbotClient({
        host: streamerBotServerAddress,
        port: streamerBotServerPort,
        scheme: 'ws',
        //autoReconnect: false, // evita reconectar sozinho
        onConnect: () => {
            streamerBotStatus.connected = true;
            streamerBotStatus.disconnected = false;
            streamerBotStatus.error = false;

            notifySuccess({
                title: 'ChatRD 🤝 Streamer.bot',
                text: ``
            });
            
        },
        onDisconnect: () => {
            console.debug("[ChatRD][Settings] Streamer.bot disconnected.");

            if (streamerBotStatus.disconnected === true) return;
            notifyError({
                title: 'ChatRD ❌ Streamer.bot',
                text: ``
            });

            streamerBotStatus.connected = false;
            streamerBotStatus.disconnected = true;
            streamerBotStatus.error = true;
        },
        onError: (err) => {
            
            if (streamerBotStatus.error === true) return;

            console.debug("[ChatRD][Settings] Streamer.bot connection error.");

            notifyError({
                title: 'ChatRD ⚠️ Streamer.bot',
                text: `Error connecting to Streamer.bot.`
            });
            
            streamerBotStatus.connected = false;
            streamerBotStatus.disconnected = true;
            streamerBotStatus.error = true;
        }
    });

    return streamerBotClientActive;
}

// mantém o const fixo apontando para a primeira conexão
const streamerBotClient = streamerBotConnect();


async function getStreamerInfo() {
    const requestForStreamer = await streamerBotClient.getBroadcaster();
    return requestForStreamer;
}

function getURLParam(param, defaultValue) {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(param);

    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === null) return defaultValue;

    return value;
}

function registerPlatformHandlersToStreamerBot(handlers, logPrefix = '') {
    for (const [event, handler] of Object.entries(handlers)) {
        streamerBotClient.on(event, (...args) => {
            if (logPrefix) {
                console.debug(`${logPrefix} ${event}`, args[0]);
            }
            handler(...args);
        });
    }
}


const pushNotify = (data) => {

    const SimpleNotify = {
        effect: 'fade',
        speed: 500,
        customClass: 'toasty',
        customIcon: '',
        showIcon: true,
        showCloseButton: true,
        autoclose: true,
        autotimeout: 2500,
        notificationsGap: null,
        notificationsPadding: null,
        type: 'outline',
        position: 'x-center bottom',
        customWrapper: '',
    };
    const mergedData = {
        ...SimpleNotify,
        ...data
    }
    new Notify (mergedData);
    
}

const notifyError = (err) => {
    err.status = 'error';
    pushNotify(err);
}

const notifyInfo = (info) => {
    info.status = 'info';
    pushNotify(info);
}

const notifyWarning = (warn) => {
    warn.status = 'warning';
    pushNotify(warn);
}


const notifySuccess = (success) => {
    success.status = 'success';
    pushNotify(success);
}