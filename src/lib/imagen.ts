/** Achica una foto en el navegador (máx. `lado` px, JPEG) para subirla rápido desde el celular. */
export async function comprimirImagen(file: File, lado = 1600, calidad = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const escala = Math.min(1, lado / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * escala);
    const h = Math.round(bmp.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", calidad));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // formatos que el navegador no puede leer (ej. HEIC en algunos equipos) se suben tal cual
  }
}
