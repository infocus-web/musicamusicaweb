import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service role. SOLO en el servidor: lo usa la página pública de
 * seguimiento, que valida el token del link antes de leer nada.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
