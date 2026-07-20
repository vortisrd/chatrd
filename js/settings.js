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
        console.error("Failed to copy: ", err);
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

/* -------------------------
   Inicialização
-------------------------- */
document.addEventListener('DOMContentLoaded', async () => {

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