"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/types"

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClientSupabaseClient() {
  if (supabaseClient === null) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase URL or key is missing. Check your environment variables.")
      // Retornar um cliente mock para evitar erros de runtime
      return {
        from: () => ({
          select: () => ({ data: [], error: null }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ data: null, error: null }),
          eq: () => ({ data: null, error: null }),
          single: () => ({ data: null, error: null }),
          order: () => ({ data: null, error: null }),
          limit: () => ({ data: null, error: null }),
          upsert: () => ({ data: null, error: null }),
        }),
      } as any
    }

    try {
      supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseKey)
      console.log("Cliente Supabase criado com sucesso")
    } catch (error) {
      console.error("Erro ao criar cliente Supabase:", error)
      return {
        from: () => ({
          select: () => ({ data: [], error: null }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ data: null, error: null }),
          eq: () => ({ data: null, error: null }),
          single: () => ({ data: null, error: null }),
          order: () => ({ data: null, error: null }),
          limit: () => ({ data: null, error: null }),
          upsert: () => ({ data: null, error: null }),
        }),
      } as any
    }
  }

  return supabaseClient
}
