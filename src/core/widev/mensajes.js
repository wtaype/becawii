// src/lib/widev/mensajes.js
// mensajes v1.0: Módulo unificado de mensajes UI — Toasts (Mensaje) + Banners apilables (Notificacion)
// CSS centralizado aquí en una sola inyección para toda la app

import { wiInit } from './wiinit.js';

// ── Helper XSS: convierte texto en contenido seguro para innerHTML ───────────
const _safe = (txt) => {
  if (typeof document === 'undefined') return String(txt ?? '');
  
  try {
    const doc = new DOMParser().parseFromString(txt, 'text/html');
    const permitidos = ['i', 'b', 'strong', 'em', 'span', 'br'];

    const limpiar = (node) => {
      if (node.nodeType === 1) { // Nodo elemento
        const tag = node.tagName.toLowerCase();
        
        if (!permitidos.includes(tag)) {
          // Si no está permitido, lo neutralizamos convirtiéndolo a texto plano
          const textNode = document.createTextNode(node.outerHTML);
          node.parentNode?.replaceChild(textNode, node);
        } else {
          // Si está permitido, eliminamos atributos peligrosos (eventos on*, javascript: urls)
          [...node.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            const val = attr.value.toLowerCase();
            if (name.startsWith('on') || val.includes('javascript:')) {
              node.removeAttribute(attr.name);
            }
          });
          
          // Limpiar nodos hijos recursivamente
          let child = node.firstChild;
          while (child) {
            const next = child.nextSibling;
            limpiar(child);
            child = next;
          }
        }
      }
    };

    let child = doc.body.firstChild;
    while (child) {
      const next = child.nextSibling;
      limpiar(child);
      child = next;
    }

    return doc.body.innerHTML;
  } catch (e) {
    // Fallback básico ante cualquier error
    const el = document.createElement('div');
    el.textContent = String(txt ?? '');
    return el.innerHTML;
  }
};

// ── Iconos por tipo de alerta ────────────────────────────────────────────────
const _ico = {
  success: 'fa-circle-check',
  error:   'fa-circle-xmark',
  warning: 'fa-triangle-exclamation',
  info:    'fa-circle-info'
};

// ── TOAST flotante centrado ──────────────────────────────────────────────────
export function Mensaje(msg, tipo = 'success') {
  if (typeof document === 'undefined') return;

  // Eliminar toasts previos para no colapsar la pantalla
  document.querySelectorAll('.widev-toast').forEach(el => el.remove());

  const icon = document.createElement('i');
  icon.className = `fa-solid ${_ico[tipo] ?? 'fa-circle-info'}`;

  const span = document.createElement('span');
  span.innerHTML = _safe(msg);

  const toast = document.createElement('div');
  toast.className = `widev-toast widev-toast--${tipo}`;
  toast.append(icon, span);
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('active'));
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── BANNER apilable lateral ──────────────────────────────────────────────────
export function Notificacion(msg, tipo = 'error', tiempo = 3000) {
  if (typeof document === 'undefined') return;

  // Obtener o crear el contenedor apilador (Bajo Demanda - Singleton)
  let container = document.getElementById('notificationsContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationsContainer';
    document.body.appendChild(container);
  }

  const icon = document.createElement('i');
  icon.className = `fa-solid ${_ico[tipo] ?? 'fa-circle-info'}`;

  const span = document.createElement('span');
  span.innerHTML = _safe(msg);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '×';

  const notif = document.createElement('div');
  notif.className = `notification notif-${tipo}`;
  notif.append(icon, span, closeBtn);
  container.appendChild(notif);

  // Animar entrada con RAF para garantizar la transición CSS
  requestAnimationFrame(() => notif.classList.add('active'));

  const cerrar = () => {
    notif.classList.remove('active');
    notif.style.transform = 'translateX(4vh)';
    setTimeout(() => notif.remove(), 350);
  };

  closeBtn.addEventListener('click', cerrar);
  setTimeout(cerrar, tiempo);
}
