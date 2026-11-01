// src/core/widev/galeria.js
// wiGaleria v2.2 — Visor de Imágenes estilo Picasa autocontenido y responsivo
// Inyección dinámica de CSS adaptado de workwii-web con animaciones de rebote (pop) y soporte táctil

import { abrirModal } from './modales.js';

// Variables del estado
let _built = false;
let _modal = null;
let _imgEl = null;
let _captionEl = null;
let _counterEl = null;
let _stripEl = null;

let _galeria = [];
let _idx = 0;
let _zoomLevel = 1;

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3.5;
const ZOOM_STEP = 0.25;

let _isDragging = false;
let _dragStartX = 0;
let _dragStartY = 0;
let _panX = 0;
let _panY = 0;
let _touchStartX = 0;

function updateTransform() {
  if (Math.abs(_zoomLevel - 1) > 0.02) {
    _imgEl.style.transform = `scale(${_zoomLevel.toFixed(2)}) translate(${(_panX / _zoomLevel).toFixed(1)}px, ${(_panY / _zoomLevel).toFixed(1)}px)`;
  } else {
    _imgEl.style.transform = '';
  }
}

function applyZoom(level) {
  _zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, level));
  _imgEl.classList.toggle('wim_zoomed', Math.abs(_zoomLevel - 1) > 0.02);
  if (Math.abs(_zoomLevel - 1) <= 0.02) {
    _panX = 0;
    _panY = 0;
  }
  updateTransform();
}

function resetZoom() {
  _zoomLevel = 1;
  _panX = 0;
  _panY = 0;
  if (_imgEl) {
    _imgEl.classList.remove('wim_zoomed');
    _imgEl.style.transform = '';
  }
}

function buildStrip() {
  if (!_stripEl) return;
  _stripEl.innerHTML = '';
  _galeria.forEach((item, i) => {
    const thumb = document.createElement('img');
    thumb.className = 'wim_thumb';
    thumb.src = item.src;
    thumb.alt = item.alt;
    thumb.dataset.idx = String(i);
    thumb.addEventListener('click', (e) => {
      e.stopPropagation();
      gotoImage(i);
    });
    _stripEl.appendChild(thumb);
  });
}

function gotoImage(idx) {
  const total = _galeria.length;
  if (total === 0) return;
  _idx = ((idx % total) + total) % total;
  resetZoom();

  _imgEl.style.opacity = '0';
  setTimeout(() => {
    const item = _galeria[_idx];
    if (item && _imgEl) {
      _imgEl.src = item.src;
      _imgEl.alt = item.alt;
      _captionEl.textContent = item.alt || '';
      _counterEl.textContent = total > 1 ? `${_idx + 1} / ${total}` : '';
      _imgEl.style.opacity = '1';
    }
  }, 110);

  if (_stripEl) {
    _stripEl.querySelectorAll('.wim_thumb').forEach((t, i) => t.classList.toggle('active', i === _idx));
    const active = _stripEl.querySelector('.wim_thumb.active');
    if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }
}

