/* ----------------------- */
/*         OPTIONS         */
/* ----------------------- */

let myConfetti;
let scroll;

const preview                       = getURLParam("preview", false);
const showPlatform                  = getURLParam("showPlatform", true);
const showAvatar                    = getURLParam("showAvatar", true);
const showTimestamps                = getURLParam("showTimestamps", true);
const ampm                          = getURLParamLegacy("ampmTimeStamps", () => getURLParam("ampm", false));
const showBadges                    = getURLParam("showBadges", true);
const showPlatformStatistics        = getURLParam("showPlatformStatistics", true);
const combineViewers                = getURLParam("combineViewers", false);

const chatThreshold                 = 100;
const chatOneLine                   = getURLParam("chatOneLine", false);
const chatHorizontal                = getURLParam("chatHorizontal", false); 
const chatMessageGroup              = getURLParam("chatMessageGroup", false);

const size                          = getURLParamLegacy("chatFontSize", () => getURLParam("size", 1));
const chatFontFamily                = getURLParam("chatFontFamily", "DM Sans");
const outline                       = getURLParam("outline", false);
const animation                     = getURLParam("animation", "default");
const orientation                   = getURLParam("orientation", "btt");
const direction                     = getURLParam("direction", "ltr");

const playSound                     = getURLParam("playSound", false);
const playSoundOnChat               = getURLParam("playSoundOnChat", false);
const playSoundOnEvents             = getURLParam("playSoundOnEvents", false);
const playSoundVolume               = getURLParam("playSoundVolume", 0.5);
const playSoundFile                 = getURLParam("playSoundFile", "retro-game");
const playMsgBatch                  = getURLParam("playMsgBatch", 1);
const playMsgSilence                = getURLParam("playMsgSilence", 1);

const chatBackground                = getURLParam("chatBackground", "#121212"); 
const chatBackgroundOpacity         = getURLParam("chatBackgroundOpacity", 0); 
const scrollbar                     = getURLParamLegacy("chatScrollBar", () => getURLParam("scrollbar", false));
const chatField                     = getURLParam("chatField", false);
const chatModeration                = getURLParam("chatModeration", false);

const skin                          = getURLParamLegacy("chatrdSkin", () => getURLParam("skin", "default"));

const excludeCommands               = getURLParam("excludeCommands", true);
const ignoreChatters                = getURLParam("ignoreChatters", "");
const ignoreUserList                = ignoreChatters.split(',').map(item => item.trim().toLowerCase()) || [];

const hide                          = getURLParamLegacy("hideAfter", () => getURLParam("hide", 0));

const showTwitchEmbedImages         = getURLParam("showTwitchEmbedImages", false);
const twitchEmbedImageRoles         = getURLParam("twitchEmbedImageRoles", "streamer,moderator");

const showYouTubeEmbedImages        = getURLParam("showYouTubeEmbedImages", false);
const youtubeEmbedImageRoles        = getURLParam("youtubeEmbedImageRoles", "streamer,moderator");

const showKickEmbedImages           = getURLParam("showKickEmbedImages", false);
const kickEmbedImageRoles           = getURLParam("kickEmbedImageRoles", "broadcaster,moderator");

const tiktokEmbedImageRoles         = getURLParam("tiktokEmbedImageRoles", "streamer,moderator");

const embedImageConfig = {
    twitch: { enabled: showTwitchEmbedImages, roles: twitchEmbedImageRoles },
    youtube: { enabled: showYouTubeEmbedImages, roles: youtubeEmbedImageRoles },
    kick: { enabled: showKickEmbedImages, roles: kickEmbedImageRoles },
};

const twitchTTSRoles         = getURLParam("twitchTTSRoles", "user");
const youtubeTTSRoles        = getURLParam("youtubeTTSRoles", "user");
const kickTTSRoles           = getURLParam("kickTTSRoles", "user");
const tiktokTTSRoles         = getURLParam("tiktokTTSRoles", "user");

const imageEmbeddingFilter   = getURLParam("imageEmbeddingFilter", false);
const imageEmbeddingFilterDomains   = getURLParam("imageEmbeddingFilterDomains", "");







const chatWrapper                   = document.querySelector('#container');
const chatContainer                 = document.querySelector('#chat');
const chatGhostContainer            = document.querySelector('#chat-ghost');
const eventLittleContainer          = document.querySelector('#little-events');
const chatTemplate                  = document.querySelector('#chat-message');
const eventTemplate                 = document.querySelector('#event-message');









/* Idem — montado uma única vez (antes era recriado a cada chamada
   de speakerBotTTSRead) */
const embedTTSConfig = {
    twitch: { roles: twitchTTSRoles },
    youtube: { roles: youtubeTTSRoles },
    kick: { roles: kickTTSRoles },
    tiktok: { roles: tiktokTTSRoles }
};

const userColors = new Map();

const loadedEmotes = new Set();


const SKINS = {
    default: "skin-default.css?nocache=74",
    nutting: "skin-nutting.css?nocache=74",
    kimballs: "skin-kimballs.css?nocache=74",
    bubbles: "skin-bubbles.css?nocache=74",
    'star-wars': "skin-star-wars.css?nocache=74"
};



const skinFile = SKINS[skin] || SKINS.default;
const skinLink = document.getElementById("chatrd-skins");
skinLink.href = `css/${skinFile}`;

const chatRDBody = document.body;
chatRDBody.style.fontFamily = chatFontFamily;

if (outline) chatContainer.classList.add('outline');







if (showPlatformStatistics == true) {
    statistics.style.display = '';

    const combinedViewersHtml = `
        <div class="platform" id="combine-viewers" style="display: none;">
            <span class="viewers"><i class="fa-solid fa-user"></i> <span>0</span></span>
        </div>
    `;

    statistics.insertAdjacentHTML('afterbegin', combinedViewersHtml);

    if (combineViewers) {
        statistics.classList.add('combined');
        document.querySelector('#combine-viewers').style.display = '';
    }

}


async function combinedViewerStatistics() {

    if (combineViewers) {

        if (statistics.children.length > 0) {

            const combineTargetSpan = statistics.querySelector('#combine-viewers .viewers > span');

            if (!combineTargetSpan) {
                return;
            }

            const viewerNumberSpans = statistics.querySelectorAll(
                '.platform:not(#combine-viewers) .viewers > span'
            );

            let total = 0;

            viewerNumberSpans.forEach(span => {
                const rawValue = span.getAttribute('data-viewers');
                const value = rawValue ? parseInt(rawValue.trim(), 10) : NaN;

                if (!isNaN(value)) {
                    total += value;
                }
            });

            combineTargetSpan.textContent = formatNumber(total);
        }

    }

}









