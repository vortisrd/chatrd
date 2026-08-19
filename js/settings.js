import {
    allDefined,
    registerIconLibrary
} from 'https://ka-f.webawesome.com/webawesome@3.10.0/webawesome.loader.js';


const streamerBot = {};
const speakerBot = {};

const sbRequiredActions = [
    '[TikTok] Msgs',
    '[Twitch] Fetch Goals',
    '[Twitch][YouTube][Kick] Msgs/Cmds',
    '[YouTube] Member Emotes'
];

let chatRDUrl;
let youtubeEmotes;


/* ChatRD Functions */
async function loadChatRDSettings() {
    const saved = localStorage.getItem("chatrdWidgetSettings");
    const settings = saved ? JSON.parse(saved) : {};

    document.querySelectorAll('[data-setting]:not([data-ignore])').forEach((el) => {
        const key = el.dataset.setting;
        const hasSavedValue = Object.prototype.hasOwnProperty.call(settings, key);

        let value;

        if (hasSavedValue) {
            value = settings[key];
        }
        
        else {
            const defaultValue = el.dataset.default;

            if (defaultValue === undefined) {
                value = undefined;
            }
            else if (el.tagName === 'WA-SWITCH' || (el.tagName === 'INPUT' && el.type === 'checkbox')) {
                value = defaultValue === 'true'; // converte string pra boolean
            }
            else if (el.tagName === 'WA-SLIDER' || el.tagName === 'WA-NUMBER-INPUT') {
                value = Number( defaultValue ); // converte string pra number
            }
            else {
                value = defaultValue;
            }
        }

        switch (el.tagName) {
            case 'WA-SLIDER' :
                el.value = value ?? '';
                break;
            case 'WA-SWITCH' :
                el.checked = value;
                break;
            case 'INPUT' :
                if (el.type === 'checkbox') {
                    el.checked = value;
                }
                break;

            case 'WA-SELECT' :
                el.value = el.multiple
                    ? (Array.isArray(value) ? value : String(value ?? '').split(',').map(v => v.trim()).filter(Boolean))
                    : (value ?? '');
                break;

            case 'WA-INPUT' :
                el.value = value ?? '';
                break;

            case 'WA-NUMBER-INPUT' : 
                el.value = value ?? '';
                break;
                
            case 'WA-COLOR-PICKER' : 
                el.value = value ?? '';
                break;

            default:
                console.warn(`Tipo não tratado para "${key}":`, el.tagName);
        }
    });

    console.debug('[ChatRD][Settings] Widget Settings Loaded on Local Storage onto the Settings.', settings);
    
    const url = await getChatRDUrl({ preview: true });
    document.querySelector('#chatRDPreview').src = url;
    
}

async function loadChatRDTiktokService() {
    let tiktokServiceUsed;
    let tiktokServiceUser;
    let tiktokServiceApiKey;

    const tiktokServiceUsedSelect = document.querySelector('[data-setting=tiktokService]').value;
    document.querySelectorAll(`[data-tiktok-service="${tiktokServiceUsedSelect}"]`).forEach((el) => {
        el.style.display = '';
    });

    const tiktokServiceUsedSelected = document.querySelector('[data-setting=tiktokService]').value;
    const tiktokServiceUserInput = document.querySelector('[data-setting=tiktoksUser]').value;
    const tiktokServiceApiKeyInput = document.querySelector('[data-setting=tiktokEulerStreamApiKey]').value;

    try {
        console.debug('[ChatRD][Settings][TikTok] Grabbing TikTok Service Variable...');
        tiktokServiceUsed = await streamerBot.client.getGlobal('chatrdTiktokService', true);
        tiktokServiceUser = await streamerBot.client.getGlobal('chatrdTiktokUser', true);
        tiktokServiceApiKey = await streamerBot.client.getGlobal('chatrdEulerStreamApiKey', true);

        if (!tiktokServiceUsed || !tiktokServiceUser || !tiktokServiceApiKey) {
            throw new Error('[ChatRD][Settings][TikTok] TikTok Service Variables not found.');
        }

        document.querySelector('[data-setting=tiktoksUser]').value = tiktokServiceUser.variable.value;
        document.querySelector('[data-setting=tiktokEulerStreamApiKey]').value = tiktokServiceApiKey.variable.value;
    }

    catch (err) {
        console.warn('[ChatRD][Settings][TikTok] TikTok Service Variables not found. Creating them...');

        await streamerBot.client.doAction({
        name: "[TikTok][EulerStream] Connection" },
        {
            "chatrdTiktokFunction": "SaveSettings(service,user,apiKey)",
            "service": tiktokServiceUsedSelected,
            "user": tiktokServiceUserInput,
            "apiKey": tiktokServiceApiKeyInput,
        }).then((res) => {
            console.debug('[ChatRD][Settings][TikTok] TikTok Service Variables were created.');
        });

    }
}


