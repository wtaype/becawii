// src/core/widev/wimd.js
// wiMd v2.1: Compilador modular de Markdown a HTML con soporte para bloques, sanitización XSS e iconos premium/FontAwesome

const CUSTOM_ICONS = {
  'corazon': '<i class="fas fa-heart po_ico_red"></i>',
  'heart': '<i class="fas fa-heart po_ico_red"></i>',
  'estrella': '<i class="fas fa-star po_ico_yellow"></i>',
  'star': '<i class="fas fa-star po_ico_yellow"></i>',
  'si': '<i class="fas fa-circle-check po_ico_green"></i>',
  'check': '<i class="fas fa-circle-check po_ico_green"></i>',
  'no': '<i class="fas fa-circle-xmark po_ico_red"></i>',
  'times': '<i class="fas fa-circle-xmark po_ico_red"></i>',
  'maletin': '<i class="fas fa-briefcase po_ico_mco"></i>',
  'briefcase': '<i class="fas fa-briefcase po_ico_mco"></i>',
  'foco': '<i class="fas fa-lightbulb po_ico_yellow"></i>',
  'idea': '<i class="fas fa-lightbulb po_ico_yellow"></i>',
  'lightbulb': '<i class="fas fa-lightbulb po_ico_yellow"></i>',
  'grafico': '<i class="fas fa-chart-line po_ico_cyan"></i>',
  'chart': '<i class="fas fa-chart-line po_ico_cyan"></i>',
  'usuario': '<i class="fas fa-user-tie po_ico_gold"></i>',
  'user': '<i class="fas fa-user-tie po_ico_gold"></i>',
  'cruz': '<i class="fas fa-cross po_ico_mco"></i>',
  'cross': '<i class="fas fa-cross po_ico_mco"></i>',
  'biblia': '<i class="fas fa-book-bible po_ico_mco"></i>',
  'bible': '<i class="fas fa-book-bible po_ico_mco"></i>',
  'oracion': '<i class="fas fa-hands-praying po_ico_gold"></i>',
  'pray': '<i class="fas fa-hands-praying po_ico_gold"></i>',
  'paloma': '<i class="fas fa-dove po_ico_cyan"></i>',
  'dove': '<i class="fas fa-dove po_ico_cyan"></i>',
  'alerta': '<i class="fas fa-triangle-exclamation po_ico_warning"></i>',
  'warning': '<i class="fas fa-triangle-exclamation po_ico_warning"></i>',
  'info': '<i class="fas fa-circle-info po_ico_cyan"></i>',
  'herramienta': '<i class="fas fa-screwdriver-wrench po_ico_mco"></i>',
  'tool': '<i class="fas fa-screwdriver-wrench po_ico_mco"></i>',
  'enlace': '<i class="fas fa-link po_ico_cyan"></i>',
  'link': '<i class="fas fa-link po_ico_cyan"></i>'
};