if (scrollbar == false) { chatContainer.classList.add('noscrollbar'); }
if (chatOneLine == true && !chatHorizontal) {
    chatContainer.classList.add('oneline');
    chatGhostContainer.classList.add('oneline');
}

if (chatHorizontal == true) {
    chatContainer.classList.remove('oneline');
    chatContainer.classList.add('horizontal');
    chatGhostContainer.classList.remove('oneline');
    chatGhostContainer.classList.add('horizontal');
}

if (!chatHorizontal && !chatOneLine) {
    chatContainer.classList.add('vertical');
    chatGhostContainer.classList.add('vertical');
}

let backgroundColor = hexToRGBA(chatBackground,chatBackgroundOpacity);
chatWrapper.style.backgroundColor = backgroundColor;

if (preview == true) {
    document.body.classList.add('preview');
}

document.querySelector('#bars').style.zoom = size;
document.querySelector('#bars').classList.add( direction );

chatContainer.style.zoom = size;
chatGhostContainer.style.zoom = size;

chatContainer.classList.add( direction, orientation );
chatGhostContainer.classList.add( direction, orientation );

if (chatField) {
    const chatfieldelement = document.getElementById("chat-input");
    chatfieldelement.style.display = '';
}














let pendingNotificationCount = 0;
let notificationSilenceTimer = null;

function queueNotificationSound() {
    pendingNotificationCount++;

    if (notificationSilenceTimer) {
        clearTimeout(notificationSilenceTimer);
        notificationSilenceTimer = null;
    }

    if (pendingNotificationCount >= playMsgBatch) {
        chatrdPlaySound(playSoundFile, playSoundVolume);
        pendingNotificationCount = 0;
        return;
    }

    notificationSilenceTimer = setTimeout(() => {
        if (pendingNotificationCount > 0) {
            chatrdPlaySound(playSoundFile, playSoundVolume);
        }
        pendingNotificationCount = 0;
        notificationSilenceTimer = null;
    }, Math.floor(playMsgSilence * 1000));
}








async function appendOrPrepend(target,content) {
    if (chatHorizontal) {
        target.prepend(content);
        return;
    }

    function reverseContainerChildren(container) {
        const children = Array.from(container.children);
        const fragment = document.createDocumentFragment();
        for (let i = children.length - 1; i >= 0; i--) {
            fragment.appendChild(children[i]);
        }
        container.appendChild(fragment);
    }

    function setChatDirection(container, reversed) {
        const targetClass = reversed ? 'btt' : 'twitch-chat';

        if (!container.classList.contains(targetClass)) {
            reverseContainerChildren(container);
            container.classList.toggle('btt', reversed);
            container.classList.toggle('twitch-chat', !reversed);
        }
    }

    if (orientation === "twitch-chat") {
        const overflowing = chatContainer.scrollHeight > chatWrapper.offsetHeight;
        setChatDirection(chatContainer, overflowing);
        overflowing ? target.prepend(content) : target.append(content);
    }
    
    else {
        target.prepend(content);
    }
}

async function animateItemEntry(root, messageid) {
	function addToChatContainer(wrapper) {
        appendOrPrepend(chatContainer, wrapper);
        scroll?.onPrepend();
    }

	const dimensionProp = chatHorizontal ? 'Width' : 'Height';

	if ((document.hidden) || (animation == "none")) {
		const target = root.parentNode ?? root;
		const wrapper = document.createElement('div');
		wrapper.classList.add('chat-element-wrapper');
		wrapper.appendChild(target);

		addToChatContainer(wrapper);
		root.dataset.rendered = 'true';

		if (hide > 0) {
			const item = document.getElementById(messageid);
			if (item) {
				setTimeout(() => {
					item.parentNode.remove();
				}, Math.floor(hide * 1000));
			}
		}

		return;
	}

	const ghostClone = root.cloneNode(true);
	const ghostImages = [...ghostClone.querySelectorAll('img')];
	await Promise.all(ghostImages.map(img => {
		if (img.complete) return Promise.resolve();
		return Promise.race([
			new Promise(resolve => {
				img.addEventListener('load', resolve);
				img.addEventListener('error', resolve);
			}),
			new Promise(resolve => setTimeout(resolve, 500))
		]);
	}));
	chatGhostContainer.prepend(ghostClone);

	const target = root.parentNode ?? root;
	const wrapper = document.createElement('div');
	wrapper.classList.add('chat-element-wrapper');
	wrapper.appendChild(target);

	if (animation === "default" || chatHorizontal) {
		wrapper.style[dimensionProp.toLowerCase()] = '0px';
		wrapper.style.opacity = '0';

		addToChatContainer(wrapper);

		void wrapper[`offset${dimensionProp}`];

		const itemDimension = chatHorizontal
		? ghostClone.offsetWidth || 0
		: ghostClone.offsetHeight || 0;

		wrapper.style[dimensionProp.toLowerCase()] = `${itemDimension}px`;
		//wrapper.dataset.pastheight = `${itemDimension}px`;
		wrapper.style.opacity = '1';

		setTimeout(function () {
			const item = document.getElementById(messageid);
			if (item) {
				item.parentNode.style.removeProperty('opacity');
				item.parentNode.style.removeProperty(dimensionProp.toLowerCase());
				item.dataset.rendered = 'true';

				ghostClone.remove();
			}
		}, 800);
	}

	else {
		const message = wrapper.querySelector('.message');
		message.classList.add('animate__animated', 'animate__faster', `animate__${animation}`);
		addToChatContainer(wrapper);
	}


	if (hide > 0) {
		const item = document.getElementById(messageid);
		if (item) {
			setTimeout(() => {
				item.parentNode.style.opacity = '0';
				setTimeout(() => {
					item.parentNode.remove();
				}, 800);
			}, Math.floor(hide * 1000));
		}
	}
}

