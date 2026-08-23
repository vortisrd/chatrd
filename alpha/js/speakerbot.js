/**
 * =============================================================================
 * SpeakerBotClient
 * =============================================================================
 * Author: Rodrigo Emanuel (VortisRD)
 * Created: 2025-08-10
 * Description:
 *    WebSocket client for connecting to Speaker.bot, sending TTS (text-to-speech)
 *    messages, and handling reconnection logic automatically.
 *
 * Usage Example:
 * -----------------------------------------------------------------------------
 * const speakerBot = new SpeakerBotClient({
 *     host: '127.0.0.1',
 *     port: 7580,
 *     voiceAlias: 'Joanna',
 * 
 *     onConnect: () => console.log('Connected!'),
 *     onDisconnect: () => console.log('Disconnected!'),
 *     onError: (err) => console.error(err),
 *     onMessage: (msg) => console.log('SpeakerBot says:', msg)
 * });
 * 
 * speakerBot.speak("Hello World!");
 * -----------------------------------------------------------------------------
 *
 * Parameters:
 *    host           - IP or hostname of the Speaker.bot server.
 *    port           - Port number for the WebSocket connection.
 *    reconnectDelay - Time in ms before attempting reconnection.
 *    voiceAlias     - Preferred TTS voice name (string or null).
 *    onConnect      - Callback fired when connection is established.
 *    onDisconnect   - Callback fired when connection is closed.
 *    onError        - Callback fired on connection error.
 *    onMessage      - Callback fired when receiving a message from Speaker.bot.
 *
 * Dependencies:
 *    None (uses native WebSocket API)
 *
 * Notes:
 *    - Messages sent while disconnected are queued and sent after reconnection.
 *    - Bad word filter is enabled by default in speak() payload.
 *
 * License:
 *    MIT License
 * =============================================================================
 */


class SpeakerBotClient {
    constructor({
        host = '127.0.0.1',
        port = 7580,
        reconnectDelay = 10000,
        voiceAlias = null,
        onConnect = () => {},
        onDisconnect = () => {},
        onError = () => {},
        onMessage = () => {}
    } = {}) {
        this.host = host;
        this.port = port;
        this.reconnectDelay = reconnectDelay;
        this.voiceAlias = voiceAlias;
        this.onConnect = onConnect;
        this.onDisconnect = onDisconnect;
        this.onError = onError;
        this.onMessage = onMessage;

        this.ws = null;
        this.queue = [];
        this._manualClose = false; // inicia como false

        this.connect();
    }

    get url() {
        return `ws://${this.host}:${this.port}/`;
    }

    get readyState() {
        return this.ws ? this.ws.readyState : WebSocket.CLOSED;
    }

    connect() {
        this._manualClose = false; // reset da flag
        console.log('[SpeakerBot] Connecting to Speaker.bot...');
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('[SpeakerBot] Connected to Speaker.bot!');
            this.onConnect();
            while (this.queue.length > 0) {
                this.ws.send(this.queue.shift());
            }
        };

        this.ws.onmessage = (event) => {
            this.onMessage(event.data);
        };

        this.ws.onerror = (error) => {
            //console.warn(`[SpeakerBot] Connection error. Reconnecting in ${Math.floor(this.reconnectDelay / 1000)}s...`, error);
            //this.onError(error);
        };

        this.ws.onclose = () => {
            this.onDisconnect();
            if (!this._manualClose) {
                setTimeout(() => this.connect(), this.reconnectDelay);
            }
        };
    }

    speak(message) {
        const payload = {
            id: `speak-${Date.now()}`,
            request: 'Speak',
            message: message,
            voice: this.voiceAlias,
            badWordFilter: true
        };

        const json = JSON.stringify(payload);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(json);
        } else {
            console.warn(`[SpeakerBot] Not connected yet. Queuing message...`);
            this.queue.push(json);
        }
    }

    disconnect() {
        this._manualClose = true; // flag para evitar reconexão automática
        if (this.ws) {
            this.ws.close();
        }
    }
}
