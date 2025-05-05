"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

interface StatusDebugModalProps {
  open: boolean
  onClose: () => void
}

export function StatusDebugModal({ open, onClose }: StatusDebugModalProps) {
  const [email, setEmail] = useState("")
  const [trackingCode, setTrackingCode] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResponse(null)

    try {
      const res = await fetch("/api/send-status-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          trackingCode,
          recipientName,
          newStatus: status,
          updateDate: new Date().toLocaleString("pt-BR"),
        }),
      })

      const data = await res.json()
      setResponse(data)

      if (data.success) {
        toast({
          title: "Email enviado com sucesso!",
          description: `Email de atualização enviado para ${email}`,
        })
      } else {
        toast({
          title: "Erro ao enviar email",
          description: data.error || "Ocorreu um erro ao enviar o email",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      setResponse({ success: false, error: "Erro ao enviar a requisição" })
      toast({
        title: "Erro ao enviar email",
        description: "Ocorreu um erro ao enviar a requisição",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Testar Email de Atualização de Status</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Destinatário</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingCode">Código de Rastreio</Label>
              <Input
                id="trackingCode"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="LOG-12345678-1234"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Nome do Destinatário</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nome do Destinatário"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Ex: Em trânsito"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Email de Teste"}
            </Button>
          </DialogFooter>
        </form>

        {response && (
          <div className="mt-4 rounded-md border p-4">
            <h3 className="mb-2 font-medium">Resposta da API:</h3>
            <pre className="max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
