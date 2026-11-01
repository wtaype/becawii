// src/lib/widev/langwii.js
// langwii v1.2: Gestor centralizado de idiomas, traducciones inline, interpolación dinámica y traducción automática de DOM

export const langwii = {
  /**
   * Opción 1: Obtener idioma activo ('es' o 'en')
   * Prioriza: 1. Param explícito o Astro.currentLocale, 2. window.__l (0ms, Layout inline),
   *           3. document.documentElement.lang, 4. Fallback 'es'
   */
  get(l = '') {
    // 1a. Objeto Astro global → extraemos currentLocale
    if (l && typeof l === 'object' && 'currentLocale' in l) l = l.currentLocale;
    // 1b. String explícito (prop pasada directamente)
    if (l && typeof l === 'string') return l.startsWith('en') ? 'en' : 'es';
    // 2. Cliente: variable inyectada en 0ms por Layout.astro inline script
    if (typeof window !== 'undefined' && window.__l) return window.__l;
    // 3. Fallback DOM (html lang=)
    if (typeof document !== 'undefined' && document.documentElement.lang)
      return document.documentElement.lang.startsWith('en') ? 'en' : 'es';
    // 4. Fallback seguro
    return 'es';
  },

  /**
   * Opción 2: Consultar si el idioma activo es inglés (booleano rápido)
   */
  esEn(l = '') {
    return this.get(l) === 'en';
  },

  /**
   * Opción 3: Traducir diccionario con soporte de interpolación de variables
   */
  nw(dict, params = {}, l = '') {
    if (!dict) return '';
    const activeLang = this.get(l);
    let str = dict[activeLang] || dict['es'] || '';
    
    // Interpolación de variables {key}
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
    });
    return str;
  },

  /**
   * Opción 4: Cambiar idioma activo en el DOM (documentElement.lang)
   */
  set(l) {
    if (typeof document === 'undefined') return;
    const cleanLang = l.startsWith('en') ? 'en' : 'es';
    document.documentElement.lang = cleanLang;
    return cleanLang;
  },

  /**
   * Opción 5: Formatear plantilla rápida bilingüe directa en una línea (alias: line / n)
   */
  n(esStr, enStr, params = {}, l = '') {
    // Si params es el objeto Astro global o un string de locale, lo desplazamos a l
    if (typeof params === 'string' || (params && typeof params === 'object' && 'currentLocale' in params)) {
      l = params;
      params = {};
    }
    return this.nw({ es: esStr, en: enStr }, params, l);
  },

  line(esStr, enStr, params = {}, l = '') {
    return this.n(esStr, enStr, params, l);
  },

  /**
   * Opción 6: Traductor automático del DOM por atributos data-es y data-en (Emergencias cliente)
   */
  dom(sel = '[data-es]') {
    if (typeof document === 'undefined') return;
    const isEnglish = this.esEn();
    document.querySelectorAll(sel).forEach(el => {
      const txt = isEnglish ? el.getAttribute('data-en') : el.getAttribute('data-es');
      if (txt !== null) el.textContent = txt;
    });
  }
};

/** getLang — alias atómico tipado. Importación directa recomendada en scripts cliente.
 *  import { getLang } from '../widev/langwii.js';
 */
export const getLang = () => langwii.get();

/* ─────────────────────────────────────────────────────────────────────────────
   📖 GUÍA DE USO DE LANGWII (6 OPCIONES DE INTEGRACIÓN)
   
   Opción 1: Obtener el idioma de forma limpia y segura
   const lang = langwii.get(); // Retorna 'es' o 'en' (resuelve SSR y DOM automáticamente)
   
   Opción 2: Validación booleana rápida para inglés
   if (langwii.esEn()) {
     // Lógica exclusiva para inglés
   }
   
   Opción 3: Diccionario bilingüe con interpolación de variables dinámicas (nw)
   const text = langwii.nw(
     { es: 'Hola {user}, tienes {n} mensajes', en: 'Hello {user}, you have {n} messages' },
     { user: 'Wilder', n: 3 }
   );
   
   Opción 4: Forzar/Cambiar el idioma en el navegador
   langwii.set('en'); // Actualiza <html lang="en"> en tiempo real
   
   Opción 5: Traducción directa de una sola letra (n) para líneas inline
   const msg = langwii.n('¡Proceso finalizado!', 'Process complete!');
   
   Opción 6: Traducción automática del DOM (para emergencias en el cliente)
   langwii.dom('.traducir'); // Escanea y traduce elementos con data-es/data-en
   ───────────────────────────────────────────────────────────────────────────── */
