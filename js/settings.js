let streamerBotClient = null
let streamerBotConnected = false;
let kickWebSocket = null;
let tikfinityWebSocket = null;
let speakerBotClient = null;

let twitchRoleChoices = null;
let youtubeRoleChoices = null;
let kickRoleChoices = null;
let tiktokRoleChoices = null;

/* -------------------------
   Salvar configurações no localStorage
-------------------------- */

function saveSettingsToLocalStorage() {
    const checkboxes = document.querySelectorAll("input[type=checkbox]:not(.avoid)");
    const textfields = document.querySelectorAll("input[type=text]:not(.avoid)");
    const numberfields = document.querySelectorAll("input[type=number]:not(.avoid)");
    const colorfields = document.querySelectorAll("input[type=color]:not(.avoid)");
    const selects = document.querySelectorAll("select:not(.avoid)");
    const ranges = document.querySelectorAll("input[type=range]:not(.avoid)");
    const hiddens = document.querySelectorAll("input[type=hidden]:not(.avoid)");
    const settings = {};

    checkboxes.forEach(cb => settings[cb.name] = cb.checked);
    ranges.forEach(r => settings[r.name] = r.value);
    textfields.forEach(tf => settings[tf.name] = tf.value);
    numberfields.forEach(nf => settings[nf.name] = nf.value);
    colorfields.forEach(cf => settings[cf.name] = cf.value);
    selects.forEach(s => settings[s.name] = s.value);
    hiddens.forEach(s => settings[s.name] = s.value);

    localStorage.setItem("chatrdWidgetSettings", JSON.stringify(settings));

    generateUrl();
}


async function saveYouTubeCustomEmotes() {
    try {	
    	const youtubeMemberEmotes = document.querySelector("textarea[name=youTubeCustomEmotes]:not(.avoid)");
        youtubeSaveMemberEmotes(JSON.parse(youtubeMemberEmotes.value));
    }
	catch (err) {
        console.error("[ChatRD] Emotes JSON inválido", err);
    }
}

async function loadYouTubeCustomEmotes() {

    youtubeLoadMemberEmotes().then(settings => {
        if (settings) {
    		const youtubeMemberEmotes = document.querySelector("textarea[name=youTubeCustomEmotes]:not(.avoid)");
            console.log('[ChatRD][Settings] YouTube Member Emotes Loaded', settings);
            youtubeMemberEmotes.value = JSON.stringify(settings);
            populateEmoteList();
        }
    });
    
}

/* -------------------------
   Carregar configurações do localStorage
-------------------------- */
async function loadSettingsFromLocalStorage() {
    const saved = localStorage.getItem("chatrdWidgetSettings");
    if (!saved) return;

    const settings = JSON.parse(saved);

    Object.keys(settings).forEach(key => {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === "checkbox") {
                input.checked = settings[key];
            } else {
                input.value = settings[key];
            }
        }
    });

    document.querySelector('#font-value').textContent = Math.floor(document.querySelector('#font-slider').value * 100) + '%';
    document.querySelector('#bg-opacity-value').textContent = Math.floor(document.querySelector('#bg-opacity-slider').value * 100) + '%';
}

async function saveStreamerBotSettings() {
    const streamerBotServerAddress = document.querySelector('input[type=text][name=streamerBotServerAddress]').value;
    const streamerBotServerPort = document.querySelector('input[type=text][name=streamerBotServerPort]').value;

    const settings = {
        streamerBotServerAddress : streamerBotServerAddress,
        streamerBotServerPort : streamerBotServerPort
    }

    localStorage.setItem("chatrdStreamerBotSettings", JSON.stringify(settings));
}

async function loadStreamerBotSettings() {
    const saved = localStorage.getItem("chatrdStreamerBotSettings");
    if (!saved) return;

    const settings = JSON.parse(saved);

    Object.keys(settings).forEach(key => {
        const input = document.querySelector(`[type=text][name="${key}"]`);
        input.value = settings[key];
    });
}


