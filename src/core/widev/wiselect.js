// src/core/widev/wiselect.js
// wiSelect v2.0 — Select premium con búsqueda en tiempo real, teclado y glassmorphism (estilos en witema.css)


/**
 * Convierte un <select> nativo en un select premium con buscador.
 *
 * @param {string|HTMLElement} target  - Selector CSS o elemento <select>
 * @param {Object}             opts
 * @param {string}             opts.placeholder        - Texto vacío
 * @param {string}             opts.searchPlaceholder  - Placeholder del buscador
 * @param {Function}           opts.onChange           - Callback (value, label) => void
 * @returns {{ getValue, setValue, destroy }}
 */
export function wiSelect(target, opts = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el || el.tagName !== 'SELECT' || el.dataset.wiselect) return null;

  const {
    placeholder       = 'Selecciona una opción...',
    searchPlaceholder = 'Buscar...',
    onChange          = null,
  } = opts;

  // Marcar y ocultar el select nativo
  el.dataset.wiselect = 'true';
  el.style.display = 'none';

  // ── Trigger ──────────────────────────────────────────────────────────
  const trigger = document.createElement('div');
  trigger.className = 'wi-select-trigger';
  trigger.setAttribute('tabindex', '0');
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const renderTrigger = (label) => {
    trigger.innerHTML = `
      <span class="wi-select-label ${label ? '' : 'wi-select-placeholder'}">${label || placeholder}</span>
      <i class="fa-solid fa-chevron-down wi-select-arrow"></i>
    `;
  };

  const getSelectedLabel = () => {
    const opt = el.options[el.selectedIndex];
    return opt?.value ? opt.text : '';
  };

  renderTrigger(getSelectedLabel());
  el.insertAdjacentElement('afterend', trigger);

  // ── Estado ────────────────────────────────────────────────────────────
  let panel    = null;
  let isOpen   = false;
  let curIdx   = -1;
  let filtered = [];

  // ── Abrir ─────────────────────────────────────────────────────────────
  const abrir = () => {
    if (isOpen) return;
    isOpen = true;

    // Cerrar cualquier otro abierto
    document.querySelectorAll('.wi-select-trigger.wi-select-open').forEach(t => {
      if (t !== trigger) t.click();
    });

    trigger.classList.add('wi-select-open');
    trigger.setAttribute('aria-expanded', 'true');

    const opciones = leerOpciones();
    filtered = opciones;
    curIdx   = -1;

    // Crear panel
    panel = document.createElement('div');
    panel.className = 'wi-select-panel';
    panel.setAttribute('role', 'listbox');

    // Evitar que clics dentro del panel cierren el selector por propagación al trigger
    panel.addEventListener('click', (e) => e.stopPropagation());

    // Buscador con icono absolute
    panel.innerHTML = `
      <div class="wi-select-search-wrapper">
        <i class="fa-solid fa-magnifying-glass wi-select-search-icon"></i>
        <input class="wi-select-search" type="text" placeholder="${searchPlaceholder}" autocomplete="off" spellcheck="false" />
      </div>
      <ul class="wi-select-list" role="listbox"></ul>
    `;

    trigger.appendChild(panel);

    const searchEl = panel.querySelector('.wi-select-search');
    const lista    = panel.querySelector('.wi-select-list');

    const renderLista = (items) => {
      filtered = items;
      curIdx   = -1;
      lista.innerHTML = items.length
        ? items.map((item, i) => `
            <li class="wi-select-option${item.value === el.value ? ' wi-select-selected' : ''}"
                role="option" data-i="${i}" data-val="${item.value}">${item.label}</li>
          `).join('')
        : `<li class="wi-select-empty"><i class="fa-solid fa-face-frown-open"></i> Sin resultados</li>`;

      lista.querySelectorAll('.wi-select-option').forEach(li => {
        li.addEventListener('mouseenter', () => { curIdx = +li.dataset.i; marcarCursor(); });
        li.addEventListener('click', (e) => { e.stopPropagation(); elegir(filtered[+li.dataset.i]); });
      });
    };

    renderLista(opciones);

    // Animar apertura en el siguiente frame
    requestAnimationFrame(() => panel.classList.add('wi-select-panel-visible'));

    // Foco en buscador
    setTimeout(() => searchEl.focus(), 40);

    // Filtrar
    searchEl.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      renderLista(q ? opciones.filter(o => o.label.toLowerCase().includes(q)) : opciones);
    });

    searchEl.addEventListener('keydown', manejarTecla);

    // Cerrar al click fuera
    setTimeout(() => document.addEventListener('click', cerrarAlFuera), 0);
  };

  // ── Cerrar ────────────────────────────────────────────────────────────
  const cerrar = () => {
    if (!isOpen) return;
    isOpen = false;
    trigger.classList.remove('wi-select-open');
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', cerrarAlFuera);

    if (panel) {
      panel.classList.remove('wi-select-panel-visible');
      const p = panel;
      panel = null;
      setTimeout(() => p.remove(), 200);
    }
  };

  const cerrarAlFuera = (e) => {
    if (!panel?.contains(e.target) && !trigger.contains(e.target)) cerrar();
  };

  // ── Elegir opción ──────────────────────────────────────────────────────
  const elegir = (item) => {
    if (!item) return;
    el.value = item.value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    renderTrigger(item.label);
    onChange?.(item.value, item.label);
    cerrar();
  };

  // ── Cursor de teclado ─────────────────────────────────────────────────
  const marcarCursor = () => {
    panel?.querySelectorAll('.wi-select-option').forEach((li, i) =>
      li.classList.toggle('wi-select-cursor', i === curIdx)
    );
    panel?.querySelectorAll('.wi-select-option')[curIdx]?.scrollIntoView({ block: 'nearest' });
  };

  // ── Teclado ────────────────────────────────────────────────────────────
  const manejarTecla = (e) => {
    if (!isOpen) return;
    const items = panel?.querySelectorAll('.wi-select-option') || [];
    if (e.key === 'ArrowDown')  { e.preventDefault(); curIdx = Math.min(curIdx + 1, items.length - 1); marcarCursor(); }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); curIdx = Math.max(curIdx - 1, 0); marcarCursor(); }
    else if (e.key === 'Enter' && curIdx >= 0) { e.preventDefault(); elegir(filtered[curIdx]); }
    else if (e.key === 'Escape') { cerrar(); trigger.focus(); }
  };



  // ── Leer opciones del <select> ─────────────────────────────────────────
  const leerOpciones = () =>
    [...el.options].filter(o => o.value !== '').map(o => ({ value: o.value, label: o.text }));

  // ── Eventos del trigger ────────────────────────────────────────────────
  trigger.addEventListener('click', (e) => { e.stopPropagation(); isOpen ? cerrar() : abrir(); });
  trigger.addEventListener('keydown', (e) => {
    if ([' ', 'Enter', 'ArrowDown'].includes(e.key)) { e.preventDefault(); abrir(); }
  });

  // ── API pública ────────────────────────────────────────────────────────
  return {
    getValue: () => el.value,
    setValue: (val) => {
      const opt = [...el.options].find(o => o.value === val);
      if (opt) { el.value = val; renderTrigger(opt.text); onChange?.(val, opt.text); }
    },
    destroy: () => {
      cerrar();
      trigger.remove();
      el.style.display = '';
      delete el.dataset.wiselect;
    },
  };
}
