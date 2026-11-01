// src/lib/widev/spin.js
// spin v10.4: Animación de estados de carga en botones con preservación segura del marcado original (incluyendo iconos)

export const wiSpin = (btn, act = true, txt = '') => {
  if (typeof document === 'undefined') return;

  let el = typeof btn === 'string' ? document.querySelector(btn) : btn;
  if (el && (el).jquery) el = (el)[0];
  if (!el) return;

  if (act) {
    // 1. Guardar el HTML original (con textos e iconos originales) solo si no se ha guardado ya
    if (!el.getAttribute('data-txt')) {
      el.setAttribute('data-txt', el.innerHTML);
    }
    el.disabled = true;
    const loadingText = txt || 'Cargando...';
    el.innerHTML = `${loadingText} <i class="fa-solid fa-spinner fa-spin spin_icon_margin"></i>`;
  } else {
    el.disabled = false;
    // 2. Restaurar el HTML original resguardado
    const originalHTML = el.getAttribute('data-txt');
    if (originalHTML !== null) {
      el.innerHTML = originalHTML;
    } else if (txt) {
      el.textContent = txt;
    } else {
      el.textContent = 'Continuar';
    }
    // 3. Limpiar el atributo para permitir futuros usos del spinner en el mismo botón
    el.removeAttribute('data-txt');
  }
};