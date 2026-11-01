// src/lib/widev/wicode.js
// wiCode v1.1 - Formateador de bloques de código pre/code con botón flotante interactivo de copiado rápido (estilos en witema.css)

export const wiCode = (sel) => {
  if (typeof document === 'undefined') return;

  document.querySelectorAll(sel).forEach(el => {
    // Evitar duplicaciones de envoltura
    if (el.parentElement && el.parentElement.classList.contains('wiCode-box')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'wiCode-box';

    el.parentNode?.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    // Botón flotante para copiar el texto
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'wiCode-copy-btn';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    copyBtn.setAttribute('title', 'Copiar código');

    copyBtn.addEventListener('click', () => {
      const text = el.textContent || '';
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check wicode_copy_success"></i>';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 1500);
      }).catch(() => {});
    });

    wrapper.appendChild(copyBtn);
  });
};