function buildChatModerationHTML(platform, userid, messageid, streamerOfOrigin) {
    switch (platform) {
        case "twitch":
            return `<div class="chatmoderation">
                <button onclick="window.open('https://twitch.tv/popout/${streamerOfOrigin}/viewercard/${userid}', '_blank', 'noopener')" title="Twitch User Card"><i class="fa-regular fa-address-card"></i></button>
                <button onclick="executeModCommand(event, '/deletemessage ${messageid}')" title="Remove Message"><i class="fa-solid fa-trash-can"></i></button>
                <button onclick="executeModCommand(event, '/timeout ${userid}')" title="Timeout User"><i class="fa-solid fa-stopwatch"></i></button>
                <button onclick="executeModCommand(event, '/ban ${userid}')" title="Ban User"><i class="fa-solid fa-gavel"></i></button>
            </div>`;
        case "youtube":
            return `<div class="chatmoderation">
                <button onclick="executeModCommand(event, '/yt/timeout ${userid}')" title="Timeout User"><i class="fa-solid fa-stopwatch"></i></button>
                <button onclick="executeModCommand(event, '/yt/ban ${userid}')" title="Ban User"><i class="fa-solid fa-gavel"></i></button>
            </div>`;
        case "kick":
            return `<div class="chatmoderation">
                <button onclick="executeModCommand(event, '/kick/timeout ${userid}')" title="Timeout User"><i class="fa-solid fa-stopwatch"></i></button>
                <button onclick="executeModCommand(event, '/kick/ban ${userid}')" title="Ban User"><i class="fa-solid fa-gavel"></i></button>
            </div>`;
        default:
            return null;
    }
}

function addMessageItem(platform, clone, classes, userid, messageid) {
    removeExtraChatMessages();

    const root = clone.firstElementChild;
    root.classList.add(...classes);
    
    root.dataset.user = userid;
    root.id = messageid;

    const streamerOfOrigin = root.dataset.streamer;

    if (showSpeakerbot == true && speakerBotChatRead == true) { speakerBotTTSRead(clone, 'chat', platform); }
    
    getAndReplaceLinks(platform, root);

    const platformElement = clone.querySelector('.platform');
    
    if (showPlatform == true) {
        let platformContent;

        if (root.classList.contains('youtube-vertical')) {
            platformContent = `<img src="js/modules/${platform}/images/logo-${platform}-vertical.svg">`;     
        }
        else {
            platformContent = `<img src="js/modules/${platform}/images/logo-${platform}.svg">`;     
        }
        
        platformElement.innerHTML = platformContent;
    }

    if (showPlatform == false) {
        platformElement.remove();
    }

    const timestamp = clone.querySelector('.timestamp');    
    if (timestamp) {
        if (showTimestamps) {
            timestamp.textContent = whatTimeIsIt();
        } else {
            timestamp.remove();
        }
    }
    
    if ((chatModeration == true) && (!root.classList.contains('streamer'))) {
        const moderationHTML = buildChatModerationHTML(platform, userid, messageid, streamerOfOrigin);
        if (moderationHTML) root.insertAdjacentHTML("beforeend", moderationHTML);
    }

    if (chatMessageGroup == true && chatContainer.children.length > 0) {

        const info = root.querySelector('.info');
        const messageElement = chatContainer.firstElementChild.firstElementChild;
        let lastUserId = messageElement.dataset.user;

        let lastClasses = Array.from(messageElement.classList);
        lastClasses = lastClasses.filter(c => c !== 'item');
        lastClasses = lastClasses.filter(c => c !== 'grouped');
        lastClasses = lastClasses.filter(c => c !== 'streamer-mentioned');
        lastClasses = lastClasses.join(' ');

        let currentClasses = Array.from(classes).join(' ');

        if (lastUserId == userid && lastClasses == currentClasses) {
            const avatar = info.querySelector('.avatar');
            info.innerHTML = ''; 

            if (avatar) {
                const avatarClone = avatar.cloneNode();
                avatarClone.style.overflow = 'hidden';
                avatarClone.style.width = '0px';
                info.appendChild(avatarClone);
            }

            root.classList.add('grouped');
        }
    }

    animateItemEntry(root, messageid);

    if (playSound && playSoundOnChat) {
        queueNotificationSound();
    }

}

function applyEventPlatformIcon(platform, root, platformElement) {
    if (showPlatform == false) {
        root.classList.add('no-platform');
        platformElement.remove();
        return;
    }

    const isTwitch = platform === "twitch";
    let platformContent;

    if (root.classList.contains("youtube-vertical")) {
        platformContent = `<img src="js/modules/youtube/images/logo-youtube-vertical.svg">`;
    }
    else if (isTwitch && root.classList.contains("golden-kappa-train")) {
        platformContent = `<img src="js/modules/twitch/images/golden-kappa-emote.png">`;
    }
    else if (isTwitch && root.classList.contains("treasure-train")) {
        platformContent = `<img src="js/modules/twitch/images/icon-treasure-train.png">`;
    }
    else {
        platformContent = `<img src="js/modules/${platform}/images/logo-${platform}.svg">`;
    }

    platformElement.innerHTML = platformContent;
}

function addEventItem(platform, clone, classes, userid, messageid) {
    removeExtraChatMessages();

    if (showSpeakerbot == true && speakerBotEventRead == true) { speakerBotTTSRead(clone, 'event', platform); }

    const root = clone.firstElementChild;
    root.classList.add(...classes);
    root.dataset.user = userid;
    root.id = messageid;

    applyEventPlatformIcon(platform, root, clone.querySelector('.platform'));

    const timestamp = clone.querySelector('.timestamp');    
    if (timestamp) {
        if (showTimestamps) {
            timestamp.textContent = whatTimeIsIt();
        } else {
            timestamp.remove();
        }
    }
    
    animateItemEntry(root, messageid);
    
    if (playSound && playSoundOnEvents) {
        queueNotificationSound();
    }
}











async function preloadAndPrepend(container, fragment) {
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment.cloneNode(true));
    
    const images = tempDiv.querySelectorAll('img');

    if (images.length > 0) {
        await Promise.all(
            Array.from(images).map(img => new Promise((resolve) => {
                const src = img.src || img.dataset.src;
                if (!src) return resolve();

                const preloader = new Image();
                preloader.onload = resolve;
                preloader.onerror = resolve;
                preloader.src = src;
            }))
        );
    }

    container.prepend(fragment);
}

function removeItem(element) {
    element.remove();
}

