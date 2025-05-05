"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Shipment } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

interface ShipmentFormProps {
  onAddShipment: (shipment: Shipment) => void
  initialData?: Shipment
  isEditing?: boolean
  onCancel?: () => void
}

export function ShipmentForm({ onAddShipment, initialData, isEditing = false, onCancel }: ShipmentFormProps) {
  const { toast } = useToast()

  // Estado para todos os campos do formulário, incluindo o código de rastreio
  const [formData, setFormData] = useState({
    trackingCode: initialData?.trackingCode || "",
    senderName: initialData?.senderName || "",
    recipientName: initialData?.recipientName || "",
    recipientCpf: initialData?.recipientCpf || "",
    originAddress: initialData?.originAddress || "",
    destinationAddress: initialData?.destinationAddress || "",
    productType: initialData?.productType || "",
    weight: initialData?.weight || "",
    shipDate: initialData?.shipDate || new Date().toISOString().split("T")[0],
    status: initialData?.status || ("Objeto postado" as any),
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "")
    let formatted = digits

    if (digits.length > 3) {
      formatted = `${digits.substring(0, 3)}.${digits.substring(3)}`
    }
    if (digits.length > 6) {
      formatted = `${formatted.substring(0, 7)}.${digits.substring(6)}`
    }
    if (digits.length > 9) {
      formatted = `${formatted.substring(0, 11)}-${digits.substring(9, 11)}`
    }

    return formatted.substring(0, 14)
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value)
    setFormData((prev) => ({ ...prev, recipientCpf: formatted }))
  }

  const generateTrackingCode = () => {
    try {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const dateStr = `${year}${month}${day}`

      // Generate random 4-digit number
      const random = Math.floor(1000 + Math.random() * 9000)

      return `LOG-${dateStr}-${random}`
    } catch (error) {
      console.error("Erro ao gerar código de rastreio:", error)
      // Fallback para um código simples em caso de erro
      return `LOG-${Date.now()}`
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validar campos obrigatórios
      const requiredFields = [
        { key: "senderName", label: "Nome do Remetente" },
        { key: "recipientName", label: "Nome do Destinatário" },
        { key: "recipientCpf", label: "CPF do Destinatário" },
        { key: "originAddress", label: "Endereço de Origem" },
        { key: "destinationAddress", label: "Endereço de Destino" },
        { key: "productType", label: "Tipo de Produto" },
        { key: "weight", label: "Peso" },
        { key: "shipDate", label: "Data de Envio" },
      ]

      for (const field of requiredFields) {
        if (!formData[field.key as keyof typeof formData]) {
          toast({
            title: "Campo obrigatório",
            description: `O campo "${field.label}" é obrigatório.`,
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Se não for edição e não tiver código de rastreio, gerar um novo
      const finalData = { ...formData }
      if (!isEditing && !finalData.trackingCode) {
        finalData.trackingCode = generateTrackingCode()
      }

      console.log("Enviando dados do formulário:", finalData)
      await onAddShipment(finalData as Shipment)

      if (!isEditing) {
        // Reset form if not editing
        setFormData({
          trackingCode: "",
          senderName: "",
          recipientName: "",
          recipientCpf: "",
          originAddress: "",
          destinationAddress: "",
          productType: "",
          weight: "",
          shipDate: new Date().toISOString().split("T")[0],
          status: "Objeto postado",
        })
      }

      if (onCancel && isEditing) {
        onCancel()
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error)
    } finally {
      setIsSubmitting(false)
    }
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
        <CardTitle>{isEditing ? "Editar Remessa" : "Cadastrar Nova Remessa"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de código de rastreio (visível apenas para novos cadastros) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="trackingCode">Código de Rastreio (opcional)</Label>
              <Input
                id="trackingCode"
                name="trackingCode"
                value={formData.trackingCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, trackingCode: e.target.value.toUpperCase() }))}
                placeholder="Deixe em branco para gerar automaticamente"
              />
              <p className="text-xs text-gray-500">
                Se deixado em branco, um código será gerado automaticamente no formato LOG-AAAAMMDD-XXXX
              </p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="senderName">Nome do Remetente</Label>
              <Input id="senderName" name="senderName" value={formData.senderName} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientName">Nome do Destinatário</Label>
              <Input
                id="recipientName"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientCpf">CPF do Destinatário</Label>
              <Input
                id="recipientCpf"
                name="recipientCpf"
                value={formData.recipientCpf}
                onChange={handleCpfChange}
                placeholder="123.456.789-00"
                maxLength={14}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipDate">Data de Envio</Label>
              <Input
                id="shipDate"
                name="shipDate"
                type="date"
                value={formData.shipDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="originAddress">Endereço de Origem</Label>
              <Input
                id="originAddress"
                name="originAddress"
                value={formData.originAddress}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinationAddress">Endereço de Destino</Label>
              <Input
                id="destinationAddress"
                name="destinationAddress"
                value={formData.destinationAddress}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productType">Tipo de Produto</Label>
              <Select
                value={formData.productType}
                onValueChange={(value) => handleSelectChange("productType", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eletrônico">Eletrônico</SelectItem>
                  <SelectItem value="Vestuário">Vestuário</SelectItem>
                  <SelectItem value="Alimento">Alimento</SelectItem>
                  <SelectItem value="Documento">Documento</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.01"
                min="0"
                value={formData.weight}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status Inicial</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status inicial" />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            {isEditing && onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processando..." : isEditing ? "Atualizar Remessa" : "Cadastrar Remessa"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
