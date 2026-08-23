/* ---------------------- */
/* KICK MODULE VARIABLES */
/* ---------------------- */

let isPusherConnected = false;

const showKick                      = getURLParam("showKick", false);

const showKickMessages              = getURLParam("showKickMessages", true);
const showKickFollows               = getURLParam("showKickFollows", true);
const showKickKicks                 = getURLParam("showKickKicks", true);
const showKickSubs                  = getURLParam("showKickSubs", true);
const showKickGiftedSubs            = getURLParam("showKickGiftedSubs", true);
const showKickMassGiftedSubs        = getURLParam("showKickMassGiftedSubs", true);
const showKickGiftedSubsUserTrain   = getURLParam("showKickGiftedSubsUserTrain", true);
const showKickRewardRedemptions     = getURLParam("showKickRewardRedemptions", true);
const showKickRaids                 = getURLParam("showKickRaids", true);
const showKickViewers               = getURLParam("showKickViewers", true);

const kickAvatars = new Map();
const kick7TVEmojis = new Map();
const kickSubBadges = [];

const kicksGiftsClasses = [
    { min: 1,  max: 9, class: 'normal-gift' },
    { min: 10,  max: 49, class: 'bigger-than-10' },
    { min: 50,  max: 99, class: 'bigger-than-50' },
    { min: 100,  max: 499, class: 'bigger-than-100' },
    { min: 500,  max: 999, class: 'bigger-than-500' },
    { min: 1000,  max: 4999, class: 'bigger-than-1000' },
    { min: 5000,  max: 9999, class: 'bigger-than-5000' },
    { min: 10000,  max: 49999, class: 'bigger-than-10000' },
    { min: 50000,  max: 99999, class: 'bigger-than-50000' },
    { min: 100000,  max: 99999999999, class: 'bigger-than-100000' },
];


// KICK EVENTS HANDLERS

const kickMessageHandlers = {

    'Kick.Follow': (response) => {
        kickFollowMessage(response.data);
    },

    'Kick.ChatMessage': (response) => {
        if (isPusherConnected) return;
        kickChatMessageFromStreamerBot(response.data);
    },

    'Kick.RewardRedemption': (response) => {
        if (isPusherConnected) return;
        kickRewardRedemptionFromStreamerBot(response.data);
    },

    'Kick.Subscription': (response) => {
        if (isPusherConnected) return;
        kickSubMessageFromStreamerBot(response.data);
    },

    'Kick.Resubscription': (response) => {
        if (isPusherConnected) return;
        kickSubMessageFromStreamerBot(response.data);
    },

    'Kick.GiftSubscription': (response) => {
        if (isPusherConnected) return;
        kickGiftMessageFromStreamerBot(response.data);
    },

    'Kick.MassGiftSubscription': (response) => {
        if (isPusherConnected) return;
        kickMassGiftMessageFromStreamerBot(response.data);
    },

    'Kick.sGifted': (response) => {
        if (isPusherConnected) return;
    },

    'Kick.UserTimedOut': (response) => {
        if (isPusherConnected) return;
        kickUserBanned({
            user: {
                slug : data.user.name.toLowerCase()
            }
        });
    },

    'Kick.UserBanned': (response) => {
        if (isPusherConnected) return;
        kickUserBanned({
            user: {
                slug : data.user.name.toLowerCase()
            }
        });
    },

    'Kick.ViewerCountUpdate': (response) => {
        kickUpdateStatistics(response.data);
    },

};



document.addEventListener('DOMContentLoaded', async () => {
    if (showKick) {

        if ((showKickViewers == true) && (showPlatformStatistics == true)) {
            const kickStatistics = `
                <div class="platform" id="kick" style="display: none;">
                    <img src="js/modules/kick/images/logo-kick.svg" alt="">
                    <span class="viewers"><i class="fa-solid fa-user"></i> <span>0</span></span>
                </div>
            `;
            document.querySelector('#statistics').insertAdjacentHTML('beforeend', kickStatistics);
            document.querySelector('#statistics #kick').style.display = '';        
        }

        waitForStreamerBot('Kick').then(() => {
            registerPlatformHandlersToStreamerBot(kickMessageHandlers, '[ChatRD][Streamer.bot][Kick]');
            kickConnectionNew();
        });
        
    }
    
});






// -----------------------
// KICK CONNECT HANDLER