async function setChatRDTiktokService(service, user, apiKey) {

    if (!streamerBot.connected) {
        console.warn(`[ChatRD][Settings][TikTok] Streamer.bot is not connected.`);
        return;
    }
    
    await streamerBot.client.doAction({
        name: "[TikTok][EulerStream] Connection" },
        {
            "chatrdTiktokFunction": "SaveSettings(service,user,apiKey)",
            "service": service,
            "user": user,
            "apiKey": apiKey,
        });
}



async function collectChatRDSettings() {
	const settings = {};

	document.querySelectorAll('[data-setting]:not([data-ignore])').forEach((el) => {
		const key = el.dataset.setting;
		const defaultValue = el.dataset.default;

		let value;

		switch (el.tagName) {
			case 'WA-SWITCH':
				value = el.checked;
				break;

			case 'WA-SELECT':
				value = el.multiple
					? (Array.isArray(el.value) ? el.value.join(',') : [])
					: el.value;
				break;

			case 'INPUT':
				value = (el.type === 'checkbox') ? el.checked : el.value;
				break;

			case 'WA-SLIDER':
            case 'WA-NUMBER-INPUT':
                value = Number( el.value );
                break;

            case 'WA-INPUT':
            case 'WA-COLOR-PICKER':
                value = el.value;
                break;

			default:
				console.warn(`Tipo não tratado para "${key}":`, el.tagName);
				value = undefined;
		}

		// só pula se houver default declarado E o valor (normalizado pra string) for igual a ele
		if (defaultValue !== undefined && String(value) === String(defaultValue)) {
			return;
		}

		settings[key] = value;

	});

	return settings;
}

async function bindChatRDSettings() {

    document.querySelectorAll('[data-setting]:not([data-ignore])').forEach((el) => {
		if (el.dataset.bound) return;
		el.dataset.bound = 'true';
		el.addEventListener('input', async () => {
            const settings = await collectChatRDSettings();
            const url = await getChatRDUrl({ preview: true });

            localStorage.setItem('chatrdWidgetSettings', JSON.stringify(settings));
            console.debug('[ChatRD][Settings] Widget Settings Saved on Local Storage.', settings);
            
            document.querySelector('#chatRDPreview').src = url;

            streamerBotConnect();
            speakerBotConnect();
        });
	});

    document.querySelector(`#playSoundButton`).addEventListener('click', async (event) => {
        event.preventDefault();

        const soundFile = document.querySelector(`[data-setting="playSoundFile"]`).value;
        const soundVolume = document.querySelector(`[data-setting="playSoundVolume"]`).value;

        await chatrdPlaySound(soundFile, soundVolume);
    });

    bindTikTokSettings();
}

