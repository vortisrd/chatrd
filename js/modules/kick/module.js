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

const kicksGiftsImages = [
    { min: 500,  max: 999,  url: 'https://static.kick.com/kicks/gifts/500-kick-bundle.webp' },
    { min: 1000,  max: 1999,  url: 'https://static.kick.com/kicks/gifts/1000-kick-bundle.webp' },
    { min: 2000,  max: 4999,  url: 'https://static.kick.com/kicks/gifts/2000-kick-bundle.webp' },
    { min: 5000,  max: 9999,  url: 'https://static.kick.com/kicks/gifts/5000-kick-bundle.webp' },
    { min: 10000,  max: 24999,  url: 'https://static.kick.com/kicks/gifts/10000-kick-bundle.webp' },
    { min: 25000,  max: 99999999999,  url: 'https://static.kick.com/kicks/gifts/25000-kick-bundle.webp' },
];


// KICK EVENTS HANDLERS

const kickMessageHandlers = {

    'Kick.Follow': (response) => {
        kickFollowMessage(response.data);
    },

    'Kick.ChatMessage': (response) => {
        kickChatMessageFromStreamerBot(response.data);
    },

    'Kick.RewardRedemption': (response) => {
        kickRewardRedemptionFromStreamerBot(response.data);
    },

    'Kick.Subscription': (response) => {
        kickSubMessageFromStreamerBot(response.data);
    },

    'Kick.Resubscription': (response) => {
        kickSubMessageFromStreamerBot(response.data);
    },

    'Kick.GiftSubscription': (response) => {
        kickGiftMessageFromStreamerBot(response.data);
    },

    'Kick.MassGiftSubscription': (response) => {
        kickMassGiftMessageFromStreamerBot(response.data);
    },

    'Kick.KicksGifted': (response) => {
        kickKicksGiftedMessageFromStreamerBot(response.data);
    },

    'Kick.UserTimedOut': (response) => {
        kickUserBanned({
            banned_by: {
                username: response.data.moderator.name
            },
            permanent: false,
            duration: Math.floor(response.data.duration/60),
            user: {
                slug : response.data.user.name.toLowerCase(),
                username : response.data.user.name
            }
        });
    },

    'Kick.UserBanned': (response) => {
        kickUserBanned({
            banned_by: {
                username: response.data.moderator.name
            },
            permanent: true,
            user: {
                slug : response.data.user.name.toLowerCase(),
                username : response.data.user.name
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

            (async () => {

                const kickStreamerLogin = await getStreamerInfo();
                console.log('Kick streamer data: ', kickStreamerLogin.platforms.kick);
                const kickUserId = kickStreamerLogin.platforms.kick.broadcasterUserId;
                const kick7TVEmotes = await getKick7TVEmotes(kickUserId);
                if (kick7TVEmotes != null) {
                    kick7TVEmotes.forEach(emote => kick7TVEmojis.set(emote.name, emote.url));
                }

            })();

        });
        
    }
    
});






// -----------------------
// KICK CONNECT HANDLER


// ---------------------------
// KICK UTILITY FUNCTIONS

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