function chatRdImportSettings(url) {

    const elements = document.querySelector("form").querySelectorAll("input, select");

    elements.forEach(el => {
        switch (el.type) {
            case "checkbox":
            case "radio":
                el.checked = el.defaultChecked;
                break;
            case "range":
            case "text":
            case "number":
            /*case "email":
            case "password":
                el.value = el.defaultValue;
                break;*/
            default:
                el.value = el.defaultValue;
        }
    })

    const qIndex = url.indexOf("?");
    
    if (qIndex === -1) return {};

    const queryString = url.slice(qIndex + 1);
    const params = new URLSearchParams(queryString);
    const json = {};

    for (const [key, value] of params.entries()) {
      if (key === "") continue;

      if (value === "true")       json[key] = true;
      else if (value === "false") json[key] = false;
      else if (value !== "" && !isNaN(value)) json[key] = Number(value);
      else json[key] = decodeURIComponent(value);
    }
    
    Object.keys(json).forEach(key => {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === "checkbox") {
                input.checked = json[key];
            }
            else {
                input.value = json[key];
            }
        }
    });
}






/* -------------------------
   Modal para importar URL
-------------------------- */
function setupImportUrlModal() {
    const modal = document.getElementById("importUrlModal");
    const urlInput = document.getElementById("importUrlString");
    const openImportModal = document.getElementById("openImportModal");
    const confirmBtn = document.getElementById("confirmImportUrl");
    const cancelBtn = document.getElementById("cancelImportUrl");

    if (!modal || !openImportModal) return;

    // ESC global → aciona cancelBtn
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.classList.contains("hidden")) {
            cancelBtn.click();
        }
    });

    // ENTER nos inputs → aciona confirmBtn
    [urlInput].forEach(input => {
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault(); // evita submit/form
                confirmBtn.click();
            }
        });
    });

    openImportModal.onclick = (event) => {
        event.preventDefault();
        if (streamerBotConnected) {
            urlInput.value = "";
            modal.classList.remove("hidden");
            urlInput.focus();
        } else {
            alert("Streamer.bot is Offline!");
        }
    };

    cancelBtn.onclick = (e) => {
        e.preventDefault();
        modal.classList.add("hidden");
    };

    confirmBtn.onclick = (e) => {
        e.preventDefault();
        const url = urlInput.value.trim();

        if (!url) {
            alert("URL Field is required.");
            return;
        }
        chatRdImportSettings(url);

        modal.classList.add("hidden");

        openImportModal.textContent = 'Settings imported! Reloading...';
        openImportModal.style.backgroundColor = "#00dd63";

        saveSettingsToLocalStorage();

        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };
}





/* -------------------------
   Configurar eventos para salvar mudanças
-------------------------- */
function pushChangeEvents() {
    const checkboxes = document.querySelectorAll("input[type=checkbox]:not(.avoid)");
    const textfields = document.querySelectorAll("input[type=text]:not(.avoid)");
    const numberfields = document.querySelectorAll("input[type=number]:not(.avoid)");
    const colorfields = document.querySelectorAll("input[type=color]:not(.avoid)");
    const selects = document.querySelectorAll("select:not(.avoid)");
    const ranges = document.querySelectorAll("input[type=range]:not(.avoid)");

    const oneLineCheckBox = document.querySelector('input[type=checkbox][name=chatOneLine]');
    const horizontalCheckBox = document.querySelector('input[type=checkbox][name=chatHorizontal]');

    oneLineCheckBox.addEventListener('change', (e) => {
        if (e.target.checked) { horizontalCheckBox.checked = false; }
    });

    horizontalCheckBox.addEventListener('change', (e) => {
        if (e.target.checked) { oneLineCheckBox.checked = false; }
    });

    [...checkboxes, ...textfields, ...numberfields, ...colorfields, ...selects, ...ranges].forEach(el => {
        el.addEventListener('change', saveSettingsToLocalStorage);
        el.addEventListener('input', saveSettingsToLocalStorage);
    });

    document.querySelector('#font-slider').addEventListener('input', function () {
        document.querySelector('#font-value').textContent = Math.floor(this.value * 100) + '%';
    });

    document.querySelector('#bg-opacity-slider').addEventListener('input', function () {
        document.querySelector('#bg-opacity-value').textContent = Math.floor(this.value * 100) + '%';
    });
}

