"use client"

import { useState, useEffect } from "react"
import { Package, Truck, CheckCircle, MapPin, Scan, Warehouse, AlertTriangle, PackageX, Clock } from "lucide-react"
import type { Shipment, StatusHistory } from "@/lib/types"
import { createClientSupabaseClient } from "@/lib/supabase/client"

interface TrackingTimelineProps {
  shipment: Shipment
}

export function TrackingTimeline({ shipment }: TrackingTimelineProps) {
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    const fetchStatusHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("status_history")
          .select("*")
          .eq("tracking_code", shipment.trackingCode)
          .order("created_at", { ascending: true })

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

  // Definir os passos principais do processo de entrega (6 etapas)
  const mainSteps = [
    {
      id: "postado",
      label: "Objeto Postado",
      icon: <Package className="h-4 w-4 sm:h-5 sm:w-5" />,
      date: "",
      status: "Postado",
      description: "Seu pacote foi postado e está aguardando coleta",
    },
    {
      id: "triagem",
      label: "Em Triagem",
      icon: <Scan className="h-4 w-4 sm:h-5 sm:w-5" />,
      date: "",
      status: "Em triagem",
      description: "Seu pacote está sendo processado no centro de triagem",
    },
    {
      id: "transito",
      label: "Em Trânsito",
      icon: <Truck className="h-4 w-4 sm:h-5 sm:w-5" />,
      date: "",
      status: "Em trânsito",
      description: "Seu pacote está a caminho do centro de distribuição",
    },
    {
      id: "centro",
      label: "No Centro de Distribuição",
      icon: <Warehouse className="h-4 w-4 sm:h-5 sm:w-5" />,
      date: "",
      status: "No centro",
      description: "Seu pacote chegou ao centro de distribuição",
    },
    {
      id: "rota",
      label: "Em Rota de Entrega",
      icon: <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />,
      date: "",
      status: "Em rota",
      description: "Seu pacote está a caminho do endereço de entrega",
    },
    {
      id: "entregue",
      label: "Entregue",
      icon: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
      date: "",
      status: "Entregue",
      description: "Seu pacote foi entregue com sucesso",
    },
  ]

  // Status alternativos que não fazem parte do fluxo principal
  const alternativeStatuses = [
    {
      id: "ausente",
      label: "Destinatário Ausente",
      icon: <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />,
      status: "Destinatário ausente",
      description: "Tentativa de entrega realizada, mas o destinatário estava ausente",
    },
    {
      id: "devolvido",
      label: "Devolvido ao Remetente",
      icon: <PackageX className="h-4 w-4 sm:h-5 sm:w-5" />,
      status: "Devolvido",
      description: "O pacote foi devolvido ao remetente",
    },
    {
      id: "aguardando",
      label: "Aguardando Retirada",
      icon: <Clock className="h-4 w-4 sm:h-5 sm:w-5" />,
      status: "Aguardando retirada",
      description: "O pacote está disponível para retirada em uma unidade",
    },
  ]

  // Atualizar as datas com base no histórico de status
  if (statusHistory.length > 0) {
    statusHistory.forEach((status) => {
      const matchingMainStep = mainSteps.find(
        (step) => status.status.includes(step.status) || step.status.includes(status.status),
      )
      if (matchingMainStep) {
        matchingMainStep.date =
          new Date(status.created_at).toLocaleDateString("pt-BR") +
          " " +
          new Date(status.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }
    })
  }

  // Determinar o passo atual com base no status da remessa
  const currentStepIndex = mainSteps.findIndex(
    (step) => shipment.status.includes(step.status) || step.status.includes(shipment.status),
  )

  // Calcular a porcentagem de progresso para a barra
  // Se for o último passo, 100%. Caso contrário, calcular proporcionalmente
  const progressPercentage =
    currentStepIndex >= 0 ? Math.min(100, ((currentStepIndex + 1) / mainSteps.length) * 100) : 0

  // Verificar se o status atual é um dos alternativos
  const isAlternativeStatus = alternativeStatuses.some(
    (step) => shipment.status.includes(step.status) || step.status.includes(shipment.status),
  )

  // Encontrar o status alternativo atual, se aplicável
  const currentAlternativeStatus = alternativeStatuses.find(
    (step) => shipment.status.includes(step.status) || step.status.includes(shipment.status),
  )

  // Função para obter o status completo para exibição
  function getFullStatusDisplay(shortStatus: string): string {
    const mainStep = mainSteps.find((step) => step.status === shortStatus)
    if (mainStep) return mainStep.label

    const altStep = alternativeStatuses.find((step) => step.status === shortStatus)
    if (altStep) return altStep.label

    return shortStatus
  }

  return (
    <div className="mt-4 sm:mt-8">
      {/* Timeline principal - sempre mostra as 6 etapas principais */}
      <div className="relative mb-8 sm:mb-12 px-2 sm:px-4">
        {/* Barra de progresso - container */}
        <div className="absolute left-0 top-[32px] sm:top-[40px] h-1 sm:h-2 w-full rounded-full bg-gray-200">
          {/* Barra de progresso - preenchimento */}
          <div
            className="h-full rounded-full bg-red-600 transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* Ícones e etapas */}
        <div className="relative flex justify-between">
          {mainSteps.map((step, index) => {
            // Determinar se este passo está completo, ativo ou pendente
            let stepStatus = "pending"
            if (index < currentStepIndex || (index === currentStepIndex && !isAlternativeStatus)) {
              stepStatus = "completed"
            } else if (index === currentStepIndex) {
              stepStatus = "active"
            }

            return (
              <div key={step.id} className="flex flex-col items-center px-0 sm:px-1">
                <div
                  className={`z-10 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 shadow-md transition-all duration-300 ${
                    stepStatus === "completed"
                      ? "border-red-600 bg-red-600 text-white"
                      : stepStatus === "active"
                        ? "border-red-600 bg-white text-red-600"
                        : "border-gray-300 bg-gray-100 text-gray-400"
                  }`}
                >
                  {step.icon}
                </div>
                <p
                  className={`mt-2 max-w-[60px] sm:max-w-[80px] text-center text-[10px] sm:text-xs font-medium ${
                    stepStatus === "pending" ? "text-gray-500" : "text-gray-900"
                  }`}
                >
                  {step.label}
                </p>
                {step.date && <p className="mt-1 text-center text-[8px] sm:text-xs text-gray-500">{step.date}</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Status alternativo (se aplicável) */}
      {isAlternativeStatus && currentAlternativeStatus && (
        <div className="mb-4 sm:mb-6 rounded-lg border border-orange-200 bg-orange-50 p-3 sm:p-4">
          <div className="flex items-center">
            <div className="mr-3 sm:mr-4 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              {currentAlternativeStatus.icon}
            </div>
            <div>
              <h4 className="text-sm sm:font-medium text-orange-800">{currentAlternativeStatus.label}</h4>
              <p className="text-xs sm:text-sm text-orange-700">{currentAlternativeStatus.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status atual - Destaque */}
      <div className="mb-4 sm:mb-6 rounded-lg bg-red-600 p-3 sm:p-4 text-white shadow-md">
        <h3 className="mb-2 text-sm sm:font-medium text-white">Status Atual</h3>
        <div className="flex items-center">
          <div className="mr-3 sm:mr-4 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white text-red-600 shadow-md">
            {isAlternativeStatus && currentAlternativeStatus
              ? currentAlternativeStatus.icon
              : currentStepIndex >= 0
                ? mainSteps[currentStepIndex].icon
                : mainSteps[0].icon}
          </div>
          <div>
            <p className="text-sm sm:font-medium text-white">{getFullStatusDisplay(shipment.status)}</p>
            <p className="text-xs sm:text-sm text-red-100">
              {statusHistory.length > 0 && statusHistory[statusHistory.length - 1].created_at && (
                <>
                  Atualizado em{" "}
                  {new Date(statusHistory[statusHistory.length - 1].created_at).toLocaleDateString("pt-BR")} às{" "}
                  {new Date(statusHistory[statusHistory.length - 1].created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de detalhes */}
      {statusHistory.length > 0 && (
        <div className="mt-6 sm:mt-8 overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Data/Hora
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Local
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Observações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {statusHistory.map((status) => (
                  <tr key={status.id}>
                    <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-900">
                      {new Date(status.created_at).toLocaleDateString("pt-BR")}{" "}
                      {new Date(status.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-900">
                      {getLocationByStatus(status.status)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] sm:text-xs font-medium ${getStatusColor(status.status)}`}
                      >
                        {status.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-500">
                      {status.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Função auxiliar para obter a localização com base no status
function getLocationByStatus(status: string): string {
  const statusLower = status.toLowerCase()

  if (statusLower.includes("postado")) {
    return "AGÊNCIA DOS CORREIOS"
  }

  if (statusLower.includes("triagem")) {
    return "CENTRO DE TRIAGEM"
  }

  if (statusLower.includes("trânsito")) {
    return "EM ROTA"
  }

  if (statusLower.includes("centro")) {
    return "CENTRO DE DISTRIBUIÇÃO"
  }

  if (statusLower.includes("rota")) {
    return "EM ROTA DE ENTREGA"
  }

  if (statusLower.includes("entregue") || statusLower.includes("ausente")) {
    return "ENDEREÇO DE ENTREGA"
  }

  if (statusLower.includes("devolvido")) {
    return "CENTRO DE DISTRIBUIÇÃO"
  }

  if (statusLower.includes("aguardando")) {
    return "AGÊNCIA DOS CORREIOS"
  }

  return "SISTEMA"
}

// Função auxiliar para obter a cor do status
function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase()

  if (statusLower.includes("entregue")) {
    return "bg-green-100 text-green-800"
  }

  if (statusLower.includes("devolvido")) {
    return "bg-red-100 text-red-800"
  }

  if (statusLower.includes("ausente")) {
    return "bg-orange-100 text-orange-800"
  }

  if (statusLower.includes("aguardando")) {
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