async function bindTikTokSettings() {

    document.querySelector(`[data-setting=tiktokService]`).addEventListener('change', async (event) => {
        
        const service = event.target.value;
        const button = document.querySelector(`#tiktokSaveInformation`);
        
        let previousButtonContent;

        if (button.classList.contains('needs-saving')) {
            previousButtonContent = button.dataset.text;
        }
        else {
            previousButtonContent = button.querySelector('span').textContent;
        }

        button.classList.add('needs-saving');
        button.dataset.text = `${previousButtonContent}`;
        button.textContent = `🙏 ${previousButtonContent} 🙏`
        
        document.querySelectorAll('[data-tiktok-service]').forEach((el) => {
            el.style.display = 'none';
        });

        document.querySelectorAll(`[data-tiktok-service="${service}"]`).forEach((el) => {
            el.style.display = '';
        });
    });

    document.querySelector(`#tiktokSaveInformation`).addEventListener('click', async (event) => {
        event.preventDefault();
        
        const serviceEl = document.querySelector('[data-setting=tiktokService]');
        const userEl = document.querySelector('[data-setting="tiktoksUser"]');
        const apiKeyEl = document.querySelector('[data-setting="tiktokEulerStreamApiKey"]');

        setChatRDTiktokService(serviceEl.value, userEl.value, apiKeyEl.value);

        const btn = event.currentTarget;
        
        let previousButtonContent;

        if (btn.classList.contains('needs-saving')) {
            btn.classList.remove('needs-saving');
            previousButtonContent = btn.dataset.text;
        }
        else {
            previousButtonContent = btn.querySelector('span').textContent;
        }

        btn.textContent = '👍';
        btn.classList.add('success');

        setTimeout(() => {
            btn.textContent = previousButtonContent;
            btn.classList.remove('success');
        }, 3000);
    });
}

async function importChatRDSettings(url) {

    console.debug('[ChatRD][Settings] Importing Settings...');

    const base = new URL(url);
    base.hash = "";

    const settings = Object.fromEntries( base.searchParams.entries() );
    const validated = {};

    document.querySelectorAll('[data-setting]:not([data-ignore])').forEach((el) => {
        const key = el.dataset.setting;

        if ( !Object.prototype.hasOwnProperty.call( settings, key ) ) {
            return;
        }

        const rawValue = settings[ key ];
        const defaultValue = el.dataset.default;

        let value;

        switch (el.tagName) {
            case 'WA-SWITCH':
                value = rawValue === 'true';
                break;

            case 'WA-SELECT':
                value = el.multiple
                    ? rawValue.split(',').map(v => v.trim()).filter(Boolean)
                    : rawValue;
                break;

            case 'INPUT':
                value = (el.type === 'checkbox') ? (rawValue === 'true') : rawValue;
                break;

            case 'WA-SLIDER':
            case 'WA-NUMBER-INPUT':
                value = Number( rawValue );
                break;

            case 'WA-INPUT':
            case 'WA-COLOR-PICKER':
                value = rawValue;
                break;

            default:
                console.warn(`Tipo não tratado para "${key}":`, el.tagName);
                value = undefined;
        }

        if ( value === undefined ) {
            return;
        }

        if ( defaultValue !== undefined && String(value) === String(defaultValue) ) {
            return;
        }

        validated[ key ] = value;
    });

    localStorage.setItem( "chatrdWidgetSettings", JSON.stringify( validated ) );

    console.debug('[ChatRD][Settings] Settings Imported Successfully!', validated);
    console.debug('[ChatRD][Settings] Reloading...');

    var loadingScreen = document.getElementById('loading');
    
    loadingScreen.style.display = '';
    loadingScreen.classList.remove('hidden');
    document.body.style.overflowY = 'hidden';

    setTimeout(() => {
        location.reload();
    }, 1500)

    //loadChatRDSettings();
}

async function getChatRDUrl({ preview = false } = {}) {
	const base = new URL(window.location.href);

	base.hash = "";

	if (!base.pathname.endsWith("chat.html")) {
		if (base.pathname.endsWith("/") || base.pathname === "") {
			base.pathname += "chat.html";
		}
		else if (base.pathname.endsWith("index.html")) {
			base.pathname = base.pathname.replace(/index\.html$/, "chat.html");
		}
		else {
			base.pathname += "/chat.html";
		}
	}

	const settings = await collectChatRDSettings();

	Object.entries(settings).forEach(([key, value]) => {
		base.searchParams.set(key, value);
	});

	if (preview) {
		base.searchParams.set("preview", "true");
	}

	return base.toString();
}





