// src/core/widev/tema.js
// 🎨 Gestor Universal de Temas (wiTema) - Detección Smart & Cero FOUC
const KEY = 'wiTema';

export const witemas = {
  futuro: '#07131b',
  luz: '#f4f8fb'
};

export const wiTema = {
  get: () => {
    try {
      return localStorage.getItem(KEY) || (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'luz' : 'futuro');
    } catch {
      return 'luz';
    }
  },

  set: (t, persist = true) => {
    const tema = t === 'futuro' ? 'futuro' : 'luz';
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.dataset.theme = tema;
      document.querySelectorAll('#themeIcon, #icon_theme, #btnThemeToggle i').forEach((i) => {
        i.className = tema === 'futuro' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
      });
      let meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = tema === 'futuro' ? '#07131b' : '#f4f8fb';
    }
    if (persist) {
      try { localStorage.setItem(KEY, tema); } catch {}
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('witema:cambiado', { detail: { tema } }));
    }
  },

  toggle: () => {
    const actual = (typeof document !== 'undefined' && document.documentElement.dataset.theme) || wiTema.get();
    wiTema.set(actual === 'futuro' ? 'luz' : 'futuro', true);
  },

  listen: () => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      try {
        if (!localStorage.getItem(KEY)) {
          wiTema.set(e.matches ? 'luz' : 'futuro', false);
        }
      } catch {}
    });
  },

  init: () => {
    wiTema.set(wiTema.get(), false);
    wiTema.listen();
  }
};

if (typeof window !== 'undefined') {
  (window).toggleTema = wiTema.toggle;
}

export const setTema = (name) => wiTema.set(name, true);
export const getTemaActual = wiTema.get;
export const witema = wiTema.init;

export default wiTema;