/* -------------------------
   Gerar URL de preview
-------------------------- */
function generateUrl() {
    const streamerBotServerAddress = document.querySelector('input[type=text][name=streamerBotServerAddress]').value;
    const streamerBotServerPort = document.querySelector('input[type=text][name=streamerBotServerPort]').value;

    const outputField = document.getElementById("outputUrl");
    outputField.value = '';

    const baseUrlObj = new URL(window.location.href);

    // Garante que o pathname termine com "chat.html"
    if (!baseUrlObj.pathname.endsWith("chat.html")) {
        if (baseUrlObj.pathname.endsWith("/") || baseUrlObj.pathname === "") {
            baseUrlObj.pathname += "chat.html";
        } else if (baseUrlObj.pathname.endsWith("index.html")) {
            baseUrlObj.pathname = baseUrlObj.pathname.replace(/index\.html$/, "chat.html");
        } else {
            baseUrlObj.pathname += "/chat.html";
        }
    }

    const baseUrl = baseUrlObj.toString();

    const checkboxes = document.querySelectorAll("input[type=checkbox]:not(.avoid)");
    const textfields = document.querySelectorAll("input[type=text]:not(.avoid)");
    const numberfields = document.querySelectorAll("input[type=number]:not(.avoid)");
    const colorfields = document.querySelectorAll("input[type=color]:not(.avoid)");
    const selects = document.querySelectorAll("select:not(.avoid)");
    const ranges = document.querySelectorAll("input[type=range]:not(.avoid)");

    const params = new URLSearchParams();

    selects.forEach(s => params.set(s.name, s.value));
    ranges.forEach(r => params.set(r.name, r.value));

    let letTwitch               = document.querySelector("input[type=checkbox][name=showTwitch]:not(.avoid)").checked;
    let letYoutube              = document.querySelector("input[type=checkbox][name=showYoutube]:not(.avoid)").checked;
    let letTiktok               = document.querySelector("input[type=checkbox][name=showTiktok]:not(.avoid)").checked;
    let letKick                 = document.querySelector("input[type=checkbox][name=showKick]:not(.avoid)").checked;

    let letStreamelements       = document.querySelector("input[type=checkbox][name=showStreamelements]:not(.avoid)").checked;
    let letStreamlabs           = document.querySelector("input[type=checkbox][name=showStreamlabs]:not(.avoid)").checked;
    let letPatreon              = document.querySelector("input[type=checkbox][name=showPatreon]:not(.avoid)").checked;
    let letTipeee               = document.querySelector("input[type=checkbox][name=showTipeee]:not(.avoid)").checked;
    let letKofi                 = document.querySelector("input[type=checkbox][name=showKofi]:not(.avoid)").checked;
    let letFourthwall           = document.querySelector("input[type=checkbox][name=showFourthwall]:not(.avoid)").checked;

    checkboxes.forEach(cb => {
        const dataDefault = cb.dataset.default === "true";

        const isTwitchParam = cb.name.toLowerCase().includes("twitch");
        const isYoutubeParam = cb.name.toLowerCase().includes("youtube");
        const isTiktokParam = cb.name.toLowerCase().includes("tiktok");
        const isKickParam = cb.name.toLowerCase().includes("kick");

        const isStreamelements = cb.name.toLowerCase().includes("streamelements");
        const isStreamlabs = cb.name.toLowerCase().includes("streamlabs");
        const isPatreon = cb.name.toLowerCase().includes("patreon");
        const isTipeeestream = cb.name.toLowerCase().includes("tipeee");
        const isKofi = cb.name.toLowerCase().includes("kofi");
        const isFourthwall = cb.name.toLowerCase().includes("fourthwall");

        if (isTwitchParam && !letTwitch) return;
        if (isYoutubeParam && !letYoutube) return;
        if (isTiktokParam && !letTiktok) return;
        if (isKickParam && !letKick) return;

        if (isStreamelements && !letStreamelements) return;
        if (isStreamlabs && !letStreamlabs) return;
        if (isPatreon && !letPatreon) return;
        if (isTipeeestream && !letTipeee) return;
        if (isKofi && !letKofi) return;
        if (isFourthwall && !letFourthwall) return;

        if (cb.checked !== dataDefault) {
            params.set(cb.name, cb.checked);
        }
    });

    colorfields.forEach(cf => params.set(cf.name, cf.value));
    textfields.forEach(tf => params.set(tf.name, tf.value));
    numberfields.forEach(nf => params.set(nf.name, nf.value));

    var finalChatRDURL = baseUrl + '?' + params.toString() + `&streamerBotServerAddress=${streamerBotServerAddress}&streamerBotServerPort=${streamerBotServerPort}`; 
    outputField.value = finalChatRDURL
    const iframe = document.querySelector('#preview iframe');
    if (iframe) { iframe.src = finalChatRDURL; }
}