const parseInlines = (txt = '') => {
  let html = txt
    // Escapar etiquetas HTML para evitar XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Reemplazar estilos inline Markdown a HTML
  html = html
    .replace(/`(.*?)`/g, '<code>$1</code>') // Código en línea
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrita **
    .replace(/__(.*?)__/g, '<strong>$1</strong>') // Negrita __
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Cursiva *
    .replace(/_(.*?)_/g, '<em>$1</em>') // Cursiva _
    .replace(/~~(.*?)~~/g, '<del>$1</del>') // Tachado ~~
    .replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
      const cleanUrl = url.trim().toLowerCase();
      if (cleanUrl.startsWith('javascript:') || cleanUrl.startsWith('data:') || cleanUrl.startsWith('vbscript:')) {
        return `<span>${text}</span>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }); // Enlaces

  // Reemplazar iconos premium personalizados
  Object.keys(CUSTOM_ICONS).forEach(key => {
    const regex = new RegExp(`:${key}:`, 'gim');
    html = html.replace(regex, CUSTOM_ICONS[key]);
  });

  // Soporte para iconos Font Awesome genéricos
  html = html
    .replace(/:fa-([a-z0-9-]+):/gim, '<i class="fas fa-$1"></i>')
    .replace(/:far-([a-z0-9-]+):/gim, '<i class="far fa-$1"></i>')
    .replace(/:fab-([a-z0-9-]+):/gim, '<i class="fab fa-$1"></i>');

  return html;
};

export const wiMd = (txt = '', lang = 'es') => {
  if (typeof txt !== 'string') return '';

  const lines = txt.split('\n');
  const out = [];
  
  let inCodeBlock = false;
  let codeBlockLines = [];
  let inList = false;
  let inTable = false;
  let inQuote = false;
  let quoteLines = [];

  const flushQuote = () => {
    if (quoteLines.length === 0) return;
    const firstLine = quoteLines[0].trim();
    const alertMatch = firstLine.match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]$/i);
    
    if (alertMatch) {
      const type = alertMatch[1].toUpperCase();
      let icon = 'fas fa-info-circle';
      let title = lang === 'en' ? 'Note' : 'Nota';
      if (type === 'TIP') { icon = 'fas fa-lightbulb'; title = lang === 'en' ? 'Tip' : 'Consejo'; }
      else if (type === 'WARNING') { icon = 'fas fa-triangle-exclamation'; title = lang === 'en' ? 'Warning' : 'Advertencia'; }
      else if (type === 'IMPORTANT') { icon = 'fas fa-circle-exclamation'; title = lang === 'en' ? 'Important' : 'Importante'; }
      else if (type === 'CAUTION') { icon = 'fas fa-ban'; title = lang === 'en' ? 'Caution' : 'Precaución'; }
      
      const content = quoteLines.slice(1).map(l => parseInlines(l)).join('<br/>');
      out.push(`<div class="po_alert po_alert_${type.toLowerCase()}"><div class="po_alert_title"><i class="${icon}"></i> ${title}</div><p>${content}</p></div>`);
    } else {
      out.push(`<blockquote>${quoteLines.map(l => parseInlines(l)).join('<br/>')}</blockquote>`);
    }
    quoteLines = [];
  };

  for (let line of lines) {
    const trimmed = line.trim();

    // ── 1. BLOQUES DE CÓDIGO (```) ──
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        out.push(`<pre><code>${codeBlockLines.join('\n')}</code></pre>`);
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        if (inList) { out.push('</ul>'); inList = false; }
        if (inTable) { out.push('</table></div>'); inTable = false; }
        if (inQuote) { flushQuote(); inQuote = false; }
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      // Escapar HTML dentro de bloques de código
      const safeLine = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      codeBlockLines.push(safeLine);
      continue;
    }

    // Citas / Blockquotes
    const bMatch = line.match(/^>\s*(.*)$/);
    if (bMatch) {
      if (inList) { out.push('</ul>'); inList = false; }
      if (inTable) { out.push('</table></div>'); inTable = false; }
      inQuote = true;
      quoteLines.push(bMatch[1]);
      continue;
    } else if (inQuote) {
      flushQuote();
      inQuote = false;
    }

    // Tablas
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (inList) { out.push('</ul>'); inList = false; }
      if (!inTable) {
        out.push('<div class="po_table_wrap"><table>');
        inTable = true;
      }
      if (trimmed.match(/^\|?[\s\-\|:]+\|?$/)) continue;
      
      const cells = trimmed.split('|').filter((c, i, a) => (i > 0 && i < a.length - 1));
      const isHeader = inTable && out[out.length - 1].includes('<table>');
      const tag = isHeader ? 'th' : 'td';
      out.push('<tr>' + cells.map(c => `<${tag}>${parseInlines(c)}</${tag}>`).join('') + '</tr>');
      continue;
    } else if (inTable) {
      out.push('</table></div>');
      inTable = false;
    }

    // ── 2. LÍNEA HORIZONTAL (--- o ***) ──
    if (/^(\-\-\-|\*\*\*|___)$/.test(trimmed)) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('<hr class="po_hr" />');
      continue;
    }

    // ── 3. ENCABEZADOS (H1 - H6) ──
    const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      if (inList) { out.push('</ul>'); inList = false; }
      const level = hMatch[1].length;
      out.push(`<h${level}>${parseInlines(hMatch[2])}</h${level}>`);
      continue;
    }

    // ── 5. LISTAS DESORDENADAS (-, *, +) ──
    const lMatch = line.match(/^([\-\*\+])\s+(.*)$/);
    if (lMatch) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      let text = lMatch[2];
      if (text.startsWith('[ ] ')) text = '<input type="checkbox" class="po_todo_check" disabled> ' + text.slice(4);
      else if (text.startsWith('[x] ')) text = '<input type="checkbox" class="po_todo_check" checked disabled> ' + text.slice(4);
      out.push(`<li>${parseInlines(text)}</li>`);
      continue;
    }

    // ── 6. LÍNEA VACÍA / SALTO DE PÁRRAFO ──
    if (trimmed === '') {
      if (inList) { out.push('</ul>'); inList = false; }
      continue;
    }

    // ── 7. PÁRRAFO NORMAL ──
    if (inList) { out.push('</ul>'); inList = false; }
    out.push(`<p>${parseInlines(line)}</p>`);
  }

  // Cerrar elementos pendientes
  if (inList) out.push('</ul>');
  if (inTable) out.push('</table></div>');
  if (inQuote) flushQuote();
  if (inCodeBlock && codeBlockLines.length) {
    out.push(`<pre><code>${codeBlockLines.join('\n')}</code></pre>`);
  }

  return out.join('\n');
};