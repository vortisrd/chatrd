/**
 * ChatRD — Settings i18n
 */

class SettingsI18n {
  /**
   * @param {object}  options
   * @param {string}  options.localesPath   - Caminho para a pasta locale (padrão: './locale')
   * @param {string}  options.fallbackLocale - Idioma de fallback          (padrão: 'en')
   * @param {string}  options.storageKey     - Chave no localStorage        (padrão: 'chatrd_locale')
   */
  constructor(options = {}) {
    this.localesPath    = options.localesPath    ?? './locale';
    this.fallbackLocale = options.fallbackLocale ?? 'en';
    this.storageKey     = options.storageKey     ?? 'chatrd_locale';

    this._strings  = {};   // strings do idioma ativo
    this._fallback = {};   // strings do idioma de fallback (sempre carregadas)
    this.locale    = null; // idioma ativo

    // Lista branca de idiomas suportados. Qualquer valor fora deste conjunto
    // é rejeitado antes de tocar no filesystem/rede (previne path traversal).
    this._supportedLocales = new Set([
      'de', 'en', 'es-ES', 'fr-FR', 'it-IT', 'pt-BR', 'pl', 'tl-PH'
    ]);

    // Formato aceito antes mesmo de checar a whitelist (defesa em profundidade).
    this._localeFormat = /^[a-zA-Z0-9_-]+$/;
  }

  // ─── Inicialização ───────────────────────────────────────────────────────────

  /**
   * Detecta o idioma (localStorage → navigator → fallback) e aplica as traduções.
   * @param {string} [forceLocale] - Força um idioma específico (ignora detecção automática).
   */
  async init(forceLocale) {
    // Carrega o fallback primeiro (sempre)
    this._fallback = await this._load(this.fallbackLocale);

    const locale = forceLocale ?? this._detect();
    await this._applyLocale(locale);
  }

  /**
   * Troca o idioma ativo e re-renderiza a página.
   * @param {string} locale - ex.: 'pt-BR', 'en', 'es'
   */
  async setLocale(locale) {
    if (!this._isValidLocale(locale)) {
      console.warn(`[i18n] Locale inválido ignorado: ${locale}`);
      locale = this.fallbackLocale;
    }
    localStorage.setItem(this.storageKey, locale);
    await this._applyLocale(locale);
  }

  // ─── Tradução de strings ──────────────────────────────────────────────────────

  /**
   * Retorna a string traduzida para a chave informada.
   * Notação com ponto: 'section.key' ou 'section.subsection.key'
   *
   * @param {string} key           - Chave com notação de ponto.
   * @param {object} [vars]        - Variáveis para interpolação: { user: 'Alice' }
   * @param {string} [fallback]    - Texto exibido se a chave não existir.
   * @returns {string}
   */
  t(key, vars, fallback) {
    const value =
      this._resolve(this._strings, key) ??
      this._resolve(this._fallback, key) ??
      fallback ??
      key;

    return vars ? this._interpolate(value, vars) : value;
  }

  // ─── Privados ────────────────────────────────────────────────────────────────