/* -------------------------
   Copiar URL para clipboard
-------------------------- */
function copyUrl() {
    const output = document.getElementById("outputUrl");
    const button = document.querySelector('#copyUrlButton');
    const buttonDefaultText = button.textContent;

    // remove o parâmetro testMode (e os relacionados) antes de copiar
    const url = new URL(output.value);
    url.searchParams.delete('testMode');
    url.searchParams.delete('testModeMinInterval');
    url.searchParams.delete('testModeMaxInterval');
    const value = url.toString();

    navigator.clipboard.writeText(value).then(() => {
        button.textContent = '👍';
        button.style.backgroundColor = "#00dd63";

        setTimeout(() => {
            button.textContent = buttonDefaultText;
            button.removeAttribute('style');
        }, 3000);
    }).catch(err => {
        console.error("[ChatRD][Settings] Failed to copy: ", err);
    });
}

/* -------------------------
   Mostrar/esconder plataformas
-------------------------- */
function setupPlatformToggles() {
    const platforms = document.querySelectorAll('.platform');

    platforms.forEach(platform => {
        const platformId = platform.id;
        const toggleName = `show${capitalize(platformId)}`;
        const toggle = platform.querySelector(`input[name="${toggleName}"]`);
        const setupDiv = platform.querySelector('.setup');

        if (toggle && setupDiv) {
            // Removido: initializeTransitionStyles(setupDiv);
            
            // Defina o overflow no CSS ou aqui, se preferir
            setupDiv.style.overflow = 'hidden';
            setupDiv.style.transition = 'max-height 0.4s ease, opacity 0.4s ease';

            setVisible(setupDiv, toggle.checked);

            toggle.removeEventListener('change', toggle._handler || (() => { }));

            const handler = () => setVisible(setupDiv, toggle.checked);
            toggle._handler = handler;
            toggle.addEventListener('change', handler);
        }
    });

    function setVisible(element, visible) {
        if (visible) {
            // Remove 'display: none' para que a altura possa ser calculada
            element.style.display = 'block';

            // Força o elemento a iniciar com altura e opacidade zero
            element.style.maxHeight = '0px';
            element.style.opacity = '0';
            element.offsetHeight; // Força a renderização
            
            // Inicia a transição para a altura real e opacidade completa
            element.style.maxHeight = element.scrollHeight + 'px';
            element.style.opacity = '1';

            // Remove os estilos após a transição de abertura
            element.addEventListener('transitionend', function handler() {
                element.style.maxHeight = null;
                element.style.opacity = null;
                element.removeEventListener('transitionend', handler);
            });

        }
        
        else {
            // Define o maxHeight para a altura atual antes de iniciar a transição de fechamento
            element.style.maxHeight = element.scrollHeight + 'px';
            element.offsetHeight; // Força a renderização
            
            // Inicia a transição para fechar o elemento
            element.style.maxHeight = '0px';
            element.style.opacity = '0';

            // Esconde o elemento com 'display: none' após a transição
            setTimeout(() => {
                if (element.style.opacity === '0') {
                    element.style.display = 'none';
                }
            }, 400); // O tempo precisa ser o mesmo da transição (0.4s)
        }
    }

    // A função initializeTransitionStyles() foi removida.
    // O estilo de transição foi movido para a função principal para ser definido uma única vez.
    
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

/* -------------------------
   Navegação no footer
-------------------------- */
function setupFooterNavBar() {
    document.querySelectorAll('.nav-bar a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (!targetId || !targetId.startsWith('#')) return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offset = 20;
                const y = targetElement.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });
}