function buildModal() {
  if (_built) return;
  _built = true;

  _modal = document.createElement('div');
  _modal.id = 'wi_img_modal';
  _modal.className = 'wiModal';
  _modal.innerHTML = `
    <div class="modalBody wim_body">
      <button class="wim_close modalX" aria-label="Cerrar galería"><i class="fas fa-xmark"></i></button>
      <div class="wim_stage">
        <button class="wim_prev" aria-label="Imagen anterior"><i class="fas fa-chevron-left"></i></button>
        <div class="wim_img_wrap">
          <img class="wim_img" src="" alt="" draggable="false" />
        </div>
        <button class="wim_next" aria-label="Imagen siguiente"><i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="wim_caption_row">
        <p class="wim_caption"></p>
        <span class="wim_counter"></span>
      </div>
      <div class="wim_strip"></div>
    </div>
  `;
  document.body.appendChild(_modal);

  _imgEl = _modal.querySelector('.wim_img');
  _captionEl = _modal.querySelector('.wim_caption');
  _counterEl = _modal.querySelector('.wim_counter');
  _stripEl = _modal.querySelector('.wim_strip');

  // Flechas
  _modal.querySelector('.wim_prev').addEventListener('click', (e) => {
    e.stopPropagation();
    gotoImage(_idx - 1);
  });
  _modal.querySelector('.wim_next').addEventListener('click', (e) => {
    e.stopPropagation();
    gotoImage(_idx + 1);
  });

  // Pan dragging
  let dragThresholdPassed = false;

  _imgEl.addEventListener('mousedown', (e) => {
    if (Math.abs(_zoomLevel - 1) <= 0.02) return;
    e.preventDefault();
    _isDragging = true;
    dragThresholdPassed = false;
    _dragStartX = e.clientX - _panX;
    _dragStartY = e.clientY - _panY;
    _imgEl.classList.add('wim_dragging');
  });

  _modal.addEventListener('mousemove', (e) => {
    if (!_isDragging) return;
    e.preventDefault();
    const nx = e.clientX - _dragStartX;
    const ny = e.clientY - _dragStartY;
    if (Math.abs(nx - _panX) > 4 || Math.abs(ny - _panY) > 4) {
      dragThresholdPassed = true;
    }
    _panX = nx;
    _panY = ny;
    updateTransform();
  });

  const stopDrag = () => {
    if (!_isDragging) return;
    _isDragging = false;
    _imgEl.classList.remove('wim_dragging');
  };

  _modal.addEventListener('mouseup', stopDrag);
  _modal.addEventListener('mouseleave', stopDrag);

  // Soporte móvil táctil para arrastre
  _imgEl.addEventListener('touchstart', (e) => {
    if (Math.abs(_zoomLevel - 1) <= 0.02) return;
    _isDragging = true;
    dragThresholdPassed = false;
    _dragStartX = e.touches[0].clientX - _panX;
    _dragStartY = e.touches[0].clientY - _panY;
    _imgEl.classList.add('wim_dragging');
  }, { passive: true });

  _imgEl.addEventListener('touchmove', (e) => {
    if (!_isDragging) return;
    const nx = e.touches[0].clientX - _dragStartX;
    const ny = e.touches[0].clientY - _dragStartY;
    if (Math.abs(nx - _panX) > 4 || Math.abs(ny - _panY) > 4) {
      dragThresholdPassed = true;
    }
    _panX = nx;
    _panY = ny;
    updateTransform();
  }, { passive: true });

  _imgEl.addEventListener('touchend', stopDrag, { passive: true });

  // Click zoom rápido
  _imgEl.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dragThresholdPassed) return;
    if (Math.abs(_zoomLevel - 1) > 0.02) {
      resetZoom();
    } else {
      applyZoom(1.8);
    }
  });

  // Mouse wheel zoom
  window.addEventListener('wheel', (e) => {
    if (!_modal || !_modal.classList.contains('active')) return;
    const stage = _modal.querySelector('.wim_stage');
    if (!stage || !stage.contains(e.target)) return;
    e.preventDefault();
    applyZoom(_zoomLevel + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
  }, { passive: false });

  // Key listeners
  document.addEventListener('keydown', (e) => {
    if (!_modal || !_modal.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') {
      gotoImage(_idx - 1);
    } else if (e.key === 'ArrowRight') {
      gotoImage(_idx + 1);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      applyZoom(_zoomLevel + ZOOM_STEP);
    } else if (e.key === '-') {
      e.preventDefault();
      applyZoom(_zoomLevel - ZOOM_STEP);
    } else if (e.key === '0') {
      e.preventDefault();
      resetZoom();
    }
  });

  // Swipe táctil para pasar fotos en móvil
  const stage = _modal.querySelector('.wim_stage');
  stage.addEventListener('touchstart', (e) => {
    if (Math.abs(_zoomLevel - 1) > 0.02) return;
    _touchStartX = e.touches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (Math.abs(_zoomLevel - 1) > 0.02) return;
    const dx = e.changedTouches[0].clientX - _touchStartX;
    if (Math.abs(dx) > 55) {
      gotoImage(dx < 0 ? _idx + 1 : _idx - 1);
    }
  });

  // Mutación Observer para capturar el cierre del modal desde modales.js
  const obs = new MutationObserver(() => {
    if (!_modal.classList.contains('active')) {
      resetZoom();
    }
  });
  obs.observe(_modal, { attributes: true, attributeFilter: ['class'] });
}

export function abrirGaleria(clickedImg, selector, altFallback) {
  buildModal();

  _galeria = [];
  const images = Array.from(document.querySelectorAll(selector))
    .filter(img => {
      return !img.classList.contains('cr_chat_header_avatar') && 
             !img.classList.contains('cr_typing_dot') && 
             img.offsetParent !== null;
    });

  images.forEach(img => {
    const src = img.src || img.dataset.src || '';
    if (src) {
      _galeria.push({
        src,
        alt: img.alt || img.getAttribute('title') || altFallback
      });
    }
  });

  const startIdx = images.indexOf(clickedImg);
  _idx = startIdx >= 0 ? startIdx : 0;

  _modal.querySelector('.wim_body').classList.toggle('wim_solo', _galeria.length <= 1);
  buildStrip();
  gotoImage(_idx);
  abrirModal('wi_img_modal');
}

/**
 * Registra clics y monta la galería en imágenes con selectores dinámicos.
 * 
 * @param {string} selector - Selector CSS para identificar las imágenes de la galería.
 * @param {Object} opts
 * @param {string} opts.altFallback - Alt por defecto si la imagen no tiene alt.
 */
export function wiGaleria(selector, opts = {}) {
  const { altFallback = 'Imagen' } = opts;

  const marcarCliqueables = () => {
    document.querySelectorAll(selector).forEach(img => {
      if (!img.classList.contains('cr_chat_header_avatar') && !img.classList.contains('wi_img_clickable')) {
        img.classList.add('wi_img_clickable');
      }
    });
  };

  marcarCliqueables();

  // Escucha delegada en clics
  const clickHandler = (e) => {
    const img = e.target.closest(selector);
    if (img && !img.classList.contains('cr_chat_header_avatar') && !img.classList.contains('cr_typing_dot')) {
      e.preventDefault();
      abrirGaleria(img, selector, altFallback);
    }
  };

  document.addEventListener('click', clickHandler);

  // Escuchar mutaciones dinámicas para marcar nuevas imágenes como cliqueables
  const obs = new MutationObserver(() => marcarCliqueables());
  obs.observe(document.body, { childList: true, subtree: true });

  return {
    destroy: () => {
      document.removeEventListener('click', clickHandler);
      obs.disconnect();
    }
  };
}
