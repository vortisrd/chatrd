/* ----------------------- */
/* TIKTOK MODULE VARIABLES */
/* ----------------------- */


const tikFinityStatus = {};

const showTiktok                    = getURLParam("showTiktok", false);

//const tiktokService                 = getURLParam("tiktokService", "tikfinity");
const tiktokService                 = "tikfinity";

const showTikTokMessages            = getURLParam("showTikTokMessages", true);
const showTikTokJoins               = getURLParam("showTikTokJoins", false);
const showTikTokFollows             = getURLParam("showTikTokFollows", true);
const showTikTokLikes               = getURLParam("showTikTokLikes", false);
const showTikTokShares              = getURLParam("showTikTokShares", false);
const showTikTokGifts               = getURLParam("showTikTokGifts", true);
const showTikTokSubs                = getURLParam("showTikTokSubs", true);
const tiktokFanClubTag              = getURLParam("tiktokFanClubTag", "");
const showTikTokStatistics          = getURLParam("showTikTokStatistics", true);

let tiktokStatistics = null;

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

/*
const tiktokMessageHandlers = {

    'General.Custom': (response) => {
        if (response.data?.data?.eventName === 'TikTok.EulerStream') {
            const type = response.data.data.event.type;
            const data = response.data.data.event.data;

            console.debug(`[ChatRD][TikTok][EulerStream][${type}]`, data);

            switch (type) {
                case 'eulerSuccess' :
                    notifySuccess({
                        title: 'ChatRD 🤝 Eulerstream',
                        text: `${data}`
                    });
                break;

                
                case 'eulerError' :
                    notifyError({
                        title: 'ChatRD ❌ Eulerstream',
                        text: `${data}`
                    });
                break;

                case 'eulerWarn' :
                    notifyWarning({
                        title: 'ChatRD ⚠️ Eulerstream',
                        text: `${data}`
                    })
                break;

                case 'WebcastChatMessage': tiktokChatMessageFromEulerStream(data); break;
                case 'WebcastMemberMessage' : tiktokJoinMessageFromEulerStream(data); break;
                case 'WebcastRoomUserSeqMessage': tiktokUpdateStatisticsFromEulerStream(data, 'viewers'); break;

                case 'WebcastLikeMessage':
                    tiktokLikesMessageFromEulerStream(data);
                    tiktokUpdateStatisticsFromEulerStream(data, 'likes');
                break;

                case 'WebcastGiftMessage': tiktokGiftMessageFromEulerStream(data); break;
                
                case 'WebcastSocialMessage':
                    
                    switch (data.event.eventDetails.displayType) {
                        case "pm_main_follow_message_viewer_2": tiktokFollowMessageFromEulerStream(data); break;
                        case "pm_mt_guidance_share": tiktokShareMessageFromEulerStream(data); break;
                    }
                    
                break;

                case 'WebcastSubNotifyMessage': tiktokSubMessageFromEulerStream(data); break;
            }
        }
    }

};
*/


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
        
        waitForStreamerBot('TikTok').then(() => {
            /*if (tiktokService == 'tikfinity') {
                tiktokConnection();
            }
            if (tiktokService == 'eulerstream') {
                registerPlatformHandlersToStreamerBot(tiktokMessageHandlers, '[ChatRD][TikTok][Streamer.bot]');
            }*/

            tiktokConnection();
            
        });
    }
});


// -----------------------
// TIKTOK CONNECT HANDLER

async function tiktokConnection() {
    const tikfinityWebSocketURL = 'ws://localhost:21213/';
    const reconnectDelay = 10000; 
    const maxTries = 20;
    let retryCount = 0;
    let errorLogged = false; 

    function connect() {
        const tikfinityWebSocket = new WebSocket(tikfinityWebSocketURL);

        tikfinityWebSocket.onopen = () => {
            console.debug(`[ChatRD][TikFinity] Connected to TikFinity successfully!`);
            retryCount = 0;
            errorLogged = false; 

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
            if (!errorLogged) {
                console.error(`[ChatRD][TikFinity] Connection error:`, error);

                if (tikFinityStatus.error == false) {
                    notifyError({
                        title: 'ChatRD ⚠️ TikFinty',
                        text: ``
                    });
                }

                errorLogged = true;
            }

            if (tikfinityWebSocket.readyState !== WebSocket.CLOSED) {
                tikfinityWebSocket.close();
            }

            tikFinityStatus.connected = false;
            tikFinityStatus.disconnected = true;
            tikFinityStatus.error = true;
        };

        return tikfinityWebSocket;
    }

    return connect();
}













