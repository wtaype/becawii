// src/lib/widev/fecha.js
// fecha v13.1: Utilidades de fecha y tiempo con soporte i18n via langwii

import { langwii } from './langwii.js';

// ── Año actual ───────────────────────────────────────────────────────────────
export const year = () => new Date().getFullYear();

// ── Fechas de Firebase con formato múltiple ──────────────────────────────────
export const wiDate = (tm) => ({
  save: (val) => {
    if (!val) return null;
    if (val.length === 10) val = `${val}T${new Date().toTimeString().split(' ')[0]}`;
    return tm.fromDate(new Date(val));
  },
  get: (val, fmt) => {
    const sec = val?.seconds ?? (val?.type?.includes?.('timestamp') ? val.seconds : null);
    const fec = val?.toDate?.() || (sec && new Date(sec * 1000)) || (typeof val === 'number' && new Date(val * 1000));
    if (!fec) return '';
    const ajustada = new Date(fec.getTime() - fec.getTimezoneOffset() * 60000);
    if (fmt === 'full')  return ajustada.toISOString().slice(0, 16);
    if (fmt === 'local') return fec.toLocaleDateString();
    return ajustada.toISOString().split('T')[0];
  }
});

// ── Fecha de hoy localizada ("domingo, 13 de abril de 2026" / "Sunday, April 13, 2026") ──
export const fechaHoy = (lang = '') => {
  const locale = langwii.esEn(lang) ? 'en-US' : 'es-PE';
  return new Date().toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

// ── Timestamp → "YYYY-MM-DD" para input[type=date] ──────────────────────────
export const formatearFechaParaInput = (ts) => {
  if (!ts) return '';
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toISOString().split('T')[0];
};

// ── Timestamp → "13 abr 2026 09:30" / "Apr 13, 2026 09:30 AM" ───────────────
export const formatearFechaHora = (ts, lang = '') => {
  if (!ts) return '—';
  const locale = langwii.esEn(lang) ? 'en-US' : 'es-PE';
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
       + ' ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

// ── Tiempo relativo i18n — "Hace 5 min" / "5 min ago" ──────────────────────
export const wiTiempo = (ts, lang = '') => {
  if (!ts) return '—';
  const lCode = langwii.get(lang);
  const diff = Date.now() - (ts?.seconds ? ts.seconds * 1000 : ts);
  const s = Math.floor(diff / 1000);

  if (s < 60) return langwii.nw({ es: 'Hace un momento', en: 'Just now' }, {}, lCode);
  
  const m = Math.floor(s / 60);
  if (m < 60) return langwii.nw({ es: 'Hace {m} min', en: '{m} min ago' }, { m }, lCode);
  
  const h = Math.floor(m / 60);
  if (h < 24) return langwii.nw({ es: 'Hace {h}h', en: '{h}h ago' }, { h }, lCode);
  
  const d = Math.floor(h / 24);
  if (d < 7) return langwii.nw({ es: 'Hace {d}d', en: '{d}d ago' }, { d }, lCode);

  return formatearFechaHora(ts, lang);
};

// ── Meses entre una fecha y hoy ─────────────────────────────────────────────
export const calcMeses = (desde) => {
  const h = new Date(), f = new Date(desde);
  return (h.getFullYear() - f.getFullYear()) * 12 + (h.getMonth() - f.getMonth());
};
