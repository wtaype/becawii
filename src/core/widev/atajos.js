// src/core/widev/atajos.js
// atajos v1.0: Gestor global de atajos de teclado (Shortcuts) para la suite

export function wiAtajo(keys, callback) {
  if (typeof window === 'undefined') return;

  const handler = (e) => {
    // Omitir atajos si el foco está en un campo de texto o editor
    const activeEl = document.activeElement;
    if (
      activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable || 
        activeEl.contentEditable === 'true'
      )
    ) {
      return;
    }

    const targetKeys = keys.toLowerCase().split('+');
    
    const ctrlPressed  = targetKeys.includes('ctrl') || targetKeys.includes('control');
    const shiftPressed = targetKeys.includes('shift');
    const altPressed   = targetKeys.includes('alt');
    const metaPressed  = targetKeys.includes('meta') || targetKeys.includes('cmd');
    
    const keyToken = targetKeys.find(k => !['ctrl', 'control', 'shift', 'alt', 'meta', 'cmd'].includes(k));
    
    if (!keyToken) return;

    // Verificar si coinciden los modificadores
    const matchCtrl  = ctrlPressed  === (e.ctrlKey || e.metaKey);
    const matchShift = shiftPressed === e.shiftKey;
    const matchAlt   = altPressed   === e.altKey;
    const matchKey   = e.key.toLowerCase() === keyToken;

    if (matchCtrl && matchShift && matchAlt && matchKey) {
      e.preventDefault();
      callback(e);
    }
  };

  window.addEventListener('keydown', handler);

  // Retornar función para desregistrar el atajo
  return () => window.removeEventListener('keydown', handler);
}
