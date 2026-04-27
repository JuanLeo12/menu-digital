import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Crea y devuelve el cliente usando las variables de entorno
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'schema_menu' },
      cookieOptions: {
        maxAge: 60 * 60 * 12, // 12 horas de sesión
      }
    }
  )
}

