/** Dominios de email más usados en Argentina. */
const DOMINIOS = [
  "gmail.com", "hotmail.com", "hotmail.com.ar", "outlook.com", "outlook.com.ar", "yahoo.com", "yahoo.com.ar",
  "live.com", "live.com.ar", "icloud.com", "fibertel.com.ar", "speedy.com.ar", "arnet.com.ar",
];

/** Cantidad de cambios (letras de más, de menos, cambiadas o invertidas) entre dos textos. */
function distancia(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email);
}

/**
 * Si el dominio parece un error de tipeo de uno conocido (gmmail.com, gmial.com, hotmial.com,
 * gmail.con, gmail.com.ar…) devuelve el email corregido. Si está bien o no se parece a ninguno, null.
 */
export function sugerirEmail(email: string): string | null {
  const [usuario, dominio] = email.trim().toLowerCase().split("@");
  if (!usuario || !dominio || DOMINIOS.includes(dominio)) return null;
  if (dominio === "gmail.com.ar") return `${usuario}@gmail.com`; // gmail no tiene .com.ar
  let mejor: string | null = null, min = 3;
  for (const d of DOMINIOS) {
    const n = distancia(dominio, d);
    if (n < min) { min = n; mejor = d; }
  }
  return mejor && min <= 2 ? `${usuario}@${mejor}` : null;
}
