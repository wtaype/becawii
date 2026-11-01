// src/lib/widev/wismart.js
// wiSmart v14.1: Carga diferida e inteligente de hojas de estilos externas, fuentes web y scripts asíncronos en base a interacción

import { getls, savels } from './storage.js';

export const wiSmart = (() => {
  const ok = new Set();
  let opt = null;

  const run = () => {
    if (!opt || typeof document === 'undefined') return;
    Object.entries(opt).forEach(([t, v]) => [].concat(v).forEach(it => {
      const k = `${t}:${it}`;
      if (t === 'css') {
        if (!document.querySelector(`link[href="${it}"]`)) {
          const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: it });
          link.setAttribute('data-astro-transition-persist', 'google-fonts');
          document.head.appendChild(link);
        }
      } else if (t === 'js' && typeof it === 'string') {
        if (!document.querySelector(`script[src="${it}"]`)) {
          document.head.appendChild(Object.assign(document.createElement('script'), { src: it, async: true, crossOrigin: 'anonymous' }));
        }
      } else if (typeof it === 'function' && !ok.has(k)) {
        ok.add(k);
        it().catch?.(e => console.error('wiSmart:', e));
      }
    }));
    savels('wiSmart', 1);
  };

  const init = (o) => {
    if (o) {
      if (!opt) opt = {};
      Object.entries(o).forEach(([t, v]) => {
        opt[t] = (opt[t] || []).concat(v);
      });
    }
    if (getls('wiSmart')) return run();
    
    if (typeof document === 'undefined') return;
    const trigger = () => {
      run();
      ['touchstart', 'scroll', 'click', 'mousemove'].forEach(ev => document.removeEventListener(ev, trigger));
    };
    ['touchstart', 'scroll', 'click', 'mousemove'].forEach(ev => document.addEventListener(ev, trigger, { once: true }));
  };

  if (typeof document !== 'undefined') document.addEventListener('astro:page-load', () => init());
  return init;
})();
