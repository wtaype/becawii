// src/lib/widev/superfun.js
// superfun v1.2: Ejecución diferida persistente de scripts pesados hasta la primera interacción del usuario en la sesión

export const superFun = (() => {
  const getIsFun = () => {
    try {
      if (typeof localStorage === 'undefined') return false;
      return localStorage.getItem('superFun') === 'true';
    } catch (e) {
      return false;
    }
  };

  const setIsFun = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('superFun', 'true');
      }
    } catch (e) {}
  };

  const c = getIsFun();
  
  const run = (fn) => {
    try {
      fn();
    } catch (e) {
      console.error('superFun:', e);
    }
    setIsFun();
  };

  return (fn) => {
    if (typeof window === 'undefined') return;
    if (c) return run(fn);

    const trigger = () => {
      run(fn);
      ['touchstart', 'scroll', 'click', 'mousemove'].forEach(ev => {
        document.removeEventListener(ev, trigger);
      });
    };

    ['touchstart', 'scroll', 'click', 'mousemove'].forEach(ev => {
      document.addEventListener(ev, trigger, { once: true });
    });
  };
})();