/* YouTube Member Emotes Functions */
async function loadYoutubeMemberEmotes() {
    const youtubeCustomEmoteArea = document.querySelector('#youTubeCustomEmotes');

    let youtubeCustomEmotes;

    try {
        youtubeCustomEmotes = await streamerBot.client.getGlobal('chatrdytcustomemotes', true);
    }
    catch (err) {
        console.warn('[ChatRD][Settings][YouTube] Member Emotes variable not found. Creating it...');
        
        await streamerBot.client.doAction({
            name: "[YouTube] Member Emotes" },
            {
                "chatrdytcustomemotes": "\"{}\"",
            }
        ).then((res) => {
            console.debug('[ChatRD][Settings] YouTube Member Emotes variable was created.');
            youtubeCustomEmotes = { variable: { value: "\"{}\"" } };
        });
    }

    console.debug('[ChatRD][Settings][YouTube] Member Emotes are being loaded...');

    const youtubeEmotesJson = JSON.parse(youtubeCustomEmotes.variable.value);
    youtubeEmotes = JSON.parse(youtubeEmotesJson);
    
    await populateYoutubeMemberEmotes( youtubeEmotes );

    console.debug('[ChatRD][Settings][YouTube] Member Emotes loaded:', youtubeEmotes);   
}

async function populateYoutubeMemberEmotes(emotes) {

    const list = document.querySelector("#youtube-member-emote-list");
    const addButton = list.querySelector("#addEmoteButton")?.parentElement;

    if (!list) return;
    
    list.querySelectorAll(".emote-item:not(.add)").forEach(item => {
        item.remove();
    });

    for (const [emoteName, emoteUrl] of Object.entries(emotes)) {
        
        const emote = document.createElement("div");
        emote.classList.add('emote-item');

        const img = document.createElement("img");
        img.src = emoteUrl;

        const em = document.createElement("em");
        em.textContent = emoteName;

        const editBtn = document.createElement("button");
        editBtn.classList.add("edit");
        editBtn.dataset.emoteName = emoteName;
        editBtn.dataset.emoteUrl = emoteUrl;
        const editIcon = document.createElement("i");
        editIcon.classList.add("ri-edit-box-line");
        editBtn.appendChild(editIcon);

        editBtn.addEventListener('click', () => {
            const emoteName = editBtn.dataset.emoteName;
            const emoteUrl = editBtn.dataset.emoteUrl;

            const modal = document.querySelector('#modalYoutubeAddEmote');
            
            const nameInput = modal.querySelector('#newEmoteName');
            const urlInput = modal.querySelector('#newEmoteURL');
            const legacyInput = modal.querySelector('#emoteIdLegacy'); // NOVO

            nameInput.value = emoteName;
            urlInput.value = emoteUrl;
            legacyInput.value = emoteName; // NOVO: guarda o nome ORIGINAL

            modal.open = true;
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete");
        deleteBtn.dataset.emoteName = emoteName;
        deleteBtn.dataset.emoteUrl = emoteUrl;
        const deleteIcon = document.createElement("i");
        deleteIcon.classList.add("ri-delete-bin-line");
        deleteBtn.appendChild(deleteIcon);

        deleteBtn.addEventListener('click', () => {
            const emoteName = deleteBtn.dataset.emoteName;
            const emoteUrl = deleteBtn.dataset.emoteUrl;

            const modal = document.querySelector('#modalYesNo');
            const modalContent = modal.querySelector('#youtubeEmoteDeletion');
            modalContent.innerHTML = '';

            const emoteToDelete = document.createElement("img");
            emoteToDelete.dataset.emoteId = emoteName;
            emoteToDelete.src = emoteUrl;

            const emoteToDeleteTitle = document.createElement("strong");
            emoteToDeleteTitle.textContent = emoteName;
            
            modalContent.append(emoteToDelete, emoteToDeleteTitle);

            modal.open = true;
        });

        emote.append(img, em, editBtn, deleteBtn);

        list.insertBefore(emote, addButton || null);

    }


}

async function addYoutubeEmoteToChatRD(name, url) {
    const updatedEmotes = await updateYoutubeEmoteKey(youtubeEmotes, name, "", url);
    const updatedEmotesJson = JSON.stringify( JSON.stringify(updatedEmotes) );
    youtubeEmotes = updatedEmotes;
    
    console.debug('[ChatRD][Settings] Updating the YouTube Member Emotes...', youtubeEmotes);

    streamerBot.client.doAction({
        name: "[YouTube] Member Emotes"
    },{ "chatrdytcustomemotes": updatedEmotesJson, })
    .then((res) => {
        console.debug('[ChatRD][Settings] Saving YouTube Member Emotes... ', res);
    });
    console.debug('[ChatRD][Settings] YouTube Member Emotes updated:', youtubeEmotes);
}

async function deleteYoutubeEmoteFromChatRD(name) {
    delete youtubeEmotes[name];

    const updatedEmotesJson = JSON.stringify( JSON.stringify(youtubeEmotes) );

    console.debug('[ChatRD][Settings] Deleting YouTube Member Emote...', name, youtubeEmotes);

    streamerBot.client.doAction({
        name: "[YouTube] Member Emotes"
    },{ "chatrdytcustomemotes": updatedEmotesJson, })
    .then((res) => {
        console.debug('[ChatRD][Settings] Saving YouTube Member Emotes... ', res);
    });
}

async function updateYoutubeEmoteToChatRD(originalName, newName, url) {
    const updatedEmotes = await updateYoutubeEmoteKey(youtubeEmotes, originalName, newName, url);
    const updatedEmotesJson = JSON.stringify( JSON.stringify(updatedEmotes) );
    youtubeEmotes = updatedEmotes;

    console.debug('[ChatRD][Settings] Updating the YouTube Member Emotes...', youtubeEmotes);

    streamerBot.client.doAction({
        name: "[YouTube] Member Emotes"
    },{ "chatrdytcustomemotes": updatedEmotesJson, })
    .then((res) => {
        console.debug('[ChatRD][Settings] Saving YouTube Member Emotes... ', res);
    });
    console.debug('[ChatRD][Settings] YouTube Member Emotes updated:', youtubeEmotes);
}

function updateYoutubeEmoteKey( emotes, oldKey, newKey, newValue ) {
	var keyExists = oldKey in emotes;
	var finalKey = oldKey;

	if ( newKey && typeof newKey === "string" && newKey.trim() ) {
		finalKey = newKey;
	}

	var finalValue = newValue !== undefined ? newValue : ( keyExists ? emotes[ oldKey ] : undefined );

	emotes[ finalKey ] = finalValue;

	if ( keyExists && finalKey !== oldKey ) {
		delete emotes[ oldKey ]; // renomeou, então some com a chave antiga
	}

	return emotes;
}










/* Streamer.bot & Speaker.bot Functions */

async function streamerBotDisconnectExisting(closeCode = 1000, timeout = 1000) {
    if (!streamerBot.client) {
        console.warn(`[ChatRD][Settings] No Streamer.bot client detected.`);
        return false;
    }

    try {
        await streamerBot.client.disconnect(closeCode, timeout);
        console.debug(`[ChatRD][Settings] Streamer.bot disconnected successfully.`);
        return true;
    }
    catch (err) {
        console.error(`[ChatRD][Settings] Error while trying to disconnect from Streamer.bot:`, err);
        return false;
    }
}

async function streamerBotConnect() {

    await streamerBotDisconnectExisting();

    const status = document.querySelector('#streamerbot .status');
    const streamerBotIp = document.querySelector(`[data-setting=streamerBotServerAddress]`).value;
    const streamerBotPort = document.querySelector(`[data-setting=streamerBotServerPort]`).value;

    streamerBot.client = new StreamerbotClient({
        host: streamerBotIp,
        port: streamerBotPort,
        autoReconnect: true,
        onConnect: () => {
            streamerBot.connected = true;
            console.debug(`[ChatRD][Settings] Connected to Streamer.bot successfully!`);
            status.classList.add('connected');

            loadYoutubeMemberEmotes();
            loadChatRDTiktokService();
            renderActionsStatus();
        },
        onDisconnect: () => {
            streamerBot.connected = false;
            status.classList.remove('connected');
            console.debug(`[ChatRD][Settings] Streamer.bot Disconnected!`);
        }
    });

}

async function speakerBotConnect() {
    
    const status = document.querySelector('#speakerbot .status');
    const speakerBotIp = document.querySelector(`[data-setting=speakerBotServerAddress]`).value;
    const speakerBotPort = document.querySelector(`[data-setting=speakerBotServerPort]`).value;
    const speakerBotVoiceAlias = document.querySelector(`[data-setting=speakerBotVoiceAlias]`).value;

    const showSpeakerbot = document.querySelector(`[data-setting=showSpeakerbot]`).checked;

    if (!showSpeakerbot) return;

    if (!showSpeakerbot) {
        if (speakerBot.client && speakerBot.client.ws && speakerBot.client.ws.readyState !== WebSocket.CLOSED) {
            console.debug("[ChatRD][Settings] Disconnecting SpeakerBot...");
            speakerBot.client.disconnect();
        }
        return;
    }

    if (speakerBot.client && speakerBot.client.ws && speakerBot.client.ws.readyState !== WebSocket.CLOSED) {
        console.debug("[ChatRD][Settings] SpeakerBot WebSocket is already on!.");
        return;
    }

    speakerBot.client = new SpeakerBotClient({
        host: speakerBotIp,
        port: speakerBotPort,
        voiceAlias: speakerBotVoiceAlias,

        onConnect: () => {
            status.classList.add('connected');
        },

        onDisconnect: () => {
            status.classList.remove('connected');
        }
    });
}

function renderActionRow(actionName, isFound) {
    const statusClass = isFound ? 'found' : 'not-found';
    const icon = isFound
        ? '<i class="ri-checkbox-circle-fill"></i>'
        : '<i class="ri-close-circle-fill"></i>';
 
    return `<div class="sbAction">${actionName} <span class="${statusClass}">${icon}</span></div>`;
}

async function renderActionsStatus() {
    const container = document.getElementById('sbActionList');
 
    const response = await streamerBot.client.getActions();
    const existingNames = response.actions.map((action) => action.name);
 
    const missingActions = sbRequiredActions.filter(
        (name) => !existingNames.includes(name)
    );
 
    container.innerHTML = sbRequiredActions
        .map((name) => renderActionRow(name, existingNames.includes(name)))
        .join('\n');

    if (missingActions.length > 0) {
        document.getElementById('modalStreamerBotActions').setAttribute('open', 'true');
    }
}

function copySbActions() {
    const sbCodesbActionCode = document.getElementById("sbActionCode");
    const sbCodeFull = sbCodesbActionCode.textContent.trim();
    const button = document.querySelector('#sbActionsCopy');
    navigator.clipboard.writeText(sbCodeFull).then(() => {
        button.textContent = '👍';
        button.style.backgroundColor = "#00dd63";

        setTimeout(() => {
            button.innerHTML = '<i class="ri-file-copy-line"></i>';
            button.removeAttribute('style');
        }, 3000);
    }).catch(err => {
        console.error("[ChatRD][Settings] Failed to copy: ", err);
    });
}










/* Web Asweome Visual Styling */

async function bindButtonGroup(handlers, options = {}) {
	const { preventDefault = true } = options;

	const ids = Object.keys(handlers);
	const buttons = ids.reduce((acc, id) => {
		const btn = document.getElementById(id);
		if (!btn) {
			return acc;
		}
		acc[id] = btn;
		return acc;
	}, {});

	for (const [id, handler] of Object.entries(handlers)) {
		const button = buttons[id];
		if (!button) continue;

		button.addEventListener('click', (event) => {
			if (preventDefault) event.preventDefault();
			handler(event);
		});
	}

	return buttons
}

async function toggleButtonGroup(buttons, activeId) {
	for (const [id, btn] of Object.entries(buttons)) {
		btn.classList.toggle('enabled', id === activeId);
	}
}

async function registerRemixIcons() {
    registerIconLibrary('remixicon', {
        resolver: name => {
            const match = name.match(/^(.*?)\/(.*?)?$/);
            match[1] = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            return `https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/${match[1]}/${match[2]}.svg`;
        },
        mutator: svg => svg.setAttribute('fill', 'currentColor'),
    });
}

async function setUpDetails() {

	// Percentage Sliders
	const percentageSliders = document.querySelectorAll('.slider_percent');
	const percentageFormatter = new Intl.NumberFormat('en-US', { style: 'percent' });

	customElements.whenDefined('wa-slider').then(() => {
		percentageSliders.forEach((slider) => {
			slider.valueFormatter = value => percentageFormatter.format(value);
		});
	});

	const oneLineCheckbox = document.querySelector('[data-setting=chatOneLine]');
	const horizontalCheckbox = document.querySelector('[data-setting=chatHorizontal]');

	// Settings - Layouts
	const layoutButtons = await bindButtonGroup({
		'vertical-chat' : () => selectChatLayout('vertical-chat'),
		'one-line-chat' : () => selectChatLayout('one-line-chat'),
		'horizontal-chat' : () => selectChatLayout('horizontal-chat'),
	});

	function setCheckboxValue(checkbox, value) {
		if (checkbox.checked === value) return;
		checkbox.checked = value;
		checkbox.dispatchEvent(new Event('input', { bubbles: true }));
	}

	function selectChatLayout(layoutId) {
		toggleButtonGroup(layoutButtons, layoutId);

		setCheckboxValue(oneLineCheckbox, layoutId === 'one-line-chat');
		setCheckboxValue(horizontalCheckbox, layoutId === 'horizontal-chat');
	}

	function getCurrentLayoutId() {
		if (oneLineCheckbox.checked) return 'one-line-chat';
		if (horizontalCheckbox.checked) return 'horizontal-chat';
		return 'vertical-chat';
	}

	toggleButtonGroup(layoutButtons, getCurrentLayoutId());

    
    
    // Setting up Buttons
    const copyButton = document.getElementById("copyUrlButton");
    copyButton.addEventListener("click", async () => {

        const defaultText = copyButton.textContent;
        const url = await getChatRDUrl();
        
        navigator.clipboard.writeText(url).then(() => {
            copyButton.textContent = '👍';
            copyButton.style.backgroundColor = "#00dd63";

            console.debug("[ChatRD][Settings] ChatRD's URL copied successfully!");

            setTimeout(() => {
                copyButton.textContent = defaultText;
                copyButton.removeAttribute('style');
            }, 3000);
        })
        .catch(err => {
            console.error("[ChatRD][Settings] Failed to copy ChatRD's URL: ", err);
        });
    });
    

    const importUrlButton = document.getElementById("openImportModal");
    importUrlButton.addEventListener("click", async () => {
        const dialog = document.querySelector('#modalUrlImport');
        dialog.open = true;
    });

    


    document.querySelector("#addEmoteButton").addEventListener( "click", function() {
        const dialog = document.querySelector('#modalYoutubeAddEmote');
        dialog.open = true;
    });



    // Setting up Modals
    document.querySelectorAll('.modal').forEach(modal => {
        
        modal.querySelector('.cancel')?.addEventListener('click', () => {
            modal.open = false;
        });

        modal.addEventListener('wa-after-hide', function() {
            modal.querySelectorAll('wa-input').forEach(input => input.value = '');
            document.querySelector('#emoteIdLegacy').value = '';
        });



        modal.querySelector('#youtubeEmoteDeleteButton')?.addEventListener('click', async () => {
            const emoteId = modal.querySelector('#youtubeEmoteDeletion img').dataset.emoteId;
            await deleteYoutubeEmoteFromChatRD( emoteId );
            await populateYoutubeMemberEmotes( youtubeEmotes );
            modal.open = false;
        });



        modal.querySelector('#importUrlConfirm')?.addEventListener('click', async () => {
            const url = modal.querySelector('#importUrl');
            await importChatRDSettings(url.value.trim());
            modal.open = false;
        });



        modal.querySelector('#reloadStreamerBotActions')?.addEventListener('click', async () => {
            location.reload();
        });



        modal.querySelector('#addEmoteConfirm')?.addEventListener('click', async () => {
            const nameInput = modal.querySelector('#newEmoteName');
            const urlInput = modal.querySelector('#newEmoteURL');
            const legacyInput = modal.querySelector('#emoteIdLegacy'); // NOVO

            const name = ( nameInput.value || "" ).trim();
	        const url = ( urlInput.value || "" ).trim();
            const originalName = ( legacyInput.value || "" ).trim(); // NOVO

            if (!name || !url) {
                const dialog = document.querySelector('#modalInfo');
                
                dialog.querySelectorAll('.info').forEach(info => info.style.display = 'none');
                dialog.querySelectorAll('.button').forEach(button => button.style.display = 'none');

                dialog.querySelector('#youtubeEmoteBothFields').style.display = '';
                dialog.querySelector('#youtubeEmoteOkButton').style.display = '';
                dialog.open = true;
                return;
            }

            if ( originalName ) {
                console.debug(`[ChatRD][Settings] Updating emote "${originalName}" -> "${name}" (${url})...`);
                await updateYoutubeEmoteToChatRD(originalName, name, url);
            }
            else {
                console.debug(`[ChatRD][Settings] Adding emote "${name}" (${url})...`);
                await addYoutubeEmoteToChatRD(name, url);
            }

            await populateYoutubeMemberEmotes( youtubeEmotes );

            legacyInput.value = "";
            modal.open = false;
        });


    });

    document.querySelector('#sbActionsCopy').addEventListener('click', function() {
        copySbActions();
    });


}








async function hideLoadingScreen() {
	var loadingScreen = document.getElementById('loading');
	if (!loadingScreen) {
		return;
	}

	loadingScreen.addEventListener('transitionend', function onTransitionEnd() {
		loadingScreen.style.display = 'none';
        document.body.style.overflowY = 'unset';
		loadingScreen.removeEventListener('transitionend', onTransitionEnd);
	});

	loadingScreen.classList.add('hidden');
}

async function isChannelLive(username) {
    const response = await fetch("https://gql.twitch.tv/gql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Client-Id": "kimne78kx3ncx6brgo4mv6wki5h1ko"
        },
        body: JSON.stringify({
            query: `
                query($login: String!) {
                    user(login: $login) {
                        stream {
                            id
                            type
                        }
                    }
                }
            `,
            variables: { login: username }
        })
    });

    const data = await response.json();
    return data.data.user?.stream !== null;
}


