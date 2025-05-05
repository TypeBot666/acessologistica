"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Edit, Loader2 } from "lucide-react"
import { ShipmentForm } from "@/components/shipment-form"
import type { Shipment } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ShipmentListProps {
  shipments: Shipment[]
  onUpdateShipment: (shipment: Shipment) => void
  onUpdateStatus: (trackingCode: string, status: string) => void
}

export function ShipmentList({ shipments, onUpdateShipment, onUpdateStatus }: ShipmentListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.recipientCpf.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment)
  }

  const handleUpdateShipment = (updatedShipment: Shipment) => {
    onUpdateShipment(updatedShipment)
    setEditingShipment(null)
  }

  const handleStatusChange = async (trackingCode: string, newStatus: string) => {
    setUpdatingStatus(trackingCode)
    try {
      await onUpdateStatus(trackingCode, newStatus)
    } finally {
      setUpdatingStatus(null)
    }
  }

  if (editingShipment) {
    return (
      <div>
        <ShipmentForm
          initialData={editingShipment}
          onAddShipment={handleUpdateShipment}
          isEditing={true}
          onCancel={() => setEditingShipment(null)}
        />
      </div>
    )
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Remessas Cadastradas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="relative flex w-full max-w-sm items-center">
            <Search className="absolute left-2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por código, nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {allStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredShipments.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Nenhuma remessa encontrada. Use o formulário para cadastrar uma nova remessa.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Remetente</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.trackingCode}>
                    <TableCell className="font-medium">{shipment.trackingCode}</TableCell>
                    <TableCell>{shipment.senderName}</TableCell>
                    <TableCell>{shipment.recipientName}</TableCell>
                    <TableCell>{shipment.shipDate}</TableCell>
                    <TableCell>
                      {updatingStatus === shipment.trackingCode ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Atualizando...
                        </div>
                      ) : (
                        <Select
                          value={shipment.status}
                          onValueChange={(value) => handleStatusChange(shipment.trackingCode, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(shipment)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
