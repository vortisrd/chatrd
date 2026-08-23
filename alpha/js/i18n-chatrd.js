/**
 * ChatRD — i18n
 */

const SUPPORTED_LOCALES = new Set([
    'de', 'en', 'es-ES', 'fr-FR', 'it-IT', 'pt-BR', 'pl', 'tl-PH'
]);
const DEFAULT_LOCALE = 'en';
// Formato aceito antes mesmo de checar a whitelist (defesa em profundidade).
const LOCALE_FORMAT = /^[a-zA-Z0-9_-]+$/;

function sanitizeLocale(value) {
    if (!value || !LOCALE_FORMAT.test(value)) return DEFAULT_LOCALE;
    return SUPPORTED_LOCALES.has(value) ? value : DEFAULT_LOCALE;
}

const lang = sanitizeLocale(new URLSearchParams(window.location.search).get('lang'));
const LOCALES_PATH  = './locale';
let jsonLang;

async function loadLang() {
    console.debug(`[ChatRD][i18n] Loading locale "${lang}" ...`);
    try {
        // encodeURIComponent como defesa extra, mesmo já validado pela whitelist.
        const res = await fetch(`${LOCALES_PATH}/${encodeURIComponent(lang)}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        jsonLang = await res.json();
        console.debug(`[ChatRD][i18n] Locale "${lang}" loaded successfully!`);
    }
	catch (err) {
        console.error(`[ChatRD][i18n] Failed to load locale "${lang}":`, err);
        jsonLang = {};
    }
}

/** Escapa caracteres especiais de HTML para evitar injeção via interpolação. */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function tRD(key, vars) {
    const resolved = key.split('.').reduce((acc, part) => {
        if (acc == null || typeof acc !== 'object') return undefined;
        return acc[part];
    }, jsonLang);

    let value = resolved ?? key;

    if (vars) {
        value = value.replace(/\{(\w+)\}/g, (_, k) => {
            if (!(k in vars) || vars[k] == null) return `{${k}}`;
            return escapeHtml(vars[k]);
        });
    }

    return value;
}