"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import type { Shipment } from "@/lib/types"
import { ShipmentList } from "@/components/shipment-list"
import { ShipmentForm } from "@/components/shipment-form"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = createClientSupabaseClient()
  const [stats, setStats] = useState({
    total: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0,
  })

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
        status: item.status as any,
      }))

      setShipments(formattedShipments)

      // Calculate stats
      const total = formattedShipments.length
      const inTransit = formattedShipments.filter(
        (s) => s.status.includes("trânsito") || s.status.includes("rota") || s.status.includes("triagem"),
      ).length
      const delivered = formattedShipments.filter((s) => s.status.includes("Entregue")).length
      const pending = formattedShipments.filter(
        (s) => s.status.includes("postado") || s.status.includes("Aguardando"),
      ).length

      setStats({
        total,
        inTransit,
        delivered,
        pending,
      })
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
        status: shipment.status || "Objeto postado",
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
        status: shipment.status || "Objeto postado",
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
        notes: "Status atualizado",
      })

      // Refresh shipments list
      await fetchShipments()

      toast({
        title: "Sucesso",
        description: "Status da remessa atualizado com sucesso!",
      })
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: "Erro",
        description: `Falha ao atualizar o status da remessa: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteMultiple = async (trackingCodes: string[]) => {
    try {
      setLoading(true)
      const response = await fetch("/api/shipments/delete-multiple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackingCodes }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao excluir remessas")
      }

      toast({
        title: "Sucesso",
        description: `${trackingCodes.length} remessas excluídas com sucesso!`,
      })

      // Atualizar a lista de remessas
      fetchShipments()
    } catch (error) {
      console.error("Erro ao excluir remessas:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir remessas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} onLogout={handleLogout} />

      <div className="flex">
        <AdminSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Painel de Controle</h1>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              <span className="ml-2 text-lg">Carregando dados...</span>
            </div>
          ) : (
            <>
              <DashboardStats stats={stats} />

              <div className="mt-8">
                <Tabs defaultValue="shipments">
                  <TabsList className="mb-4">
                    <TabsTrigger value="shipments">Remessas</TabsTrigger>
                    <TabsTrigger value="new">Nova Remessa</TabsTrigger>
                  </TabsList>

                  <TabsContent value="shipments">
                    <ShipmentList
                      shipments={shipments}
                      onUpdateShipment={handleUpdateShipment}
                      onUpdateStatus={handleUpdateStatus}
                      onDeleteMultiple={handleDeleteMultiple}
                    />
                  </TabsContent>

                  <TabsContent value="new">
                    <ShipmentForm onAddShipment={handleAddShipment} />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
