// src/lib/widev/seometa.js
// seometa v10.1: Gestor dinámico de metaetiquetas SEO y esquemas JSON-LD (Schema.org) en el cliente

import { app, linkweb } from '../../wii.js';
const descri = 'Solgas Surquillo Distribuidor';
const keywii = 'gas glp surquillo';

const setTag = (id, val) => {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (el) el.setAttribute('content', val);
};

const setHref = (id, val) => {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (el) el.setAttribute('href', val);
};

/**
 * @param {Object} [config]
 * @param {string} [config.title]
 * @param {string} [config.desc]
 * @param {string} [config.keywords]
 * @param {string} [config.img]
 * @param {string} [config.path]
 * @param {string} [config.type]
 * @param {any} [config.datePublished]
 */
export const setMeta = ({ title, desc, keywords, img, path, type = 'WebSite', datePublished = null } = {}) => {
  if (typeof document === 'undefined') return;

  const t = title ?? `${app} — ${descri}`;
  const d = desc ?? `${descri}`;
  const k = keywords ?? keywii;
  const i = img ?? `${linkweb}/poster.webp`;
  const p = path ?? '/';
  const url = `${linkweb}${p}`;

  document.title = t;
  setTag('wi_desc', d);
  setTag('wi_keywords', k);
  setHref('wi_canonical', url);

  setTag('wi_og_title', t);
  setTag('wi_og_desc', d);
  setTag('wi_og_url', url);
  setTag('wi_og_img', i);

  setTag('wi_tw_title', t);
  setTag('wi_tw_desc', d);
  setTag('wi_tw_img', i);

  // Schema Dinámico
  const oldSchema = document.getElementById('wi_schema_art');
  if (oldSchema) oldSchema.remove();

  if (type === 'Article') {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'wi_schema_art';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": t,
      "image": i,
      "datePublished": datePublished ? new Date(datePublished).toISOString() : new Date().toISOString(),
      "author": { "@type": "Person", "name": "Wilder Taype" }
    });
    document.head.appendChild(script);
  }
};
