// src/core/widev/witip.js
// wiTip v12.0: Tooltip flotante interactivo con soporte de hover en la burbuja y retraso suave de 1.15s

import { wiInit } from './wiinit.js';

let activeTarget = null;
let activeTip = null;
let hideTimeout = null;

const DELAY_MS = 100; // 1.15 segundos de retraso suave antes de ocultar

export function wiTip(elmOrTxt, txt, tipo = 'top', tiempo = 1800) {
  if (typeof document === 'undefined') return;

  if (!document.__wiTipDelegated) {
    document.__wiTipDelegated = true;

    // Delegación limpia de mouseover para mostrar u mantener activo el tooltip
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest?.('[data-witip]');
      const tipEl = e.target.closest?.('.wiTip');

      // Si el cursor está sobre el elemento objetivo o sobre el propio tooltip, cancelar la cuenta regresiva
      if (target || tipEl) {
        clearTimeout(hideTimeout);
      }

      if (target && activeTarget !== target) {
        activeTarget = target;
        wiTip.ver(target, target.getAttribute('data-witip') || '', target.getAttribute('data-wtipo') || 'top', 0);
      }
    });

    // Delegación de mouseout con retraso inteligente de 1.15s (1150ms)
    document.addEventListener('mouseout', (e) => {
      const related = e.relatedTarget;
      const isTargetOrChild = activeTarget && (activeTarget === related || activeTarget.contains(related));
      const isTipOrChild = activeTip && (activeTip === related || activeTip.contains(related));

      // Si el ratón sale hacia afuera de ambos contenedores, iniciar cuenta de 1.15s
      if (!isTargetOrChild && !isTipOrChild) {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          hide();
        }, DELAY_MS);
      }
    });

    // Ocultamiento inmediato al hacer clic en cualquier elemento de la pantalla
    document.addEventListener('click', () => {
      hide();
    });

    // Ocultamiento inmediato al desplazarse o perder el foco
    window.addEventListener('scroll', () => hide(), { passive: true });
    window.addEventListener('blur', () => hide());
  }

  if (!elmOrTxt) return;
  if (typeof elmOrTxt === 'string' && !txt) {
    return `data-witip="${elmOrTxt}" data-wtipo="${tipo}" data-wtiempo="${tiempo}"`;
  }
  return wiTip.ver(elmOrTxt, txt || '', tipo, tiempo), elmOrTxt;
}

const hide = () => {
  activeTarget = null;
  activeTip = null;
  clearTimeout(hideTimeout);
  const tips = document.querySelectorAll('.wiTip');
  tips.forEach(t => {
    t.classList.remove('show');
    t.remove();
  });
};

wiTip.ocultar = hide;

wiTip.ver = (elm, txt, tipo, tiempo) => {
  const el = typeof elm === 'string' ? document.querySelector(elm) : elm;
  if (!el) return;

  hide();

  const colorTheme = { success: 'var(--success)', error: 'var(--error)', warning: 'var(--warning)', info: 'var(--info)' }[tipo] || 'var(--mco)';
  const pos = ['top', 'bottom', 'left', 'right'].includes(tipo) ? tipo : 'top';

  const tip = document.createElement('div');
  tip.className = `wiTip tip-${pos}`;
  Object.assign(tip.style, {
    background: colorTheme,
    borderColor: colorTheme,
    pointerEvents: 'auto'
  });
  tip.innerHTML = `<span>${txt}</span>`;
  document.body.appendChild(tip);
  activeTip = tip;

  const rect = el.getBoundingClientRect();
  const tipW = tip.offsetWidth;
  const tipH = tip.offsetHeight;

  let leftPos = rect.left + rect.width / 2 - tipW / 2;
  let topPos = rect.top - tipH - 8;

  if (pos === 'right') {
    leftPos = rect.right + 10;
    topPos = rect.top + rect.height / 2 - tipH / 2;
  } else if (pos === 'bottom') {
    leftPos = rect.left + rect.width / 2 - tipW / 2;
    topPos = rect.bottom + 8;
  } else if (pos === 'left') {
    leftPos = rect.left - tipW - 10;
    topPos = rect.top + rect.height / 2 - tipH / 2;
  }

  leftPos = Math.max(8, Math.min(leftPos, window.innerWidth - tipW - 8));
  topPos = Math.max(8, Math.min(topPos, window.innerHeight - tipH - 8));

  Object.assign(tip.style, {
    left: `${leftPos}px`,
    top: `${topPos}px`
  });

  requestAnimationFrame(() => {
    tip.classList.add('show');
    if (tiempo > 0) {
      hideTimeout = setTimeout(() => {
        hide();
      }, tiempo);
    }
  });
};

wiInit(() => wiTip());