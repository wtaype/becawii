// RATE LIMIT v1.0 — Freno de intentos por acción ─────────────────────────
export function wiRateLimit(key, max = 5, hasta = 'dia') {
  const K = `limiteHoy_${key}`;
  let s = (() => {
    try {
      if (typeof localStorage === 'undefined') return null;
      const item = localStorage.getItem(K);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })() ?? { n: 0, bloqueadoHasta: 0 };

  if (Date.now() < s.bloqueadoHasta) {
    const min = Math.ceil((s.bloqueadoHasta - Date.now()) / 60000);
    return { ok: false, min, fail: () => {}, reset: () => { if (typeof localStorage !== 'undefined') localStorage.removeItem(K); } };
  }
  if (s.bloqueadoHasta > 0) s = { n: 0, bloqueadoHasta: 0 };
  return {
    ok: true,
    min: 0,
    fail() {
      if (++s.n >= max) {
        const d = new Date();
        s.bloqueadoHasta = hasta === 'dia' ? (d.setHours(24, 0, 0, 0), d.getTime()) : Date.now() + hasta;
        s.n = 0;
      }
      if (typeof localStorage !== 'undefined') localStorage.setItem(K, JSON.stringify(s));
    },
    reset: () => { if (typeof localStorage !== 'undefined') localStorage.removeItem(K); }
  };
}