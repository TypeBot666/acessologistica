"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Mail,
  Info,
  Trash2,
  Edit,
} from "lucide-react"
import { PedidoDetailsModal } from "@/components/pedido-details-modal"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function PedidosPage() {
  const { toast } = useToast()
  const [pedidos, setPedidos] = useState<any[]>([])
  const [filteredPedidos, setFilteredPedidos] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("todos")
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [sendingTestEmail, setSendingTestEmail] = useState<string | null>(null)
  const [selectedPedidos, setSelectedPedidos] = useState<string[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState("")
  const [updatingBulkStatus, setUpdatingBulkStatus] = useState(false)

  // Lista de todos os status possíveis
  const allStatuses = [
    "Objeto postado",
    "Em processo de triagem",
    "Em trânsito para o centro de distribuição",
    "No centro de distribuição",
    "Em rota de entrega",
    "Entregue com sucesso",
    "Entrega não realizada – destinatário ausente",
    "Objeto devolvido ao remetente",
    "Aguardando retirada em unidade",
  ]

  useEffect(() => {
    fetchPedidos()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = pedidos.filter(
        (pedido) =>
          pedido.tracking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pedido.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pedido.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (pedido.customer_email && pedido.customer_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (pedido.order_id && pedido.order_id.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredPedidos(filtered)
    } else {
      filterByTab(activeTab)
    }
  }, [searchTerm, pedidos])

  const fetchPedidos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/shipments")
      if (!response.ok) {
        throw new Error("Erro ao buscar pedidos")
      }
      const data = await response.json()

      // Calcular dias restantes para cada pedido
      const pedidosComPrazo = data.map((pedido: any) => {
        const prazoData = pedido.prazo_personalizado || pedido.prazo_estimado
        let diasRestantes = null

        if (prazoData) {
          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)
          const dataPrazo = new Date(prazoData)
          dataPrazo.setHours(0, 0, 0, 0)
          const diffTime = dataPrazo.getTime() - hoje.getTime()
          diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }

        return {
          ...pedido,
          dias_restantes: diasRestantes,
        }
      })

      setPedidos(pedidosComPrazo)
      filterByTab(activeTab)
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterByTab = (tab: string) => {
    if (tab === "todos") {
      setFilteredPedidos(pedidos)
    } else if (tab === "pendentes") {
      const pendentes = pedidos.filter(
        (pedido) =>
          !pedido.status.includes("Entregue") &&
          !pedido.status.includes("devolvido") &&
          !pedido.status.includes("cancelado"),
      )
      setFilteredPedidos(pendentes)
    } else if (tab === "entregues") {
      const entregues = pedidos.filter((pedido) => pedido.status.includes("Entregue"))
      setFilteredPedidos(entregues)
    } else if (tab === "problemas") {
      const problemas = pedidos.filter(
        (pedido) =>
          pedido.status.includes("ausente") ||
          pedido.status.includes("devolvido") ||
          pedido.status.includes("cancelado") ||
          (pedido.dias_restantes !== null && pedido.dias_restantes < 0),
      )
      setFilteredPedidos(problemas)
    } else if (tab === "sem-email") {
      const semEmail = pedidos.filter((pedido) => !pedido.customer_email)
      setFilteredPedidos(semEmail)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchTerm("")
    filterByTab(tab)
  }

  const handleStatusChange = async (trackingCode: string, newStatus: string) => {
    try {
      setUpdatingStatus(trackingCode)

      const response = await fetch("/api/shipments/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackingCode,
          newStatus,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar status")
      }

      const result = await response.json()

      // Atualizar o pedido na lista
      setPedidos((prevPedidos) =>
        prevPedidos.map((pedido) =>
          pedido.tracking_code === trackingCode ? { ...pedido, status: newStatus } : pedido,
        ),
      )

      // Mostrar mensagem de sucesso
      toast({
        title: "Status atualizado",
        description: result.emailSent
          ? "Status atualizado e email enviado com sucesso"
          : "Status atualizado, mas não foi possível enviar email",
        variant: result.emailSent ? "default" : "destructive",
      })

      // Atualizar o pedido selecionado se estiver aberto
      if (selectedPedido && selectedPedido.tracking_code === trackingCode) {
        setSelectedPedido({ ...selectedPedido, status: newStatus })
      }

      // Recarregar a lista de pedidos
      fetchPedidos()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar status",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleBulkStatusUpdate = async () => {
    if (selectedPedidos.length === 0 || !bulkStatus) return

    try {
      setUpdatingBulkStatus(true)

      // Criar um array de promessas para atualizar cada pedido
      const updatePromises = selectedPedidos.map((trackingCode) =>
        fetch("/api/shipments/update-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trackingCode,
            newStatus: bulkStatus,
          }),
        }),
      )

      // Executar todas as promessas
      const results = await Promise.allSettled(updatePromises)

      // Contar sucessos e falhas
      const successful = results.filter((result) => result.status === "fulfilled").length
      const failed = results.length - successful

      // Mostrar mensagem de sucesso
      toast({
        title: "Status atualizados em massa",
        description: `${successful} pedidos atualizados com sucesso. ${failed} falhas.`,
        variant: failed > 0 ? "destructive" : "default",
      })

      // Fechar o modal e limpar o estado
      setIsBulkStatusModalOpen(false)
      setBulkStatus("")

      // Recarregar a lista de pedidos
      fetchPedidos()
    } catch (error) {
      console.error("Erro ao atualizar status em massa:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar status em massa",
        variant: "destructive",
      })
    } finally {
      setUpdatingBulkStatus(false)
    }
  }

  const handleTestEmail = async (trackingCode: string) => {
    try {
      setSendingTestEmail(trackingCode)

      const response = await fetch("/api/test-status-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackingCode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao enviar email de teste")
      }

      const result = await response.json()

      toast({
        title: "Email de teste enviado",
        description: `Email enviado com sucesso para ${result.email}`,
      })
    } catch (error) {
      console.error("Erro ao enviar email de teste:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar email de teste",
        variant: "destructive",
      })
    } finally {
      setSendingTestEmail(null)
    }
  }

  const handleBatchUpdate = async () => {
    try {
      const response = await fetch("/api/run-automation", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao executar atualização em lote")
      }

      const result = await response.json()

      toast({
        title: "Atualização em lote concluída",
        description: `${result.updatedCount} pedidos atualizados, ${result.emailsSent} emails enviados`,
      })

      // Recarregar a lista de pedidos
      fetchPedidos()
    } catch (error) {
      console.error("Erro ao executar atualização em lote:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao executar atualização em lote",
        variant: "destructive",
      })
    }
  }

  const toggleSelectPedido = (trackingCode: string) => {
    setSelectedPedidos((prev) => {
      if (prev.includes(trackingCode)) {
        return prev.filter((code) => code !== trackingCode)
      } else {
        return [...prev, trackingCode]
      }
    })
  }

  const toggleSelectAll = () => {
    if (selectedPedidos.length === filteredPedidos.length) {
      setSelectedPedidos([])
    } else {
      setSelectedPedidos(filteredPedidos.map((pedido) => pedido.tracking_code))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedPedidos.length === 0) return

    if (!confirm(`Tem certeza que deseja excluir ${selectedPedidos.length} pedidos?`)) {
      return
    }

    try {
      const response = await fetch("/api/shipments/delete-multiple", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackingCodes: selectedPedidos,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao excluir pedidos")
      }

      toast({
        title: "Pedidos excluídos",
        description: `${selectedPedidos.length} pedidos foram excluídos com sucesso`,
      })

      setSelectedPedidos([])
      fetchPedidos()
    } catch (error) {
      console.error("Erro ao excluir pedidos:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir pedidos",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    if (status?.includes("Entregue")) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status?.includes("devolvido")) return <XCircle className="h-4 w-4 text-red-500" />
    if (status?.includes("ausente")) return <AlertTriangle className="h-4 w-4 text-orange-500" />
    if (status?.includes("Aguardando")) return <Clock className="h-4 w-4 text-purple-500" />
    if (status?.includes("trânsito")) return <Truck className="h-4 w-4 text-blue-500" />
    if (status?.includes("rota")) return <Truck className="h-4 w-4 text-blue-500" />
    if (status?.includes("centro")) return <MapPin className="h-4 w-4 text-blue-500" />
    if (status?.includes("triagem")) return <RefreshCw className="h-4 w-4 text-blue-500" />
    return <Package className="h-4 w-4 text-yellow-500" />
  }

  const openDetailsModal = (pedido: any) => {
    setSelectedPedido(pedido)
    setIsDetailsModalOpen(true)
  }

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedPedido(null)
  }

  const openBulkStatusModal = () => {
    if (selectedPedidos.length === 0) {
      toast({
        title: "Nenhum pedido selecionado",
        description: "Selecione pelo menos um pedido para atualizar o status",
        variant: "destructive",
      })
      return
    }
    setIsBulkStatusModalOpen(true)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h1 className="text-2xl font-bold mb-4 md:mb-0">Gerenciamento de Pedidos</h1>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={fetchPedidos} variant="outline" className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button onClick={handleBatchUpdate} variant="default" className="flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  Executar Automação
                </Button>
                {selectedPedidos.length > 0 && (
                  <>
                    <Button onClick={openBulkStatusModal} variant="outline" className="flex items-center">
                      <Edit className="h-4 w-4 mr-2" />
                      Atualizar Status ({selectedPedidos.length})
                    </Button>
                    <Button onClick={handleDeleteSelected} variant="destructive" className="flex items-center">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir ({selectedPedidos.length})
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por código, nome, status ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
              <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <TabsTrigger value="todos" className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  <span>Todos</span>
                </TabsTrigger>
                <TabsTrigger value="pendentes" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Pendentes</span>
                </TabsTrigger>
                <TabsTrigger value="entregues" className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Entregues</span>
                </TabsTrigger>
                <TabsTrigger value="problemas" className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>Problemas</span>
                </TabsTrigger>
                <TabsTrigger value="sem-email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>Sem Email</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="todos" className="mt-4">
                {renderPedidosTable()}
              </TabsContent>
              <TabsContent value="pendentes" className="mt-4">
                {renderPedidosTable()}
              </TabsContent>
              <TabsContent value="entregues" className="mt-4">
                {renderPedidosTable()}
              </TabsContent>
              <TabsContent value="problemas" className="mt-4">
                {renderPedidosTable()}
              </TabsContent>
              <TabsContent value="sem-email" className="mt-4">
                {renderPedidosTable()}
              </TabsContent>
            </Tabs>

            {selectedPedido && (
              <PedidoDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={closeDetailsModal}
                pedido={selectedPedido}
                onStatusChange={handleStatusChange}
                onTestEmail={handleTestEmail}
                allStatuses={allStatuses}
                getStatusIcon={getStatusIcon}
                updatingStatus={updatingStatus}
              />
            )}

            <Dialog open={isBulkStatusModalOpen} onOpenChange={setIsBulkStatusModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Atualizar Status em Massa</DialogTitle>
                  <DialogDescription>
                    Selecione o novo status para os {selectedPedidos.length} pedidos selecionados.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <Select value={bulkStatus} onValueChange={setBulkStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o novo status" />
                    </SelectTrigger>
                    <SelectContent>
                      {allStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center">
                            {getStatusIcon(status)}
                            <span className="ml-2">{status}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBulkStatusModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleBulkStatusUpdate} disabled={updatingBulkStatus || !bulkStatus}>
                    {updatingBulkStatus ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      "Atualizar"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )

  function renderPedidosTable() {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <span className="ml-2">Carregando pedidos...</span>
        </div>
      )
    }

    if (filteredPedidos.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum pedido encontrado</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm ? "Nenhum pedido corresponde aos critérios de busca." : "Não há pedidos nesta categoria."}
          </p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-2 text-left">
                <Checkbox
                  checked={selectedPedidos.length === filteredPedidos.length && filteredPedidos.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todos"
                />
              </th>
              <th className="px-4 py-2 text-left">Código</th>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPedidos.map((pedido) => (
              <tr key={pedido.tracking_code} className="border-b hover:bg-gray-50">
                <td className="px-2 py-2">
                  <Checkbox
                    checked={selectedPedidos.includes(pedido.tracking_code)}
                    onCheckedChange={() => toggleSelectPedido(pedido.tracking_code)}
                    aria-label={`Selecionar pedido ${pedido.tracking_code}`}
                  />
                </td>
                <td className="px-4 py-2 font-mono text-sm">{pedido.tracking_code}</td>
                <td className="px-4 py-2">{pedido.recipient_name}</td>
                <td className="px-4 py-2">
                  {pedido.customer_email ? (
                    <span className="text-sm">{pedido.customer_email}</span>
                  ) : (
                    <span className="text-sm text-red-500">Não cadastrado</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center">
                    {getStatusIcon(pedido.status)}
                    <span className="ml-2">{pedido.status}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-sm">{new Date(pedido.updated_at).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDetailsModal(pedido)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Detalhes
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
}
