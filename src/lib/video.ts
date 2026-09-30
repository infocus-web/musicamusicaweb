/** Convierte un link de YouTube / Instagram / TikTok / Vimeo en su versión para embeber. */
export type VideoEmbebido = { plataforma: "youtube" | "instagram" | "tiktok" | "vimeo"; id: string; embed: string; vertical: boolean; miniatura: string | null; original: string };

export function leerVideo(url: string): VideoEmbebido | null {
  let u: URL;
  try { u = new URL(url.trim()); } catch { return null; }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const partes = u.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" || host.endsWith("youtube.com")) {
    const id = host === "youtu.be" ? partes[0] : u.searchParams.get("v") ?? (["shorts", "embed", "live"].includes(partes[0]) ? partes[1] : null);
    if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
    return { plataforma: "youtube", id, embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`, vertical: partes[0] === "shorts", miniatura: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, original: url };
  }
  if (host.endsWith("instagram.com")) {
    const i = partes.findIndex((p) => ["p", "reel", "reels", "tv"].includes(p));
    const id = i >= 0 ? partes[i + 1] : null;
    if (!id || !/^[\w-]{5,40}$/.test(id)) return null;
    return { plataforma: "instagram", id, embed: `https://www.instagram.com/${partes[i] === "p" ? "p" : "reel"}/${id}/embed`, vertical: true, miniatura: null, original: url };
  }
  if (host.endsWith("tiktok.com")) {
    const i = partes.indexOf("video");
    const id = i >= 0 ? partes[i + 1] : null;
    if (!id || !/^\d{8,25}$/.test(id)) return null;
    return { plataforma: "tiktok", id, embed: `https://www.tiktok.com/embed/v2/${id}`, vertical: true, miniatura: null, original: url };
  }
  if (host.endsWith("vimeo.com")) {
    const id = partes.find((p) => /^\d{5,12}$/.test(p));
    if (!id) return null;
    return { plataforma: "vimeo", id, embed: `https://player.vimeo.com/video/${id}?autoplay=1`, vertical: false, miniatura: null, original: url };
  }
  return null;
}

/** Del texto del panel (un link por línea) se quedan solo los links válidos. */
export function limpiarVideos(texto: string | null | undefined): string[] {
  return (texto ?? "").split(/[\s,]+/).map((l) => l.trim()).filter((l) => l && leerVideo(l)).slice(0, 12);
}