// ---------------------------
// TIKTOK UTILITY FUNCTIONS

async function tiktokChatMessage(data) {
    
    if (!data?.comment) { data.comment = " "; }
    if (showTikTokMessages == false) return;
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
    const avatarImage = data.profilePictureUrl;
    
    const [badgesHTML, roles] = await Promise.all([
        getTikTokBadges(data),
        getTiktokRoles(data)
    ]);

    if (data.uniqueId === data.tikfinityUsername) roles.push('streamer');
    if (data.isModerator) roles.push('moderator');
    if (data.isSubscriber) roles.push('subscriber');

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

    if (roles.length == 0) roles.push('user');
    classes.push(...roles);

    message.textContent = data.comment;
    await getTikTokEmotes(data, message),

    addMessageItem('tiktok', clone, classes, userId, messageId);
}
async function tiktokChatMessageFromEulerStream(data) {
    
    if (!data?.comment) { data.comment = " "; }
    if (showTikTokMessages == false) return;
    if (ignoreUserList.includes(data.user.uniqueId.toLowerCase())) return;
    if (data.comment.startsWith("!") && excludeCommands == true) return;

	const template = chatTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.event.msgId;
    const userId = data.user.userId;

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
    
    const avatarImage = data.user.profilePicture.urls[0]
    const badgesHTML = await getTikTokBadgesFromEulerStream(data);
    const roles = await getTiktokRolesFromEulerStream(data);

    if (data.userIdentity.isModeratorOfAnchor) roles.push('moderator');
    if (data.userIdentity.isSubscriberOfAnchor) roles.push('subscriber');

    header.remove();
    firstMessage.remove();

    sharedChat.remove();

    if (data.atUser) {
        classes.push('reply');
        reply.insertAdjacentHTML('beforeend', ` ${tRD('tiktok.reply_label', { user: escapeHTML(data.atUser.nickname) })}`);
    }
    else {
        reply.remove();
    }

    pronoun.remove();

    if (showAvatar) avatar.innerHTML = `<img src="${avatarImage}">`; else avatar.remove();
    
    if (showBadges) {
        if (!badgesHTML) { badges.remove(); }
        else { badges.innerHTML = badgesHTML; }
     }
    else { badges.remove(); }

    var color = await createRandomColor('tiktok', data.user.uniqueId);


    const userLinkElement = user.querySelector('a');
    const userLink = `https://tiktok.com/@${data.user.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.style = `--user-color: ${color}`;
    userLinkElement.textContent = data.user.nickname;
    userLinkElement.title = `${data.user.nickname} @ ${userLink}`;

    if (roles.length == 0) roles.push('user');
    classes.push(...roles);

    message.textContent = data.comment;
    await getTikTokEmotesForEulerStream(data, message),

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
    
    const userLinkElement = user.querySelector('a');
    const userLink = `https://tiktok.com/@${data.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = data.nickname;
    userLinkElement.title = `${data.nickname} @ ${userLink}`;

    action.innerHTML = tRD('tiktok.follow_action');

    addEventItem('tiktok', clone, classes, userId, messageId);
}
async function tiktokFollowMessageFromEulerStream(data) {

    if (showTikTokFollows == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.event.msgId;
    const userId = data.user.userId;

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

    const userLinkElement = user.querySelector('a');
    const userLink = `https://tiktok.com/@${data.user.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = data.user.nickname;
    userLinkElement.title = `${data.user.nickname} @ ${userLink}`;
    
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
    
    const userLinkElement = user.querySelector('a');
    const userLink = `https://tiktok.com/@${data.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = data.nickname;
    userLinkElement.title = `${data.nickname} @ ${userLink}`;

    action.innerHTML = tRD('tiktok.share_action');

    addEventItem('tiktok', clone, classes, userId, messageId);
}
async function tiktokShareMessageFromEulerStream(data) {

    if (showTikTokShares == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.event.msgId;
    const userId = data.user.userId;

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
    
    const userLinkElement = user.querySelector('a');
    const userLink = `https://tiktok.com/@${data.user.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = data.user.nickname;
    userLinkElement.title = `${data.user.nickname} @ ${userLink}`;

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

    let userLinkElement = user.querySelector('a');
    let userLink = `https://tiktok.com/@${data.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = data.nickname;
    userLinkElement.title = `${data.nickname} @ ${userLink}`;

    action.innerHTML = tRD('tiktok.join_action');
    
    const joinElement = [...chatContainer.querySelectorAll(".event.tiktok.join")].at(-1);
    
    if (!joinElement) {
        addEventItem('tiktok', clone, classes, userId, messageId);
        return;
    };

    const joinParent = joinElement.parentNode;
    const messageElement = joinElement.querySelector('.message');

    const animateClass = (chatHorizontal == true) ? 'animate__fadeInRight' : 'animate__fadeInUp';

    joinElement.dataset.user = userId;
    joinElement.id = messageId;

    userLinkElement = joinElement.querySelector('span.user a');
    userLink = `https://tiktok.com/@${data.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = data.nickname;
    userLinkElement.title = `${data.nickname} @ ${userLink}`;

    messageElement.classList.add('animate__animated', 'animate__faster', animateClass);
    
    appendOrPrepend(chatContainer, joinParent);

}
async function tiktokJoinMessageFromEulerStream(data) {
    
    if (showTikTokJoins == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.event.msgId;
    const userId = data.user.userId;

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

    let userLinkElement = user.querySelector('a');
    let userLink = `https://tiktok.com/@${data.user.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = data.user.nickname;
    userLinkElement.title = `${data.user.nickname} @ ${userLink}`;

    action.innerHTML = tRD('tiktok.join_action');
    
    const joinElement = [...chatContainer.querySelectorAll(".event.tiktok.join")].at(-1);
    
    if (!joinElement) {
        addEventItem('tiktok', clone, classes, userId, messageId);
        return;
    };

    const joinParent = joinElement.parentNode;
    const messageElement = joinElement.querySelector('.message');

    const animateClass = (chatHorizontal == true) ? 'animate__fadeInRight' : 'animate__fadeInUp';

    userLinkElement = joinElement.querySelector('span.user a');
    userLink = `https://tiktok.com/@${data.user.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = data.user.nickname;
    userLinkElement.title = `${data.user.nickname} @ ${userLink}`;

    messageElement.classList.add('animate__animated', 'animate__faster', animateClass);
    
    appendOrPrepend(chatContainer, joinParent);

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
    
    const previousLikeContainer = chatContainer.querySelector(`div.event.tiktok.likes[data-user="${data.userId}"]`);
    const previousLikeContainerParent = previousLikeContainer?.parentNode;

    if (previousLikeContainer) {
        const likeCountElem = previousLikeContainer.querySelector('.value strong');
        const animateClass = (chatHorizontal == true) ? 'animate__fadeInRight' : 'animate__fadeInUp';

        previousLikeContainerParent.classList.add('animate__animated', 'animate__faster', animateClass);
        if (likeCountElem) {
            var likeCountPrev = parseInt(likeCountElem.textContent);
            likeCountTotal = Math.floor(likeCountPrev + likeCountTotal);
            likeCountElem.textContent = likeCountTotal;

            appendOrPrepend(chatContainer, previousLikeContainerParent);
        }
    }
    else {

        header.remove();
        
        const userLinkElement = user.querySelector('a');
        const userLink = `https://tiktok.com/@${data.uniqueId}`;

        userLinkElement.href = userLink;
        userLinkElement.target = '_blank';
        userLinkElement.textContent = data.nickname;
        userLinkElement.title = `${data.nickname} @ ${userLink}`;

        action.innerHTML = tRD('tiktok.likes_action');

        var likes = likeCountTotal > 1 ? tRD('tiktok.likes_plural') : tRD('tiktok.likes_singular');
        value.innerHTML = `<strong>${likeCountTotal}</strong> ${likes} ❤️`;

        message.remove();

        addEventItem('tiktok', clone, classes, userId, messageId);

    }
}
async function tiktokLikesMessageFromEulerStream(data) {

    if (showTikTokLikes == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.event.msgId;
    const userId = data.user.userId;

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
    
    const previousLikeContainer = chatContainer.querySelector(`div.event.tiktok.likes[data-user="${data.user.userId}"]`);
    const previousLikeContainerParent = previousLikeContainer?.parentNode;

    if (previousLikeContainer) {
        const likeCountElem = previousLikeContainer.querySelector('.value strong');
        const animateClass = (chatHorizontal == true) ? 'animate__fadeInRight' : 'animate__fadeInUp';

        previousLikeContainerParent.classList.add('animate__animated', 'animate__faster', animateClass);
        if (likeCountElem) {
            var likeCountPrev = parseInt(likeCountElem.textContent);
            likeCountTotal = Math.floor(likeCountPrev + likeCountTotal);
            likeCountElem.textContent = likeCountTotal;
            
            appendOrPrepend(chatContainer, previousLikeContainerParent);
        }
    }
    else {

        header.remove();
        
        const userLinkElement = user.querySelector('a');
        const userLink = `https://tiktok.com/@${data.user.uniqueId}`;

        userLinkElement.href = userLink;
        userLinkElement.target = '_blank';
        userLinkElement.textContent = data.user.nickname;
        userLinkElement.title = `${data.user.nickname} @ ${userLink}`;

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

    const userLinkElement = user.querySelector('a');
    const userLink = `https://tiktok.com/@${data.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = data.nickname;
    userLinkElement.title = `${data.nickname} @ ${userLink}`;

    action.innerHTML = tRD('tiktok.sub_action');

    value.remove();
    message.remove();

    addEventItem('tiktok', clone, classes, userId, messageId);
}
async function tiktokSubMessageFromEulerStream(data) {

    if (showTikTokSubs == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.event.msgId;
    const userId = data.user.userId;

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

    const userLinkElement = user.querySelector('a');
    const userLink = `https://tiktok.com/@${data.user.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = data.user.nickname;
    userLinkElement.title = `${data.user.nickname} @ ${userLink}`;

    action.innerHTML = tRD('tiktok.sub_action');

    value.remove();
    message.remove();

    addEventItem('tiktok', clone, classes, userId, messageId);
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

    header.remove();

    let coins = Math.floor(data.repeatCount*data.diamondCount);

    const tikTokGiftMatch = tiktokGiftsClasses.find(lv => coins >= lv.min && coins <= lv.max);
    classes.push(tikTokGiftMatch.class);

    const userLinkElement = user.querySelector('a');
    const userLink = `https://tiktok.com/@${data.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = data.nickname;
    userLinkElement.title = `${data.nickname} @ ${userLink}`;

    action.innerHTML = tRD('tiktok.gift_action', { count: data.repeatCount, name: data.giftName });

    const rotateDeg = (Math.random() * 60 - 30).toFixed(1) + 'deg';

    const giftHtml = renderGiftEventSuffix({
        image : `<img style="--rotateGift: ${rotateDeg}" src="${data.giftPictureUrl}" alt="${data.giftName}">`, 
        value : `<img src="js/modules/tiktok/images/icon-tiktokcoin.svg" alt="Coins"> ${coins}`
    });

    value.innerHTML = giftHtml;

    message.remove();

    addEventItem('tiktok', clone, classes, userId, messageId);
}
async function tiktokGiftMessageFromEulerStream(data) {

    if (showTikTokGifts == false) return;
    if (data.giftDetails.giftType === 1 && !data.repeatEnd) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = data.event.msgId;
    const userId = data.user.userId;

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

    header.remove();

    let coins = Math.floor(data.repeatCount*data.giftDetails.diamondCount);

    const tikTokGiftMatch = tiktokGiftsClasses.find(lv => coins >= lv.min && coins <= lv.max);
    classes.push(tikTokGiftMatch.class);

    const userLinkElement = user.querySelector('a');
    const userLink = `https://tiktok.com/@${data.user.uniqueId}`;

    userLinkElement.href = userLink;
    userLinkElement.target = '_blank';
    userLinkElement.textContent = data.user.nickname;
    userLinkElement.title = `${data.user.nickname} @ ${userLink}`;

    action.innerHTML = tRD('tiktok.gift_action', { count: data.repeatCount, name: data.giftDetails.giftName });

    const rotateDeg = (Math.random() * 60 - 30).toFixed(1) + 'deg';

    const giftHtml = renderGiftEventSuffix({
        image : `<img style="--rotateGift: ${rotateDeg}" src="${data.giftDetails.giftImage.giftPictureUrl}" alt="${data.giftDetails.giftName}">`, 
        value : `<img src="js/modules/tiktok/images/icon-tiktokcoin.svg" alt="Coins"> ${coins}`
    });

    value.innerHTML = giftHtml;

    message.remove();

    addEventItem('tiktok', clone, classes, userId, messageId);
}



const CUSTOM_EMOJI_BASE_PATH = 'js/modules/tiktok/addon-different-chat-emojis-images/';
const CUSTOM_EMOJI_REGEX = /\[[a-zA-Z0-9_]+\]/g;

function appendTextWithCustomEmojis(container, text) {
    let lastIndex = 0;
    let match;

    CUSTOM_EMOJI_REGEX.lastIndex = 0;

    while ((match = CUSTOM_EMOJI_REGEX.exec(text)) !== null) {
        const token = match[0];
        const value = tikTokChatEmojis[token];
        if (value === undefined) {
            continue;
        }

        if (match.index > lastIndex) {
            container.appendChild(
                document.createTextNode(text.slice(lastIndex, match.index))
            );
        }

        if (value.endsWith('.png')) {
            const img = document.createElement('img');
            img.src = CUSTOM_EMOJI_BASE_PATH + value;
            img.className = 'emote custom-emote';
            img.alt = token;
            img.dataset.emoteName = token;
            img.onerror = () => (img.outerHTML = token);
            container.appendChild(img);
        }
        else {
            container.appendChild(document.createTextNode(value));
        }

        lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
        container.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
}
async function getTikTokEmotes(data, messageElement) {
    const {
        comment: message,
        emotes,
    } = data;

    messageElement.innerHTML = '';

    if (!emotes || emotes.length === 0) {
        appendTextWithCustomEmojis(messageElement, message);
        return;
    }

    const sorted = [...emotes].sort((a, b) => a.placeInComment - b.placeInComment);

    let lastIndex = 0;

    for (const emote of sorted) {
        const position = emote.placeInComment;

        if (lastIndex < position) {
            const text = message.slice(lastIndex, position);
            appendTextWithCustomEmojis(messageElement, text);
        }

        const img = document.createElement('img');
        img.src = emote.emoteImageUrl;
        img.className = 'emote';
        img.dataset.emoteId = emote.emoteId;
        img.onerror = () => (img.outerHTML = emote.emoteId);
        messageElement.appendChild(img);

        lastIndex = position + 1;
    }

    if (lastIndex < message.length) {
        const text = message.slice(lastIndex);
        appendTextWithCustomEmojis(messageElement, text);
    }
}
async function getTikTokEmotesForEulerStream(data, messageElement) {
    const {
        comment: message,
        emotes,
    } = data;

    messageElement.innerHTML = '';

    if (!emotes || emotes.length === 0) {
        appendTextWithCustomEmojis(messageElement, message);
        return;
    }

    const sorted = [...emotes].sort((a, b) => a.placeInComment - b.placeInComment);

    let lastIndex = 0;

    for (const emote of sorted) {
        const position = emote.placeInComment;

        if (lastIndex < position) {
            const text = message.slice(lastIndex, position);
            appendTextWithCustomEmojis(messageElement, text);
        }

        const img = document.createElement('img');
        img.src = emote.emote.image.imageUrl;
        img.className = 'emote';
        img.dataset.emoteId = emote.emote.emoteId;
        img.onerror = () => (img.outerHTML = emote.emote.emoteId);
        messageElement.appendChild(img);

        lastIndex = position + 1;
    }

    if (lastIndex < message.length) {
        const text = message.slice(lastIndex);
        appendTextWithCustomEmojis(messageElement, text);
    }
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
                            <em>${badge.level}</em>
                        </span>`
                    );
                }
            }

            // Scene Ten - Fan Badges
            if (badge.badgeSceneType === 10) {

                let badgeClasses = ['badge', 'sceneTen'];
                badgeClasses = badgeClasses.join(" ");

                const match = badgesLevelTen.find(lv => badge.level >= lv.min && badge.level <= lv.max);
                if (match) {
                    badgesHTML.push(
                        `<span class="${badgeClasses}">
                            <img src="${match.url}" alt="Level ${badge.level}">
                            <em>${tiktokFanClubTag}</em>
                        </span>`
                    );
                }
            }
        });
    }

    badgesHTML = badgesHTML.filter(Boolean).join('');
    return badgesHTML;
}
async function getTikTokBadgesFromEulerStream(data) {

    const isModerator = data.userIdentity.isModeratorOfAnchor;
    const isSubscriber = data.userIdentity.isSubscriberOfAnchor;
    const userBadges = data.user.badges;

    let badgesHTML = [
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

            let rankLabel;

            if (tiktokStatistics != null) {
                rankLabel = getViewerRankFromEulerStream(tiktokStatistics, data.user.uniqueId);
                if (badge.badgeSceneType === 6 && badge.imageBadges?.length > 0) {
                    const imageBadge = badge.imageBadges[0]
                    badgesHTML.push(
                        `<span class="badge top-gifter">
                            <img src="${imageBadge.image.url}" alt="${imageBadge.displayType}">
                            <em>No. ${rankLabel}</em>
                        </span>`
                    );
                }
            }

            // Scene Eight - Grade Badges
            if (badge.badgeSceneType === 8) {
                const level = badge.privilegeLogExtra.level;
                const match = badgesLevelEight.find(lv => level >= lv.min && level <= lv.max);
                if (match) {
                    badgesHTML.push(
                        `<span class="badge sceneEight">
                            <img src="${match.url}" alt="Level ${level}">
                            <em>${level}</em>
                        </span>`
                    );
                }
            }

            // Scene Ten - Fan Badges
            if (badge.badgeSceneType === 10) {

                let badgeClasses = ['badge', 'sceneTen'];
                badgeClasses = badgeClasses.join(" ");
                
                const level = badge.privilegeLogExtra.level;
                const match = badgesLevelTen.find(lv => level >= lv.min && level <= lv.max);
                if (match) {
                    badgesHTML.push(
                        `<span class="${badgeClasses}">
                            <img src="${match.url}" alt="Level ${level}">
                            <em>${tiktokFanClubTag}</em>
                        </span>`
                    );
                }
            }
        });
    }

    badgesHTML = badgesHTML.filter(Boolean).join('');
    return badgesHTML;
}
function getViewerRankFromEulerStream(data, uniqueId) {
    const topViewers = data?.topViewers ?? [];

    const index = topViewers.findIndex(
        (entry) => entry.user?.uniqueId === uniqueId
    );

    if (index === -1) return null;
    return index + 1;
}



async function getTiktokRoles(data) {

    const rolesArray = [];

    if (data.uniqueId === data.tikfinityUsername) rolesArray.push('streamer');
    if (data.isModerator) rolesArray.push('moderator');
    if (data.isSubscriber) rolesArray.push('subscriber');

    const { userBadges } = data;

    const badgesLevelEight = [
        { min: 1,  max: 4,  class: 'grade-one' },
        { min: 5,  max: 9,  class: 'grade-one grade-five' },
        { min: 10, max: 14, class: 'grade-one grade-five grade-ten' },
        { min: 15, max: 19, class: 'grade-one grade-five grade-ten grade-fifteen' },
        { min: 20, max: 24, class: 'grade-one grade-five grade-ten grade-fifteen grade-twenty' },
        { min: 25, max: 29, class: 'grade-one grade-five grade-ten grade-fifteen grade-twenty grade-twentyfive' },
        { min: 30, max: 34, class: 'grade-one grade-five grade-ten grade-fifteen grade-twenty grade-twentyfive grade-thirty' },
        { min: 35, max: 39, class: 'grade-one grade-five grade-ten grade-fifteen grade-twenty grade-twentyfive grade-thirty grade-thirtyfive' },
        { min: 40, max: 44, class: 'grade-one grade-five grade-ten grade-fifteen grade-twenty grade-twentyfive grade-thirty grade-thirtyfive grade-forty' },
        { min: 45, max: 49, class: 'grade-one grade-five grade-ten grade-fifteen grade-twenty grade-twentyfive grade-thirty grade-thirtyfive grade-forty grade-fortyfive' },
        { min: 50, max: 500, class: 'grade-one grade-five grade-ten grade-fifteen grade-twenty grade-twentyfive grade-thirty grade-thirtyfive grade-forty grade-fortyfive grade-fifty' },
    ];

    const badgesLevelTen = [
        { min: 1,  max: 9,  class: 'fan-one fan-ten fan-twenty fan-thirty fan-forty fan-fifty' },
        { min: 10, max: 19, class: 'fan-ten fan-twenty fan-thirty fan-forty fan-fifty' },
        { min: 20, max: 29, class: 'fan-twenty fan-thirty fan-forty fan-fifty' },
        { min: 30, max: 39, class: 'fan-thirty fan-forty fan-fifty' },
        { min: 40, max: 49, class: 'fan-forty fan-fifty' },
        { min: 50, max: 500, class: 'fan-fifty' },
    ];

    if (userBadges?.length > 0) {
        userBadges.forEach(badge => {
            // Top Gifter Badges
            if (badge.badgeSceneType === 6) rolesArray.push(`top-gifter-${data.topGifterRank}`);

            // Scene Ten - Fan Badges
            if (badge.badgeSceneType === 10) {
                const match = badgesLevelTen.find(lv => badge.level >= lv.min && badge.level <= lv.max);
                if (match) {
                    const classArrays = match.class.split(' ');
                    rolesArray.push(...classArrays);
                }
            }

            

            // Scene Eight - Grade Badges
            if (badge.badgeSceneType === 8) {
                const match = badgesLevelEight.find(lv => badge.level >= lv.min && badge.level <= lv.max);
                if (match) {
                    const classArrays = match.class.split(' ');
                    rolesArray.push(...classArrays);
                }
            }


        });
    }

    return rolesArray;
}
async function getTiktokRolesFromEulerStream(data) {

    const rolesArray = [];
    
    const userBadges = data.user.badges;

    const badgesLevelTen = [
        { min: 1,  max: 9,  class: 'fan-one fan-ten fan-twenty fan-thirty fan-forty fan-fifty' },
        { min: 10, max: 19, class: 'fan-ten fan-twenty fan-thirty fan-forty fan-fifty' },
        { min: 20, max: 29, class: 'fan-twenty fan-thirty fan-forty fan-fifty' },
        { min: 30, max: 39, class: 'fan-thirty fan-forty fan-fifty' },
        { min: 40, max: 49, class: 'fan-forty fan-fifty' },
        { min: 50, max: 500, class: 'fan-fifty' },
    ];

    if ((userBadges) && (userBadges.length > 0)) {
        userBadges.forEach(badge => {
            // Top Gifter Badges

            let rankLabel;
            if (tiktokStatistics != null) rankLabel = getViewerRankFromEulerStream(tiktokStatistics, data.user.uniqueId);

            // Top Gifter Badges
            if (badge.badgeSceneType === 6 && badge.imageBadges?.length > 0) {
                rolesArray.push(`top-gifter-${rankLabel}`);
            }

            // Scene Ten - Fan Badges
            if (badge.badgeSceneType === 10) {
                const level = badge.privilegeLogExtra.level;
                const match = badgesLevelTen.find(lv => level >= lv.min && level <= lv.max);
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
        const span = document.querySelector('#statistics #tiktok .viewers span');
        
        span.textContent = viewers;
        span.dataset.viewers = data.viewerCount;
        
        combinedViewerStatistics();
    }

    if (type == 'likes') {
        const likes = formatNumber(DOMPurify.sanitize(data.totalLikeCount)) || "0";
        document.querySelector('#statistics #tiktok .likes span').textContent = likes;
    }
    
}
async function tiktokUpdateStatisticsFromEulerStream(data, type) {
    
    if (type == 'viewers') tiktokStatistics = data;
    
    if (showPlatformStatistics == false || showTikTokStatistics == false) return;

    if (type == 'viewers') {
        const viewers = formatNumber(DOMPurify.sanitize(data.viewerCount)) || "0";
        const span = document.querySelector('#statistics #tiktok .viewers span');
        
        span.textContent = viewers;
        span.dataset.viewers = data.viewerCount;
        
        combinedViewerStatistics();
    }

    if (type == 'likes') {
        const likes = formatNumber(DOMPurify.sanitize(data.totalLikeCount)) || "0";
        document.querySelector('#statistics #tiktok .likes span').textContent = likes;
    }
    
}












/*

1 até 4: rgba(120, 158, 231, 0.6)
5 ao 9: rgba(95, 144, 239, 0.6)
10 até 14: rgba(63, 125, 246, 0.6)
15 até 19:rgba(71, 126, 255, 0.7)
20 até 24: rgba(71, 90, 255, 0.7)
25 até 29: rgba(39, 47, 243, 0.7)
30 até 34: rgba(42, 25, 238, 0.75)

Fan: rgba(255, 78, 58, 0.5)
Super-Fan: 
*/