"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { Shipment } from "@/lib/types"

export function ShipmentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Shipment>>({
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
    customerEmail: "", // Garantir que este campo existe
    customerPhone: "", // Garantir que este campo existe
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos obrigatórios
      const requiredFields = [
        "trackingCode",
        "senderName",
        "recipientName",
        "recipientCpf",
        "originAddress",
        "destinationAddress",
        "productType",
        "weight",
        "shipDate",
        "status",
      ]

      const missingFields = requiredFields.filter((field) => !formData[field as keyof Shipment])

      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios não preenchidos: ${missingFields.join(", ")}`)
      }

      // Validar formato do código de rastreio
      const trackingCodeRegex = /^LOG-\d{8}-\d{4}$/
      if (!trackingCodeRegex.test(formData.trackingCode || "")) {
        throw new Error("Código de rastreio inválido. Use o formato: LOG-AAAAMMDD-XXXX")
      }

      // Validar CPF
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
      if (!cpfRegex.test(formData.recipientCpf || "")) {
        throw new Error("CPF inválido. Use o formato: 123.456.789-00")
      }

      // Validar email (se fornecido)
      if (formData.customerEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.customerEmail)) {
          throw new Error("Email inválido")
        }
      }

      // Validar peso
      const weight = Number(formData.weight)
      if (isNaN(weight) || weight <= 0) {
        throw new Error("Peso inválido")
      }

      // Enviar dados para a API
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          weight: Number(formData.weight),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao criar remessa")
      }

      toast({
        title: "Remessa criada com sucesso",
        description: `Código de rastreio: ${formData.trackingCode}`,
      })

      // Limpar formulário e redirecionar
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
        customerEmail: "",
        customerPhone: "",
      })

      router.push("/admin/pedidos")
    } catch (error) {
      console.error("Erro ao criar remessa:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar remessa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateTrackingCode = () => {
    const today = new Date()
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "")
    const random = Math.floor(1000 + Math.random() * 9000)
    const trackingCode = `LOG-${dateStr}-${random}`
    setFormData((prev) => ({ ...prev, trackingCode }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="trackingCode">Código de Rastreio</Label>
            <div className="flex mt-1">
              <Input
                id="trackingCode"
                name="trackingCode"
                value={formData.trackingCode}
                onChange={handleChange}
                placeholder="LOG-AAAAMMDD-XXXX"
                className="flex-grow"
              />
              <Button type="button" onClick={generateTrackingCode} className="ml-2">
                Gerar
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Formato: LOG-AAAAMMDD-XXXX</p>
          </div>

          <div>
            <Label htmlFor="senderName">Nome do Remetente</Label>
            <Input
              id="senderName"
              name="senderName"
              value={formData.senderName}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="originAddress">Endereço de Origem</Label>
            <Textarea
              id="originAddress"
              name="originAddress"
              value={formData.originAddress}
              onChange={handleChange}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="productType">Tipo de Produto</Label>
            <Input
              id="productType"
              name="productType"
              value={formData.productType}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.weight}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="shipDate">Data de Envio</Label>
            <Input
              id="shipDate"
              name="shipDate"
              type="date"
              value={formData.shipDate}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="recipientName">Nome do Destinatário</Label>
            <Input
              id="recipientName"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="recipientCpf">CPF do Destinatário</Label>
            <Input
              id="recipientCpf"
              name="recipientCpf"
              value={formData.recipientCpf}
              onChange={handleChange}
              placeholder="123.456.789-00"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="destinationAddress">Endereço de Destino</Label>
            <Textarea
              id="destinationAddress"
              name="destinationAddress"
              value={formData.destinationAddress}
              onChange={handleChange}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="customerEmail">Email do Cliente</Label>
            <Input
              id="customerEmail"
              name="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={handleChange}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email para envio de atualizações de status (opcional, mas recomendado)
            </p>
          </div>

          <div>
            <Label htmlFor="customerPhone">Telefone do Cliente</Label>
            <Input
              id="customerPhone"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
              placeholder="(11) 98765-4321"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Opcional</p>
          </div>

          <div>
            <Label htmlFor="orderId">ID do Pedido</Label>
            <Input
              id="orderId"
              name="orderId"
              value={formData.orderId || ""}
              onChange={handleChange}
              className="mt-1"
              placeholder="Opcional"
            />
            <p className="text-xs text-gray-500 mt-1">Referência externa (opcional)</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            "Criar Remessa"
          )}
        </Button>
      </div>
    </form>
  )
}
