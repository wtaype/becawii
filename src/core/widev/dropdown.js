// src/core/widev/dropdown.js
// widropdown v1.0: Generador dinámico y accesible de menús contextuales y dropdowns flotantes

/**
 * Crea y gestiona un menú desplegable (dropdown) flotante.
 * 
 * @param {HTMLElement} triggerEl - El botón o elemento que activa el menú.
 * @param {Object[]} items - Lista de opciones del menú: [{ icon: 'fas fa-image', label: 'Adjuntar imagen', shortcut: 'Ctrl+U', action: () => {} }]
 * @param {Object} options - Opciones de diseño: { posicion: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }
 */
export const wiDropdown = (triggerEl, items, options = {}) => {
  if (!triggerEl) return;
  const posicion = options.posicion || 'top-left';

  // Si ya tiene el listener de click registrado para controlar el toggle, no hacer nada
  if (triggerEl.dataset.widropdownActive) return;
  triggerEl.dataset.widropdownActive = 'true';

  const toggleMenu = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Si ya hay un menú abierto de este trigger, lo cerramos
    const existente = document.querySelector(`.wi-dropdown-menu[data-trigger-id="${triggerEl.id || 'temp'}"]`);
    if (existente) {
      existente.classList.remove('active');
      setTimeout(() => existente.remove(), 150);
      return;
    }

    // Cerrar cualquier otro dropdown abierto en la página
    cerrarTodosLosDropdowns();

    // Crear el contenedor del menú
    const menu = document.createElement('div');
    menu.className = `wi-dropdown-menu ${posicion}`;
    menu.setAttribute('data-trigger-id', triggerEl.id || 'temp');

    // Generar el HTML de las opciones
    menu.innerHTML = items.map((item, idx) => {
      if (item.divider) {
        return `<div class="wi-dropdown-divider"></div>`;
      }
      return `
        <div class="wi-dropdown-item" data-idx="${idx}">
          <span class="wi-dropdown-item-content">
            ${item.icon ? `<i class="${item.icon} wi-dropdown-icon"></i>` : ''}
            <span class="wi-dropdown-label">${item.label}</span>
          </span>
          ${item.shortcut ? `<span class="wi-dropdown-shortcut">${item.shortcut}</span>` : ''}
        </div>
      `;
    }).join('');

    // Agregar eventos a los ítems
    menu.querySelectorAll('.wi-dropdown-item').forEach(el => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
        const item = items[idx];
        if (item && item.action) {
          item.action();
        }
        cerrarMenu();
      });
    });

    document.body.appendChild(menu);

    // Calcular posición flotante relativa al triggerEl
    const rect = triggerEl.getBoundingClientRect();
    
    // Posicionamiento absoluto
    let top = 0;
    let left = 0;

    // Temporalmente forzar auto-ajuste de altura del menú para el cálculo de top-left y top-right
    const menuHeight = menu.offsetHeight || (items.length * 36 + 12);
    const menuWidth = menu.offsetWidth || 220;

    if (posicion === 'top-left') {
      top = rect.top + window.scrollY - menuHeight - 8;
      left = rect.left + window.scrollX;
    } else if (posicion === 'top-right') {
      top = rect.top + window.scrollY - menuHeight - 8;
      left = rect.right + window.scrollX - menuWidth;
    } else if (posicion === 'bottom-left') {
      top = rect.bottom + window.scrollY + 8;
      left = rect.left + window.scrollX;
    } else if (posicion === 'bottom-right') {
      top = rect.bottom + window.scrollY + 8;
      left = rect.right + window.scrollX - menuWidth;
    }

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;

    // Activar animación
    requestAnimationFrame(() => {
      menu.classList.add('active');
    });

    // Cerrar al hacer click fuera o presionar escape
    const handleOutsideClick = (event) => {
      if (!menu.contains(event.target) && !triggerEl.contains(event.target)) {
        cerrarMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        cerrarMenu();
      }
    };

    const cerrarMenu = () => {
      menu.classList.remove('active');
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
      setTimeout(() => menu.remove(), 150);
    };

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
  };

  triggerEl.addEventListener('click', toggleMenu);
};

export const cerrarTodosLosDropdowns = () => {
  document.querySelectorAll('.wi-dropdown-menu').forEach(menu => {
    menu.classList.remove('active');
    setTimeout(() => menu.remove(), 150);
  });
};
