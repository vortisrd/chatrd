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

    const fakeStreamTitles = [
        'Ranked Grind Till I Rage Quit 💀',
        'Chill Vibes And Clutch Plays',
        'Trying The New Patch, Send Help',
        'Road To Top 500 !discord',
        'Chat Decides What I Play Next',
        '!drop Hype - Giveaway Tonight',
        'First Playthrough, No Spoilers Pls',
        'Community Night W/ Viewers',
        'Speedrun Attempt #47',
        'New PB Or Bust',
        'Late Night Stream, Who\'s Still Up?',
        'Testing Builds Before Tourney',
        'Variety Sunday - Chat Picks The Game',
        '100% Completion Run',
        'Back After A Break, Let\'s Catch Up',
        'Sub Goal Hype Train 🔥',
        'Chaotic Co-op With The Squad',
        'Story Mode Marathon',
        'Trying To Hit Diamond Before Reset',
        'New Setup, New Stream, Let\'s Go',
        'Q&A + Gameplay Combo Stream',
        'Road To Affiliate Grind',
        'Random Lobby Shenanigans',
        'Season Finale Hype',
        'Anniversary Stream 🎉'
    ];

    const fakeColors = ['#ff4d4d', '#4dff88', '#4dc3ff', '#e14dff', '#ffd24d', '#53fc18'];


    function getRandomBadges(badgesArray, count = 3) {
        const shuffled = [...badgesArray];

        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled.slice(0, count);
    }

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

        const badges = [
            {
                "name": "moderator",
                "version": "1",
                "imageUrl": "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3",
                "info": ""
            },
            {
                "name": "leadmoderator",
                "version": "1",
                "imageUrl": "https://static-cdn.jtvnw.net/badges/v1/0822047b-65e0-46f2-94a9-d1091d685d33/3",
                "info": ""
            },
            {
                "name": "prime",
                "version": "1",
                "imageUrl": "https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/3",
                "info": ""
            },
            {
                "name": "hornet",
                "version": "1",
                "imageUrl": "https://static-cdn.jtvnw.net/badges/v1/4dc7b047-8c59-4522-97f2-24fb63147f56/3",
                "info": ""
            },
            {
                "name": "no-audio",
                "version": "1",
                "imageUrl": "https://static-cdn.jtvnw.net/badges/v1/aef2cd08-f29b-45a1-8c12-d44d7fd5e6f0/3",
                "info": ""
            },
            {
                "name": "hornet",
                "version": "1",
                "imageUrl": "https://static-cdn.jtvnw.net/badges/v1/4dc7b047-8c59-4522-97f2-24fb63147f56/3",
                "info": ""
            },
            {
                "name": "gamer-duo",
                "version": "1",
                "imageUrl": "https://static-cdn.jtvnw.net/badges/v1/be750d4d-a3b9-4116-ae75-6ee4f3294a19/3",
                "info": ""
            },
            {
                "name": "umbrella-corporation",
                "version": "1",
                "imageUrl": "https://static-cdn.jtvnw.net/badges/v1/995ff00f-c16c-4782-86ba-f2d7668dc6a2/3",
                "info": ""
            },
            {
                "name": "ffxiv-fanfest",
                "version": "1",
                "imageUrl": "https://static-cdn.jtvnw.net/badges/v1/82ff2bf7-45cf-4cfa-8eb0-253dc879c2a9/3",
                "info": ""
            },
            {
                "name": "pokemon-ditto",
                "version": "1",
                "imageUrl": "https://static-cdn.jtvnw.net/badges/v1/b577304e-7dc9-49f2-bee1-68caf56a91e6/3",
                "info": ""
            },
            {
                "name": "share-the-love",
                "version": "1",
                "imageUrl": "https://static-cdn.jtvnw.net/badges/v1/2de71f4f-b152-4308-a426-127a4cf8003a/3",
                "info": ""
            },
            {
                "name": "went-outside",
                "version": "1",
                "imageUrl": "https://static-cdn.jtvnw.net/badges/v1/544b6594-e11e-4230-8d42-d81c84002524/3",
                "info": ""
            }
        ];
        

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
                badges: getRandomBadges(badges),
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
                isModerator: Math.random() < 0.2,
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
        const badges = [
            {
                "type": "founder"
            },
            {
                "type": "og"
            },
            {
                "type": "vip"
            },
            {
                "type": "subscriber"
            },
            {
                "type": "moderator"
            },
            {
                "type": "verified"
            }
        ]
        kickChatMessage({
            id: randomId(),
            type: 'message',
            content: randomFrom(fakeMessages),
            sender: {
                id: randomId(),
                slug: name,
                username: name,
                identity: {
                    color: randomFrom(fakeColors),
                    badges: getRandomBadges(badges), 
                    badges_v2: []
                }
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

    generators['kick:kicksgifted'] = () => {
        if (typeof kickKicksGiftedMessage !== 'function') return;
        const name = randomFrom(fakeNames);
        const gift = randomFrom([
            { gift_id: 'hell-yeah', name: 'Hell Yeah', amount: 1,  },
            { gift_id: 'hype', name: 'Hype', amount: 10 },
            { gift_id: 'skull-emoji', name: 'Skull Emoji', amount: 50 },
            { gift_id: 'full-send', name: 'Full Send It', amount: 100},
            { gift_id: 'rage-quit', name: 'Rage Quit', amount: 500 },
            { gift_id: 'flex', name: 'Flex', amount: 10000 },
            { gift_id: 'boom', name: 'BOOOOOM', amount: 50000 }
        ]);
        kickKicksGiftedMessage({
            sender: { username: name },
            gift,
            message: Math.random() < 0.5 ? randomFrom(fakeMessages) : ''
        });
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
            isModerator: Math.random() < 0.2,
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
            statmessageus: 'bought an item from the store',
            variants: [{ name: 'ChatRD Hoodie', image: '' }]
        });
    };

    function getPlatformFlags() {
        return {
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
    }

    // toggle individual de cada tipo de evento, dentro da plataforma já habilitada.
    // se uma chave não estiver mapeada aqui, ela só depende do toggle da plataforma.
    function getEventFlags() {
        return {
            'twitch:chat': typeof showTwitchMessages !== 'undefined' && showTwitchMessages,
            'twitch:follow': typeof showTwitchFollows !== 'undefined' && showTwitchFollows,
            'twitch:sub': typeof showTwitchSubs !== 'undefined' && showTwitchSubs,
            'twitch:cheer': typeof showTwitchBits !== 'undefined' && showTwitchBits,
            'twitch:raid': typeof showTwitchRaids !== 'undefined' && showTwitchRaids,

            'youtube:chat': typeof showYouTubeMessages !== 'undefined' && showYouTubeMessages,
            'youtube:superchat': typeof showYouTubeSuperChats !== 'undefined' && showYouTubeSuperChats,
            'youtube:sponsor': typeof showYouTubeMemberships !== 'undefined' && showYouTubeMemberships,

            'kick:chat': typeof showKickMessages !== 'undefined' && showKickMessages,
            'kick:follow': typeof showKickFollows !== 'undefined' && showKickFollows,
            'kick:sub': typeof showKickSubs !== 'undefined' && showKickSubs,
            'kick:kicksgifted': typeof showKickKicks !== 'undefined' && showKickKicks,

            'tiktok:chat': typeof showTikTokMessages !== 'undefined' && showTikTokMessages,
            'tiktok:follow': typeof showTikTokFollows !== 'undefined' && showTikTokFollows,
            'tiktok:gift': typeof showTikTokGifts !== 'undefined' && showTikTokGifts,

            'streamelements:tip': typeof showStreamElementsTips !== 'undefined' && showStreamElementsTips,
            'streamlabs:donation': typeof showStreamlabsDonations !== 'undefined' && showStreamlabsDonations,
            'patreon:pledge': typeof showPatreonMemberships !== 'undefined' && showPatreonMemberships,
            'tipeeestream:donation': typeof showTipeeeDonations !== 'undefined' && showTipeeeDonations,
            'kofi:donation': typeof showKofiDonations !== 'undefined' && showKofiDonations,
            'kofi:sub': typeof showKofiSubscriptions !== 'undefined' && showKofiSubscriptions,
            'fourthwall:donation': typeof showFourthwallDonations !== 'undefined' && showFourthwallDonations,
            'fourthwall:order': typeof showFourthwallOrders !== 'undefined' && showFourthwallOrders
        };
    }

    function activeGeneratorKeys() {
        const platformFlags = getPlatformFlags();
        const eventFlags = getEventFlags();

        return Object.keys(generators).filter((key) => {
            const platform = key.split(':')[0];
            const eventFlag = key in eventFlags ? eventFlags[key] : true;
            return platformFlags[platform] && eventFlag;
        });
    }

    function usableGeneratorKeys() {
        const active = activeGeneratorKeys();

        const weighted = active.flatMap((key) => key.endsWith(':chat') ? [key, key] : [key]);

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

        const platformFlags = getPlatformFlags();

        console.debug(`[ChatRD][TestMode] Platform flags:`, platformFlags);

        const youtubeStreamID = createRandomString(15);

        if (platformFlags.twitch == true) {
            twitchUpdateStatistics({
                viewerCount: randomIntBetween(1, 100)
            });
        }

        if (platformFlags.youtube == true) {
            youTubeUpdateStatistics({
                id: youtubeStreamID,
                concurrentViewers: randomIntBetween(1, 100),
                likeCount: randomIntBetween(1, 100),
                broadcast: {
                    status: 'live',
                    title: `🔴 ${randomFrom(fakeStreamTitles)}`,
                    tags: []
                }
            });
        }

        if (platformFlags.kick == true) {
            kickUpdateStatistics({
                viewerCount: randomIntBetween(1, 100)
            });
        }

        if (platformFlags.tiktok == true) {
            tiktokUpdateStatistics({
                viewerCount: randomIntBetween(1, 100)
            }, 'viewers');

            tiktokUpdateStatistics({
                totalLikeCount: randomIntBetween(100, 10000)
            }, 'likes');
        }
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