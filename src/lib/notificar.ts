import "server-only";

/**
 * Manda un email por Resend (sin librerías, con su API HTTP).
 * Si faltan RESEND_API_KEY / EMAIL_FROM en Vercel no hace nada: el aviso del panel sigue funcionando igual.
 */
export async function enviarEmail({ para, asunto, texto }: { para: string; asunto: string; texto: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [para], subject: asunto, text: texto }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Email del taller que recibe los avisos (se puede cambiar con EMAIL_TALLER en Vercel). */
export const emailTaller = () => process.env.EMAIL_TALLER || "tallermusicamusicaweb@gmail.com";
