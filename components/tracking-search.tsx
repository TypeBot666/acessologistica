"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientSupabaseClient } from "@/lib/supabase/client"

export function TrackingSearch() {
  const router = useRouter()
  const [trackingCode, setTrackingCode] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClientSupabaseClient()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!trackingCode) return

    setLoading(true)

    try {
      // Verificar se o código existe antes de redirecionar
      const { data, error } = await supabase
        .from("shipments")
        .select("tracking_code")
        .eq("tracking_code", trackingCode.trim())
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // Código não encontrado, mas ainda redirecionamos para mostrar mensagem na página de rastreio
          router.push(`/rastreio?codigo=${encodeURIComponent(trackingCode.trim())}`)
        } else {
          throw error
        }
      } else if (data) {
        // Código encontrado, redirecionar para a página de rastreio
        router.push(`/rastreio?codigo=${encodeURIComponent(trackingCode.trim())}`)
      }
    } catch (error) {
      console.error("Erro ao buscar remessa:", error)
      // Mesmo com erro, redirecionamos para a página de rastreio que mostrará o erro
      router.push(`/rastreio?codigo=${encodeURIComponent(trackingCode.trim())}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center">
        <div className="relative flex-grow w-full mb-2 sm:mb-0">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Digite seu código de rastreio"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
            className="border-0 pl-10 focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
          />
        </div>
        <Button type="submit" className="bg-red-600 hover:bg-red-700 w-full sm:w-auto sm:ml-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              Rastrear
              <Search className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
