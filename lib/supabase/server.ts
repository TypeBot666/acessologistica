import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export const createClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error("SUPABASE_URL não está definido nas variáveis de ambiente")
    throw new Error("supabaseUrl is required")
  }

  if (!supabaseKey) {
    console.error("SUPABASE_ANON_KEY não está definido nas variáveis de ambiente")
    throw new Error("supabaseKey is required")
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Mantendo a função original para compatibilidade
export const createServerSupabaseClient = createClient
