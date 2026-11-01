// src/lib/widev/more.js
// more v10.2: Atajos y utilidades DOM rápidas para manipular clases, temporizadores y contadores de clics

// CLICK SUMA: Ejecuta una función tras N clics consecutivos sobre un elemento o selector
export const wiSuma = (selOrEl, fn, num = 5) => {
  let cont = 0;
  if (typeof document === 'undefined') return;

  document.addEventListener('click', (e) => {
    const isMatch = typeof selOrEl === 'string'
      ? e.target.closest(selOrEl)
      : (e.target === selOrEl || selOrEl.contains(e.target));

    if (isMatch) {
      cont++;
      if (cont === num) {
        fn();
        cont = 0;
      }
    }
  });
};

// adrm: Añade una clase al elemento y la remueve de todos sus hermanos directos
export const adrm = (a, b) => {
  if (typeof document === 'undefined') return;
  const el = typeof a === 'string' ? document.querySelector(a) : a;
  if (!el) return;
  el.classList.add(b);
  if (el.parentNode) {
    [...el.parentNode.children].forEach(sib => {
      if (sib !== el) sib.classList.remove(b);
    });
  }
};

// adtm: Cambia el texto de un elemento y le aplica una clase de forma temporal por 1.8s
export const adtm = (se, cl, ti, tf) => {
  if (typeof document === 'undefined') return;
  const el = typeof se === 'string' ? document.querySelector(se) : se;
  if (!el) return;
  el.textContent = ti;
  el.classList.add(cl);
  setTimeout(() => {
    el.textContent = tf;
    el.classList.remove(cl);
  }, 1800);
};

// adup: Añade clase "updating" por 500ms al actualizar un texto
export const adup = (x, y) => {
  if (typeof document === 'undefined') return;
  const el = typeof x === 'string' ? document.querySelector(x) : x;
  if (!el) return;
  el.classList.add('updating');
  el.textContent = y;
  setTimeout(() => el.classList.remove('updating'), 500);
};