/* -------------------------
   Modal para adicionar emotes
-------------------------- */
function setupAddEmoteModal() {
    const modal = document.getElementById("addEmoteModal");
    const nameInput = document.getElementById("newEmoteName");
    const urlInput = document.getElementById("newEmoteURL");
    const confirmBtn = document.getElementById("confirmAddEmote");
    const cancelBtn = document.getElementById("cancelAddEmote");
    const addButton = document.querySelector("#addEmoteButton");
    const textarea = document.querySelector("textarea[name=youTubeCustomEmotes]");

    if (!modal || !addButton || !textarea) return;

    // ESC global → aciona cancelBtn
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.classList.contains("hidden")) {
            cancelBtn.click();
        }
    });

    // ENTER nos inputs → aciona confirmBtn
    [nameInput, urlInput].forEach(input => {
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault(); // evita submit/form
                confirmBtn.click();
            }
        });
    });

    addButton.onclick = (event) => {
        event.preventDefault();
        if (streamerBotConnected) {
            nameInput.value = "";
            urlInput.value = "";
            modal.classList.remove("hidden");
            nameInput.focus();
        } else {
            alert("Streamer.bot is Offline!");
        }
    };

    cancelBtn.onclick = (e) => {
        e.preventDefault();
        modal.classList.add("hidden");
    };

    confirmBtn.onclick = (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const url = urlInput.value.trim();

        if (!name || !url) {
            alert("Both fields are required.");
            return;
        }

        let emotes;
        try {
            emotes = JSON.parse(JSON.parse(textarea.value));
        }
        catch (err) {
            console.error("Invalid JSON", err);
            alert("Emote data is invalid.");
            return;
        }

        if (emotes[name]) {
            alert(`Emote "${name}" already exists.`);
            return;
        }

        emotes[name] = url;
        textarea.value = JSON.stringify(JSON.stringify(emotes));
        saveYouTubeCustomEmotes();
        modal.classList.add("hidden");
        setTimeout(() => populateEmoteList(), 1000);
    };
}






