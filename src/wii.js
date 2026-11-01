// src/wii.js
export const id = 'becawii';
export const app = 'Becawii';
export const slogan = 'Smart tools for you';
export const by = '@wilder.taype';
export const version = 1.0;
export const versionName = 'v1';
export const linkweb = 'https://becawii.web.app';
export default { id, app, slogan, by, version, versionName, linkweb };

/** ACTUALIZAR AL TAG POR SEGURIDAD [TAG NUEVO] (1)
git tag v1 -m "Version v1" ; git push origin v1

ACTUALIZACIÓN AL MAIN PRINCIPAL DEL PROYECTO [MAIN] (2)
git add . ; git commit -m "Actualizacion Principal v1.10.10" ; git push origin main

// REEMPLAZAR TAG DE SEGURIDAD EXISTENTE [TAG REMPLAZO] (3)
git tag -d v1 ; git tag v1 -m "Version v3 actualizada" ; git push origin v3 --force

// Actualizar versiones de seguridad [ELIMINAR CARPETA - ARCHIVO ONLINE] (5)
git rm --cached skills-lock.json ; git commit -m "Archivo Eliminado" ; git push origin main
git rm -r --cached .claude/ ; git commit -m "Carpeta Eliminada" ; git push origin main
 ACTUALIZACION TAG[END] */   
