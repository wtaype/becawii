// src/lib/widev/nombre.js
// nombre v10.8: Formateador de nombres y extracción de iniciales combinadas de perfil (Nombre + Primer Apellido -> "WV")

// Capitaliza cada palabra
export const Capit = (txt = '') => txt.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

// "Primer Nombre + Primer Apellido" desde nombres completos
export const NombreApellido = (nombres = '') => {
  const p = nombres.trim().split(/\s+/).filter(Boolean);
  if (p.length <= 1) return Capit(nombres);
  const primerNombre = p[0];
  const primerApellido = p.length >= 4 ? p[2] : p[1];
  return `${Capit(primerNombre)} ${Capit(primerApellido)}`;
};

// Primer nombre capitalizado
export const getNombre = (nombres = '') => Capit(nombres.trim().split(/\s+/)[0] || nombres);

// Inicial del primer nombre junto a la del primer apellido para avatar (ej: "WV")
export const avatar = (nombres = '') => {
  const p = nombres.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return 'U';
  const iniNombre = p[0][0] ?? '';
  if (p.length === 1) return iniNombre.toUpperCase();
  const primerApellido = p.length >= 4 ? p[2] : p[1];
  const iniApellido = primerApellido[0] ?? '';
  return `${iniNombre}${iniApellido}`.toUpperCase();
};