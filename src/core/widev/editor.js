// src/core/widev/editor.js
// Componente Core wiEditor: Enriquecedor de Textareas para formato Markdown con barra de herramientas, modal premium, y vista previa integrada (estilos en witema.css).

import { abrirModal, cerrarModal } from './modales.js';
import { wiMd } from './wimd.js';
import { Notificacion } from './mensajes.js';
import { comprimirImagen } from './comprimir.js';
import { wicopy } from './copy.js';
import { wiGaleria } from './galeria.js';


// Función para aplicar formato en la selección del textarea
const aplicarFormato = (textarea, tipo, extraData = {}) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);
  
  let replacement = '';
  let cursorOffset = 0;

  switch (tipo) {
    case 'bold':
      replacement = `**${selectedText || 'texto'}**`;
      cursorOffset = selectedText ? replacement.length : 2;
      break;
    case 'italic':
      replacement = `*${selectedText || 'texto'}*`;
      cursorOffset = selectedText ? replacement.length : 1;
      break;
    case 'h2':
      replacement = `\n## ${selectedText || 'Título'}`;
      cursorOffset = replacement.length;
      break;
    case 'h3':
      replacement = `\n### Subtítulo`;
      cursorOffset = replacement.length;
      break;
    case 'list':
      replacement = `\n- ${selectedText || 'elemento'}`;
      cursorOffset = replacement.length;
      break;
    case 'quote':
      replacement = `\n> ${selectedText || 'Cita'}`;
      cursorOffset = replacement.length;
      break;
    case 'code':
      replacement = `\n\`\`\`javascript\n${selectedText || '// código aquí'}\n\`\`\``;
      cursorOffset = replacement.length;
      break;
    case 'table':
      replacement = `\n| Cabecera 1 | Cabecera 2 |\n| --- | --- |\n| Celda 1 | Celda 2 |\n`;
      cursorOffset = replacement.length;
      break;
    case 'si':
      replacement = `:si: ${selectedText}`;
      cursorOffset = replacement.length;
      break;
    case 'no':
      replacement = `:no: ${selectedText}`;
      cursorOffset = replacement.length;
      break;
    case 'alert-info':
      replacement = `\n> [!NOTE]\n> ${selectedText || 'Contenido de la nota'}`;
      cursorOffset = replacement.length;
      break;
    case 'alert-warning':
      replacement = `\n> [!WARNING]\n> ${selectedText || 'Contenido de la advertencia'}`;
      cursorOffset = replacement.length;
      break;
    case 'link':
      replacement = `[${extraData.text || selectedText || 'Enlace'}](${extraData.url || 'https://'})`;
      cursorOffset = replacement.length;
      break;
  }

  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  textarea.focus();
  textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
};

// Asegurar que el modal de enlaces existe en el DOM
const asegurarLinkModal = () => {
  if (typeof document === 'undefined') return null;
  let modal = document.getElementById('wi_editor_link_modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'wiModal';
  modal.id = 'wi_editor_link_modal';
  modal.innerHTML = `
    <div class="modalBody wim_body wi_editor_modal_body">
      <h3 class="wi_editor_modal_title">
        <i class="fa-solid fa-link"></i> Insertar Enlace
      </h3>
      
      <div class="wi_editor_modal_field">
        <label class="wi_editor_modal_label">Texto a mostrar</label>
        <input type="text" id="wi_editor_link_text" class="ejem_bran_input wi_editor_modal_input" placeholder="Texto descriptivo...">
      </div>
      
      <div class="wi_editor_modal_field last">
        <label class="wi_editor_modal_label">Dirección URL (Link)</label>
        <input type="url" id="wi_editor_link_url" class="ejem_bran_input wi_editor_modal_input" placeholder="https://...">
      </div>

      <div class="wi_editor_modal_actions">
        <button type="button" class="wi_editor_modal_btn wi_editor_modal_btn_cancel" id="wi_editor_link_cancel">Cancelar</button>
        <button type="button" class="wi_editor_modal_btn wi_editor_modal_btn_submit" id="wi_editor_link_submit">Insertar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#wi_editor_link_cancel').addEventListener('click', () => {
    cerrarModal('wi_editor_link_modal');
  });

  return modal;
};

// Asegurar que el modal de insertar imagen existe en el DOM
const asegurarInsertImgModal = () => {
  if (typeof document === 'undefined') return null;
  let modal = document.getElementById('wi_editor_insert_img_modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'wiModal';
  modal.id = 'wi_editor_insert_img_modal';
  modal.innerHTML = `
    <div class="modalBody wim_body wi_editor_modal_body wi_editor_modal_img_body">
      <h3 class="wi_editor_modal_title">
        <i class="fa-solid fa-image"></i> Insertar Imagen de Galería
      </h3>
      
      <div class="wi_editor_modal_field">
        <label class="wi_editor_modal_label">Selecciona la captura para insertar en el cursor</label>
        <div class="wi_editor_insert_img_grid">
          <!-- Las miniaturas se inyectan dinámicamente -->
        </div>
      </div>

      <div class="wi_editor_modal_actions wi_editor_modal_img_actions">
        <button type="button" class="wi_editor_modal_btn wi_editor_modal_btn_cancel" id="wi_editor_insert_img_cancel">Cancelar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#wi_editor_insert_img_cancel').addEventListener('click', () => {
    cerrarModal('wi_editor_insert_img_modal');
  });

  return modal;
};

