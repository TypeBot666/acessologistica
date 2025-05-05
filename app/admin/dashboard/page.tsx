"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShipmentForm } from "@/components/shipment-form"
import { ShipmentList } from "@/components/shipment-list"
import { Truck, LogOut, FileJson, Loader2, RefreshCw } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import type { Shipment } from "@/lib/types"
import Link from "next/link"

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin-auth")
    if (isAuthenticated !== "true") {
      router.push("/admin")
      return
    }

    // Fetch shipments from Supabase
    fetchShipments()
  }, [router])

  const fetchShipments = async () => {
    try {
      setLoading(true)
      console.log("Iniciando busca de remessas...")

      const { data, error } = await supabase.from("shipments").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Erro detalhado ao buscar remessas:", error)
        throw error
      }

      console.log(`Remessas encontradas: ${data?.length || 0}`)

      // Convert from database format to frontend format
      const formattedShipments = data.map((item) => ({
        trackingCode: item.tracking_code,
        senderName: item.sender_name,
        recipientName: item.recipient_name,
        recipientCpf: item.recipient_cpf,
        originAddress: item.origin_address,
        destinationAddress: item.destination_address,
        productType: item.product_type,
        weight: item.weight,
        shipDate: item.ship_date,
        status: item.status as "Aguardando" | "Em trânsito" | "Entregue",
      }))

      setShipments(formattedShipments)
    } catch (error) {
      console.error("Erro completo ao buscar remessas:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar remessas. Verifique a conexão com o banco de dados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin-auth")
    router.push("/admin")
  }

  const handleAddShipment = async (shipment: Shipment) => {
    try {
      console.log("Iniciando cadastro de remessa com dados:", JSON.stringify(shipment, null, 2))

      // Verificar se todos os campos obrigatórios estão preenchidos
      const requiredFields = [
        "senderName",
        "recipientName",
        "recipientCpf",
        "originAddress",
        "destinationAddress",
        "productType",
        "weight",
        "shipDate",
      ]

      for (const field of requiredFields) {
        if (!shipment[field as keyof Shipment]) {
          throw new Error(`Campo obrigatório não preenchido: ${field}`)
        }
      }

      // Gerar código de rastreio se não existir
      if (!shipment.trackingCode) {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const dateStr = `${year}${month}${day}`
        const random = Math.floor(1000 + Math.random() * 9000)
        shipment.trackingCode = `LOG-${dateStr}-${random}`
      }

      // Abordagem simplificada - Criar objeto diretamente com os campos do banco
      const shipmentData = {
        tracking_code: shipment.trackingCode,
        sender_name: shipment.senderName,
        recipient_name: shipment.recipientName,
        recipient_cpf: shipment.recipientCpf,
        origin_address: shipment.originAddress,
        destination_address: shipment.destinationAddress,
        product_type: shipment.productType,
        weight: Number(shipment.weight) || 0,
        ship_date: shipment.shipDate,
        status: shipment.status || "Aguardando",
      }

      console.log("Dados formatados para inserção:", JSON.stringify(shipmentData, null, 2))

      // Inserção direta sem .select()
      const result = await supabase.from("shipments").insert(shipmentData)

      console.log("Resultado da inserção:", result)

      if (result.error) {
        console.error("Erro detalhado da inserção:", result.error)
        throw new Error(`Erro ao inserir: ${result.error.message}`)
      }

      console.log("Remessa cadastrada com sucesso!")

      // Adicionar ao histórico de status - simplificado
      const historyResult = await supabase.from("status_history").insert({
        tracking_code: shipment.trackingCode,
        status: shipment.status || "Aguardando",
        notes: "Remessa cadastrada",
      })

      if (historyResult.error) {
        console.warn("Aviso: Erro ao adicionar histórico de status:", historyResult.error)
      }

      // Atualizar lista de remessas
      await fetchShipments()

      toast({
        title: "Sucesso",
        description: "Remessa cadastrada com sucesso!",
      })
    } catch (error: any) {
      console.error("Erro completo ao adicionar remessa:", error)
      toast({
        title: "Erro",
        description: `Falha ao cadastrar remessa: ${error.message || "Erro desconhecido"}`,
        variant: "destructive",
      })
    }
  }

  const handleUpdateShipment = async (updatedShipment: Shipment) => {
    try {
      // Abordagem simplificada
      const shipmentData = {
        sender_name: updatedShipment.senderName,
        recipient_name: updatedShipment.recipientName,
        recipient_cpf: updatedShipment.recipientCpf,
        origin_address: updatedShipment.originAddress,
        destination_address: updatedShipment.destinationAddress,
        product_type: updatedShipment.productType,
        weight: Number(updatedShipment.weight) || 0,
        ship_date: updatedShipment.shipDate,
        status: updatedShipment.status,
      }

      const result = await supabase
        .from("shipments")
        .update(shipmentData)
        .eq("tracking_code", updatedShipment.trackingCode)

      if (result.error) {
        throw new Error(`Erro ao atualizar: ${result.error.message}`)
      }

      // Refresh shipments list
      await fetchShipments()

      toast({
        title: "Sucesso",
        description: "Remessa atualizada com sucesso!",
      })
    } catch (error: any) {
      console.error("Error updating shipment:", error)
      toast({
        title: "Erro",
        description: `Falha ao atualizar remessa: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (trackingCode: string, newStatus: string) => {
    try {
      const result = await supabase.from("shipments").update({ status: newStatus }).eq("tracking_code", trackingCode)

      if (result.error) {
        throw new Error(`Erro ao atualizar status: ${result.error.message}`)
      }

      // Add to status history
      await supabase.from("status_history").insert({
        tracking_code: trackingCode,
        status: newStatus,
        notes: `Status atualizado para ${newStatus}`,
      })

      // Refresh shipments list
      await fetchShipments()

      toast({
        title: "Sucesso",
        description: `Status atualizado para ${newStatus}!`,
      })
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: "Erro",
        description: `Falha ao atualizar status: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const exportToJson = () => {
    const dataStr = JSON.stringify(shipments, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `remessas-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const importFromJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader()
    if (event.target.files && event.target.files.length > 0) {
      fileReader.readAsText(event.target.files[0], "UTF-8")
      fileReader.onload = async (e) => {
        if (e.target?.result) {
          try {
            const importedShipments = JSON.parse(e.target.result as string) as Shipment[]

            // Abordagem simplificada
            for (const shipment of importedShipments) {
              const shipmentData = {
                tracking_code: shipment.trackingCode,
                sender_name: shipment.senderName,
                recipient_name: shipment.recipientName,
                recipient_cpf: shipment.recipientCpf,
                origin_address: shipment.originAddress,
                destination_address: shipment.destinationAddress,
                product_type: shipment.productType,
                weight: Number(shipment.weight) || 0,
                ship_date: shipment.shipDate,
                status: shipment.status,
              }

              await supabase.from("shipments").upsert(shipmentData, { onConflict: "tracking_code" })
            }

            // Refresh shipments list
            await fetchShipments()

            toast({
              title: "Sucesso",
              description: "Remessas importadas com sucesso!",
            })
          } catch (error: any) {
            console.error("Error importing shipments:", error)
            toast({
              title: "Erro",
              description: `Falha ao importar remessas: ${error.message}`,
              variant: "destructive",
            })
          }
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <Truck className="mr-2 h-6 w-6 text-red-600" />
            <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={exportToJson}>
                <FileJson className="mr-2 h-4 w-4" />
                Exportar JSON
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importFromJson}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Button variant="outline">
                  <FileJson className="mr-2 h-4 w-4" />
                  Importar JSON
                </Button>
              </div>
              <Link href="/admin/integracoes">
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Integrações
                </Button>
              </Link>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            <span className="ml-2 text-lg">Carregando remessas...</span>
          </div>
        ) : (
          <Tabs defaultValue="list">
            <TabsList className="mb-8 grid w-full grid-cols-2">
              <TabsTrigger value="list">Listar Remessas</TabsTrigger>
              <TabsTrigger value="add">Cadastrar Remessa</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <ShipmentList
                shipments={shipments}
                onUpdateShipment={handleUpdateShipment}
                onUpdateStatus={handleUpdateStatus}
              />
            </TabsContent>

            <TabsContent value="add">
              <ShipmentForm onAddShipment={handleAddShipment} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
