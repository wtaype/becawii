// src/core/seo.js
// Metadatos SEO y OpenGraph estáticos de TimeWii

import app from '../app.js';

export const SEO_METADATA = {
  title: `${app.nombre} - ${app.slogan} | Wellcare Advisor Toolkit`,
  description: 'Herramienta integral de productividad y apoyo para asesores telefónicos de Wellcare Medicare Advantage en Teleperformance.',
  keywords: ['timewii', 'wellcare', 'medicare advantage', 'advisor toolkit', 'call center support', 'teleperformance'],
  canonical: 'https://timewii.vercel.app/',
  ogType: 'website'
};

export function getMeta() {
  return SEO_METADATA;
}

export default { SEO_METADATA, getMeta };