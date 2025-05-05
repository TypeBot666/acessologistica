"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { TrackingResult } from "@/components/tracking-result"
import type { Shipment } from "@/lib/types"
import Link from "next/link"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function TrackingPage() {
  const searchParams = useSearchParams()
  const trackingCode = searchParams.get("codigo") || ""

  const [searchResult, setSearchResult] = useState<Shipment | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  // Buscar automaticamente quando a página carregar
  useEffect(() => {
    if (trackingCode) {
      fetchShipment()
    } else {
      setLoading(false)
    }
  }, [trackingCode])

  const fetchShipment = async () => {
    if (!trackingCode) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setNotFound(false)
      setSearchResult(null)

      const { data, error } = await supabase.from("shipments").select("*").eq("tracking_code", trackingCode).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          setNotFound(true)
        } else {
          throw error
        }
      } else if (data) {
        // Convert from database format to frontend format
        const shipment: Shipment = {
          trackingCode: data.tracking_code,
          senderName: data.sender_name,
          recipientName: data.recipient_name,
          recipientCpf: data.recipient_cpf,
          originAddress: data.origin_address,
          destinationAddress: data.destination_address,
          productType: data.product_type,
          weight: data.weight,
          shipDate: data.ship_date,
          status: data.status as any,
        }

        setSearchResult(shipment)
      }
    } catch (error) {
      console.error("Error searching shipment:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar a remessa. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto flex items-center px-4 py-3">
          <Link href="/">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo_home%20%281%29-k4dNWea9Xt8N85gYxkxe0vxCGH4uG9.webp"
              alt="Jadlog"
              className="h-8 w-auto sm:h-10"
            />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-2xl">
          {loading ? (
            <div className="flex h-48 sm:h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-red-600" />
              <span className="ml-2 text-base sm:text-lg">Carregando informações da remessa...</span>
            </div>
          ) : !trackingCode ? (
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md text-center">
              <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-gray-900">
                Nenhum código de rastreio informado
              </h2>
              <p className="mb-4 text-sm sm:text-base text-gray-600">
                Por favor, retorne à página inicial e informe um código de rastreio válido.
              </p>
              <Link
                href="/"
                className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium text-white hover:bg-red-700"
              >
                Voltar para a página inicial
              </Link>
            </div>
          ) : notFound ? (
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md text-center">
              <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-gray-900">Remessa não encontrada</h2>
              <p className="mb-4 text-sm sm:text-base text-gray-600">
                Não foi possível encontrar uma remessa com o código <span className="font-mono">{trackingCode}</span>.
                Por favor, verifique o código e tente novamente.
              </p>
              <Link
                href="/"
                className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium text-white hover:bg-red-700"
              >
                Voltar para a página inicial
              </Link>
            </div>
          ) : searchResult ? (
            <TrackingResult shipment={searchResult} />
          ) : null}
        </div>
      </main>
    </div>
  )
}