function removeExtraChatMessages() {
    const chatMessages = chatContainer.querySelectorAll(':scope > div');
    const total = chatMessages.length;

    if (total >= chatThreshold) {
        const toRemove = Math.floor(total * 0.25); // 25% do total
        for (let i = 0; i < toRemove; i++) {
            const last = chatContainer.lastElementChild;
            if (last) chatContainer.removeChild(last);
        }
    }
}

function whatTimeIsIt() {
    const now = new Date();
    const hours24 = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const format = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = (hours24 % 12) || 12;

    if (ampm === true) {
        return `${hours12}:${minutes} ${format}`;
    } else {
        return `${hours24}:${minutes}`;
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        let numStr = (num / 1000000).toFixed(1);
        if (numStr.endsWith('.0')) {
            numStr = numStr.slice(0, -2);
        }
        return numStr + 'M';
    }
    else if (num >= 1000) {
        let numStr = (num / 1000).toFixed(1);
        if (numStr.endsWith('.0')) {
            numStr = numStr.slice(0, -2);
        }
        return numStr + 'K';
    }
    return num.toString();
}

function formatCurrency(amount, currencyCode) {
    if (!currencyCode) { currencyCode = 'USD'; }
    
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatTime(seconds) {
    if (seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function createRandomString(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function randomIntBetween(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createRandomColor(platform, username) {
    if (userColors.get(platform).has(username)) {
        return userColors.get(platform).get(username);
    }
    else {
        const hue = Math.random() * 360;
        const saturation = 85;
        // compensa hues que "parecem" mais escuros (azul/roxo/vermelho puro)
        const isDarkishHue = (hue >= 200 && hue <= 280) || (hue >= 340 || hue <= 10);
        const lightness = isDarkishHue ? 65 : 55;

        const randomColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        userColors.get(platform).set(username, randomColor);
        return randomColor;
    }
}

function hexToRGBA(hexadecimal,opacity) {
    const hex = hexadecimal;
    const alpha = parseFloat(opacity);
    
    // Converter hex para RGB
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function stripStringFromHtml(html) {
    let doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

async function cleanStringOfHTMLButEmotes(string) {
    const container = document.createElement('div');
    container.innerHTML = string;

    const emotes = container.querySelectorAll('img.emote[alt]');
    emotes.forEach(img => {
        const altText = img.getAttribute('alt');
        const textNode = document.createTextNode(altText);
        img.replaceWith(textNode);
    });

    /* GIPHY INTEGRATION OVER TWITCH HAS DESCRIPTIONS IN THE ALT ATTRIBUTE */
    const giphyImagesOverTwitch = container.querySelectorAll('img.twitch-giphy-integration[alt]');
    giphyImagesOverTwitch.forEach(img => {
        const altText = img.getAttribute('alt');
        const textNode = document.createTextNode(altText);
        img.replaceWith(textNode);
    });

    return container.textContent || "";
}

function formatSubMonthDuration(months) {
    return `${months} ${months === 1 ? tRD('chatrd.month.singular') : tRD('chatrd.month.plural')}`;
}

function animateCounter(element, start, end, duration) {
    let startTime = null;
    
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const value = Math.floor(start + (end - start) * progress);
        element.textContent = value;
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }
    
    requestAnimationFrame(step);
}

/* -------------------------- */
/* ---- CHAT INPUT UTILS ---- */
/* -------------------------- */

const chatcommandslist = document.getElementById('chat-autocomplete-list');
let chatcurrentFocus = -1;

const chatInputSend = document.getElementById("chat-input-send");
const chatInputSendAll = document.getElementById("chat-input-send-all");
const chatInputForm = document.querySelector("#chat-input form");
const chatInput = chatInputForm.querySelector("input[type=text]");

const chatCommandsButton = chatInputForm.querySelector("#commands-button button");

let chatcommands;

function highlightItem(items) {
    if (!items) return;

    items.forEach(item => item.classList.remove('active'));

    if (chatcurrentFocus >= items.length) chatcurrentFocus = 0;
    if (chatcurrentFocus < 0) chatcurrentFocus = items.length - 1;

    items[chatcurrentFocus].classList.add('active');
    items[chatcurrentFocus].scrollIntoView({ block: "nearest" });
}

chatInput.addEventListener('input', function () {
    const value = this.value.trim();
    chatcommandslist.innerHTML = '';
    chatcurrentFocus = -1;

    if (!value.startsWith('/')) return;
    
    Object.entries(chatcommands).forEach(([groupName, commands]) => {
        
        const filtered = commands.filter(cmd => cmd.name.startsWith(value));

        if (filtered.length === 0) return;

        const groupTitle = document.createElement('div');
        groupTitle.textContent = groupName;
        chatcommandslist.appendChild(groupTitle);
        filtered.forEach(cmd => {
            const item = document.createElement('div');
            item.classList.add('autocomplete-item');
            item.innerHTML = `<strong>${cmd.name}</strong><small> ${cmd.usage}</small>`;
            item.addEventListener('click', () => {
                chatInput.value = cmd.name + ' ';
                chatcommandslist.innerHTML = '';
            });
            chatcommandslist.appendChild(item);
        });

    });
});

chatInput.addEventListener('keydown', function (e) {
    const items = chatcommandslist.querySelectorAll('.autocomplete-item');
    
    if (items.length === 0) return;
    
    if (e.key === 'ArrowDown') {
        chatcurrentFocus++;
        highlightItem(items);
    }
    else if (e.key === 'ArrowUp') {
        chatcurrentFocus--;
        highlightItem(items);
    }
    
    else if (e.key === 'Enter') {
        e.preventDefault();
        if (chatcurrentFocus > -1 && items[chatcurrentFocus]) {
            items[chatcurrentFocus].click();
        }
    }
});



chatCommandsButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    chatcommandslist.innerHTML = '';

    Object.entries(chatcommands).forEach(([groupName, commands]) => {

        const groupTitle = document.createElement('div');
        groupTitle.textContent = groupName;
        chatcommandslist.appendChild(groupTitle);
        
        commands.forEach(cmd => {
            const item = document.createElement('div');
            item.classList.add('autocomplete-item');
            item.innerHTML = `<strong>${cmd.name}</strong><small> ${cmd.usage}</small>`;
            item.addEventListener('click', () => {
                chatInput.value = cmd.name + ' ';
                chatcommandslist.innerHTML = '';
            });
            chatcommandslist.appendChild(item);
        });
        
    });
    
});



async function pushChatInputButtonsToSettings() {
    const buttons = document.querySelectorAll('#chat-input-platorms-buttons button');

    buttons.forEach(button => {
        const platform = button.getAttribute('data-platform');
        const checkbox = document.querySelector(`#chat-settings input[name="${platform}"]`);

        button.addEventListener('click', (e) => {
            e.preventDefault();
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
            syncButtonState(button, checkbox);
        });
    });

    function syncButtonState(button, checkbox) {
        button.classList.toggle('inactive', !checkbox.checked);
    }
}

async function saveChatInputSettingsToLocalStorage() {
    const chatSettings = document.getElementById("chat-settings");
    const checkboxes = chatSettings.querySelectorAll("input[type=checkbox]");
    const settings = {};

    checkboxes.forEach(cb => settings[cb.name] = cb.checked);

    localStorage.setItem("chatrdChatInputSettings", JSON.stringify(settings));
}

async function loadChatInputSettingFromLocalStorage() {
    const chatSettings = document.getElementById("chat-settings");
    const saved = localStorage.getItem("chatrdChatInputSettings");
    const chatInputPlatformButtons = document.querySelector('#chat-input-platorms-buttons');

    if (!saved) return;

    const settings = JSON.parse(saved);

    Object.keys(settings).forEach(key => {
        const input = chatSettings.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === "checkbox") {
                input.checked = settings[key];

                const button = chatInputPlatformButtons.querySelector(`button[data-platform="${key}"]`);
                if (!input.checked) button.classList.add('inactive');

            }
        }
    });
}

async function pushChatInputSettings() {
    const chatSettings = document.getElementById("chat-settings");
    const checkboxes = chatSettings.querySelectorAll("input[type=checkbox]");

    const chatInputPlatformButtons = document.querySelector('#chat-input-platorms-buttons');

    const twitchSwitch = chatInputPlatformButtons.querySelector('#twitch');
    const youtubeSwitch = chatInputPlatformButtons.querySelector('#youtube');
    //const tiktokSwitch = chatInputPlatformButtons.querySelector('#tiktok');
    const kickSwitch = chatInputPlatformButtons.querySelector('#kick');

    if (showTwitch == false) { twitchSwitch.classList.add('hidden'); }
    if (showYoutube == false) { youtubeSwitch.classList.add('hidden'); }
    //if (showTiktok == false) { tiktokSwitch.classList.add('hidden'); }
    if (showKick == false) { kickSwitch.classList.add('hidden'); }

    pushChatInputButtonsToSettings();

    checkboxes.forEach(cb => {
        cb.addEventListener('change', saveChatInputSettingsToLocalStorage);
    });
}

chatInputForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const chatInputText = chatInput.value;
    if (!chatInputText || !chatInputText.trim()) {
        return;
    }

    var chatSendPlatforms = [];

    const chatSettings = document.getElementById("chat-settings");

    const sendTwitchMessages = chatSettings.querySelector('input[type=checkbox][name="sendTwitchMessages"]').checked;
    const sendYouTubeMessages = chatSettings.querySelector('input[type=checkbox][name="sendYouTubeMessages"]').checked;
    //const sendTikTokMessages = chatSettings.querySelector('input[type=checkbox][name="sendTikTokMessages"]').checked;
    const sendKickMessages = chatSettings.querySelector('input[type=checkbox][name="sendKickMessages"]').checked;

    if (showTwitch == true && showTwitchMessages == true && sendTwitchMessages == true) { chatSendPlatforms.push('twitch'); }
    if (showYoutube == true && showYouTubeMessages == true && sendYouTubeMessages == true) { chatSendPlatforms.push('youtube'); }
    //if (showTiktok == true && showTikTokMessages == true && sendTikTokMessages == true) { chatSendPlatforms.push('tiktok'); }
    if (showKick == true && showKickMessages == true && sendKickMessages == true) { chatSendPlatforms.push('kick'); }

    chatSendPlatforms = chatSendPlatforms.join(',');

    streamerBotClient.doAction(
    { name : "[Twitch][YouTube][Kick] Msgs/Cmds" },
    {
        "type": "chat",
        "platforms": chatSendPlatforms,
        "message": chatInputText,
    }
    ).then( (sendchatstuff) => {
        console.debug('[ChatRD] Sending Chat to Streamer.Bot', sendchatstuff);
    });
    
    
    /*if (chatSendPlatforms.includes('tiktok')) {
        if (!chatInputText.startsWith('/')) {
            streamerBotClient.doAction(
            { name : "[TikTok] Msgs" },
            {
                "ttkmessage": chatInputText,
            }
            ).then( (sendchatstuff) => {
                console.debug('[ChatRD] Sending TikTok Chat to Streamer.Bot', sendchatstuff);
            });
        }
    }*/

    chatInput.value = '';
});

