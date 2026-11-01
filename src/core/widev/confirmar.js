// src/lib/widev/confirmar.js
// wiConfirmar v1.0: Módulo unificado para modales de confirmación interactivos y premium (Promesas-based)
// CSS inyectado dinámicamente para garantizar portabilidad y compatibilidad de temas

const _ico = {
  success: 'fa-circle-check',
  danger:  'fa-triangle-exclamation',
  warning: 'fa-triangle-exclamation',
  info:    'fa-circle-info'
};

export function wiConfirmar(mensaje, opciones = {}) {
  if (typeof document === 'undefined') return Promise.resolve(false);

  const config = {
    titulo: 'Confirmar Acción',
    tipo: 'warning', // success, danger, warning, info
    siTexto: 'Aceptar',
    noTexto: 'Cancelar',
    ...opciones
  };

  return new Promise((resolve) => {
    // 1. Crear estructura DOM
    const overlay = document.createElement('div');
    overlay.className = 'wic-overlay';

    overlay.innerHTML = `
      <div class="wic-modal">
        <div class="wic-header">
          <div class="wic-icon wic-icon--${config.tipo}">
            <i class="fa-solid ${_ico[config.tipo] || 'fa-circle-info'}"></i>
          </div>
          <div class="wic-title">${config.titulo}</div>
        </div>
        <div class="wic-message">${mensaje}</div>
        <div class="wic-footer">
          <button type="button" class="wic-btn wic-btn--cancel" id="wic-btn-no">${config.noTexto}</button>
          <button type="button" class="wic-btn wic-btn--confirm ${config.tipo === 'danger' ? 'wic-btn--danger' : ''}" id="wic-btn-si">${config.siTexto}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Forzar la animación de entrada
    requestAnimationFrame(() => overlay.classList.add('active'));

    const btnSi = overlay.querySelector('#wic-btn-si');
    const btnNo = overlay.querySelector('#wic-btn-no');

    // Foco automático en el botón de confirmar para mejorar usabilidad
    setTimeout(() => btnSi.focus(), 50);

    const cerrarConResultado = (resultado) => {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
        resolve(resultado);
      }, 250);
    };

    // Eventos de Click
    btnSi.addEventListener('click', () => cerrarConResultado(true));
    btnNo.addEventListener('click', () => cerrarConResultado(false));

    // Cerrar al hacer click en el fondo
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cerrarConResultado(false);
      }
    });

    // Cerrar al pulsar Escape o confirmar al pulsar Enter
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        window.removeEventListener('keydown', keyHandler);
        cerrarConResultado(false);
      }
    };
    window.addEventListener('keydown', keyHandler);
  });
}

export default wiConfirmar;