// Función para abrir el selector de imágenes de la toolbar
const abrirInsertImgModal = (textarea) => {
  const modal = asegurarInsertImgModal();
  const grid = modal.querySelector('.wi_editor_insert_img_grid');
  grid.innerHTML = '';

  const imgs = textarea._imagenes || [];
  if (imgs.length === 0) {
    Notificacion('No hay imágenes en la galería para insertar. Ve a la pestaña Galería y sube algunas primero.', 'warning');
    return;
  }

  imgs.forEach((img, idx) => {
    const item = document.createElement('div');
    item.className = 'wi_editor_gallery_item';
    item.title = `Insertar imagen ${idx}`;
    item.innerHTML = `<img src="${img}" alt="Captura ${idx}">`;

    item.addEventListener('click', () => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const replacement = `![imagen](${idx})`;
      textarea.value = text.substring(0, start) + replacement + text.substring(end);
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      cerrarModal('wi_editor_insert_img_modal');
      Notificacion('Marcador de imagen insertado', 'success');
    });

    grid.appendChild(item);
  });

  abrirModal('wi_editor_insert_img_modal');
};

/**
 * Convierte un textarea común en un editor enriquecido con barra de herramientas Markdown y pestañas.
 * 
 * @param {HTMLTextAreaElement|string} selector - Textarea o string selector
 * @param {object} opciones - Opciones de configuración
 */