let isVortisLive;

async function checkIfVortisIsLiveBecauseIWantMoreFollowersLMAO() {
    const isLive = await isChannelLive("vortisrd");

    if ( isLive ) {
        if (isVortisLive == true) return;
        document.querySelector('footer .links').style.display = 'none';
        document.querySelector('footer .live').style.display = '';
        isVortisLive = true;
    }
    else {
        if (isVortisLive == false) return;
        document.querySelector('footer .links').style.display = '';
        document.querySelector('footer .live').style.display = 'none';
        isVortisLive = false;
    }
}



async function loadWithProgress(onProgress) {
    const tags = new Set(
      [...document.querySelectorAll('*')]
        .map(el => el.tagName.toLowerCase())
        .filter(tag => tag.startsWith('wa-'))
    );

    const total = tags.size;
    let loaded = 0;

    await Promise.all(
        [...tags].map(async (tag) => {
            await customElements.whenDefined(tag);
            loaded++;
            onProgress(Math.round((loaded / total) * 100));
        })
    );
}

await loadWithProgress(async (pct) => {

    document.querySelector('#loadingPercentage span').textContent = `${pct}%`;

    if (pct == 100) {
        registerRemixIcons();
        await loadChatRDSettings();
        await bindChatRDSettings();

        await hideLoadingScreen(); 
        document.querySelector('#loadingPercentage span').textContent = ``;
        
        await setUpDetails();
        await streamerBotConnect();
        await checkIfVortisIsLiveBecauseIWantMoreFollowersLMAO();
        setInterval(async () => {
            await checkIfVortisIsLiveBecauseIWantMoreFollowersLMAO();
        }, 30000);
    }
});