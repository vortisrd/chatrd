/* ----------------------- */
/*         OPTIONS         */
/* ----------------------- */

let myConfetti;

const showPlatform                  = getURLParam("showPlatform", true);
const showPlatformDot               = getURLParam("showPlatformDot", false);
const showAvatar                    = getURLParam("showAvatar", true);
const showTimestamps                = getURLParam("showTimestamps", true);
const ampmTimeStamps                = getURLParam("ampmTimeStamps", false);
const showBadges                    = getURLParam("showBadges", true);
const showPlatformStatistics        = getURLParam("showPlatformStatistics", true);

const chatThreshold                 = 100;
const chatOneLine                   = getURLParam("chatOneLine", false);
const chatHorizontal                = getURLParam("chatHorizontal", false); 
const chatMessageGroup              = getURLParam("chatMessageGroup", false); 

const eventsDock                    = getURLParam("eventsDock", false);

const chatFontSize                  = getURLParam("chatFontSize", 1);
const chatFontFamily                = getURLParam("chatFontFamily", "DM Sans");
const chatBackground                = getURLParam("chatBackground", "#121212"); 
const chatBackgroundOpacity         = getURLParam("chatBackgroundOpacity", 1); 
const chatScrollBar                 = getURLParam("chatScrollBar", false);
const chatField                     = getURLParam("chatField", false);
const chatModeration                = getURLParam("chatModeration", false);

const chatrdSkin                    = getURLParam("chatrdSkin", "default");

const excludeCommands               = getURLParam("excludeCommands", true);
const ignoreChatters                = getURLParam("ignoreChatters", "");
const ignoreUserList                = ignoreChatters.split(',').map(item => item.trim().toLowerCase()) || [];

const hideAfter                     = getURLParam("hideAfter", 0);

const chatContainer                 = document.querySelector('#chat');
const chatGhostContainer            = document.querySelector('#chat-ghost');
const eventLittleContainer          = document.querySelector('#little-events');
const chatTemplate                  = document.querySelector('#chat-message');
const eventTemplate                 = document.querySelector('#event-message');

const userColors = new Map();

const loadedEmotes = new Set();

/* ✅ Explicit whitelist */
const SKINS = {
    default: "skin-default.css?nocache=36",
    nutting: "skin-nutting.css?nocache=36",
    kimballs: "skin-kimballs.css?nocache=36",
    bubbles: "skin-bubbles.css?nocache=36"
};

const skinFile = SKINS[chatrdSkin] || SKINS.default;
const skinLink = document.getElementById("chatrd-skins");
skinLink.href = `css/${skinFile}`;

const chatRDBody = document.body;
chatRDBody.style.fontFamily = chatFontFamily;

if (showPlatformStatistics == true) {
    statistics.style.display = '';
}

document.querySelector('#bars').style.zoom = chatFontSize;

if (chatScrollBar == false) { chatContainer.classList.add('noscrollbar'); }
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
chatContainer.parentElement.style.backgroundColor = backgroundColor;

chatContainer.style.zoom = chatFontSize;
chatGhostContainer.style.zoom = chatFontSize;

if (eventsDock == true) eventLittleContainer.classList.add('active');

if (chatField) {
    const chatfieldelement = document.getElementById("chat-input");
    chatfieldelement.style.display = '';
}

async function animateItemEntry(root, messageid) {
    const dimensionProp = chatHorizontal ? 'Width' : 'Height';
    const marginProp = chatHorizontal ? 'margin-left' : 'margin-top';

    const ghostClone = root.cloneNode(true);
    chatGhostContainer.prepend(ghostClone);

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

    const itemDimension = chatHorizontal ? ghostClone.offsetWidth || 0 : ghostClone.offsetHeight || 0;
    
    ghostClone.remove();
    
    const marginPropValue = parseFloat(getComputedStyle(chatGhostContainer).gap);

    root.style = `${dimensionProp.toLowerCase()}: 0px; opacity: 0; ${marginProp}: -${marginPropValue}px;`;
    chatContainer.prepend(root.parentNode ?? root);

    setTimeout(function () {
        root.style = `${dimensionProp.toLowerCase()}: ${itemDimension}px; opacity: 1; ${marginProp}: 0px;`;
        setTimeout(function () {
            const item = document.getElementById(messageid);
            if (item) item.removeAttribute('style');
        }, 800);
    }, 10);

    if (hideAfter > 0) {
        const item = document.getElementById(messageid);
        if (item) {
            setTimeout(() => {
                item.style.opacity = '0';
                setTimeout(() => {
                    item.remove();
                }, 800);
            }, Math.floor(hideAfter * 1000));
        }
    }
}


