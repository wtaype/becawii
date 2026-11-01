// src/app.js
// 🌟 Configuración Global de la Aplicación BecaWii 2026
import wii from './wii.js';

export const app = {
  id: wii.id,
  nombre: wii.app,
  slogan: wii.slogan,
  autor: wii.by,
  version: wii.versionName,
  versionNum: wii.version,
  linkweb: wii.linkweb
};

export default app;
