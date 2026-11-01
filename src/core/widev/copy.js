// src/lib/widev/copy.js
// wicopy v11.1: Copiar textos al portapapeles con feedback de tooltip e i18n via langwii

import { wiTip } from './witip.js';
import { langwii } from './langwii.js';

export const wicopy = (txt, elm = null, msg = '') => {
  const getCnt = () => {
    if (typeof txt === 'string') {
      if (txt.trim().match(/^[.#\[]/)) {
        const el = document.querySelector(txt);
        if (el) return 'value' in el ? el.value : el.textContent || '';
      }
      return txt;
    }
    if (txt instanceof HTMLElement) {
      return 'value' in txt ? txt.value : txt.textContent || '';
    }
    return String(txt ?? '');
  };
  
  const cnt = getCnt();
  const activeMsg = msg || langwii.line('¡Copiado!', 'Copied!');
  const fin = () => elm ? wiTip(elm, activeMsg, 'mco', 1500) : console.log(`${activeMsg}: ${cnt}`);

  const fallback = () => {
    try {
      const t = document.createElement('textarea');
      t.value = cnt;
      Object.assign(t.style, { position: 'absolute', left: '-9999px' });
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    } catch (e) {}
    fin();
  };
  
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(cnt).then(fin).catch(fallback);
  } else {
    fallback();
  }
};