function addMessageItem(platform, clone, classes, userid, messageid) {
    removeExtraChatMessages();

    const root = clone.firstElementChild;
    root.classList.add(...classes);
    root.dataset.user = userid;
    root.id = messageid;

    const streamerOfOrigin = root.dataset.streamer;

    let chatmodtwitch = `<div class="chatmoderation">
                <button onclick="window.open('https://twitch.tv/popout/${streamerOfOrigin}/viewercard/${userid}', '_blank', 'noopener')" title="Twitch User Card"><i class="fa-regular fa-address-card"></i></button>
                <button onclick="executeModCommand(event, '/deletemessage ${messageid}')" title="Remove Message"><i class="fa-solid fa-trash-can"></i></button>
                <button onclick="executeModCommand(event, '/timeout ${userid}')" title="Timeout User"><i class="fa-solid fa-stopwatch"></i></button>
                <button onclick="executeModCommand(event, '/ban ${userid}')" title="Ban User"><i class="fa-solid fa-gavel"></i></button>
            </div>`;

    let chatmodyoutube = `<div class="chatmoderation">
                <button onclick="executeModCommand(event, '/yt/timeout ${userid}')" title="Timeout User"><i class="fa-solid fa-stopwatch"></i></button>
                <button onclick="executeModCommand(event, '/yt/ban ${userid}')" title="Ban User"><i class="fa-solid fa-gavel"></i></button>
            </div>`;

    let chatmodkick = `<div class="chatmoderation">
                <button onclick="executeModCommand(event, '/kick/timeout ${userid}')" title="Timeout User"><i class="fa-solid fa-stopwatch"></i></button>
                <button onclick="executeModCommand(event, '/kick/ban ${userid}')" title="Ban User"><i class="fa-solid fa-gavel"></i></button>
            </div>`;

    if (showSpeakerbot == true && speakerBotChatRead == true) { speakerBotTTSRead(clone, 'chat'); }

    const messageEl = clone.querySelector('.actual-message');
    const infoEl = clone.querySelector('.info');
    
    getAndReplaceLinks(messageEl);

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

    if (showPlatformDot == true) {
        platformElement.innerHTML = `<span class="hidden-platform ${platform}"></span>`;
    }

    if (showPlatform == false && showPlatformDot == false) {
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
        switch (platform) {
            case "twitch":
                root.insertAdjacentHTML("beforeend", chatmodtwitch);
                break;
            case "youtube":
                root.insertAdjacentHTML("beforeend", chatmodyoutube);
                break;
            case "kick":
                root.insertAdjacentHTML("beforeend", chatmodkick);
                break;
        }
    }

    if (chatMessageGroup == true && chatContainer.children.length > 0) {
        let lastUserId = chatContainer.firstElementChild.dataset.user;

        let lastClasses = Array.from(chatContainer.firstElementChild.classList);
        lastClasses = lastClasses.filter(c => c !== 'item');
        lastClasses = lastClasses.filter(c => c !== 'grouped');
        lastClasses = lastClasses.filter(c => c !== 'streamer-mentioned');
        lastClasses = lastClasses.join(' ');

        let currentClasses = Array.from(classes).join(' ');

        if (lastUserId == userid && lastClasses == currentClasses) {
            infoEl.remove();
            root.classList.add('grouped');
        }
    }

    animateItemEntry(root, messageid);
}


