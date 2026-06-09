/* ===== WorkSplit — i18n runtime =====
 * Carga las traducciones desde un archivo separado por pipes "|"
 * (public/i18n/translations.csv) con cabecera: key|es|en|...
 * La primera columna es la clave; cada columna siguiente es un idioma.
 * Añadir un idioma nuevo = añadir una columna al archivo (no hace falta tocar el código).
 */
(function () {
  const STORAGE_KEY = 'worksplit_lang';
  const DEFAULT_LANG = 'es';
  const CSV_URL = '/i18n/translations.csv';
  const LOCALE = { es: 'es-MX', en: 'en-US' };
  const ENDONYM = { es: 'Español', en: 'English' };

  let translations = {};        // { es: { key: val }, en: { key: val } }
  let langs = [DEFAULT_LANG];   // orden de idiomas según la cabecera del CSV
  let current = DEFAULT_LANG;

  function detectLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    const nav = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    return nav || DEFAULT_LANG;
  }

  // Parser sencillo separado por "|". Una línea por clave; el pipe permite
  // que los valores contengan comas/comillas sin escaparse.
  function parseTable(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim().length);
    if (!lines.length) return;
    const header = lines[0].split('|').map((s) => s.trim());
    langs = header.slice(1).filter(Boolean);
    const data = {};
    langs.forEach((l) => { data[l] = {}; });
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split('|');
      const key = (cols[0] || '').trim();
      if (!key) continue;
      langs.forEach((l, idx) => {
        const v = cols[idx + 1];
        data[l][key] = v !== undefined ? v : '';
      });
    }
    translations = data;
  }

  async function load() {
    try {
      const res = await fetch(CSV_URL, { cache: 'no-cache' });
      if (res.ok) parseTable(await res.text());
    } catch (e) { /* sin traducciones: t() devolverá la propia clave */ }

    let l = detectLang();
    if (!translations[l]) l = translations[DEFAULT_LANG] ? DEFAULT_LANG : (langs[0] || DEFAULT_LANG);
    current = l;
    document.documentElement.lang = current;
  }

  function t(key, vars) {
    let s = translations[current] && translations[current][key];
    if (s == null || s === '') s = translations[DEFAULT_LANG] && translations[DEFAULT_LANG][key];
    if (s == null) s = key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return s;
  }

  function applyTranslations(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    root.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label')));
    });
  }

  function getLang() { return current; }
  function availableLangs() { return langs.slice(); }
  function langName(l) { return ENDONYM[l] || l.toUpperCase(); }
  function localeFor(l) { return LOCALE[l || current] || 'en-US'; }

  function setLang(l) {
    if (!translations[l]) return;
    current = l;
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
    applyTranslations(document);
    if (typeof window.onLangChange === 'function') window.onLangChange();
  }

  window.I18N = { load, t, applyTranslations, setLang, getLang, availableLangs, langName, localeFor };
  window.t = t; // atajo global
})();
