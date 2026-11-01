// src/core/widev/comprimir.js
// Utilidad para redimensionar y comprimir imágenes del cliente en tiempo real

/**
 * Redimensiona una imagen a una dimensión máxima de maxDim píxeles
 * y la comprime a WebP usando HTML5 Canvas.
 * 
 * @param {File} file - Archivo de imagen del portapapeles o drop
 * @param {number} maxDim - Dimensión máxima permitida (ancho o alto)
 * @returns {Promise<{base64: string, mimeType: string, dataUrl: string}>}
 */
export const comprimirImagen = (file, maxDim = 512) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('El archivo no es una imagen válida.'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar conservando el ratio de aspecto
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('No se pudo obtener el contexto 2D del Canvas.'));
        }

        // Limpiar lienzo y dibujar imagen
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a WebP con calidad 75%
        const dataUrl = canvas.toDataURL('image/webp', 0.75);
        const parts = dataUrl.split(',');
        const base64 = parts[1];
        const mimeType = parts[0].split(';')[0].split(':')[1] || 'image/webp';

        resolve({
          base64,
          mimeType,
          dataUrl
        });
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen en memoria.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsDataURL(file);
  });
};
