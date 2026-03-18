/**
 * Punto de entrada único para compatibilidad con imports legacy (ej. "../lib/supabase").
 * La app usa supabaseClient.ts (navegador) y supabaseServer.ts (servidor).
 */
import { createClient } from './supabaseClient'

export { createClient }

// Solo instanciar en el navegador para no fallar en el build de Node
export const supabase =
  typeof window !== 'undefined' ? createClient() : (null as ReturnType<typeof createClient> | null)