chatInputSend.addEventListener("click", function () {
    chatInputForm.requestSubmit();
});

chatInputSendAll.addEventListener("click", function () {
    const container = document.querySelector('#chat-input-platorms-buttons');
    const allButtons = Array.from(container.querySelectorAll('button:not(.hidden)'));

    const buttonsInactives = [];

    allButtons.forEach(btn => {
        if (btn.classList.contains('inactive')) {
            buttonsInactives.push(btn);
            btn.click();
        }
    });

    chatInputSend.click();

    buttonsInactives.forEach(btn => {
        btn.click();
    });
});

document.addEventListener('click', function (e) {
    if (e.target !== chatcommandslist) {
        chatcommandslist.innerHTML = '';
    }
});

async function speakerBotTTSRead(clone,type,platform) {

    var TTSMessage = "";

    const root = clone.firstElementChild;

    const config = embedTTSConfig[platform];
    const requiredRoles = config.roles.split(',').map(role => role.trim());
	const isTTSAllowed = requiredRoles.some(role => root.classList.contains(role));

    const {
        header,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    if (type == "chat") {
        
        if (!isTTSAllowed) return;

        var cleanmessage = "";
        
        if (message == null) { cleanmessage = "<br>"; }
        else { cleanmessage = message.innerHTML; }

        var strippedmessage = await cleanStringOfHTMLButEmotes(cleanmessage);

        const tts = {
            user: user.textContent,
            message: strippedmessage
        }

        TTSMessage = renderTemplate(speakerBotChatTemplate, tts);
    }

    if (type == "event") {
        
        var cleanvalue = "";
        if (value == null) { cleanvalue = ""; }
        else { cleanvalue = value.innerHTML; }

        var cleanmessage = "";
        if (message == null) { cleanmessage = "<br>"; }
        else { cleanmessage = message.innerHTML; }

        var strippedmessage = await cleanStringOfHTMLButEmotes(cleanmessage);
        var strippedaction = await cleanStringOfHTMLButEmotes(action.innerHTML);
        var strippedvalue = await cleanStringOfHTMLButEmotes(cleanvalue);

        TTSMessage = user.textContent + strippedaction + strippedvalue + ". " + strippedmessage;
    }

    var speakerbotThisStuff = getSpeakerBotInstance();
    speakerbotThisStuff.speak(TTSMessage);

}

function renderTemplate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return key in data ? data[key] : match;
    });
}

