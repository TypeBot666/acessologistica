"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Mail, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

interface PedidoDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  pedido: any | null
  onStatusChange: (trackingCode: string, newStatus: string) => Promise<void>
  onTestEmail: (trackingCode: string) => Promise<void>
  allStatuses: string[]
  getStatusIcon: (status: string) => JSX.Element
  updatingStatus: string | null
}

export function PedidoDetailsModal({
  isOpen,
  onClose,
  pedido,
  onStatusChange,
  onTestEmail,
  allStatuses,
  getStatusIcon,
  updatingStatus,
}: PedidoDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("info")
  const [statusHistory, setStatusHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && pedido) {
      fetchStatusHistory(pedido.tracking_code)
      setSelectedStatus(pedido.status)
    }
  }, [isOpen, pedido])

  const fetchStatusHistory = async (trackingCode: string) => {
    try {
      setLoadingHistory(true)
      const response = await fetch(`/api/shipments/history?trackingCode=${trackingCode}`)

      if (!response.ok) {
        throw new Error("Falha ao buscar histórico")
      }

      const data = await response.json()
      setStatusHistory(data.data || [])
    } catch (error) {
      console.error("Erro ao buscar histórico:", error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleStatusChange = async () => {
    if (selectedStatus && selectedStatus !== pedido.status) {
      try {
        await onStatusChange(pedido.tracking_code, selectedStatus)
        toast({
          title: "Status atualizado",
          description: `O status foi alterado para "${selectedStatus}"`,
        })
      } catch (error) {
        console.error("Erro ao atualizar status:", error)
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o status",
          variant: "destructive",
        })
      }
    }
  }

  const handleTestEmail = async () => {
    try {
      await onTestEmail(pedido.tracking_code)
      toast({
        title: "Email enviado",
        description: "O email de teste foi enviado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email de teste",
        variant: "destructive",
      })
    }
  }

  if (!pedido) return null

  const prazoData = pedido.prazo_personalizado || pedido.prazo_estimado
  const isPrazoPersonalizado = !!pedido.prazo_personalizado

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    if (status?.includes("Entregue")) return "bg-green-100 text-green-800"
    if (status?.includes("devolvido")) return "bg-red-100 text-red-800"
    if (status?.includes("ausente")) return "bg-orange-100 text-orange-800"
    if (status?.includes("Aguardando")) return "bg-purple-100 text-purple-800"
    if (
      status?.includes("trânsito") ||
      status?.includes("rota") ||
      status?.includes("centro") ||
      status?.includes("triagem")
    )
      return "bg-blue-100 text-blue-800"
    return "bg-yellow-100 text-yellow-800"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Detalhes do Pedido</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">Código de Rastreio</h2>
              <p className="font-mono text-sm">{pedido.tracking_code}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <h2 className="text-lg font-bold">Status Atual</h2>
              <div className="flex items-center gap-2">
                {updatingStatus === pedido.tracking_code ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Atualizando...</span>
                  </div>
                ) : (
                  <>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue />
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
                    <Button onClick={handleStatusChange} disabled={selectedStatus === pedido.status} size="sm">
                      Atualizar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="delivery">Entrega</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Informações do Cliente</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm">
                      <span className="font-medium">Nome:</span> {pedido.recipient_name}
                    </p>
                    {pedido.recipient_cpf && (
                      <p className="text-sm">
                        <span className="font-medium">CPF:</span> {pedido.recipient_cpf}
                      </p>
                    )}
                    {pedido.customer_email && (
                      <p className="text-sm">
                        <span className="font-medium">Email:</span> {pedido.customer_email}
                      </p>
                    )}
                    {pedido.customer_phone && (
                      <p className="text-sm">
                        <span className="font-medium">Telefone:</span> {pedido.customer_phone}
                      </p>
                    )}
                    {!pedido.customer_email && (
                      <p className="text-sm text-red-500 font-medium">
                        Email não cadastrado! Não será possível enviar notificações.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Informações do Remetente</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm">
                      <span className="font-medium">Nome:</span> {pedido.sender_name || "Não informado"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Endereço:</span> {pedido.origin_address || "Não informado"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Informações do Produto</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm">
                      <span className="font-medium">Tipo:</span> {pedido.product_type || "Não informado"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Peso:</span>{" "}
                      {pedido.weight ? `${pedido.weight} kg` : "Não informado"}
                    </p>
                    {pedido.order_id && (
                      <p className="text-sm">
                        <span className="font-medium">ID do Pedido:</span> {pedido.order_id}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Datas</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm">
                      <span className="font-medium">Data de Envio:</span>{" "}
                      {pedido.ship_date ? format(new Date(pedido.ship_date), "dd/MM/yyyy") : "Não definida"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Data de Cadastro:</span>{" "}
                      {format(new Date(pedido.created_at), "dd/MM/yyyy HH:mm")}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Última Atualização:</span>{" "}
                      {format(new Date(pedido.updated_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="delivery" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Endereço de Entrega</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{pedido.destination_address || "Não informado"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Prazo de Entrega</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        {prazoData ? format(new Date(prazoData), "dd/MM/yyyy") : "Não definido"}
                        {isPrazoPersonalizado && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Personalizado
                          </Badge>
                        )}
                      </span>
                    </div>
                    <div
                      className={`text-xs mt-2 ${
                        pedido.dias_restantes < 0
                          ? "text-red-600"
                          : pedido.dias_restantes === 0
                            ? "text-orange-600"
                            : "text-green-600"
                      }`}
                    >
                      {pedido.dias_restantes < 0
                        ? `${Math.abs(pedido.dias_restantes)} dias atrasado`
                        : pedido.dias_restantes === 0
                          ? "Entrega hoje"
                          : `${pedido.dias_restantes} dias restantes`}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Histórico de Status</h3>
                {loadingHistory ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-red-600" />
                    <span className="ml-2">Carregando histórico...</span>
                  </div>
                ) : statusHistory.length === 0 ? (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Nenhum histórico de status encontrado.</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="space-y-3">
                      {statusHistory.map((item) => (
                        <div key={item.id} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                              {item.notes && <p className="text-sm mt-1 text-gray-600">{item.notes}</p>}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(item.created_at || item.timestamp), "dd/MM/yyyy HH:mm")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end space-x-2">
            {pedido.customer_email ? (
              <Button variant="outline" onClick={handleTestEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Testar Email
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <Mail className="h-4 w-4 mr-2" />
                Email não cadastrado
              </Button>
            )}
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