/* -------------------------
   Lista de emotes
-------------------------- */
function populateEmoteList() {
    const textarea = document.querySelector("textarea[name=youTubeCustomEmotes]");
    const emoteList = document.querySelector("#youtube .emote-list");
    if (!textarea || !emoteList) return;

    emoteList.querySelectorAll(".emote-item").forEach(item => {
        if (item.querySelector("button")?.id !== "addEmoteButton") {
            item.remove();
        }
    });

    let emotes;
    try {
        emotes = JSON.parse(JSON.parse(textarea.value));
    } catch (e) {
        console.error("[ChatRD][Settings] Invalid JSON in YouTube Emotes textarea", e);
        return;
    }

    const addButtonSpan = emoteList.querySelector("#addEmoteButton")?.parentElement;

    for (const [emoteName, emoteUrl] of Object.entries(emotes)) {
        const span = document.createElement("span");
        span.classList.add("emote-item");
        span.innerHTML = `
            <img data-emote="${emoteName}" src="${emoteUrl}" alt="">
            <em>${emoteName}</em>
            <button class="delete"><i class="fa-solid fa-trash-can"></i></button>
        `;

        span.querySelector(".delete").addEventListener("click", (event) => {
            event.preventDefault();
            if (confirm(`Are you sure you want to delete '${emoteName}'?`)) {
                delete emotes[emoteName];
                textarea.value = JSON.stringify(JSON.stringify(emotes));
                saveYouTubeCustomEmotes();
                setTimeout(() => populateEmoteList(), 1000);
            }
        });

        emoteList.insertBefore(span, addButtonSpan || null);
    }
}

/* -------------------------
   Funções YouTube <-> Streamer.bot
-------------------------- */
function youtubeSaveMemberEmotes(data) {
    if (!streamerBotClient) return;
    const json = JSON.stringify(data);
    streamerBotClient.doAction({ name: "[YouTube] Member Emotes" }, {
        "chatrdytcustomemotes": json,
    }).then((res) => {
        console.debug('[ChatRD][Settings] Saving YouTube Member Emotes... ', res);
    });
}

function youtubeLoadMemberEmotes() {
    if (!streamerBotClient) return Promise.resolve(null);
    return streamerBotClient.getGlobals().then((globals) => {
        console.debug('[ChatRD][Settings] Loading Global Vars...', globals);
        const emoteglobal = globals.variables?.chatrdytcustomemotes;
        if (!emoteglobal) {
            console.debug('[ChatRD][Settings] Global variable "chatrdytcustomemotes" not found. Creating one...');
            streamerBotClient.doAction({ name: "[YouTube] Member Emotes" }, {
                "chatrdytcustomemotes": "\"{}\"",
            }).then((res) => {
                console.debug('[ChatRD][Settings] Global variable "chatrdytcustomemotes" was saved.');
            });
            return null;
        }
        try {
            return JSON.parse(emoteglobal.value);
        } catch (e) {
            console.error('[ChatRD][Settings] Failed to parse YouTube Member Emote JSON', e);
            return null;
        }
    });
}