function addEventItem(platform, clone, classes, userid, messageid) {
    removeExtraChatMessages();

    if (showSpeakerbot == true && speakerBotEventRead == true) { speakerBotTTSRead(clone, 'event'); }
    
    const root = clone.firstElementChild;
    root.classList.add(...classes);
    root.dataset.user = userid;
    root.id = messageid;

    const platformElement = clone.querySelector('.platform');

    if (showPlatform == true) {
        let platformContent;

        if (showPlatformDot == true) {
            root.classList.add('no-platform');
            platformElement.remove();
        }

        else {
            const isTwitch = platform === "twitch";

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
        }        
        
        platformElement.innerHTML = platformContent;
    }
    
    else {
        root.classList.add('no-platform');
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

    animateItemEntry(root, messageid);
}




function addLittleEventItem(platform, clone, classes, userid, messageid) {

    eventLittleContainer.innerHTML = '';

    if (showSpeakerbot == true && speakerBotEventRead == true) { speakerBotTTSRead(clone, 'event'); }
    
    const root = clone.firstElementChild;
    root.classList.add(...classes);
    root.dataset.user = userid;
    root.id = messageid;

    const platformElement = clone.querySelector('.platform');

    if (showPlatform == true) {
        let platformContent;

        if (showPlatformDot == true) {
            root.classList.add('no-platform');
            platformElement.remove();
        }

        else {
            const isTwitch = platform === "twitch";

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
        }        
        
        platformElement.innerHTML = platformContent;
    }
    
    else {
        root.classList.add('no-platform');
        platformElement.remove();
    }

    root.classList.add('animate__animated', 'animate__fadeInUp', 'animate__faster');

    eventLittleContainer.prepend(root.parentNode ?? root);
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
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = (hours24 % 12) || 12;

    if (ampmTimeStamps === true) {
        return `${hours12}:${minutes} ${ampm}`;
    } else {
        return `${hours24}:${minutes}`;
    }
}

// Function to format large numbers (e.g., 1000 => '1K')
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


function createRandomColor(platform, username) {
    if (userColors.get(platform).has(username)) {
        return userColors.get(platform).get(username);
    }
    else {
        const hue = Math.random() * 360;
        const saturation = 100;
        const lightness = 50;

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
const chatInputSettings = document.getElementById("chat-input-settings");
const chatInputForm = document.querySelector("#chat-input form");
const chatInput = chatInputForm.querySelector("input[type=text]")

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

    if (!saved) return;

    const settings = JSON.parse(saved);

    Object.keys(settings).forEach(key => {
        const input = chatSettings.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === "checkbox") {
                input.checked = settings[key];
            }
        }
    });
}

async function pushChatInputSettings() {
    const chatSettings = document.getElementById("chat-settings");
    const checkboxes = chatSettings.querySelectorAll("input[type=checkbox]");

    const twitchSwitch = chatSettings.querySelector('#twitch');
    const youtubeSwitch = chatSettings.querySelector('#youtube');
    const tiktokSwitch = chatSettings.querySelector('#tiktok');
    const kickSwitch = chatSettings.querySelector('#kick');

    if (showTwitch == false) { twitchSwitch.style.display = 'none'; }
    if (showYoutube == false) { youtubeSwitch.style.display = 'none'; }
    if (showTiktok == false) { tiktokSwitch.style.display = 'none'; }
    if (showKick == false) { kickSwitch.style.display = 'none'; }

    checkboxes.forEach(cb => {
        cb.addEventListener('change', saveChatInputSettingsToLocalStorage);
    });
}



chatInputForm.addEventListener("submit", function(event) {
    event.preventDefault();

    var chatSendPlatforms = [];

    const chatSettings = document.getElementById("chat-settings");

    const sendTwitchMessages = chatSettings.querySelector('input[type=checkbox][name="sendTwitchMessages"]').checked;
    const sendYouTubeMessages = chatSettings.querySelector('input[type=checkbox][name="sendYouTubeMessages"]').checked;
    const sendTikTokMessages = chatSettings.querySelector('input[type=checkbox][name="sendTikTokMessages"]').checked;
    const sendKickMessages = chatSettings.querySelector('input[type=checkbox][name="sendKickMessages"]').checked;

    if (showTwitch == true && showTwitchMessages == true && sendTwitchMessages == true) { chatSendPlatforms.push('twitch'); }
    if (showYoutube == true && showYouTubeMessages == true && sendYouTubeMessages == true) { chatSendPlatforms.push('youtube'); }
    if (showTiktok == true && showTikTokMessages == true && sendTikTokMessages == true) { chatSendPlatforms.push('tiktok'); }
    if (showKick == true && showKickMessages == true && sendKickMessages == true) { chatSendPlatforms.push('kick'); }

    chatSendPlatforms = chatSendPlatforms.join(',')

    const chatInput = chatInputForm.querySelector("input[type=text]")
    const chatInputText = chatInput.value;

    // Sends Message to Twitch and YouTube 
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
    
    // Sends Message to TikTok that are not commands
    if (chatSendPlatforms.includes('tiktok')) {
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
    }

    chatInput.value = '';
});

chatInputSend.addEventListener("click", function () {
    chatInputForm.requestSubmit();
});

