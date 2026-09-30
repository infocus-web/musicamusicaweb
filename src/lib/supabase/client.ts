import { createBrowserClient } from "@supabase/ssr";

/** Cliente de Supabase para el navegador (subida de videos desde el panel). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