/* -------------------------
   Conexão com Streamer.bot
-------------------------- */
function streamerBotConnect() {
    const streamerBotStatus = document.getElementById('streamerBotStatus');

    const streamerBotServerAddress = document.querySelector('input[type=text][name=streamerBotServerAddress]').value;
    const streamerBotServerPort = document.querySelector('input[type=text][name=streamerBotServerPort]').value;

    // 🔎 Se já existe um cliente, encerra a tentativa anterior
    if (streamerBotClient) {
        try {
            console.debug("[ChatRD][Settings] Closing previous Streamer.bot connection...");
            streamerBotClient.disconnect?.(); // usa se existir
            streamerBotClient = null;
        } catch (err) {
            console.error("[ChatRD][Settings] Error closing previous client:", err);
        }
    }

    streamerBotClient = new StreamerbotClient({
        host: streamerBotServerAddress,
        port: streamerBotServerPort,
        onConnect: () => {
            console.debug(`[ChatRD][Settings] Connected to Streamer.bot successfully!`);
            streamerBotConnected = true;

            streamerBotStatus.classList.add('connected');

            loadSettingsFromLocalStorage();
            pushChangeEvents();
            generateUrl();
            setupFooterNavBar();
            setupAddEmoteModal();
            setupImportUrlModal();
            setupPlatformToggles();
            speakerBotConnection();
            loadYouTubeCustomEmotes();

            renderActionsStatus();
            

            if (!twitchRoleChoices) {

                twitchRoleChoices = multiChoiceField('#twitchEmbedImageRoles', {
                    placeholder: '...',
                    choices: [
                        { value: 'streamer',            label: 'Streamer' },
                        { value: 'moderator',           label: 'Mods' },
                        { value: 'vip',                 label: 'VIPs' },
                        { value: 'tier-one-sub',        label: 'Tier 1 Subs' },
                        { value: 'tier-two-sub',        label: 'Tier 2 Subs' },
                        { value: 'tier-three-sub',      label: 'Tier 3 Subs' }
                    ],
                    onAdd: () => saveSettingsToLocalStorage(),
                    onRemove: () => saveSettingsToLocalStorage()
                });
                
            }


            

            if (!youtubeRoleChoices) {

                twitchRoleChoices = multiChoiceField('#youtubeEmbedImageRoles', {
                    placeholder: '...',
                    choices: [
                        { value: 'streamer',            label: 'Streamer' },
                        { value: 'moderator',           label: 'Mods' },
                        { value: 'sponsor',             label: 'Members' }
                    ],
                    onAdd: () => saveSettingsToLocalStorage(),
                    onRemove: () => saveSettingsToLocalStorage()
                });
                
            }


            

            if (!kickRoleChoices) {

                kickRoleChoices = multiChoiceField('#kickEmbedImageRoles', {
                    placeholder: '...',
                    choices: [
                        { value: 'broadcaster',         label: 'Streamer' },
                        { value: 'moderator',           label: 'Mods' },
                        { value: 'vip',                 label: 'VIPs' },
                        { value: 'og',                  label: 'OGs' },
                        { value: 'subscriber',          label: 'Subs' }
                    ],
                    onAdd: () => saveSettingsToLocalStorage(),
                    onRemove: () => saveSettingsToLocalStorage()
                });
                
            }


            

            /*if (!tiktokRoleChoices) {

                tiktokRoleChoices = multiChoiceField('#tiktokEmbedImageRoles', {
                    placeholder: '...',
                    choices: [
                        { value: 'streamer',                    label: 'Streamer' },
                        { value: 'moderator',                   label: 'Mods' },
                        { value: 'subscriber',                  label: 'Subs/Super Fans' },
                        { value: 'top-gifter-1',                label: 'Top Gifter No.1',       group: 'top-gifter' },
                        { value: 'top-gifter-2',                label: 'Top Gifter No.2 ',      group: 'top-gifter' },
                        { value: 'top-gifter-3',                label: 'Top Gifter No.3',       group: 'top-gifter' },
                        { value: 'fan-one',                     label: 'Fan Lv.1+',        group: 'fans' },
                        { value: 'fan-ten',                     label: 'Fan Lv.10+',       group: 'fans' },
                        { value: 'fan-twenty',                  label: 'Fan Lv.20+',       group: 'fans' },
                        { value: 'fan-thirty',                  label: 'Fan Lv.30+',       group: 'fans' },
                        { value: 'fan-forty',                   label: 'Fan Lv.40+',       group: 'fans' },
                        { value: 'fan-fifty',                   label: 'Fan Lv.50+',       group: 'fans' }
                    ],
                    onAdd: () => saveSettingsToLocalStorage(),
                    onRemove: () => saveSettingsToLocalStorage()
                });

            }*/


        },
        onDisconnect: () => {
            streamerBotStatus.classList.remove('connected');
            streamerBotConnected = false;
            console.debug(`[ChatRD][Settings] Streamer.bot Disconnected!`);
        }
    });
}