async function executeModCommand(event, command) {
    event.preventDefault();
    chatInput.value = command;
    chatInputForm.requestSubmit();
}












function parseAllowedDomains(filterList) {
	const trimmedFilter = filterList.trim();

	return trimmedFilter
		.split(',')
		.map(domain => domain
			.trim()
			.toLowerCase()
			.replace(/^https?:\/\//, '')
			.replace(/\/.*$/, '')
		)
		.filter(domain => domain.length > 0 && domain.includes('.'));
}


function isDomainAllowed(rawUrl, domains) {
	if (!domains || domains.length === 0) return false;

	let hostname;
	try {
		const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
		hostname = new URL(fullUrl).hostname.toLowerCase().replace(/\.$/, '');
	}
    catch {
		return false;
	}

	const hostParts = hostname.split('.');

	return domains.some(domain => {
		const domainParts = domain.split('.');
		if (hostParts.length < domainParts.length) return false;
		const tail = hostParts.slice(-domainParts.length);
		return tail.join('.') === domain;
	});
}

const allowedImageDomains = imageEmbeddingFilter
	? parseAllowedDomains(imageEmbeddingFilterDomains)
	: null;

async function getAndReplaceLinks(platform, element) {
	const el = element.querySelector('.actual-message');
	const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
	const urlRegex = /\b((?:https?:\/\/|www\.)[^\s<>"')]+)\b/g;
	const singleUrlRegex = /^((?:https?:\/\/|www\.)[^\s<>"')]+)$/;
	const imageExtRegex = /\.(jpe?g|png|gif|webp)(\?.*)?$/i;
	const invisibleCharsRegex = /[\u200B-\u200D\uFEFF\u034F\u2800\u{E0000}-\u{E007F}]/gu;
	const nodes = [];

	while (walker.nextNode()) {
		const node = walker.currentNode;
		if (!node.parentElement.closest('a,script,style,textarea,code,pre')) {
			nodes.push(node);
		}
	}

	function collectMeaningfulNodes(node, out) {
		if (node.nodeType === Node.TEXT_NODE) {
			if (node.nodeValue.trim().length > 0) out.push(node);
			return;
		}
		if (node.nodeType === Node.ELEMENT_NODE) {
			if (node.childNodes.length === 0) {
				out.push(node); // ex: <img> de emote
				return;
			}
			for (const child of node.childNodes) {
				collectMeaningfulNodes(child, out);
			}
		}
	}

	function getWholeMessageTextNode(root) {
		const meaningful = [];
		collectMeaningfulNodes(root, meaningful);
		if (meaningful.length === 1 && meaningful[0].nodeType === Node.TEXT_NODE) {
			return meaningful[0];
		}
		return null;
	}

	const wholeMessageTextNode = getWholeMessageTextNode(el);

	function createLink(cleanUrl) {
		const a = document.createElement('a');
		a.href = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
		a.textContent = cleanUrl;
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
		return a;
	}

	function createProxiedImage(rawUrl) {
		const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

		let proxiedSrc;
		try {
			const urlObj = new URL(fullUrl);
			urlObj.search = '';
			urlObj.hash = '';
			proxiedSrc = 'https://external-content.duckduckgo.com/iu/?u=' + encodeURIComponent(urlObj.toString());
		}
		catch {
			return null;
		}

		const img = document.createElement('img');
		img.classList.add('embedded');
		img.src = proxiedSrc;

		img.onerror = () => {
			console.warn('[ChatRD] Falha ao carregar imagem via proxy:', proxiedSrc, '| original:', rawUrl);
			img.replaceWith(createLink(rawUrl));
		};

		return img;
	}

	nodes.forEach(node => {
		const text = node.nodeValue.replace(invisibleCharsRegex, '');

		const isWholeMessageLink = node === wholeMessageTextNode && singleUrlRegex.test(text.trim());

		let match, lastIndex = 0;
		const frag = document.createDocumentFragment();

		while ((match = urlRegex.exec(text))) {
			const raw = match[1];

			if (match.index > lastIndex) {
				frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
			}

			const clean = raw.replace(/[.,!?;:)\]\}]+$/, '');

			let isImage = isWholeMessageLink
				&& imageExtRegex.test(clean)
				&& (!imageEmbeddingFilter || isDomainAllowed(clean, allowedImageDomains));

			if (isImage && embedImageConfig[platform]) {
				const config = embedImageConfig[platform];
				if (!config.enabled) {
					isImage = false;
				} else {
					const requiredRoles = config.roles.split(',').map(role => role.trim());
					isImage = requiredRoles.some(role => element.classList.contains(role));
				}
			}

			if (isImage) {
				const img = createProxiedImage(clean);
				frag.appendChild(img ?? createLink(clean));
			} else {
				frag.appendChild(createLink(clean));
			}

			if (clean.length < raw.length) {
				frag.appendChild(document.createTextNode(raw.slice(clean.length)));
			}

			lastIndex = match.index + raw.length;
		}

		if (lastIndex === 0) return;

		if (lastIndex < text.length) {
			frag.appendChild(document.createTextNode(text.slice(lastIndex)));
		}

		node.parentNode.replaceChild(frag, node);
	});
}


















const _escapeDiv = document.createElement('div');
function escapeHTML(str) {
    _escapeDiv.textContent = str;
    return _escapeDiv.innerHTML;
}

async function generateSHA256Identifier(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}



function renderGiftEventSuffix(giftcode) {
    const html = `
        <span class="gift-info">
            <span class="gift-image">${giftcode.image}</span>
            <span class="gift-value">${giftcode.value}</span>
        </span>
    `;

    return html;
}



/* ------------------------------ */
/* ---- AUTO SCROLL, FINALLY ---- */
/* ------ Yo RexBordz!😁 ------- */
/* ----------------------------- */

function useAutoScroll(container, options = {}) {
    const {
        pauseThreshold = 0.10,
        resumeThreshold = 0.05,
        notice = null,
        smoothScroll = false,
    } = options;

    let autoScroll = true;
    let scrolling = false;

    function showNotice() {
        if (!notice) return;
        notice.style.setProperty('visibility', 'visible');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                notice.style.setProperty('opacity', '1');
            });
        });
    }

    function hideNotice() {
        if (!notice) return;
        notice.style.setProperty('opacity', '0');
        notice.addEventListener('transitionend', () => {
            notice.style.setProperty('visibility', 'hidden');
        }, { once: true });
    }

    if (notice) {
        notice.style.setProperty('visibility', 'hidden');
        notice.style.setProperty('opacity', '0');
        notice.addEventListener('click', () => scrollToBottom());
    }

    function bottomScrollTop() {
        return 0;
    }

    function distanceFromBottom(scrollTop, totalScrollable) {
        return (orientation === "ttb") ? scrollTop : Math.abs(scrollTop);
    }

    container.addEventListener('scroll', () => {
        if (scrolling) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const totalScrollable = scrollHeight - clientHeight;
        if (totalScrollable === 0) return;

        const percent = distanceFromBottom(scrollTop, totalScrollable) / totalScrollable;

        if (autoScroll && percent > pauseThreshold) {
            autoScroll = false;
            showNotice();
        }
        if (!autoScroll && percent < resumeThreshold) {
            autoScroll = true;
            hideNotice();
        }
    });

    function scrollToBottom() {
        scrolling = true;
        autoScroll = true;
        hideNotice();

        const prev = container.style.scrollBehavior;
        container.style.scrollBehavior = 'auto';
        container.scrollTop = bottomScrollTop();
        container.style.scrollBehavior = prev;

        const release = () => { scrolling = false; };
        if ('onscrollend' in window) {
            container.addEventListener('scrollend', release, { once: true });
        } else {
            setTimeout(release, 500);
        }
    }

    return {
        onPrepend: () => { if (autoScroll) container.scrollTop = bottomScrollTop(); },
        scrollToBottom,
        isActive: () => autoScroll,
    };
}

