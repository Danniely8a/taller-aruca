const MAX_DIMENSION = 1200;
const QUALITY = 0.8;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const OK_EXT = /\.(jpe?g|png|webp|gif)$/i;
const IMG_EXT = /\.(hei[cf]|avif|jpe?g|png|webp|gif|bmp|tiff?)$/i;

function looksLikeImage(file) {
  return (file.type && file.type.startsWith('image/')) || IMG_EXT.test(file.name || '');
}

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      try {
        return await createImageBitmap(file);
      } catch {}
    }
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('read'));
    reader.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = dataUrl;
  });
}

export default async function compressImage(file) {
  if (file.size <= 500 * 1024 && (OK_TYPES.includes(file.type) || OK_EXT.test(file.name || ''))) {
    return file;
  }

  let source;
  try {
    source = await decode(file);
  } catch {
    if (looksLikeImage(file)) return file;
    throw new Error('No se pudo leer la imagen. Usa una foto JPG o PNG.');
  }

  try {
    const canvas = document.createElement('canvas');
    let width = source.width;
    let height = source.height;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0, width, height);
    if (typeof source.close === 'function') source.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob) throw new Error('compress');
    let name = file.name || 'foto';
    name = OK_EXT.test(name) ? name.replace(/\.[^.]+$/, '.jpg') : `${name}.jpg`;
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    if (looksLikeImage(file)) return file;
    throw new Error('Error al comprimir la imagen');
  }
}