async function speakerBotConnection() {
    const speakerBotStatus = document.getElementById('speakerBotStatus');

    const speakerBotServerAddress = document.querySelector('input[type=text][name=speakerBotServerAddress]').value;
    const speakerBotServerPort = document.querySelector('input[type=text][name=speakerBotServerPort]').value;
    const speakerBotVoiceAlias = document.querySelector('input[type=text][name=speakerBotVoiceAlias]').value;

    const showSpeakerbot = document.querySelector('input[type=checkbox][name=showSpeakerbot]').checked;

    if (!showSpeakerbot) {
        // Se não é pra mostrar, desconecta caso esteja ativo
        if (speakerBotClient && speakerBotClient.ws && speakerBotClient.ws.readyState !== WebSocket.CLOSED) {
            console.log("[ChatRD][Settings] Disconnecting SpeakerBot...");
            speakerBotClient.disconnect();
        }
        return;
    }

    // Se já está conectado ou conectando, não cria outro
    if (speakerBotClient && speakerBotClient.ws && speakerBotClient.ws.readyState !== WebSocket.CLOSED) {
        console.log("[ChatRD][Settings] SpeakerBot WebSocket is already on!.");
        return;
    }

    // Cria nova instância
    speakerBotClient = new SpeakerBotClient({
        host: speakerBotServerAddress,
        port: speakerBotServerPort,
        voiceAlias: speakerBotVoiceAlias,

        onConnect: () => {
            speakerBotStatus.classList.add('connected');
        },

        onDisconnect: () => {
            speakerBotStatus.classList.remove('connected');
        }
    });
}



const sbRequiredActions = [
    '[TikTok] Msgs',
    '[Twitch] Fetch Goals',
    '[Twitch][YouTube][Kick] Msgs/Cmds',
    '[YouTube] Member Emotes'
];

const sbChatRDActions = "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";


async function fetchAndDisplaySbImportString() {
    const container = document.getElementById('sbActionCode');
    container.textContent = sbChatRDActions.trim();

    document.getElementById('refreshSbActions').addEventListener('click', () => {
        location.reload();
    });
}


function renderActionRow(actionName, isFound) {
    const statusClass = isFound ? 'found' : 'not-found';
    const icon = isFound
        ? '<i class="fa-solid fa-check"></i>'
        : '<i class="fa-solid fa-xmark"></i>';
 
    return `<div class="sbAction">${actionName} <span class="${statusClass}">${icon}</span></div>`;
}


async function renderActionsStatus() {
    const container = document.getElementById('sbActionList');
 
    const response = await streamerBotClient.getActions();
    const existingNames = response.actions.map((action) => action.name);
 
    const missingActions = sbRequiredActions.filter(
        (name) => !existingNames.includes(name)
    );
 
    container.innerHTML = sbRequiredActions
        .map((name) => renderActionRow(name, existingNames.includes(name)))
        .join('\n');

    if (missingActions.length > 0) {
        document.getElementById('sbActionsNotFound').classList.remove('hidden');
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
            button.innerHTML = '<i class="fa-regular fa-copy"></i>';
            button.removeAttribute('style');
        }, 3000);
    }).catch(err => {
        console.error("[ChatRD][Settings] Failed to copy: ", err);
    });
}




/* -------------------------
   Inicialização
-------------------------- */
document.addEventListener('DOMContentLoaded', async () => {


    fetchAndDisplaySbImportString();

    loadStreamerBotSettings();
    setTimeout(() => { streamerBotConnect(); }, 1000);

    const streamerBotServerAddressSwitch = document.querySelector('input[type=text][name=streamerBotServerAddress]');
    const streamerBotServerPortSwitch = document.querySelector('input[type=text][name=streamerBotServerPort]');

    streamerBotServerAddressSwitch.addEventListener('input', () => {
        saveStreamerBotSettings();
        streamerBotConnect();
        generateUrl();
    });

    streamerBotServerPortSwitch.addEventListener('input', () => {
        saveStreamerBotSettings();
        streamerBotConnect();
        generateUrl();
    });

    const speakerBotSwitcher = document.querySelector('input[type=checkbox][name=showSpeakerbot]');
    speakerBotSwitcher.addEventListener('change', () => {
        speakerBotConnection();
    });

});