function initFakeScrollbar(scrollEl, thumbEl) {
    const track = thumbEl.parentElement;

    track.style.visibility = 'hidden';

    function getZoom(el) {
        let zoom = 1;
        while (el) {
            const z = parseFloat(getComputedStyle(el).zoom) || 1;
            zoom *= z;
            el = el.parentElement;
        }
        return zoom;
    }

    // Converte scrollTop bruto -> posição visual (0 = topo da track, 1 = fundo da track)
    function scrollTopToPosition(scrollTop, maxScroll) {
        if (maxScroll <= 0) return 0;

        if (orientation === "ttb") {
            return Math.min(1, Math.max(0, scrollTop / maxScroll));
        }

        return 1 - Math.min(1, Math.max(0, Math.abs(scrollTop) / maxScroll));
    }

    // Converte posição visual (0 = topo, 1 = fundo) -> scrollTop bruto
    function positionToScrollTop(position, maxScroll) {
        const clamped = Math.min(1, Math.max(0, position));

        if (orientation === "ttb") {
            return clamped * maxScroll;
        }

        return -((1 - clamped) * maxScroll);
    }

    function updateThumb() {
        const zoom = getZoom(scrollEl);

        const scrollHeight = scrollEl.scrollHeight * zoom;
        const clientHeight = scrollEl.clientHeight * zoom;

        track.style.height = (scrollEl.offsetHeight * zoom) + 'px';
        track.style.bottom = 'auto';

        const trackH = track.offsetHeight;

        if (scrollHeight <= clientHeight || trackH === 0) {
            track.style.visibility = 'hidden';
            thumbEl.style.display = 'none';
            return;
        }

        track.style.visibility = 'visible';
        thumbEl.style.display = 'block';

        const scrollTop = scrollEl.scrollTop * zoom;
        const maxScroll = scrollHeight - clientHeight;
        const position = scrollTopToPosition(scrollTop, maxScroll);

        const thumbH = Math.max(30, (clientHeight / scrollHeight) * trackH);
        thumbEl.style.height = thumbH + 'px';
        thumbEl.style.top = (position * (trackH - thumbH)) + 'px';
    }

    let isDragging = false;
    let dragStartY = 0;
    let dragStartScrollTop = 0;

    thumbEl.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartY = e.clientY;
        dragStartScrollTop = scrollEl.scrollTop;
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const zoom = getZoom(scrollEl);
        const trackH = track.offsetHeight;
        const thumbH = thumbEl.offsetHeight;
        const scrollHeight = scrollEl.scrollHeight * zoom;
        const clientHeight = scrollEl.clientHeight * zoom;
        const maxScroll = scrollHeight - clientHeight;

        const deltaY = e.clientY - dragStartY;
        const scrollDelta = (deltaY / (trackH - thumbH)) * maxScroll;
        scrollEl.scrollTop = dragStartScrollTop + scrollDelta;

        updateThumb();
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.userSelect = '';
    });

    track.style.pointerEvents = 'auto';

    track.addEventListener('click', (e) => {
        if (e.target === thumbEl) return;

        const zoom = getZoom(scrollEl);
        const trackRect = track.getBoundingClientRect();
        const clickY = e.clientY - trackRect.top;
        const trackH = track.offsetHeight;
        const scrollHeight = scrollEl.scrollHeight * zoom;
        const clientHeight = scrollEl.clientHeight * zoom;
        const maxScroll = scrollHeight - clientHeight;

        const position = clickY / trackH;
        scrollEl.scrollTop = positionToScrollTop(position, maxScroll);
    });

    scrollEl.addEventListener('scroll', updateThumb);
    window.addEventListener('resize', updateThumb);

    new ResizeObserver(() => requestAnimationFrame(updateThumb)).observe(scrollEl);

    new MutationObserver(() => requestAnimationFrame(updateThumb)).observe(scrollEl, {
        childList: true,
        subtree: true
    });

    requestAnimationFrame(() => requestAnimationFrame(updateThumb));
}

