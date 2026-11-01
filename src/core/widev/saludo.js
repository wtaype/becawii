// src/core/widev/saludo.js
// Saludar: Saludos inteligentes localizados en español e inglés (Desacoplado)
// Mapea por defecto a español para máxima velocidad y compatibilidad en otros proyectos.

import { langwii } from './langwii.js';
import { getls } from './storage.js';

/**
 * Obtiene el saludo correspondiente al momento del día (Buenos días, Buenas tardes, Buenas noches)
 * Soporta localización en inglés ('en') e indica español ('es') por defecto.
 */
export const Saludar = (nombre = '', lang = '') => {
  const hrs = new Date().getHours();
  const isEn = lang && langwii ? langwii.esEn(lang) : false;
  
  const saludo = hrs < 12
    ? (isEn ? 'Good morning'   : 'Buenos días')
    : hrs < 18
      ? (isEn ? 'Good afternoon' : 'Buenas tardes')
      : (isEn ? 'Good evening'   : 'Buenas noches');
      
  return nombre ? `${saludo}, ${nombre}` : `${saludo},`;
};

/**
 * saludoSmile: obtiene el primer nombre del perfil wiSmile y saluda según la hora e idioma (por defecto español)
 */
export const saludoSmile = (lang = '') => {
  const perfil = getls('wiSmile');
  const nombreCompleto = perfil ? (perfil.nombre || '') : '';
  const primerNombre = nombreCompleto.trim().split(/\s+/)[0] || 'Campeón';
  const activeLang = lang || (langwii ? langwii.get() : 'es');
  return Saludar(primerNombre, activeLang);
};