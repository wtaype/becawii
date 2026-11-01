// src/lib/widev/storage.js
// storage v11.1: Gestor local de almacenamiento (localStorage) con expiración controlada por horas y sincronización DOM-unload

export function savels(clave, valor, horas = 24) {
  try {
    if (typeof localStorage === 'undefined') return false;
    if (!clave || typeof clave !== 'string') return false;
    const expiry = (horas === null || horas === false) ? null : Date.now() + horas * 3600000;
    localStorage.setItem(clave, JSON.stringify({ value: valor, expiry }));
    return true;
  } catch(e) {
    console.error('esv:', e);
    return false;
  }
}

export function getls(clave) {
  try {
    if (typeof localStorage === 'undefined') return null;
    if (!clave || typeof clave !== 'string') return null;
    const item = localStorage.getItem(clave);
    if (!item) return null;
    
    let parsed;
    try {
      parsed = JSON.parse(item);
    } catch(parseErr) {
      return item; // Retrocompatibilidad: Si no es JSON válido, retornar crudo
    }
    
    // Retrocompatibilidad: Si es JSON pero no tiene el formato { value, expiry }
    if (!parsed || typeof parsed !== 'object' || !('value' in parsed)) {
      return parsed;
    }
    
    // Solo expira si tiene un campo 'expiry' numérico y ya venció
    if (parsed.expiry && Date.now() > parsed.expiry) {
      localStorage.removeItem(clave);
      return null;
    }
    return parsed.value;
  } catch(e) {
    console.error('egt:', e);
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(clave);
    } catch(err) {}
    return null;
  }
}

export function removels(...claves) {
  if (typeof localStorage === 'undefined') return;
  try {
    claves.flat().flatMap(c => typeof c === 'string' ? c.split(/[,\s]+/).filter(Boolean) : c)
      .forEach(clave => localStorage.removeItem(clave));
  } catch(e) {}
}

removels.except = (keep = []) => {
  if (typeof localStorage === 'undefined') return;
  try {
    Object.keys(localStorage).forEach(k => {
      if (!keep.includes(k) && !k.startsWith('sb-')) {
        localStorage.removeItem(k);
      }
    });
  } catch(e) {}
};

// AUTO-SAVE LOCAL: Guarda un elemento antes de salir (168h = 7 días)
export function gosave(tis, ele) {
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => savels(tis, ele, 168));
  }
}

// Recupera un valor guardado y ejecuta el callback
export function getsave(sv, fn) {
  const mvl = getls(sv);
  if (mvl) fn(mvl);
}

// Guarda varios elementos (por selector + atributo de clave) antes de salir
export function gosaves(sel, attr, fn) {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeunload', () => {
    document.querySelectorAll(sel).forEach(el => {
      const key = el.getAttribute(attr);
      if (key) savels(key, fn(el), 168);
    });
  });
}

// Recupera varios valores guardados y aplica callback a cada elemento
export function getsaves(sel, attr, fn) {
  if (typeof document === 'undefined') return;
  document.querySelectorAll(sel).forEach(el => {
    const key = el.getAttribute(attr);
    if (key) {
      const val = getls(key);
      if (val) fn(el, val);
    }
  });
}