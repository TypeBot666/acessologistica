"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Shipment, StatusHistory } from "@/lib/types"
import {
  Package,
  Truck,
  CheckCircle,
  MapPin,
  Scan,
  Warehouse,
  AlertTriangle,
  PackageX,
  Clock,
  Calendar,
  User,
  MapPinned,
  ShoppingBag,
  Scale,
} from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { TrackingTimeline } from "@/components/tracking-timeline"

interface TrackingResultProps {
  shipment: Shipment
}

export function TrackingResult({ shipment }: TrackingResultProps) {
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    const fetchStatusHistory = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("status_history")
          .select("*")
          .eq("tracking_code", shipment.trackingCode)
          .order("created_at", { ascending: false })

        if (error) throw error

        setStatusHistory(data || [])
      } catch (error) {
        console.error("Erro ao carregar histórico de status:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatusHistory()
  }, [shipment.trackingCode, supabase])

  const getStatusIcon = () => {
    const statusLower = shipment.status.toLowerCase()

    if (statusLower.includes("postado")) {
      return <Package className="h-10 w-10 text-yellow-500" />
    }
    if (statusLower.includes("triagem")) {
      return <Scan className="h-10 w-10 text-blue-500" />
    }
    if (statusLower.includes("trânsito")) {
      return <Truck className="h-10 w-10 text-blue-500" />
    }
    if (statusLower.includes("centro de distribuição")) {
      return <Warehouse className="h-10 w-10 text-blue-500" />
    }
    if (statusLower.includes("rota de entrega")) {
      return <MapPin className="h-10 w-10 text-blue-500" />
    }
    if (statusLower.includes("entregue com sucesso")) {
      return <CheckCircle className="h-10 w-10 text-green-500" />
    }
    if (statusLower.includes("não realizada") || statusLower.includes("ausente")) {
      return <AlertTriangle className="h-10 w-10 text-orange-500" />
    }
    if (statusLower.includes("devolvido")) {
      return <PackageX className="h-10 w-10 text-red-500" />
    }
    if (statusLower.includes("aguardando retirada")) {
      return <Clock className="h-10 w-10 text-purple-500" />
    }

    return <Package className="h-10 w-10 text-yellow-500" />
  }

  const getStatusClass = () => {
    const statusLower = shipment.status.toLowerCase()

    if (statusLower.includes("entregue com sucesso")) {
      return "bg-green-100 text-green-800"
    }
    if (statusLower.includes("devolvido")) {
      return "bg-red-100 text-red-800"
    }
    if (statusLower.includes("não realizada") || statusLower.includes("ausente")) {
      return "bg-orange-100 text-orange-800"
    }
    if (statusLower.includes("aguardando retirada")) {
      return "bg-purple-100 text-purple-800"
    }
    if (
      statusLower.includes("trânsito") ||
      statusLower.includes("rota") ||
      statusLower.includes("centro") ||
      statusLower.includes("triagem")
    ) {
      return "bg-blue-100 text-blue-800"
    }

    return "bg-yellow-100 text-yellow-800"
  }

  return (
    <Card className="mt-8 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <CardTitle className="flex items-center justify-between">
          <span>Resultado do Rastreamento</span>
          <span className={`rounded-full bg-white px-3 py-1 text-xs font-medium ${getStatusClass()}`}>
            {shipment.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-gray-50 p-6">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
            {getStatusIcon()}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{shipment.status}</h2>
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Código de Rastreio</h3>
              <p className="text-lg font-mono text-red-600">{shipment.trackingCode}</p>
            </div>
          </div>
        </div>

        {/* Timeline de rastreamento */}
        <div className="p-6">
          <h3 className="mb-6 text-xl font-bold text-gray-800">Acompanhamento da Entrega</h3>
          <TrackingTimeline shipment={shipment} />
        </div>

        <div className="border-t border-gray-200 bg-white p-6">
          <h3 className="mb-6 text-xl font-bold text-gray-800">Detalhes da Remessa</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-3 shadow-sm transition-all hover:shadow-md">
              <div className="mb-2 flex items-center">
                <User className="mr-2 h-4 w-4 text-red-600" />
                <h4 className="text-xs font-semibold uppercase text-gray-500">Remetente</h4>
              </div>
              <p className="mb-1 font-medium">{shipment.senderName}</p>
              <div className="flex items-start">
                <MapPinned className="mr-2 mt-1 h-3 w-3 text-gray-400" />
                <p className="text-sm text-gray-600">{shipment.originAddress}</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3 shadow-sm transition-all hover:shadow-md">
              <div className="mb-2 flex items-center">
                <User className="mr-2 h-4 w-4 text-red-600" />
                <h4 className="text-xs font-semibold uppercase text-gray-500">Destinatário</h4>
              </div>
              <p className="mb-1 font-medium">{shipment.recipientName}</p>
              <p className="mb-1 text-sm text-gray-600">CPF: {shipment.recipientCpf}</p>
              <div className="flex items-start">
                <MapPinned className="mr-2 mt-1 h-3 w-3 text-gray-400" />
                <p className="text-sm text-gray-600">{shipment.destinationAddress}</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3 shadow-sm transition-all hover:shadow-md">
              <div className="mb-2 flex items-center">
                <ShoppingBag className="mr-2 h-4 w-4 text-red-600" />
                <h4 className="text-xs font-semibold uppercase text-gray-500">Produto</h4>
              </div>
              <p className="mb-1 text-sm text-gray-600">Tipo: {shipment.productType}</p>
              <div className="flex items-center">
                <Scale className="mr-2 h-3 w-3 text-gray-400" />
                <p className="text-sm text-gray-600">Peso: {shipment.weight} kg</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3 shadow-sm transition-all hover:shadow-md">
              <div className="mb-2 flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-red-600" />
                <h4 className="text-xs font-semibold uppercase text-gray-500">Data de Envio</h4>
              </div>
              <p className="text-sm text-gray-600">{shipment.shipDate}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