  /** Detecta o idioma preferido do usuário. */
  _detect() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved && this._isValidLocale(saved)) return saved;

    // Tenta o idioma completo (ex.: 'pt-BR'), depois só a língua (ex.: 'pt')
    const nav    = navigator.language ?? navigator.userLanguage ?? '';
    const lang   = nav.toLowerCase();
    const short  = lang.split('-')[0];

    // Normaliza para o formato que usamos nos arquivos (ex.: 'pt-br' → 'pt-BR')
    return this._normalizeLocale(lang) ?? this._normalizeLocale(short) ?? this.fallbackLocale;
  }

  /**
   * Valida se um locale tem o formato esperado E está na lista branca de
   * idiomas suportados. Usado como barreira antes de montar qualquer URL
   * de fetch.
   */
  _isValidLocale(locale) {
    return (
      typeof locale === 'string' &&
      this._localeFormat.test(locale) &&
      this._supportedLocales.has(locale)
    );
  }

  /** Carrega o JSON de um locale específico. Retorna {} em caso de erro ou locale inválido. */
  async _load(locale) {
    if (!this._isValidLocale(locale)) {
      console.warn(`[i18n] Tentativa de carregar locale não suportado: ${locale}`);
      return {};
    }
    try {
      // encodeURIComponent como defesa extra, mesmo já validado pela whitelist.
      const url = `${this.localesPath}/${encodeURIComponent(locale)}-settings.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {};
    }
  }

  /** Carrega o locale solicitado, com fallback transparente, e aplica ao DOM. */
  async _applyLocale(locale) {
    const data = await this._load(locale);

    // Se o arquivo não existiu (objeto vazio), mantém o fallback como ativo
    this._strings = Object.keys(data).length ? data : this._fallback;
    this.locale   = Object.keys(data).length ? locale : this.fallbackLocale;

    this._applyToDom();
    this._updateHtmlLang();
  }

  /** Percorre o DOM e substitui os textos de acordo com os atributos data-i18n-*. */
  _applyToDom() {
    // data-i18n → textContent (seguro por natureza, não interpreta HTML)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key   = el.getAttribute('data-i18n');
      const value = this.t(key);
      if (value !== key) el.textContent = value;
    });

    // data-i18n-html → innerHTML (para labels com ícones FA ou links) — sanitizado
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key   = el.getAttribute('data-i18n-html');
      const value = this.t(key);
      if (value !== key) el.innerHTML = this._sanitizeHtml(value);
    });

    // data-i18n-placeholder → atributo placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key   = el.getAttribute('data-i18n-placeholder');
      const value = this.t(key);
      if (value !== key) el.placeholder = value;
    });

    // data-i18n-title → atributo title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key   = el.getAttribute('data-i18n-title');
      const value = this.t(key);
      if (value !== key) el.title = value;
    });
  }

  /** Atualiza o atributo lang da tag <html>. */
  _updateHtmlLang() {
    document.documentElement.lang = this.locale;
  }

  /**
   * Resolve uma chave com notação de ponto dentro de um objeto.
   * 'twitch.gifted_subs' → obj.twitch.gifted_subs
   */
  _resolve(obj, key) {
    return key.split('.').reduce((acc, part) => {
      if (acc == null || typeof acc !== 'object') return undefined;
      return acc[part];
    }, obj);
  }

  /**
   * Interpola variáveis em uma string. Os valores são HTML-escapados por
   * padrão, pois o resultado pode acabar em um elemento data-i18n-html.
   * 'Hello, {user}!' + { user: 'Alice' } → 'Hello, Alice!'
   */
  _interpolate(str, vars) {
    return str.replace(/\{(\w+)\}/g, (_, key) => {
      if (!(key in vars) || vars[key] == null) return `{${key}}`;
      return this._escapeHtml(String(vars[key]));
    });
  }

  /** Escapa caracteres especiais de HTML para evitar injeção via interpolação. */
  _escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Sanitizador básico para strings de tradução usadas com innerHTML.
   * Remove <script>/<style>, atributos de evento ("on*") e URLs "javascript:".
   *
   * Isto é uma rede de segurança mínima para strings de locale (que devem
   * ser conteúdo confiável, versionado com o código). NÃO é um substituto
   * para uma biblioteca de sanitização completa como DOMPurify caso, no
   * futuro, o conteúdo passe a vir de fontes não confiáveis (ex.: tradução
   * gerada por usuários).
   */
  _sanitizeHtml(html) {
    return String(html)
      // remove blocos <script>...</script> e <style>...</style>
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
      // remove atributos de evento inline: onclick=, onerror=, etc.
      .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
      // neutraliza esquemas perigosos em atributos de URL (href, src)
      .replace(/(href|src)\s*=\s*(["'])\s*javascript:/gi, '$1=$2#blocked:');
  }

  /**
   * Normaliza o código de idioma do navegador para o formato dos arquivos.
   * Ex.: 'pt-br' → 'pt-BR', 'en-us' → 'en'
   * Retorna null se não reconhecer o idioma.
   */
  _normalizeLocale(lang) {
    const map = {
      'de'          : 'de',
      'en'          : 'en',
      'es-es'       : 'es-ES',
      'fr-fr'       : 'fr-FR',
      'it-it'       : 'it-IT',
      'pt-br'       : 'pt-BR',
      'pl'          : 'pl',
      'tl-ph'       : 'tl-PH'
    };
    return map[lang.toLowerCase()] ?? null;
  }
}

// ─── Inicialização automática ─────────────────────────────────────────────────

/**
 * Instância global — acessível via window.i18n em qualquer lugar da página.
 * O settings.js original pode chamar window.i18n.t('section.key') quando precisar
 * de strings traduzidas de forma programática.
 */
window.i18n = new SettingsI18n();

document.addEventListener('DOMContentLoaded', async () => {
  await window.i18n.init();

  // Sincroniza o seletor de idioma com o locale ativo (se existir na página)
  const selector = document.getElementById('i18n-locale-selector');
  if (selector) {
    selector.value = window.i18n.locale;
    selector.addEventListener('change', async (e) => {
      await window.i18n.setLocale(e.target.value);
    });
  }
});