chatInputSettings.addEventListener("click", function () {
    const chatSettingsToggles = document.querySelector("#chat-settings");
    const isOpen = chatSettingsToggles.classList.contains("active");

    chatInputSettings.classList.toggle("active");

    if (isOpen) {
        chatSettingsToggles.classList.replace("animate__fadeInUp", "animate__fadeOutDown");

        chatSettingsToggles.addEventListener("animationend", function handler() {
            chatSettingsToggles.classList.remove("active");
            chatSettingsToggles.removeEventListener("animationend", handler);
        });
    } 
    else {
        chatSettingsToggles.classList.remove("animate__fadeOutDown");
        chatSettingsToggles.classList.add("active", "animate__fadeInUp");
    }
});

document.addEventListener('click', function (e) {
    if (e.target !== chatcommandslist) {
        chatcommandslist.innerHTML = '';
    }
});






async function speakerBotTTSRead(clone,type) {

    var TTSMessage = "";

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


async function getAndReplaceLinks(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  const urlRegex = /\b((?:https?:\/\/|www\.)[^\s<>"')]+)\b/g;
  const nodes = [];

  // coleta os nós de texto
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement.closest('a,script,style,textarea,code,pre')) {
      nodes.push(node);
    }
  }

  nodes.forEach(node => {
    const text = node.nodeValue;
    let match, lastIndex = 0;
    const frag = document.createDocumentFragment();

    while ((match = urlRegex.exec(text))) {
      const raw = match[1];

      // texto antes do link
      if (match.index > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      // cria <a>
      const clean = raw.replace(/[.,!?;:)\]\}]+$/, '');
      const a = document.createElement('a');
      a.href = clean.startsWith('http') ? clean : `https://${clean}`;
      a.textContent = clean;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      frag.appendChild(a);

      // se tinha pontuação colada, mantém
      if (clean.length < raw.length) {
        frag.appendChild(document.createTextNode(raw.slice(clean.length)));
      }

      lastIndex = match.index + raw.length;
    }

    if (lastIndex === 0) return; // nada casou

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

    container.addEventListener('scroll', () => {
        if (scrolling) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const totalScrollable = scrollHeight - clientHeight;
        if (totalScrollable === 0) return;

        const percent = Math.abs(scrollTop) / totalScrollable;

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
        container.scrollTop = 0;
        container.style.scrollBehavior = prev;

        const release = () => { scrolling = false; };
        if ('onscrollend' in window) {
            container.addEventListener('scrollend', release, { once: true });
        } else {
            setTimeout(release, 500);
        }
    }

    return {
        onPrepend: () => { if (autoScroll) container.scrollTop = 0; },
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

        const scrollTop = Math.abs(scrollEl.scrollTop) * zoom;
        const maxScroll = scrollHeight - clientHeight;
        const ratio = 1 - Math.min(1, Math.max(0, scrollTop / maxScroll));
        const thumbH = Math.max(30, (clientHeight / scrollHeight) * trackH);
        thumbEl.style.height = thumbH + 'px';
        thumbEl.style.top = (ratio * (trackH - thumbH)) + 'px';
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

        const ratio = 1 - Math.min(1, Math.max(0, clickY / trackH));
        scrollEl.scrollTop = -(ratio * maxScroll);
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


function chatGhostRezise() {
    const chat = document.getElementById('chat');
    const chatGhost = document.getElementById('chat-ghost');
    const chatWidth = `${chat.offsetWidth}px`;
    chatGhost.style.width = chat.offsetWidth + 'px';
}


function adjustScreenMediaQuery() {
    const chat = document.getElementById('chat');
    const zoom = parseFloat(getComputedStyle(chat).zoom) || 1;

    const breakpoint = 480;
    const adjustedBreakpoint = Math.ceil(breakpoint / zoom);
}

window.addEventListener('resize', () => {
    chatGhostRezise();
    adjustScreenMediaQuery();
});

document.addEventListener("DOMContentLoaded", async function () {
    console.debug(`[ChatRD] Initializing ...`);
    
    await loadLang();

    chatcommands = tRD('chatrd.commands');

    pushChatInputSettings();
    loadChatInputSettingFromLocalStorage();
    myConfetti = confetti.create(createConfettiCanvas(), { resize: true });

    if (document.querySelector('#chat:not(.noscrollbar)')) {
        const scroll = useAutoScroll(document.querySelector('#chat:not(.noscrollbar)'), {
            notice: document.querySelector('#chat-scroll-bottom'),
        });
        
        initFakeScrollbar(
            document.getElementById('chat'),
            document.querySelector('.fake-thumb')
        );
    }


    /* Making sure #chat-ghost has the same width than #chat */
    chatGhostRezise();
    adjustScreenMediaQuery();
});