async function kickConnectionNew() {
    if (!showKick) return;

    const kickReconnectDelay = 5000;
    let kickHasNotifiedDisconnect = false;
    let kickReconnectScheduled = false;
    const kickPusherWsUrl = 'wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.5.0&flash=false';

    const kickStreamerLogin = await getStreamerInfo();
    const userLogin = kickStreamerLogin.platforms.kick.broadcasterLogin;

    console.debug(`[ChatRD][Pusher][Kick] Connecting to Kick with username "${userLogin}" ...`);

    const userInfo = await kickGetUserInfo(userLogin);

    if (userInfo == null) {
        notifyError({
            title: 'ChatRD ❌ Kick',
            text: ``
        });
        setTimeout(kickConnectionNew, kickReconnectDelay);
        return;
    }

    if (!userInfo.chatroom || !userInfo.chatroom.id) {
        notifyError({
            title: 'ChatRD ❌ Kick',
            text: ``
        });
        console.error(`[ChatRD][Pusher][Kick] Chatroom for "${userLogin}" not found!`);
        setTimeout(kickConnectionNew, kickReconnectDelay);
        return;
    }

    const kickUserId = userInfo.user_id;
    const kickChatRoomId = userInfo.chatroom.id;
    const kickChannelId = userInfo.chatroom.channel_id;

    if (kickSubBadges.length == 0) kickSubBadges.push(...userInfo.subscriber_badges);

    const websocket = new WebSocket(kickPusherWsUrl);

    const channels = [
        `chatroom_${kickChatRoomId}`,
        `chatrooms.${kickChatRoomId}`,
        `chatrooms.${kickChatRoomId}.v2`,
        `predictions-channel-${kickChatRoomId}`,
        `channel_${kickChannelId}`
    ];

    function scheduleManualReconnect(reason) {

        if (kickReconnectScheduled) return;
        kickReconnectScheduled = true;

        notifyError({
            title: 'ChatRD 🚨 Kick',
            text: `Manual Reconnection Fired! Reason: ${reason}.`
        });

        console.error(`[ChatRD][Pusher][Kick] Manual Reconnection Fired! Reason: ${reason}.`);

        try {
            websocket.close();
        }
        catch (e) {

            notifyError({
                title: 'ChatRD 🚨 Kick',
                text: `Error while disconnecting. Reason: ${e}.`
            });

            console.warn(`[ChatRD][Pusher][Kick] Error while closing an older WebSocket instance: `, e);
        }
        setTimeout(kickConnectionNew, kickReconnectDelay);
    }

    websocket.onopen = () => {
        console.debug(`[ChatRD][Pusher][Kick] WebSocket opened. Waiting for Pusher handshake...`);
    };

    websocket.onclose = () => {
        isPusherConnected = false;
        if (!kickHasNotifiedDisconnect) {
            kickHasNotifiedDisconnect = true;
            notifyError({
                title: 'ChatRD ⛓️‍💥 Kick',
                text: ``
            });
        }
        console.debug(`[ChatRD][Pusher][Kick] Disconnected from Kick. Trying to reconnect...`);

        // Raw WebSocket doesn't auto-reconnect: we own that responsibility entirely.
        scheduleManualReconnect('closed');
    };

    websocket.onerror = (err) => {
        // Native WebSocket error events carry no useful code/reason —
        // onclose fires right after this and handles the actual reconnection.
        console.error('[ChatRD][Pusher][Kick] WebSocket error:', err);
    };

    websocket.onmessage = (response) => {
        let payload;
        try {
            payload = JSON.parse(response.data);
        }
        catch (e) {
            console.error('[ChatRD][Pusher][Kick] Failed to parse message:', response.data, e);
            return;
        }

        const eventName = payload.event;

        // Pusher frames carry `data` as a JSON-encoded string; unwrap it here.
        let eventData = payload.data;
        if (typeof eventData === 'string') {
            try {
                eventData = JSON.parse(eventData);
            }
            catch (e) {
                // Some payloads aren't JSON (rare) — keep the raw string.
            }
        }

        switch (eventName) {

            case 'pusher:connection_established': {
                console.debug(`[ChatRD][Pusher][Kick] Connected to Kick successfully! Socket ID: ${eventData.socket_id}`);

                kickHasNotifiedDisconnect = false;
                kickReconnectScheduled = false;
                isPusherConnected = true;

                (async () => {
                    const kick7TVEmotes = await getKick7TVEmotes(kickUserId);
                    if (kick7TVEmotes != null) {
                        kick7TVEmotes.forEach(emote => kick7TVEmojis.set(emote.name, emote.url));
                    }
                })();

                notifySuccess({
                    title: 'ChatRD 🤝 Kick'
                });

                channels.forEach(channelName => {
                    websocket.send(JSON.stringify({ event: 'pusher:subscribe', data: { channel: channelName } }));
                });

                break;
            }

            case 'pusher:subscription_succeeded':
                console.debug(`[ChatRD][Pusher][Kick] Subscription succeeded on channel "${payload.channel}"`);
                break;

            case 'pusher:subscription_error':
                console.error(`[ChatRD][Pusher][Kick] Subscription error on channel "${payload.channel}":`, eventData);
                break;

            case 'pusher:error': {
                console.error('[ChatRD][Pusher][Kick] Pusher error:', eventData);

                const unrecoverableCodes = [4004, 4001, 4009];
                if (eventData && unrecoverableCodes.includes(eventData.code)) {
                    isPusherConnected = false;
                    scheduleManualReconnect(`error code ${eventData.code}`);
                }
                break;
            }

            case 'pusher:ping':
                websocket.send(JSON.stringify({ event: 'pusher:pong', data: {} }));
                break;

            default: {
                console.debug(`[ChatRD][Pusher][Kick] Event on "${payload.channel}": ${eventName}`, eventData);

                // Business events come as "App\\Events\\XEvent" or, sometimes, bare "XEvent".
                const shortEventName = eventName.split('\\').pop();

                switch (shortEventName) {
                    case 'ChatMessageEvent':
                        kickChatMessage(eventData);
                        break;
                    case 'SubscriptionEvent':
                        kickSubMessage(eventData);
                        break;
                    case 'GiftedSubscriptionsEvent':
                        kickGiftMessage(eventData);
                        break;
                    case 'RewardRedeemedEvent':
                        kickRewardRedemption(eventData);
                        break;
                    case 'StreamHostEvent':
                        kickRaidMessage(eventData);
                        break;
                    case 'MessageDeletedEvent':
                        setTimeout(() => kickChatMessageDeleted(eventData), 3000);
                        break;
                    case 'UserBannedEvent':
                        setTimeout(() => kickUserBanned(eventData), 3000);
                        break;
                    case 'ChatroomClearEvent':
                        kickChatClearMessages(eventData);
                        break;
                    case 'KicksGifted':
                        kickKicksGiftedMessage(eventData);
                        break;
                }
                break;
            }
        }
    };
}



