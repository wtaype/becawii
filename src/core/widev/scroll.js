// src/core/widev/scroll.js
// Motor Reutilizable de Virtual Scroll v1.0 (60-120 FPS)
// Diseñado por @wilder.taype - 100% Reutilizable y Ligero
// Mantiene entre 10 y 15 nodos DOM activos independientemente de si hay miles de elementos.

export class wiVirtualScroll {
  /**
   * Inicializa el motor de Virtual Scroll en un contenedor DOM.
   * @param {Object} config
   * @param {HTMLElement} config.container - Elemento contenedor con overflow-y: auto/scroll.
   * @param {Array} config.items - Lista de datos/elementos a renderizar.
   * @param {number} config.itemHeight - Altura estimada de cada fila en píxeles.
   * @param {number} [config.buffer=4] - Número de elementos de amortiguamiento arriba/abajo.
   * @param {Function} config.renderRow - Función (item, index) => HTMLElement | string que retorna el elemento o HTML.
   */
  constructor({ container, items = [], itemHeight = 60, buffer = 4, renderRow }) {
    if (!container) throw new Error('[wiVirtualScroll] El contenedor DOM es obligatorio.');
    if (typeof renderRow !== 'function') throw new Error('[wiVirtualScroll] renderRow debe ser una función.');

    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
    this.renderRow = renderRow;

    this.startIndex = 0;
    this.endIndex = 0;
    this.ticking = false;
    this._listeners = new Set();

    this._initDOM();
    this.attach();
  }

  /**
   * Crea la estructura interna con fantasma de altura total y la capa visible traducida.
   */
  _initDOM() {
    this.container.style.position = 'relative';

    // Contenedor fantasma que mantiene la barra de desplazamiento nativa
    this.phantom = document.createElement('div');
    this.phantom.className = 'wi_vscroll_phantom';
    Object.assign(this.phantom.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      zIndex: '-1',
      pointerEvents: 'none',
      height: `${this.items.length * this.itemHeight}px`
    });

    // Contenedor visible que desplaza los nodos reales mediante transform
    this.viewport = document.createElement('div');
    this.viewport.className = 'wi_vscroll_viewport';
    Object.assign(this.viewport.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      willChange: 'transform'
    });

    // Limpiar contenido previo y montar estructura
    this.container.innerHTML = '';
    this.container.appendChild(this.phantom);
    this.container.appendChild(this.viewport);
  }

  /**
   * Asigna el listener de scroll pasivo usando requestAnimationFrame para 60-120 FPS.
   */
  attach() {
    this._onScroll = () => {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this._updateVisibleRange();
          this.ticking = false;
        });
        this.ticking = true;
      }
    };

    this.container.addEventListener('scroll', this._onScroll, { passive: true });
    this._updateVisibleRange();
  }

  /**
   * Calcula el rango visible (startIndex -> endIndex) y renderiza sólo los nodos necesarios.
   */
  _updateVisibleRange() {
    const scrollTop = this.container.scrollTop;
    const clientHeight = this.container.clientHeight || 400;

    const visibleCount = Math.ceil(clientHeight / this.itemHeight);
    let start = Math.floor(scrollTop / this.itemHeight) - this.buffer;
    let end = start + visibleCount + (this.buffer * 2);

    start = Math.max(0, start);
    end = Math.min(this.items.length, end);

    // Evitar re-renderizados inútiles si los índices no cambiaron
    if (start === this.startIndex && end === this.endIndex && this.viewport.children.length > 0) {
      return;
    }

    this.startIndex = start;
    this.endIndex = end;

    // Ajustar la posición traducida de la ventana visible
    const offsetY = start * this.itemHeight;
    this.viewport.style.transform = `translate3d(0, ${offsetY}px, 0)`;

    // Renderizado eficiente de la ventana visible
    const fragment = document.createDocumentFragment();
    for (let i = start; i < end; i++) {
      const itemData = this.items[i];
      const rowResult = this.renderRow(itemData, i);

      let rowNode;
      if (typeof rowResult === 'string') {
        const temp = document.createElement('div');
        temp.innerHTML = rowResult.trim();
        rowNode = temp.firstElementChild || temp;
      } else {
        rowNode = rowResult;
      }

      rowNode.setAttribute('data-vscroll-index', i);
      fragment.appendChild(rowNode);
    }

    this.viewport.innerHTML = '';
    this.viewport.appendChild(fragment);
  }

  /**
   * Actualiza la lista de datos y re-calcula la altura fantasma y vista.
   * @param {Array} newItems
   * @param {boolean} [autoScrollBottom=false]
   */
  updateItems(newItems, autoScrollBottom = false) {
    this.items = newItems || [];
    this.phantom.style.height = `${this.items.length * this.itemHeight}px`;
    this._updateVisibleRange();

    if (autoScrollBottom) {
      this.scrollToBottom();
    }
  }

  /**
   * Desplaza suavemente o instantáneamente al final del contenedor.
   * @param {boolean} [smooth=true]
   */
  scrollToBottom(smooth = false) {
    const targetTop = this.phantom.offsetHeight - this.container.clientHeight;
    if (targetTop > 0) {
      this.container.scrollTo({
        top: targetTop,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }

  /**
   * Desplaza hasta un índice específico de la lista.
   * @param {number} index
   * @param {boolean} [smooth=false]
   */
  scrollToIndex(index, smooth = false) {
    if (index < 0 || index >= this.items.length) return;
    const targetTop = index * this.itemHeight;
    this.container.scrollTo({
      top: targetTop,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  /**
   * Destruye la instancia y limpia listeners del DOM.
   */
  destroy() {
    if (this._onScroll) {
      this.container.removeEventListener('scroll', this._onScroll);
    }
    this.container.innerHTML = '';
  }
}

/**
 * Helper legacy / rápido de scroll suave.
 * @param {HTMLElement|string} el - Elemento o selector.
 * @param {Object} [opts] - Opciones de scroll (behavior, top, left).
 */
export const wiScroll = (el, opts = { behavior: 'smooth', top: 0 }) => {
  const target = typeof el === 'string' ? document.querySelector(el) : el;
  if (target) {
    target.scrollTo(opts);
  }
};