function createConfettiCanvas() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    zoom: reset; /* cancela o zoom herdado */
  `;
  document.body.appendChild(canvas);
  return canvas;
}

function chatGhostResize() {
    chatGhostContainer.style.width = `${chatContainer.offsetWidth}px`;
}

function adjustScreenMediaQuery() {
    const zoom = parseFloat(getComputedStyle(chatContainer).zoom) || 1;

    const breakpoint = 480;
    const adjustedBreakpoint = Math.ceil(breakpoint / zoom);
}

function applyLanguageToItems() {
    document.querySelector('#chat-input-text-field').setAttribute('placeholder', tRD('general.chat_input_placeholder'));
    document.querySelector('#chat-input-send').setAttribute('title', tRD('general.button_send_message', { shortcut: 'ENTER' }));
    document.querySelector('#chat-input-send-all').setAttribute('title', tRD('general.button_send_message_all', { shortcut: 'SHIFT+ENTER' }));
}

/* ------------------------------ */
/* ----- KEYBOARD SHORTCUTS ----- */
/* ------ Yo RexBordz!😁 ------- */
/* ----------------------------- */

let dynamicShortcuts = [];
let staticShortcuts = [];

function addStaticShortcut(shortcutString, action) {
    staticShortcuts.push({
        shortcut: shortcutString,
        action,
        ...parseShortcut(shortcutString)
    });
}

function getAllShortcuts() {
    return [...staticShortcuts, ...dynamicShortcuts];
}

function buildDynamicShortcuts() {
    const container = document.querySelector('#chat-input-platorms-buttons');

    if (!container) {
        console.warn('[ChatRD] Platform Buttons Container not found.');
        dynamicShortcuts = [];
        return;
    }

    const allButtons = Array.from(container.querySelectorAll('button'));

    const visibleButtons = allButtons.filter(btn => !btn.classList.contains('hidden'));

    let counter = 0;

    dynamicShortcuts = visibleButtons.map(btn => {
        counter++;
        const shortcutString = 'CTRL+ALT+' + counter;
        btn.setAttribute('title', tRD(`general.button_toggle_${ btn.id }`, { shortcut: shortcutString }));

        return {
            shortcut: shortcutString,
            action: () => btn.click(),
            ...parseShortcut(shortcutString)
        };
    });
}

function parseShortcut(shortcutString) {
    const validModifiers = ['CTRL', 'ALT', 'SHIFT', 'META', 'CMD', 'WIN'];
    const parts = shortcutString.toUpperCase().split('+').map(p => p.trim());

    const mainKeyParts = parts.filter(p => !validModifiers.includes(p));

    if (mainKeyParts.length !== 1) {
        console.warn(`[ChatRD] Shortcut not formatted correctly: "${shortcutString}".`);
    }

    return {
        ctrl: parts.includes('CTRL'),
        alt: parts.includes('ALT'),
        shift: parts.includes('SHIFT'),
        meta: parts.includes('META') || parts.includes('CMD') || parts.includes('WIN'),
        code: keyNameToCode(mainKeyParts[0])
    };
}

function keyNameToCode(key) {
    if (!key) return null;

    if (/^[A-Z]$/.test(key)) return `Key${key}`;

    if (/^[0-9]$/.test(key)) return `Digit${key}`;

    if (/^F[1-9][0-2]?$/.test(key)) return key;

    const specialKeys = {
        'ESC': 'Escape',
        'ESCAPE': 'Escape',
        'ENTER': 'Enter',
        'SPACE': 'Space',
        'TAB': 'Tab',
        'BACKSPACE': 'Backspace',
        'DELETE': 'Delete',
        'ARROWUP': 'ArrowUp',
        'ARROWDOWN': 'ArrowDown',
        'ARROWLEFT': 'ArrowLeft',
        'ARROWRIGHT': 'ArrowRight',
    };

    return specialKeys[key] || key;
}

function observeShortcutButtons() {
    const container = document.querySelector('#chat-input-platorms-buttons');
    if (!container) {
        console.warn('[ChatRD] Platform Buttons Container not found to apply the MutationObserver.');
        return;
    }

    buildDynamicShortcuts();

    const observer = new MutationObserver(() => {
        buildDynamicShortcuts();
    });

    observer.observe(container, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
    });
}

function applyKeyboardShortcuts() {
    observeShortcutButtons();

    document.addEventListener('keydown', function(event) {
        const isAltGr = event.getModifierState && event.getModifierState('AltGraph');
        const ctrlPressed = event.ctrlKey || isAltGr;
        const altPressed = event.altKey || isAltGr;

        const shortcut = getAllShortcuts().find(s =>
            s.ctrl === ctrlPressed &&
            s.alt === altPressed &&
            s.shift === event.shiftKey &&
            s.meta === event.metaKey &&
            s.code === event.code
        );

        if (shortcut) {
            event.preventDefault();
            shortcut.action();
        }
    });
}

window.addEventListener('resize', () => {
    chatGhostResize();
    adjustScreenMediaQuery();
});

document.addEventListener("DOMContentLoaded", async function () {
    console.debug(`[ChatRD] Initializing ...`);
    
    await loadLang();

    chatcommands = tRD('chatrd.commands');

    pushChatInputSettings();
    loadChatInputSettingFromLocalStorage();
    myConfetti = confetti.create(createConfettiCanvas(), { resize: true });

    scroll = useAutoScroll(chatContainer, {
        notice: document.querySelector('#chat-scroll-bottom'),
    });

    if (!chatContainer.classList.contains('noscrollbar')) {
        initFakeScrollbar(chatContainer, document.querySelector('.fake-thumb'));
    }

    chatGhostResize();
    adjustScreenMediaQuery();

    console.debug(`[ChatRD] Applying keyboard shortcuts ...`);

    addStaticShortcut('SHIFT+ENTER', () => {
        if (document.activeElement?.matches('#chat-input-text-field')) {
            chatInputSendAll.click();
        }
    });

    addStaticShortcut('ENTER', () => {
        if (document.activeElement?.matches('#chat-input-text-field')) {
            chatInputSend.click();
        }
    });

    applyKeyboardShortcuts();

    applyLanguageToItems();

});