/* ----------------------- */
/* TIKTOK MODULE VARIABLES */
/* ----------------------- */


const tikFinityStatus = {};

const showTiktok                    = getURLParam("showTiktok", false);

const showTikTokMessages            = getURLParam("showTikTokMessages", true);
const showTikTokJoins               = getURLParam("showTikTokJoins", false);
const showTikTokFollows             = getURLParam("showTikTokFollows", true);
const showTikTokLikes               = getURLParam("showTikTokLikes", false);
const showTikTokShares              = getURLParam("showTikTokShares", false);
const showTikTokGifts               = getURLParam("showTikTokGifts", true);
const showSmallTikTokGifts          = getURLParam("showSmallTikTokGifts", false);
const showTikTokSubs                = getURLParam("showTikTokSubs", true);
const showTikTokStatistics          = getURLParam("showTikTokStatistics", true);

const tiktokGiftsClasses = [
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

userColors.set('tiktok', new Map());

document.addEventListener('DOMContentLoaded', () => {
    if (showTiktok) {

        if ((showTikTokStatistics == true)  && (showPlatformStatistics == true)) {
            const tiktokStatistics = `
                <div class="platform" id="tiktok" style="display: none;">
                    <img src="js/modules/tiktok/images/logo-tiktok.svg" alt="">
                    <span class="viewers"><i class="fa-solid fa-user"></i> <span>0</span></span>
                    <span class="likes"><i class="fa-solid fa-heart"></i> <span>0</span></span>
                </div>
            `;

            document.querySelector('#statistics').insertAdjacentHTML('beforeend', tiktokStatistics);
            document.querySelector('#statistics #tiktok').style.display = '';
        }
        
        tiktokConnection();
    }
});


// -----------------------
// TIKTOK CONNECT HANDLER

async function tiktokConnection() {
    const tikfinityWebSocketURL = 'ws://localhost:21213/'; // Replace with real URL
    const reconnectDelay = 10000; // 10 seconds
    const maxTries = 20;
    let retryCount = 0;

    function connect() {
        const tikfinityWebSocket = new WebSocket(tikfinityWebSocketURL);

        tikfinityWebSocket.onopen = () => {
            console.debug(`[ChatRD][TikFinity] Connected to TikFinity successfully!`);
            retryCount = 0; // Reset retry count on success

            notifySuccess({
                title: 'ChatRD 🤝 TikFinity',
                text: ``
            });

            tikFinityStatus.connected = true;
            tikFinityStatus.disconnected = false;
            tikFinityStatus.error = false;
        };

        tikfinityWebSocket.onmessage = (response) => {

            const data = JSON.parse(response.data);
            const tiktokData = data.data;

            console.debug(`[ChatRD][TikFinity][TikTok] ${data.event}`, data);

            switch (data.event) {
                case 'roomUser' : tiktokUpdateStatistics(tiktokData, 'viewers'); break;
                case 'like': tiktokLikesMessage(tiktokData); tiktokUpdateStatistics(tiktokData, 'likes'); break;
                case 'member' : tiktokJoinMessage(tiktokData); break;
                case 'share' : tiktokShareMessage(tiktokData); break;
                case 'chat': tiktokChatMessage(tiktokData); break;
                case 'follow': tiktokFollowMessage(tiktokData); break;
                case 'gift': tiktokGiftMessage(tiktokData); break;
                case 'subscribe': tiktokSubMessage(tiktokData); break;
                //default: console.debug(`[TikTok] ${data.event}`, data); 
            }
        };

        tikfinityWebSocket.onclose = (event) => {

            setTimeout(() => {
                connect();
            }, reconnectDelay);

            if (tikFinityStatus.disconnected == false) {
                notifyError({
                    title: 'ChatRD ❌ TikFinty',
                    text: ``
                });
            }

            tikFinityStatus.connected = false;
            tikFinityStatus.disconnected = true;
            tikFinityStatus.error = true;

        };

        tikfinityWebSocket.onerror = (error) => {
            console.error(`[ChatRD][TikFinity] Connection error:`, error);

            // Force close to trigger onclose and centralize retry logic
            if (tikfinityWebSocket.readyState !== WebSocket.CLOSED) {
                tikfinityWebSocket.close();
            }

            if (tikFinityStatus.error == false) {
                notifyError({
                    title: 'ChatRD ⚠️ TikFinty',
                    text: ``
                });
            }

            tikFinityStatus.connected = false;
            tikFinityStatus.disconnected = true;
            tikFinityStatus.error = true;
        };

        return tikfinityWebSocket;
    }

    return connect(); // Returns the initial WebSocket instance
}













// ---------------------------
// TIKTOK UTILITY FUNCTIONS

async function tiktokChatMessage(data) {
    
    if (!data?.comment) { data.comment = " "; }
    if (showTikTokMessages == false) return;
    //if (ignoreUserList.includes(data.nickname.toLowerCase())) return;
    if (ignoreUserList.includes(data.uniqueId.toLowerCase())) return;
    if (data.comment.startsWith("!") && excludeCommands == true) return;

	const template = chatTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.msgId;
    const userId = data.userId;

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

    const classes = ['tiktok', 'msg'];

    if (data.uniqueId === data.tikfinityUsername) classes.push('streamer');
    if (data.isModerator) classes.push('moderator');
    if (data.isSubscriber) classes.push('subscriber');

    const [avatarImage,  badgesHTML] = await Promise.all([
        getTikTokAvatar(data),
        getTikTokBadges(data),
    ]);

    header.remove();
    firstMessage.remove();

    sharedChat.remove();
    reply.remove();
    pronoun.remove();

    if (showAvatar) avatar.innerHTML = `<img src="${avatarImage}">`; else avatar.remove();
    
    if (showBadges) {
        if (!badgesHTML) { badges.remove(); }
        else { badges.innerHTML = badgesHTML; }
     }
    else { badges.remove(); }

    var color = await createRandomColor('tiktok', data.uniqueId);


    const userLinkElement = user.querySelector('a');
    const userLink = `https://tiktok.com/@${data.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.style = `--user-color: ${color}`;
    userLinkElement.textContent = data.nickname;
    userLinkElement.title = `${data.nickname} @ ${userLink}`;

    
    message.textContent = data.comment;
    await getTikTokEmotes(data, message),

    addMessageItem('tiktok', clone, classes, userId, messageId);
}



async function tiktokFollowMessage(data) {

    if (showTikTokFollows == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.msgId;
    const userId = data.userId;

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

    const classes = ['tiktok', 'follow'];

    header.remove();
    message.remove();
    value.remove();

    
    user.textContent = data.nickname;

    action.innerHTML = tRD('tiktok.follow_action');

    addEventItem('tiktok', clone, classes, userId, messageId);
}


async function tiktokShareMessage(data) {

    if (showTikTokShares == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.msgId;
    const userId = data.userId;

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

    const classes = ['tiktok', 'share'];

    header.remove();
    message.remove();
    value.remove();
    
    user.textContent = data.nickname;

    action.innerHTML = tRD('tiktok.share_action');

    addEventItem('tiktok', clone, classes, userId, messageId);
}


async function tiktokJoinMessage(data) {
    
    if (showTikTokJoins == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.msgId;
    const userId = data.userId;

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

    const classes = ['tiktok', 'join'];

    header.remove();
    message.remove();
    value.remove();

    user.textContent = data.nickname;
    action.innerHTML = tRD('tiktok.join_action');

    if (eventsDock == true) {
        addLittleEventItem('tiktok', clone, classes, userId, messageId);
        return;
    }
    
    //const joinElement = chatContainer.querySelector(".event.tiktok.join");
    const joinElement = [...chatContainer.querySelectorAll(".event.tiktok.join")].at(-1);
    
    if (!joinElement) {
        addEventItem('tiktok', clone, classes, userId, messageId);
        return;
    };

    const messageElement = joinElement.querySelector('.message');

    var animateClass = (chatHorizontal == true) ? 'animate__fadeInRight' : 'animate__fadeInUp';

    joinElement.dataset.user = userId;
    joinElement.id = messageId;
    joinElement.querySelector('span.user').textContent = data.nickname;

    messageElement.classList.add('animate__animated', 'animate__faster', animateClass);
    
    chatContainer.prepend(joinElement);

}



async function tiktokLikesMessage(data) {

    if (showTikTokLikes == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.msgId;
    const userId = data.userId;

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

    const classes = ['tiktok', 'likes'];

    var likeCountTotal = parseInt(data.likeCount);
    
    // Search for Previous Likes from the Same User
    const previousLikeContainer = chatContainer.querySelector(`div.event.tiktok.likes[data-user="${data.userId}"]`);

    // If found, fetches the previous likes, deletes the element
    // and then creates a new count with a sum of the like count
    if (previousLikeContainer) {
        const likeCountElem = previousLikeContainer.querySelector('.value strong');
        if (likeCountElem) {
            var likeCountPrev = parseInt(likeCountElem.textContent);
            likeCountTotal = Math.floor(likeCountPrev + likeCountTotal);
            //removeItem(previousLikeContainer);
            likeCountElem.textContent = likeCountTotal;
            //animateCounter(likeCountElem, likeCountPrev, likeCountTotal, 250);
            chatContainer.prepend(previousLikeContainer);
        }
    }
    else {

        header.remove();
        
        user.textContent = data.nickname;
        action.innerHTML = tRD('tiktok.likes_action');

        var likes = likeCountTotal > 1 ? tRD('tiktok.likes_plural') : tRD('tiktok.likes_singular');
        value.innerHTML = `<strong>${likeCountTotal}</strong> ${likes} ❤️`;

        message.remove();

        addEventItem('tiktok', clone, classes, userId, messageId);

    }
}



async function tiktokSubMessage(data) {

    if (showTikTokSubs == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.msgId;
    const userId = data.userId;

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

    const classes = ['tiktok', 'sub'];

    header.remove();

    user.textContent = data.nickname;
    action.innerHTML = tRD('tiktok.sub_action');

    value.remove();
    message.remove();

    addEventItem('tiktok', clone, classes, userId, messageId);
}



async function tiktokEnvelopeMessage(data) {
}



async function tiktokGiftMessage(data) {

    if (showTikTokGifts == false) return;
    if (data.giftType === 1 && !data.repeatEnd) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.msgId;
    const userId = data.userId;

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

    const classes = ['tiktok', 'gift'];

    if (showSmallTikTokGifts == true) { classes.push('small-gift'); }

    header.remove();

    let coins = Math.floor(data.repeatCount*data.diamondCount);

    const tikTokGiftMatch = tiktokGiftsClasses.find(lv => coins >= lv.min && coins <= lv.max);
    classes.push(tikTokGiftMatch.class);

    user.textContent = data.nickname;
    action.innerHTML = tRD('tiktok.gift_action', { count: data.repeatCount, name: data.giftName });
    value.innerHTML = `
        <div class="gift-info">
            <span class="gift-image"><img src="${data.giftPictureUrl}" alt="${data.giftName}"></span>
            <span class="gift-value"><img src="js/modules/tiktok/images/icon-tiktokcoin.svg" alt="Coins"> ${coins}</span>
        </div>
    `;

    message.remove();

    addEventItem('tiktok', clone, classes, userId, messageId);
}



async function getTikTokEmotes(data, messageElement) {
    const {
        comment: message,
        emotes,
    } = data;

    // Limpa o elemento de destino
    messageElement.innerHTML = '';

    if (!emotes || emotes.length === 0) {
        // Sem emotes → só texto normal
        messageElement.appendChild(document.createTextNode(message));
        return;
    }

    // Ordena os emotes pelo índice para garantir ordem correta
    const sorted = [...emotes].sort((a, b) => a.placeInComment - b.placeInComment);

    let lastIndex = 0;

    for (const emote of sorted) {
        const position = emote.placeInComment;

        // adiciona texto antes do emote, se houver
        if (lastIndex < position) {
            const text = message.slice(lastIndex, position);
            messageElement.appendChild(document.createTextNode(text));
        }

        // adiciona o emote
        const img = document.createElement('img');
        img.src = emote.emoteImageUrl;
        img.className = 'emote';
        img.dataset.emoteId = emote.emoteId;
        img.onerror = () => (img.outerHTML = emote.emoteId); // fallback
        messageElement.appendChild(img);

        lastIndex = position + 1; // avança
    }

    // texto final depois do último emote
    if (lastIndex < message.length) {
        const text = message.slice(lastIndex);
        messageElement.appendChild(document.createTextNode(text));
    }
}



async function getTikTokAvatar(data) {
    if (showAvatar == false) return;
    
    const {
        profilePictureUrl
    } = data;
    
    return profilePictureUrl;
}

async function getTikTokBadges(data) {
    const { isSubscriber, isModerator, userBadges } = data;

    let badgesHTML = [
        //isSubscriber && '<span class="badge sub"><i class="fa-solid fa-star"></i></span>',
        isModerator && '<span class="badge mod"><i class="fa-solid fa-user-gear"></i></span>',
    ];
    
    const badgesLevelEight = [
        { min: 1,  max: 4,  url: 'https://p16-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv1_v1.png~tplv-obj.image' },
        { min: 5,  max: 9,  url: 'https://p16-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv5_v1.png~tplv-obj.image' },
        { min: 10, max: 14, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv10_v1.png~tplv-obj.image' },
        { min: 15, max: 19, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv15_v2.png~tplv-obj.image' },
        { min: 20, max: 24, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv20_v1.png~tplv-obj.image' },
        { min: 25, max: 29, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv25_v1.png~tplv-obj.image' },
        { min: 30, max: 34, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv30_v1.png~tplv-obj.image' },
        { min: 35, max: 39, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv35_v3.png~tplv-obj.image' },
        { min: 40, max: 44, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv40_v2.png~tplv-obj.image' },
        { min: 45, max: 49, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv45_v1.png~tplv-obj.image' },
        { min: 50, max: 500, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv50_v1.png~tplv-obj.image' },
    ];

    const badgesLevelTen = [
        { min: 1,  max: 9,  url: 'https://p16-webcast.tiktokcdn.com/webcast-va/fans_badge_icon_lv1_v4.png~tplv-obj.image' },
        { min: 10, max: 19,  url: 'https://p16-webcast.tiktokcdn.com/webcast-va/fans_badge_icon_lv10_v4.png~tplv-obj.image' },
        { min: 20, max: 29, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/fans_badge_icon_lv20_v4.png~tplv-obj.image' },
        { min: 30, max: 39, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/fans_badge_icon_lv30_v4.png~tplv-obj.image' },
        { min: 40, max: 49, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/fans_badge_icon_lv40_v4.png~tplv-obj.image' },
        { min: 50, max: 500, url: 'https://p16-webcast.tiktokcdn.com/webcast-va/fans_badge_icon_lv50_v4.png~tplv-obj.image' },
    ];

    if ((userBadges) && (userBadges.length > 0)) {
        userBadges.forEach(badge => {
            // Top Gifter Badges
            if (badge.badgeSceneType === 6) {
                badgesHTML.push(
                    `<span class="badge top-gifter">
                        <img src="${badge.url}" alt="${badge.displayType}">
                        <em>No. ${data.topGifterRank}</em>
                    </span>`
                );
            }

            // Scene Eight - Grade Badges
            if (badge.badgeSceneType === 8) {
                const match = badgesLevelEight.find(lv => badge.level >= lv.min && badge.level <= lv.max);
                if (match) {
                    badgesHTML.push(
                        `<span class="badge sceneEight">
                            <img src="${match.url}" alt="Level ${badge.level}">
                            <em> ${badge.level}</em>
                        </span>`
                    );
                }
            }

            // Scene Ten - Fan Badges
            if (badge.badgeSceneType === 10) {

                let badgeClasses = ['badge', 'sceneTen'];
                //if (badge.privilegeId == "7196929090442513157") { badgeClasses.push('inactive-fan'); }
                badgeClasses = badgeClasses.join(" ");

                const match = badgesLevelTen.find(lv => badge.level >= lv.min && badge.level <= lv.max);
                if (match) {
                    badgesHTML.push(
                        `<span class="${badgeClasses}">
                            <img src="${match.url}" alt="Level ${badge.level}">
                        </span>`
                    );
                }
            }
        });
    }

    badgesHTML = badgesHTML.filter(Boolean).join('');
    return badgesHTML;
}

async function getTiktokRoles(data) {

    const rolesArray = [];

    if (data.isSubscriber) rolesArray.push('subscriber')
    if (data.isModerator) rolesArray.push('moderator');

    const { userBadges } = data;

    const badgesLevelTen = [
        { min: 1,  max: 9,  class: 'fan-one fan-ten fan-twenty fan-thirty fan-forty fan-fifty' },
        { min: 10, max: 19, class: 'fan-ten fan-twenty fan-thirty fan-forty fan-fifty' },
        { min: 20, max: 29, class: 'fan-twenty fan-thirty fan-forty fan-fifty' },
        { min: 30, max: 39, class: 'fan-thirty fan-forty fan-fifty' },
        { min: 40, max: 49, class: 'fan-forty fan-fifty' },
        { min: 50, max: 500, class: 'fan-fifty' },
    ];

    if (userBadges.length > 0) {
        userBadges.forEach(badge => {
            // Top Gifter Badges
            if (badge.badgeSceneType === 6) rolesArray.push(`top-gifter-${badge.displayType}`);

            // Scene Ten - Fan Badges
            if (badge.badgeSceneType === 10) {
                const match = badgesLevelTen.find(lv => badge.level >= lv.min && badge.level <= lv.max);
                if (match) {
                    const classArrays = match.class.split(' ');
                    rolesArray.push(...classArrays);
                }
            }
        });
    }

    return rolesArray;
}




async function tiktokUpdateStatistics(data, type) {
    
    if (showPlatformStatistics == false || showTikTokStatistics == false) return;

    if (type == 'viewers') {
        const viewers = formatNumber(DOMPurify.sanitize(data.viewerCount)) || "0";
        document.querySelector('#statistics #tiktok .viewers span').textContent = viewers;
    }

    if (type == 'likes') {
        const likes = formatNumber(DOMPurify.sanitize(data.totalLikeCount)) || "0";
        document.querySelector('#statistics #tiktok .likes span').textContent = likes;
    }
    
}