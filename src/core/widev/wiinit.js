// src/lib/widev/wiinit.js
// wiInit v1.0: Helper compartido de auto-inicialización agnóstico para módulos widev/
// Elimina el patrón repetido de DOMContentLoaded + astro:page-load + turbo:load en cada archivo

/**
 * Registra una función para que se ejecute:
 *   1. Inmediatamente si el DOM ya está listo
 *   2. En cada transición de Astro ClientRouter (astro:page-load)
 *   3. En cada transición de Turbo / Hotwire / HTMX (turbo:load)
 *
 * @param {() => void} fn - Función a inicializar (se envuelve en try/catch)
 * @returns {() => void} Función cleanup que cancela los listeners registrados
 */
export const wiInit = (fn) => {
  if (typeof window === 'undefined') return () => {};

  const safe = () => { try { fn(); } catch (e) { console.error('[wiInit]', e); } };

  // 1. Carga inicial del DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safe, { once: true });
  } else {
    safe();
  }

  // 2. Soporte Astro ClientRouter
  document.addEventListener('astro:page-load', safe);

  // 3. Soporte Turbo / Hotwire / HTMX
  document.addEventListener('turbo:load', safe);

  // Retorna cleanup para frameworks con unmount (Svelte onDestroy, React useEffect, Vue onUnmounted)
  return () => {
    document.removeEventListener('astro:page-load', safe);
    document.removeEventListener('turbo:load', safe);
  };
};