// ---------------------------
// KICK UTILITY FUNCTIONS

async function kickChatMessage(data) {
    
    if (showKickMessages == false) return;
    if (ignoreUserList.includes(data.sender.username.toLowerCase())) return;
    if (data.content.startsWith("!") && excludeCommands == true)  return;

	const template = chatTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.id;
    const userId = data.sender.id;
    const userSlug = data.sender.slug;

    const {
        'first-message': firstMessage,
        'shared-chat': sharedChat,
        
        header,
        timestamp,
        platform,
        badges,
        avatar,
        pronouns: pronoun,
        user,
        
        reply,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kick', 'msg'];

    const [avatarImage, messageHTML, badgesHTML, badgesHTMLV2, roles] = await Promise.all([
        getKickAvatar(data.sender.slug),
        getKickEmotes(data.content),
        getKickBadges(data.sender.identity.badges),
        getKickBadgesV2(data.sender.identity.badges_v2),
        getKickRoles(data.sender.identity.badges)
    ]);

    header.remove();
    firstMessage.remove();

    if (roles.length == 0) roles.push('user');

    classes.push(...roles);
    
    const kickStreamer = streamerInfo.get.platforms.kick;
    
    if (userSlug.toLowerCase() == kickStreamer.broadcasterLogin.toLowerCase()) classes.push('streamer');
    if (data.content.toLowerCase().includes( kickStreamer.broadcasterUserName.toLowerCase() )) classes.push('streamer-mentioned');

    const userLinkElement = user.querySelector('a');
    const userLink = `https://kick.com/${data.sender.slug}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.style = `--user-color: ${data.sender.identity.color}`;
    userLinkElement.textContent = data.sender.username;
    userLinkElement.title = `${data.sender.username} @ ${userLink}`;

    message.innerHTML = messageHTML;

    if (showAvatar) avatar.innerHTML = `<img src="${avatarImage}">`; else avatar.remove();
    if (showBadges) {
        if ((!badgesHTML) && (!badgesHTMLV2)) { badges.remove(); }
        else { badges.innerHTML = badgesHTMLV2 + badgesHTML; }
    }
    else { badges.remove(); }

    if (data.type == "reply") {
        classes.push('reply');
        var replyHTML = await getKickEmotes(data.metadata.original_message.content);
        reply.insertAdjacentHTML('beforeend', `${tRD('kick.reply_label', { user: `${data.metadata.original_sender.username}` })} ${replyHTML}`);
    }
    else { reply.remove(); }

    sharedChat.remove();
    pronoun.remove();

    addMessageItem('kick', clone, classes, userSlug, messageId);
}
async function kickChatMessageFromStreamerBot(data) {
    
    if (showKickMessages == false) return;
    if (ignoreUserList.includes(data.user.login.toLowerCase())) return;
    if (data.text.startsWith("!") && excludeCommands == true)  return;

	const template = chatTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.messageId;
    const userId = data.user.id;
    const userSlug = data.user.slug;

    const {
        'first-message': firstMessage,
        'shared-chat': sharedChat,
        
        header,
        timestamp,
        platform,
        badges,
        avatar,
        pronouns: pronoun,
        user,
        
        reply,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kick', 'msg'];

    if (data.user.role == 4) classes.push('streamer');

    const avatarImage = data.user.profilePicture;

    const [messageHTML, badgesHTML, roles] = await Promise.all([
        getKickEmotes(data.text),
        getKickBadgesFromStreamerBot(data.user.badges),
        getKickRolesFromStreamerBot(data.user.badges)
    ]);

    header.remove();
    firstMessage.remove();

    if (roles.length == 0) roles.push('user');
    classes.push(...roles);
    
    const kickStreamer = streamerInfo.get.platforms.kick.broadcasterUserName;
    
    if (data.text.toLowerCase().includes( kickStreamer.toLowerCase() )) {
        classes.push('streamer-mentioned');
    }


    const userLinkElement = user.querySelector('a');
    const userLink = `https://kick.com/${ userSlug }`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.style = `--user-color: ${data.user.color}`;
    userLinkElement.textContent = data.user.name;
    userLinkElement.title = `${data.user.name} @ ${userLink}`;

    message.innerHTML = messageHTML;

    if (showAvatar) avatar.innerHTML = `<img src="${avatarImage}">`; else avatar.remove();
    if (showBadges) {
        if (!badgesHTML) { badges.remove(); }
        else { badges.innerHTML = badgesHTML; }
    }
    else { badges.remove(); }

    if (data.isReply) {
        classes.push('reply');
        var replyHTML = await getKickEmotes(data.reply.content);
        reply.insertAdjacentHTML('beforeend', `${tRD('kick.reply_label', { user: `${data.reply.sender.name}` })} ${replyHTML}`);
    }
    else { reply.remove(); }

    sharedChat.remove();
    pronoun.remove();

    addMessageItem('kick', clone, classes, userSlug, messageId);
}



async function kickFollowMessage(data) {

    if (showKickFollows == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.user.login.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kick', 'follow'];

    header.remove();
    
    user.textContent = data.user.name;

    action.innerHTML = tRD('kick.follow_action');
    
    value.remove()

    message.remove();

    addEventItem('kick', clone, classes, userId, messageId);
}



async function kickKicksGiftedMessage(data) {

    if (showKickKicks == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.sender.username.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kick', 'kicksgifted'];


    header.remove();

    const rotateDeg = (Math.random() * 60 - 30).toFixed(1) + 'deg';
    var kicksGiftId = data.gift.gift_id.replace('_', '-');
    var kicksGiftImage = `<img style="--rotateGift: ${rotateDeg}" class="gift-image" src="https://files.kick.com/kicks/gifts/${kicksGiftId}.webp" alt="${data.gift.name}">`;
    
    user.textContent = data.sender.username;
    action.innerHTML = tRD('kick.kicksgift_action', { name: data.gift.name });

    const kicksMatch = kicksGiftsClasses.find(lv => data.gift.amount >= lv.min && data.gift.amount <= lv.max);
    classes.push(kicksMatch.class);

    var kicksGift = data.gift.amount > 1 ? tRD('kick.kicks_plural') : tRD('kick.kicks_singular');

    const giftHtml = renderGiftEventSuffix({
        image : `${kicksGiftImage}`, 
        value : `<img src="js/modules/kick/images/icon-kicksgift.svg" alt="${kicksGift}"> ${data.gift.amount}`
    });

    value.innerHTML = giftHtml;

    if (!data.message) { message.remove(); }
    else {
        var kicksMessage = await getKickEmotes(data.message);
        message.innerHTML = kicksMessage;
    }

    addEventItem('kick', clone, classes, userId, messageId);
}




async function kickSubMessage(data) {

    if (showKickSubs == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.username.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kick', 'sub'];

    header.remove();

    user.textContent = data.username;

    action.innerHTML = tRD('kick.sub_action');

    var months = formatSubMonthDuration(data.months);
    
    value.innerHTML = `<strong>${months}</strong>`;

    message.remove();

    addEventItem('kick', clone, classes, userId, messageId);
}
async function kickSubMessageFromStreamerBot(data) {

    if (showKickSubs == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.user.login.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kick', 'sub'];

    header.remove();

    user.textContent = data.user.name;

    action.innerHTML = tRD('kick.sub_action');

    var months = formatSubMonthDuration(data.duration);
    
    value.innerHTML = `<strong>${months}</strong>`;

    message.remove();

    addEventItem('kick', clone, classes, userId, messageId);
}


async function kickGiftMessage(data) {

    if (showKickGiftedSubs == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.gifter_username.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kick', 'gift'];

    header.remove();

    
    user.textContent = data.gifter_username;

    var giftedLength = data.gifted_usernames.length;
    
    if (giftedLength > 1 && showKickMassGiftedSubs == true) {
        action.innerHTML = tRD('kick.giftbomb_action', { count: giftedLength });
        message.innerHTML = tRD('kick.giftbomb_message', { total: data.gifter_total });
        value.remove();

        if (showKickGiftedSubsUserTrain == true) {    
            for (recipients of data.gifted_usernames) {
                kickGiftSingleSub(data.gifter_username, recipients);
            }   
        }
        
        addEventItem('kick', clone, classes, userId, messageId);
    }
    else {
        kickGiftSingleSub(data.gifter_username, data.gifted_usernames[0]);
    }
    
}
async function kickGiftMessageFromStreamerBot(data) {

    if (showKickGiftedSubs == false) return;
    
    kickGiftSingleSub(data.user.name, data.recipient.name)
}
async function kickMassGiftMessageFromStreamerBot(data) {

    if (showKickGiftedSubs == false || showKickGiftedSubsUserTrain == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.user.login.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kick', 'gift'];

    header.remove();

    
    user.textContent = data.user.name;

    var giftedLength = data.recipients.length;
    
    action.innerHTML = tRD('kick.giftbomb_action', { count: giftedLength });
    message.innerHTML = tRD('kick.giftbomb_message', { total: data.gifter_total });
    value.remove();

    for (recipients of data.recipients) {
        kickGiftSingleSub(data.user.name, recipients.name);
    }

    addEventItem('kick', clone, classes, userId, messageId);
    
    
}



async function kickGiftSingleSub(gifter, recipient) {
    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = gifter.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kick', 'gift'];

    header.remove();
    message.remove();

    user.textContent = gifter;

    action.innerHTML = tRD('kick.giftsub_single_action');
    
    value.innerHTML = `<strong>${escapeHTML(recipient)}</strong>`;

    addEventItem('kick', clone, classes, userId, messageId);
}



async function kickRewardRedemption(data) {

    if (showKickRewardRedemptions == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.username.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kick', 'reward'];

    header.remove();

    user.textContent = data.username;
    action.innerHTML = tRD('kick.reward_action');
    value.innerHTML = `<strong>${data.reward_title}</strong>`;
    
    var userInput = data.user_input ? `${data.user_input}` : '';
    message.innerHTML = `${userInput}`;

    addEventItem('kick', clone, classes, userId, messageId);
}
async function kickRewardRedemptionFromStreamerBot(data) {

    if (showKickRewardRedemptions == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.redeemer.name.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kick', 'reward'];

    header.remove();

    user.textContent = data.redeemer.name;
    action.innerHTML = tRD('kick.reward_action');

    const giftHtml = renderGiftEventSuffix({
        image : `<strong>${data.reward.title}</strong>`, 
        value : `<img src="js/modules/kick/images/icon-channel-points.svg" alt="Channel Points"> ${data.reward.cost}`
    });

    value.innerHTML = `${giftHtml}`;
    
    var userInput = data.description ? `${data.description}` : '';
    message.innerHTML = `${userInput}`;

    addEventItem('kick', clone, classes, userId, messageId);
}





async function kickRaidMessage(data) {

    if (showKickRaids == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.host_username.toLowerCase();

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kick', 'raid'];

    header.remove();
    message.remove();

    user.textContent = data.host_username;

    var viewers = data.number_viewers > 1 ? tRD('kick.raid_plural') : tRD('kick.raid_singular');
    action.innerHTML = tRD('kick.raid_action');
    value.innerHTML = `<strong>${data.number_viewers} ${viewers}</strong>`;

    addEventItem('kick', clone, classes, userId, messageId);
}





async function kickChatMessageDeleted(data) {
    document.getElementById(data.message.id)?.parentNode.remove();
}



async function kickUserBanned(data) {
    chatContainer.querySelectorAll(`[data-user="${data.user.slug}"]`).forEach(element => {
        element.parentNode.remove();
    });
}



async function kickChatClearMessages() {
    chatContainer.querySelectorAll(`.item.kick`).forEach(element => {
        element.parentNode.remove();
    });
}



async function kickUpdateStatistics(data) {
    if (showPlatformStatistics == false || showKickViewers == false) return;

    const viewers = formatNumber(DOMPurify.sanitize(data.viewerCount))  || "0";
    const span = document.querySelector('#statistics #kick .viewers span');
    
    span.textContent = viewers;
    span.dataset.viewers = data.viewerCount;

    combinedViewerStatistics();
}



async function kickGetUserInfo(user) {
    
    let data;

    try {
        const response = await fetch(`https://kick.com/api/v2/channels/${user}`);
        
        if (!response.ok) {
            console.warn(`[ChatRD][Kick] Error trying to find the user "${user}": ${response.status}`);
            console.warn(`[ChatRD][Kick] Retrying using a different method...`);

            const altUser = user.replace(/_/g, "-");
            const altResponse = await fetch(`https://kick.com/api/v2/channels/${altUser}`);

            if (!altResponse.ok) {
                console.error(`[ChatRD][Kick] Error trying to find the user "${altUser}": ${altResponse.status}`);
                return null;
            }
            else { data = await altResponse.json(); }
        }
        else { data = await response.json(); }

        return data;
    }

    catch (error) {
        console.error(`[ChatRD][Kick] Network error while fetching user "${user}":`, error);
        return null;
    }
}

async function getKickAvatar(user) {
    if (!showAvatar) return;

    const kickAvatarList = [
        "https://kick.com/img/default-profile-pictures/default-avatar-1.webp",
        "https://kick.com/img/default-profile-pictures/default-avatar-2.webp",
        "https://kick.com/img/default-profile-pictures/default-avatar-3.webp",
        "https://kick.com/img/default-profile-pictures/default-avatar-4.webp",
        "https://kick.com/img/default-profile-pictures/default-avatar-5.webp",
        "https://kick.com/img/default-profile-pictures/default-avatar-6.webp"
    ];

    const DEFAULT_AVATAR = kickAvatarList[Math.floor(Math.random() * kickAvatarList.length)];

    if (kickAvatars.has(user)) {
        console.debug(`[ChatRD][Kick] Kick avatar found for ${user}!`);
        return kickAvatars.get(user);
    }

    console.debug(`[ChatRD][Kick] Kick avatar not found for ${user}! Trying to get it...`);

    try {
        const response = await kickGetUserInfo(user);
        
        if (response == null) {
            console.debug(`[ChatRD][Kick] Kick avatar couldn't be found for ${user}. Using default...`);
            kickAvatars.set(user, DEFAULT_AVATAR);
            return DEFAULT_AVATAR;
        }

        const rawPic = response?.user?.profile_pic;

        const avatarUrl = (typeof rawPic === "string" && rawPic)
          ? rawPic.replace(/fullsize\.webp$/, "medium.webp")
          : DEFAULT_AVATAR;

        kickAvatars.set(user, avatarUrl);
        return avatarUrl;
    }
    
    catch (error) {
        console.warn(`[ChatRD][Kick] Error getting Kick avatar for ${user}:`, error);
        return DEFAULT_AVATAR;
    }
}


async function getKickEmotes(text) {
    var message = await parseKickEmojis(text);
    message = await parseKick7TVEmotes(message);
    return message;
}

async function parseKickEmojis(content) {
    const message = content;
    const messagewithemotes = message.replace(/\[emote:(\d+):([^\]]+)\]/g, (_, id, name) => {
        return `<img src="https://files.kick.com/emotes/${id}/fullsize" alt="${name}" class="emote">`;
    });

    return messagewithemotes;
}

async function parseKick7TVEmotes(text) {
    const words = text.split(/\s+/);

    const parsedWords = words.map(word => {
        if (kick7TVEmojis.has(word)) {
            const url = kick7TVEmojis.get(word);
            return `<img src="${url}" alt="${word}" class="emote">`;
        }
        return word;
    });

    return parsedWords.join(' ');
}


async function getKick7TVEmotes(userId) {
    const userSet = await fetch(`https://7tv.io/v3/users/kick/${userId}`);

    if (userSet.status === 404) {
        console.debug("[ChatRD][Kick] 7TV Profile based on this Kick user was not found");
        return null;
    }

    const userEmojis = await userSet.json();
    
    const gettingAllKick7TVEmotes = userEmojis?.emote_set?.emotes?.map(emote => ({
        name: emote.name,
        id: emote.id,
        url: `https://cdn.7tv.app/emote/${emote.id}/1x.webp`
    })) || [];

    const globalSet = await fetch(`https://7tv.io/v3/emote-sets/global`);
    const globalEmojis = await globalSet.json();
    
    const gettingAllGlobal7TVEmotes = globalEmojis?.emotes?.map(emote => ({
        name: emote.name,
        id: emote.id,
        url: `https://cdn.7tv.app/emote/${emote.id}/1x.webp`
    })) || [];

    const SevenTVEmotesFusion = [...gettingAllKick7TVEmotes, ...gettingAllGlobal7TVEmotes];
    
    if (SevenTVEmotesFusion != null) {
        console.debug("[ChatRD][Kick] Getting all Kick's user 7TV Emojis + Globals", SevenTVEmotesFusion);

        SevenTVEmotesFusion.forEach(emote => {
            kick7TVEmojis.set(emote.name, emote.url);
        });
    }
}



async function getKickRoles(roles) {
    const rolesArray = [];
    
    roles.forEach(role => {
        rolesArray.push(role.type);
    });

    return rolesArray;
}



async function getKickRolesFromStreamerBot(roles) {
    const rolesArray = [];
    
    roles.forEach(role => {
        rolesArray.push(role.id);
    });

    return rolesArray;
}



async function getKickBadges(badges) {
    const badgesArray = [];
    
    badges.forEach(badge => {
        if (badge.type === 'subscriber') {
            
            const targetMonths = badge.count;

            const eligibleBadges = kickSubBadges
                .filter(badge => badge.months <= targetMonths)
                .sort((a, b) => b.months - a.months);

            badgesArray.push(`<img src="${eligibleBadges[0]?.badge_image?.src || 'js/modules/kick/images/badge-subscriber.svg'}" class="badge">`);
        }
        else {
            badgesArray.push(`<img src="js/modules/kick/images/badge-${badge.type}.svg" class="badge">`);
        }
    });

    return badgesArray.join(' ');
}

async function getKickBadgesV2(badges) {

    const badgesArray = [];
    
    badges.forEach(badge => {
        if (badge.badge_type === 'global') {
            if (badge.selected == true) {
                badgesArray.push(`<img src="${escapeHTML(badge.image_url)}" class="badge">`);
            }

        }
    });

    return badgesArray.join(' ');
}



async function getKickBadgesFromStreamerBot(badges) {
    const badgesArray = [];
    
    badges.forEach(badge => {
        if (badge.imageUrl) {
            badgesArray.push(`<img src="js/modules/kick/images/badge-${badge.id}.svg" class="badge">`);
        }
        else {
            if (badge.id === 'subscriber') {
        
                const targetMonths = badge.count;

                const eligibleBadges = kickSubBadges
                    .filter(badge => badge.months <= targetMonths)
                    .sort((a, b) => b.months - a.months);

                badgesArray.push(`<img src="${eligibleBadges[0]?.badge_image?.src || 'js/modules/kick/images/badge-subscriber.svg'}" class="badge">`);
            }
            else {
                badgesArray.push(`<img src="js/modules/kick/images/badge-${badge.id}.svg" class="badge">`);
            }

        }
    });

    return badgesArray.join(' ');
}