async function kickKicksGiftedMessageFromStreamerBot(data) {

    if (showKickKicks == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.sender.name.toLowerCase();

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

    var kicksGift = data.gift.amount > 1 ? tRD('kick.kicks_plural') : tRD('kick.kicks_singular');
    
    user.textContent = data.sender.name;
    action.innerHTML = `${tRD('kick.kicksgift_action')} <strong>${data.gift.amount} ${kicksGift}</strong>`;

    const kicksMatch = kicksGiftsClasses.find(lv => data.gift.amount >= lv.min && data.gift.amount <= lv.max);
    classes.push(kicksMatch.class);

    let giftHtml;
    
    if (data.gift.amount >= 500) {

        const kicksGiftMatch = kicksGiftsImages.find(lv => data.gift.amount >= lv.min && data.gift.amount <= lv.max);
        const rotateDeg = (Math.random() * 60 - 30).toFixed(1) + 'deg';
        var kicksGiftImage = `<img style="--rotateGift: ${rotateDeg}" class="gift-image" src="${kicksGiftMatch.url}" alt="${data.gift.amount} Kicks">`;

        giftHtml = renderGiftEventSuffix({
            image : `${kicksGiftImage}`, 
            value : `<img src="js/modules/kick/images/icon-kicksgift.svg" alt="${kicksGift}"> ${data.gift.amount}`
        });

        value.innerHTML = giftHtml;
    }
    else {
        giftHtml = renderGiftEventSuffix({
            image : ``, 
            value : `<img src="js/modules/kick/images/icon-kicksgift.svg" alt="${kicksGift}"> ${data.gift.amount}`
        });

        value.innerHTML = giftHtml;
    }

    if (!data.gift.message) { message.remove(); }
    else {
        var kicksMessage = await getKickEmotes(data.gift.message);
        message.innerHTML = kicksMessage;
    }

    addEventItem('kick', clone, classes, userId, messageId);
}

async function kickSubMessageFromStreamerBot(data) {

    if (showKickSubs == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.user.name.toLowerCase();

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

async function kickGiftMessageFromStreamerBot(data) {

    if (showKickGiftedSubs == false) return;
    
    kickGiftSingleSub(data.user.name, data.recipient.name)
}

async function kickMassGiftMessageFromStreamerBot(data) {

    if (showKickGiftedSubs == false || showKickGiftedSubsUserTrain == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = data.user.name.toLowerCase();

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
    //message.innerHTML = tRD('kick.giftbomb_message', { total: data.gifter_total });
    message.remove();
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

async function kickChatMessageDeleted(data) {
    document.getElementById(data.message.id)?.parentNode.remove();
}

async function kickUserBanned(data) {
    chatContainer.querySelectorAll(`[data-user="${data.user.slug}"]`).forEach(element => {
        element.parentNode.remove();
    });

    if (!chatField) return;

    let description;
    let type = data.permanent ? 'ban' : 'timeout';

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = createRandomString(40);

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

    const classes = ['kick', 'hidden-event', 'user-banned'];

    const targetUser = data.user.username;
    const targetLogin = data.user.slug;
    const moderator = data.banned_by.username;

    const userLinkElement = user.querySelector('a');
    const userLink = `https://kick.com/${targetLogin}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = targetUser;
    userLinkElement.title = `${targetUser} @ ${userLink}`;

    if (type == 'timeout') {
        const duration = convertTime((data.duration * 60) * 1000);
        description = tRD('kick.timeout_action', { user: moderator, duration: `${duration}`});
    }

    if (type == 'ban') {
        description = tRD('kick.ban_action', { user: moderator });
    }

    header.remove();
    value.remove();
    action.innerHTML = `${description}`;

    addHiddenEventItem('kick', clone, classes, userId, messageId);
}

async function kickUserUnBanned(data) {

    if (!chatField) return;

    let description;
    let type = data.permanent ? 'ban' : 'timeout';

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = createRandomString(40);

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

    const classes = ['kick', 'hidden-event', 'user-unbanned'];

    const targetUser = data.user.username;
    const targetLogin = data.user.slug;
    const moderator = data.unbanned_by.username;

    const userLinkElement = user.querySelector('a');
    const userLink = `https://kick.com/${targetLogin}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = targetUser;
    userLinkElement.title = `${targetUser} @ ${userLink}`;

    if (type == 'timeout') {
        description = tRD('kick.untimeout_action', { user: moderator });
    }

    if (type == 'ban') {
        description = tRD('kick.unban_action', { user: moderator });
    }

    header.remove();
    value.remove();
    action.innerHTML = `${description}`;

    addHiddenEventItem('kick', clone, classes, userId, messageId);
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

async function getKickRolesFromStreamerBot(roles) {
    const rolesArray = [];
    
    roles.forEach(role => {
        rolesArray.push(role.id);
    });

    return rolesArray;
}