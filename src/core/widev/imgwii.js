// src/lib/widev/imgwii.js
// imgwii v7.3: Carga diferida de imágenes con placeholder e inyección de efectos blur-up automáticos (estilos en witema.css)

import { wiInit } from './wiinit.js';

export const imgwii = (() => {
  let obs = null;

  const applyImg = (el) => {
    if (el.dataset.src) {
      el.src = el.dataset.src;
      delete el.dataset.src;
      const finish = () => {
        el.classList.remove('wi_skeleton');
        el.classList.add('wi_loaded', 'loaded');
      };
      if (el.complete) finish();
      else { el.onload = finish; el.onerror = finish; }
    } else if (el.dataset.bg) {
      el.style.backgroundImage = `url('${el.dataset.bg}')`;
      el.classList.remove('wi_skeleton');
      delete el.dataset.bg;
    }
  };

  const getObserver = () => {
    if (!obs) {
      obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            obs.unobserve(e.target);
            applyImg(e.target);
          }
        });
      }, { rootMargin: '120px' });
    }
    return obs;
  };

  /** @param {string | HTMLElement | Document} [scopeOrEl] */
  const ver = (scopeOrEl = document) => {
    const scope = typeof scopeOrEl === 'string' ? document.querySelector(scopeOrEl) ?? document : scopeOrEl;
    const root = scope instanceof HTMLElement ? scope : document;

    const observer = getObserver();

    root.querySelectorAll('img[data-src]').forEach(el => {
      if (!el.getAttribute('src')) {
        el.setAttribute('src', imgwii.svg);
      }
      el.classList.add('wi_skeleton');
      observer.observe(el);
    });

    root.querySelectorAll('[data-bg]').forEach(el => {
      el.classList.add('wi_skeleton');
      observer.observe(el);
    });
  };

  return {
    svg: "/wpuntos.svg",
    ver
  };
})();

wiInit(() => imgwii.ver());