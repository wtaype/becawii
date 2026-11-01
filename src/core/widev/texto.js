// src/lib/widev/texto.js
// texto v10.2: Utilidades de manipulación de textos, capitalizaciones y formateadores en tiempo real para inputs

export const Mayu = (ltr) => ltr.toUpperCase();
export const Capi = (txt = '') => txt ? txt[0].toUpperCase() + txt.slice(1) : '';
export const mis10 = (txt) => txt.length <= 10 ? txt : txt.substring(0, 10) + '...';

// Capitaliza cada palabra
export const Capit = (txt = '') => txt.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

// Convierte el valor de un input a minúsculas en tiempo real manteniendo la selección del cursor
export function minus(selOrEl) {
  if (typeof document === 'undefined') return;

  const el = typeof selOrEl === 'string' ? document.querySelector(selOrEl) : selOrEl;
  if (!el) return;

  el.addEventListener('input', () => {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    el.value = el.value.toLowerCase();
    el.setSelectionRange(start, end);
  });
}