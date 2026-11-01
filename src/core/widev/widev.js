// src/lib/widev/widev.js
// El cerebro del módulo que une y expone las utilidades segmentadas de widev/
// v1.0.1: Añadido export de atajos.js y abrirGaleria

export { Saludar, saludoSmile } from './saludo.js';
export { wiTip } from './witip.js';
export { wiVista, herowi, showi, wiFade } from './animacion.js';
export { wicopy } from './copy.js';
export { comprimirImagen } from './comprimir.js';
export { year, wiDate, fechaHoy, formatearFechaParaInput, formatearFechaHora, wiTiempo, calcMeses } from './fecha.js';
export { imgwii } from './imgwii.js';
export { Mensaje, Notificacion } from './mensajes.js';
export { wiConfirmar } from './confirmar.js';
export { wiModal, abrirModal, cerrarModal, cerrarTodos } from './modales.js';
export { wiPath } from './navegador.js';
export { Capit, NombreApellido, getNombre, avatar } from './nombre.js';
export { wiRateLimit } from './ratelimit.js';
export { wiScroll, wiVirtualScroll } from './scroll.js';
export { setMeta } from './seometa.js';
export { wiSpin } from './spin.js';
export { savels, getls, removels, gosave, getsave, gosaves, getsaves } from './storage.js';
export { superFun } from './superfun.js';
export { wiTema, witema, witemas, setTema } from './tema.js';
export { Mayu, Capi, mis10, minus } from './texto.js';
export { wiCode } from './wicode.js';
export { wiIp } from './wiip.js';
export { wiSmart } from './wismart.js';
export { wiSuma, adrm, adtm, adup } from './more.js';
export { wiMd } from './wimd.js';
export { wiInit } from './wiinit.js';
export { langwii, getLang } from './langwii.js';
export { wiDropdown, cerrarTodosLosDropdowns } from './dropdown.js';
export { wiSelect } from './wiselect.js';
export { wiSugerencias } from './sugerencias.js';
export { wiAtajo } from './atajos.js';
export { wiGaleria, abrirGaleria } from './galeria.js';
export { wiEditor } from './editor.js';