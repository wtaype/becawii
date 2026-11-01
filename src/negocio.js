// src/negocio.js
// 🌟 Fachada Canónica de Negocio BecaWii 2026 (Cero Hardcoding en Componentes)
// Conecta directamente con src/semillas/configurar.js y src/wii.js

import { 
  configurarSistema,
  getEstudiante,
  getRetoHermanos,
  getExamenOficial,
  getBancosDisponibles,
  getModosPractica,
  getNavegacion
} from './semillas/configurar.js';
import wii from './wii.js';

export const datosNegocio = {
  id: wii.id ?? 'becawii',
  nombre: wii.app ?? 'BecaWii',
  subtitulo: 'Rumbo a Beca 18 • Convocatoria 2026',
  lema: wii.slogan ?? 'Tu camino al éxito en Beca 18',
  autor: wii.by ?? '@wilder.taype',
  version: wii.versionName ?? 'v1',
  versionNum: wii.version ?? 1.0,
  linkweb: wii.linkweb ?? 'https://becawii.web.app',
  logo: '/smile.avif',
  logoFull: '/smile.avif',
  estudiante: getEstudiante(),
  reto: getRetoHermanos(),
  examen: getExamenOficial(),
  bancos: getBancosDisponibles(),
  modos: getModosPractica(),
  navegacion: getNavegacion()
};

export {
  configurarSistema,
  getEstudiante,
  getRetoHermanos,
  getExamenOficial,
  getBancosDisponibles,
  getModosPractica,
  getNavegacion
};

export default datosNegocio;