export const wiEditor = (selector, opciones = {}) => {
  if (typeof document === 'undefined') return;

  const textarea = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!textarea || textarea.tagName !== 'TEXTAREA') {
    return console.warn('[wiEditor] Elemento no válido o no es un textarea');
  }

  // Prevenir inicializaciones dobles
  if (textarea.dataset.wieditorInit) return;
  textarea.dataset.wieditorInit = 'true';

  // Inicializar arreglos de recursos
  textarea._imagenes = [...(opciones.imagenes || [])];
  textarea._links = [...(opciones.links || [])];

  asegurarLinkModal();

  // 1. Envolver textarea en un contenedor del editor
  const parent = textarea.parentNode;
  const container = document.createElement('div');
  container.className = 'wi_editor_container';
  
  parent.insertBefore(container, textarea);
  
  // 2. Crear panel de preview, enlaces y galería con clase oculta por defecto
  const previewDiv = document.createElement('div');
  previewDiv.className = 'wi_editor_preview wi_editor_hidden';

  const linksDiv = document.createElement('div');
  linksDiv.className = 'wi_editor_links_panel wi_editor_hidden';

  const galleryDiv = document.createElement('div');
  galleryDiv.className = 'wi_editor_gallery_panel wi_editor_hidden';
  galleryDiv.tabIndex = 0; // Permitir recibir foco para capturar eventos de pegar (Ctrl+V)
  
  // Insertar paneles en el contenedor
  container.appendChild(textarea);
  container.appendChild(linksDiv);
  container.appendChild(galleryDiv);
  container.appendChild(previewDiv);

  // 3. Crear la barra de herramientas
  const toolbar = document.createElement('div');
  toolbar.className = 'ejem_bran_editor_toolbar';
  toolbar.innerHTML = `
    <!-- Lado Izquierdo: Acciones de formato -->
    <div class="wi_editor_toolbar_left">
      <button type="button" class="wi_editor_toolbar_btn" data-format="bold" data-witip="Negrita (Ctrl+B)">
        <i class="fa-solid fa-bold"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="italic" data-witip="Cursiva (Ctrl+I)">
        <i class="fa-solid fa-italic"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="h2" data-witip="Título H2">
        <span class="wi_editor_btn_text">H2</span>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="h3" data-witip="Título H3">
        <span class="wi_editor_btn_text">H3</span>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="list" data-witip="Lista (-)">
        <i class="fa-solid fa-list"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="quote" data-witip="Cita (> )">
        <i class="fa-solid fa-quote-left"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="code" data-witip="Bloque de Código">
        <i class="fa-solid fa-code"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="table" data-witip="Insertar Tabla">
        <i class="fa-solid fa-table"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn wi_editor_btn_si" data-format="si" data-witip="Check Verde Premium">
        <i class="fa-solid fa-circle-check"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn wi_editor_btn_no" data-format="no" data-witip="Cruz Roja Premium">
        <i class="fa-solid fa-circle-xmark"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="alert-info" data-witip="Caja Alerta Nota">
        <i class="fa-solid fa-circle-info"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="alert-warning" data-witip="Caja Alerta Advertencia">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="link" data-witip="Insertar Enlace">
        <i class="fa-solid fa-link"></i>
      </button>
      <button type="button" class="wi_editor_toolbar_btn" data-format="image-insert" data-witip="Insertar Imagen de Galería">
        <i class="fa-solid fa-image"></i>
      </button>
    </div>

    <!-- Lado Derecho: Pestañas Editor | Enlaces | Galería | Preview -->
    <div class="wi_editor_toolbar_right">
      <button type="button" class="wi_editor_tab_btn active" data-tab="edit">Editor</button>
      <button type="button" class="wi_editor_tab_btn" data-tab="links">Enlaces</button>
      <button type="button" class="wi_editor_tab_btn" data-tab="gallery">Galería</button>
      <button type="button" class="wi_editor_tab_btn" data-tab="preview">Preview</button>
    </div>
  `;

  // Insertar toolbar arriba de todo en el contenedor
  container.insertBefore(toolbar, textarea);

  // Botones de las pestañas
  const tabEdit = toolbar.querySelector('[data-tab="edit"]');
  const tabLinks = toolbar.querySelector('[data-tab="links"]');
  const tabGallery = toolbar.querySelector('[data-tab="gallery"]');
  const tabPreview = toolbar.querySelector('[data-tab="preview"]');
  const formatButtonsLeft = toolbar.querySelector('.wi_editor_toolbar_left');

  // Registrar wiGaleria para habilitar zoom premium en las capturas de las pestañas Galería y Preview
  const selectorGaleria = [
    '.wi_editor_gallery_panel .wi_editor_gallery_item img',
    '.wi_editor_preview .wi_editor_preview_gallery_img',
    '.wi_editor_preview img'
  ].join(', ');
  const galeriaInstance = wiGaleria(selectorGaleria, { altFallback: 'Captura del caso' });

  // Lógica de Renderizado del Panel de Enlaces
  linksDiv.innerHTML = `
    <div class="wi_editor_links_form">
      <div class="wi_editor_links_input_wrap wi_editor_links_label_wrap">
        <label class="wi_editor_modal_label">
          Etiqueta del enlace
          <input type="text" class="ejem_bran_input wi_editor_modal_input wi_editor_add_link_label" placeholder="Ej: Repositorio GitHub">
        </label>
      </div>
      <div class="wi_editor_links_input_wrap wi_editor_links_url_wrap">
        <label class="wi_editor_modal_label">
          Dirección URL
          <input type="url" class="ejem_bran_input wi_editor_modal_input wi_editor_add_link_url" placeholder="https://...">
        </label>
      </div>
      <button type="button" class="wi_editor_modal_btn wi_editor_modal_btn_submit wi_editor_add_link_btn">
        <i class="fa-solid fa-plus wi_editor_add_link_btn_icon"></i> Agregar
      </button>
    </div>
    <div class="wi_editor_links_list"></div>
  `;

  const refrescarEnlaces = () => {
    const list = linksDiv.querySelector('.wi_editor_links_list');
    list.innerHTML = '';
    
    textarea._links.forEach((lnk, idx) => {
      const pill = document.createElement('div');
      pill.className = 'wi_editor_link_pill';
      
      pill.innerHTML = `
        <i class="fa-solid fa-copy wi_editor_link_copy" title="Copiar enlace"></i>
        <a href="${lnk.url}" target="_blank" title="Abrir enlace: ${lnk.url}">
          <span>${lnk.etiqueta || lnk.label || 'Enlace'}</span>
        </a>
        <button type="button" class="wi_editor_link_pill_del" data-idx="${idx}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;
      
      // Listener para copiar el enlace al portapapeles usando wicopy
      pill.querySelector('.wi_editor_link_copy').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        wicopy(lnk.url);
        Notificacion('Enlace copiado al portapapeles', 'success');
      });
      
      pill.querySelector('.wi_editor_link_pill_del').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        textarea._links.splice(idx, 1);
        refrescarEnlaces();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      list.appendChild(pill);
    });
  };

  linksDiv.querySelector('.wi_editor_add_link_btn').addEventListener('click', (e) => {
    e.preventDefault();
    const labelInput = linksDiv.querySelector('.wi_editor_add_link_label');
    const urlInput = linksDiv.querySelector('.wi_editor_add_link_url');
    const label = labelInput.value.trim();
    const url = urlInput.value.trim();
    
    if (!label || !url || url === 'https://') {
      Notificacion('Por favor completa ambos campos del enlace', 'warning');
      return;
    }
    
    textarea._links.push({ titulo: label, etiqueta: label, label: label, url: url });
    labelInput.value = '';
    urlInput.value = '';
    refrescarEnlaces();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    Notificacion('Enlace agregado', 'success');
  });

  // Lógica de Renderizado del Panel de Galería
  galleryDiv.innerHTML = `
    <div class="wi_editor_gallery_upload_zone">
      <i class="fa-solid fa-cloud-arrow-up"></i>
      <span>Arrastra capturas aquí o haz clic para subir</span>
      <input type="file" class="wi_editor_gallery_file_input wi_editor_hidden_file_input" accept="image/*" multiple>
    </div>
    <div class="wi_editor_gallery_grid"></div>
  `;

  const refrescarGaleria = () => {
    const grid = galleryDiv.querySelector('.wi_editor_gallery_grid');
    grid.innerHTML = '';
    
    textarea._imagenes.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'wi_editor_gallery_item';
      
      item.innerHTML = `
        <img src="${img}" alt="Captura ${idx}">
        <button type="button" class="wi_editor_gallery_item_del" data-idx="${idx}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;
      
      // Al hacer clic en la X, se elimina la imagen de forma limpia
      item.querySelector('.wi_editor_gallery_item_del').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        textarea._imagenes.splice(idx, 1);
        
        // Re-indexar los marcadores en el texto del textarea
        let text = textarea.value;
        text = text.replace(new RegExp(`\\!\\[imagen\\]\\(${idx}\\)`, 'g'), '');
        for (let i = idx + 1; i <= textarea._imagenes.length; i++) {
          text = text.replace(new RegExp(`\\!\\[imagen\\]\\(${i}\\)`, 'g'), `![imagen](${i - 1})`);
        }
        textarea.value = text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        refrescarGaleria();
        Notificacion('Imagen eliminada de la galería', 'info');
      });
      
      grid.appendChild(item);
    });
  };

  const procesarArchivos = async (files) => {
    let agregadas = 0;
    for (let file of files) {
      if (file.type.startsWith('image/')) {
        try {
          const res = await comprimirImagen(file);
          textarea._imagenes.push(res.dataUrl);
          agregadas++;
        } catch (err) {
          Notificacion(err.message, 'warning');
        }
      }
    }
    if (agregadas > 0) {
      refrescarGaleria();
      Notificacion(`${agregadas} imagen(es) agregada(s) a la galería`, 'success');
    }
  };

  const dropZone = galleryDiv.querySelector('.wi_editor_gallery_upload_zone');
  const fileInput = galleryDiv.querySelector('.wi_editor_gallery_file_input');
  
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => procesarArchivos(e.target.files));
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    procesarArchivos(e.dataTransfer.files);
  });

  // Interceptar evento de pegado en el contenedor para soportar pegados en Galería y Editor (Ctrl + V)
  container.addEventListener('paste', async (e) => {
    // Si el usuario está escribiendo en los inputs del formulario de enlaces, dejar pasar el pegado nativo de texto
    const active = document.activeElement;
    if (active && active.tagName === 'INPUT' && (active.classList.contains('wi_editor_add_link_label') || active.classList.contains('wi_editor_add_link_url') || active.classList.contains('wi_editor_modal_input'))) {
      return;
    }

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let files = [];
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      let agregadas = [];
      for (let file of files) {
        try {
          const res = await comprimirImagen(file);
          textarea._imagenes.push(res.dataUrl);
          const idx = textarea._imagenes.length - 1;
          agregadas.push(`![imagen](${idx})`);
        } catch (err) {
          Notificacion(err.message, 'warning');
        }
      }
      if (agregadas.length > 0) {
        refrescarGaleria();
        
        // Si la pestaña de edición (textarea) está activa, insertar el marcador en el texto
        if (!textarea.classList.contains('wi_editor_hidden')) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;
          const replacement = agregadas.join('\n');
          textarea.value = text.substring(0, start) + replacement + text.substring(end);
          textarea.focus();
          textarea.setSelectionRange(start + replacement.length, start + replacement.length);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          Notificacion('Imagen pegada e insertada en el editor', 'success');
        } else {
          // Si estamos en la pestaña de Galería, solo agregamos a la colección
          Notificacion('Imagen agregada a la galería', 'success');
        }
      }
    }
  });

  // Lógica de conmutación de pestañas con Clases CSS (Cero estilos inline)
  tabEdit.addEventListener('click', () => {
    tabEdit.classList.add('active');
    tabLinks.classList.remove('active');
    tabGallery.classList.remove('active');
    tabPreview.classList.remove('active');
    
    textarea.classList.remove('wi_editor_hidden');
    linksDiv.classList.add('wi_editor_hidden');
    galleryDiv.classList.add('wi_editor_hidden');
    previewDiv.classList.add('wi_editor_hidden');
    
    formatButtonsLeft.classList.remove('wi_editor_disabled_toolbar');
    textarea.focus();
  });

  tabLinks.addEventListener('click', () => {
    tabLinks.classList.add('active');
    tabEdit.classList.remove('active');
    tabGallery.classList.remove('active');
    tabPreview.classList.remove('active');
    
    textarea.classList.add('wi_editor_hidden');
    linksDiv.classList.remove('wi_editor_hidden');
    galleryDiv.classList.add('wi_editor_hidden');
    previewDiv.classList.add('wi_editor_hidden');
    
    formatButtonsLeft.classList.add('wi_editor_disabled_toolbar');
    refrescarEnlaces();
  });

  tabGallery.addEventListener('click', () => {
    tabGallery.classList.add('active');
    tabEdit.classList.remove('active');
    tabLinks.classList.remove('active');
    tabPreview.classList.remove('active');
    
    textarea.classList.add('wi_editor_hidden');
    linksDiv.classList.add('wi_editor_hidden');
    galleryDiv.classList.remove('wi_editor_hidden');
    previewDiv.classList.add('wi_editor_hidden');
    
    formatButtonsLeft.classList.add('wi_editor_disabled_toolbar');
    refrescarGaleria();
    galleryDiv.focus(); // Enfocar la sección de galería para permitir pegado inmediato (Ctrl+V)
  });

  tabPreview.addEventListener('click', () => {
    tabPreview.classList.add('active');
    tabEdit.classList.remove('active');
    tabLinks.classList.remove('active');
    tabGallery.classList.remove('active');
    
    // 1. Compilar markdown traduciendo ![imagen](idx) a su Base64 real
    let mdContent = textarea.value;
    mdContent = mdContent.replace(/\!\[imagen\]\((\d+)\)/g, (match, idx) => {
      const index = parseInt(idx, 10);
      const imgBase64 = textarea._imagenes[index];
      if (imgBase64) {
        return `![imagen](${imgBase64})`;
      }
      return match;
    });
    
    let htmlContent = wiMd(mdContent);
    
    // 2. Renderizar subsección de Galería al final
    let galleryHtml = '';
    if (textarea._imagenes && textarea._imagenes.length > 0) {
      galleryHtml = `
        <div class="wi_editor_preview_section">
          <div class="wi_editor_preview_title">
            <i class="fa-solid fa-images"></i> Capturas del Caso (${textarea._imagenes.length})
          </div>
          <div class="wi_editor_preview_gallery">
            ${textarea._imagenes.map((img, idx) => `
              <img src="${img}" class="wi_editor_preview_gallery_img" alt="Captura ${idx}">
            `).join('')}
          </div>
        </div>
      `;
    }
    
    // 3. Renderizar subsección de Enlaces al final
    let linksHtml = '';
    if (textarea._links && textarea._links.length > 0) {
      linksHtml = `
        <div class="wi_editor_preview_section">
          <div class="wi_editor_preview_title">
            <i class="fa-solid fa-circle-info"></i> Enlaces de Apoyo
          </div>
          <div class="wi_editor_preview_links">
            ${textarea._links.map(lnk => `
              <a href="${lnk.url}" target="_blank" class="wi_editor_preview_link_btn">
                <i class="fa-solid fa-link"></i> ${lnk.etiqueta || lnk.label || 'Enlace'}
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    previewDiv.innerHTML = htmlContent + galleryHtml + linksHtml;
    
    textarea.classList.add('wi_editor_hidden');
    linksDiv.classList.add('wi_editor_hidden');
    galleryDiv.classList.add('wi_editor_hidden');
    previewDiv.classList.remove('wi_editor_hidden');
    
    formatButtonsLeft.classList.add('wi_editor_disabled_toolbar');
  });

  // Escuchar atajos Ctrl+B y Ctrl+I
  textarea.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        aplicarFormato(textarea, 'bold');
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        aplicarFormato(textarea, 'italic');
      }
    }
  });

  // Asignar listeners a los botones de la toolbar
  toolbar.querySelectorAll('.wi_editor_toolbar_btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const format = btn.getAttribute('data-format');
      if (!format) return;

      if (format === 'image-insert') {
        abrirInsertImgModal(textarea);
      } else if (format === 'link') {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        const textInput = document.getElementById('wi_editor_link_text');
        const urlInput = document.getElementById('wi_editor_link_url');
        
        if (textInput) textInput.value = selectedText || '';
        if (urlInput) urlInput.value = 'https://';

        const submitBtn = document.getElementById('wi_editor_link_submit');
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

        newSubmitBtn.addEventListener('click', () => {
          const linkText = textInput.value.trim();
          const linkUrl = urlInput.value.trim();

          if (!linkText || !linkUrl || linkUrl === 'https://') {
            Notificacion('Por favor completa ambos campos del enlace', 'warning');
            return;
          }

          aplicarFormato(textarea, 'link', { text: linkText, url: linkUrl });
          cerrarModal('wi_editor_link_modal');
        });

        abrirModal('wi_editor_link_modal');
      } else {
        aplicarFormato(textarea, format);
      }
    });
  });

  // 4. API Pública del Editor en el textarea
  textarea.getLinks = () => (textarea._links || []).map(l => ({
    titulo: l.titulo || l.etiqueta || l.label || 'Enlace',
    url: l.url || ''
  }));

  textarea.setLinks = (links = []) => {
    textarea._links = (Array.isArray(links) ? links : []).map(l => ({
      titulo: l.titulo || l.etiqueta || l.label || 'Enlace',
      etiqueta: l.titulo || l.etiqueta || l.label || 'Enlace',
      label: l.titulo || l.etiqueta || l.label || 'Enlace',
      url: l.url || ''
    }));
    refrescarEnlaces();
  };

  textarea.getImagenes = () => textarea._imagenes || [];

  textarea.setImagenes = (imgs = []) => {
    textarea._imagenes = Array.isArray(imgs) ? [...imgs] : [];
    refrescarGaleria();
  };

  textarea.limpiarEditor = () => {
    textarea.value = '';
    textarea._links = [];
    textarea._imagenes = [];
    refrescarEnlaces();
    refrescarGaleria();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  };

  return {
    textarea,
    getLinks: textarea.getLinks,
    setLinks: textarea.setLinks,
    getImagenes: textarea.getImagenes,
    setImagenes: textarea.setImagenes,
    limpiarEditor: textarea.limpiarEditor
  };
};
