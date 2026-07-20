
const testModeAutoStart     = getURLParam("testMode", false);
const testModeMinInterval   = parseInt(getURLParam("testModeMinInterval", 1500), 10);
const testModeMaxInterval   = parseInt(getURLParam("testModeMaxInterval", 2500), 10);

const TestMode = (() => {

    let running = false;
    let timeoutId = null;

    // ---------------------------
    // HELPERS
    // ---------------------------

    const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randomInt  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    const randomId   = () => (typeof createRandomString === 'function')
        ? createRandomString(24)
        : Math.random().toString(36).slice(2);

    const fakeNames = [
        'Nutty', 'CouRageJD', 'VortisRD', 'Gaules', 'MrHappy1227', 'TimTheTatman', 'tawmae', 'TheBurntPeanut', 'Shroud', 'summit1g', 'fireb0rn', 'SypherPK', 'rexbordz', 'Bushy', 'Silvarian', 'CohhCarnage', 'JesseCox', 'Snaux12', 'Mr_Sharkey_', 'Cloakzy', 'Flashforce', 'wudijo'
    ];

    const fakeMessages = [
        'lol what a play that was 😂',
        'good evening, chat!',
        'this game is insane today',
        'did anyone else see that?!',
        'first time here, loving the stream!',
        'GG WP 🏆',
        'let\'s gooo 🔥',
        'that bug is brutal lol',
        'when\'s the next stream?',
        'this map is my favorite',
        'shoutout to me please!',
        'get him! get him!',
        'this edit is fire',
        'no way that just happened',
        'chat is going crazy right now',
        'been watching for 3 hours straight',
        'this soundtrack slaps',
        'can we get a hype train going?',
        'you\'re actually so good at this',
        'this is the best stream today',
        'W chat W chat',
        'is this a new PB?',
        'clip that immediately',
        'the editing on this is insane',
        'lurking but loving it',
        'run it back!',
        'that was way too close',
        'sending good vibes your way',
        'been a fan since day one',
        'this chat is unhinged today lmao',
        'okay that was actually clean',
        'been waiting all week for this stream',
        'poggers',
        'can we talk about that ending though',
        'absolutely cracked gameplay',
        'this stream never disappoints',
        'someone give this chat a medal',
        'the vibes are immaculate tonight',
        'new follower, hi everyone!'
    ];

    const fakeColors = ['#ff4d4d', '#4dff88', '#4dc3ff', '#e14dff', '#ffd24d', '#53fc18'];


    function ensureStreamerContext() {
        if (typeof twitchStreamer !== 'undefined' && !twitchStreamer.broadcastUser) {
            twitchStreamer.broadcastUser = 'meucanal';
        }
        if (typeof youtubeStreamer !== 'undefined' && !youtubeStreamer.broadcastUserName) {
            youtubeStreamer.broadcastUserName = 'MeuCanal';
        }
        if (typeof kickStreamer !== 'undefined' && !kickStreamer.broadcasterUserName) {
            kickStreamer.broadcasterUserName = 'meucanal';
        }
    }

    const generators = {};

    // ---------- TWITCH ----------

    generators['twitch:chat'] = () => {
        if (typeof twitchChatMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        const text = randomFrom(fakeMessages);
        twitchChatMessage({
            messageId: randomId(),
            text,
            parts: [{ type: 'text', text }],
            isReply: false,
            isInSharedChat: false,
            meta: { isMe: false, firstMessage: Math.random() < 0.1, isHighlighted: Math.random() < 0.05 },
            user: {
                login: name,
                name,
                id: randomId(),
                color: randomFrom(fakeColors),
                badges: [],
                subscribed: Math.random() < 0.3,
                subscriptionTier: 1000,
                role: 0
            }
        });
    };

    generators['twitch:follow'] = () => {
        if (typeof twitchFollowMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        twitchFollowMessage({ user_login: name, user_name: name });
    };

    generators['twitch:sub'] = () => {
        if (typeof twitchSubMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        twitchSubMessage({
            user: { login: name, name },
            duration_months: randomFrom([1, 1, 1, 3, 6, 12]),
            is_prime: Math.random() < 0.2,
            sub_tier: randomFrom([1000, 2000, 3000])
        });
    };

    generators['twitch:cheer'] = () => {
        if (typeof twitchBitsMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        twitchBitsMessage({
            messageId: randomId(),
            user: { login: name, name },
            bits: randomFrom([50, 100, 250, 500, 1000, 5000]),
            parts: [{ type: 'text', text: 'Some bits for you 🎉' }]
        });
    };

    generators['twitch:raid'] = () => {
        if (typeof twitchRaidMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        twitchRaidMessage({ from_broadcaster_user_name: name, viewers: randomInt(2, 300) });
    };

    // ---------- YOUTUBE ----------

    generators['youtube:chat'] = () => {
        if (typeof youTubeChatMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        youTubeChatMessage({
            eventId: randomId(),
            message: randomFrom(fakeMessages),
            broadcast: { id: randomId(), tags: [] }, // sem channelId -> evita fetch real de emotes
            user: {
                id: randomId(),
                name,
                url: `https://youtube.com/@${name}`,
                profileImageUrl: 'images/youtube-default-user-pfp.jpg',
                isSponsor: Math.random() < 0.2,
                isModerator: false,
                isVerified: Math.random() < 0.1,
                isOwner: false
            }
        });
    };

    generators['youtube:superchat'] = () => {
        if (typeof youTubeSuperChatMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        youTubeSuperChatMessage({
            eventId: randomId(),
            amount: randomFrom(['R$ 5,00', 'R$ 10,00', 'R$ 25,00', '$5.00', '$20.00']),
            message: randomFrom(fakeMessages),
            broadcast: { tags: [] },
            user: { id: randomId(), name, url: `https://youtube.com/@${name}` }
        });
    };

    generators['youtube:sponsor'] = () => {
        if (typeof youTubeNewSponsorMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        youTubeNewSponsorMessage({
            eventId: randomId(),
            broadcast: { tags: [] },
            user: { id: randomId(), name, url: `https://youtube.com/@${name}` }
        });
    };

    // ---------- KICK ----------

    generators['kick:chat'] = () => {
        if (typeof kickChatMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        kickChatMessage({
            id: randomId(),
            type: 'message',
            content: randomFrom(fakeMessages),
            sender: {
                id: randomId(),
                slug: name,
                username: name,
                identity: { color: '#53fc18', badges: [], badges_v2: [] }
            }
        });
    };

    generators['kick:follow'] = () => {
        if (typeof kickFollowMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        kickFollowMessage({ user: { login: name, name } });
    };

    generators['kick:sub'] = () => {
        if (typeof kickSubMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        kickSubMessage({ username: name, months: randomFrom([1, 1, 3, 6, 12]) });
    };

    // ---------- TIKTOK ----------

    generators['tiktok:chat'] = () => {
        if (typeof tiktokChatMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        tiktokChatMessage({
            msgId: randomId(),
            userId: randomId(),
            uniqueId: name,
            nickname: name,
            comment: randomFrom(fakeMessages),
            isModerator: false,
            isSubscriber: Math.random() < 0.2,
            profilePictureUrl : 'images/tiktok-default-user-pfp.jpeg'
        });
    };

    generators['tiktok:follow'] = () => {
        if (typeof tiktokFollowMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        tiktokFollowMessage({ msgId: randomId(), userId: randomId(), nickname: name });
    };

    generators['tiktok:gift'] = () => {
        if (typeof tiktokGiftMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        const gift = randomFrom([
            { name: 'Rose', coins: 1, giftPictureUrl: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp' },
            { name: 'Super GG', coins: 100, giftPictureUrl:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/cbd7588c53ec3df1af0ed6d041566362.png~tplv-obj.webp' },
            { name: 'Galaxy', coins: 1000, giftPictureUrl: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/79a02148079526539f7599150da9fd28.png~tplv-obj.webp' },
            { name: 'Phoenix', coins: 25999, giftPictureUrl: 'https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/2c5980ea26241ebeeab76de701d47968.png~tplv-obj.webp' }
        ]);
        tiktokGiftMessage({
            msgId: randomId(),
            userId: randomId(),
            nickname: name,
            giftType: 0,
            repeatEnd: true,
            repeatCount: randomInt(1, 5),
            diamondCount: gift.coins,
            giftName: gift.name,
            giftPictureUrl: gift.giftPictureUrl
        });
    };

    // ---------- STREAMELEMENTS ----------

    generators['streamelements:tip'] = () => {
        if (typeof streamElementsEventMessage !== 'function') return;
        streamElementsEventMessage({
            username: randomFrom(fakeNames),
            amount: randomFrom([5, 10, 15, 25, 50]),
            currency: 'BRL',
            message: randomFrom(fakeMessages)
        });
    };

    // ---------- STREAMLABS ----------

    generators['streamlabs:donation'] = () => {
        if (typeof streamLabsEventMessage !== 'function') return;
        streamLabsEventMessage({
            from: randomFrom(fakeNames),
            amount: randomFrom([5, 10, 20, 50, 100]),
            currency: 'BRL',
            message: randomFrom(fakeMessages)
        });
    };

    // ---------- PATREON ----------

    generators['patreon:pledge'] = () => {
        if (typeof patreonMemberships !== 'function') return;
        patreonMemberships({
            attributes: {
                full_name: randomFrom(fakeNames),
                will_pay_amount_cents: randomFrom([500, 1000, 2500, 5000])
            }
        });
    };

    // ---------- TIPEEESTREAM ----------

    generators['tipeeestream:donation'] = () => {
        if (typeof tipeeeStreamDonation !== 'function') return;
        tipeeeStreamDonation({
            username: randomFrom(fakeNames),
            amount: randomFrom([5, 10, 20, 50]),
            currency: 'BRL',
            message: randomFrom(fakeMessages)
        });
    };

    // ---------- KO-FI ----------

    generators['kofi:donation'] = () => {
        if (typeof kofiDonationMessage !== 'function') return;
        kofiDonationMessage({
            from: randomFrom(fakeNames),
            amount: randomFrom([3, 5, 10, 20]),
            currency: 'BRL',
            message: randomFrom(fakeMessages)
        });
    };

    generators['kofi:sub'] = () => {
        if (typeof kofiSubMessage !== 'function') return;
        kofiSubMessage({
            from: randomFrom(fakeNames),
            amount: randomFrom([5, 10]),
            currency: 'BRL',
            message: ''
        });
    };

    // ---------- FOURTHWALL ----------

    generators['fourthwall:donation'] = () => {
        if (typeof fourthwallDonationMessage !== 'function') return;
        fourthwallDonationMessage({
            username: randomFrom(fakeNames),
            amount: randomFrom([5, 10, 25]),
            currency: 'USD',
            message: randomFrom(fakeMessages)
        });
    };

    generators['fourthwall:order'] = () => {
        if (typeof fourthwallOrderMessage !== 'function') return;
        fourthwallOrderMessage({
            username: randomFrom(fakeNames),
            total: randomFrom([20, 35, 50]),
            currency: 'USD',
            statmessageus: 'comprou um item da loja',
            variants: [{ name: 'Camiseta ChatRD', image: '' }]
        });
    };

    function activeGeneratorKeys() {
        const platformFlags = {
            twitch: typeof showTwitch !== 'undefined' && showTwitch,
            youtube: typeof showYoutube !== 'undefined' && showYoutube,
            kick: typeof showKick !== 'undefined' && showKick,
            tiktok: typeof showTiktok !== 'undefined' && showTiktok,
            streamelements: typeof showStreamelements !== 'undefined' && showStreamelements,
            streamlabs: typeof showStreamlabs !== 'undefined' && showStreamlabs,
            patreon: typeof showPatreon !== 'undefined' && showPatreon,
            tipeeestream: typeof showTipeee !== 'undefined' && showTipeee,
            kofi: typeof showKofi !== 'undefined' && showKofi,
            fourthwall: typeof showFourthwall !== 'undefined' && showFourthwall
        };

        return Object.keys(generators).filter((key) => platformFlags[key.split(':')[0]]);
    }

    function usableGeneratorKeys() {
        const active = activeGeneratorKeys();
        const keys = active.length > 0 ? active : Object.keys(generators);

        const weighted = keys.flatMap((key) => key.endsWith(':chat') ? [key, key] : [key]);

        return weighted;
    }

    function fire(key) {
        ensureStreamerContext();
        const generator = generators[key];
        if (!generator) {
            console.warn(`[ChatRD][TestMode] Event "${key}" doesn't exist.`);
            return;
        }
        try {
            generator();
            console.debug(`[ChatRD][TestMode] Event fired: ${key}`);
        } catch (err) {
            console.error(`[ChatRD][TestMode] Error when generating event "${key}":`, err);
        }
    }

    function fireRandom() {
        const keys = usableGeneratorKeys();
        if (keys.length === 0) return;
        fire(randomFrom(keys));
    }

    function scheduleNext() {
        const delay = randomInt(testModeMinInterval, testModeMaxInterval);
        timeoutId = setTimeout(() => {
            fireRandom();
            if (running) scheduleNext();
        }, delay);
    }

    function start() {
        if (running) return;
        running = true;
        fireRandom();
        scheduleNext();
        document.dispatchEvent(new CustomEvent('chatrd:testmode:start'));
        console.info('[ChatRD][TestMode] Demo mode started.');
    }

    function stop() {
        running = false;
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = null;
        document.dispatchEvent(new CustomEvent('chatrd:testmode:stop'));
        console.info('[ChatRD][TestMode] Demo mode stopped.');
    }

    function toggle() {
        running ? stop() : start();
    }

    return {
        start,
        stop,
        toggle,
        fire,
        fireRandom,
        isRunning: () => running,
        listEvents: () => Object.keys(generators)
    };

})();

// Atalhos globais (úteis via console do navegador ou por outros scripts)
window.TestMode = TestMode;
window.startTestMode = TestMode.start;
window.stopTestMode = TestMode.stop;
window.fireTestEvent = TestMode.fire;
window.fireRandomTestEvent = TestMode.fireRandom;

if (testModeAutoStart) {
    document.addEventListener('DOMContentLoaded', () => {
        const waitForConnection = setInterval(() => {
            if (streamerBotStatus.connected === true) {
                clearInterval(waitForConnection);
                TestMode.start();
            }
        }, 1000);
    });
}
